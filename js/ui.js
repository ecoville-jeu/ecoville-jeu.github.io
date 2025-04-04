import { gameState, gameGrid, endTurn, thresholds } from './gameState.js';
import { buildingTypes } from './buildings.js';

// Interface
export function setupUI(onBuildingSelected) {
    // Initialisation des boutons des immeubles
    const buildingSelector = document.getElementById('building-selector');
    
    buildingSelector.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        
        const buildingType = button.getAttribute('data-type');
        if (!buildingType) return;
        
        // Enlever la selection de tout les boutons
        document.querySelectorAll('#building-selector button').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        button.classList.add('selected');
        
        onBuildingSelected(buildingType);
    });
    
    // Setup tooltips for building buttons
    setupTooltips();
    
    // Ajouter un bouton pour finir le jeu (fonctionne pas présentement)
    // const endTurnButton = document.createElement('button');
    // endTurnButton.textContent = 'End Turn';
    // endTurnButton.style.background = '#FF9800';
    // endTurnButton.addEventListener('click', () => {
    //     endTurn();
    //     updateUI();
    // });
    // buildingSelector.appendChild(endTurnButton);
}


// Créer des boites d'information additionnelles sur les immeubles lorsqu'on mets la souris sur les boutons
function setupTooltips() {
    const buttons = document.querySelectorAll('#building-selector button');
    
    buttons.forEach(button => {
        const buildingType = button.getAttribute('data-type');
        if (!buildingType || !buildingTypes[buildingType]) return;
        
        const building = buildingTypes[buildingType];
        
        const tooltipContent = `
            <strong>${building.name}</strong><br>
            Coût: $${building.cost}<br>
            ${building.populationEffect ? `Population: ${formatEffect(building.populationEffect)}<br>` : ''}
            ${building.pollutionEffect ? `Pollution: ${formatEffect(building.pollutionEffect)}<br>` : ''}
            ${building.energyEffect ? `Énergie: ${formatEffect(building.energyEffect)}<br>` : ''}
            ${building.incomeEffect ? `Revenue: ${formatEffect(building.incomeEffect)}/turn<br>` : ''}
            ${building.happinessEffect ? `Bonheur générale: ${formatEffect(building.happinessEffect)}<br>` : ''}
        `;
        
    
        button.addEventListener('mouseover', (event) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.innerHTML = tooltipContent;
            document.body.appendChild(tooltip);
            
            positionTooltip(tooltip, event);
            
            button.tooltip = tooltip;
        });
        
        // fait une mise à jour de la position lors d'un mouvement de la souris
        button.addEventListener('mousemove', (event) => {
            if (button.tooltip) {
                positionTooltip(button.tooltip, event);
            }
        });
        
        button.addEventListener('mouseout', () => {
            if (button.tooltip) {
                document.body.removeChild(button.tooltip);
                button.tooltip = null;
            }
        });
    });
}

function positionTooltip(tooltip, event) {
    const gap = 15;
    tooltip.style.left = `${event.clientX + gap}px`;
    tooltip.style.top = `${event.clientY + gap}px`;
    
    const rect = tooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        tooltip.style.left = `${event.clientX - rect.width - gap}px`;
    }
    if (rect.bottom > window.innerHeight) {
        tooltip.style.top = `${event.clientY - rect.height - gap}px`;
    }
}

function formatEffect(value) {
    return value > 0 ? `+${value}` : value;
}

// Met à jour tout les interfaces
export function updateUI() {
    // Met à jour les statistiques
    document.getElementById('budget').textContent = `$${gameState.budget}`;
    document.getElementById('pollution').textContent = `${gameState.pollution}/${thresholds.pollution}`;
    document.getElementById('population').textContent = gameState.population;
    document.getElementById('happiness').textContent = gameState.happiness;
    document.getElementById('energy').textContent = gameState.energy;
    document.getElementById('income').textContent = `$${gameState.income}`;
    document.getElementById('fps').textContent = window.performanceMonitor ? window.performanceMonitor.getFPS() : '60';
    
    // Change l'accessibilité des boutons dépendant du budget
    const buttons = document.querySelectorAll('#building-selector button');
    buttons.forEach(button => {
        const buildingType = button.getAttribute('data-type');
        if (!buildingType || !buildingTypes[buildingType]) return;
        
        // Désactive un bouton si le budget est trop bas
        button.disabled = gameState.budget < buildingTypes[buildingType].cost;
        button.style.opacity = button.disabled ? '0.5' : '1';
    });
    
    // Change la couleur de la pollution dépendant du niveau
    const pollutionElement = document.getElementById('pollution').parentElement;
    const pollutionRatio = gameState.pollution / thresholds.pollution;
    
    if (pollutionRatio > 0.8) {
        pollutionElement.style.color = 'red';
    } else if (pollutionRatio > 0.5) {
        pollutionElement.style.color = 'orange';
    } else {
        pollutionElement.style.color = 'white';
    }
}
