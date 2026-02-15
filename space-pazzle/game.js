// Matter.js modules
const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

// ゲーム設定
const TEXTURE_PATH = 'planets.png';
const SPRITE_DATA = { width: 640, height: 640, cols: 3, rows: 3 };
const PATCH_W = 640 / 3;
const PATCH_H = 640 / 3;

// 3x3のグリッドに合わせて9種類
const PLANETS = [
    { name: 'Moon', radius: 15, score: 2, nextIdx: 1, sprite: { x: 0, y: 0 } },
    { name: 'Mercury', radius: 24, score: 4, nextIdx: 2, sprite: { x: 1, y: 0 } },
    { name: 'Venus', radius: 34, score: 8, nextIdx: 3, sprite: { x: 2, y: 0 } },
    { name: 'Earth', radius: 46, score: 16, nextIdx: 4, sprite: { x: 0, y: 1 } },
    { name: 'Jupiter', radius: 62, score: 32, nextIdx: 5, sprite: { x: 1, y: 1 } },
    { name: 'Saturn', radius: 82, score: 64, nextIdx: 6, sprite: { x: 2, y: 1 } },
    { name: 'Uranus', radius: 106, score: 128, nextIdx: 7, sprite: { x: 0, y: 2 } },
    { name: 'Neptune', radius: 135, score: 256, nextIdx: 8, sprite: { x: 1, y: 2 } },
    { name: 'Sun', radius: 170, score: 512, nextIdx: null, sprite: { x: 2, y: 2 } }
];

// 状態管理
let engine, render, runner;
let canvasWidth, canvasHeight;
let currentPlanet = null;
let nextPlanetIdx = Math.floor(Math.random() * 3); // 最初は小さめ
let score = 0;
let bestScore = parseInt(localStorage.getItem('space-pazzle-best-score')) || 0;
let bestDate = localStorage.getItem('space-pazzle-best-date') || '';
let isGameOver = false;
let isDropping = false;
let isDragging = false;
let planetImage = new Image();
let effects = []; // エフェクト管理用
planetImage.src = TEXTURE_PATH;

// 初期化
function init() {
    const container = document.getElementById('game-canvas-container');
    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;

    engine = Engine.create();
    
    render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: canvasWidth,
            height: canvasHeight,
            wireframes: false,
            background: 'transparent'
        }
    });

    // カスタム描画の実装
    const originalRenderBodies = Render.bodies;
    Render.bodies = function(render, bodies, context) {
        // 標準の描画（壁など）
        originalRenderBodies(render, bodies, context);
        
        bodies.forEach(body => {
            if (body.label && body.label.startsWith('planet_')) {
                const idx = parseInt(body.label.split('_')[1]);
                const planet = PLANETS[idx];
                
                context.save();
                context.translate(body.position.x, body.position.y);
                context.rotate(body.angle);
                
                // 円形でクリッピング
                context.beginPath();
                context.arc(0, 0, planet.radius, 0, Math.PI * 2);
                context.clip();
                
                // 画像を描画
                const drawSize = planet.radius * 2.05;
                context.drawImage(
                    planetImage,
                    planet.sprite.x * PATCH_W, planet.sprite.y * PATCH_H, PATCH_W, PATCH_H,
                    -drawSize/2, -drawSize/2, drawSize, drawSize
                );
                
                context.restore();

                // 輪郭線と光彩を追加
                context.save();
                context.translate(body.position.x, body.position.y);
                context.beginPath();
                context.arc(0, 0, planet.radius, 0, Math.PI * 2);
                context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                context.lineWidth = 1.5;
                context.stroke();
                // 軽い光彩
                context.shadowBlur = 10;
                context.shadowColor = 'rgba(255, 255, 255, 0.2)';
                context.stroke();
                context.restore();
            }
        });

        // デッドライン（ガイドライン）の描画
        const deadlineY = 70;
        context.save();
        context.setLineDash([5, 5]);
        context.beginPath();
        context.moveTo(0, deadlineY);
        context.lineTo(canvasWidth, deadlineY);
        context.strokeStyle = 'rgba(255, 62, 62, 0.8)';
        context.lineWidth = 2;
        context.stroke();

        // 警告テキストの描画
        context.setLineDash([]);
        context.font = 'bold 14px Outfit, sans-serif';
        context.fillStyle = 'rgba(255, 62, 62, 0.8)';
        context.textAlign = 'right';
        context.fillText('DEADLINE', canvasWidth - 10, deadlineY - 8);
        context.restore();

        // エフェクト（テキスト・パーティクル）の描画と更新
        const currentTime = Date.now();
        effects = effects.filter(eff => {
            const elapsed = currentTime - eff.startTime;
            const progress = elapsed / eff.duration;
            if (progress >= 1) return false;

            context.save();
            const opacity = 1 - progress;
            
            if (eff.type === 'text') {
                // テキストエフェクト（上昇しながらフェードアウト）
                context.globalAlpha = opacity;
                context.fillStyle = '#fff';
                context.font = 'bold 20px Outfit, sans-serif';
                context.textAlign = 'center';
                context.shadowBlur = 10;
                context.shadowColor = eff.color || '#00f2ff';
                context.fillText(eff.text, eff.x, eff.y - (progress * 50));
            } else if (eff.type === 'particle') {
                // パーティクルエフェクト
                context.globalAlpha = opacity;
                context.fillStyle = eff.color || '#fff';
                const size = eff.size * (1 - progress);
                context.beginPath();
                context.arc(eff.x + eff.vx * elapsed * 0.1, eff.y + eff.vy * elapsed * 0.1, size, 0, Math.PI * 2);
                context.fill();
            }
            context.restore();
            return true;
        });
    };

    const wallOptions = { 
        isStatic: true, 
        render: { fillStyle: 'rgba(255,255,255,0.05)', strokeStyle: 'rgba(255,255,255,0.1)', lineWidth: 1 } 
    };
    const ground = Bodies.rectangle(canvasWidth / 2, canvasHeight + 10, canvasWidth, 20, wallOptions);
    const leftWall = Bodies.rectangle(-10, canvasHeight / 2, 20, canvasHeight, wallOptions);
    const rightWall = Bodies.rectangle(canvasWidth + 10, canvasHeight / 2, 20, canvasHeight, wallOptions);
    
    Composite.add(engine.world, [ground, leftWall, rightWall]);

    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);

    updatePreview();
    spawnPlanet();

    // ハイスコアの表示
    document.getElementById('best-score').innerText = bestScore;
    document.getElementById('best-date').innerText = bestDate;

    // マウス/タッチ操作の設定
    container.addEventListener('mousedown', (e) => {
        if (isGameOver || isDropping) return;
        isDragging = true;
        movePlanet(e);
    });
    container.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (isGameOver || isDropping) return;
        isDragging = true;
        const touch = e.touches[0];
        movePlanet({ clientX: touch.clientX });
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) movePlanet(e);
    });
    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        movePlanet({ clientX: touch.clientX });
    }, { passive: false });

    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchend', handleRelease);

    Events.on(engine, 'collisionStart', handleCollision);
    Events.on(engine, 'afterUpdate', checkGameOver);

    // リサイズ対応
    window.addEventListener('resize', () => {
        canvasWidth = container.clientWidth;
        canvasHeight = container.clientHeight;
        render.canvas.width = canvasWidth;
        render.canvas.height = canvasHeight;
        render.options.width = canvasWidth;
        render.options.height = canvasHeight;
    });
}

