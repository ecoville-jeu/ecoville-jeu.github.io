import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import ArduinoHandler from './arduinoHandler.js';

// Importer les modules
import { AssetLoader } from './core/assetLoader.js';
import { PerformanceMonitor } from './core/performance.js';
import { clearCell, loadBuildingModels, placeBuilding } from './buildings.js';
import { gameState, gameGrid, initializeGameState } from './gameState.js';
import { setupUI, updateUI } from './ui.js';
import { EnvironmentManager } from './environment/environment.js';

// Variables
let scene, camera, renderer, controls;
let gridHelper, raycaster, mouse;
let selectedBuilding = null;
let isPlacingBuilding = false;
let hoverCell = null;
let hoverHighlight = null;
let gridCellHighlight;

// Autres variables
let arduinoHandler, assetLoader, performanceMonitor, environment;

// Initalisation du jeu
async function init() {
    console.log("Initialisation du jeu...");
    

    assetLoader = new AssetLoader();
    performanceMonitor = new PerformanceMonitor();
    window.performanceMonitor = performanceMonitor; 
    
    // Création de la scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Le ciel
    
    // Caméra
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(7, 7, 7);
    camera.lookAt(0, 0, 0);
    
    // Ajouter des ombres
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    initArduinoHandler();
    
    // Rend le "renderer" disponible globalement
    window.renderer = renderer;

    
    initializeGameState(scene);
    
    // Lumières
    setupLighting();
    
    // Initialisation de l'environment
    environment = new EnvironmentManager(scene, assetLoader);
    await environment.initialize();
    
    // Initialisation de la gride
    setupGrid();
    
    // Controles pour la caméra
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 10; 
    controls.maxPolarAngle = Math.PI / 2.2;
    
    // Truc pour la souris
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // écoute activement pour des événements de controls
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('click', onMouseClick, false);
    document.addEventListener('keydown', onKeyDown, false);
    
    // Chargement des modèles
    await loadBuildingModels(assetLoader);
    
    // Initialisation de l'interface
    setupUI(onBuildingSelected);
    updateUI();
    
    // Commence le jeu
    animate();
    
    console.log("Initialisation du jeu complétée");
}

function initArduinoHandler() {

    arduinoHandler = new ArduinoHandler(gameState);
    
    // Controles UI
    const connectButton = document.getElementById('connect-arduino');
    
    if (connectButton) {
        connectButton.addEventListener('click', async () => {
            if (!arduinoHandler.isConnected) {
                connectButton.disabled = true;
                connectButton.textContent = 'Connexion en cours...';
                
                const success = await arduinoHandler.connect();
                
                if (success) {
                    connectButton.textContent = 'Déconnecter l\'Arduino';
                } else {
                    connectButton.textContent = 'Connecter  l\'Arduino';
                }
                
                connectButton.disabled = false;
            } else {
                connectButton.disabled = true;
                connectButton.textContent = 'Déconnexion en cours...';
                await arduinoHandler.disconnect();
                connectButton.textContent = 'Connecter l\'Arduino';
                connectButton.disabled = false;
            }
        });
    }
    
    // Vérifie si le navigateur web support le site web
    if (!navigator.serial) {
        console.error('Le API Web Serial n\'est pas supportée dans ce navigateur web');
        const statusElement = document.getElementById('arduino-status');
        if (statusElement) {
            statusElement.textContent = 'Navigateur web incompatible';
        }
        if (connectButton) {
            connectButton.disabled = true;
        }
    }
}


function setupLighting() {
    // Illumine a peu pres au complet
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Direction des ombres
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 20, 15);
    directionalLight.castShadow = true;
    
    // optimise les ombres
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    
    scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x47A025, 0.6);
    scene.add(hemisphereLight);
}

function setupGrid() {
    
    gridHelper = new THREE.GridHelper(5, 5);
    scene.add(gridHelper);
    
    // Souligne la case où la souris se trouve
    const highlightGeometry = new THREE.PlaneGeometry(1, 1);
    const highlightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFFF00, 
        transparent: true, 
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    gridCellHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    gridCellHighlight.rotation.x = -Math.PI / 2; 
    gridCellHighlight.position.y = 0.01;
    gridCellHighlight.visible = false;
    scene.add(gridCellHighlight);
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    // Montrer seulement le "souligne" lorsque le joeur veut placer un immeuble
    if (!isPlacingBuilding) {
        gridCellHighlight.visible = false;
        return;
    }
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObject(environment.terrain.terrainMesh);
    
    if (intersects.length > 0) {

        const point = intersects[0].point;
        const x = Math.floor(point.x + 2.5);
        const z = Math.floor(point.z + 2.5);
        
        if (x >= 0 && x < 5 && z >= 0 && z < 5) {
            hoverCell = { x, z };
            gridCellHighlight.position.set(x + 0.5 - 2.5, 0.01, z + 0.5 - 2.5);
            gridCellHighlight.visible = true;
            
            if (gameGrid[z][x] === null) {
                gridCellHighlight.material.color.set(0x00FF00); // Vert
            } else {
                gridCellHighlight.material.color.set(0xFF0000); // Rouge
            }
        } else {
            gridCellHighlight.visible = false;
        }
    } else {
        gridCellHighlight.visible = false;
    }
}


function onMouseClick() {
    if (!hoverCell) return;
    
    const { x, z } = hoverCell;
    if (x < 0 || x >= 5 || z < 0 || z >= 5) return;
    
    if (isPlacingBuilding && selectedBuilding && gridCellHighlight.visible) {
            if (gameGrid[z][x] === null) {
                placeBuilding(x, z, selectedBuilding);
            } 
            // Enlève si il a un immeuble dans la case
            else if (gameGrid[z][x] !== null) {
            clearCell(x, z);
        }
        }
}


function onKeyDown(event) {
    // Annule le placement des immeubles en appuyant "ESC"
    if (event.key === 'Escape' && isPlacingBuilding) {
        isPlacingBuilding = false;
        selectedBuilding = null;
        gridCellHighlight.visible = false;
        
        document.querySelectorAll('#building-selector button').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
}


function onBuildingSelected(buildingType) {
    selectedBuilding = buildingType;
    isPlacingBuilding = true;
}

function animate() {
    requestAnimationFrame(animate);
    
    // Mise à jour des controls afin d'avoir un movement plus fluide
    controls.update();
    
    
    // Monitor la performance
    performanceMonitor.update();
    
    // Produit la scène
    renderer.render(scene, camera);
}

// Commencer le jeu lorsqu'on ouvre la page
window.addEventListener('load', init);
