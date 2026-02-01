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
const mapLayout = [
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

let score = 0;
let animationId;
let gameRunning = false;
let pelletsRemaining = 0;

const pacman = {
    x: 6.5 * TILE_SIZE,
    y: 4.5 * TILE_SIZE,
    radius: 13,
    direction: 0, // 0: Right, 1: Down, 2: Left, 3: Up
    nextDirection: 0,
    speed: 2,
    mouthOpen: 0,
    mouthSpeed: 0.2
};

const ghosts = [
    { x: 6.5 * TILE_SIZE, y: 9.5 * TILE_SIZE, color: 'red', dx: 1, dy: 0 },
    { x: 7.5 * TILE_SIZE, y: 9.5 * TILE_SIZE, color: 'pink', dx: -1, dy: 0 },
    { x: 5.5 * TILE_SIZE, y: 9.5 * TILE_SIZE, color: 'cyan', dx: 0, dy: -1 }
];

// Input handle
document.addEventListener('keydown', (e) => {
    if(!gameRunning) return;
    if (e.key === 'ArrowRight') pacman.nextDirection = 0;
    if (e.key === 'ArrowDown') pacman.nextDirection = 1;
    if (e.key === 'ArrowLeft') pacman.nextDirection = 2;
    if (e.key === 'ArrowUp') pacman.nextDirection = 3;
});

function initGame() {
    pelletsRemaining = 0;
    // Reset pellets (in a real game we would clone the map)
    // For simplicity, we just count them and don't respawn on simple reset unless reload.
    // Let's actually count pellets from current map state
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            if(mapLayout[r][c] === 2) pelletsRemaining++;
        }
    }
}

// Check collision with walls
function canMove(x, y, dx, dy, radius) {
    const nextX = x + dx * pacman.speed;
    const nextY = y + dy * pacman.speed;
    
    // Use a smaller collision radius for smoother movement
    const collisionRadius = radius - 3;
    
    console.log('canMove check:', {x, y, dx, dy, nextX, nextY, radius, collisionRadius});
    
    // Check four corners of the bounding box
    const corners = [
        { c: Math.floor((nextX - collisionRadius) / TILE_SIZE), r: Math.floor((nextY - collisionRadius) / TILE_SIZE) },
        { c: Math.floor((nextX + collisionRadius) / TILE_SIZE), r: Math.floor((nextY - collisionRadius) / TILE_SIZE) },
        { c: Math.floor((nextX - collisionRadius) / TILE_SIZE), r: Math.floor((nextY + collisionRadius) / TILE_SIZE) },
        { c: Math.floor((nextX + collisionRadius) / TILE_SIZE), r: Math.floor((nextY + collisionRadius) / TILE_SIZE) }
    ];
    
    console.log('Checking corners:', corners);

    for (const corner of corners) {
        const tile = mapLayout[corner.r] && mapLayout[corner.r][corner.c];
        console.log('Corner', corner, 'tile value:', tile);
        if (tile === 1) {
            console.log('WALL DETECTED at', corner);
            return false;
        }
    }
    console.log('No collision, can move!');
    return true;
}

// Convert direction to dx, dy
function getDirVec(dir) {
    if (dir === 0) return { dx: 1, dy: 0 };
    if (dir === 1) return { dx: 0, dy: 1 };
    if (dir === 2) return { dx: -1, dy: 0 };
    if (dir === 3) return { dx: 0, dy: -1 };
    return { dx: 0, dy: 0 };
}

