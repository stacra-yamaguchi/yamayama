const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const gameWinEl = document.getElementById('game-win');
const winScoreEl = document.getElementById('win-score');

const TILE_SIZE = 32;
let ROWS, COLS;

// 1: Wall, 2: Pellet, 3: Power, 4: Gate, 5: House
const HORIZONTAL_MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,3,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,2,1,1,1,1,1,1,2,1,1,4,4,1,1,2,1,1,1,1,1,1,2,1,2,1],
    [1,2,1,2,2,2,1,1,2,2,2,1,5,5,5,5,1,2,2,2,1,1,2,2,2,1,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,5,5,5,5,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,2,2,1,2,1,1,2,1,2,2,1,1,1,1,2,2,1,2,1,1,2,1,2,2,2,1],
    [1,1,1,2,2,2,0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,2,2,2,1,1,1],
    [1,2,2,2,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,2,2,1],
    [1,2,1,1,1,2,2,2,2,1,1,1,2,1,1,2,1,1,1,2,2,2,2,1,1,1,2,1],
    [1,3,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const VERTICAL_MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,2,2,2,2,2,2,3,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,1,1,2,2,2,2,2,1],
    [1,1,1,2,1,1,1,1,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,1,1,2,2,2,2,2,1],
    [1,1,1,1,1,2,1,1,2,1,1,1,1,1],
    [1,2,2,2,2,2,4,4,2,2,2,2,2,1],
    [1,2,1,1,1,2,5,5,2,1,1,1,2,1],
    [1,2,1,1,1,2,5,5,2,1,1,1,2,1],
    [1,2,2,2,2,2,0,0,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,2,1,1,2,1,1,1,1,1],
    [1,2,2,2,2,2,1,1,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,2,1,1,1,1,1,1,2,1,1,1],
    [1,2,2,2,2,2,1,1,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,2,1,1,1,1,1,1,2,1,1,1],
    [1,2,2,2,2,2,1,1,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,3,2,2,2,2,2,2,2,2,2,2,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

let mapLayout = [];
let score = 0;
let lives = 3;
let superModeTimer = 0;
let animationId;
let gameRunning = false;
let pelletsRemaining = 0;
let fruit = { x: -1, y: -1, active: false, timer: 0 };

const pacman = {
    x: 0,
    y: 0,
    radius: 13,
    direction: 0,
    nextDirection: 0,
    speed: 4,
    mouthOpen: 0,
    mouthSpeed: 0.2
};

let ghosts = [];

document.addEventListener('keydown', (e) => {
    if(!gameRunning) return;
    if (e.key === 'ArrowRight' || e.key === 'd') pacman.nextDirection = 0;
    if (e.key === 'ArrowDown' || e.key === 's') pacman.nextDirection = 1;
    if (e.key === 'ArrowLeft' || e.key === 'a') pacman.nextDirection = 2;
    if (e.key === 'ArrowUp' || e.key === 'w') pacman.nextDirection = 3;
});

function initGame() {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        COLS = 14; ROWS = 28;
        mapLayout = VERTICAL_MAP.map(row => [...row]);
    } else {
        COLS = 28; ROWS = 14;
        mapLayout = HORIZONTAL_MAP.map(row => [...row]);
    }
    
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;
    
    score = 0;
    lives = 3;
    scoreEl.innerText = score;
    updateLivesUI();
    resetPositions();
    
    pelletsRemaining = 0;
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            if(mapLayout[r][c] === 2 || mapLayout[r][c] === 3) pelletsRemaining++;
        }
    }

    gameOverEl.style.display = 'none';
    gameWinEl.style.display = 'none';
    gameRunning = true;
    fruit.active = false;
    fruit.timer = 0;
    if (animationId) cancelAnimationFrame(animationId);
    update();
}

function resetPositions() {
    const isMobile = COLS === 14;
    if (isMobile) {
        pacman.x = 6.5 * TILE_SIZE; pacman.y = 22.5 * TILE_SIZE;
        ghosts = [
            { x: 6 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'red', dx: 1, dy: 0, spawnX: 6 * TILE_SIZE, spawnY: 11 * TILE_SIZE, wait: 0, speed: 3 },
            { x: 7 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'pink', dx: -1, dy: 0, spawnX: 7 * TILE_SIZE, spawnY: 11 * TILE_SIZE, wait: 60, speed: 3 },
            { x: 6 * TILE_SIZE, y: 10 * TILE_SIZE, color: 'cyan', dx: 0, dy: -1, spawnX: 6 * TILE_SIZE, spawnY: 10 * TILE_SIZE, wait: 120, speed: 3 },
            { x: 7 * TILE_SIZE, y: 10 * TILE_SIZE, color: 'orange', dx: 0, dy: 1, spawnX: 7 * TILE_SIZE, spawnY: 10 * TILE_SIZE, wait: 180, speed: 3 }
        ];
    } else {
        pacman.x = 13.5 * TILE_SIZE; pacman.y = 10.5 * TILE_SIZE;
        ghosts = [
            { x: 13 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'red', dx: 1, dy: 0, spawnX: 13 * TILE_SIZE, spawnY: 7 * TILE_SIZE, wait: 0, speed: 3 },
            { x: 14 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'pink', dx: -1, dy: 0, spawnX: 14 * TILE_SIZE, spawnY: 7 * TILE_SIZE, wait: 60, speed: 3 },
            { x: 13 * TILE_SIZE, y: 6 * TILE_SIZE, color: 'cyan', dx: 0, dy: -1, spawnX: 13 * TILE_SIZE, spawnY: 6 * TILE_SIZE, wait: 120, speed: 3 },
            { x: 14 * TILE_SIZE, y: 6 * TILE_SIZE, color: 'orange', dx: 0, dy: 1, spawnX: 14 * TILE_SIZE, spawnY: 6 * TILE_SIZE, wait: 180, speed: 3 }
        ];
    }
    pacman.direction = 0; pacman.nextDirection = 0;
    superModeTimer = 0;
}

