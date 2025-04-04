import * as THREE from 'three';

export class VegetationSystem {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.treeModels = [];
        this.trees = [];
        this.grassInstances = null;
        this.updateTime = 0;
    }
    
    async initialize() {
        console.log("Initialisation du système vegetale...");
        
        // Charge les modèles des arbres
        await this.loadTreeModels();
        
        // Place les arbres autour de la ville
        this.placeTreesAroundGrid();
        
        
        console.log("Végétation initalisée");
        return this;
    }
    
    async loadTreeModels() {
        // Les arbres à placer
        const treeTypes = [
            { name: 'pine', weight: 0.4 },
            { name: 'oak', weight: 0.3 },
            { name: 'bush', weight: 0.3 }
        ];
        
        for (const treeType of treeTypes) {
            try {
                const model = await this.assetLoader.loadModel(`models/environment/${treeType.name}.glb`);
                
                this.treeModels.push({
                    model: model,
                    weight: treeType.weight
                });
                
                console.log(`Chargement arbre: ${treeType.name}`);
            } catch (error) {
                console.warn(`Erreur de chargement d'arbre: ${treeType.name}`, error);
                
                // Creer des arbres temporaires
                const fallbackTree = this.createFallbackTree(treeType.name);
                this.treeModels.push({
                    model: fallbackTree,
                    weight: treeType.weight
                });
            }
        }
        
        // Utiliser les arbres temporaires
        if (this.treeModels.length === 0) {
            console.warn("Aucun modèle d'arbre trouvé, utilisation de modèle temporaire");
            const fallbackTree = this.createFallbackTree('default');
            this.treeModels.push({
                model: fallbackTree,
                weight: 1.0
            });
        }
    }
    
    createFallbackTree(type) {
        const treeGroup = new THREE.Group();
        
        if (type === 'pine') {
            // Tronc
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8),
                new THREE.MeshLambertMaterial({ color: 0x8B4513 })
            );
            trunk.position.y = 0.4;
            trunk.castShadow = true;
            treeGroup.add(trunk);
            
            // Pin
            for (let i = 0; i < 3; i++) {
                const foliageHeight = 0.7 - (i * 0.15);
                const foliageRadius = 0.5 - (i * 0.1);
                const foliage = new THREE.Mesh(
                    new THREE.ConeGeometry(foliageRadius, foliageHeight, 8),
                    new THREE.MeshLambertMaterial({ color: 0x2D4F2D })
                );
                foliage.position.y = 0.8 + (i * 0.5);
                foliage.castShadow = true;
                treeGroup.add(foliage);
            }
        } else if (type === 'bush') {
            // petit tronc
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.07, 0.3, 8),
                new THREE.MeshLambertMaterial({ color: 0x8B4513 })
            );
            trunk.position.y = 0.15;
            trunk.castShadow = true;
            treeGroup.add(trunk);
            
            // feuilles
            const foliage = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 8, 6),
                new THREE.MeshLambertMaterial({ color: 0x3A5F0B })
            );
            foliage.position.y = 0.5;
            foliage.castShadow = true;
            treeGroup.add(foliage);
        } else {
            // arbre 2
            // tronc
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8),
                new THREE.MeshLambertMaterial({ color: 0x8B4513 })
            );
            trunk.position.y = 0.4;
            trunk.castShadow = true;
            treeGroup.add(trunk);
            
            // feuilles
            const foliage = new THREE.Mesh(
                new THREE.SphereGeometry(0.6, 8, 6),
                new THREE.MeshLambertMaterial({ color: 0x3A5F0B })
            );
            foliage.position.y = 1.1;
            foliage.castShadow = true;
            treeGroup.add(foliage);
        }
        
        return treeGroup;
    }
    
    placeTreesAroundGrid() {
        // Nombre d'arbres à placer
        const treeCount = 1000;
        
        // Limite de l'endroit à placer les arbres
        const innerRadius = 3.5; // distance de la ville et des arbres
        const outerRadius = 20;  // distance maximale de la ville et des arbres
        
        for (let i = 0; i < treeCount; i++) {

            const treeModel = this.getWeightedRandomTreeModel();
            
            const tree = treeModel.clone();
            
            const angle = Math.random() * Math.PI * 2;
            const distance = innerRadius + Math.random() * (outerRadius - innerRadius);
            
            const x = Math.sin(angle) * distance;
            const z = Math.cos(angle) * distance;
            
            const scale = 0.1;
            tree.scale.set(scale, scale, scale);
            tree.rotation.y = Math.random() * Math.PI * 2;
            
            tree.position.set(x, 0, z);
            
            tree.traverse(object => {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                    
                    object.matrixAutoUpdate = false;
                    object.updateMatrix();
                }
            });
            
            this.scene.add(tree);
            this.trees.push(tree);
        }
        
        console.log(`Nombre d'arbres placés: ${treeCount}`);
    }
    
    getWeightedRandomTreeModel() {
        const totalWeight = this.treeModels.reduce((sum, tree) => sum + tree.weight, 0);
        
        let random = Math.random() * totalWeight;
        
        for (const tree of this.treeModels) {
            random -= tree.weight;
            if (random <= 0) {
                return tree.model;
            }
        }
        
        return this.treeModels[0].model;
    }
    
    
    update(deltaTime) {
  
    }
}
