const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const livesBottomEl = document.getElementById('lives-bottom');
const bombersBottomEl = document.getElementById('bombers-bottom');
const bestScoreEl = document.getElementById('best-score');
const bestDateEl = document.getElementById('best-date');
const BEST_SCORE_KEY = 'shooting-best-score-v1';
const BEST_SCORE_AT_KEY = 'shooting-best-score-at-v1';
let bestScore = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
let bestScoreAt = localStorage.getItem(BEST_SCORE_AT_KEY) || '';

// Transparency Helper
function createTransparentImage(img) {
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    offCanvas.width = img.width;
    offCanvas.height = img.height;
    offCtx.drawImage(img, 0, 0);
    const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // More robust threshold for dark backgrounds
        if (data[i] < 60 && data[i + 1] < 60 && data[i + 2] < 60) data[i + 3] = 0;
    }
    offCtx.putImageData(imageData, 0, 0);
    return offCanvas;
}

// Global Image Store
const images = {
    player: { src: 'images/player_ship.png', p: null },
    enemy: { src: 'images/enemy_ship.png', p: null },
    enemyBullet: { src: 'images/enemy_bullet.png', p: null },
    icons: { src: 'images/icons_sheet.png', p: null },
    boss1: { src: 'images/boss_ship.png', p: null },
    boss2: { src: 'images/boss_grass.png', p: null },
    boss3: { src: 'images/boss_desert.png', p: null },
    boss4: { src: 'images/boss_ice.png', p: null },
    boss5: { src: 'images/boss_volcano.png', p: null },
    boss6: { src: 'images/boss_ocean.png', p: null },
    boss7: { src: 'images/boss_cyber.png', p: null },
    boss8: { src: 'images/boss_ruins.png', p: null },
    boss9: { src: 'images/boss_clouds.png', p: null },
    boss10: { src: 'images/boss_void.png', p: null },
    bg1: { src: '', p: null },
    bg2: { src: 'images/bg_grassland.png', p: null },
    bg3: { src: 'images/bg_desert.png', p: null },
    bg4: { src: 'images/bg_ice.png', p: null },
    bg5: { src: 'images/bg_volcano.png', p: null },
    bg6: { src: 'images/bg_ocean.png', p: null },
    bg7: { src: 'images/bg_cyber.png', p: null },
    bg8: { src: 'images/bg_ruins.png', p: null },
    bg9: { src: 'images/bg_clouds.png', p: null },
    bg10: { src: 'images/bg_void.png', p: null }
};

// Power-up mapping for icons sheet (3x3 grid)
const iconMap = {
    LIGHTNING: { x: 0, y: 0 },
    FIRE: { x: 1, y: 0 },
    WATER: { x: 2, y: 0 },
    LEAF: { x: 0, y: 1 },
    GOLD: { x: 1, y: 1 },
    RAINBOW: { x: 2, y: 1 },
    BOMBER: { x: 0, y: 2 }
};

Object.keys(images).forEach(key => {
    if (!images[key].src) return;
    const img = new Image();
    img.src = images[key].src;
    img.onload = () => {
        if (key.startsWith('bg')) images[key].p = img;
        else images[key].p = createTransparentImage(img);
    };
});

// Levels (Extended to 10)
const levelConfigs = [
    { name: 'Space', bg: 'bg1', boss: 'boss1', bossHp: 50, dist: 2000 },
    { name: 'Grassland', bg: 'bg2', boss: 'boss2', bossHp: 100, dist: 2000 },
    { name: 'Desert', bg: 'bg3', boss: 'boss3', bossHp: 150, dist: 2000 },
    { name: 'Ice World', bg: 'bg4', boss: 'boss4', bossHp: 200, dist: 2000 },
    { name: 'Volcano', bg: 'bg5', boss: 'boss5', bossHp: 300, dist: 3000 },
    { name: 'Deep Ocean', bg: 'bg6', boss: 'boss6', bossHp: 400, dist: 3000 },
    { name: 'Cyber City', bg: 'bg7', boss: 'boss7', bossHp: 500, dist: 3500 },
    { name: 'Ancient Ruins', bg: 'bg8', boss: 'boss8', bossHp: 600, dist: 4000 },
    { name: 'Cloud Kingdom', bg: 'bg9', boss: 'boss9', bossHp: 800, dist: 4500 },
    { name: 'The Void', bg: 'bg10', boss: 'boss10', bossHp: 1200, dist: 5000 }
];

// Game State
let currentLevelIdx = 0;
let loopCount = 1;
let isGameOver = false;
let score = 0;
let lastExtraLifeScore = 0;
let frames = 0;
let distance = 0;
let bossMode = false;
let shakeTime = 0;

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

