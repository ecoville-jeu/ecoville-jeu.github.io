import * as THREE from 'three';
import { Terrain } from './terrain.js';
import { VegetationSystem } from './vegetation.js';

export class EnvironmentManager {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.terrain = null;
        this.vegetation = null;
        this.environmentReady = false;
        
        // Paramètre environementale
        this.settings = {
            fogEnabled: true,
            fogColor: 0xC6E2FF,
            fogNear: 5,
            fogFar: 30
        };
    }
    
    async initialize() {
        console.log("Initialisation de l'environnement...");
        
        // Terrain
        this.terrain = new Terrain(this.scene, this.assetLoader);
        await this.terrain.create();
        
        // vegetation (les arbres)
        this.vegetation = new VegetationSystem(this.scene, this.assetLoader);
        await this.vegetation.initialize();
        
        // Ajoute de la buée afin de ne pas voir les bords
        if (this.settings.fogEnabled) {
            this.scene.fog = new THREE.Fog(
                this.settings.fogColor,
                this.settings.fogNear,
                this.settings.fogFar
            );
        }
        
        this.environmentReady = true;
        console.log("Initalisation de l'environnment complétée");
        return this;
    }
    
    update(deltaTime) {
        if (this.terrain) {
            this.terrain.update(deltaTime);
        }
        
        if (this.vegetation) {
            this.vegetation.update(deltaTime);
        }
    }
}
