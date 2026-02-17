const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
    stage: document.getElementById("stage"),
    blocksLeft: document.getElementById("blocks-left"),
    score: document.getElementById("score"),
    lives: document.getElementById("lives"),
    slowEffect: document.getElementById("slow-effect"),
    splitEffect: document.getElementById("split-effect"),
    overlay: document.getElementById("overlay"),
    overlayMessage: document.getElementById("overlay-message"),
    restartBtn: document.getElementById("restart-btn")
};

const CONFIG = {
    paddle: {
        width: 140,
        height: 16,
        speed: 10
    },
    ball: {
        radius: 8,
        speed: 6.2,
        maxX: 0.95
    },
    stage: {
        initialBlocks: 100,
        increasePerStage: 20,
        columns: 20,
        topOffset: 78,
        sidePadding: 22,
        blockHeight: 21,
        gap: 4
    },
    item: {
        dropChance: 0.22,
        size: 18,
        fallSpeed: 2.35,
        durationMs: 10000,
        types: ["slow", "split"]
    },
    maxBalls: 6,
    slowFactor: 0.62,
    startLives: 3
};

let gameState;
let inputState;
let lastTime = 0;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function stageBlockCount(stage) {
    return CONFIG.stage.initialBlocks + (stage - 1) * CONFIG.stage.increasePerStage;
}

function createBlockColor(row) {
    const hue = (198 + row * 13) % 360;
    return {
        fill: `hsl(${hue} 78% 54%)`,
        glow: `hsla(${hue} 94% 70% / 0.65)`
    };
}

function normalize(vx, vy, speed) {
    const mag = Math.hypot(vx, vy) || 1;
    return {
        vx: (vx / mag) * speed,
        vy: (vy / mag) * speed
    };
}

function createBall(x, y, speed, temporary = false, expiresAt = null) {
    const angle = randomRange(-Math.PI * 0.66, -Math.PI * 0.34);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    return {
        x,
        y,
        vx,
        vy,
        radius: CONFIG.ball.radius,
        temporary,
        expiresAt
    };
}

function createBlocks(stage) {
    const blocks = [];
    const total = stageBlockCount(stage);
    const columns = CONFIG.stage.columns;
    const totalWidth = canvas.width - CONFIG.stage.sidePadding * 2;
    const blockWidth = (totalWidth - CONFIG.stage.gap * (columns - 1)) / columns;

    for (let index = 0; index < total; index += 1) {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const x = CONFIG.stage.sidePadding + col * (blockWidth + CONFIG.stage.gap);
        const y = CONFIG.stage.topOffset + row * (CONFIG.stage.blockHeight + CONFIG.stage.gap);
        const color = createBlockColor(row);

        blocks.push({
            x,
            y,
            width: blockWidth,
            height: CONFIG.stage.blockHeight,
            color
        });
    }

    return blocks;
}

function resetInput() {
    inputState = {
        left: false,
        right: false
    };
}

function startNewGame() {
    resetInput();

    gameState = {
        stage: 1,
        score: 0,
        lives: CONFIG.startLives,
        paddle: {
            x: canvas.width / 2 - CONFIG.paddle.width / 2,
            y: canvas.height - 42,
            width: CONFIG.paddle.width,
            height: CONFIG.paddle.height,
            vx: 0
        },
        balls: [createBall(canvas.width / 2, canvas.height - 70, CONFIG.ball.speed)],
        blocks: createBlocks(1),
        items: [],
        slowUntil: 0,
        splitUntil: 0,
        slowActive: false,
        splitActive: false,
        running: true
    };

    hideOverlay();
    updateHud();
}

function startNextStage() {
    gameState.stage += 1;
    gameState.blocks = createBlocks(gameState.stage);
    gameState.items = [];
    gameState.paddle.x = canvas.width / 2 - gameState.paddle.width / 2;
    gameState.balls = [createBall(canvas.width / 2, canvas.height - 70, CONFIG.ball.speed)];
    gameState.slowUntil = 0;
    gameState.splitUntil = 0;
    gameState.slowActive = false;
    gameState.splitActive = false;
    updateHud();
}