function updatePreview() {
    const preview = document.getElementById('next-planet-preview');
    const planet = PLANETS[nextPlanetIdx];
    
    preview.innerHTML = '';
    
    // 惑星名の表示用要素を追加
    const nameLabel = document.createElement('div');
    nameLabel.className = 'next-planet-name';
    nameLabel.innerText = planet.name;
    preview.appendChild(nameLabel);

    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    
    if (planetImage.complete) {
        ctx.beginPath();
        ctx.arc(30, 30, 28, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
            planetImage,
            planet.sprite.x * PATCH_W, planet.sprite.y * PATCH_H, PATCH_W, PATCH_H,
            0, 0, 60, 60
        );
    } else {
        planetImage.onload = () => updatePreview();
    }
    
    preview.appendChild(canvas);
}

function spawnPlanet() {
    if (isGameOver) return;
    
    const planetData = PLANETS[nextPlanetIdx];
    const x = canvasWidth / 2;
    const y = 50;

    currentPlanet = Bodies.circle(x, y, planetData.radius, {
        isStatic: true,
        label: `planet_${nextPlanetIdx}`,
        render: { opacity: 0 },
        restitution: 0.3,
        friction: 0.1
    });

    Composite.add(engine.world, currentPlanet);
    
    // 次を決定 (最初の3段階から)
    nextPlanetIdx = Math.floor(Math.random() * 3);
    updatePreview();
    isDropping = false;
}

function movePlanet(e) {
    if (!currentPlanet || isDropping || isGameOver || !isDragging) return;
    
    // キャンバスの位置を取得
    const container = document.getElementById('game-canvas-container');
    const rect = container.getBoundingClientRect();
    let x = e.clientX - rect.left;
    
    const radius = currentPlanet.circleRadius;
    // 画面端の制限（マージンを持たせる）
    x = Math.max(radius + 5, Math.min(canvasWidth - radius - 5, x));
    
    Body.setPosition(currentPlanet, { x: x, y: 50 });
}

function handleRelease() {
    if (!currentPlanet || isDropping || isGameOver || !isDragging) return;
    
    isDragging = false;
    Body.setStatic(currentPlanet, false);
    isDropping = true;
    
    setTimeout(() => {
        spawnPlanet();
    }, 800);
}

