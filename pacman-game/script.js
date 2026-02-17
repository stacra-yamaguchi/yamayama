const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const stageEl = document.getElementById('stage');
const nextStageEl = document.getElementById('next-stage');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const gameWinEl = document.getElementById('game-win');
const winScoreEl = document.getElementById('win-score');
const bestScoreEl = document.getElementById('best-score');
const bestDateEl = document.getElementById('best-date');

const TILE_SIZE = 32;
let ROWS;
let COLS;

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

const MAX_GHOSTS = 4;
const EXTRA_LIFE_SCORE_STEP = 5000;
const MAX_LIVES = 9;
const BEST_SCORE_KEY = 'pacman-best-score-v1';
const BEST_SCORE_AT_KEY = 'pacman-best-score-at-v1';

let mapLayout = [];
let score = 0;
let lives = 3;
let stage = 1;
let nextExtraLifeScore = EXTRA_LIFE_SCORE_STEP;
let superModeTimer = 0;
let animationId;
let gameRunning = false;
let pelletsRemaining = 0;
let smallPelletsRemaining = 0;
let fruit = { x: -1, y: -1, active: false, timer: 0 };
let particles = [];
let floatingTexts = [];
let stageTransition = { active: false, timer: 0, message: '' };
let banner = { text: '', timer: 0, color: '#00ffff' };
let bestScore = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
let bestScoreAt = localStorage.getItem(BEST_SCORE_AT_KEY) || '';

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
let touchStartX = 0;
let touchStartY = 0;
let touchActive = false;

const swipeThreshold = 14;
const ghostChaseRange = TILE_SIZE * 6;
let ghostChaseSpeedMultiplier = 1.15;

const captureAnimation = {
    active: false,
    frame: 0,
    totalFrames: 42,
    ghostColor: '#ff0000'
};

function isCaptureAnimating() {
    return captureAnimation.active;
}

function showBanner(text, color = '#00ffff', duration = 90) {
    banner.text = text;
    banner.color = color;
    banner.timer = duration;
}

function updateBanner() {
    if (banner.timer > 0) banner.timer -= 1;
}

function formatRecordDate(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '-';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function renderBestScore() {
    if (bestScoreEl) bestScoreEl.innerText = bestScore;
    if (bestDateEl) bestDateEl.innerText = formatRecordDate(bestScoreAt);
}

function updateBestScore(currentScore) {
    if (currentScore > bestScore) {
        bestScore = currentScore;
        bestScoreAt = new Date().toISOString();
        localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
        localStorage.setItem(BEST_SCORE_AT_KEY, bestScoreAt);
    }
    renderBestScore();
}

function getStageGhostCount(stageValue) {
    return Math.min(stageValue, MAX_GHOSTS);
}

function getStageGhostBaseSpeed(stageValue) {
    return Math.min(1.85 + (stageValue - 1) * 0.2, 2.9);
}

function getStageChaseMultiplier(stageValue) {
    return Math.min(1.12 + (stageValue - 1) * 0.03, 1.32);
}

function cloneCurrentMap() {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        COLS = 14;
        ROWS = 28;
        return VERTICAL_MAP.map((row) => [...row]);
    }

    COLS = 28;
    ROWS = 14;
    return HORIZONTAL_MAP.map((row) => [...row]);
}

function loadStageMap() {
    mapLayout = cloneCurrentMap();
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;

    pelletsRemaining = 0;
    smallPelletsRemaining = 0;
    for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
            if (mapLayout[r][c] === 2 || mapLayout[r][c] === 3) pelletsRemaining += 1;
            if (mapLayout[r][c] === 2) smallPelletsRemaining += 1;
        }
    }

    fruit.active = false;
    fruit.timer = 0;
}

function startCaptureAnimation(ghostColor) {
    captureAnimation.active = true;
    captureAnimation.frame = 0;
    captureAnimation.ghostColor = ghostColor || '#ff0000';
    createParticles(pacman.x, pacman.y, '#ffff00');
    createParticles(pacman.x, pacman.y, captureAnimation.ghostColor);
    createFloatingText(pacman.x, pacman.y - 12, 'CAUGHT!');
}

function updateCaptureAnimation() {
    if (!captureAnimation.active) return;
    captureAnimation.frame += 1;

    if (captureAnimation.frame % 8 === 0) {
        createParticles(pacman.x, pacman.y, captureAnimation.ghostColor);
    }

    if (captureAnimation.frame >= captureAnimation.totalFrames) {
        captureAnimation.active = false;
        lives -= 1;
        updateLivesUI();

        if (lives <= 0) {
            gameOver();
        } else {
            resetPositions();
            showBanner('READY', '#ffe066', 50);
        }
    }
}