// --- Sound System ---
class SoundSystem {
    constructor() {
        this.ctx = null;
        this.bgmOsc = null;
        this.bgmGain = null;
    }
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    playShoot() {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(400, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + 0.1);
    }
    playExplosion() {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(100, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
        g.gain.setValueAtTime(0.2, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + 0.3);
    }
    playPowerUp() {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(440, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.2);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + 0.2);
    }
    startBGM() {
        if (!this.ctx) return;
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.05;
        this.bgmGain.connect(this.ctx.destination);
        this.loopBGM();
    }
    loopBGM() {
        const notes = [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25];
        let step = 0;
        setInterval(() => {
            if (!this.ctx || isGameOver) return;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'triangle';
            const freq = bossMode ? notes[step % 4] * 0.5 : notes[step % notes.length];
            o.frequency.setValueAtTime(freq, this.ctx.currentTime);
            g.gain.setValueAtTime(0.05, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
            o.connect(g); g.connect(this.bgmGain);
            o.start(); o.stop(this.ctx.currentTime + 0.2);
            step++;
        }, 200);
    }
}
const sound = new SoundSystem();

function startGame() {
    document.getElementById('start-overlay').style.display = 'none';
    sound.init();
    sound.startBGM();
    if (isGameOver) resetGame();
    else loop();
}

// Entities
const player = { 
    x: canvas.width / 2, 
    y: canvas.height - 100, 
    width: 60, 
    height: 60, 
    speed: 6,
    lives: 3,
    bombers: 1,
    invincibilityFrames: 0,
    powerLevel: 0,
    weaponType: 'NORMAL', // LIGHTNING, FIRE, WATER, LEAF, NORMAL
    lastHitFrame: 0
};

let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let items = [];
let boss = null;
let keys = {};
const moveKeyCodes = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
const mobileTouchLeadOffset = { x: 0, y: 96 };
const mobileButtons = {
    up: document.getElementById('btn-up'),
    down: document.getElementById('btn-down'),
    left: document.getElementById('btn-left'),
    right: document.getElementById('btn-right'),
    shoot: document.getElementById('btn-shoot'),
    bomber: document.getElementById('btn-bomber')
};
let autoShootTimer = null;
let activeCanvasTouchId = null;
let bomberTapLockUntil = 0;

function firePlayerShot() {
    if (isGameOver) return;
    shoot();
    sound.playShoot();
}

function startAutoShoot() {
    if (isGameOver || autoShootTimer !== null) return;
    firePlayerShot();
    autoShootTimer = window.setInterval(() => {
        if (isGameOver) { stopAutoShoot(); return; }
        firePlayerShot();
    }, 130);
}

function stopAutoShoot() {
    if (autoShootTimer === null) return;
    clearInterval(autoShootTimer);
    autoShootTimer = null;
}

function resetMovementKeys() {
    moveKeyCodes.forEach(code => { keys[code] = false; });
}

function clearMobileInputState() {
    resetMovementKeys();
    stopAutoShoot();
    activeCanvasTouchId = null;
}

function bindHoldButton(button, onPress, onRelease) {
    if (!button) return;
    const press = (e) => {
        e.preventDefault();
        if ('pointerId' in e && button.setPointerCapture) button.setPointerCapture(e.pointerId);
        onPress();
    };
    const release = (e) => {
        e.preventDefault();
        onRelease();
    };
    button.addEventListener('contextmenu', e => e.preventDefault());
    if (window.PointerEvent) {
        button.addEventListener('pointerdown', press);
        button.addEventListener('pointerup', release);
        button.addEventListener('pointercancel', release);
        button.addEventListener('pointerleave', release);
    } else {
        button.addEventListener('touchstart', press, { passive: false });
        button.addEventListener('touchend', release, { passive: false });
        button.addEventListener('touchcancel', release, { passive: false });
        button.addEventListener('mousedown', press);
        button.addEventListener('mouseup', release);
        button.addEventListener('mouseleave', release);
    }
}

function bindPressButton(button, onPress) {
    if (!button) return;
    const press = (e) => {
        e.preventDefault();
        onPress();
    };
    button.addEventListener('contextmenu', e => e.preventDefault());
    if (window.PointerEvent) {
        button.addEventListener('pointerdown', press);
    } else {
        button.addEventListener('touchstart', press, { passive: false });
        button.addEventListener('mousedown', press);
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function movePlayerToClient(clientX, clientY, useMobileTouchLead = false) {
    if (isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const leadX = useMobileTouchLead ? mobileTouchLeadOffset.x : 0;
    const leadY = useMobileTouchLead ? mobileTouchLeadOffset.y : 0;
    const x = (clientX - rect.left) * scaleX + leadX;
    const y = (clientY - rect.top) * scaleY - leadY;
    player.x = clamp(x, 30, canvas.width - 30);
    player.y = clamp(y, 30, canvas.height - 30);
}

bindHoldButton(mobileButtons.left, () => { keys['ArrowLeft'] = true; }, () => { keys['ArrowLeft'] = false; });
bindHoldButton(mobileButtons.right, () => { keys['ArrowRight'] = true; }, () => { keys['ArrowRight'] = false; });
bindHoldButton(mobileButtons.up, () => { keys['ArrowUp'] = true; }, () => { keys['ArrowUp'] = false; });
bindHoldButton(mobileButtons.down, () => { keys['ArrowDown'] = true; }, () => { keys['ArrowDown'] = false; });
bindHoldButton(mobileButtons.shoot, startAutoShoot, stopAutoShoot);
bindPressButton(mobileButtons.bomber, () => {
    if (isGameOver) return;
    const now = Date.now();
    if (now < bomberTapLockUntil) return;
    bomberTapLockUntil = now + 250;
    triggerBomber();
});

if (window.PointerEvent) {
    canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'touch') return;
        e.preventDefault();
        activeCanvasTouchId = e.pointerId;
        movePlayerToClient(e.clientX, e.clientY, true);
    });
    canvas.addEventListener('pointermove', (e) => {
        if (e.pointerId !== activeCanvasTouchId) return;
        e.preventDefault();
        movePlayerToClient(e.clientX, e.clientY, true);
    });
    canvas.addEventListener('pointerup', (e) => {
        if (e.pointerId === activeCanvasTouchId) activeCanvasTouchId = null;
    });
    canvas.addEventListener('pointercancel', (e) => {
        if (e.pointerId === activeCanvasTouchId) activeCanvasTouchId = null;
    });
} else {
    canvas.addEventListener('touchstart', (e) => {
        if (!e.changedTouches[0]) return;
        e.preventDefault();
        activeCanvasTouchId = e.changedTouches[0].identifier;
        movePlayerToClient(e.changedTouches[0].clientX, e.changedTouches[0].clientY, true);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        const touch = Array.from(e.changedTouches).find(t => t.identifier === activeCanvasTouchId);
        if (!touch) return;
        e.preventDefault();
        movePlayerToClient(touch.clientX, touch.clientY, true);
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
        const touch = Array.from(e.changedTouches).find(t => t.identifier === activeCanvasTouchId);
        if (touch) activeCanvasTouchId = null;
    }, { passive: false });
    canvas.addEventListener('touchcancel', (e) => {
        const touch = Array.from(e.changedTouches).find(t => t.identifier === activeCanvasTouchId);
        if (touch) activeCanvasTouchId = null;
    }, { passive: false });
}

window.addEventListener('blur', clearMobileInputState);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearMobileInputState();
});

