const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

const ui = {
    playerScore: document.getElementById("player-score"),
    computerScore: document.getElementById("computer-score"),
    phase: document.getElementById("phase-label"),
    rally: document.getElementById("rally-count"),
    bestScoreLabel: document.getElementById("best-score-label"),
    bestDateLabel: document.getElementById("best-date-label"),
    characterSelect: document.getElementById("character-select"),
    characterOptions: document.getElementById("character-options"),
    startMatchBtn: document.getElementById("start-match-btn")
};

const CONFIG = {
    winScore: 11,
    minLead: 2,
    ballRadius: 8.5,
    baseBallSpeed: 6.2,
    maxBallSpeed: 18,
    servePauseFrames: 48,
    itemSpawnMin: 210,
    itemSpawnMax: 360,
    maxBalls: 6,
    effects: {
        split: 600,
        moveBoost: 600,
        shotBoost: 600
    },
    colors: {
        bgTop: "#061126",
        bgBottom: "#0c1b35",
        net: "#153653",
        courtGlow: "rgba(0, 243, 255, 0.20)",
        player: "#00f3ff",
        playerAccent: "#7cfff8",
        ai: "#ff0055",
        aiAccent: "#ff9ec2",
        ball: "#ffffff",
        split: "#7dff59",
        moveBoost: "#38b6ff",
        shotBoost: "#ffb44d"
    }
};