function getSwipeDirection(dx, dy, threshold) {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < threshold && absDy < threshold) return null;
    if (absDx >= absDy) return dx > 0 ? 0 : 2;
    return dy > 0 ? 1 : 3;
}

document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !gameRunning) {
        e.preventDefault();
        resetGame();
        return;
    }

    if (!gameRunning || isCaptureAnimating() || stageTransition.active) return;

    if (e.key === 'ArrowRight' || e.key === 'd') pacman.nextDirection = 0;
    if (e.key === 'ArrowDown' || e.key === 's') pacman.nextDirection = 1;
    if (e.key === 'ArrowLeft' || e.key === 'a') pacman.nextDirection = 2;
    if (e.key === 'ArrowUp' || e.key === 'w') pacman.nextDirection = 3;
});

function handleTouchStart(e) {
    if (!gameRunning || isCaptureAnimating() || stageTransition.active || e.touches.length === 0) return;

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchActive = true;
    e.preventDefault();
}

function handleTouchMove(e) {
    if (!gameRunning || isCaptureAnimating() || stageTransition.active || !touchActive || e.touches.length === 0) return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const swipeDirection = getSwipeDirection(dx, dy, swipeThreshold);

    if (swipeDirection !== null) {
        pacman.nextDirection = swipeDirection;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }

    e.preventDefault();
}

function handleTouchEnd(e) {
    if (!gameRunning || isCaptureAnimating() || stageTransition.active) return;

    if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        const releaseDirection = getSwipeDirection(dx, dy, swipeThreshold);
        if (releaseDirection !== null) pacman.nextDirection = releaseDirection;
    }

    touchActive = false;
    e.preventDefault();
}

function handleTouchCancel(e) {
    touchActive = false;
    e.preventDefault();
}

canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
canvas.addEventListener('touchcancel', handleTouchCancel, { passive: false });

function initGame() {
    score = 0;
    lives = 3;
    stage = 1;
    nextExtraLifeScore = EXTRA_LIFE_SCORE_STEP;
    superModeTimer = 0;

    particles = [];
    floatingTexts = [];
    touchActive = false;
    stageTransition.active = false;
    stageTransition.timer = 0;
    stageTransition.message = '';
    captureAnimation.active = false;
    captureAnimation.frame = 0;

    loadStageMap();
    resetPositions();

    gameOverEl.style.display = 'none';
    gameWinEl.style.display = 'none';
    gameRunning = true;

    showBanner('STAGE 1 START', '#4facfe', 90);
    updateLivesUI();
    updateUI();
    renderBestScore();

    if (animationId) cancelAnimationFrame(animationId);
    update();
}

function resetPositions() {
    const isMobile = COLS === 14;
    const ghostSpeed = getStageGhostBaseSpeed(stage);
    const ghostCount = getStageGhostCount(stage);
    ghostChaseSpeedMultiplier = getStageChaseMultiplier(stage);

    if (isMobile) {
        pacman.x = 6.5 * TILE_SIZE;
        pacman.y = 22.5 * TILE_SIZE;
        const exitY = 8.5 * TILE_SIZE;

        const template = [
            { x: 6.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'red', wait: 0, dir: 3 },
            { x: 5.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'pink', wait: 50, dir: 1 },
            { x: 7.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'cyan', wait: 100, dir: 1 },
            { x: 6.5 * TILE_SIZE, y: 11 * TILE_SIZE, color: 'orange', wait: 150, dir: 1 }
        ];

        ghosts = template.slice(0, ghostCount).map((g, idx) => ({
            x: g.x,
            y: g.y,
            color: g.color,
            spawnX: g.x,
            spawnY: g.y,
            wait: g.wait,
            speed: ghostSpeed,
            baseSpeed: ghostSpeed,
            status: idx === 0 ? 'active' : 'in_house',
            target: idx === 0 ? { x: 6.5 * TILE_SIZE, y: exitY } : null,
            dir: g.dir,
            isChasing: false,
            dx: 0,
            dy: 0
        }));
    } else {
        pacman.x = 13.5 * TILE_SIZE;
        pacman.y = 10.5 * TILE_SIZE;
        const exitY = 4.5 * TILE_SIZE;

        const template = [
            { x: 13.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'red', wait: 0, dir: 3 },
            { x: 12.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'pink', wait: 50, dir: 1 },
            { x: 14.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'cyan', wait: 100, dir: 1 },
            { x: 13.5 * TILE_SIZE, y: 7 * TILE_SIZE, color: 'orange', wait: 150, dir: 1 }
        ];

        ghosts = template.slice(0, ghostCount).map((g, idx) => ({
            x: g.x,
            y: g.y,
            color: g.color,
            spawnX: g.x,
            spawnY: g.y,
            wait: g.wait,
            speed: ghostSpeed,
            baseSpeed: ghostSpeed,
            status: idx === 0 ? 'active' : 'in_house',
            target: idx === 0 ? { x: 13.5 * TILE_SIZE, y: exitY } : null,
            dir: g.dir,
            isChasing: false,
            dx: 0,
            dy: 0
        }));
    }

    pacman.direction = 0;
    pacman.nextDirection = 0;
    superModeTimer = 0;
    captureAnimation.active = false;
    captureAnimation.frame = 0;
}

