// ====================
// Classes
// ====================

class Unit {
    constructor(type, family, id) {
        this.type = type; // 'soldier', 'archer', 'knight'
        this.family = family;
        this.id = id;
        this.alive = true;
        
        // Set stats based on type
        if (type === 'soldier') {
            this.maxHp = 20;
            this.hp = 20;
            this.icon = '⚔️';
        } else if (type === 'archer') {
            this.maxHp = 15;
            this.hp = 15;
            this.icon = '🏹';
        } else if (type === 'knight') {
            this.maxHp = 40;
            this.hp = 40;
            this.icon = '🐴';
        } else if (type === 'wolf') {
            this.maxHp = 100;
            this.hp = 100;
            this.icon = '🐺';
        } else if (type === 'dragon') {
            this.maxHp = 150;
            this.hp = 150;
            this.icon = '🐉';
        }
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }
    
    getHealthPercentage() {
        return (this.hp / this.maxHp) * 100;
    }
    
    calculateDamage(target) {
        if (this.type === 'soldier') {
            if (target.type === 'soldier') return 10;
            else return 5;
        } else if (this.type === 'archer') {
            return 5; // 5 contra todos
        } else if (this.type === 'knight') {
            if (target.type === 'soldier') return 20;
            else if (target.type === 'archer') return 5;
            else return 10; // vs other knights
        } else if (this.type === 'wolf') {
            return 20;
        } else if (this.type === 'dragon') {
            return 30;
        }
        return 0;
    }
    
    getDisplayName() {
        let typeName = '';
        if (this.type === 'soldier') typeName = 'Soldado';
        else if (this.type === 'archer') typeName = 'Arqueiro';
        else if (this.type === 'knight') typeName = 'Cavaleiro';
        else if (this.type === 'wolf') typeName = 'Lobo';
        else if (this.type === 'dragon') typeName = 'Dragão';
        
        return `${this.icon} ${typeName} #${this.id}`;
    }
}

class Team {
    constructor(name, family, soldiers, archers, knights) {
        this.name = name;
        this.family = family;
        this.units = [];
        this.unitIdCounter = 1;
        
        // Create soldiers
        for (let i = 0; i < soldiers; i++) {
            this.units.push(new Unit('soldier', family, this.unitIdCounter++));
        }
        
        // Create archers
        for (let i = 0; i < archers; i++) {
            this.units.push(new Unit('archer', family, this.unitIdCounter++));
        }
        
        // Create knights
        for (let i = 0; i < knights; i++) {
            this.units.push(new Unit('knight', family, this.unitIdCounter++));
        }
    }
    
    getAliveUnits() {
        return this.units.filter(u => u.alive);
    }
    
    getRandomAliveUnit() {
        const alive = this.getAliveUnits();
        if (alive.length === 0) return null;
        return alive[Math.floor(Math.random() * alive.length)];
    }
    
    hasAliveUnits() {
        return this.getAliveUnits().length > 0;
    }
}

class Battle {
    constructor(leftTeam, rightTeam) {
        this.leftTeam = leftTeam;
        this.rightTeam = rightTeam;
        this.currentRound = 0;
        this.maxRounds = 50;
        this.battleLog = [];
        this.battleComplete = false;
    }
    
    addLog(message) {
        this.battleLog.push(message);
        console.log(message);
    }
    
