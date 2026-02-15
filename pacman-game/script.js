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
        // status: 'in_house', 'exiting', 'active'
        // 'target' is used for 'active' and 'exiting' state movement
        ghosts = [
            { x: 6.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'red',    spawnX: 6.5 * TILE_SIZE, spawnY: 11 * TILE_SIZE, wait: 0,   speed: ghostSpeed, status: 'active',   target: {x: 6.5 * TILE_SIZE, y: exitY}, dir: 3 }, // spawn immediately targets exit
            { x: 5.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'pink',   spawnX: 5.5 * TILE_SIZE, spawnY: 11 * TILE_SIZE, wait: 60,  speed: ghostSpeed, status: 'in_house', target: null, dir: 1 },
            { x: 7.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'cyan',   spawnX: 7.5 * TILE_SIZE, spawnY: 11 * TILE_SIZE, wait: 120, speed: ghostSpeed, status: 'in_house', target: null, dir: 1 },
            { x: 6.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'orange', spawnX: 6.5 * TILE_SIZE, spawnY: 11 * TILE_SIZE, wait: 180, speed: ghostSpeed, status: 'in_house', target: null, dir: 1 }
        ];
    } else {
        pacman.x = 13.5 * TILE_SIZE; pacman.y = 10.5 * TILE_SIZE;
        const exitY = 4.5 * TILE_SIZE;
        ghosts = [
            { x: 13.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'red',    spawnX: 13.5 * TILE_SIZE, spawnY: 7 * TILE_SIZE, wait: 0,   speed: ghostSpeed, status: 'active',   target: {x: 13.5 * TILE_SIZE, y: exitY}, dir: 3 },
            { x: 12.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'pink',   spawnX: 12.5 * TILE_SIZE, spawnY: 7 * TILE_SIZE, wait: 60,  speed: ghostSpeed, status: 'in_house', target: null, dir: 1 },
            { x: 14.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'cyan',   spawnX: 14.5 * TILE_SIZE, spawnY: 7 * TILE_SIZE, wait: 120, speed: ghostSpeed, status: 'in_house', target: null, dir: 1 },
            { x: 13.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'orange', spawnX: 13.5 * TILE_SIZE, spawnY: 7 * TILE_SIZE, wait: 180, speed: ghostSpeed, status: 'in_house', target: null, dir: 1 }
        ];
    }
    pacman.direction = 0; pacman.nextDirection = 0;
    superModeTimer = 0;
}

function updateLivesUI() {
    livesEl.innerText = "❤️".repeat(lives);
}