function updateLivesUI() {
    livesEl.innerText = '❤️'.repeat(lives);
}

function updateUI() {
    scoreEl.innerText = score;
    if (stageEl) stageEl.innerText = stage;
    if (nextStageEl) nextStageEl.innerText = smallPelletsRemaining;
}

function canMove(x, y, dx, dy) {
    const size = TILE_SIZE;
    const nextX = x + dx;
    const nextY = y + dy;

    const left = Math.floor((nextX - 12) / size);
    const right = Math.floor((nextX + 11) / size);
    const top = Math.floor((nextY - 12) / size);
    const bottom = Math.floor((nextY + 11) / size);

    const tiles = [
        mapLayout[top]?.[left],
        mapLayout[top]?.[right],
        mapLayout[bottom]?.[left],
        mapLayout[bottom]?.[right]
    ];

    return !tiles.some((t) => t === 1 || t === 4 || t === 5 || t === undefined);
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

function getNearestCenter(value) {
    return Math.round((value - TILE_SIZE / 2) / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
}

function spawnFruit() {
    if (COLS === 14) {
        fruit.x = 6.5 * TILE_SIZE;
        fruit.y = 12.5 * TILE_SIZE;
    } else {
        fruit.x = 13.5 * TILE_SIZE;
        fruit.y = 10.5 * TILE_SIZE;
    }

    fruit.active = true;
    fruit.timer = 600;
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i += 1) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            color
        });
    }
}

function createFloatingText(x, y, text) {
    floatingTexts.push({ x, y, text, life: 60, dy: -1 });
}

function triggerStageClear() {
    stageTransition.active = true;
    stageTransition.timer = 90;
    stageTransition.message = `STAGE ${stage} CLEAR`;
    createParticles(canvas.width / 2, canvas.height / 2, '#4facfe');
    createParticles(canvas.width / 2, canvas.height / 2, '#ffff00');
}

function beginNextStage() {
    stage += 1;

    loadStageMap();
    resetPositions();

    stageTransition.active = false;
    stageTransition.timer = 0;
    stageTransition.message = '';

    showBanner(`STAGE ${stage} START`, '#4facfe', 90);
    updateUI();
}

function tryApplyTurn() {
    if (pacman.nextDirection === pacman.direction) return;

    if (isOpposite(pacman.nextDirection, pacman.direction)) {
        pacman.direction = pacman.nextDirection;
        return;
    }

    const nextVec = getDirVec(pacman.nextDirection);
    const centerX = getNearestCenter(pacman.x);
    const centerY = getNearestCenter(pacman.y);
    const offsetX = Math.abs(pacman.x - centerX);
    const offsetY = Math.abs(pacman.y - centerY);
    const turnTolerance = 8;
    let canTurnNow = false;

    if (nextVec.dx !== 0 && offsetY <= turnTolerance) {
        if (canMove(pacman.x, centerY, nextVec.dx * (pacman.speed + 1), 0)) {
            pacman.y = centerY;
            canTurnNow = true;
        }
    }

    if (nextVec.dy !== 0 && offsetX <= turnTolerance) {
        if (canMove(centerX, pacman.y, 0, nextVec.dy * (pacman.speed + 1))) {
            pacman.x = centerX;
            canTurnNow = true;
        }
    }

    if (canTurnNow) pacman.direction = pacman.nextDirection;
}

