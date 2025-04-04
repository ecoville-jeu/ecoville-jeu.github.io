// Les statistiques du jeu
export const gameState = {
    budget: 100000,
    pollution: 0,
    population: 0,
    happiness: 100,
    energy: 0,
    income: 0,
    scene: null,
    turnCount: 0,
    gameOver: false,
    gameWon: false
};

// Maximum des statistiques
export const thresholds = {
    pollution: 100,  
    minPopulation: 500, 
    minHappiness: 70    
};


// Grid de 5x5
export const gameGrid = [
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null]
];

// Initialisation du jeu
export function initializeGameState(scene) {
    gameState.scene = scene;
    resetGameState();
}

// réinitialise les statistiques du jeu
export function resetGameState() {
    gameState.budget = 100000;
    gameState.pollution = 0;
    gameState.population = 0;
    gameState.happiness = 100;
    gameState.energy = 0;
    gameState.income = 0;
    gameState.turnCount = 0;
    gameState.gameOver = false;
    gameState.gameWon = false;
    
    // Vide la gride
    for (let z = 0; z < 5; z++) {
        for (let x = 0; x < 5; x++) {
            if (gameGrid[z][x] !== null) {
                gameState.scene.remove(gameGrid[z][x].instance);
                gameGrid[z][x] = null;
            }
        }
    }
}

// Faiit une mise à jour des changements
export function updateGameState(changes = {}) {

    if (changes.budget) gameState.budget += changes.budget;
    if (changes.population) gameState.population += changes.population;
    if (changes.pollution) gameState.pollution += changes.pollution;
    if (changes.energy) gameState.energy += changes.energy;
    if (changes.income) gameState.income += changes.income;
    if (changes.happiness) gameState.happiness += changes.happiness;
    
    gameState.happiness = Math.min(100, gameState.happiness);
    
    gameState.budget = Math.max(0, gameState.budget);
    gameState.pollution = Math.max(0, gameState.pollution);
    gameState.population = Math.max(0, gameState.population);
    
    checkGameEndConditions();
}


export function endTurn() {
    updateGameState({ budget: gameState.income });
    
    gameState.turnCount++;
    
    checkGameEndConditions();
}

// Vérifier les conditions du jeu à la fin
function checkGameEndConditions() {

    if (gameState.pollution >= thresholds.pollution) {
        gameState.gameOver = true;
        gameState.gameWon = false;
        console.log("Fin: Pollution trop élevé!");
        showGameEndMessage(false, "La polution est trop élevée pour être stable!");
        return;
    }
    
    if (gameState.budget <= 0 && gameState.income <= 0) {
        gameState.gameOver = true;
        gameState.gameWon = false;
        console.log("Fin: Votre ville a plus d'argent!");
        showGameEndMessage(false, "Votre ville a plus d'argent!");
        return;
    }
    
    if (gameState.population >= thresholds.minPopulation &&
        gameState.energy >= 0 &&
        gameState.happiness >= thresholds.minHappiness) {
        gameState.gameOver = true;
        gameState.gameWon = true;
        console.log("Victoire!");
        showGameEndMessage(true, "Votre ville est soutenable!");
    }
}

// Montrer la fin du jeu
function showGameEndMessage(won, message) {
    const gameEndMessage = document.createElement('div');
    gameEndMessage.style.position = 'fixed';
    gameEndMessage.style.top = '50%';
    gameEndMessage.style.left = '50%';
    gameEndMessage.style.transform = 'translate(-50%, -50%)';
    gameEndMessage.style.background = won ? 'rgba(0, 128, 0, 0.9)' : 'rgba(139, 0, 0, 0.9)';
    gameEndMessage.style.padding = '20px';
    gameEndMessage.style.borderRadius = '10px';
    gameEndMessage.style.color = 'white';
    gameEndMessage.style.textAlign = 'center';
    gameEndMessage.style.zIndex = '100';
    gameEndMessage.style.minWidth = '300px';
    
    gameEndMessage.innerHTML = `
        <h2>${won ? 'Victoire!' : 'Fin'}</h2>
        <p>${message}</p>
        <p>Statistiques finals:</p>
        <p>Population: ${gameState.population}</p>
        <p>Budget: $${gameState.budget}</p>
        <p>Pollution: ${gameState.pollution}</p>
        <p>Bonheur de la population: ${gameState.happiness}</p>
        <button id="restart-game">Commencer un nouveau jeu</button>
    `;
    
    document.body.appendChild(gameEndMessage);
    
    document.getElementById('restart-game').addEventListener('click', () => {
        resetGameState();
        document.body.removeChild(gameEndMessage);
        window.location.reload();
    });
}