    executeRound() {
        if (this.currentRound >= this.maxRounds || this.battleComplete) {
            return;
        }
        
        this.currentRound++;
        this.addLog(`═══ RODADA ${this.currentRound} ═══`);
        
        // Random choice which team attacks
        const isLeftAttacking = Math.random() < 0.5;
        const attacker = isLeftAttacking 
            ? this.leftTeam.getRandomAliveUnit()
            : this.rightTeam.getRandomAliveUnit();
        
        const target = isLeftAttacking
            ? this.rightTeam.getRandomAliveUnit()
            : this.leftTeam.getRandomAliveUnit();
        
        if (!attacker || !target) {
            this.battleComplete = true;
            return;
        }
        
        // Calculate and apply damage
        const damage = attacker.calculateDamage(target);
        const targetWasAlive = target.alive;
        target.takeDamage(damage);
        
        // Log the action
        const attackerTeam = isLeftAttacking ? this.leftTeam.name : this.rightTeam.name;
        const targetTeam = isLeftAttacking ? this.rightTeam.name : this.leftTeam.name;
        
        this.addLog(
            `${attackerTeam} - ${attacker.getDisplayName()} ataca ` +
            `${targetTeam} - ${target.getDisplayName()} (Dano: ${damage})`
        );
        
        if (target.alive === false && targetWasAlive) {
            this.addLog(
                `☠️ ${target.getDisplayName()} foi morto!`
            );
        }
        
        if (this.currentRound >= this.maxRounds) {
            this.battleComplete = true;
        }
    }
    
    getResults() {
        const results = {
            leftTeam: this.getTeamResults(this.leftTeam),
            rightTeam: this.getTeamResults(this.rightTeam)
        };
        return results;
    }
    
    getTeamResults(team) {
        const byType = {
            soldier: {
                alive: 0,
                woundedLight: 0, // > 50% HP
                woundedHeavy: 0, // <= 50% HP
                dead: 0
            },
            archer: {
                alive: 0,
                woundedLight: 0,
                woundedHeavy: 0,
                dead: 0
            },
            knight: {
                alive: 0,
                woundedLight: 0,
                woundedHeavy: 0,
                dead: 0
            },
            wolf: {
                alive: 0,
                woundedLight: 0,
                woundedHeavy: 0,
                dead: 0
            },
            dragon: {
                alive: 0,
                woundedLight: 0,
                woundedHeavy: 0,
                dead: 0
            }
        };
        
        team.units.forEach(unit => {
            const stats = byType[unit.type];
            
            if (!unit.alive) {
                stats.dead++;
            } else {
                const healthPercent = unit.getHealthPercentage();
                if (healthPercent === 100) {
                    stats.alive++;
                } else if (healthPercent > 50) {
                    stats.woundedLight++;
                } else {
                    stats.woundedHeavy++;
                }
            }
        });
        
        return byType;
    }
}

// ====================
// Global Variables
// ====================

let currentBattle = null;
let battleAnimationInterval = null;

// ====================
// Validation & Setup
// ====================

function getFamily(familyElement) {
    return familyElement.value;
}

function validateBattleSetup() {
    const leftFamily = document.getElementById('leftFamily').value;
    const rightFamily = document.getElementById('rightFamily').value;
    
    if (!leftFamily || !rightFamily) {
        alert('Por favor, selecione uma casa para cada time!');
        return false;
    }
    
    if (leftFamily === rightFamily) {
        alert('As duas casas devem ser diferentes!');
        return false;
    }
    
    const leftSoldiers = parseInt(document.getElementById('leftSoldiers').value) || 0;
    const leftArchers = parseInt(document.getElementById('leftArchers').value) || 0;
    const leftKnights = parseInt(document.getElementById('leftKnights').value) || 0;
    const leftPower = document.getElementById('leftPower').checked;
    
    const rightSoldiers = parseInt(document.getElementById('rightSoldiers').value) || 0;
    const rightArchers = parseInt(document.getElementById('rightArchers').value) || 0;
    const rightKnights = parseInt(document.getElementById('rightKnights').value) || 0;
    const rightPower = document.getElementById('rightPower').checked;
    
    const leftHasUnits = leftSoldiers + leftArchers + leftKnights > 0 || (leftPower && SPECIAL_POWER_FAMILIES.includes(leftFamily));
    const rightHasUnits = rightSoldiers + rightArchers + rightKnights > 0 || (rightPower && SPECIAL_POWER_FAMILIES.includes(rightFamily));
    
    if (!leftHasUnits) {
        alert('O time esquerdo deve ter pelo menos uma unidade ou invocar um poder especial!');
        return false;
    }
    
    if (!rightHasUnits) {
        alert('O time direito deve ter pelo menos uma unidade ou invocar um poder especial!');
        return false;
    }
    
    return true;
}