function handleCollision(event) {
    const pairs = event.pairs;
    
    pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        if (bodyA.isSettling || bodyB.isSettling) return;

        if (bodyA.label && bodyB.label && bodyA.label.startsWith('planet_') && bodyB.label.startsWith('planet_')) {
            const idxA = parseInt(bodyA.label.split('_')[1]);
            const idxB = parseInt(bodyB.label.split('_')[1]);
            
            if (idxA === idxB && PLANETS[idxA].nextIdx !== null) {
                bodyA.isSettling = true;
                bodyB.isSettling = true;

                const nextIdx = PLANETS[idxA].nextIdx;
                const newX = (bodyA.position.x + bodyB.position.x) / 2;
                const newY = (bodyA.position.y + bodyB.position.y) / 2;
                
                Composite.remove(engine.world, [bodyA, bodyB]);
                
                const nextPlanetData = PLANETS[nextIdx];
                const newPlanet = Bodies.circle(newX, newY, nextPlanetData.radius, {
                    label: `planet_${nextIdx}`,
                    render: { opacity: 0 },
                    restitution: 0.3,
                    friction: 0.1
                });
                
                Composite.add(engine.world, newPlanet);
                score += nextPlanetData.score;
                document.getElementById('score').innerText = score;

                // 合成エフェクトの生成
                createMergeEffect(newX, newY, nextPlanetData.name);

                // ハイスコアの更新
                if (score > bestScore) {
                    bestScore = score;
                    const now = new Date();
                    bestDate = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                    
                    localStorage.setItem('space-pazzle-best-score', bestScore);
                    localStorage.setItem('space-pazzle-best-date', bestDate);
                    
                    document.getElementById('best-score').innerText = bestScore;
                    document.getElementById('best-date').innerText = bestDate;
                }
            }
        }
    });
}

function checkGameOver() {
    if (isGameOver) return;
    
    const bodies = Composite.allBodies(engine.world);
    const deadlineY = 70; // ガイドラインと一致させる
    const currentTime = Date.now();

    for (let body of bodies) {
        if (body.label && body.label.startsWith('planet_') && !body.isStatic) {
            // スポーン直後の惑星を除外
            if (body.position.y < deadlineY && (body.id !== currentPlanet?.id || isDropping)) {
                // 速度が十分小さく、かつデッドラインを超えている時間を追跡
                if (Math.abs(body.velocity.y) < 0.1 && Math.abs(body.velocity.x) < 0.1) {
                    if (!body.overLineStart) {
                        body.overLineStart = currentTime;
                    } else if (currentTime - body.overLineStart > 1000) {
                        // 1秒以上デッドラインを超えて静止している場合にゲームオーバー
                        endGame();
                        break;
                    }
                } else {
                    // 動いている場合はタイマーリセット
                    body.overLineStart = null;
                }
            } else {
                body.overLineStart = null;
            }
        }
    }
}

function endGame() {
    isGameOver = true;
    document.getElementById('final-score').innerText = score;
    document.getElementById('final-best').innerText = bestScore;
    document.getElementById('final-best-date').innerText = bestDate;
    document.getElementById('game-over-screen').classList.remove('hidden');
    Runner.stop(runner);
}

function restartGame() {
    score = 0;
    isGameOver = false;
    effects = []; // エフェクトをクリア
    document.getElementById('score').innerText = '0';
    document.getElementById('game-over-screen').classList.add('hidden');
    
    Composite.clear(engine.world);
    
    const wallOptions = { 
        isStatic: true, 
        render: { fillStyle: 'rgba(255,255,255,0.05)', strokeStyle: 'rgba(255,255,255,0.1)', lineWidth: 1 } 
    };
    const ground = Bodies.rectangle(canvasWidth / 2, canvasHeight + 10, canvasWidth, 20, wallOptions);
    const leftWall = Bodies.rectangle(-10, canvasHeight / 2, 20, canvasHeight, wallOptions);
    const rightWall = Bodies.rectangle(canvasWidth + 10, canvasHeight / 2, 20, canvasHeight, wallOptions);
    Composite.add(engine.world, [ground, leftWall, rightWall]);

    Runner.run(runner, engine);
    spawnPlanet();
}

function createMergeEffect(x, y, planetName) {
    const color = '#00f2ff';
    const startTime = Date.now();
    
    // 名称テキストエフェクト
    effects.push({
        type: 'text',
        x: x,
        y: y,
        text: planetName,
        color: color,
        duration: 1500,
        startTime: startTime
    });
    
    // パーティクルエフェクト
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        const speed = 2 + Math.random() * 3;
        effects.push({
            type: 'particle',
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 4,
            color: color,
            duration: 800 + Math.random() * 400,
            startTime: startTime
        });
    }
}

document.getElementById('restart-button').addEventListener('click', restartGame);
window.onload = init;
