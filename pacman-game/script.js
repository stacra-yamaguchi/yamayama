const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const gameWinEl = document.getElementById('game-win');
const winScoreEl = document.getElementById('win-score');

const TILE_SIZE = 32;
const ROWS = 14;
const COLS = 14;

// 0: Empty, 1: Wall, 2: Pellet, 3: Power Pellet
const INITIAL_MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,1,1,2,2,2,2,3,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,2,1,1,1,1,1,1,2,1,2,1],
    [1,2,1,2,2,2,1,1,2,2,2,1,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,2,2,1,2,1,1,2,1,2,2,2,1],
    [1,1,1,2,2,2,0,0,2,2,2,1,1,1],
    [1,2,2,2,1,1,1,1,1,1,2,2,2,1],
    [1,2,1,1,1,2,2,2,2,1,1,1,2,1],
    [1,3,2,2,2,2,1,1,2,2,2,2,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

let mapLayout = [];
let score = 0;
let lives = 3;
let superModeTimer = 0;
let animationId;
let gameRunning = false;
let pelletsRemaining = 0;

const pacman = {
    x: 0,
    y: 0,
    radius: 13,
    direction: 0, // 0: Right, 1: Down, 2: Left, 3: Up
    nextDirection: 0,
    speed: 2,
    mouthOpen: 0,
    mouthSpeed: 0.2
};

let ghosts = [];

// Input handle
document.addEventListener('keydown', (e) => {
    if(!gameRunning) return;
    if (e.key === 'ArrowRight' || e.key === 'd') pacman.nextDirection = 0;
    if (e.key === 'ArrowDown' || e.key === 's') pacman.nextDirection = 1;
    if (e.key === 'ArrowLeft' || e.key === 'a') pacman.nextDirection = 2;
    if (e.key === 'ArrowUp' || e.key === 'w') pacman.nextDirection = 3;
});

function initGame() {
    mapLayout = INITIAL_MAP.map(row => [...row]);
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
    if (animationId) cancelAnimationFrame(animationId);
    update();
}

function resetPositions() {
    pacman.x = 6.5 * TILE_SIZE;
    pacman.y = 9.5 * TILE_SIZE;
    pacman.direction = 0;
    pacman.nextDirection = 0;
    superModeTimer = 0;
    
    ghosts = [
        { x: 6.5 * TILE_SIZE, y: 4.5 * TILE_SIZE, color: 'red', dx: 1, dy: 0, spawnX: 6.5 * TILE_SIZE, spawnY: 4.5 * TILE_SIZE },
        { x: 7.5 * TILE_SIZE, y: 4.5 * TILE_SIZE, color: 'pink', dx: -1, dy: 0, spawnX: 7.5 * TILE_SIZE, spawnY: 4.5 * TILE_SIZE },
        { x: 5.5 * TILE_SIZE, y: 4.5 * TILE_SIZE, color: 'cyan', dx: 0, dy: -1, spawnX: 5.5 * TILE_SIZE, spawnY: 4.5 * TILE_SIZE }
    ];
}

function updateLivesUI() {
    livesEl.innerText = "❤️".repeat(lives);
}

function canMove(x, y, dx, dy) {
    const margin = 6;
    const checkPoints = [];
    if (dx !== 0) {
        checkPoints.push({ x: x + dx * (pacman.radius - 2), y: y - (pacman.radius - margin) });
        checkPoints.push({ x: x + dx * (pacman.radius - 2), y: y + (pacman.radius - margin) });
    } else {
        checkPoints.push({ x: x - (pacman.radius - margin), y: y + dy * (pacman.radius - 2) });
        checkPoints.push({ x: x + (pacman.radius - margin), y: y + dy * (pacman.radius - 2) });
    }
    for (const p of checkPoints) {
        const c = Math.floor(p.x / TILE_SIZE);
        const r = Math.floor(p.y / TILE_SIZE);
        if (mapLayout[r] && mapLayout[r][c] === 1) return false;
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

function update() {
    if (!gameRunning) return;

    if (superModeTimer > 0) superModeTimer--;

    // PACMAN TURN
    if (pacman.nextDirection !== pacman.direction) {
        if (isOpposite(pacman.nextDirection, pacman.direction)) {
            pacman.direction = pacman.nextDirection;
        } else {
            const nextVec = getDirVec(pacman.nextDirection);
            const centerX = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
            const centerY = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
            if (Math.abs(pacman.x - centerX) < 4 && Math.abs(pacman.y - centerY) < 4) {
                if (canMove(centerX, centerY, nextVec.dx, nextVec.dy)) {
                    pacman.x = centerX; pacman.y = centerY;
                    pacman.direction = pacman.nextDirection;
                }
            }
        }
    }

    // PACMAN MOVE
    const vec = getDirVec(pacman.direction);
    if (canMove(pacman.x, pacman.y, vec.dx, vec.dy)) {
        pacman.x += vec.dx * pacman.speed;
        pacman.y += vec.dy * pacman.speed;
        const centerX = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const centerY = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        if (vec.dx !== 0) {
            if (pacman.y < centerY) pacman.y = Math.min(centerY, pacman.y + 1);
            else if (pacman.y > centerY) pacman.y = Math.max(centerY, pacman.y - 1);
        } else if (vec.dy !== 0) {
            if (pacman.x < centerX) pacman.x = Math.min(centerX, pacman.x + 1);
            else if (pacman.x > centerX) pacman.x = Math.max(centerX, pacman.x - 1);
        }
        pacman.mouthOpen += pacman.mouthSpeed;
        if (pacman.mouthOpen > 0.2 || pacman.mouthOpen < 0) pacman.mouthSpeed *= -1;
    } else {
        pacman.x = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        pacman.y = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    }

    // EAT
    const gridX = Math.floor(pacman.x / TILE_SIZE);
    const gridY = Math.floor(pacman.y / TILE_SIZE);
    if (mapLayout[gridY] && mapLayout[gridY][gridX] === 2) {
        mapLayout[gridY][gridX] = 0; score += 10; pelletsRemaining--;
    } else if (mapLayout[gridY] && mapLayout[gridY][gridX] === 3) {
        mapLayout[gridY][gridX] = 0; score += 50; pelletsRemaining--;
        superModeTimer = 600; // ~10 seconds
    }
    scoreEl.innerText = score;
    if(pelletsRemaining <= 0) gameWin();

    // GHOSTS
    ghosts.forEach(ghost => {
        const gCenterX = Math.floor(ghost.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const gCenterY = Math.floor(ghost.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

        if (Math.abs(ghost.x - gCenterX) < 2 && Math.abs(ghost.y - gCenterY) < 2) {
            const dirs = [{dx:1, dy:0}, {dx:-1, dy:0}, {dx:0, dy:1}, {dx:0, dy:-1}];
            const validDirs = dirs.filter(d => {
                if (d.dx === -ghost.dx && d.dy === -ghost.dy) return false;
                const tx = Math.floor((gCenterX + d.dx * TILE_SIZE) / TILE_SIZE);
                const ty = Math.floor((gCenterY + d.dy * TILE_SIZE) / TILE_SIZE);
                return mapLayout[ty] && mapLayout[ty][tx] !== 1;
            });
            if (validDirs.length > 0) {
                const rand = validDirs[Math.floor(Math.random() * validDirs.length)];
                ghost.dx = rand.dx; ghost.dy = rand.dy;
            } else {
                ghost.dx *= -1; ghost.dy *= -1;
            }
            ghost.x = gCenterX; ghost.y = gCenterY;
        }
        ghost.x += ghost.dx * 1.5; ghost.y += ghost.dy * 1.5;

        // COLLISION
        if (Math.hypot(ghost.x - pacman.x, ghost.y - pacman.y) < 20) {
            if (superModeTimer > 0) {
                ghost.x = ghost.spawnX; ghost.y = ghost.spawnY;
                score += 200; scoreEl.innerText = score;
            } else {
                lives--;
                updateLivesUI();
                if (lives <= 0) gameOver();
                else resetPositions();
            }
        }
    });

    draw();
    animationId = requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            const x = c * TILE_SIZE; const y = r * TILE_SIZE;
            if (mapLayout[r][c] === 1) {
                ctx.fillStyle = '#0000ff'; ctx.fillRect(x+2, y+2, TILE_SIZE-4, TILE_SIZE-4);
            } else if (mapLayout[r][c] === 2) {
                ctx.fillStyle = '#ffb8ae'; ctx.beginPath(); ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 3, 0, Math.PI*2); ctx.fill();
            } else if (mapLayout[r][c] === 3) {
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 8, 0, Math.PI*2); ctx.fill();
            }
        }
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
        ctx.fillStyle = superModeTimer > 0 ? (superModeTimer < 120 && superModeTimer % 20 < 10 ? '#fff' : '#0000ff') : ghost.color;
        ctx.beginPath(); ctx.arc(ghost.x, ghost.y, 12, Math.PI, 0); ctx.lineTo(ghost.x + 12, ghost.y + 12); ctx.lineTo(ghost.x - 12, ghost.y + 12); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ghost.x - 4, ghost.y - 2, 4, 0, Math.PI*2); ctx.arc(ghost.x + 4, ghost.y - 2, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(ghost.x - 4, ghost.y - 2, 1.5, 0, Math.PI*2); ctx.arc(ghost.x + 4, ghost.y - 2, 1.5, 0, Math.PI*2); ctx.fill();
    });
}

function gameOver() {
    gameRunning = false;
    gameOverEl.style.display = 'block';
    finalScoreEl.innerText = score;
}

function gameWin() {
    gameRunning = false;
    gameWinEl.style.display = 'block';
    winScoreEl.innerText = score;
}

function resetGame() {
    initGame();
}

window.onload = initGame;
