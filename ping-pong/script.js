const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

// Game Objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    velocityX: 5,
    velocityY: 5,
    speed: 7,
    color: "#fff"
};

const user = {
    x: 0, 
    y: (canvas.height - 100) / 2, 
    width: 10,
    height: 100,
    score: 0,
    color: "#4facfe"
};

const com = {
    x: canvas.width - 10, 
    y: (canvas.height - 100) / 2, 
    width: 10,
    height: 100,
    score: 0,
    color: "#ff5252"
};

const net = {
    x: (canvas.width - 2) / 2,
    y: 0,
    height: 10,
    width: 2,
    color: "#fff"
};

// Drawing Functions
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawArc(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

function drawNet() {
    for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

function drawText(text, x, y) {
    ctx.fillStyle = "#FFF";
    ctx.font = "75px 'Press Start 2P'";
    ctx.fillText(text, x, y);
}

// Game Logic
function collision(b, p) {
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

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 7;
}

function update() {
    // Move the ball
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // AI Logic (Simple computer opponent)
    // Computer paddle follows ball position with lag
    com.y += (ball.y - (com.y + com.height / 2)) * 0.1;

    // Wall Collision (Top/Bottom)
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
    }

    // Paddle Collision
    let player = (ball.x + ball.radius < canvas.width / 2) ? user : com;

    if (collision(ball, player)) {
        // Where the ball hit the paddle
        let collidePoint = (ball.y - (player.y + player.height / 2));
        collidePoint = collidePoint / (player.height / 2);

        // Calculate angle (Max 45 degrees)
        let angleRad = (Math.PI / 4) * collidePoint;

        // Change X direction and increase speed
        let direction = (ball.x + ball.radius < canvas.width / 2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);

        // Increase speed slightly every hit
        ball.speed += 0.1;
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        com.score++;
        document.getElementById("computer-score").innerText = com.score;
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        user.score++;
        document.getElementById("player-score").innerText = user.score;
        resetBall();
    }
}

function render() {
    // Clear Canvas
    drawRect(0, 0, canvas.width, canvas.height, "#111");

    // Draw Net
    drawNet();

    // Draw Paddles
    drawRect(user.x, user.y, user.width, user.height, user.color);
    drawRect(com.x, com.y, com.width, com.height, com.color);

    // Draw Ball
    drawArc(ball.x, ball.y, ball.radius, ball.color);
}

function game() {
    update();
    render();
}

// Control the paddle with mouse
canvas.addEventListener("mousemove", getMousePos);

function getMousePos(evt) {
    let rect = canvas.getBoundingClientRect();
    user.y = evt.clientY - rect.top - user.height / 2;
}

// Loop (60 FPS)
const framePerSecond = 60;
setInterval(game, 1000 / framePerSecond);
