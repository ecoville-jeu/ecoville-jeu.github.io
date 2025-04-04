// js/core/performance.js
export class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.frames = 0;
        this.startTime = performance.now();
        this.lastUpdate = this.startTime;
        this.frameTimes = [];
        this.DEBUG = false; // Mettre ceci vrai pour faire le debug
    }
    
    update() {
        this.frames++;
        const now = performance.now();
        const elapsed = now - this.lastUpdate;
        
        // Fait une mise à jour du "FPS" à chaque seconde
        if (elapsed >= 1000) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.frames = 0;
            this.lastUpdate = now;
            
            if (this.DEBUG) {
                console.log(`FPS: ${this.fps}`);
            }
        }
        
        // Track le temps de chaque "image" pour l'analyser
        const frameTime = now - this.lastUpdate;
        this.frameTimes.push(frameTime);
        
        // Limite l'historique du trackage
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
    }
    
    getAverageFrameTime() {
        if (this.frameTimes.length === 0) return 0;
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        return sum / this.frameTimes.length;
    }
    
    getFPS() {
        return this.fps;
    }
}