function showOverlay(message, buttonLabel = "RESTART") {
    ui.overlayMessage.textContent = message;
    ui.restartBtn.textContent = buttonLabel;
    ui.overlay.classList.remove("hidden");
}

function hideOverlay() {
    ui.overlay.classList.add("hidden");
}

function updateHud() {
    ui.stage.textContent = String(gameState.stage);
    ui.blocksLeft.textContent = String(gameState.blocks.length);
    ui.score.textContent = String(gameState.score);
    ui.lives.textContent = String(gameState.lives);
}

function updateEffectBoard(now) {
    if (gameState.slowActive && now >= gameState.slowUntil) {
        gameState.slowActive = false;
        gameState.balls.forEach((ball) => {
            ball.vx /= CONFIG.slowFactor;
            ball.vy /= CONFIG.slowFactor;
        });
    }

    if (gameState.splitActive && now >= gameState.splitUntil) {
        gameState.splitActive = false;
        const keepBall = gameState.balls[0] || createBall(canvas.width / 2, canvas.height - 70, CONFIG.ball.speed);
        keepBall.temporary = false;
        keepBall.expiresAt = null;
        gameState.balls = [keepBall];
    }

    const slowRemain = Math.max(0, gameState.slowUntil - now);
    const splitRemain = Math.max(0, gameState.splitUntil - now);

    ui.slowEffect.textContent = slowRemain > 0
        ? `SLOW: ${Math.ceil(slowRemain / 1000)}s`
        : "SLOW: OFF";

    ui.splitEffect.textContent = splitRemain > 0
        ? `SPLIT: ${Math.ceil(splitRemain / 1000)}s`
        : "SPLIT: OFF";
}

function spawnItem(x, y) {
    if (Math.random() > CONFIG.item.dropChance) {
        return;
    }

    const type = CONFIG.item.types[Math.floor(Math.random() * CONFIG.item.types.length)];

    gameState.items.push({
        type,
        x,
        y,
        size: CONFIG.item.size,
        vy: CONFIG.item.fallSpeed + randomRange(-0.25, 0.3)
    });
}

function applySlowItem(now) {
    if (!gameState.slowActive) {
        gameState.balls.forEach((ball) => {
            ball.vx *= CONFIG.slowFactor;
            ball.vy *= CONFIG.slowFactor;
        });
    }

    gameState.slowActive = true;
    gameState.slowUntil = now + CONFIG.item.durationMs;
}

function applySplitItem(now) {
    gameState.splitActive = true;
    gameState.splitUntil = now + CONFIG.item.durationMs;

    const nextBalls = [...gameState.balls];

    gameState.balls.forEach((baseBall) => {
        if (nextBalls.length >= CONFIG.maxBalls) {
            return;
        }

        const variation = randomRange(-0.22, 0.22);
        const baseSpeed = Math.hypot(baseBall.vx, baseBall.vy);

        const splitA = normalize(baseBall.vx, baseBall.vy + variation * baseSpeed, baseSpeed);
        nextBalls.push({
            x: baseBall.x,
            y: baseBall.y,
            vx: splitA.vx,
            vy: -Math.abs(splitA.vy),
            radius: baseBall.radius,
            temporary: true,
            expiresAt: gameState.splitUntil
        });

        if (nextBalls.length >= CONFIG.maxBalls) {
            return;
        }

        const splitB = normalize(-baseBall.vx, baseBall.vy - variation * baseSpeed, baseSpeed);
        nextBalls.push({
            x: baseBall.x,
            y: baseBall.y,
            vx: splitB.vx,
            vy: -Math.abs(splitB.vy),
            radius: baseBall.radius,
            temporary: true,
            expiresAt: gameState.splitUntil
        });
    });

    gameState.balls = nextBalls.slice(0, CONFIG.maxBalls).map((ball, index) => {
        if (index === 0) {
            return { ...ball, temporary: false, expiresAt: null };
        }
        return { ...ball, temporary: true, expiresAt: gameState.splitUntil };
    });
}

