import * as THREE from 'three';
import { gameState, gameGrid, updateGameState } from './gameState.js';
import { updateUI } from './ui.js';

// Les différents type d'immeubles et leur valeurs
export const buildingTypes = {
    residentiel: { 
        name: "Complexe Résidentiel",
        cost: 10000, 
        populationEffect: 100, 
        pollutionEffect: 10, 
        energyEffect: -10, 
        incomeEffect: 0,
        happinessEffect: 0
    },
    maison: { 
        name: "Maison",
        cost: 1000, 
        populationEffect: 5, 
        pollutionEffect: 2, 
        energyEffect: -2, 
        incomeEffect: 100,
        happinessEffect: 10
    },
    eolienne: { 
        name: "Éolienne",
        cost: 20000, 
        populationEffect: 0, 
        pollutionEffect: 0, 
        energyEffect: 5, 
        incomeEffect: 5000,
        happinessEffect: -5
    },
    arbre: { 
        name: "Arbre",
        cost: 5000, 
        populationEffect: 0, 
        pollutionEffect: -10, 
        energyEffect: 0, 
        incomeEffect: 500,
        happinessEffect: 15
    },
    gaz: { 
        name: "Usine à Gaz naturel",
        cost: 15000, 
        populationEffect: 0, 
        pollutionEffect: 20, 
        energyEffect: 5, 
        incomeEffect: 1000,
        happinessEffect: 5
    },
    usine: { 
        name: "Usine",
        cost: 10000, 
        populationEffect: 0, 
        pollutionEffect: 30, 
        energyEffect: 0, 
        incomeEffect: 2000,
        happinessEffect: -10
    }
};

// Modèles cachées
let buildingModels = {};

// Charger tout les modèles d'immeubles
export async function loadBuildingModels(assetLoader) {
    console.log("Chargement des modèles...");
    
    const modelPromises = [];
    
    for (const type in buildingTypes) {
        const promise = assetLoader.loadModel(`models/buildings/${type}.glb`)
            .then(model => {
                const scaleFactor = calculateScaleFactor(model);
                model.scale.set(scaleFactor, scaleFactor, scaleFactor);
                console.log(`Facteur de grandeur: ${scaleFactor}`);
                buildingModels[type] = model;
                console.log(`Chargement du modèle pour ${type}`);
            })
            .catch(error => {
                console.warn(`Chargement échouée du modèle de ${type}, création de modèle temporaire`, error);
                buildingModels[type] = createFallbackBuilding(type);
            });
        
        modelPromises.push(promise);
    }

    
    // Attend que le chargement de tout les modèles soit complété
    await Promise.all(modelPromises);
    console.log("Tout les immeubles ont été chargés");
}

// Cette fonction permet de trouver le facteur pour aggrandir ou 
// rétrécir le modèle afin qu'il puisse rentrer dans la case virtuel.

function calculateScaleFactor(model) {
    const boundingBox = new THREE.Box3().setFromObject(model);
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    const targetSize = 0.95;
    const scaleFactor = targetSize / maxDimension;
    
    return scaleFactor;
  }

// Créer un modèle temporaire si le modèle n'existe pas (cube simple)
function createFallbackBuilding(buildingType) {
    const group = new THREE.Group();
    

    const geometry = new THREE.BoxGeometry(0.8, 2.4, 0.8);
    const material = new THREE.MeshLambertMaterial({ color: getBuildingColor(buildingType) });
    const cube = new THREE.Mesh(geometry, material);
    
    cube.position.y = 0.4;
    cube.castShadow = true;
    cube.receiveShadow = true;
    
    group.add(cube);
    return group;
}

// Couleur du modèle temporaire dépendant du type d'immeuble
function getBuildingColor(buildingType) {
    switch (buildingType) {
        case 'residentiel': return 0x4169E1;  // Bleu
        case 'maison': return 0x8B4513;      // Brun
        case 'arbre': return 0x228B22;         // Vert
        case 'gas': return 0xFFD700;        // Jaune
        case 'eolienne': return 0x696969;         // Gris
        default: return 0xFFFFFF;             // Blanc
    }
}

// Permet de placer l'immeuble dans la position désiré
export function placeBuilding(x, z, buildingType) {

    if (!buildingTypes[buildingType]) {
        console.error(`Type d'immeuble invalide: ${buildingType}`);
        return false;
    }
    
    // Vérifier si les coordonées sont valides
    if (x < 0 || x >= 5 || z < 0 || z >= 5) {
        console.error(`Coordonnées invalides: ${x}, ${z}`);
        return false;
    }
    
    // Vérifier que la case est pas déjà occupée
    if (gameGrid[z][x] !== null) {
        console.error(`Case à ${x}, ${z} est déjà occupé`);
        return false;
    }
    
    const buildingData = buildingTypes[buildingType];
    
    // Verifier qu'il a assez de budget
    if (gameState.budget < buildingData.cost) {
        console.error(`Pas assez de budget pour placer ${buildingType}`);
        return false;
    }
    
    let buildingInstance;
    
    if (buildingModels[buildingType]) {
        buildingInstance = buildingModels[buildingType].clone();
    } else {
        console.warn(`Aucun modèle trouvé pour ${buildingType}, utilisation du modèle temporaire`);
        buildingInstance = createFallbackBuilding(buildingType);
    }
    
    const spacing = 1.2;
    buildingInstance.position.set( (x - 2), 0, (z - 2));
    
    // Ajoute le bouton à la scène
    gameState.scene.add(buildingInstance);
    
    // Sauvegarde l'immeuble dans la gride
    gameGrid[z][x] = {
        type: buildingType,
        instance: buildingInstance,
        data: { ...buildingData }
    };
    
    // Ajuste les statistiques affectés par l'immeuble
    updateGameState({
        budget: -buildingData.cost,
        population: buildingData.populationEffect,
        pollution: buildingData.pollutionEffect,
        energy: buildingData.energyEffect,
        income: buildingData.incomeEffect,
        happiness: buildingData.happinessEffect
    });
    

    updateUI();
    
    return true;
}

// Permet d'enlever un immeuble d'une case
export function clearCell(x, z) {

    if (!gameGrid[z][x]) {
        console.warn('clearCell: Aucun immeuble trouvé à ces coordonnées', x, z);
        return false;
    }

    try {
        const building = gameGrid[z][x];
        
        if (!gameState.scene) {
            console.error('clearCell: la scène n\'est pas défini');
            return false;
        }
        
        gameState.scene.remove(building.instance);
        
        // Permet de donner un remboursement (50% dans ce cas-ci)
        const refundAmount = Math.floor(building.data.cost * 0.5);
        
        // Enlève les impacts que l'immeuble avait sur la ville
        updateGameState({
            budget: refundAmount,
            population: -building.data.populationEffect,
            pollution: -building.data.pollutionEffect,
            energy: -building.data.energyEffect,
            income: -building.data.incomeEffect,
            happiness: -building.data.happinessEffect
        });
        
        // Vide la case
        gameGrid[z][x] = null;
        
        updateUI();
        
        return true;
    } catch (error) {
        console.error('Erreur en enlevant l\'immeuble:', error);
        return false;
    }
}