// Input
document.addEventListener('keydown', e => { 
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    keys[e.code] = true; 
    if (e.code === 'Space' && !isGameOver) firePlayerShot();
    if (e.code === 'KeyB' && !isGameOver) triggerBomber();
});
document.addEventListener('keyup', e => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    keys[e.code] = false;
});

function triggerBomber() {
    if (player.bombers <= 0) return;
    player.bombers--;
    updateHUD();
    shakeTime = 60;
    sound.playExplosion();
    createParticles(player.x, player.y, '#f0f', 100, true);
    // Destroy all enemies and clear bullets
    enemies.forEach(e => {
        createParticles(e.x, e.y, e.color, 20);
        score += 100;
    });
    enemies = [];
    enemyBullets = [];
    if (boss) {
        boss.hp -= 50; 
        boss.lastHitFrame = frames;
        createParticles(boss.x, boss.y, '#f0f', 50, true);
    }
    scoreEl.innerHTML = score;
}

function updateHUD() {
    if (livesEl) livesEl.innerHTML = player.lives;
    if (livesBottomEl) livesBottomEl.innerHTML = player.lives;
    if (bombersBottomEl) bombersBottomEl.innerHTML = player.bombers;
}

function shoot() {
    const p = player;
    const lvl = p.powerLevel;
    switch(p.weaponType) {
        case 'NORMAL':
            bullets.push({ x: p.x, y: p.y - 30, radius: 4 + lvl, speed: 12, power: 1 + lvl*0.5 });
            if (lvl >= 1) {
                bullets.push({ x: p.x - 20, y: p.y - 10, radius: 4, speed: 12, power: 1 });
                bullets.push({ x: p.x + 20, y: p.y - 10, radius: 4, speed: 12, power: 1 });
            }
            if (lvl >= 3) {
                bullets.push({ x: p.x - 40, y: p.y, radius: 4, speed: 12, power: 1 });
                bullets.push({ x: p.x + 40, y: p.y, radius: 4, speed: 12, power: 1 });
            }
            break;
        case 'LIGHTNING':
            const lDirs = [{vx:0, vy:-15}, {vx:0, vy:15}, {vx:-15, vy:0}, {vx:15, vy:0}];
            if (lvl >= 2) {
                lDirs.push({vx:-11, vy:-11}, {vx:11, vy:-11}, {vx:-11, vy:11}, {vx:11, vy:11});
            }
            lDirs.forEach(d => {
                bullets.push({ 
                    x: p.x, y: p.y, vx: d.vx, vy: d.vy, radius: 3, power: 2 + lvl, 
                    color: '#0ff', type: 'lightning', branches: 1 + Math.floor(lvl/2) 
                });
            });
            break;
        case 'FIRE':
            const count = 5 + lvl * 3;
            for(let i=0; i<count; i++) {
                const spread = 5 + lvl * 2;
                bullets.push({ 
                    x: p.x, y: p.y - 20, vx: (Math.random()-0.5)*spread, vy: -12 - Math.random()*5, 
                    radius: 10 + lvl*2 + Math.random()*10, power: 0.5 + lvl*0.1, color: '#f50', type: 'fire', life: 15 + lvl*3
                });
            }
            break;
        case 'WATER':
            const beams = 1 + Math.floor(lvl / 1.5); // 1 to 4 beams
            for(let i=-beams; i<=beams; i++) {
                if (i===0 && beams > 0) continue;
                bullets.push({ 
                    x: p.x + i*15, y: p.y - 20, vx: 0, vy: -10 - lvl, radius: 6 + lvl, power: 1.5 + lvl*0.5, 
                    color: '#0af', type: 'water', phase: frames * 0.2 + i, offset: i*(20 + lvl*10), amp: 30 + lvl*15
                });
            }
            break;
        case 'LEAF':
            const leafCount = 5 + lvl * 2;
            for(let i=0; i<leafCount; i++) {
                const angle = -Math.PI/2 + (i - (leafCount-1)/2) * (0.2 - lvl*0.02);
                bullets.push({ 
                    x: p.x, y: p.y - 30, vx: Math.cos(angle)*10, vy: Math.sin(angle)*10, 
                    radius: 5 + lvl, power: 2 + lvl, color: '#5f0', type: 'leaf', 
                    homing: lvl >= 2, turnSpeed: 0.05 + lvl*0.01 
                });
            }
            break;
    }
}

