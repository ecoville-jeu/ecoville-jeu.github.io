// Ce code permet de charger les modèles sur le site web

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AssetLoader {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.gltfLoader = new GLTFLoader();
        this.loadingManager = new THREE.LoadingManager();
        this.textureCache = new Map();
        this.modelCache = new Map();
        
        this.loadingManager.onProgress = (url, loaded, total) => {
            const progress = (loaded / total * 100).toFixed(0);
            console.log(`Chargement de: ${progress}% (${url})`);
        };
    }
    
    // Pour les textures
    async loadTexture(path, options = {}) {
        // Si une texture image a été "cachée" utiliser cette texture
        if (this.textureCache.has(path)) {
            return this.textureCache.get(path);
        }
        
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                path,
                (texture) => {
                    // Appliquer les options de texture
                    if (options.repeat) {
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(options.repeat.x || 1, options.repeat.y || 1);
                    }
                    
                    if (options.anisotropy) {
                        const renderer = this.getRenderer();
                        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
                        texture.anisotropy = Math.min(options.anisotropy, maxAnisotropy);
                    }
                    
                    texture.needsUpdate = true;
                    
                    // Cache la texture
                    this.textureCache.set(path, texture);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error(`Erreur du chargement de texture ${path}:`, error);
                    reject(error);
                }
            );
        });
    }
    

    // Pour les modèles
    async loadModel(path) {
        // Retourner un modèle "cachée" si disponible
        if (this.modelCache.has(path)) {
            return this.modelCache.get(path).clone();
        }
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltf) => {

                    this.optimizeModel(gltf.scene);
                    
                    // Cacher le modèle
                    this.modelCache.set(path, gltf.scene);
                    
                    resolve(gltf.scene.clone());
                },
                undefined,
                (error) => {
                    console.error(`Erreur de chargement du modèle ${path}:`, error);
                    reject(error);
                }
            );
        });
    }
    

    // Permet d'optimiser les modèles
    optimizeModel(model) {
        model.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                
                if (node.geometry) {
                    node.geometry.computeVertexNormals();
                }
                
                if (node.material) {
                    node.material.side = THREE.FrontSide;
                    
                    if (!node.material.map) {
                        node.material.needsUpdate = false;
                    }
                }
            }
        });
    }
    
    getRenderer() {
        if (window.renderer) return window.renderer;
        
        const tempRenderer = new THREE.WebGLRenderer();
        return tempRenderer;
    }
    
    clearCache() {
        // Disposs les textures
        this.textureCache.forEach(texture => {
            texture.dispose();
        });
        this.textureCache.clear();
        
        // Dispose les modèles
        this.modelCache.clear();
    }
}
