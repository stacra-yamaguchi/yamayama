const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

// Game State
let isGameOver = false;
let score = 0;
let frames = 0;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    speed: 5,
    dx: 0
};

// Arrays
let bullets = [];
let enemies = [];
let particles = [];

// Input
let keys = {};

document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && !isGameOver) {
        shoot();
    }
});

document.addEventListener('keyup', e => {
    keys[e.code] = false;
});

function shoot() {
    bullets.push({
        x: player.x,
        y: player.y - 20,
        radius: 4,
        speed: 7
    });
}

// Enemy Factory
function spawnEnemy() {
    if (frames % 60 === 0) {
        const size = Math.random() * 20 + 20;
        const x = Math.random() * (canvas.width - size) + size / 2;
        enemies.push({
            x: x,
            y: -size,
            size: size,
            speed: Math.random() * 2 + 1,
            color: `hsl(${Math.random() * 360}, 50%, 50%)`
        });
    }
}

// Logic
function update() {
    if (isGameOver) return;
    frames++;

    // Player Movement
    if (keys['ArrowLeft'] && player.x > player.width / 2) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width / 2) {
        player.x += player.speed;
    }

    // Bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // Enemies
    spawnEnemy();
    enemies.forEach((enemy, eIndex) => {
        enemy.y += enemy.speed;

        // Collision: Player
        if (
            Math.abs(enemy.x - player.x) < (enemy.size / 2 + player.width / 2) &&
            Math.abs(enemy.y - player.y) < (enemy.size / 2 + player.height / 2)
        ) {
            endGame();
        }

        // Collision: Bullet
        bullets.forEach((bullet, bIndex) => {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist - enemy.size / 2 - bullet.radius < 1) {
                // Hit
                createParticles(enemy.x, enemy.y, enemy.color);
                setTimeout(() => {
                    enemies.splice(eIndex, 1);
                    bullets.splice(bIndex, 1);
                }, 0);
                score += 100;
                scoreEl.innerHTML = score;
            }
        });

        if (enemy.y > canvas.height) {
            enemies.splice(eIndex, 1);
        }
    });

    // Particles
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * 5,
            y: (Math.random() - 0.5) * 5
        }
        this.alpha = 1;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.05;
        this.draw();
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars (Simple background effect)
    ctx.fillStyle = '#fff';
    for(let i=0; i<5; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    // Player
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.closePath();
    ctx.fill();

    // Bullets
    ctx.fillStyle = '#ff0';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        if (Math.random() > 0.5) {
             ctx.rect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
        } else {
             ctx.arc(enemy.x, enemy.y, enemy.size / 2, 0, Math.PI * 2);
        }
        ctx.fill();
    });

    // Particles are drawn in update() for fading
}

function loop() {
    if (!isGameOver) {
        requestAnimationFrame(loop);
        update();
        draw();
    }
}

function endGame() {
    isGameOver = true;
    gameOverEl.style.display = 'block';
    finalScoreEl.innerHTML = score;
}

function resetGame() {
    isGameOver = false;
    score = 0;
    scoreEl.innerHTML = 0;
    enemies = [];
    bullets = [];
    particles = [];
    gameOverEl.style.display = 'none';
    player.x = canvas.width / 2;
    loop();
}

loop();