// Background
class Background {
    constructor() { this.y1 = 0; this.y2 = -canvas.height; this.scrollSpeed = 2; }
    update() {
        this.y1 += this.scrollSpeed; this.y2 += this.scrollSpeed;
        if (this.y1 >= canvas.height) this.y1 = -canvas.height + (this.y1 - canvas.height);
        if (this.y2 >= canvas.height) this.y2 = -canvas.height + (this.y2 - canvas.height);
    }
    draw() {
        const bgKey = levelConfigs[currentLevelIdx].bg;
        const img = images[bgKey].p;
        if (img) {
            ctx.drawImage(img, 0, this.y1, canvas.width, canvas.height);
            ctx.drawImage(img, 0, this.y2, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            for(let i=0; i<15; i++) ctx.fillRect((Math.sin(frames*0.01+i)*500+500)%canvas.width, (frames*2+i*100)%canvas.height, 2, 2);
        }
    }
}
const bgSystem = new Background();

// Items
class Item {
    constructor(x, y) {
        this.x = x; this.y = y; this.size = 50; this.speed = 2;
        const types = ['LIGHTNING', 'FIRE', 'WATER', 'LEAF', 'GOLD', 'RAINBOW', 'BOMBER'];
        this.type = types[Math.floor(Math.random() * types.length)];
    }
    update() { this.y += this.speed; }
    draw() {
        const itemColors = {
            LIGHTNING: '#0ff', FIRE: '#f50', WATER: '#0af', LEAF: '#5f0',
            GOLD: '#ff0', RAINBOW: '#f0f', BOMBER: '#a0f'
        };
        const color = itemColors[this.type] || '#fff';
        
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fillStyle = color + '44';
        ctx.beginPath();
        const pulse = Math.sin(frames * 0.1) * 5;
        ctx.arc(this.x, this.y, this.size/2 + pulse, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        if (images.icons.p && images.icons.p.width > 0) {
            const pos = iconMap[this.type];
            const sw = images.icons.p.width / 3;
            const sh = images.icons.p.height / 3;
            ctx.drawImage(images.icons.p, pos.x * sw, pos.y * sh, sw, sh, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        } else {
            // Draw a letter fallback
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(this.type[0], this.x, this.y);
        }
    }
}

// Boss
class Boss {
    constructor(config) {
        this.x = canvas.width / 2; this.y = -200; this.width = 300; this.height = 300;
        this.hp = config.bossHp; this.maxHp = config.bossHp;
        this.imgKey = config.boss; this.speed = 2 + currentLevelIdx * 0.5;
        this.dir = 1; this.state = 'entering'; this.lastHitFrame = 0;
    }
    update() {
        if (this.state === 'entering') { this.y += 1.5; if (this.y >= 150) this.state = 'fight'; }
        else {
            this.x += this.speed * this.dir;
            if (this.x > canvas.width - 150 || this.x < 150) this.dir *= -1;
            if (frames % (60 - currentLevelIdx * 5) === 0) this.shoot();
        }
    }
    shoot() {
        const patterns = [
            () => { for(let i=-2; i<=2; i++) enemyBullets.push({ x: this.x + i*30, y: this.y + 60, vx: i, vy: 5, size: 25 }); },
            () => { for(let a=0; a<Math.PI*2; a+=Math.PI/6) enemyBullets.push({ x: this.x, y: this.y, vx: Math.cos(a)*4, vy: Math.sin(a)*4, size: 20 }); },
            () => { 
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                for(let i=-1; i<=1; i++) enemyBullets.push({ x: this.x, y: this.y, vx: Math.cos(angle+i*0.2)*6, vy: Math.sin(angle+i*0.2)*6, size: 30 });
            }
        ];
        patterns[currentLevelIdx % patterns.length]();
    }
    draw() {
        const img = images[this.imgKey].p;
        if (!img) return;
        ctx.save();
        const flash = (frames - this.lastHitFrame < 5);
        if (flash) ctx.filter = 'brightness(3) contrast(2)';
        ctx.shadowColor = ['#f0f', '#0f0', '#ff0', '#0ff', '#f00'][currentLevelIdx % 5];
        ctx.shadowBlur = 30;
        ctx.drawImage(img, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.restore();
        // UI
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(canvas.width/2 - 200, 30, 400, 15);
        ctx.fillStyle = '#f00'; ctx.fillRect(canvas.width/2 - 200, 30, (this.hp/this.maxHp)*400, 15);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
        ctx.fillText(`${levelConfigs[currentLevelIdx].name} BOSS`, canvas.width/2, 65);
    }
}

const enemyBaseTypes = {
    SCOUT: { hp: 1, speed: 4.2, size: 40, color: '#0ff' },
    SNIPER: { hp: 2, speed: 2.2, size: 45, color: '#f0f' },
    CHARGER: { hp: 3, speed: 7.2, size: 35, color: '#f50' },
    SPREAD: { hp: 4, speed: 2.8, size: 55, color: '#5f0' },
    TANK: { hp: 8, speed: 1.6, size: 70, color: '#ff0' }
};

const enemyStageProfiles = [
    {
        maxStage: 1,
        spawnInterval: 95,
        shootInterval: 180,
        minShootInterval: 140,
        movementTier: 1,
        attackTier: 1,
        unlockedTypes: ['SCOUT'],
        typeWeights: { SCOUT: 100 }
    },
    {
        maxStage: 2,
        spawnInterval: 82,
        shootInterval: 165,
        minShootInterval: 120,
        movementTier: 2,
        attackTier: 1,
        unlockedTypes: ['SCOUT', 'SNIPER'],
        typeWeights: { SCOUT: 78, SNIPER: 22 }
    },
    {
        maxStage: 4,
        spawnInterval: 70,
        shootInterval: 145,
        minShootInterval: 100,
        movementTier: 3,
        attackTier: 2,
        unlockedTypes: ['SCOUT', 'SNIPER', 'CHARGER'],
        typeWeights: { SCOUT: 56, SNIPER: 24, CHARGER: 20 }
    },
    {
        maxStage: 6,
        spawnInterval: 60,
        shootInterval: 128,
        minShootInterval: 85,
        movementTier: 4,
        attackTier: 3,
        unlockedTypes: ['SCOUT', 'SNIPER', 'CHARGER', 'SPREAD'],
        typeWeights: { SCOUT: 40, SNIPER: 22, CHARGER: 20, SPREAD: 18 }
    },
    {
        maxStage: 8,
        spawnInterval: 52,
        shootInterval: 116,
        minShootInterval: 75,
        movementTier: 5,
        attackTier: 4,
        unlockedTypes: ['SCOUT', 'SNIPER', 'CHARGER', 'SPREAD', 'TANK'],
        typeWeights: { SCOUT: 30, SNIPER: 20, CHARGER: 18, SPREAD: 17, TANK: 15 }
    },
    {
        maxStage: 10,
        spawnInterval: 46,
        shootInterval: 104,
        minShootInterval: 64,
        movementTier: 6,
        attackTier: 5,
        unlockedTypes: ['SCOUT', 'SNIPER', 'CHARGER', 'SPREAD', 'TANK'],
        typeWeights: { SCOUT: 25, SNIPER: 20, CHARGER: 20, SPREAD: 18, TANK: 17 }
    }
];

function getEnemyDifficultyProfile() {
    const stage = currentLevelIdx + 1;
    const loopBonus = Math.max(0, loopCount - 1);
    const baseProfile = enemyStageProfiles.find(profile => stage <= profile.maxStage) || enemyStageProfiles[enemyStageProfiles.length - 1];
    return {
        ...baseProfile,
        spawnInterval: Math.max(38, baseProfile.spawnInterval - loopBonus * 6),
        shootInterval: Math.max(baseProfile.minShootInterval, baseProfile.shootInterval - loopBonus * 10),
        movementTier: Math.min(7, baseProfile.movementTier + loopBonus),
        attackTier: Math.min(7, baseProfile.attackTier + loopBonus),
        speedScale: 1 + loopBonus * 0.1,
        hpScale: 1 + loopBonus * 0.45,
        bulletSpeedScale: 1 + loopBonus * 0.12
    };
}

function shootEnemyBullet(e, angle, speed, size) {
    enemyBullets.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size
    });
}

function handleEnemyShooting(e, difficulty) {
    const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
    const speedScale = difficulty.bulletSpeedScale;
    switch (e.type) {
        case 'SCOUT':
            if (difficulty.attackTier <= 1) {
                enemyBullets.push({ x: e.x, y: e.y, vx: 0, vy: 4.2 * speedScale, size: 14 });
            } else if (difficulty.attackTier <= 3) {
                shootEnemyBullet(e, angleToPlayer, 5.3 * speedScale, 15);
            } else {
                for (let offset = -0.18; offset <= 0.18; offset += 0.18) {
                    shootEnemyBullet(e, angleToPlayer + offset, 5.8 * speedScale, 14);
                }
            }
            break;
        case 'SNIPER':
            if (difficulty.attackTier <= 1) {
                enemyBullets.push({ x: e.x, y: e.y, vx: 0, vy: 6.8 * speedScale, size: 12 });
            } else if (difficulty.attackTier <= 3) {
                shootEnemyBullet(e, angleToPlayer, 9.8 * speedScale, 10);
            } else {
                shootEnemyBullet(e, angleToPlayer - 0.08, 10.3 * speedScale, 10);
                shootEnemyBullet(e, angleToPlayer + 0.08, 10.3 * speedScale, 10);
            }
            break;
        case 'CHARGER':
            if (difficulty.attackTier >= 4) {
                shootEnemyBullet(e, angleToPlayer, 6.2 * speedScale, 13);
            }
            break;
        case 'SPREAD': {
            let spreadRange = 0.4;
            let shots = 3;
            if (difficulty.attackTier >= 4) {
                spreadRange = 0.6;
                shots = 5;
            }
            const step = shots === 1 ? 0 : (spreadRange * 2) / (shots - 1);
            for (let i = 0; i < shots; i++) {
                shootEnemyBullet(e, angleToPlayer - spreadRange + i * step, 5.1 * speedScale, 19);
            }
            break;
        }
        case 'TANK': {
            const count = difficulty.attackTier >= 5 ? 8 : 6;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count;
                shootEnemyBullet(e, angle, 3.8 * speedScale, 24);
            }
            if (difficulty.attackTier >= 6) {
                shootEnemyBullet(e, angleToPlayer, 6.0 * speedScale, 16);
            }
            break;
        }
    }
}

function spawnEnemy(difficulty) {
    if (bossMode || frames % difficulty.spawnInterval !== 0) return;

    const types = difficulty.unlockedTypes.map(type => ({
        type,
        ...enemyBaseTypes[type],
        weight: difficulty.typeWeights[type] || 1
    }));

    let totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
    let rand = Math.random() * totalWeight;
    let selected = types[0];
    for (const t of types) {
        if (rand < t.weight) { selected = t; break; }
        rand -= t.weight;
    }

    enemies.push({
        type: selected.type,
        x: Math.random() * (canvas.width - selected.size) + selected.size / 2,
        y: -selected.size,
        size: selected.size,
        speed: selected.speed * difficulty.speedScale,
        color: selected.color,
        hp: Math.ceil((selected.hp + currentLevelIdx * 0.4) * difficulty.hpScale),
        phase: Math.random() * Math.PI * 2,
        wait: 0,
        lastShot: frames - Math.floor(Math.random() * difficulty.shootInterval),
        targetX: Math.random() * canvas.width
    });
}

function handleHit() {
    if (player.invincibilityFrames > 0) return;
    player.lives--;
    updateHUD();
    player.lastHitFrame = frames;
    shakeTime = 30;
    createParticles(player.x, player.y, '#fff', 50, true);
    if (player.lives <= 0) endGame();
    else {
        player.invincibilityFrames = 120;
        player.powerLevel = Math.max(0, player.powerLevel - 1);
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
    }
}

function update() {
    if (isGameOver) return;
    frames++; if (!bossMode) distance++;
    const enemyDifficulty = getEnemyDifficultyProfile();
    if (player.invincibilityFrames > 0) player.invincibilityFrames--;
    if (shakeTime > 0) shakeTime--;

    if (score - lastExtraLifeScore >= 50000) {
        player.lives++; updateHUD();
        lastExtraLifeScore += 50000; createParticles(player.x, player.y, '#0f0', 20);
    }

    bgSystem.update();

    // Movement
    if ((keys['ArrowLeft'] || keys['KeyA']) && player.x > 30) player.x -= player.speed;
    if ((keys['ArrowRight'] || keys['KeyD']) && player.x < canvas.width - 30) player.x += player.speed;
    if ((keys['ArrowUp'] || keys['KeyW']) && player.y > 30) player.y -= player.speed;
    if ((keys['ArrowDown'] || keys['KeyS']) && player.y < canvas.height - 30) player.y += player.speed;

    bullets.forEach((b, i) => { 
        if (b.type === 'water') {
            b.x = player.x + b.offset + Math.sin(frames * 0.2 + b.phase) * b.amp;
        } else if (b.type === 'leaf' && b.homing) {
            let target = null;
            let minDist = 1000;
            enemies.forEach(e => {
                let d = Math.hypot(e.x - b.x, e.y - b.y);
                if (d < minDist) { minDist = d; target = e; }
            });
            if (boss) {
                let d = Math.hypot(boss.x - b.x, boss.y - b.y);
                if (d < minDist) { target = boss; }
            }
            if (target) {
                const angle = Math.atan2(target.y - b.y, target.x - b.x);
                const curAngle = Math.atan2(b.vy, b.vx);
                let diff = angle - curAngle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                const newAngle = curAngle + diff * b.turnSpeed;
                const speed = Math.hypot(b.vx, b.vy);
                b.vx = Math.cos(newAngle) * speed;
                b.vy = Math.sin(newAngle) * speed;
            }
            b.x += b.vx;
        } else {
            b.x += b.vx || 0; 
        }
        b.y += b.vy || -b.speed; 
        if (b.life) { b.life--; if (b.life <= 0) bullets.splice(i, 1); }
        if (b.y < -100 || b.y > canvas.height + 100 || b.x < -100 || b.x > canvas.width + 100) bullets.splice(i, 1); 
    });

    enemyBullets.forEach((eb, i) => {
        eb.x += eb.vx; eb.y += eb.vy;
        if (eb.y > canvas.height + 50 || eb.y < -50 || eb.x > canvas.width + 50 || eb.x < -50) enemyBullets.splice(i, 1);
        if (Math.hypot(eb.x - player.x, eb.y - player.y) < player.width/3 + eb.size/3) handleHit();
    });

    items.forEach((item, i) => {
        item.update();
        if (Math.hypot(item.x - player.x, item.y - player.y) < player.width/2 + item.size/2) {
            if (item.type === 'GOLD') player.powerLevel = Math.min(5, player.powerLevel + 1);
            else if (item.type === 'RAINBOW') { player.lives++; updateHUD(); }
            else if (item.type === 'BOMBER') { player.bombers++; updateHUD(); }
            else { 
                if (player.weaponType === item.type) player.powerLevel = Math.min(5, player.powerLevel + 1);
                else { player.weaponType = item.type; player.powerLevel = 0; }
                updateHUD();
            }
            sound.playPowerUp();
            items.splice(i, 1);
            score += 1000; scoreEl.innerHTML = score;
            createParticles(player.x, player.y, '#fff', 30);
        }
        if (item.y > canvas.height + 50) items.splice(i, 1);
    });
    // Progression
    const config = levelConfigs[currentLevelIdx];
    if (distance >= config.dist && !bossMode) { 
        bossMode = true; 
        boss = new Boss({
            ...config,
            bossHp: config.bossHp * loopCount // Scale Boss HP by loop
        }); 
    }

    if (boss) {
        boss.update();
        bullets.forEach((b, bi) => {
            if (Math.hypot(b.x - boss.x, b.y - boss.y) < boss.width/2.5) {
                boss.hp -= b.power || 1; boss.lastHitFrame = frames;
                if (b.type !== 'fire') bullets.splice(bi, 1); 
                createParticles(b.x, b.y, ['#fff', '#f50', '#0ff', '#5f0'][Math.floor(Math.random()*4)], 5);
                if (boss.hp <= 0) {
                    sound.playExplosion();
                    score += (currentLevelIdx + 1) * 10000 * loopCount; shakeTime = 60;
                    createParticles(boss.x, boss.y, '#fff', 100, true);
                    bossMode = false; distance = 0; boss = null;
                    currentLevelIdx++; 
                    if (currentLevelIdx >= levelConfigs.length) {
                        currentLevelIdx = 0;
                        loopCount++;
                        createParticles(player.x, player.y, '#ff0', 50, true); // Visual for loop up
                    }
                }
            }
        });
    }

    spawnEnemy(enemyDifficulty);
    enemies.forEach((e, i) => {
        // Movement Logic
        switch(e.type) {
            case 'SCOUT':
                if (enemyDifficulty.movementTier <= 1) {
                    e.y += e.speed;
                } else if (enemyDifficulty.movementTier <= 3) {
                    e.x += Math.sin(frames * 0.07 + e.phase) * (1.5 + enemyDifficulty.movementTier * 0.7);
                    e.y += e.speed;
                } else {
                    e.x += Math.sin(frames * 0.1 + e.phase) * (3 + enemyDifficulty.movementTier);
                    e.y += e.speed * 0.95;
                }
                break;
            case 'SNIPER':
                if (e.y < canvas.height * 0.25) e.y += e.speed;
                else {
                    const drift = enemyDifficulty.movementTier >= 4 ? 2.8 : 1.8;
                    e.x += Math.cos(frames * 0.04 + e.phase) * drift;
                    if (enemyDifficulty.movementTier >= 6 && frames % 180 === 0) {
                        e.targetX = Math.random() * (canvas.width - 120) + 60;
                    }
                    if (enemyDifficulty.movementTier >= 6) {
                        e.x += (e.targetX - e.x) * 0.015;
                    }
                }
                break;
            case 'CHARGER':
                const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
                if (enemyDifficulty.movementTier <= 3) {
                    e.x += Math.cos(angleToPlayer) * e.speed * 0.6;
                    e.y += e.speed * 0.9;
                } else {
                    e.x += Math.cos(angleToPlayer) * e.speed;
                    e.y += Math.sin(angleToPlayer) * e.speed;
                }
                break;
            case 'SPREAD':
                e.y += e.speed * 0.85;
                e.x += Math.sin(frames * 0.05 + e.phase) * (enemyDifficulty.movementTier >= 5 ? 2.4 : 1.4);
                break;
            case 'TANK':
                e.y += e.speed * 0.5;
                if (enemyDifficulty.movementTier >= 5) {
                    e.x += Math.sin(frames * 0.03 + e.phase) * 1.2;
                }
                break;
            default:
                e.y += e.speed;
        }

        // Shooting Logic
        const typeIntervalFactor = e.type === 'CHARGER' ? 1.4 : e.type === 'TANK' ? 1.2 : 1;
        const interval = Math.floor(enemyDifficulty.shootInterval * typeIntervalFactor);
        if (frames - e.lastShot >= interval) {
            handleEnemyShooting(e, enemyDifficulty);
            e.lastShot = frames - Math.floor(Math.random() * 12);
        }

        if (Math.hypot(e.x - player.x, e.y - player.y) < e.size/2 + player.width/3) handleHit();
        
        bullets.forEach((b, bi) => {
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.size/2) {
                e.hp -= b.power || 1;
                if (b.type !== 'fire') bullets.splice(bi, 1);
                if (e.hp <= 0) {
                    sound.playExplosion();
                    createParticles(e.x, e.y, e.color, 15);
                    if (Math.random() < 0.2) items.push(new Item(e.x, e.y));
                    enemies.splice(i, 1);
                    score += 100 * loopCount; scoreEl.innerHTML = score;
                }
            }
        });
        if (e.y > canvas.height + 100 || e.y < -200 || e.x < -100 || e.x > canvas.width + 100) enemies.splice(i, 1);
    });
    particles.forEach((p, i) => { p.alpha <= 0 ? particles.splice(i, 1) : p.update(); });
}