function applySpecialPower(team, family, invokePower) {
    if (!invokePower) return;
    
    if (family === 'Greyjoy') {
        for (let i = 0; i < 5; i++) {
            team.units.push(new Unit('soldier', family, team.unitIdCounter++));
            team.units.push(new Unit('archer', family, team.unitIdCounter++));
        }
    }
    
    if (family === 'Stark') {
        team.units.push(new Unit('wolf', family, team.unitIdCounter++));
    }
    
    if (family === 'Targaryen') {
        team.units.push(new Unit('dragon', family, team.unitIdCounter++));
    }
}

function createBattle() {
    const leftFamily = document.getElementById('leftFamily').value;
    const rightFamily = document.getElementById('rightFamily').value;
    const leftInvoke = document.getElementById('leftPower').checked;
    const rightInvoke = document.getElementById('rightPower').checked;
    
    const leftSoldiers = parseInt(document.getElementById('leftSoldiers').value) || 0;
    const leftArchers = parseInt(document.getElementById('leftArchers').value) || 0;
    const leftKnights = parseInt(document.getElementById('leftKnights').value) || 0;
    
    const rightSoldiers = parseInt(document.getElementById('rightSoldiers').value) || 0;
    const rightArchers = parseInt(document.getElementById('rightArchers').value) || 0;
    const rightKnights = parseInt(document.getElementById('rightKnights').value) || 0;
    
    const leftTeam = new Team(leftFamily, leftFamily, leftSoldiers, leftArchers, leftKnights);
    applySpecialPower(leftTeam, leftFamily, leftInvoke);
    const rightTeam = new Team(rightFamily, rightFamily, rightSoldiers, rightArchers, rightKnights);
    applySpecialPower(rightTeam, rightFamily, rightInvoke);
    
    const battle = new Battle(leftTeam, rightTeam);
    
    if (leftInvoke && leftFamily === 'Greyjoy') {
        battle.addLog(`Greyjoy invoca uma caravela e aumenta soldados e arqueiros em +5!`);
    }
    if (rightInvoke && rightFamily === 'Greyjoy') {
        battle.addLog(`Greyjoy invoca uma caravela e aumenta soldados e arqueiros em +5!`);
    }
    if (leftInvoke && leftFamily === 'Stark') {
        battle.addLog(`Stark invoca o Lobo e ele entra na batalha!`);
    }
    if (rightInvoke && rightFamily === 'Stark') {
        battle.addLog(`Stark invoca o Lobo e ele entra na batalha!`);
    }
    if (leftInvoke && leftFamily === 'Targaryen') {
        battle.addLog(`Targaryen invoca o Dragão e ele entra na batalha!`);
    }
    if (rightInvoke && rightFamily === 'Targaryen') {
        battle.addLog(`Targaryen invoca o Dragão e ele entra na batalha!`);
    }
    
    return battle;
}

// ====================
// UI Updates
// ====================

const SPECIAL_POWER_FAMILIES = ['Greyjoy', 'Stark', 'Targaryen'];

function updateFamilyColor(selectId, colorId) {
    const select = document.getElementById(selectId);
    const colorDiv = document.getElementById(colorId);
    
    if (select.selectedIndex > 0) {
        const selectedOption = select.options[select.selectedIndex];
        const color = selectedOption.getAttribute('data-color');
        colorDiv.style.backgroundColor = color;
    } else {
        colorDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    }
}

