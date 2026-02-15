const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

// --- Game Constants & Configuration ---
const CONFIG = {
    paddleWidth: 10,
    paddleHeight: 100,
    ballRadius: 8,
    winScore: 11,
    colors: {
        bg: '#0a0a14',
        player: '#00f3ff', // Cyan
        ai: '#ff0055',     // Red/Magenta
        ball: '#ffffff',
        net: '#333333', // Darker net
        powerup: '#00ff00', // Green
        text: '#ffffff'
    },
    particles: {
        count: 15,
        decay: 0.95,
        speed: 4
    }
};

// --- Utils ---
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// --- Classes ---

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = randomRange(2, 5);
        const angle = randomRange(0, Math.PI * 2);
        const speed = randomRange(1, CONFIG.particles.speed);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = randomRange(0.02, 0.05);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        this.radius *= 0.96; // Shrink over time
    }

    draw(ctx) {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class PowerUp {
    constructor(type) {
        this.x = randomRange(200, canvas.width - 200);
        this.y = randomRange(100, canvas.height - 100);
        this.radius = 15;
        this.type = type; // 'expand', 'speed', 'multi'
        this.active = true;
        this.timer = 0;
        this.pulse = 0;
    }

    draw(ctx) {
        if (!this.active) return;
        this.pulse += 0.1;
        const glow = 10 + Math.sin(this.pulse) * 5;
        
        ctx.save();
        ctx.shadowBlur = glow;
        ctx.shadowColor = CONFIG.colors.powerup;
        ctx.fillStyle = CONFIG.colors.powerup;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let label = "?";
        if (this.type === 'expand') label = "↔";
        if (this.type === 'speed') label = "⚡";
        // if (this.type === 'multi') label = "∞"; // Reserved for future
        ctx.fillText(label, this.x, this.y);
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.player = {
            x: 0,
            y: (canvas.height - CONFIG.paddleHeight) / 2,
            width: CONFIG.paddleWidth,
            height: CONFIG.paddleHeight,
            color: CONFIG.colors.player,
            score: 0,
            vy: 0, // For calculating 'smash' velocity
            lastY: 0
        };

        this.ai = {
            x: canvas.width - CONFIG.paddleWidth,
            y: (canvas.height - CONFIG.paddleHeight) / 2,
            width: CONFIG.paddleWidth,
            height: CONFIG.paddleHeight,
            color: CONFIG.colors.ai,
            score: 0,
            speed: 0.09 // AI Lerp factor
        };

        this.ball = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: CONFIG.ballRadius,
            speed: 7,
            vx: 5,
            vy: 5,
            color: CONFIG.colors.ball,
            trail: [] // For smash effect
        };

        this.net = {
            x: (canvas.width - 2) / 2,
            y: 0,
            width: 2,
            height: 10,
            color: CONFIG.colors.net
        };

        this.particles = [];
        this.powerUps = [];
        this.shakeTime = 0;
        this.frameCount = 0;

        // Input Handling
        this.mouseY = canvas.height / 2;
        canvas.addEventListener("mousemove", (e) => this.handleInput(e));
        canvas.addEventListener("touchmove", (e) => this.handleTouch(e), { passive: false });
        
        this.resetBall();
    }

    handleInput(e) {
        const rect = canvas.getBoundingClientRect();
        // Scale mouse position to canvas resolution
        const scaleY = canvas.height / rect.height;
        this.mouseY = (e.clientY - rect.top) * scaleY;
    }

    handleTouch(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleY = canvas.height / rect.height;
        this.mouseY = (e.touches[0].clientY - rect.top) * scaleY;
    }

    screenshake(amount) {
        this.shakeTime = amount;
    }

    spawnParticle(x, y, color) {
        for (let i = 0; i < CONFIG.particles.count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    spawnPowerUp() {
        const types = ['expand', 'speed'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerUps.push(new PowerUp(type));
    }

    resetBall() {
        this.ball.x = canvas.width / 2;
        this.ball.y = canvas.height / 2;
        this.ball.speed = 7;
        this.ball.vx = (Math.random() > 0.5 ? 1 : -1) * this.ball.speed;
        this.ball.vy = (Math.random() * 2 - 1) * this.ball.speed;
        this.ball.trail = [];
    }

    update() {
        // 1. Player Movement
        this.player.lastY = this.player.y;
        this.player.y = this.mouseY - this.player.height / 2;
        
        // Clamp Player
        if (this.player.y < 0) this.player.y = 0;
        if (this.player.y + this.player.height > canvas.height) this.player.y = canvas.height - this.player.height;

        // Calculate Velocity for Smash
        this.player.vy = this.player.y - this.player.lastY;

        // 2. AI Movement
        // Simple Lerp
        let targetY = this.ball.y - (this.ai.height / 2);
        this.ai.y += (targetY - this.ai.y) * this.ai.speed;
        // Clamp AI
        if (this.ai.y < 0) this.ai.y = 0;
        if (this.ai.y + this.ai.height > canvas.height) this.ai.y = canvas.height - this.ai.height;

        // 3. Ball Movement
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // Trail Logic
        if (Math.abs(this.ball.vx) > 10) { // Only trail if fast
            this.ball.trail.push({x: this.ball.x, y: this.ball.y, alpha: 1});
            if (this.ball.trail.length > 10) this.ball.trail.shift();
        } else {
            this.ball.trail = [];
        }

        // Wall Collision
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > canvas.height) {
            this.ball.vy = -this.ball.vy;
            this.spawnParticle(this.ball.x, this.ball.y, this.ball.color);
            // Subtle shake on wall hit
            // this.screenshake(2); 
        }

        // Paddle Collision
        let player = (this.ball.x < canvas.width / 2) ? this.player : this.ai;
        if (this.collision(this.ball, player)) {
            // Smash Mechanic: If player moves paddle fast on impact
            let smashMultiplier = 1;
            if (player === this.player && Math.abs(this.player.vy) > 5) {
                smashMultiplier = 1.5;
                this.screenshake(10); // BIG SHAKE
                this.spawnParticle(this.ball.x, this.ball.y, '#fff'); // White burst for smash
            } else {
                this.spawnParticle(this.ball.x, this.ball.y, player.color);
                this.screenshake(3);
            }

            let collidePoint = (this.ball.y - (player.y + player.height / 2));
            collidePoint = collidePoint / (player.height / 2);
            let angleRad = (Math.PI / 4) * collidePoint;

            let direction = (this.ball.x < canvas.width / 2) ? 1 : -1;
            
            this.ball.speed += 0.5; // Acceleration
            // Cap speed
            if (this.ball.speed > 25) this.ball.speed = 25;

            this.ball.vx = direction * (this.ball.speed * smashMultiplier) * Math.cos(angleRad);
            this.ball.vy = (this.ball.speed * smashMultiplier) * Math.sin(angleRad);
        }

        // Scoring
        if (this.ball.x - this.ball.radius < 0) {
            this.ai.score++;
            document.getElementById("computer-score").innerText = this.ai.score;
            this.resetBall();
            this.screenshake(5);
        } else if (this.ball.x + this.ball.radius > canvas.width) {
            this.player.score++;
            document.getElementById("player-score").innerText = this.player.score;
            this.resetBall();
            this.screenshake(5);
        }

        // 4. PowerUps
        // Spawn chance
        if (this.frameCount % 600 === 0 && Math.random() < 0.7) { // Every ~10 seconds
            this.spawnPowerUp();
        }

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            let p = this.powerUps[i];
            
            // Check collision with ball
            let dx = this.ball.x - p.x;
            let dy = this.ball.y - p.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.ball.radius + p.radius) {
                // Apply Effect
                if (p.type === 'expand') {
                    // Expand current hitter (heuristic: if ball moving right, player likely hit it last? No, use velocity)
                    // Actually let's just expand the player for fun, or whoever last touched it.
                    // For simplicity, let's make it always help the player or hurt ai? 
                    // Let's make it simple: Blue ball = player advantage? 
                    // Let's just expand Player Paddle for now to make users happy.
                    this.player.height = CONFIG.paddleHeight * 1.5;
                    setTimeout(() => { this.player.height = CONFIG.paddleHeight; }, 8000);
                } else if (p.type === 'speed') {
                     this.ball.vx *= 1.5; // ZOOOM
                }
                
                this.spawnParticle(p.x, p.y, CONFIG.colors.powerup);
                this.powerUps.splice(i, 1);
            }
        }

        // 5. Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
        }

        this.frameCount++;
    }

    collision(b, p) {
        p.top = p.y;
        p.bottom = p.y + p.height;
        p.left = p.x;
        p.right = p.x + p.width;

        b.top = b.y - b.radius;
        b.bottom = b.y + b.radius;
        b.left = b.x - b.radius;
        b.right = b.x + b.radius;

        return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
    }

    draw() {
        // Clear with Fade for "Trails" (optional, but clean clear is better for CRT style)
        ctx.fillStyle = CONFIG.colors.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Screen Shake Transform
        ctx.save();
        if (this.shakeTime > 0) {
            let dx = Math.random() * 6 - 3;
            let dy = Math.random() * 6 - 3;
            ctx.translate(dx, dy);
            this.shakeTime--;
        }

        // Draw Net
        ctx.fillStyle = this.net.color;
        for (let i = 0; i <= canvas.height; i += 20) {
            ctx.fillRect(this.net.x, this.net.y + i, this.net.width, this.net.height);
        }

        // Draw Player
        this.glowRect(this.player.x, this.player.y, this.player.width, this.player.height, this.player.color);
        
        // Draw AI
        this.glowRect(this.ai.x, this.ai.y, this.ai.width, this.ai.height, this.ai.color);

        // Draw PowerUps
        this.powerUps.forEach(p => p.draw(ctx));

        // Draw Trail
        this.ball.trail.forEach(t => {
            ctx.globalAlpha = t.alpha * 0.5;
            ctx.fillStyle = this.ball.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.ball.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            t.alpha -= 0.1;
        });
        ctx.globalAlpha = 1;

        // Draw Ball
        this.glowCircle(this.ball.x, this.ball.y, this.ball.radius, this.ball.color);

        // Draw Particles
        this.particles.forEach(p => p.draw(ctx));

        ctx.restore();
    }

    glowRect(x, y, w, h, color) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.shadowBlur = 0; // Reset
    }

    glowCircle(x, y, r, color) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Start Game
const game = new Game();

function loop() {
    game.update();
    game.draw();
    requestAnimationFrame(loop);
}

loop();