function canMove(x, y, dx, dy) {
    // Pacman collision check
    const margin = 2; 
    const size = TILE_SIZE;
    // Check next position corners
    const nextX = x + dx;
    const nextY = y + dy;
    
    // Convert corners to grid coordinates
    const left = Math.floor((nextX - 12) / size);
    const right = Math.floor((nextX + 11) / size); // width-1
    const top = Math.floor((nextY - 12) / size);
    const bottom = Math.floor((nextY + 11) / size);

    // Check all touched tiles
    const tiles = [
        mapLayout[top]?.[left],
        mapLayout[top]?.[right],
        mapLayout[bottom]?.[left],
        mapLayout[bottom]?.[right]
    ];

    // If any touched tile is a wall (1) or house (5) or gate (4), block
    // Pacman cannot enter 4 or 5
    return !tiles.some(t => t === 1 || t === 4 || t === 5 || t === undefined);
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

    // Particles & Floating Text Logic
    for(let i=particles.length-1; i>=0; i--) {
        particles[i].x += particles[i].vx; particles[i].y += particles[i].vy;
        particles[i].life--; if(particles[i].life <= 0) particles.splice(i, 1);
    }
    for(let i=floatingTexts.length-1; i>=0; i--) {
        floatingTexts[i].y += floatingTexts[i].dy;
        floatingTexts[i].life--; if(floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    // Fruit Logic
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

    // Pacman Movement (Physical Logic)
    const centerX = Math.floor(pacman.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    const centerY = Math.floor(pacman.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

    if (pacman.nextDirection !== pacman.direction) {
        if (isOpposite(pacman.nextDirection, pacman.direction)) {
            pacman.direction = pacman.nextDirection;
        } else {
            const nextVec = getDirVec(pacman.nextDirection);
            // Snap check for turning
            if (Math.abs(pacman.x - centerX) <= pacman.speed && Math.abs(pacman.y - centerY) <= pacman.speed) {
                if (canMove(centerX, centerY, nextVec.dx * 3, nextVec.dy * 3)) { // Look ahead
                    pacman.x = centerX; pacman.y = centerY;
                    pacman.direction = pacman.nextDirection;
                }
            }
        }
    }

    const vec = getDirVec(pacman.direction);
    if (canMove(pacman.x, pacman.y, vec.dx * pacman.speed, vec.dy * pacman.speed)) {
        pacman.x += vec.dx * pacman.speed; pacman.y += vec.dy * pacman.speed;
        
        // Axis locking to center
        if (vec.dx !== 0) {
            if (Math.abs(pacman.y - centerY) < pacman.speed) pacman.y = centerY;
        } else if (vec.dy !== 0) {
            if (Math.abs(pacman.x - centerX) < pacman.speed) pacman.x = centerX;
        }
        
        pacman.mouthOpen += pacman.mouthSpeed;
        if (pacman.mouthOpen > 0.2 || pacman.mouthOpen < 0) pacman.mouthSpeed *= -1;
    } else { 
        // Hit wall, snap to center if close
        if (Math.hypot(pacman.x - centerX, pacman.y - centerY) < pacman.speed*2) {
             pacman.x = centerX; pacman.y = centerY; 
        }
    }

    // Pellet Collision
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

    // Ghosts Movement (Target Tile Logic)
    ghosts.forEach(ghost => {
        if (ghost.status === 'in_house') {
            if (ghost.wait > 0) ghost.wait--;
            else {
                ghost.status = 'exiting';
                // Set initial target to exit position
                const exitY = (COLS === 14) ? 8.5 * TILE_SIZE : 4.5 * TILE_SIZE;
                const exitX = (COLS === 14) ? 6.5 * TILE_SIZE : 13.5 * TILE_SIZE;
                ghost.target = {x: exitX, y: exitY};
            }
            return;
        }

        // Move towards target
        if (ghost.target) {
            const dx = ghost.target.x - ghost.x;
            const dy = ghost.target.y - ghost.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= ghost.speed) {
                // Reached target! Snap and decide next
                ghost.x = ghost.target.x;
                ghost.y = ghost.target.y;
                
                // If were exiting, now we are active
                if (ghost.status === 'exiting') {
                    ghost.status = 'active';
                }

                // Decide next target
                const gx = Math.floor(ghost.x / TILE_SIZE);
                const gy = Math.floor(ghost.y / TILE_SIZE);
                
                const possibleDirs = [];
                // Check all 4 triggers
                const checks = [
                    { dir: 0, dx: 1, dy: 0 },
                    { dir: 1, dx: 0, dy: 1 },
                    { dir: 2, dx: -1, dy: 0 },
                    { dir: 3, dx: 0, dy: -1 }
                ];

                checks.forEach(c => {
                    // Don't reverse immediately unless forced
                    if (Math.abs(c.dir - ghost.dir) === 2 && checks.length > 1) return; // Wait, we verify valid paths first

                    const nx = gx + c.dx;
                    const ny = gy + c.dy;
                    
                    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                        const tile = mapLayout[ny][nx];
                        if (tile !== 1) { // Not a wall
                            // If house tile (5), only allow if fleeing or dead end? 
                            // Standard pacman ghosts can't re-enter house.
                            if (tile !== 5 && tile !== 4) {
                                possibleDirs.push(c);
                            }
                        }
                    }
                });

                // Filter out reverse if possible
                let validMoves = possibleDirs.filter(d => Math.abs(d.dir - ghost.dir) !== 2);
                if (validMoves.length === 0) validMoves = possibleDirs; // Forced reverse (dead end)

                if (validMoves.length > 0) {
                    // Pick random for now (basic AI)
                    const choice = validMoves[Math.floor(Math.random() * validMoves.length)];
                    ghost.dir = choice.dir;
                    ghost.target = {
                        x: (gx + choice.dx) * TILE_SIZE + TILE_SIZE/2,
                        y: (gy + choice.dy) * TILE_SIZE + TILE_SIZE/2
                    };
                    ghost.dx = choice.dx; // Visuals
                    ghost.dy = choice.dy; // Visuals
                } else {
                    // stuck?
                    ghost.dir = (ghost.dir + 2) % 4; // reverse
                }

            } else {
                // Keep moving
                const angle = Math.atan2(dy, dx);
                ghost.x += Math.cos(angle) * ghost.speed;
                ghost.y += Math.sin(angle) * ghost.speed;
            }
        }

        // Collision with Pacman
        if (Math.hypot(ghost.x - pacman.x, ghost.y - pacman.y) < 22) {
             if (superModeTimer > 0) {
                 ghost.status = 'in_house';
                 ghost.x = ghost.spawnX; ghost.y = ghost.spawnY; ghost.wait = 120;
                 ghost.target = null;
                 score += 200; scoreEl.innerText = score;
                 createParticles(pacman.x, pacman.y, ghost.color);
                 createFloatingText(pacman.x, pacman.y, "200");
             } else { 
                 lives--; updateLivesUI(); 
                 if (lives <= 0) gameOver(); else resetPositions(); 
             }
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