function updateItems(now) {
    for (let i = gameState.items.length - 1; i >= 0; i -= 1) {
        const item = gameState.items[i];
        item.y += item.vy;

        if (
            item.x + item.size >= gameState.paddle.x &&
            item.x - item.size <= gameState.paddle.x + gameState.paddle.width &&
            item.y + item.size >= gameState.paddle.y &&
            item.y - item.size <= gameState.paddle.y + gameState.paddle.height
        ) {
            if (item.type === "slow") {
                applySlowItem(now);
            } else {
                applySplitItem(now);
            }
            gameState.items.splice(i, 1);
            continue;
        }

        if (item.y - item.size > canvas.height) {
            gameState.items.splice(i, 1);
        }
    }
}

function updatePaddle() {
    gameState.paddle.vx = 0;

    if (inputState.left) {
        gameState.paddle.vx = -CONFIG.paddle.speed;
    }

    if (inputState.right) {
        gameState.paddle.vx = CONFIG.paddle.speed;
    }

    gameState.paddle.x += gameState.paddle.vx;
    gameState.paddle.x = clamp(gameState.paddle.x, 0, canvas.width - gameState.paddle.width);
}

function handlePaddleCollision(ball) {
    if (
        ball.x + ball.radius >= gameState.paddle.x &&
        ball.x - ball.radius <= gameState.paddle.x + gameState.paddle.width &&
        ball.y + ball.radius >= gameState.paddle.y &&
        ball.y - ball.radius <= gameState.paddle.y + gameState.paddle.height &&
        ball.vy > 0
    ) {
        const hitRatio = ((ball.x - gameState.paddle.x) / gameState.paddle.width) * 2 - 1;
        const clampedRatio = clamp(hitRatio, -1, 1);
        const speed = Math.hypot(ball.vx, ball.vy);

        ball.vx = speed * clampedRatio * CONFIG.ball.maxX;
        ball.vy = -Math.abs(speed * (1 - Math.abs(clampedRatio) * 0.3));

        if (Math.abs(ball.vy) < speed * 0.35) {
            ball.vy = -speed * 0.35;
        }
    }
}

function handleBlockCollision(ball) {
    for (let i = gameState.blocks.length - 1; i >= 0; i -= 1) {
        const block = gameState.blocks[i];

        const nearestX = clamp(ball.x, block.x, block.x + block.width);
        const nearestY = clamp(ball.y, block.y, block.y + block.height);
        const dx = ball.x - nearestX;
        const dy = ball.y - nearestY;

        if (dx * dx + dy * dy > ball.radius * ball.radius) {
            continue;
        }

        const overlapX = ball.radius - Math.abs(dx);
        const overlapY = ball.radius - Math.abs(dy);

        if (overlapX < overlapY) {
            ball.vx *= -1;
        } else {
            ball.vy *= -1;
        }

        gameState.blocks.splice(i, 1);
        gameState.score += 10;
        spawnItem(block.x + block.width / 2, block.y + block.height / 2);

        if (gameState.blocks.length === 0) {
            startNextStage();
            return true;
        }

        updateHud();
        return false;
    }

    return false;
}

function updateBalls(now) {
    for (let i = gameState.balls.length - 1; i >= 0; i -= 1) {
        const ball = gameState.balls[i];

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x - ball.radius <= 0 && ball.vx < 0) {
            ball.x = ball.radius;
            ball.vx *= -1;
        }

        if (ball.x + ball.radius >= canvas.width && ball.vx > 0) {
            ball.x = canvas.width - ball.radius;
            ball.vx *= -1;
        }

        if (ball.y - ball.radius <= 0 && ball.vy < 0) {
            ball.y = ball.radius;
            ball.vy *= -1;
        }

        handlePaddleCollision(ball);
        const stageChanged = handleBlockCollision(ball);
        if (stageChanged) {
            return;
        }

        if (ball.temporary && ball.expiresAt && now >= ball.expiresAt) {
            gameState.balls.splice(i, 1);
            continue;
        }

        if (ball.y - ball.radius > canvas.height + 10) {
            gameState.balls.splice(i, 1);
        }
    }

    if (gameState.balls.length === 0) {
        gameState.lives -= 1;
        updateHud();

        if (gameState.lives <= 0) {
            gameState.running = false;
            showOverlay(`GAME OVER\nSCORE: ${gameState.score}`, "TRY AGAIN");
            return;
        }

        gameState.balls = [createBall(canvas.width / 2, canvas.height - 70, CONFIG.ball.speed)];
        gameState.paddle.x = canvas.width / 2 - gameState.paddle.width / 2;
    }
}