function updatePowerCheckbox(selectId, checkboxId) {
    const family = document.getElementById(selectId).value;
    const checkbox = document.getElementById(checkboxId);
    if (SPECIAL_POWER_FAMILIES.includes(family)) {
        checkbox.disabled = false;
    } else {
        checkbox.checked = false;
        checkbox.disabled = true;
    }
}

function updateBattleDisplay() {
    // Update left team
    const leftContainer = document.getElementById('leftBattleInfo');
    leftContainer.innerHTML = '';
    currentBattle.leftTeam.units.forEach(unit => {
        const unitEl = createUnitElement(unit);
        leftContainer.appendChild(unitEl);
    });
    
    // Update right team
    const rightContainer = document.getElementById('rightBattleInfo');
    rightContainer.innerHTML = '';
    currentBattle.rightTeam.units.forEach(unit => {
        const unitEl = createUnitElement(unit);
        rightContainer.appendChild(unitEl);
    });
    
    // Update round counter
    document.getElementById('roundCounter').textContent = `Rodada: ${currentBattle.currentRound}/${currentBattle.maxRounds}`;
    
    // Update battle log
    updateBattleLog();
}

function createUnitElement(unit) {
    const div = document.createElement('div');
    div.className = unit.alive ? 'unit' : 'unit dead';
    
    const name = document.createElement('span');
    name.className = 'unit-name';
    name.textContent = unit.getDisplayName();
    
    const hpContainer = document.createElement('span');
    hpContainer.className = 'unit-hp';
    
    const hpBar = document.createElement('div');
    hpBar.className = 'hp-bar';
    
    const hpFill = document.createElement('div');
    hpFill.className = 'hp-fill';
    hpFill.style.width = unit.getHealthPercentage() + '%';
    
    hpBar.appendChild(hpFill);
    hpContainer.appendChild(hpBar);
    
    const hpText = document.createElement('span');
    hpText.textContent = `${unit.hp}/${unit.maxHp}`;
    hpContainer.appendChild(hpText);
    
    div.appendChild(name);
    div.appendChild(hpContainer);
    
    return div;
}

function updateBattleLog() {
    const logContainer = document.getElementById('battleLog');
    logContainer.innerHTML = '';
    
    currentBattle.battleLog.forEach((log, index) => {
        const entry = document.createElement('div');
        
        if (log.includes('Rodada')) {
            entry.className = 'log-entry round';
        } else if (log.includes('☠️')) {
            entry.className = 'log-entry death';
        } else if (log.includes('ataca')) {
            entry.className = 'log-entry damage';
        }
        
        entry.textContent = log;
        logContainer.appendChild(entry);
    });
    
    // Scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
}

function showBattleArena() {
    document.querySelector('.battle-setup').classList.add('hidden');
    document.querySelector('.start-button-container').classList.add('hidden');
    document.getElementById('battleArena').classList.remove('hidden');
    
    // Set background themes based on families
    const leftFamily = currentBattle.leftTeam.family;
    const rightFamily = currentBattle.rightTeam.family;
    
    document.getElementById('leftTeamName').textContent = currentBattle.leftTeam.name;
    document.getElementById('rightTeamName').textContent = currentBattle.rightTeam.name;
    
    // Add background themes
    const battleArena = document.getElementById('battleArena');
    battleArena.className = 'battle-arena hidden';
    battleArena.classList.remove('hidden');
    battleArena.setAttribute('data-left-family', leftFamily);
    battleArena.setAttribute('data-right-family', rightFamily);
    
    updateBattleDisplay();
}

function showResults() {
    document.getElementById('battleArena').classList.add('hidden');
    document.getElementById('resultModal').classList.remove('hidden');
    
    const results = currentBattle.getResults();
    const resultBody = document.getElementById('resultBody');
    resultBody.innerHTML = '';
    
    // Left team results
    const leftResult = createTeamResultHTML(currentBattle.leftTeam, results.leftTeam);
    resultBody.appendChild(leftResult);
    
    // Right team results
    const rightResult = createTeamResultHTML(currentBattle.rightTeam, results.rightTeam);
    resultBody.appendChild(rightResult);
    
    // Battle summary
    const summary = createBattleSummary(results, currentBattle.leftTeam, currentBattle.rightTeam);
    resultBody.appendChild(summary);
}

