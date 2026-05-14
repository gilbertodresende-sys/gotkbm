// ====================
// Configuração
// ====================

const SPECIAL_POWER_FAMILIES = ['Greyjoy', 'Stark', 'Targaryen'];
const BATTLE_MUSIC_PATH = 'audio/battle.mp3';
const MAX_ROUNDS = 50;
const ROUND_DELAY_MS = 800;

let currentBattle = null;
let battleAnimationInterval = null;
let battleMusic = null;
let fallbackMusic = null;

// ====================
// Classes
// ====================

class Unit {
    constructor(type, family, id) {
        this.type = type;
        this.family = family;
        this.id = id;
        this.alive = true;

        const stats = {
            soldier: { hp: 20, icon: '⚔️', label: 'Soldado' },
            archer: { hp: 15, icon: '🏹', label: 'Arqueiro' },
            knight: { hp: 40, icon: '🐴', label: 'Cavaleiro' },
            wolf: { hp: 100, icon: '🐺', label: 'Lobo' },
            dragon: { hp: 150, icon: '🐉', label: 'Dragão' }
        };

        const unitStats = stats[type] || stats.soldier;
        this.maxHp = unitStats.hp;
        this.hp = unitStats.hp;
        this.icon = unitStats.icon;
        this.label = unitStats.label;
    }

    takeDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);
        this.alive = this.hp > 0;
    }

    getHealthPercentage() {
        if (this.maxHp <= 0) return 0;
        return (this.hp / this.maxHp) * 100;
    }

    calculateDamage(target) {
        if (this.type === 'soldier') return target.type === 'soldier' ? 10 : 5;
        if (this.type === 'archer') return 5;
        if (this.type === 'knight') {
            if (target.type === 'soldier') return 20;
            if (target.type === 'archer') return 5;
            return 10;
        }
        if (this.type === 'wolf') return 20;
        if (this.type === 'dragon') return 30;
        return 0;
    }

    getDisplayName() {
        return `${this.icon} ${this.label} #${this.id}`;
    }
}

class Team {
    constructor(name, family, soldiers, archers, knights) {
        this.name = name;
        this.family = family;
        this.units = [];
        this.unitIdCounter = 1;

        this.addUnits('soldier', soldiers);
        this.addUnits('archer', archers);
        this.addUnits('knight', knights);
    }

    addUnits(type, quantity) {
        for (let i = 0; i < quantity; i++) {
            this.units.push(new Unit(type, this.family, this.unitIdCounter++));
        }
    }

    getAliveUnits() {
        return this.units.filter(unit => unit.alive);
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
        this.maxRounds = MAX_ROUNDS;
        this.battleLog = [];
        this.battleComplete = false;
    }

    addLog(message) {
        this.battleLog.push(message);
        console.log(message);
    }

    executeRound() {
        if (this.battleComplete || this.currentRound >= this.maxRounds) return;

        if (!this.leftTeam.hasAliveUnits() || !this.rightTeam.hasAliveUnits()) {
            this.battleComplete = true;
            return;
        }

        this.currentRound++;
        this.addLog(`═══ RODADA ${this.currentRound} ═══`);

        const isLeftAttacking = Math.random() < 0.5;
        const attackingTeam = isLeftAttacking ? this.leftTeam : this.rightTeam;
        const defendingTeam = isLeftAttacking ? this.rightTeam : this.leftTeam;
        const attacker = attackingTeam.getRandomAliveUnit();
        const target = defendingTeam.getRandomAliveUnit();

        if (!attacker || !target) {
            this.battleComplete = true;
            return;
        }

        const damage = attacker.calculateDamage(target);
        const wasAlive = target.alive;
        target.takeDamage(damage);

        this.addLog(`${attackingTeam.name} - ${attacker.getDisplayName()} ataca ${defendingTeam.name} - ${target.getDisplayName()} (Dano: ${damage})`);

        if (wasAlive && !target.alive) {
            this.addLog(`☠️ ${defendingTeam.name} perdeu ${target.getDisplayName()}!`);
        }

        if (!this.leftTeam.hasAliveUnits() || !this.rightTeam.hasAliveUnits() || this.currentRound >= this.maxRounds) {
            this.battleComplete = true;
        }
    }

    getResults() {
        return {
            leftTeam: this.getTeamResults(this.leftTeam),
            rightTeam: this.getTeamResults(this.rightTeam)
        };
    }

    getTeamResults(team) {
        const byType = createEmptyResults();

        team.units.forEach(unit => {
            const stats = byType[unit.type];
            if (!stats) return;

            if (!unit.alive) {
                stats.dead++;
                return;
            }

            const healthPercent = unit.getHealthPercentage();
            if (healthPercent === 100) stats.alive++;
            else if (healthPercent > 50) stats.woundedLight++;
            else stats.woundedHeavy++;
        });

        return byType;
    }
}