function drawBackground() {
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, "#071a34");
    grd.addColorStop(1, "#040913");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(89, 157, 255, 0.08)";
    for (let i = 0; i < 16; i += 1) {
        const y = 40 + i * 34;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawPaddle() {
    ctx.save();
    ctx.shadowColor = "rgba(123, 218, 255, 0.88)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#6fd7ff";
    ctx.fillRect(gameState.paddle.x, gameState.paddle.y, gameState.paddle.width, gameState.paddle.height);
    ctx.restore();
}

function drawBalls() {
    gameState.balls.forEach((ball) => {
        ctx.save();
        ctx.shadowColor = ball.temporary ? "rgba(159, 255, 160, 0.9)" : "rgba(220, 247, 255, 0.92)";
        ctx.shadowBlur = ball.temporary ? 16 : 12;
        ctx.fillStyle = ball.temporary ? "#9eff7f" : "#ffffff";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawBlocks() {
    gameState.blocks.forEach((block) => {
        ctx.save();
        ctx.shadowColor = block.color.glow;
        ctx.shadowBlur = 8;
        ctx.fillStyle = block.color.fill;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        ctx.restore();

        ctx.strokeStyle = "rgba(222, 241, 255, 0.35)";
        ctx.strokeRect(block.x, block.y, block.width, block.height);
    });
}

function drawItems() {
    gameState.items.forEach((item) => {
        const isSlow = item.type === "slow";
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.shadowColor = isSlow ? "rgba(125, 217, 255, 0.92)" : "rgba(184, 255, 122, 0.92)";
        ctx.shadowBlur = 16;
        ctx.fillStyle = isSlow ? "#71d6ff" : "#a8ff65";
        ctx.beginPath();
        ctx.arc(0, 0, item.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#0a1526";
        ctx.font = "11px 'Press Start 2P', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isSlow ? "S" : "X", 0, 1);
        ctx.restore();
    });
}

function render() {
    drawBackground();
    drawBlocks();
    drawItems();
    drawPaddle();
    drawBalls();
}

function update(now) {
    if (!gameState.running) {
        return;
    }

    updatePaddle();
    updateItems(now);
    updateEffectBoard(now);
    updateBalls(now);
}

function loop(timestamp) {
    const now = timestamp || performance.now();
    const delta = now - lastTime;
    lastTime = now;

    if (delta > 0) {
        update(now);
        render();
    }

    requestAnimationFrame(loop);
}

function handlePointer(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    gameState.paddle.x = clamp(x - gameState.paddle.width / 2, 0, canvas.width - gameState.paddle.width);
}

window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        inputState.left = true;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        inputState.right = true;
    }

    if (event.key === "Enter" && !gameState.running) {
        startNewGame();
    }
});

window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        inputState.left = false;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        inputState.right = false;
    }
});

canvas.addEventListener("mousemove", (event) => {
    handlePointer(event.clientX);
});

canvas.addEventListener("touchmove", (event) => {
    if (!event.touches[0]) {
        return;
    }
    handlePointer(event.touches[0].clientX);
    event.preventDefault();
}, { passive: false });

ui.restartBtn.addEventListener("click", () => {
    startNewGame();
});

resetInput();
startNewGame();
render();
requestAnimationFrame(loop);