function update() {
    if (!gameRunning) return;

    // --- PACMAN MOVEMENT ---
    // Try to turn
    let vecNext = getDirVec(pacman.nextDirection);
    // Align to center of tile to allow turning?
    // For simplicity, just check collision
    
    // Simplification: Can change direction if no wall there.
    // Also snapping to grid center for clean turns is crucial in Pacman but complex for this scope.
    // We will use a simpler collision: Free movement in corridors.
    
    // Actually, snapping 2D movement usually requires checking if we are close to the center of a tile.
    const tileCenterX = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    const tileCenterY = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    const distToCenter = Math.hypot(pacman.x - tileCenterX, pacman.y - tileCenterY);

    if (distToCenter < pacman.speed + 1) {
        // Close enough to turn
         if (canMove(tileCenterX, tileCenterY, vecNext.dx, vecNext.dy, pacman.radius)) {
            pacman.x = tileCenterX;
            pacman.y = tileCenterY;
            pacman.direction = pacman.nextDirection;
        }
    }

    let vec = getDirVec(pacman.direction);
    const canMoveResult = canMove(pacman.x, pacman.y, vec.dx, vec.dy, pacman.radius);
    console.log('Trying to move:', {x: pacman.x, y: pacman.y, direction: pacman.direction, vec, canMoveResult});
    if (canMoveResult) {
        pacman.x += vec.dx * pacman.speed;
        pacman.y += vec.dy * pacman.speed;
        
        // Face animation
        pacman.mouthOpen += pacman.mouthSpeed;
        if (pacman.mouthOpen > 0.2 || pacman.mouthOpen < 0) pacman.mouthSpeed *= -1;
    } else {
        console.log('Movement blocked!');
    }

    // --- PELLET EATING ---
    const gridX = Math.floor(pacman.x / TILE_SIZE);
    const gridY = Math.floor(pacman.y / TILE_SIZE);
    
    if (mapLayout[gridY][gridX] === 2) {
        mapLayout[gridY][gridX] = 0;
        score += 10;
        scoreEl.innerText = score;
        pelletsRemaining--;
        if(pelletsRemaining <= 0) {
            gameWin();
        }
    }

    // --- GHOST MOVEMENT ---
    ghosts.forEach(ghost => {
        // Simple AI: Move until hit wall, then random turn
        // Check collision ahead
        const nextGX = ghost.x + ghost.dx * 2;
        const nextGY = ghost.y + ghost.dy * 2;
        
        // Wall check for ghost (center point mostly)
        const gCol = Math.floor(nextGX / TILE_SIZE);
        const gRow = Math.floor(nextGY / TILE_SIZE);

        if (mapLayout[gRow][gCol] === 1) {
            // Hit wall, pick random direction
            const dirs = [
                { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
            ];
            // Filter valid dirs
            const validDirs = dirs.filter(d => {
                const tx = Math.floor((ghost.x + d.dx * TILE_SIZE) / TILE_SIZE);
                const ty = Math.floor((ghost.y + d.dy * TILE_SIZE) / TILE_SIZE);
                return mapLayout[ty][tx] !== 1;
            });
            
            if(validDirs.length > 0) {
                const rand = validDirs[Math.floor(Math.random() * validDirs.length)];
                ghost.dx = rand.dx;
                ghost.dy = rand.dy;
            } else {
                 ghost.dx *= -1;
                 ghost.dy *= -1;
            }
        }
        
        ghost.x += ghost.dx * 2;
        ghost.y += ghost.dy * 2;

        // Collision with Pacman
        const dist = Math.hypot(ghost.x - pacman.x, ghost.y - pacman.y);
        if (dist < pacman.radius + 10) {
            gameOver();
        }
    });

    draw();
    animationId = requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Map
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            const type = mapLayout[r][c];
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;

            if (type === 1) {
                ctx.fillStyle = '#0000ff';
                ctx.strokeStyle = '#000088';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            } else if (type === 2) {
                ctx.fillStyle = '#ffb8ae';
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 4, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    // Draw Pacman
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    const mouthAngle = pacman.mouthOpen * Math.PI;
    let rotation = 0;
    if(pacman.direction === 1) rotation = Math.PI / 2;
    if(pacman.direction === 2) rotation = Math.PI;
    if(pacman.direction === 3) rotation = -Math.PI / 2;

    ctx.translate(pacman.x, pacman.y);
    ctx.rotate(rotation);
    ctx.arc(0, 0, pacman.radius, mouthAngle, 2 * Math.PI - mouthAngle);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Draw Ghosts
    ghosts.forEach(ghost => {
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, 12, Math.PI, 0); // Head
        ctx.lineTo(ghost.x + 12, ghost.y + 12);
        ctx.lineTo(ghost.x - 12, ghost.y + 12);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ghost.x - 4, ghost.y - 2, 4, 0, Math.PI*2);
        ctx.arc(ghost.x + 4, ghost.y - 2, 4, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ghost.x - 4, ghost.y - 2, 1.5, 0, Math.PI*2);
        ctx.arc(ghost.x + 4, ghost.y - 2, 1.5, 0, Math.PI*2);
        ctx.fill();
    });
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    gameOverEl.style.display = 'block';
    finalScoreEl.innerText = score;
}

function gameWin() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    gameWinEl.style.display = 'block';
    winScoreEl.innerText = score;
}

function resetGame() {
    location.reload(); // Simple reload to reset map arrays
}

// Start
initGame();
gameRunning = true;
update();
