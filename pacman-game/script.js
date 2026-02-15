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
    [1,2,1,1,1,2,1,1,2,1,1,2,2,1],
    [1,2,2,2,2,2,1,1,2,2,2,2,2,1],
    [1,1,1,2,1,1,1,1,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,1,1,2,2,2,2,2,1],
    [1,1,1,1,1,2,2,2,2,1,1,1,1,1],
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
let particles = [];
let floatingTexts = [];

const pacman = {
    x: 0,
    y: 0,
    radius: 13,
    direction: 0,
    nextDirection: 0,
    speed: 3,
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
    particles = [];
    floatingTexts = [];
    if (animationId) cancelAnimationFrame(animationId);
    update();
}

function resetPositions() {
    const isMobile = COLS === 14;
    const ghostSpeed = 2; 
    
    if (isMobile) {
        pacman.x = 6.5 * TILE_SIZE; pacman.y = 22.5 * TILE_SIZE;
        const exitY = 8.5 * TILE_SIZE;
        ghosts = [
            { x: 6.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'red', dx: 0, dy: -1, spawnX: 6.5 * TILE_SIZE, spawnY: 11 * TILE_SIZE, wait: 0, speed: ghostSpeed, status: 'active', exitTarget: {x: 6.5 * TILE_SIZE, y: exitY}, lastPos: {x:0,y:0}, stuckFrames: 0 },
            { x: 5.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'pink', dx: 0, dy: 0, spawnX: 5.5 * TILE_SIZE, spawnY: 11 * TILE_SIZE, wait: 60, speed: ghostSpeed, status: 'in_house', exitTarget: {x: 6.5 * TILE_SIZE, y: exitY}, lastPos: {x:0,y:0}, stuckFrames: 0 },
            { x: 7.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'cyan', dx: 0, dy: 0, spawnX: 7.5 * TILE_SIZE, spawnY: 11 * TILE_SIZE, wait: 120, speed: ghostSpeed, status: 'in_house', exitTarget: {x: 6.5 * TILE_SIZE, y: exitY}, lastPos: {x:0,y:0}, stuckFrames: 0 },
            { x: 6.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'orange', dx: 0, dy: 0, spawnX: 6.5 * TILE_SIZE, spawnY: 11 * TILE_SIZE, wait: 180, speed: ghostSpeed, status: 'in_house', exitTarget: {x: 6.5 * TILE_SIZE, y: exitY}, lastPos: {x:0,y:0}, stuckFrames: 0 }
        ];
    } else {
        pacman.x = 13.5 * TILE_SIZE; pacman.y = 10.5 * TILE_SIZE;
        const exitY = 4.5 * TILE_SIZE;
        ghosts = [
            { x: 13.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'red', dx: 0, dy: -1, spawnX: 13.5 * TILE_SIZE, spawnY: 7 * TILE_SIZE, wait: 0, speed: ghostSpeed, status: 'active', exitTarget: {x: 13.5 * TILE_SIZE, y: exitY}, lastPos: {x:0,y:0}, stuckFrames: 0 },
            { x: 12.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'pink', dx: 0, dy: 0, spawnX: 12.5 * TILE_SIZE, spawnY: 7 * TILE_SIZE, wait: 60, speed: ghostSpeed, status: 'in_house', exitTarget: {x: 13.5 * TILE_SIZE, y: exitY}, lastPos: {x:0,y:0}, stuckFrames: 0 },
            { x: 14.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'cyan', dx: 0, dy: 0, spawnX: 14.5 * TILE_SIZE, spawnY: 7 * TILE_SIZE, wait: 120, speed: ghostSpeed, status: 'in_house', exitTarget: {x: 13.5 * TILE_SIZE, y: exitY}, lastPos: {x:0,y:0}, stuckFrames: 0 },
            { x: 13.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'orange', dx: 0, dy: 0, spawnX: 13.5 * TILE_SIZE, spawnY: 7 * TILE_SIZE, wait: 180, speed: ghostSpeed, status: 'in_house', exitTarget: {x: 13.5 * TILE_SIZE, y: exitY}, lastPos: {x:0,y:0}, stuckFrames: 0 }
        ];
    }
    pacman.direction = 0; pacman.nextDirection = 0;
    superModeTimer = 0;
}