function createEmptyResults() {
    const template = { alive: 0, woundedLight: 0, woundedHeavy: 0, dead: 0 };
    return {
        soldier: { ...template },
        archer: { ...template },
        knight: { ...template },
        wolf: { ...template },
        dragon: { ...template }
    };
}

// ====================
// Áudio
// ====================

function setAudioStatus(message, type = '') {
    const status = document.getElementById('audioStatus');
    if (!status) return;
    status.innerHTML = message;
    status.className = `audio-status ${type}`.trim();
}

async function playBattleMusic() {
    stopBattleMusic();

    battleMusic = document.getElementById('battleMusic');
    if (!battleMusic) {
        setAudioStatus('Áudio não encontrado no HTML.', 'error');
        return;
    }

    battleMusic.loop = true;
    battleMusic.currentTime = 0;

    try {
        await battleMusic.play();
        setAudioStatus('Áudio da batalha tocando.', 'ok');
    } catch (error) {
        console.warn('Falha no áudio principal. Tentando fallback.', error);
        try {
            fallbackMusic = new Audio(BATTLE_MUSIC_PATH);
            fallbackMusic.loop = true;
            await fallbackMusic.play();
            setAudioStatus('Áudio tocando via fallback.', 'warn');
        } catch (fallbackError) {
            console.warn('Não foi possível tocar o áudio.', fallbackError);
            setAudioStatus('Áudio não tocou. Confira se existe o arquivo <strong>audio/battle.mp3</strong>.', 'error');
        }
    }
}

function stopBattleMusic() {
    const mainAudio = battleMusic || document.getElementById('battleMusic');

    if (mainAudio) {
        mainAudio.pause();
        mainAudio.currentTime = 0;
    }

    if (fallbackMusic) {
        fallbackMusic.pause();
        fallbackMusic.currentTime = 0;
        fallbackMusic = null;
    }
}

// ====================
// Validação e criação da batalha
// ====================

function readNumber(id) {
    const value = parseInt(document.getElementById(id).value, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
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

    const leftTotal = readNumber('leftSoldiers') + readNumber('leftArchers') + readNumber('leftKnights');
    const rightTotal = readNumber('rightSoldiers') + readNumber('rightArchers') + readNumber('rightKnights');
    const leftPower = document.getElementById('leftPower').checked;
    const rightPower = document.getElementById('rightPower').checked;

    if (leftTotal <= 0 && !leftPower) {
        alert('O time esquerdo deve ter pelo menos uma unidade ou invocar um poder especial!');
        return false;
    }

    if (rightTotal <= 0 && !rightPower) {
        alert('O time direito deve ter pelo menos uma unidade ou invocar um poder especial!');
        return false;
    }

    return true;
}

function applySpecialPower(team, family, invokePower, battle) {
    if (!invokePower) return;

    if (family === 'Greyjoy') {
        team.addUnits('soldier', 5);
        team.addUnits('archer', 5);
        battle.addLog(`${family} invoca a Caravela: +5 Soldados e +5 Arqueiros entram na batalha.`);
    }

    if (family === 'Stark') {
        team.addUnits('wolf', 1);
        battle.addLog(`${family} invoca o Lobo Branco para entrar na batalha.`);
    }

    if (family === 'Targaryen') {
        team.addUnits('dragon', 1);
        battle.addLog(`${family} invoca um Dragão para entrar na batalha.`);
    }
}

function createBattle() {
    const leftFamily = document.getElementById('leftFamily').value;
    const rightFamily = document.getElementById('rightFamily').value;

    const leftTeam = new Team(leftFamily, leftFamily, readNumber('leftSoldiers'), readNumber('leftArchers'), readNumber('leftKnights'));
    const rightTeam = new Team(rightFamily, rightFamily, readNumber('rightSoldiers'), readNumber('rightArchers'), readNumber('rightKnights'));
    const battle = new Battle(leftTeam, rightTeam);

    applySpecialPower(leftTeam, leftFamily, document.getElementById('leftPower').checked, battle);
    applySpecialPower(rightTeam, rightFamily, document.getElementById('rightPower').checked, battle);

    return battle;
}

// ====================
// Interface
// ====================

function updateFamilyColor(selectId, colorId) {
    const select = document.getElementById(selectId);
    const colorDiv = document.getElementById(colorId);
    const selectedOption = select.options[select.selectedIndex];

    colorDiv.style.backgroundColor = selectedOption?.getAttribute('data-color') || 'rgba(255, 255, 255, 0.1)';
}

function updatePowerCheckbox(selectId, checkboxId) {
    const family = document.getElementById(selectId).value;
    const checkbox = document.getElementById(checkboxId);

    checkbox.disabled = !SPECIAL_POWER_FAMILIES.includes(family);
    if (checkbox.disabled) checkbox.checked = false;
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
    hpFill.style.width = `${unit.getHealthPercentage()}%`;

    const hpText = document.createElement('span');
    hpText.textContent = `${unit.hp}/${unit.maxHp}`;

    hpBar.appendChild(hpFill);
    hpContainer.appendChild(hpBar);
    hpContainer.appendChild(hpText);
    div.appendChild(name);
    div.appendChild(hpContainer);

    return div;
}

function updateBattleDisplay() {
    if (!currentBattle) return;

    const leftContainer = document.getElementById('leftBattleInfo');
    const rightContainer = document.getElementById('rightBattleInfo');

    leftContainer.innerHTML = '';
    rightContainer.innerHTML = '';

    currentBattle.leftTeam.units.forEach(unit => leftContainer.appendChild(createUnitElement(unit)));
    currentBattle.rightTeam.units.forEach(unit => rightContainer.appendChild(createUnitElement(unit)));

    document.getElementById('roundCounter').textContent = `Rodada: ${currentBattle.currentRound}/${currentBattle.maxRounds}`;
    updateBattleLog();
}

function updateBattleLog() {
    const logContainer = document.getElementById('battleLog');
    logContainer.innerHTML = '';

    currentBattle.battleLog.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';

        if (log.includes('RODADA')) entry.classList.add('round');
        if (log.includes('☠️')) entry.classList.add('death');
        if (log.includes('ataca')) entry.classList.add('damage');

        entry.textContent = log;
        logContainer.appendChild(entry);
    });

    logContainer.scrollTop = logContainer.scrollHeight;
}