function movePacman() {
    tryApplyTurn();

    const vec = getDirVec(pacman.direction);
    const stepX = vec.dx * pacman.speed;
    const stepY = vec.dy * pacman.speed;

    if (canMove(pacman.x, pacman.y, stepX, stepY)) {
        pacman.x += stepX;
        pacman.y += stepY;

        const centerX = getNearestCenter(pacman.x);
        const centerY = getNearestCenter(pacman.y);

        if (vec.dx !== 0) {
            pacman.y += (centerY - pacman.y) * 0.35;
            if (Math.abs(pacman.y - centerY) < 0.25) pacman.y = centerY;
        } else if (vec.dy !== 0) {
            pacman.x += (centerX - pacman.x) * 0.35;
            if (Math.abs(pacman.x - centerX) < 0.25) pacman.x = centerX;
        }

        pacman.mouthOpen += pacman.mouthSpeed;
        if (pacman.mouthOpen > 0.2 || pacman.mouthOpen < 0) pacman.mouthSpeed *= -1;
    } else {
        const centerX = getNearestCenter(pacman.x);
        const centerY = getNearestCenter(pacman.y);

        if (Math.hypot(pacman.x - centerX, pacman.y - centerY) <= pacman.speed * 1.8) {
            pacman.x = centerX;
            pacman.y = centerY;
            tryApplyTurn();
        }
    }
}

function updateGhosts() {
    let playerCaught = false;

    ghosts.forEach((ghost) => {
        if (playerCaught) return;

        if (ghost.status === 'in_house') {
            ghost.isChasing = false;
            ghost.speed = ghost.baseSpeed;

            if (ghost.wait > 0) {
                ghost.wait -= 1;
            } else {
                ghost.status = 'exiting';
                const exitY = COLS === 14 ? 8.5 * TILE_SIZE : 4.5 * TILE_SIZE;
                const exitX = COLS === 14 ? 6.5 * TILE_SIZE : 13.5 * TILE_SIZE;
                ghost.target = { x: exitX, y: exitY };
            }
            return;
        }

        const distanceToPacman = Math.hypot(pacman.x - ghost.x, pacman.y - ghost.y);
        ghost.isChasing = superModeTimer === 0 && ghost.status === 'active' && distanceToPacman <= ghostChaseRange;
        ghost.speed = ghost.baseSpeed * (ghost.isChasing ? ghostChaseSpeedMultiplier : 1);

        if (ghost.target) {
            const dx = ghost.target.x - ghost.x;
            const dy = ghost.target.y - ghost.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= ghost.speed) {
                ghost.x = ghost.target.x;
                ghost.y = ghost.target.y;

                if (ghost.status === 'exiting') ghost.status = 'active';

                const gx = Math.floor(ghost.x / TILE_SIZE);
                const gy = Math.floor(ghost.y / TILE_SIZE);
                const checks = [
                    { dir: 0, dx: 1, dy: 0 },
                    { dir: 1, dx: 0, dy: 1 },
                    { dir: 2, dx: -1, dy: 0 },
                    { dir: 3, dx: 0, dy: -1 }
                ];

                const possible = checks.filter((c) => {
                    const nx = gx + c.dx;
                    const ny = gy + c.dy;
                    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;

                    const tile = mapLayout[ny][nx];
                    if (tile === 1) return false;
                    if (ghost.status === 'active' && (tile === 4 || tile === 5)) return false;
                    return true;
                });

                let validMoves = possible.filter((c) => Math.abs(c.dir - ghost.dir) !== 2);
                if (validMoves.length === 0) validMoves = possible;

                if (validMoves.length > 0) {
                    let choice;

                    if (ghost.isChasing) {
                        let bestDistance = Infinity;
                        let candidates = [];

                        validMoves.forEach((move) => {
                            const targetX = (gx + move.dx) * TILE_SIZE + TILE_SIZE / 2;
                            const targetY = (gy + move.dy) * TILE_SIZE + TILE_SIZE / 2;
                            const chaseDistance = Math.hypot(pacman.x - targetX, pacman.y - targetY);

                            if (chaseDistance < bestDistance - 0.01) {
                                bestDistance = chaseDistance;
                                candidates = [move];
                            } else if (Math.abs(chaseDistance - bestDistance) < 0.01) {
                                candidates.push(move);
                            }
                        });

                        choice = candidates[Math.floor(Math.random() * candidates.length)];
                    } else {
                        choice = validMoves[Math.floor(Math.random() * validMoves.length)];
                    }

                    ghost.dir = choice.dir;
                    ghost.dx = choice.dx;
                    ghost.dy = choice.dy;
                    ghost.target = {
                        x: (gx + choice.dx) * TILE_SIZE + TILE_SIZE / 2,
                        y: (gy + choice.dy) * TILE_SIZE + TILE_SIZE / 2
                    };
                }
            } else {
                const angle = Math.atan2(dy, dx);
                ghost.x += Math.cos(angle) * ghost.speed;
                ghost.y += Math.sin(angle) * ghost.speed;
            }
        }

        if (Math.hypot(ghost.x - pacman.x, ghost.y - pacman.y) < 22) {
            if (superModeTimer > 0) {
                ghost.status = 'in_house';
                ghost.x = ghost.spawnX;
                ghost.y = ghost.spawnY;
                ghost.wait = Math.max(40, 120 - stage * 4);
                ghost.target = null;
                ghost.isChasing = false;
                ghost.speed = ghost.baseSpeed;

                score += 200;
                createParticles(pacman.x, pacman.y, ghost.color);
                createFloatingText(pacman.x, pacman.y, '200');
            } else {
                playerCaught = true;
                startCaptureAnimation(ghost.color);
            }
        }
    });
}

