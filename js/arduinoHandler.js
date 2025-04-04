import { placeBuilding, clearCell } from "./buildings.js";
import { gameGrid } from './gameState.js';

// Ce code gère la connexion avec l'Arduino

class ArduinoHandler { 
    constructor(gameState) {
        this.gameState = gameState;
        this.port = null;
        this.reader = null;
        this.isConnected = false;
        this.buffer = '';
        
        // Les résistances des immeubles avec une tolérance (5-10%)
        this.buildingResistances = {
            residentiel: { value: 20, minValue: 19, maxValue: 21 },
            maison: { value: 40, minValue: 38, maxValue: 42 },
            eolienne: { value: 300, minValue: 285, maxValue: 315 },
            arbre: { value: 178, minValue: 170, maxValue: 190 },
            gaz: { value: 690, minValue: 655, maxValue: 725 },
            // usine: { value: 508, minValue: 500, maxValue: 520 }
        };
    }

    async connect() {
        try {
            // Fait un requête pour un port et ouvre une connexion
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });
            this.isConnected = true;
            
            // Fait une mise à jour de l'UI
            this.updateConnectionStatus('Connexion établie');
            
            this.startReading();
            return true;
        } catch (error) {
            console.error('Connexion échouée avec l\'Arduino:', error);
            this.updateConnectionStatus('Connexion échouée');
            return false;
        }
    }

    async disconnect() {
        if (this.reader) {
            await this.reader.cancel();
            this.reader = null;
        }
        
        if (this.port) {
            await this.port.close();
            this.port = null;
        }
        
        this.isConnected = false;
        this.updateConnectionStatus('Déconnexion');
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('arduino-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    // Converti les numéro de cases (0-24) en coordonnées de la gride
    convertGridPosition(cellNumber) {
        if (cellNumber < 0 || cellNumber > 24) {
            console.error('Numéro de cellule invalide:', cellNumber);
            return null;
        }
        
        const row = Math.floor(cellNumber / 5);
        const col = cellNumber % 5;
        return { x: col, z: 4 - row };  // z inversée car la plateau lis du bas vers le haut
    }

    // Identifie les immeubles basés sur leur résistance
    identifyBuildingType(resistance) {
        for (const [type, data] of Object.entries(this.buildingResistances)) {
            if (resistance >= data.minValue && resistance <= data.maxValue) {
                return type;
            }
        }
        console.warn(`valeur de résistance inconnue: ${resistance}`);
        return null;
    }

    // Processus de lecture
    processInput(input) {
        const parts = input.trim().split(',');
        if (parts.length !== 2) {
            console.error('Format Arduino invalide:', input);
            return;
        }
        
        const cellNumber = parseInt(parts[0], 10);
        const resistance = parseFloat(parts[1]);
        
        if (isNaN(cellNumber) || isNaN(resistance)) {
            console.error('Format Arduino invalide:', input);
            return;
        }
        
        const position = this.convertGridPosition(cellNumber);
        if (!position) return;
        
        if (resistance === 0) {
            console.log(`Celulle vide à ${cellNumber} (${position.x},${position.z})`);
            clearCell(position.x, position.z);
            return;
        }

        const buildingType = this.identifyBuildingType(resistance);
        if (!buildingType) return;
        
        console.log(`Immeuble de type ${buildingType} placée à ${cellNumber} (${position.x},${position.z}) avec résistance de ${resistance}`);
        
        placeBuilding(position.x, position.z, buildingType);
    }

    // Permet de lire les données
    async startReading() {
        while (this.port && this.isConnected) {
            try {
                this.reader = this.port.readable.getReader();
                
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    
                    // Decode the received bytes and add to buffer
                    this.buffer += new TextDecoder().decode(value);
                    
                    // Process complete lines
                    const lines = this.buffer.split('\n');
                    if (lines.length > 1) {
                        // Keep the last potentially incomplete line in the buffer
                        this.buffer = lines.pop();
                        
                        // Process all complete lines
                        for (const line of lines) {
                            if (line.trim()) {
                                this.processInput(line);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur de lecture de l\'Arduino:', error);
                this.updateConnectionStatus('Connexion échouée');
            } finally {
                if (this.reader) {
                    this.reader.releaseLock();
                }
            }
        }
    }
}

export default ArduinoHandler;
