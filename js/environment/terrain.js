import * as THREE from 'three';

export class Terrain {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.terrainSize = 100; 
        this.terrainMesh = null;
        this.gridHighlight = null;
    }
    
    async create() {
        console.log("Création du terrain...");
        

        const terrainGeometry = new THREE.PlaneGeometry(this.terrainSize, this.terrainSize, 64, 64);
        
        const grassTexture = await this.assetLoader.loadTexture('textures/terrain/grass.jpg', {
            repeat: { x: 20, y: 20 },
            anisotropy: 4
        });
        
        let grassNormalMap, grassRoughnessMap;
        
        try {
            grassNormalMap = await this.assetLoader.loadTexture('textures/terrain/grass_normal.jpg', {
                repeat: { x: 20, y: 20 }
            });
        } catch (error) {
            console.warn("Chargement de la map échouée, map plus simple utilisée");
        }
        
        
        // Créer le matérial du terrain en utilisant les textures disponibles
        let terrainMaterial;
        
        if (grassNormalMap && grassRoughnessMap) {
            terrainMaterial = new THREE.MeshStandardMaterial({
                map: grassTexture,
                normalMap: grassNormalMap,
                roughnessMap: grassRoughnessMap,
                roughness: 0.8,
                metalness: 0.1
            });
        } else if (grassNormalMap) {
            terrainMaterial = new THREE.MeshStandardMaterial({
                map: grassTexture,
                normalMap: grassNormalMap,
                roughness: 0.8,
                metalness: 0.1
            });
        } else {
            terrainMaterial = new THREE.MeshLambertMaterial({
                map: grassTexture
            });
        }
        
        this.terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
        this.terrainMesh.rotation.x = -Math.PI / 2; 
        this.terrainMesh.position.y = -0.01; 
        this.terrainMesh.receiveShadow = true;
        
        this.scene.add(this.terrainMesh);
        
        this.createBuildableAreaHighlight();
        
        console.log("Terrain créé");
        return this;
    }
    
    createBuildableAreaHighlight() {
        const gridHighlightGeometry = new THREE.PlaneGeometry(5, 5);
        const gridHighlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        this.gridHighlight = new THREE.Mesh(gridHighlightGeometry, gridHighlightMaterial);
        this.gridHighlight.rotation.x = -Math.PI / 2;
        this.gridHighlight.position.y = 0.001; 
        
        this.scene.add(this.gridHighlight);
    }
    
    update(deltaTime) {
    }
}
