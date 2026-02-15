const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const gameWinEl = document.getElementById('game-win');
const winScoreEl = document.getElementById('win-score');

const TILE_SIZE = 32;
const ROWS = 14;
const COLS = 14;

// 0: Empty, 1: Wall, 2: Pellet
// Simple maze
const INITIAL_MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,1,1,2,2,2,2,2,1],
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
    [1,2,2,2,2,2,1,1,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

let mapLayout = [];
let score = 0;
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
    // Clone map for fresh start
    mapLayout = INITIAL_MAP.map(row => [...row]);
    score = 0;
    scoreEl.innerText = score;
    pelletsRemaining = 0;
    
    // Initial states
    pacman.x = 6.5 * TILE_SIZE;
    pacman.y = 9.5 * TILE_SIZE; // Bottom center area
    pacman.direction = 0;
    pacman.nextDirection = 0;
    
    ghosts = [
        { x: 6.5 * TILE_SIZE, y: 4.5 * TILE_SIZE, color: 'red', dx: 1, dy: 0 },
        { x: 7.5 * TILE_SIZE, y: 4.5 * TILE_SIZE, color: 'pink', dx: -1, dy: 0 },
        { x: 5.5 * TILE_SIZE, y: 4.5 * TILE_SIZE, color: 'cyan', dx: 0, dy: -1 }
    ];

    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            if(mapLayout[r][c] === 2) pelletsRemaining++;
        }
    }

    gameOverEl.style.display = 'none';
    gameWinEl.style.display = 'none';
    gameRunning = true;
    if (animationId) cancelAnimationFrame(animationId);
    update();
}

function canMove(x, y, dx, dy) {
    // Calculate tile position we are checking
    const margin = 6; // Safety margin to avoid scraping walls
    const checkPoints = [];
    
    if (dx !== 0) { // Horizontal
        checkPoints.push({ x: x + dx * (pacman.radius - 2), y: y - (pacman.radius - margin) });
        checkPoints.push({ x: x + dx * (pacman.radius - 2), y: y + (pacman.radius - margin) });
    } else { // Vertical
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
    if (dir === 0) return { dx: 1, dy: 0 }; // Right
    if (dir === 1) return { dx: 0, dy: 1 }; // Down
    if (dir === 2) return { dx: -1, dy: 0 }; // Left
    if (dir === 3) return { dx: 0, dy: -1 }; // Up
    return { dx: 0, dy: 0 };
}

function isOpposite(d1, d2) {
    return Math.abs(d1 - d2) === 2;
}

function update() {
    if (!gameRunning) return;

    // --- PACMAN TURN LOGIC ---
    if (pacman.nextDirection !== pacman.direction) {
        // Immediate reversal is always allowed
        if (isOpposite(pacman.nextDirection, pacman.direction)) {
            pacman.direction = pacman.nextDirection;
        } else {
            // Check if we are at a junction
            const nextVec = getDirVec(pacman.nextDirection);
            const centerX = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
            const centerY = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
            
            // If close to center, check if we can turn
            if (Math.abs(pacman.x - centerX) < 4 && Math.abs(pacman.y - centerY) < 4) {
                if (canMove(centerX, centerY, nextVec.dx, nextVec.dy)) {
                    pacman.x = centerX;
                    pacman.y = centerY;
                    pacman.direction = pacman.nextDirection;
                }
            }
        }
    }

    // --- MOVEMENT ---
    const vec = getDirVec(pacman.direction);
    if (canMove(pacman.x, pacman.y, vec.dx, vec.dy)) {
        pacman.x += vec.dx * pacman.speed;
        pacman.y += vec.dy * pacman.speed;

        // Auto-alignment: gently nudge towards center of corridor
        const centerX = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const centerY = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        
        if (vec.dx !== 0) { // Moving Horizontally, align Y
            if (pacman.y < centerY) pacman.y = Math.min(centerY, pacman.y + 1);
            else if (pacman.y > centerY) pacman.y = Math.max(centerY, pacman.y - 1);
        } else if (vec.dy !== 0) { // Moving Vertically, align X
            if (pacman.x < centerX) pacman.x = Math.min(centerX, pacman.x + 1);
            else if (pacman.x > centerX) pacman.x = Math.max(centerX, pacman.x - 1);
        }

        // Animation
        pacman.mouthOpen += pacman.mouthSpeed;
        if (pacman.mouthOpen > 0.2 || pacman.mouthOpen < 0) pacman.mouthSpeed *= -1;
    } else {
        // Snap to center when blocked to ensure turns work next frame
        pacman.x = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        pacman.y = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    }

    // --- EAT ---
    const gridX = Math.floor(pacman.x / TILE_SIZE);
    const gridY = Math.floor(pacman.y / TILE_SIZE);
    if (mapLayout[gridY] && mapLayout[gridY][gridX] === 2) {
        mapLayout[gridY][gridX] = 0;
        score += 10;
        scoreEl.innerText = score;
        pelletsRemaining--;
        if(pelletsRemaining <= 0) gameWin();
    }

    // --- GHOSTS ---
    ghosts.forEach(ghost => {
        // Move ghost
        const gCenterX = Math.floor(ghost.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const gCenterY = Math.floor(ghost.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

        if (Math.abs(ghost.x - gCenterX) < 2 && Math.abs(ghost.y - gCenterY) < 2) {
            // At center, decide next move
            const dirs = [{dx:1, dy:0}, {dx:-1, dy:0}, {dx:0, dy:1}, {dx:0, dy:-1}];
            const validDirs = dirs.filter(d => {
                // Don't go back unless necessary
                if (d.dx === -ghost.dx && d.dy === -ghost.dy) return false;
                const tx = Math.floor((gCenterX + d.dx * TILE_SIZE) / TILE_SIZE);
                const ty = Math.floor((gCenterY + d.dy * TILE_SIZE) / TILE_SIZE);
                return mapLayout[ty] && mapLayout[ty][tx] !== 1;
            });
            
            if (validDirs.length > 0) {
                const rand = validDirs[Math.floor(Math.random() * validDirs.length)];
                ghost.dx = rand.dx;
                ghost.dy = rand.dy;
            } else {
                ghost.dx *= -1; ghost.dy *= -1;
            }
            ghost.x = gCenterX; ghost.y = gCenterY;
        }
        
        ghost.x += ghost.dx * 1.5;
        ghost.y += ghost.dy * 1.5;

        // Collision
        if (Math.hypot(ghost.x - pacman.x, ghost.y - pacman.y) < 20) gameOver();
    });

    draw();
    animationId = requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;
            if (mapLayout[r][c] === 1) {
                ctx.fillStyle = '#0000ff';
                ctx.fillRect(x+2, y+2, TILE_SIZE-4, TILE_SIZE-4);
            } else if (mapLayout[r][c] === 2) {
                ctx.fillStyle = '#ffb8ae';
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 3, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    // Pacman
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    const mouthAngle = pacman.mouthOpen * Math.PI;
    const rotation = [0, Math.PI/2, Math.PI, -Math.PI/2][pacman.direction];
    ctx.translate(pacman.x, pacman.y);
    ctx.rotate(rotation);
    ctx.arc(0, 0, pacman.radius, mouthAngle, 2 * Math.PI - mouthAngle);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Ghosts
    ghosts.forEach(ghost => {
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, 12, Math.PI, 0);
        ctx.lineTo(ghost.x + 12, ghost.y + 12);
        ctx.lineTo(ghost.x - 12, ghost.y + 12);
        ctx.fill();
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