function createTeamResultHTML(team, results) {
    const div = document.createElement('div');
    div.className = 'team-result';
    
    const title = document.createElement('h3');
    title.textContent = `🏰 ${team.name}`;
    div.appendChild(title);
    
    const types = ['soldier', 'archer', 'knight', 'wolf', 'dragon'];
    const typeNames = {
        soldier: '⚔️ Soldados',
        archer: '🏹 Arqueiros',
        knight: '🐴 Cavaleiros',
        wolf: '🐺 Lobo',
        dragon: '🐉 Dragão'
    };
    
    types.forEach(type => {
        const stats = results[type];
        if (!stats) return;
        const total = stats.alive + stats.woundedLight + stats.woundedHeavy + stats.dead;
        if (total === 0) return;
        const statsDiv = document.createElement('div');
        statsDiv.className = 'unit-stats';
        statsDiv.innerHTML = `
            <strong>${typeNames[type]}:</strong><br>
            <span class="stat-item stat-alive">✓ Vivos: ${stats.alive}</span>
            <span class="stat-item stat-wounded-light">⚠️ Feridos Leves: ${stats.woundedLight}</span>
            <span class="stat-item stat-wounded-heavy">🩹 Feridos Graves: ${stats.woundedHeavy}</span>
            <span class="stat-item stat-dead">☠️ Mortos: ${stats.dead}</span>
        `;
        div.appendChild(statsDiv);
    });
    
    return div;
}

function createBattleSummary(results, leftTeam, rightTeam) {
    const div = document.createElement('div');
    div.className = 'team-result';
    
    const title = document.createElement('h3');
    title.textContent = '⚔️ Resumo da Batalha';
    div.appendChild(title);
    
    // Calculate totals by family
    const calculateFamilyTotals = (teamResults) => {
        return {
            alive: teamResults.soldier.alive + teamResults.archer.alive + teamResults.knight.alive + 
                   teamResults.wolf.alive + teamResults.dragon.alive,
            woundedLight: teamResults.soldier.woundedLight + teamResults.archer.woundedLight + teamResults.knight.woundedLight + 
                          teamResults.wolf.woundedLight + teamResults.dragon.woundedLight,
            woundedHeavy: teamResults.soldier.woundedHeavy + teamResults.archer.woundedHeavy + teamResults.knight.woundedHeavy + 
                          teamResults.wolf.woundedHeavy + teamResults.dragon.woundedHeavy,
            dead: teamResults.soldier.dead + teamResults.archer.dead + teamResults.knight.dead + 
                  teamResults.wolf.dead + teamResults.dragon.dead
        };
    };
    
    const leftTotals = calculateFamilyTotals(results.leftTeam);
    const rightTotals = calculateFamilyTotals(results.rightTeam);
    
    const leftAlive = leftTotals.alive;
    const rightAlive = rightTotals.alive;
    
    let winner = 'Empate';
    let resultClass = '';
    
    if (leftAlive > rightAlive) {
        winner = `🏆 ${leftTeam.name} Venceu!`;
        resultClass = 'stat-alive';
    } else if (rightAlive > leftAlive) {
        winner = `🏆 ${rightTeam.name} Venceu!`;
        resultClass = 'stat-alive';
    }
    
    const summary = document.createElement('div');
    summary.className = 'unit-stats';
    summary.innerHTML = `
        <strong>${winner}</strong><br>
    `;
    div.appendChild(summary);
    
    // Left team totals
    const leftTotalDiv = document.createElement('div');
    leftTotalDiv.className = 'unit-stats family-totals';
    leftTotalDiv.innerHTML = `
        <strong>📊 ${leftTeam.name} - Totais:</strong><br>
        <span class="stat-item stat-alive">✓ Vivos: ${leftTotals.alive}</span>
        <span class="stat-item stat-wounded-light">⚠️ Feridos Leves: ${leftTotals.woundedLight}</span>
        <span class="stat-item stat-wounded-heavy">🩹 Feridos Graves: ${leftTotals.woundedHeavy}</span>
        <span class="stat-item stat-dead">☠️ Mortos: ${leftTotals.dead}</span>
    `;
    div.appendChild(leftTotalDiv);
    
    // Right team totals
    const rightTotalDiv = document.createElement('div');
    rightTotalDiv.className = 'unit-stats family-totals';
    rightTotalDiv.innerHTML = `
        <strong>📊 ${rightTeam.name} - Totais:</strong><br>
        <span class="stat-item stat-alive">✓ Vivos: ${rightTotals.alive}</span>
        <span class="stat-item stat-wounded-light">⚠️ Feridos Leves: ${rightTotals.woundedLight}</span>
        <span class="stat-item stat-wounded-heavy">🩹 Feridos Graves: ${rightTotals.woundedHeavy}</span>
        <span class="stat-item stat-dead">☠️ Mortos: ${rightTotals.dead}</span>
    `;
    div.appendChild(rightTotalDiv);
    
    return div;
}