function showBattleArena() {
    document.querySelector('.battle-setup').classList.add('hidden');
    document.querySelector('.start-button-container').classList.add('hidden');

    const battleArena = document.getElementById('battleArena');
    battleArena.className = 'battle-arena';
    battleArena.dataset.leftFamily = currentBattle.leftTeam.family;
    battleArena.dataset.rightFamily = currentBattle.rightTeam.family;

    document.getElementById('leftTeamName').textContent = currentBattle.leftTeam.name;
    document.getElementById('rightTeamName').textContent = currentBattle.rightTeam.name;

    updateBattleDisplay();
}

function createTeamResultHTML(team, results) {
    const div = document.createElement('div');
    div.className = 'team-result';

    const title = document.createElement('h3');
    title.textContent = `🏰 ${team.name}`;
    div.appendChild(title);

    const typeNames = {
        soldier: '⚔️ Soldados',
        archer: '🏹 Arqueiros',
        knight: '🐴 Cavaleiros',
        wolf: '🐺 Lobo',
        dragon: '🐉 Dragão'
    };

    Object.keys(typeNames).forEach(type => {
        const stats = results[type];
        const total = stats.alive + stats.woundedLight + stats.woundedHeavy + stats.dead;
        if (total === 0) return;

        const statsDiv = document.createElement('div');
        statsDiv.className = 'unit-stats';
        statsDiv.innerHTML = `
            <strong>${typeNames[type]}:</strong><br>
            <span class="stat-item stat-alive">✓ Vivos sem dano: ${stats.alive}</span>
            <span class="stat-item stat-wounded-light">⚠️ Feridos leves: ${stats.woundedLight}</span>
            <span class="stat-item stat-wounded-heavy">🩹 Feridos graves: ${stats.woundedHeavy}</span>
            <span class="stat-item stat-dead">☠️ Mortos: ${stats.dead}</span>
        `;
        div.appendChild(statsDiv);
    });

    return div;
}

function calculateTotals(teamResults) {
    return Object.values(teamResults).reduce((acc, stats) => {
        acc.alive += stats.alive;
        acc.woundedLight += stats.woundedLight;
        acc.woundedHeavy += stats.woundedHeavy;
        acc.dead += stats.dead;
        return acc;
    }, { alive: 0, woundedLight: 0, woundedHeavy: 0, dead: 0 });
}