function updatePelletCollision() {
    const gridX = Math.floor(pacman.x / TILE_SIZE);
    const gridY = Math.floor(pacman.y / TILE_SIZE);

    if (!mapLayout[gridY]) return;

    if (mapLayout[gridY][gridX] === 2) {
        mapLayout[gridY][gridX] = 0;
        score += 10;
        pelletsRemaining -= 1;
        smallPelletsRemaining -= 1;
    } else if (mapLayout[gridY][gridX] === 3) {
        mapLayout[gridY][gridX] = 0;
        score += 50;
        pelletsRemaining -= 1;
        superModeTimer = 600;
    }
}

function updateFruit() {
    if (!fruit.active) {
        if (Math.random() < 0.002) spawnFruit();
        return;
    }

    fruit.timer -= 1;
    if (fruit.timer <= 0) {
        fruit.active = false;
        return;
    }

    if (Math.hypot(pacman.x - fruit.x, pacman.y - fruit.y) < 20) {
        fruit.active = false;
        score += 500;
        createParticles(fruit.x, fruit.y, '#ff0000');
        createFloatingText(fruit.x, fruit.y, '500');
    }
}

function updateEffects() {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life -= 1;
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i -= 1) {
        floatingTexts[i].y += floatingTexts[i].dy;
        floatingTexts[i].life -= 1;
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    updateBanner();
}

function checkExtraLifeProgress() {
    while (score >= nextExtraLifeScore) {
        if (lives < MAX_LIVES) {
            lives += 1;
            updateLivesUI();
            showBanner('1UP!', '#7dff8e', 70);
        }
        nextExtraLifeScore += EXTRA_LIFE_SCORE_STEP;
    }
}

function updateStageTransition() {
    if (!stageTransition.active) return;

    stageTransition.timer -= 1;
    if (stageTransition.timer <= 0) beginNextStage();
}

function update() {
    if (!gameRunning) return;

    updateEffects();

    if (isCaptureAnimating()) {
        updateCaptureAnimation();
        draw();
        animationId = requestAnimationFrame(update);
        return;
    }

    if (stageTransition.active) {
        updateStageTransition();
        draw();
        animationId = requestAnimationFrame(update);
        return;
    }

    if (superModeTimer > 0) superModeTimer -= 1;

    updateFruit();
    movePacman();
    updatePelletCollision();
    updateGhosts();
    checkExtraLifeProgress();

    if (!stageTransition.active && smallPelletsRemaining <= 0) {
        triggerStageClear();
    }

    updateUI();
    draw();
    animationId = requestAnimationFrame(update);
}

function drawWall(x, y) {
    ctx.strokeStyle = '#3333ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
}

function drawFruit(x, y) {
    const isCherry = Math.floor(score / 500) % 2 === 0;

    if (isCherry) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x - 5, y + 5, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + 5, y + 5, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#228b22';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(x - 5, y + 5);
        ctx.quadraticCurveTo(x, y - 5, x, y - 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 5, y + 5);
        ctx.quadraticCurveTo(x, y - 5, x, y - 10);
        ctx.stroke();
    } else {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x - 8, y - 2);
        ctx.quadraticCurveTo(x, y - 10, x + 8, y - 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        for (let i = -4; i <= 4; i += 4) {
            for (let j = -2; j <= 4; j += 3) {
                ctx.fillRect(x + i, y + j, 1, 1);
            }
        }

        ctx.fillStyle = '#228b22';
        ctx.beginPath();
        ctx.arc(x, y - 8, 4, 0, Math.PI, true);
        ctx.fill();
    }
}

