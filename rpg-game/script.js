const mapScreen = document.getElementById('map-screen');
const battleScreen = document.getElementById('battle-screen');
const player = document.getElementById('player');
const msgText = document.getElementById('msg-text');
const hpVal = document.getElementById('hp-val');
const commandList = document.querySelectorAll('.command-window li');
const enemyVisual = document.querySelector('.enemy-visual');

// Game State
let gameState = 'MAP'; // MAP, BATTLE
let playerX = 50; // percentage
let playerY = 50; // percentage
let hp = 100;
let commandIndex = 0;

// Input Handling
document.addEventListener('keydown', (e) => {
    if (gameState === 'MAP') {
        handleMapInput(e.key);
    } else if (gameState === 'BATTLE') {
        handleBattleInput(e.key);
    }
});

function handleMapInput(key) {
    const speed = 2; // Movement speed
    if (key === 'ArrowUp') playerY = Math.max(0, playerY - speed);
    if (key === 'ArrowDown') playerY = Math.min(100, playerY + speed);
    if (key === 'ArrowLeft') playerX = Math.max(0, playerX - speed);
    if (key === 'ArrowRight') playerX = Math.min(100, playerX + speed);

    // Update background position to simulate camera movement
    // Center is 50%, so we move the background opposite to player direction?
    // Actually, simply mapping player coordinates (0-100) to background position (0-100) works like a static camera following player
    // But we want the player fixed and the map moving.
    // background-position: x% y%;
    // If player moves Right (X increases), we want to see more of the Right side, so background shifts Left... wait.
    // background-position: 0% 0% = Top Left of image is at Top Left of container.
    // background-position: 100% 100% = Bottom Right of image is at Bottom Right of container.
    // So simply setting playerX% playerY% calculates the correct offset for the "window".
    
    const mapView = document.querySelector('.map-view');
    mapView.style.backgroundPosition = `${playerX}% ${playerY}%`;

    // Random Encounter
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        if (Math.random() < 0.05) { // 5% chance per step
            startBattle();
        }
    }
}

function handleBattleInput(key) {
    if (key === 'ArrowUp') {
        commandIndex = (commandIndex - 1 + commandList.length) % commandList.length;
        updateCommandSelection();
    }
    if (key === 'ArrowDown') {
        commandIndex = (commandIndex + 1) % commandList.length;
        updateCommandSelection();
    }
    if (key === 'Enter' || key === ' ') {
        executeCommand();
    }
}

function updateCommandSelection() {
    commandList.forEach((li, index) => {
        if (index === commandIndex) {
            li.classList.add('selected');
        } else {
            li.classList.remove('selected');
        }
    });
}

function startBattle() {
    gameState = 'BATTLE';
    mapScreen.classList.remove('active');
    battleScreen.classList.add('active');
    
    // Random Enemy
    const enemies = ['スライム・バグ', '404エラー', '無限ループ'];
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    
    msgText.innerText = enemy + ' が あらわれた！';
    
    // Change Style randomly
    const colors = ['#ff5252', '#52ff52', '#5252ff'];
    enemyVisual.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
}

function executeCommand() {
    const cmd = commandList[commandIndex].dataset.cmd;
    
    if (cmd === 'fight') {
        typeMessage('勇者 の こうげき！\n120 の ダメージ を あたえた！');
        setTimeout(endBattle, 2000);
    } else if (cmd === 'spell') {
        typeMessage('勇者 は ギガ・コード を となえた！\nバグ は きれい に なくなった！');
        setTimeout(endBattle, 2000);
    } else if (cmd === 'run') {
        typeMessage('勇者 は にげだした！');
        setTimeout(endBattle, 1500);
    }
}

function typeMessage(text) {
    msgText.innerText = text;
}

function endBattle() {
    gameState = 'MAP';
    battleScreen.classList.remove('active');
    mapScreen.classList.add('active');
}

// Initial selection
updateCommandSelection();