function createBattleSummary(results, leftTeam, rightTeam) {
    const div = document.createElement('div');
    div.className = 'team-result';

    const title = document.createElement('h3');
    title.textContent = '⚔️ Resumo da Batalha';
    div.appendChild(title);

    const leftTotals = calculateTotals(results.leftTeam);
    const rightTotals = calculateTotals(results.rightTeam);
    const leftRemaining = leftTotals.alive + leftTotals.woundedLight + leftTotals.woundedHeavy;
    const rightRemaining = rightTotals.alive + rightTotals.woundedLight + rightTotals.woundedHeavy;

    let winner = '⚖️ Empate';
    if (leftRemaining > rightRemaining) winner = `🏆 ${leftTeam.name} venceu!`;
    if (rightRemaining > leftRemaining) winner = `🏆 ${rightTeam.name} venceu!`;

    const winnerDiv = document.createElement('div');
    winnerDiv.className = 'unit-stats family-totals';
    winnerDiv.innerHTML = `<strong>${winner}</strong><br>Critério: maior quantidade de unidades sobreviventes.`;
    div.appendChild(winnerDiv);

    [
        { team: leftTeam, totals: leftTotals },
        { team: rightTeam, totals: rightTotals }
    ].forEach(({ team, totals }) => {
        const totalDiv = document.createElement('div');
        totalDiv.className = 'unit-stats family-totals';
        totalDiv.innerHTML = `
            <strong>📊 ${team.name} - Totais:</strong><br>
            <span class="stat-item stat-alive">✓ Vivos sem dano: ${totals.alive}</span>
            <span class="stat-item stat-wounded-light">⚠️ Feridos leves: ${totals.woundedLight}</span>
            <span class="stat-item stat-wounded-heavy">🩹 Feridos graves: ${totals.woundedHeavy}</span>
            <span class="stat-item stat-dead">☠️ Mortos: ${totals.dead}</span>
        `;
        div.appendChild(totalDiv);
    });

    return div;
}

function showResults() {
    stopBattleMusic();
    document.getElementById('battleArena').classList.add('hidden');
    document.getElementById('resultModal').classList.remove('hidden');

    const results = currentBattle.getResults();
    const resultBody = document.getElementById('resultBody');
    resultBody.innerHTML = '';

    resultBody.appendChild(createTeamResultHTML(currentBattle.leftTeam, results.leftTeam));
    resultBody.appendChild(createTeamResultHTML(currentBattle.rightTeam, results.rightTeam));
    resultBody.appendChild(createBattleSummary(results, currentBattle.leftTeam, currentBattle.rightTeam));
}

function runBattleAnimation() {
    clearInterval(battleAnimationInterval);

    battleAnimationInterval = setInterval(() => {
        if (!currentBattle || currentBattle.battleComplete) {
            clearInterval(battleAnimationInterval);
            setTimeout(showResults, 1000);
            return;
        }

        currentBattle.executeRound();
        updateBattleDisplay();

        if (currentBattle.battleComplete) {
            clearInterval(battleAnimationInterval);
            setTimeout(showResults, 1000);
        }
    }, ROUND_DELAY_MS);
}

function resetBattleForm() {
    stopBattleMusic();
    clearInterval(battleAnimationInterval);

    document.getElementById('resultModal').classList.add('hidden');
    document.getElementById('battleArena').classList.add('hidden');
    document.querySelector('.battle-setup').classList.remove('hidden');
    document.querySelector('.start-button-container').classList.remove('hidden');

    ['leftFamily', 'rightFamily'].forEach(id => document.getElementById(id).value = '');
    ['leftSoldiers', 'rightSoldiers'].forEach(id => document.getElementById(id).value = 5);
    ['leftArchers', 'rightArchers'].forEach(id => document.getElementById(id).value = 3);
    ['leftKnights', 'rightKnights'].forEach(id => document.getElementById(id).value = 2);

    ['leftPower', 'rightPower'].forEach(id => {
        const checkbox = document.getElementById(id);
        checkbox.checked = false;
        checkbox.disabled = true;
    });

    updateFamilyColor('leftFamily', 'leftFamilyColor');
    updateFamilyColor('rightFamily', 'rightFamilyColor');

    currentBattle = null;
    setAudioStatus('Áudio: coloque o arquivo em <strong>audio/battle.mp3</strong>. Ele tocará após clicar em Começar Batalha.');
}

// ====================
// Inicialização
// ====================

document.addEventListener('DOMContentLoaded', () => {
    battleMusic = document.getElementById('battleMusic');
    if (battleMusic) battleMusic.loop = true;

    updatePowerCheckbox('leftFamily', 'leftPower');
    updatePowerCheckbox('rightFamily', 'rightPower');

    document.getElementById('leftFamily').addEventListener('change', () => {
        updateFamilyColor('leftFamily', 'leftFamilyColor');
        updatePowerCheckbox('leftFamily', 'leftPower');
    });

    document.getElementById('rightFamily').addEventListener('change', () => {
        updateFamilyColor('rightFamily', 'rightFamilyColor');
        updatePowerCheckbox('rightFamily', 'rightPower');
    });

    document.getElementById('startBattle').addEventListener('click', async () => {
        if (!validateBattleSetup()) return;

        currentBattle = createBattle();
        showBattleArena();
        await playBattleMusic();
        runBattleAnimation();
    });

    document.getElementById('restartBattle').addEventListener('click', resetBattleForm);
});