function updateLivesUI() {
    livesEl.innerText = "❤️".repeat(lives);
}

function canMove(x, y, dx, dy, isGhost = false) {
    const margin = 8;
    const checkPoints = [];
    const radius = 12;
    if (dx !== 0) {
        checkPoints.push({ x: x + dx * (radius), y: y - (radius - margin) });
        checkPoints.push({ x: x + dx * (radius), y: y + (radius - margin) });
    } else if (dy !== 0) {
        checkPoints.push({ x: x - (radius - margin), y: y + dy * (radius) });
        checkPoints.push({ x: x + (radius - margin), y: y + dy * (radius) });
    }
    for (const p of checkPoints) {
        const c = Math.floor(p.x / TILE_SIZE);
        const r = Math.floor(p.y / TILE_SIZE);
        const tile = mapLayout[r] ? mapLayout[r][c] : 1;
        if (tile === 1 || tile === 5) return false;
        if (tile === 4 && !isGhost) return false;
    }
    return true;
}

function getDirVec(dir) {
    if (dir === 0) return { dx: 1, dy: 0 };
    if (dir === 1) return { dx: 0, dy: 1 };
    if (dir === 2) return { dx: -1, dy: 0 };
    if (dir === 3) return { dx: 0, dy: -1 };
    return { dx: 0, dy: 0 };
}

function isOpposite(d1, d2) {
    return Math.abs(d1 - d2) === 2;
}

function spawnFruit() {
    if (COLS === 14) { fruit.x = 6.5 * TILE_SIZE; fruit.y = 12.5 * TILE_SIZE; }
    else { fruit.x = 13.5 * TILE_SIZE; fruit.y = 10.5 * TILE_SIZE; }
    fruit.active = true; fruit.timer = 600;
}