const BEST_SCORE_KEY = "neo-pong-best-score-v1";
const BEST_SCORE_AT_KEY = "neo-pong-best-score-at-v1";

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatRecordDate(isoString) {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "-";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

const CHARACTER_ROSTER = [
    {
        id: "ace-blue",
        name: "ACE BLUE",
        spriteSrc: "images/player_anime_blue.svg",
        spriteScale: 0.82,
        color: "#00f3ff",
        accent: "#7cfff8",
        playerRacketAssist: 9,
        aiRacketAssist: 5,
        roleLabel: "SPEED",
        traits: {
            moveSpeed: 1.18,
            pickupScale: 0.98,
            shotPower: 1.05,
            chatterRate: 0.003,
            chatterLines: ["いくよっ!", "スピード勝負!", "その球とるよ!"]
        }
    },
    {
        id: "emerald-flare",
        name: "EMERALD",
        spriteSrc: "images/player_anime_green.svg",
        spriteScale: 0.84,
        color: "#7dffb9",
        accent: "#c6ffe8",
        playerRacketAssist: 9,
        aiRacketAssist: 5,
        roleLabel: "CATCH",
        traits: {
            moveSpeed: 0.94,
            pickupScale: 1.34,
            shotPower: 0.95,
            chatterRate: 0.002,
            chatterLines: ["よーし集めるよ!", "アイテムきた!", "まだまだいける!"]
        }
    },
    {
        id: "blaze-orbit",
        name: "BLAZE",
        spriteSrc: "images/player_anime_orange.svg",
        spriteScale: 0.84,
        color: "#ffb36b",
        accent: "#ffe2c2",
        playerRacketAssist: 9,
        aiRacketAssist: 5,
        roleLabel: "SMASH",
        traits: {
            moveSpeed: 1.0,
            pickupScale: 0.96,
            shotPower: 1.28,
            chatterRate: 0.0014,
            chatterLines: ["パワーで押す!", "一気に決める!", "燃えてきた!"]
        }
    },
    {
        id: "violet-strike",
        name: "VIOLET",
        spriteSrc: "images/player_anime_violet.svg",
        spriteScale: 0.84,
        color: "#c5a3ff",
        accent: "#efe5ff",
        playerRacketAssist: 9,
        aiRacketAssist: 5,
        roleLabel: "TALK",
        traits: {
            moveSpeed: 1.03,
            pickupScale: 1.08,
            shotPower: 1.0,
            chatterRate: 0.0065,
            chatterLines: ["次は左かな?", "ふふ、読めてるよ", "ナイスラリー!", "まだいけるよね?", "その手には乗らないよ!"]
        }
    },
    {
        id: "rose-rival",
        name: "ROSE",
        spriteSrc: "images/player_anime_pink.svg",
        spriteScale: 0.84,
        color: "#ff82cb",
        accent: "#ffe0f2",
        playerRacketAssist: 9,
        aiRacketAssist: 5,
        roleLabel: "TRICK",
        traits: {
            moveSpeed: 1.08,
            pickupScale: 1.04,
            shotPower: 1.12,
            chatterRate: 0.0045,
            chatterLines: ["見切った!", "そのコースね!", "いい感じ!", "まだ終わらないよ!"]
        }
    }
];

const PLAYER_CHARACTER_IDS = ["ace-blue", "emerald-flare", "blaze-orbit", "violet-strike"];
const NPC_CHARACTER_IDS = ["rose-rival", "emerald-flare", "blaze-orbit", "violet-strike", "ace-blue"];

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = randomRange(2, 5);
        const angle = randomRange(0, Math.PI * 2);
        const speed = randomRange(1, 5);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = randomRange(0.02, 0.05);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        this.radius *= 0.96;
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

class FlowItem {
    constructor(type) {
        this.type = type;
        this.radius = 16;
        this.x = canvas.width + this.radius + randomRange(10, 60);
        this.y = randomRange(70, canvas.height - 70);
        this.vx = -randomRange(2.3, 3.6);
        this.vy = randomRange(-0.3, 0.3);
        this.phase = randomRange(0, Math.PI * 2);
        this.active = true;
    }

    update(frameCount) {
        this.x += this.vx;
        this.y += this.vy + Math.sin(frameCount * 0.08 + this.phase) * 0.45;
        this.y = clamp(this.y, 45, canvas.height - 45);
        if (this.x < -40) this.active = false;
    }

    draw(ctx) {
        const map = {
            split: { label: "SPLIT", color: CONFIG.colors.split },
            moveBoost: { label: "MOVE", color: CONFIG.colors.moveBoost },
            shotBoost: { label: "SHOT", color: CONFIG.colors.shotBoost }
        };

        const config = map[this.type];

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 18;
        ctx.shadowColor = config.color;

        ctx.fillStyle = "rgba(8, 18, 36, 0.9)";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = config.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = config.color;
        ctx.font = "8px 'Press Start 2P', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.label, 0, 0);
        ctx.restore();
    }
}

class Character {
    constructor(options) {
        const defaultTraits = {
            moveSpeed: 1,
            pickupScale: 1,
            shotPower: 1,
            chatterRate: 0,
            chatterLines: []
        };

        this.side = options.side;
        this.name = options.name;
        this.variantId = options.variantId || "";
        this.variantName = options.variantName || this.name;
        this.x = options.x;
        this.y = options.y;
        this.minX = options.minX ?? this.x;
        this.maxX = options.maxX ?? this.x;
        this.followRateX = options.followRateX ?? options.followRateY;
        this.followRateY = options.followRateY;
        this.width = options.width;
        this.height = options.height;
        this.color = options.color;
        this.accent = options.accent;
        this.spriteSrc = options.spriteSrc || null;
        this.spriteScale = options.spriteScale ?? 1;
        this.racketAssist = options.racketAssist ?? 0;
        this.traits = { ...defaultTraits, ...(options.traits || {}) };
        this.sprite = null;
        this.spriteLoaded = false;

        if (this.spriteSrc) {
            this.sprite = new Image();
            this.sprite.decoding = "async";
            this.sprite.onload = () => {
                this.spriteLoaded = true;
            };
            this.sprite.src = this.spriteSrc;
        }

        this.targetX = this.x;
        this.targetY = this.y;
        this.lastX = this.x;
        this.lastY = this.y;
        this.vx = 0;
        this.vy = 0;

        this.swingTimer = 0;
        this.swingPower = 1;
        this.armLength = this.width * 1.05;
        this.racketRadius = this.width * 0.23;

        this.score = 0;
    }

    setTargetX(x) {
        this.targetX = clamp(x, this.minX, this.maxX);
    }

    setTargetY(y) {
        this.targetY = clamp(y, 10, canvas.height - this.height - 10);
    }

    triggerSwing(power = 1) {
        this.swingTimer = 1;
        this.swingPower = clamp(power, 1, 1.9);
    }

    update() {
        this.lastX = this.x;
        this.x += (this.targetX - this.x) * this.followRateX;
        this.vx = this.x - this.lastX;

        this.lastY = this.y;
        this.y += (this.targetY - this.y) * this.followRateY;
        this.vy = this.y - this.lastY;

        if (this.swingTimer > 0) {
            this.swingTimer = Math.max(0, this.swingTimer - 0.13);
            if (this.swingTimer === 0) this.swingPower = 1;
        }
    }

    getSwingPose() {
        if (this.swingTimer <= 0) return 0;
        return Math.sin((1 - this.swingTimer) * Math.PI);
    }

    getRacketAngle() {
        const neutral = this.side === "left" ? -0.35 : Math.PI + 0.35;
        const arc = this.side === "left" ? 1.25 : -1.25;
        return neutral + arc * (0.15 + this.getSwingPose() * this.swingPower * 0.8);
    }

    getShoulder(frameCount) {
        const bob = Math.sin(frameCount * 0.12 + (this.side === "left" ? 0 : 1.8)) * 2;
        return {
            x: this.side === "left" ? this.x + this.width * 0.8 : this.x + this.width * 0.2,
            y: this.y + this.height * 0.45 + bob
        };
    }

    getRacketHead(frameCount) {
        const shoulder = this.getShoulder(frameCount);
        const angle = this.getRacketAngle();
        return {
            x: shoulder.x + Math.cos(angle) * this.armLength,
            y: shoulder.y + Math.sin(angle) * this.armLength,
            angle
        };
    }

    drawFallbackBody(ctx, frameCount, auraStrength) {
        ctx.strokeStyle = this.accent;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        const legSpread = 8 + Math.sin(frameCount * 0.18) * 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.45, this.y + this.height * 0.78);
        ctx.lineTo(this.x + this.width * 0.35 - legSpread, this.y + this.height + 2);
        ctx.moveTo(this.x + this.width * 0.55, this.y + this.height * 0.78);
        ctx.lineTo(this.x + this.width * 0.65 + legSpread, this.y + this.height + 2);
        ctx.stroke();

        ctx.shadowBlur = 16 + auraStrength * 8;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + this.width * 0.25, this.y + this.height * 0.2, this.width * 0.5, this.height * 0.62);

        ctx.fillStyle = this.accent;
        ctx.fillRect(this.x + this.width * 0.43, this.y + this.height * 0.35, this.width * 0.12, this.height * 0.2);

        ctx.shadowBlur = 10;
        ctx.fillStyle = "#e8feff";
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.12, this.width * 0.16, 0, Math.PI * 2);
        ctx.fill();
    }

    drawAnimeSprite(ctx, frameCount, auraStrength, swingPose) {
        const bob = Math.sin(frameCount * 0.12 + (this.side === "left" ? 0.5 : 1.9)) * 2.4;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height * 0.58 + bob;
        const spriteWidth = this.width * 1.28 * this.spriteScale;
        const spriteHeight = this.height * 1.72 * this.spriteScale;
        const sideSign = this.side === "left" ? 1 : -1;
        const lean = clamp((this.vx * 0.04 + this.vy * 0.015) * sideSign + swingPose * 0.12 * sideSign, -0.2, 0.2);
        const pulse = 1 + Math.sin(frameCount * 0.2 + (this.side === "left" ? 0 : 0.7)) * 0.015;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(lean);
        ctx.scale(pulse, pulse);

        if (auraStrength > 0) {
            ctx.save();
            ctx.fillStyle = this.side === "left" ? "rgba(99,248,255,0.24)" : "rgba(255,117,201,0.24)";
            ctx.beginPath();
            ctx.ellipse(0, spriteHeight * 0.08, spriteWidth * 0.58, spriteHeight * 0.34, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.shadowBlur = 14 + auraStrength * 16;
        ctx.shadowColor = this.color;
        ctx.drawImage(this.sprite, -spriteWidth / 2, -spriteHeight * 0.56, spriteWidth, spriteHeight);
        ctx.restore();
    }

    draw(ctx, frameCount, auraStrength = 0) {
        const shoulder = this.getShoulder(frameCount);
        const racket = this.getRacketHead(frameCount);
        const swingPose = this.getSwingPose();

        ctx.save();

        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height + 8, this.width * 0.55, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.spriteLoaded && this.sprite) {
            this.drawAnimeSprite(ctx, frameCount, auraStrength, swingPose);
        } else {
            this.drawFallbackBody(ctx, frameCount, auraStrength);
        }

        ctx.shadowBlur = 0;
        ctx.strokeStyle = this.accent;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(shoulder.x, shoulder.y);
        ctx.lineTo(racket.x, racket.y);
        ctx.stroke();

        ctx.fillStyle = "#f8f8ff";
        ctx.beginPath();
        ctx.arc(racket.x, racket.y, this.racketRadius, 0, Math.PI * 2);
        ctx.fill();

        if (swingPose > 0.05) {
            ctx.strokeStyle = this.side === "left" ? "rgba(0,243,255,0.4)" : "rgba(255,0,85,0.4)";
            ctx.lineWidth = 3;
            const arcRadius = this.armLength * 0.9;
            const baseStart = this.side === "left" ? -0.15 : Math.PI + 0.15;
            const baseEnd = this.side === "left" ? 0.85 : Math.PI - 0.85;
            ctx.beginPath();
            ctx.arc(shoulder.x, shoulder.y, arcRadius, baseStart, baseEnd, this.side !== "left");
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Game {
    constructor() {
        this.frameCount = 0;
        this.charWidth = 72;
        this.charHeight = 128;
        this.baseFollowRateX = 0.35;
        this.baseFollowRateY = 0.4;
        this.baseKeyboardSpeed = 10;
        this.keyState = { up: false, down: false, left: false, right: false };

        this.playerOptions = CHARACTER_ROSTER.filter((item) => PLAYER_CHARACTER_IDS.includes(item.id));
        this.npcOptions = CHARACTER_ROSTER.filter((item) => NPC_CHARACTER_IDS.includes(item.id));
        this.selectedPlayerId = this.playerOptions[0].id;
        this.selectedNpcId = null;
        this.selectionMode = true;

        const initialPlayer = this.getCharacterById(this.selectedPlayerId) || this.playerOptions[0];
        const initialNpc = this.pickRandomNpcVariant(this.selectedPlayerId);
        this.selectedNpcId = initialNpc.id;

        this.player = this.createCharacter("left", initialPlayer);
        this.ai = this.createCharacter("right", initialNpc);

        this.mouseX = this.player.x + this.player.width / 2;
        this.mouseY = canvas.height / 2;
        this.keyboardAimX = this.mouseX;
        this.keyboardAimY = this.mouseY;

        this.balls = [];
        this.items = [];
        this.particles = [];
        this.effects = { split: 0, moveBoost: 0, shotBoost: 0 };

        this.currentServer = Math.random() > 0.5 ? "left" : "right";
        this.pointsSinceServeSwitch = 0;
        this.pendingServe = true;
        this.roundPause = 40;

        this.itemSpawnTimer = randomInt(CONFIG.itemSpawnMin, CONFIG.itemSpawnMax);
        this.characterTalkCooldown = 0;

        this.gameOver = false;
        this.winner = null;
        this.message = "SELECT YOUR CHARACTER";
        this.messageTimer = 70;
        this.bestScore = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
        this.bestScoreAt = localStorage.getItem(BEST_SCORE_AT_KEY) || "";

        this.bindInput();
        this.setupCharacterSelectUi();
        this.updateCharacterSelectUi();
        this.updateHud();
    }

    getCharacterById(id) {
        return CHARACTER_ROSTER.find((item) => item.id === id) || null;
    }

    pickRandomNpcVariant(excludeId = "") {
        const pool = this.npcOptions.filter((item) => item.id !== excludeId);
        const candidates = pool.length > 0 ? pool : this.npcOptions;
        return candidates[randomInt(0, candidates.length - 1)];
    }

    createCharacter(side, variant) {
        const isPlayer = side === "left";
        const options = {
            side,
            name: isPlayer ? "YOU" : "TARGET-BOT",
            variantId: variant.id,
            variantName: variant.name,
            x: isPlayer ? 24 : canvas.width - this.charWidth - 24,
            y: (canvas.height - this.charHeight) / 2,
            width: this.charWidth,
            height: this.charHeight,
            color: variant.color,
            accent: variant.accent,
            spriteSrc: variant.spriteSrc,
            spriteScale: variant.spriteScale ?? 0.84,
            racketAssist: isPlayer ? (variant.playerRacketAssist ?? 9) : (variant.aiRacketAssist ?? 5),
            traits: variant.traits || {},
            followRateY: isPlayer ? this.baseFollowRateY : 0.12
        };

        if (isPlayer) {
            options.minX = 16;
            options.maxX = canvas.width * 0.5 - this.charWidth - 18;
            options.followRateX = this.baseFollowRateX;
        }

        return new Character(options);
    }

    getTraitSummary(variant) {
        const traits = variant?.traits || {};
        const tags = [];
        if ((traits.moveSpeed || 1) >= 1.1) tags.push("SPD+");
        if ((traits.pickupScale || 1) >= 1.15) tags.push("CATCH+");
        if ((traits.shotPower || 1) >= 1.12) tags.push("SHOT+");
        if ((traits.chatterRate || 0) >= 0.004) tags.push("TALK+");
        return tags.length > 0 ? tags.join(" / ") : "BALANCED";
    }

    setupCharacterSelectUi() {
        if (!ui.characterOptions || !ui.startMatchBtn) {
            this.selectionMode = false;
            return;
        }

        ui.characterOptions.innerHTML = "";
        this.playerOptions.forEach((variant) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "character-option";
            button.dataset.characterId = variant.id;
            button.innerHTML = `<img src="${variant.spriteSrc}" alt="${variant.name}" class="character-thumb"><span class="character-name">${variant.name}</span><span class="character-traits">${variant.roleLabel || "STYLE"} / ${this.getTraitSummary(variant)}</span>`;
            button.addEventListener("click", () => this.selectPlayerCharacter(variant.id));
            ui.characterOptions.appendChild(button);
        });

        ui.startMatchBtn.addEventListener("click", () => this.startMatchFromSelection());
    }

    updateCharacterSelectUi() {
        if (!ui.characterOptions || !ui.startMatchBtn) return;

        const buttons = ui.characterOptions.querySelectorAll(".character-option");
        buttons.forEach((button) => {
            const selected = button.dataset.characterId === this.selectedPlayerId;
            button.classList.toggle("is-selected", selected);
        });

        const npcVariant = this.getCharacterById(this.selectedNpcId);
        ui.startMatchBtn.textContent = npcVariant
            ? `START VS ${npcVariant.name} (${npcVariant.roleLabel || "STYLE"})`
            : "START MATCH";
    }

    selectPlayerCharacter(characterId) {
        const variant = this.getCharacterById(characterId);
        if (!variant) return;

        this.selectedPlayerId = characterId;
        this.player = this.createCharacter("left", variant);

        const npcVariant = this.pickRandomNpcVariant(characterId);
        this.selectedNpcId = npcVariant.id;
        this.ai = this.createCharacter("right", npcVariant);

        this.mouseX = this.player.x + this.player.width / 2;
        this.mouseY = canvas.height / 2;
        this.keyboardAimX = this.mouseX;
        this.keyboardAimY = this.mouseY;

        this.updateCharacterSelectUi();
        this.updateHud();
    }

    startMatchFromSelection() {
        if (!this.selectionMode) return;

        const playerVariant = this.getCharacterById(this.selectedPlayerId) || this.playerOptions[0];
        const npcVariant = this.pickRandomNpcVariant(this.selectedPlayerId);
        this.selectedNpcId = npcVariant.id;

        this.player = this.createCharacter("left", playerVariant);
        this.ai = this.createCharacter("right", npcVariant);
        this.selectionMode = false;

        if (ui.characterSelect) {
            ui.characterSelect.classList.add("is-hidden");
        }

        this.resetMatch(false);
        this.message = `${playerVariant.name} VS ${npcVariant.name}`;
        this.messageTimer = 75;
    }

    bindInput() {
        canvas.addEventListener("mousemove", (e) => this.handlePointer(e.clientX, e.clientY));
        canvas.addEventListener("touchmove", (e) => {
            e.preventDefault();
            this.handlePointer(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        canvas.addEventListener("click", () => {
            if (this.gameOver) this.resetMatch();
        });

        window.addEventListener("keydown", (e) => this.handleKeyDown(e));
        window.addEventListener("keyup", (e) => this.handleKeyUp(e));
        window.addEventListener("blur", () => {
            this.keyState.up = false;
            this.keyState.down = false;
            this.keyState.left = false;
            this.keyState.right = false;
        });
    }

    handlePointer(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        this.mouseX = (clientX - rect.left) * scaleX;
        this.mouseY = (clientY - rect.top) * scaleY;
        this.keyboardAimX = this.mouseX;
        this.keyboardAimY = this.mouseY;
    }

    handleKeyDown(e) {
        if (this.selectionMode && (e.key === " " || e.key === "Enter")) {
            e.preventDefault();
            this.startMatchFromSelection();
            return;
        }

        if (this.gameOver && (e.key === " " || e.key === "Enter")) {
            e.preventDefault();
            this.resetMatch();
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            this.keyState.up = true;
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            this.keyState.down = true;
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            this.keyState.left = true;
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            this.keyState.right = true;
        }
    }

    handleKeyUp(e) {
        if (e.key === "ArrowUp") {
            e.preventDefault();
            this.keyState.up = false;
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            this.keyState.down = false;
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            this.keyState.left = false;
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            this.keyState.right = false;
        }
    }

    applyKeyboardInput() {
        const moveMultiplier = this.effects.moveBoost > 0 ? 2 : 1;
        const speedTrait = this.player.traits?.moveSpeed ?? 1;
        const speed = this.baseKeyboardSpeed * moveMultiplier * speedTrait;

        if (this.keyState.left !== this.keyState.right) {
            const dirX = this.keyState.left ? -1 : 1;
            this.keyboardAimX += dirX * speed;
        }

        if (this.keyState.up !== this.keyState.down) {
            const dirY = this.keyState.up ? -1 : 1;
            this.keyboardAimY += dirY * speed;
        }

        this.keyboardAimX = clamp(
            this.keyboardAimX,
            this.player.minX + this.player.width / 2,
            this.player.maxX + this.player.width / 2
        );
        this.keyboardAimY = clamp(this.keyboardAimY, 0, canvas.height);

        this.mouseX = this.keyboardAimX;
        this.mouseY = this.keyboardAimY;
    }

    spawnParticles(x, y, color, amount = 12) {
        for (let i = 0; i < amount; i += 1) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    makeBall(direction, x = canvas.width / 2, y = canvas.height / 2) {
        const angle = randomRange(-0.36, 0.36);
        const speed = CONFIG.baseBallSpeed;
        return {
            x,
            y,
            radius: CONFIG.ballRadius,
            speed,
            vx: direction * speed * Math.cos(angle),
            vy: speed * Math.sin(angle),
            spin: randomRange(-0.2, 0.2),
            trail: [],
            lastHitFrame: -100,
            lastHitter: null
        };
    }

    startServe() {
        const direction = this.currentServer === "left" ? 1 : -1;
        this.balls = [this.makeBall(direction)];
        this.pendingServe = false;
        this.message = this.currentServer === "left" ? "YOU SERVE" : "TARGET-BOT SERVE";
        this.messageTimer = 40;
    }

    spawnRandomItem() {
        const types = ["split", "moveBoost", "shotBoost"];
        const type = types[Math.floor(Math.random() * types.length)];
        this.items.push(new FlowItem(type));
    }

    applyItem(type) {
        if (type === "split") {
            this.effects.split = Math.max(this.effects.split, CONFIG.effects.split);
            this.message = "SPLIT 10s";
        } else if (type === "moveBoost") {
            this.effects.moveBoost = Math.max(this.effects.moveBoost, CONFIG.effects.moveBoost);
            this.message = "MOVE x2 10s";
        } else if (type === "shotBoost") {
            this.effects.shotBoost = Math.max(this.effects.shotBoost, CONFIG.effects.shotBoost);
            this.message = "SHOT x2 10s";
        }
        this.messageTimer = 45;
    }

    getPlayerPickupBounds() {
        const pickupScale = this.player.traits?.pickupScale ?? 1;
        const width = this.player.width * 1.44 * pickupScale;
        const height = this.player.height * 1.56 * pickupScale;
        const centerX = this.player.x + this.player.width * 0.5;
        const centerY = this.player.y + this.player.height * 0.48;
        return {
            x: centerX - width / 2,
            y: centerY - height / 2,
            width,
            height
        };
    }

    isItemTouchingPlayer(item) {
        const bounds = this.getPlayerPickupBounds();
        const closestX = clamp(item.x, bounds.x, bounds.x + bounds.width);
        const closestY = clamp(item.y, bounds.y, bounds.y + bounds.height);
        const dx = item.x - closestX;
        const dy = item.y - closestY;
        return dx * dx + dy * dy <= item.radius * item.radius;
    }

    updateItems() {
        this.itemSpawnTimer -= 1;
        if (this.itemSpawnTimer <= 0 && !this.gameOver) {
            this.spawnRandomItem();
            this.itemSpawnTimer = randomInt(CONFIG.itemSpawnMin, CONFIG.itemSpawnMax);
        }

        for (let i = this.items.length - 1; i >= 0; i -= 1) {
            const item = this.items[i];
            item.update(this.frameCount);

            if (this.isItemTouchingPlayer(item)) {
                this.applyItem(item.type);
                this.spawnParticles(item.x, item.y, CONFIG.colors[item.type], 16);
                this.items.splice(i, 1);
                continue;
            }

            if (!item.active) this.items.splice(i, 1);
        }
    }

    decrementEffects() {
        if (this.effects.split > 0) this.effects.split -= 1;
        if (this.effects.moveBoost > 0) this.effects.moveBoost -= 1;
        if (this.effects.shotBoost > 0) this.effects.shotBoost -= 1;
    }

    pickAiTargetBall() {
        if (this.balls.length === 0) return null;

        const towardAi = this.balls.filter((ball) => ball.vx > 0);
        if (towardAi.length > 0) {
            towardAi.sort((a, b) => b.x - a.x);
            return towardAi[0];
        }

        this.balls.sort((a, b) => Math.abs(a.x - this.ai.x) - Math.abs(b.x - this.ai.x));
        return this.balls[0];
    }

    autoSwingIfNeeded(character, ball) {
        if (!ball) return;

        const centerY = character.y + character.height * 0.5;
        const distanceY = Math.abs(ball.y - centerY);
        const distanceX = Math.abs(ball.x - (character.x + character.width * 0.5));
        const coming = character.side === "left" ? ball.vx < 0 : ball.vx > 0;

        if (coming && distanceY < 90 && distanceX < 130 && character.swingTimer <= 0.2) {
            character.triggerSwing(1.04);
        }
    }

    splitBallFrom(sourceBall) {
        if (this.balls.length >= CONFIG.maxBalls) return;

        const currentAngle = Math.atan2(sourceBall.vy, sourceBall.vx);
        const spread = randomRange(0.25, 0.35) * (Math.random() > 0.5 ? 1 : -1);
        const newAngle = currentAngle + spread;
        const speed = clamp(Math.hypot(sourceBall.vx, sourceBall.vy) * 0.95, CONFIG.baseBallSpeed, CONFIG.maxBallSpeed);

        const clone = {
            x: sourceBall.x,
            y: sourceBall.y + randomRange(-10, 10),
            radius: sourceBall.radius,
            speed,
            vx: speed * Math.cos(newAngle),
            vy: speed * Math.sin(newAngle),
            spin: -sourceBall.spin * 0.7,
            trail: [],
            lastHitFrame: this.frameCount,
            lastHitter: "left"
        };

        this.balls.push(clone);
        this.spawnParticles(clone.x, clone.y, CONFIG.colors.split, 12);
    }

    handleRacketCollision(ball, character) {
        const toward = character.side === "left" ? ball.vx < 0 : ball.vx > 0;
        if (!toward) return;

        const racket = character.getRacketHead(this.frameCount);
        const dx = ball.x - racket.x;
        const dy = ball.y - racket.y;
        const reach = ball.radius + character.racketRadius + 2 + character.racketAssist;

        if (dx * dx + dy * dy > reach * reach) return;
        if (this.frameCount - ball.lastHitFrame < 5) return;

        const offset = clamp(
            (ball.y - (character.y + character.height * 0.5)) / (character.height * 0.5),
            -1,
            1
        );
        const direction = character.side === "left" ? 1 : -1;

        let nextSpeed = clamp(Math.hypot(ball.vx, ball.vy) + 0.45, CONFIG.baseBallSpeed, CONFIG.maxBallSpeed);
        const shotPower = character.traits?.shotPower ?? 1;
        nextSpeed = clamp(nextSpeed * shotPower, CONFIG.baseBallSpeed, CONFIG.maxBallSpeed * 1.5);
        if (character.side === "left" && this.effects.shotBoost > 0) {
            nextSpeed = clamp(nextSpeed * 2, CONFIG.baseBallSpeed, CONFIG.maxBallSpeed * 2);
        }

        const angle = offset * (Math.PI / 3.2);
        ball.speed = nextSpeed;
        ball.vx = direction * nextSpeed * Math.cos(angle);
        ball.vy = nextSpeed * Math.sin(angle) + character.vy * 0.2;
        ball.spin = clamp(ball.spin * 0.55 + offset * 1.2 + character.vy * 0.03, -2.2, 2.2);

        ball.x = racket.x + direction * (character.racketRadius + ball.radius + 2);
        ball.lastHitFrame = this.frameCount;
        ball.lastHitter = character.side;

        const power = 1 + Math.min(0.6, Math.abs(character.vy) / 24);
        character.triggerSwing(power);
        this.spawnParticles(ball.x, ball.y, character.color, 14);

        if (character.side === "left" && this.effects.split > 0) {
            this.splitBallFrom(ball);
        }
    }

    advanceServeTurn() {
        this.pointsSinceServeSwitch += 1;
        const switchEvery = this.player.score >= 10 && this.ai.score >= 10 ? 1 : 2;
        if (this.pointsSinceServeSwitch >= switchEvery) {
            this.currentServer = this.currentServer === "left" ? "right" : "left";
            this.pointsSinceServeSwitch = 0;
        }
    }

    scorePoint(side) {
        const scorer = side === "left" ? this.player : this.ai;
        scorer.score += 1;

        this.spawnParticles(
            side === "left" ? canvas.width * 0.28 : canvas.width * 0.72,
            44,
            side === "left" ? CONFIG.colors.player : CONFIG.colors.ai,
            22
        );

        const lead = Math.abs(this.player.score - this.ai.score);
        const reached = scorer.score >= CONFIG.winScore;

        if (reached && lead >= CONFIG.minLead) {
            this.gameOver = true;
            this.winner = side;
            this.message = side === "left" ? "GAME SET: YOU" : "GAME SET: TARGET-BOT";
            this.messageTimer = 999999;
            this.balls = [];
            this.updateBestScore(this.player.score);
            this.updateHud();
            return;
        }

        this.advanceServeTurn();

        this.balls = [];
        this.pendingServe = true;
        this.roundPause = CONFIG.servePauseFrames;
        this.message = side === "left" ? "POINT YOU" : "POINT TARGET-BOT";
        this.messageTimer = 55;
    }

    maybeTriggerCharacterLine(character) {
        if (this.selectionMode || this.gameOver || this.pendingServe) return;
        if (this.characterTalkCooldown > 0) return;
        if (this.messageTimer > 0) return;

        const rate = character.traits?.chatterRate ?? 0;
        const lines = character.traits?.chatterLines ?? [];
        if (rate <= 0 || lines.length === 0) return;
        if (Math.random() >= rate) return;

        const speaker = character.side === "left" ? "YOU" : "BOT";
        const line = lines[randomInt(0, lines.length - 1)];
        this.message = `${speaker}: ${line}`;
        this.messageTimer = 36;
        this.characterTalkCooldown = randomInt(95, 150);
    }

    resetMatch(rerollNpc = true) {
        this.player.score = 0;
        this.ai.score = 0;

        if (rerollNpc && !this.selectionMode) {
            const npcVariant = this.pickRandomNpcVariant(this.selectedPlayerId);
            this.selectedNpcId = npcVariant.id;
            this.ai = this.createCharacter("right", npcVariant);
        }

        this.effects.split = 0;
        this.effects.moveBoost = 0;
        this.effects.shotBoost = 0;

        this.items = [];
        this.balls = [];
        this.particles = [];

        this.currentServer = Math.random() > 0.5 ? "left" : "right";
        this.pointsSinceServeSwitch = 0;
        this.pendingServe = true;
        this.roundPause = 40;
        this.mouseX = this.player.x + this.player.width / 2;
        this.mouseY = canvas.height / 2;
        this.keyboardAimX = this.mouseX;
        this.keyboardAimY = this.mouseY;

        this.gameOver = false;
        this.winner = null;
        this.message = "NEW MATCH";
        this.messageTimer = 60;
        this.characterTalkCooldown = 0;

        this.itemSpawnTimer = randomInt(CONFIG.itemSpawnMin, CONFIG.itemSpawnMax);
        this.updateHud();
    }

    updateBestScore(currentScore) {
        if (currentScore > this.bestScore) {
            this.bestScore = currentScore;
            this.bestScoreAt = new Date().toISOString();
            localStorage.setItem(BEST_SCORE_KEY, String(this.bestScore));
            localStorage.setItem(BEST_SCORE_AT_KEY, this.bestScoreAt);
        }
    }

    updateBalls() {
        for (let i = 0; i < this.balls.length; i += 1) {
            const ball = this.balls[i];

            ball.vy += ball.spin * 0.05;
            ball.vy = clamp(ball.vy, -16, 16);

            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.spin *= 0.992;

            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
                ball.vy = Math.abs(ball.vy);
                ball.spin *= -0.8;
                this.spawnParticles(ball.x, ball.y, CONFIG.colors.ball, 8);
            }

            if (ball.y + ball.radius > canvas.height) {
                ball.y = canvas.height - ball.radius;
                ball.vy = -Math.abs(ball.vy);
                ball.spin *= -0.8;
                this.spawnParticles(ball.x, ball.y, CONFIG.colors.ball, 8);
            }

            this.handleRacketCollision(ball, this.player);
            this.handleRacketCollision(ball, this.ai);

            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > 11) ball.trail.shift();
        }

        for (const ball of this.balls) {
            if (ball.x + ball.radius < 0) {
                this.scorePoint("right");
                return;
            }
            if (ball.x - ball.radius > canvas.width) {
                this.scorePoint("left");
                return;
            }
        }
    }

    updateHud() {
        const activeEffects = [];
        if (this.effects.split > 0) activeEffects.push(`分裂 ${ (this.effects.split / 60).toFixed(1)}s`);
        if (this.effects.moveBoost > 0) activeEffects.push(`移動x2 ${ (this.effects.moveBoost / 60).toFixed(1)}s`);
        if (this.effects.shotBoost > 0) activeEffects.push(`打球x2 ${ (this.effects.shotBoost / 60).toFixed(1)}s`);

        ui.playerScore.innerText = this.player.score;
        ui.computerScore.innerText = this.ai.score;
        if (ui.bestScoreLabel) ui.bestScoreLabel.innerText = `BEST SCORE: ${this.bestScore}`;
        if (ui.bestDateLabel) ui.bestDateLabel.innerText = `REC: ${formatRecordDate(this.bestScoreAt)}`;

        if (this.selectionMode) {
            const selected = this.getCharacterById(this.selectedPlayerId);
            const rival = this.getCharacterById(this.selectedNpcId);
            ui.phase.innerText = "STATE: CHARACTER SELECT";
            const selectedInfo = selected ? `${selected.name} ${this.getTraitSummary(selected)}` : "-";
            const rivalInfo = rival ? `${rival.name} ${this.getTraitSummary(rival)}` : "-";
            ui.rally.innerText = `YOU ${selectedInfo} | NPC ${rivalInfo}`;
        } else if (this.gameOver) {
            ui.phase.innerText = "STATE: MATCH END";
        } else if (this.player.score >= 10 && this.ai.score >= 10) {
            ui.phase.innerText = `SERVE: ${this.currentServer === "left" ? "YOU" : "TARGET-BOT"} (DEUCE)`;
        } else {
            ui.phase.innerText = `SERVE: ${this.currentServer === "left" ? "YOU" : "TARGET-BOT"}`;
        }

        if (!this.selectionMode) {
            ui.rally.innerText = activeEffects.length > 0 ? activeEffects.join(" | ") : "EFFECT: NONE";
        }
    }

    update() {
        this.frameCount += 1;
        if (this.characterTalkCooldown > 0) this.characterTalkCooldown -= 1;

        if (this.selectionMode) {
            const centerY = (canvas.height - this.player.height) / 2;
            this.player.setTargetY(centerY);
            this.ai.setTargetY(centerY);
            this.player.update();
            this.ai.update();

            if (this.messageTimer > 0 && this.messageTimer < 999999) {
                this.messageTimer -= 1;
            }

            this.updateHud();
            return;
        }

        this.applyKeyboardInput();
        const moveMultiplier = this.effects.moveBoost > 0 ? 2 : 1;
        const speedTrait = this.player.traits?.moveSpeed ?? 1;
        this.player.followRateX = clamp(this.baseFollowRateX * moveMultiplier * speedTrait, 0, 0.95);
        this.player.followRateY = clamp(this.baseFollowRateY * moveMultiplier * speedTrait, 0, 0.95);

        this.player.setTargetX(this.mouseX - this.player.width / 2);
        this.player.setTargetY(this.mouseY - this.player.height / 2);

        const aiBall = this.pickAiTargetBall();
        if (aiBall) {
            const aiPredictY = aiBall.y + aiBall.vy * 4.2;
            this.ai.setTargetY(aiPredictY - this.ai.height / 2);
        }

        this.player.update();
        this.ai.update();

        this.autoSwingIfNeeded(this.player, this.balls[0]);
        this.autoSwingIfNeeded(this.ai, aiBall);
        this.maybeTriggerCharacterLine(this.player);
        this.maybeTriggerCharacterLine(this.ai);

        if (!this.gameOver) {
            this.updateItems();
            this.decrementEffects();
        }

        if (this.roundPause > 0) {
            this.roundPause -= 1;
            if (this.roundPause === 0 && this.pendingServe && !this.gameOver) {
                this.startServe();
            }
        } else if (!this.gameOver) {
            this.updateBalls();
        }

        for (let i = this.particles.length - 1; i >= 0; i -= 1) {
            this.particles[i].update();
            if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
        }

        if (this.messageTimer > 0 && this.messageTimer < 999999) {
            this.messageTimer -= 1;
        }

        this.updateHud();
    }

    drawArena() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, CONFIG.colors.bgTop);
        gradient.addColorStop(1, CONFIG.colors.bgBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = CONFIG.colors.net;
        for (let i = 0; i <= canvas.height; i += 20) {
            ctx.fillRect(canvas.width / 2 - 1, i, 2, 10);
        }

        ctx.strokeStyle = CONFIG.colors.courtGlow;
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
    }

    drawBalls() {
        this.balls.forEach((ball) => {
            ball.trail.forEach((trail, idx) => {
                const alpha = (idx + 1) / ball.trail.length;
                ctx.save();
                ctx.globalAlpha = alpha * 0.32;
                ctx.fillStyle = CONFIG.colors.ball;
                ctx.beginPath();
                ctx.arc(trail.x, trail.y, ball.radius * (0.45 + alpha * 0.35), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            ctx.save();
            ctx.shadowBlur = 16;
            ctx.shadowColor = CONFIG.colors.ball;
            ctx.fillStyle = CONFIG.colors.ball;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    drawMessage() {
        if (this.messageTimer <= 0 || !this.message) return;

        ctx.save();
        ctx.font = "18px 'Press Start 2P', cursive";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(255,255,255,0.6)";
        ctx.fillText(this.message, canvas.width / 2, 42);
        ctx.restore();
    }

    drawSelectionOverlay() {
        if (!this.selectionMode) return;

        ctx.save();
        ctx.fillStyle = "rgba(4, 14, 30, 0.65)";
        ctx.fillRect(0, canvas.height - 84, canvas.width, 84);
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(224, 249, 255, 0.95)";
        ctx.font = "12px 'Press Start 2P', cursive";
        ctx.fillText("SELECT CHARACTER AND PRESS START", canvas.width / 2, canvas.height - 48);
        ctx.font = "9px 'Press Start 2P', cursive";
        ctx.fillStyle = "rgba(160, 214, 225, 0.95)";
        ctx.fillText("ENTER / SPACE also starts match", canvas.width / 2, canvas.height - 26);
        ctx.restore();
    }

    drawGameOverOverlay() {
        if (!this.gameOver) return;

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 16;
        ctx.shadowColor = "rgba(255,255,255,0.7)";

        ctx.font = "32px 'Press Start 2P', cursive";
        ctx.fillText("GAME SET", canvas.width / 2, canvas.height / 2 - 28);

        ctx.font = "16px 'Press Start 2P', cursive";
        ctx.fillText(this.winner === "left" ? "WINNER: YOU" : "WINNER: TARGET-BOT", canvas.width / 2, canvas.height / 2 + 16);

        ctx.font = "10px 'Press Start 2P', cursive";
        ctx.fillText("SPACE / ENTER / CLICK FOR NEXT GAME", canvas.width / 2, canvas.height / 2 + 54);
        ctx.restore();
    }

    draw() {
        this.drawArena();
        this.items.forEach((item) => item.draw(ctx));

        const playerAura = this.effects.shotBoost > 0 ? 1 : 0;
        this.player.draw(ctx, this.frameCount, playerAura);
        this.ai.draw(ctx, this.frameCount, 0);

        this.drawBalls();
        this.particles.forEach((particle) => particle.draw(ctx));

        this.drawSelectionOverlay();
        this.drawMessage();
        this.drawGameOverOverlay();
    }
}

const game = new Game();

function loop() {
    game.update();
    game.draw();
    requestAnimationFrame(loop);
}

loop();
