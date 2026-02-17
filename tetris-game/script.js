const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('restart-btn');
const modal = document.getElementById('game-over-modal');

context.scale(20, 20);
nextContext.scale(20, 20);

// Tetromino definitions
const pieces = 'ILJOTSZ';
const colors = [
    null,
    '#FF0D72', // T - Purple/Pink
    '#0DC2FF', // I - Cyan
    '#0DFF72', // S - Green
    '#F538FF', // Z - Magenta
    '#FF8E0D', // L - Orange
    '#FFE138', // J - Yellow
    '#3877FF', // O - Blue
];

const piecesShapes = {
    'T': [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    'I': [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
    ],
    'S': [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
    ],
    'Z': [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
    ],
    'L': [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
    ],
    'J': [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
    ],
    'O': [
        [1, 1],
        [1, 1],
    ],
};

function createPiece(type) {
    return piecesShapes[type];
}

function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Neon glow effect for blocks
                ctx.fillStyle = colors[value];
                ctx.shadowBlur = 10;
                ctx.shadowColor = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // Inner highlight for 3D effect
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(x + offset.x + 0.1, y + offset.y + 0.1, 0.8, 0.8);
            }
        });
    });
}

function draw() {
    // Clear canvas
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid (faint)
    context.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    context.lineWidth = 0.05;
    for (let i = 0; i < 12; i++) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, 20);
        context.stroke();
    }
    for (let i = 0; i < 20; i++) {
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(12, i);
        context.stroke();
    }

    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function drawNext() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Center the piece in the preview box
    const xOffset = (5 - nextPiece.matrix[0].length) / 2;
    const yOffset = (5 - nextPiece.matrix.length) / 2;
    
    drawMatrix(nextPiece.matrix, {x: xOffset, y: yOffset}, nextContext);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
    if (nextPiece.type === null) {
         const piecesStr = 'TJLOSZI';
         nextPiece.type = piecesStr[piecesStr.length * Math.random() | 0];
         nextPiece.matrix = createPiece(nextPiece.type);
         // Assign color index based on type
         const colorIndex = piecesStr.indexOf(nextPiece.type) + 1;
         nextPiece.matrix.forEach((row, y) => row.forEach((val, x) => { if(val) nextPiece.matrix[y][x] = colorIndex; }));
    }

    player.matrix = nextPiece.matrix;
    // Current piece gets the color of the next piece (which is now current)
    // We need to fetch a NEW next piece
    
    const piecesStr = 'TJLOSZI';
    const type = piecesStr[piecesStr.length * Math.random() | 0];
    const matrix = createPiece(type);
    const colorIndex = piecesStr.indexOf(type) + 1;
    // Apply color to the matrix
    matrix.forEach((row, y) => row.forEach((val, x) => { if(val) matrix[y][x] = colorIndex; }));
    
    nextPiece.type = type;
    nextPiece.matrix = matrix;
    
    drawNext();

    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
                   
    if (collide(arena, player)) {
        gameOver();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1)); // zigzag search for valid position
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length -1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        rowCount++;
    }

    if (rowCount > 0) {
        // Scoring: 40, 100, 300, 1200 * level
        const lineScores = [0, 40, 100, 300, 1200];
        player.score += lineScores[rowCount] * (player.level + 1);
        player.lines += rowCount;
        // Level up every 10 lines
        player.level = Math.floor(player.lines / 10);
        
        // Increase speed with level
        dropInterval = Math.max(100, 1000 - (player.level * 50));
    }
}

function updateScore() {
    scoreElement.innerText = player.score;
    levelElement.innerText = player.level;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function gameOver() {
    isGameOver = true;
    finalScoreElement.innerText = player.score;
    modal.classList.remove('hidden');
}

function restartGame() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.level = 0;
    dropInterval = 1000;
    updateScore();
    isGameOver = false;
    modal.classList.add('hidden');
    playerReset();
    update();
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isGameOver = false;

function update(time = 0) {
    if (isGameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    lines: 0,
    level: 0,
};

const nextPiece = {
    type: null,
    matrix: null
};

function hardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

document.addEventListener('keydown', event => {
    if (isGameOver) return;
    
    if (event.keyCode === 37) { // Left arrow
        playerMove(-1);
    } else if (event.keyCode === 39) { // Right arrow
        playerMove(1);
    } else if (event.keyCode === 40) { // Down arrow
        playerDrop();
    } else if (event.keyCode === 38) { // Up arrow - Rotate
        playerRotate(1);
    } else if (event.keyCode === 32) { // Space - Hard Drop
        hardDrop();
    }
});

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
const swipeThreshold = 20;
const tapThreshold = 12;
const tapMaxDuration = 220;
const horizontalStepPixels = 28;
const maxHorizontalMovesPerSwipe = 6;

function onTouchStart(event) {
    if (isGameOver || event.touches.length === 0) return;
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    event.preventDefault();
}

function onTouchEnd(event) {
    if (isGameOver || event.changedTouches.length === 0) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const duration = Date.now() - touchStartTime;

    if (absDx < tapThreshold && absDy < tapThreshold && duration <= tapMaxDuration) {
        playerRotate(1);
        event.preventDefault();
        return;
    }

    if (absDx >= absDy && absDx > swipeThreshold) {
        const direction = dx > 0 ? 1 : -1;
        const moves = Math.min(
            maxHorizontalMovesPerSwipe,
            Math.max(1, Math.floor(absDx / horizontalStepPixels))
        );
        for (let i = 0; i < moves; i++) {
            playerMove(direction);
        }
        event.preventDefault();
        return;
    }

    if (absDy > swipeThreshold && dy > 0) {
        hardDrop();
        event.preventDefault();
    }
}

canvas.addEventListener('touchstart', onTouchStart, { passive: false });
canvas.addEventListener('touchend', onTouchEnd, { passive: false });
canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
}, { passive: false });

startBtn.addEventListener('click', restartGame);

// Initial start
playerReset();
updateScore();
update();