function drawPacmanBody() {
    ctx.fillStyle = superModeTimer > 0 ? (superModeTimer % 20 < 10 ? '#fff' : '#ffff00') : '#ffff00';

    ctx.save();
    const mouthAngle = pacman.mouthOpen * Math.PI;
    const rotation = [0, Math.PI / 2, Math.PI, -Math.PI / 2][pacman.direction];
    ctx.translate(pacman.x, pacman.y);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.arc(0, 0, pacman.radius, mouthAngle, 2 * Math.PI - mouthAngle);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.restore();
}

function drawPacmanCaptureAnimation() {
    const progress = Math.min(1, captureAnimation.frame / captureAnimation.totalFrames);
    const collapse = Math.max(0.08, 1 - progress);
    const mouthAngle = Math.min(Math.PI * 0.98, 0.08 + progress * Math.PI);
    const ringRadius = pacman.radius + progress * 20;

    ctx.save();
    const rotation = [0, Math.PI / 2, Math.PI, -Math.PI / 2][pacman.direction];
    ctx.translate(pacman.x, pacman.y);
    ctx.rotate(rotation);
    ctx.fillStyle = `rgba(255, ${Math.floor(255 - progress * 140)}, 0, ${Math.max(0.1, 1 - progress * 0.5)})`;

    ctx.beginPath();
    ctx.arc(0, 0, pacman.radius * collapse, mouthAngle, 2 * Math.PI - mouthAngle);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = `rgba(255, 255, 0, ${Math.max(0, 1 - progress)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pacman.x, pacman.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
}

function drawStageOverlay() {
    if (stageTransition.active) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#4facfe';
        ctx.textAlign = 'center';
        ctx.font = '28px "Press Start 2P"';
        ctx.fillText(stageTransition.message, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }

    if (banner.timer > 0 && banner.text) {
        ctx.save();
        ctx.fillStyle = banner.color;
        ctx.textAlign = 'center';
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText(banner.text, canvas.width / 2, 28);
        ctx.restore();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;
            const tile = mapLayout[r][c];

            if (tile === 1) {
                drawWall(x, y);
            } else if (tile === 2) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === 3) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 8, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === 4) {
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y + TILE_SIZE / 2);
                ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE / 2);
                ctx.stroke();
            }
        }
    }

    if (fruit.active) drawFruit(fruit.x, fruit.y);

    particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    ctx.font = '12px "Press Start 2P"';
    ctx.fillStyle = '#00ffff';
    floatingTexts.forEach((t) => {
        ctx.fillText(t.text, t.x, t.y);
    });

    if (isCaptureAnimating()) drawPacmanCaptureAnimation();
    else drawPacmanBody();

    ghosts.forEach((ghost) => {
        if (ghost.wait > 0 && ghost.status === 'in_house') return;

        ctx.fillStyle = superModeTimer > 0
            ? (superModeTimer < 120 && superModeTimer % 20 < 10 ? '#fff' : '#0000ff')
            : ghost.color;

        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, 12, Math.PI, 0);
        ctx.lineTo(ghost.x + 12, ghost.y + 12);
        ctx.lineTo(ghost.x - 12, ghost.y + 12);
        ctx.fill();

        if (ghost.isChasing && superModeTimer === 0) {
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(ghost.x, ghost.y, 13.5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ghost.x - 4, ghost.y - 2, 4, 0, Math.PI * 2);
        ctx.arc(ghost.x + 4, ghost.y - 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ghost.x - 4, ghost.y - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(ghost.x + 4, ghost.y - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    });

    drawStageOverlay();
}

function gameOver() {
    updateBestScore(score);
    gameRunning = false;
    gameOverEl.style.display = 'block';
    finalScoreEl.innerText = score;
}

function gameWin() {
    updateBestScore(score);
    gameRunning = false;
    gameWinEl.style.display = 'block';
    winScoreEl.innerText = score;
}

function resetGame() {
    initGame();
}

window.onload = initGame;
window.onresize = () => {
    if (!gameRunning) initGame();
};