class Particle {
    constructor(x, y, color, isExplosion = false) {
        this.x = x; this.y = y; this.color = color;
        const s = isExplosion ? 12 : 6;
        this.v = { x: (Math.random()-0.5)*s, y: (Math.random()-0.5)*s };
        this.alpha = 1; this.radius = isExplosion ? Math.random()*5+2 : 2;
    }
    update() {
        this.x += this.v.x; this.y += this.v.y; this.alpha -= 0.02;
        ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
        ctx.shadowColor = this.color; ctx.shadowBlur = 5;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill(); ctx.restore();
    }
}
function createParticles(x, y, color, count = 10, isExplosion = false) { 
    for(let i=0; i<count; i++) particles.push(new Particle(x, y, color, isExplosion)); 
}

function drawLightning(x1, y1, x2, y2, color, branches) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    
    for(let b=0; b<branches; b++) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        let curX = x1;
        let curY = y1;
        const segments = 5;
        for(let s=1; s<=segments; s++) {
            const targetX = x1 + (x2 - x1) * (s / segments);
            const targetY = y1 + (y2 - y1) * (s / segments);
            curX = targetX + (Math.random()-0.5) * 20;
            curY = targetY + (Math.random()-0.5) * 20;
            ctx.lineTo(curX, curY);
        }
        ctx.stroke();
    }
}