function updateLivesUI() {
    livesEl.innerText = "❤️".repeat(lives);
}

function canMove(x, y, dx, dy, isGhost = false) {
    const margin = 2; 
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
        if (tile === 1) return false;
        if (!isGhost && (tile === 5 || tile === 4)) return false;
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

function createParticles(x, y, color) {
    for(let i=0; i<8; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            color: color
        });
    }
}

function createFloatingText(x, y, text) {
    floatingTexts.push({ x: x, y: y, text: text, life: 60, dy: -1 });
}

function update() {
    if (!gameRunning) return;
    if (superModeTimer > 0) superModeTimer--;

    // Particles
    for(let i=particles.length-1; i>=0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life--;
        if(particles[i].life <= 0) particles.splice(i, 1);
    }
    // Floating Texts
    for(let i=floatingTexts.length-1; i>=0; i--) {
        floatingTexts[i].y += floatingTexts[i].dy;
        floatingTexts[i].life--;
        if(floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    if (!fruit.active) {
        if (Math.random() < 0.002) spawnFruit();
    } else {
        fruit.timer--;
        if (fruit.timer <= 0) fruit.active = false;
        if (Math.hypot(pacman.x - fruit.x, pacman.y - fruit.y) < 20) {
            fruit.active = false; score += 500; scoreEl.innerText = score;
            createParticles(fruit.x, fruit.y, '#ff0000');
            createFloatingText(fruit.x, fruit.y, "500");
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
        
        // --- Status Logic ---
        if (ghost.status === 'in_house') {
            ghost.status = 'exiting';
            ghost.stuckFrames = 0;
            ghost.lastPos = {x: ghost.x, y: ghost.y};
        }
        
        if (ghost.status === 'exiting') {
            const tx = ghost.exitTarget.x;
            const ty = ghost.exitTarget.y;
            const dx = tx - ghost.x;
            const dy = ty - ghost.y;
            const dist = Math.hypot(dx, dy);
            const speed = ghost.speed;
            
            if (dist < speed) {
                ghost.x = tx; ghost.y = ty;
                ghost.dx = (Math.random() < 0.5 ? 1 : -1); ghost.dy = 0;
                ghost.status = 'active';
                ghost.stuckFrames = 0;
            } else {
                const angle = Math.atan2(dy, dx);
                ghost.x += Math.cos(angle) * speed;
                ghost.y += Math.sin(angle) * speed;
                if (Math.abs(dx) > Math.abs(dy)) { ghost.dx = Math.sign(dx); ghost.dy = 0; }
                else { ghost.dx = 0; ghost.dy = Math.sign(dy); }
            }
            return;
        }
        
        // --- Active Logic ---
        const movedDist = Math.hypot(ghost.x - ghost.lastPos.x, ghost.y - ghost.lastPos.y);
        if (movedDist < 0.2) ghost.stuckFrames++; else ghost.stuckFrames = 0;
        ghost.lastPos = {x: ghost.x, y: ghost.y};

        if (ghost.stuckFrames > 180) {
             ghost.status = 'exiting'; 
             ghost.x = ghost.spawnX; 
             ghost.y = ghost.spawnY;
             ghost.stuckFrames = 0;
             return;
        }

        const gCenterX = Math.floor(ghost.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const gCenterY = Math.floor(ghost.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        const currentGridX = Math.floor(gCenterX / TILE_SIZE);
        const currentGridY = Math.floor(gCenterY / TILE_SIZE);

        if (Math.abs(ghost.x - gCenterX) <= ghost.speed && Math.abs(ghost.y - gCenterY) <= ghost.speed) {
            ghost.x = gCenterX; 
            ghost.y = gCenterY;
            
            const dirs = [{dx:1, dy:0}, {dx:-1, dy:0}, {dx:0, dy:1}, {dx:0, dy:-1}];
            // FIX: Check neighbor tile directly
            const validDirs = dirs.filter(d => {
                if (d.dx === -ghost.dx && d.dy === -ghost.dy) return false;
                const nx = currentGridX + d.dx;
                const ny = currentGridY + d.dy;
                // Boundary check
                if(nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
                const tile = mapLayout[ny][nx];
                // Allow movement if not a wall (1)
                // Ghosts can enter 5 (House) and 4 (Gate) usually? 
                // Let's block 5 to prevent re-entering house randomly
                return tile !== 1 && tile !== 5; 
            });
            
            if (validDirs.length > 0) {
                const rand = validDirs[Math.floor(Math.random() * validDirs.length)];
                ghost.dx = rand.dx; ghost.dy = rand.dy; 
            } else {
                // Dead end
                const reverseDir = {dx: -ghost.dx, dy: -ghost.dy};
                const nx = currentGridX + reverseDir.dx;
                const ny = currentGridY + reverseDir.dy;
                // Check if reverse is basically valid (not wall)
                if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && mapLayout[ny][nx] !== 1) {
                    ghost.dx = reverseDir.dx; ghost.dy = reverseDir.dy;
                } else {
                    // Force ANY valid dir
                    const anyDirs = dirs.filter(d => {
                        const nx = currentGridX + d.dx;
                        const ny = currentGridY + d.dy;
                        if(nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
                        return mapLayout[ny][nx] !== 1;
                    });
                    if (anyDirs.length > 0) {
                        ghost.dx = anyDirs[0].dx; ghost.dy = anyDirs[0].dy;
                    } else {
                        // Truly stuck, reverse anyway
                        ghost.dx *= -1; ghost.dy *= -1;
                    }
                }
            }
        }
        
        if (canMove(ghost.x, ghost.y, ghost.dx, ghost.dy, true)) {
            ghost.x += ghost.dx * ghost.speed; 
            ghost.y += ghost.dy * ghost.speed;
        } else {
            ghost.x = gCenterX; ghost.y = gCenterY;
        }
        
        if (Math.hypot(ghost.x - pacman.x, ghost.y - pacman.y) < 22) {
            if (superModeTimer > 0) {
                ghost.status = 'in_house';
                ghost.x = ghost.spawnX; ghost.y = ghost.spawnY; ghost.wait = 120;
                score += 200; scoreEl.innerText = score;
                createParticles(pacman.x, pacman.y, ghost.color);
                createFloatingText(pacman.x, pacman.y, "200");
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

function drawFruit(x, y) {
    const isCherry = Math.floor(score / 500) % 2 === 0;
    if (isCherry) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(x - 5, y + 5, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 5, y + 5, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#228b22'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 5, y + 5); ctx.quadraticCurveTo(x, y - 5, x, y - 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 5, y + 5); ctx.quadraticCurveTo(x, y - 5, x, y - 10); ctx.stroke();
    } else {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x - 8, y - 2); ctx.quadraticCurveTo(x, y - 10, x + 8, y - 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        for(let i=-4; i<=4; i+=4) { for(let j=-2; j<=4; j+=3) { ctx.fillRect(x+i, y+j, 1, 1); } }
        ctx.fillStyle = '#228b22';
        ctx.beginPath(); ctx.arc(x, y - 8, 4, 0, Math.PI, true); ctx.fill();
    }
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
    if (fruit.active) drawFruit(fruit.x, fruit.y);
    
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    ctx.font = '12px "Press Start 2P"';
    ctx.fillStyle = '#00ffff';
    floatingTexts.forEach(t => {
        ctx.fillText(t.text, t.x, t.y);
    });

    ctx.fillStyle = superModeTimer > 0 ? (superModeTimer % 20 < 10 ? '#fff' : '#ffff00') : '#ffff00';
    ctx.beginPath();
    const mouthAngle = pacman.mouthOpen * Math.PI;
    const rotation = [0, Math.PI/2, Math.PI, -Math.PI/2][pacman.direction];
    ctx.translate(pacman.x, pacman.y); ctx.rotate(rotation);
    ctx.arc(0, 0, pacman.radius, mouthAngle, 2 * Math.PI - mouthAngle); ctx.lineTo(0, 0); ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ghosts.forEach(ghost => {
        if (ghost.wait > 0 && ghost.status === 'in_house') return;
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