// ====================
// Battle Animation
// ====================

function runBattleAnimation() {
    let roundCount = 0;
    
    battleAnimationInterval = setInterval(() => {
        if (!currentBattle.battleComplete) {
            currentBattle.executeRound();
            updateBattleDisplay();
            roundCount++;
            
            if (currentBattle.battleComplete || roundCount >= 50) {
                clearInterval(battleAnimationInterval);
                
                // Wait a bit then show results
                setTimeout(() => {
                    showResults();
                }, 1000);
            }
        }
    }, 800); // 0.8 second per round for faster action
}

// ====================
// Event Listeners
// ====================

document.getElementById('leftFamily').addEventListener('change', () => {
    updateFamilyColor('leftFamily', 'leftFamilyColor');
    updatePowerCheckbox('leftFamily', 'leftPower');
});

document.getElementById('rightFamily').addEventListener('change', () => {
    updateFamilyColor('rightFamily', 'rightFamilyColor');
    updatePowerCheckbox('rightFamily', 'rightPower');
});

document.getElementById('startBattle').addEventListener('click', () => {
    if (validateBattleSetup()) {
        currentBattle = createBattle();
        showBattleArena();
        runBattleAnimation();
    }
});

document.getElementById('restartBattle').addEventListener('click', () => {
    // Close modal
    document.getElementById('resultModal').classList.add('hidden');
    
    // Show setup screen
    document.querySelector('.battle-setup').classList.remove('hidden');
    document.querySelector('.start-button-container').classList.remove('hidden');
    
    // Reset form
    document.getElementById('leftFamily').value = '';
    document.getElementById('rightFamily').value = '';
    document.getElementById('leftSoldiers').value = 5;
    document.getElementById('leftArchers').value = 3;
    document.getElementById('leftKnights').value = 2;
    document.getElementById('rightSoldiers').value = 5;
    document.getElementById('rightArchers').value = 3;
    document.getElementById('rightKnights').value = 2;
    document.getElementById('leftPower').checked = false;
    document.getElementById('rightPower').checked = false;
    document.getElementById('leftPower').disabled = true;
    document.getElementById('rightPower').disabled = true;
    
    // Update colors
    document.getElementById('leftFamilyColor').style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    document.getElementById('rightFamilyColor').style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    
    // Clear data
    currentBattle = null;
});

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    updatePowerCheckbox('leftFamily', 'leftPower');
    updatePowerCheckbox('rightFamily', 'rightPower');
    console.log('Game loaded!');
});