function draw() {
    ctx.save();
    if (shakeTime > 0) {
        const sx = (Math.random()-0.5) * (shakeTime/2);
        const sy = (Math.random()-0.5) * (shakeTime/2);
        ctx.translate(sx, sy);
    }
    ctx.clearRect(-50, -50, canvas.width+100, canvas.height+100);
    bgSystem.draw();

    if (images.player.p && (player.invincibilityFrames % 6 < 3)) {
        ctx.save();
        if (frames - player.lastHitFrame < 10) ctx.filter = 'invert(1) brightness(2)';
        ctx.shadowColor = '#0ff'; ctx.shadowBlur = 15;
        ctx.drawImage(images.player.p, player.x - player.width/2, player.y - player.height/2, player.width, player.height);
        ctx.restore();
    }

    bullets.forEach(b => { 
        ctx.save();
        if (b.type === 'lightning') {
            drawLightning(b.x - b.vx, b.y - b.vy, b.x, b.y, b.color, b.branches);
        } else {
            ctx.fillStyle = b.color || '#ff0'; ctx.shadowColor = b.color || '#fff'; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    });

    items.forEach(item => item.draw());
    enemyBullets.forEach(eb => {
        if (images.enemyBullet.p) {
            ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = '#f00';
            ctx.drawImage(images.enemyBullet.p, eb.x - eb.size/2, eb.y - eb.size/2, eb.size, eb.size);
            ctx.restore();
        }
    });

    enemies.forEach(e => {
        if (images.enemy.p) {
            ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = e.color || '#f00';
            ctx.drawImage(images.enemy.p, e.x - e.size/2, e.y - e.size/2, e.size, e.size);
            ctx.restore();
        }
    });

    if (boss) boss.draw();

    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 14px Monospace'; ctx.textAlign = 'left';
    ctx.fillText(`LOOP: ${loopCount} | STAGE: ${currentLevelIdx + 1} - ${levelConfigs[currentLevelIdx].name}`, 10, 20);
    ctx.fillText(`WEAPON: ${player.weaponType} (Lv.${player.powerLevel})`, 10, 50);
    if (!bossMode) {
        ctx.fillStyle = '#444'; ctx.fillRect(10, 30, 200, 5);
        ctx.fillStyle = '#0f0'; ctx.fillRect(10, 30, (distance/levelConfigs[currentLevelIdx].dist)*200, 5);
    }
    ctx.restore();
}

function loop() { if (!isGameOver) { requestAnimationFrame(loop); update(); draw(); } }
function endGame() {
    isGameOver = true;
    clearMobileInputState();
    updateBestScore(score);
    gameOverEl.style.display = 'block';
    finalScoreEl.innerHTML = score;
}
function resetGame() {
    clearMobileInputState();
    isGameOver = false; score = 0; lastExtraLifeScore = 0; distance = 0; bossMode = false; boss = null; currentLevelIdx = 0;
    loopCount = 1; // Reset loop count on game over
    player.lives = 3; player.powerLevel = 0; player.weaponType = 'NORMAL'; player.bombers = 1;
    updateHUD();
    scoreEl.innerHTML = 0; enemies = []; bullets = []; enemyBullets = []; particles = []; items = [];
    renderBestScore();
    gameOverEl.style.display = 'none'; player.x = canvas.width/2; player.y = canvas.height-100;
    loop();
}

renderBestScore();