function update() {
    if (!gameRunning) return;
    if (superModeTimer > 0) superModeTimer--;

    if (!fruit.active) {
        if (Math.random() < 0.002) spawnFruit();
    } else {
        fruit.timer--;
        if (fruit.timer <= 0) fruit.active = false;
        if (Math.hypot(pacman.x - fruit.x, pacman.y - fruit.y) < 20) {
            fruit.active = false; score += 500; scoreEl.innerText = score;
        }
    }

    const centerX = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    const centerY = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

    if (pacman.nextDirection !== pacman.direction) {
        if (isOpposite(pacman.nextDirection, pacman.direction)) {
            pacman.direction = pacman.nextDirection;
        } else {
            const nextVec = getDirVec(pacman.nextDirection);
            if (Math.abs(pacman.x - centerX) <= pacman.speed && Math.abs(pacman.y - centerY) <= pacman.speed) {
                if (canMove(centerX, centerY, nextVec.dx, nextVec.dy)) {
                    pacman.x = centerX; pacman.y = centerY;
                    pacman.direction = pacman.nextDirection;
                }
            }
        }
    }

    const vec = getDirVec(pacman.direction);
    if (canMove(pacman.x, pacman.y, vec.dx, vec.dy)) {
        pacman.x += vec.dx * pacman.speed; pacman.y += vec.dy * pacman.speed;
        if (vec.dx !== 0) {
            if (Math.abs(pacman.y - centerY) < pacman.speed) pacman.y = centerY;
            else if (pacman.y < centerY) pacman.y += 1; else if (pacman.y > centerY) pacman.y -= 1;
        } else if (vec.dy !== 0) {
            if (Math.abs(pacman.x - centerX) < pacman.speed) pacman.x = centerX;
            else if (pacman.x < centerX) pacman.x += 1; else if (pacman.x > centerX) pacman.x -= 1;
        }
        pacman.mouthOpen += pacman.mouthSpeed;
        if (pacman.mouthOpen > 0.2 || pacman.mouthOpen < 0) pacman.mouthSpeed *= -1;
    } else { pacman.x = centerX; pacman.y = centerY; }

    const gridX = Math.floor(pacman.x / TILE_SIZE);
    const gridY = Math.floor(pacman.y / TILE_SIZE);
    if (mapLayout[gridY] && mapLayout[gridY][gridX] === 2) {
        mapLayout[gridY][gridX] = 0; score += 10; pelletsRemaining--;
    } else if (mapLayout[gridY] && mapLayout[gridY][gridX] === 3) {
        mapLayout[gridY][gridX] = 0; score += 50; pelletsRemaining--;
        superModeTimer = 600;
    }
    scoreEl.innerText = score;
    if(pelletsRemaining <= 0) gameWin();

    ghosts.forEach(ghost => {
        if (ghost.wait > 0) { ghost.wait--; return; }
        const gCenterX = Math.floor(ghost.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const gCenterY = Math.floor(ghost.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        if (Math.abs(ghost.x - gCenterX) <= ghost.speed && Math.abs(ghost.y - gCenterY) <= ghost.speed) {
            const dirs = [{dx:1, dy:0}, {dx:-1, dy:0}, {dx:0, dy:1}, {dx:0, dy:-1}];
            const validDirs = dirs.filter(d => {
                if (d.dx === -ghost.dx && d.dy === -ghost.dy) return false;
                return canMove(gCenterX, gCenterY, d.dx, d.dy, true);
            });
            if (validDirs.length > 0) {
                const rand = validDirs[Math.floor(Math.random() * validDirs.length)];
                ghost.dx = rand.dx; ghost.dy = rand.dy; ghost.x = gCenterX; ghost.y = gCenterY;
            } else { ghost.dx *= -1; ghost.dy *= -1; }
        }
        if (canMove(ghost.x, ghost.y, ghost.dx, ghost.dy, true)) {
            ghost.x += ghost.dx * ghost.speed; ghost.y += ghost.dy * ghost.speed;
        } else { ghost.x = gCenterX; ghost.y = gCenterY; }
        if (Math.hypot(ghost.x - pacman.x, ghost.y - pacman.y) < 22) {
            if (superModeTimer > 0) {
                ghost.x = ghost.spawnX; ghost.y = ghost.spawnY; ghost.wait = 120;
                score += 200; scoreEl.innerText = score;
            } else { lives--; updateLivesUI(); if (lives <= 0) gameOver(); else resetPositions(); }
        }
    });
    draw();
    animationId = requestAnimationFrame(update);
}

function drawWall(x, y) {
    ctx.strokeStyle = '#3333ff'; ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            const x = c * TILE_SIZE; const y = r * TILE_SIZE;
            const tile = mapLayout[r][c];
            if (tile === 1) drawWall(x, y);
            else if (tile === 2) {
                ctx.fillStyle = '#ffb8ae'; ctx.beginPath(); ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 3, 0, Math.PI*2); ctx.fill();
            } else if (tile === 3) {
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 8, 0, Math.PI*2); ctx.fill();
            } else if (tile === 4) {
                ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + TILE_SIZE/2); ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE/2); ctx.stroke();
            }
        }
    }
    if (fruit.active) {
        ctx.fillStyle = '#ff0000'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff5555';
        ctx.beginPath(); ctx.arc(fruit.x, fruit.y, 10, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
    }
    // Pacman
    ctx.fillStyle = superModeTimer > 0 ? (superModeTimer % 20 < 10 ? '#fff' : '#ffff00') : '#ffff00';
    ctx.beginPath();
    const mouthAngle = pacman.mouthOpen * Math.PI;
    const rotation = [0, Math.PI/2, Math.PI, -Math.PI/2][pacman.direction];
    ctx.translate(pacman.x, pacman.y); ctx.rotate(rotation);
    ctx.arc(0, 0, pacman.radius, mouthAngle, 2 * Math.PI - mouthAngle); ctx.lineTo(0, 0); ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Ghosts
    ghosts.forEach(ghost => {
        if (ghost.wait > 0) return;
        ctx.fillStyle = superModeTimer > 0 ? (superModeTimer < 120 && superModeTimer % 20 < 10 ? '#fff' : '#0000ff') : ghost.color;
        ctx.beginPath(); ctx.arc(ghost.x, ghost.y, 12, Math.PI, 0); ctx.lineTo(ghost.x + 12, ghost.y + 12); ctx.lineTo(ghost.x - 12, ghost.y + 12); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ghost.x - 4, ghost.y - 2, 4, 0, Math.PI*2); ctx.arc(ghost.x + 4, ghost.y - 2, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(ghost.x - 4, ghost.y - 2, 1.5, 0, Math.PI*2); ctx.arc(ghost.x + 4, ghost.y - 2, 1.5, 0, Math.PI*2); ctx.fill();
    });
}

function gameOver() { gameRunning = false; gameOverEl.style.display = 'block'; finalScoreEl.innerText = score; }
function gameWin() { gameRunning = false; gameWinEl.style.display = 'block'; winScoreEl.innerText = score; }
function resetGame() { initGame(); }
window.onload = initGame;
window.onresize = () => { if(!gameRunning) initGame(); };
