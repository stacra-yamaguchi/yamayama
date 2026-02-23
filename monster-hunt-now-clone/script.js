const ui = {
    rank: document.getElementById("hunter-rank"),
    exp: document.getElementById("hunter-exp"),
    nextExp: document.getElementById("hunter-next"),
    hpBar: document.getElementById("hp-bar"),
    hpText: document.getElementById("hp-text"),
    staminaBar: document.getElementById("stamina-bar"),
    staminaText: document.getElementById("stamina-text"),
    material: document.getElementById("material-count"),
    zenny: document.getElementById("zenny-count"),
    geoStatus: document.getElementById("geo-status"),
    geoLat: document.getElementById("geo-lat"),
    geoLng: document.getElementById("geo-lng"),
    playerCoord: document.getElementById("player-coord"),
    spawnTimer: document.getElementById("spawn-timer"),
    mapHint: document.getElementById("map-hint"),
    selectedDistance: document.getElementById("selected-distance"),
    engageBtn: document.getElementById("engage-btn"),
    battleTimer: document.getElementById("battle-timer"),
    target: document.getElementById("battle-target"),
    targetName: document.getElementById("target-name"),
    targetDetail: document.getElementById("target-detail"),
    monsterHpBar: document.getElementById("monster-hp-bar"),
    monsterHpText: document.getElementById("monster-hp-text"),
    fieldHr: document.getElementById("field-hr"),
    fieldWeapon: document.getElementById("field-weapon"),
    fieldZenny: document.getElementById("field-zenny"),
    fieldHpText: document.getElementById("field-hp-text"),
    fieldHpBar: document.getElementById("field-hp-bar"),
    fieldStaminaText: document.getElementById("field-stamina-text"),
    fieldStaminaBar: document.getElementById("field-stamina-bar"),
    rpsRockBtn: document.getElementById("rps-rock-btn"),
    rpsScissorsBtn: document.getElementById("rps-scissors-btn"),
    rpsPaperBtn: document.getElementById("rps-paper-btn"),
    battleLog: document.getElementById("battle-log"),
    upgradeBtn: document.getElementById("upgrade-btn"),
    rewardModal: document.getElementById("reward-modal"),
    rewardTitle: document.getElementById("reward-title"),
    rewardSummary: document.getElementById("reward-summary"),
    rewardClose: document.getElementById("reward-close"),
    touchPadButtons: Array.from(document.querySelectorAll(".touch-pad button[data-dir]"))
};

const canvas = document.getElementById("field-canvas");
const ctx = canvas.getContext("2d");
const IS_TOUCH_DEVICE = window.matchMedia("(pointer: coarse)").matches
    || "ontouchstart" in window
    || navigator.maxTouchPoints > 0;

const WORLD = {
    width: 2300,
    height: 1450,
    biomeGrid: 140
};
const ENCOUNTER_RANGE = 110;
const AUTO_ENGAGE_RANGE = 58;
const ITEM_PICKUP_RANGE = 40;
const RPS_HANDS = ["rock", "scissors", "paper"];
const RPS_LABEL = {
    rock: "グー",
    scissors: "チョキ",
    paper: "パー"
};
const HEALING_ITEM_TYPES = [
    {
        id: "first-aid",
        name: "救急薬",
        hp: 26,
        stamina: 0,
        color: "#8ce48f",
        glyph: "H"
    },
    {
        id: "ration",
        name: "携帯食料",
        hp: 0,
        stamina: 34,
        color: "#7bd2ff",
        glyph: "S"
    },
    {
        id: "vital-nectar",
        name: "活力ネクター",
        hp: 18,
        stamina: 22,
        color: "#dcb3ff",
        glyph: "B"
    }
];

const monsterCatalog = [
    {
        id: "fang-raptor",
        name: "ファングラプトル",
        habitat: "河川エリア",
        hpBase: 150,
        attackBase: 11,
        rewardMaterial: "竜骨片",
        sprite: "images/monster_fang_raptor.svg"
    },
    {
        id: "moss-bear",
        name: "モスベア",
        habitat: "森林エリア",
        hpBase: 210,
        attackBase: 15,
        rewardMaterial: "堅殻",
        sprite: "images/monster_moss_bear.svg"
    },
    {
        id: "lava-horn",
        name: "ラヴァホーン",
        habitat: "火山エリア",
        hpBase: 260,
        attackBase: 19,
        rewardMaterial: "紅蓮鉱石",
        sprite: "images/monster_lava_horn.svg"
    },
    {
        id: "storm-wyvern",
        name: "ストームワイバーン",
        habitat: "峡谷エリア",
        hpBase: 320,
        attackBase: 23,
        rewardMaterial: "飛竜鱗",
        sprite: "images/monster_storm_wyvern.svg"
    }
];

const spriteSources = {
    player: "images/player_hunter.svg"
};
monsterCatalog.forEach((monster) => {
    spriteSources[monster.id] = monster.sprite;
});

const sprites = {};
Object.entries(spriteSources).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    sprites[key] = img;
});

const gameState = {
    player: {
        hp: 100,
        maxHp: 100,
        stamina: 100,
        maxStamina: 100,
        rank: 1,
        exp: 0,
        materials: 0,
        zenny: 0,
        weaponLevel: 1,
        x: WORLD.width * 0.5,
        y: WORLD.height * 0.52,
        moveTarget: null,
        radius: 28,
        speed: 240,
        dirX: 1,
        dirY: 0
    },
    geo: {
        status: "取得待機中",
        lat: null,
        lng: null,
        accuracy: null,
        watchId: null
    },
    monsters: [],
    healingItems: [],
    worldObjects: [],
    spawnCooldown: 3,
    itemSpawnCooldown: 5,
    selectedMonsterId: null,
    battle: null,
    effects: [],
    input: {
        up: false,
        down: false,
        left: false,
        right: false,
        touchX: 0,
        touchY: 0
    },
    touch: {
        pointerId: null,
        startX: 0,
        startY: 0,
        startWorldX: 0,
        startWorldY: 0,
        startAt: 0,
        startedOnMonster: false,
        monsterId: null
    },
    lastFrame: performance.now(),
    time: 0,
    camera: {
        x: 0,
        y: 0
    }
};

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function starsText(star) {
    return "★".repeat(star) + "☆".repeat(5 - star);
}

function expToNextRank(rank) {
    return 90 + rank * 30;
}

function formatGpsValue(value) {
    if (value == null || Number.isNaN(value)) {
        return "--";
    }
    return value.toFixed(6);
}

function renderCoordinateInfo() {
    const { geo, player } = gameState;
    ui.geoStatus.textContent = geo.status;
    ui.geoLat.textContent = formatGpsValue(geo.lat);
    ui.geoLng.textContent = formatGpsValue(geo.lng);
    ui.playerCoord.textContent = `X ${Math.round(player.x)} / Y ${Math.round(player.y)}`;
}

function setTouchVector(x, y) {
    gameState.input.touchX = clamp(x, -1, 1);
    gameState.input.touchY = clamp(y, -1, 1);
}

function clearTouchVector() {
    setTouchVector(0, 0);
}

function movePlayerBy(dx, dy) {
    const player = gameState.player;
    player.x = clamp(player.x + dx, player.radius, WORLD.width - player.radius);
    player.y = clamp(player.y + dy, player.radius, WORLD.height - player.radius);

    const mag = Math.hypot(dx, dy);
    if (mag > 0.001) {
        player.dirX = dx / mag;
        player.dirY = dy / mag;
    }
}

function setMoveTarget(worldX, worldY) {
    gameState.player.moveTarget = {
        x: clamp(worldX, gameState.player.radius, WORLD.width - gameState.player.radius),
        y: clamp(worldY, gameState.player.radius, WORLD.height - gameState.player.radius)
    };
}

function addLog(text, tone = "") {
    const li = document.createElement("li");
    li.textContent = text;
    if (tone) {
        li.className = tone;
    }

    ui.battleLog.prepend(li);
    while (ui.battleLog.children.length > 10) {
        ui.battleLog.removeChild(ui.battleLog.lastChild);
    }
}

function setGeoStatus(status) {
    gameState.geo.status = status;
}

function startGeolocationTracking() {
    if (!("geolocation" in navigator)) {
        setGeoStatus("未対応ブラウザ");
        addLog("位置情報APIが使えないブラウザです。", "warn");
        return;
    }

    setGeoStatus("取得中");
    gameState.geo.watchId = navigator.geolocation.watchPosition(
        (position) => {
            gameState.geo.lat = position.coords.latitude;
            gameState.geo.lng = position.coords.longitude;
            gameState.geo.accuracy = position.coords.accuracy;
            setGeoStatus(`取得中 ±${Math.round(position.coords.accuracy)}m`);
        },
        (error) => {
            if (error.code === error.PERMISSION_DENIED) {
                setGeoStatus("許可が必要");
                addLog("位置情報の許可が必要です。", "warn");
            } else if (error.code === error.TIMEOUT) {
                setGeoStatus("取得タイムアウト");
            } else {
                setGeoStatus("取得エラー");
            }
        },
        {
            enableHighAccuracy: true,
            maximumAge: 8000,
            timeout: 12000
        }
    );
}

function stopGeolocationTracking() {
    if (gameState.geo.watchId == null || !("geolocation" in navigator)) {
        return;
    }
    navigator.geolocation.clearWatch(gameState.geo.watchId);
    gameState.geo.watchId = null;
}

function createWorldObjects() {
    const objects = [];
    for (let i = 0; i < 80; i += 1) {
        objects.push({
            x: randomRange(60, WORLD.width - 60),
            y: randomRange(60, WORLD.height - 60),
            size: randomRange(18, 42),
            kind: Math.random() < 0.58 ? "tree" : "rock"
        });
    }
    gameState.worldObjects = objects;
}

function spawnMonster() {
    const base = monsterCatalog[Math.floor(Math.random() * monsterCatalog.length)];
    const star = randomInt(1, 5);

    const x = randomRange(120, WORLD.width - 120);
    const y = randomRange(120, WORLD.height - 120);

    gameState.monsters.push({
        uid: `${base.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        base,
        star,
        x,
        y,
        hpMax: Math.floor(base.hpBase * (1 + (star - 1) * 0.3)),
        attack: Math.floor(base.attackBase * (1 + (star - 1) * 0.22)),
        expiresIn: randomRange(80, 160),
        roamAngle: randomRange(0, Math.PI * 2),
        roamSpeed: randomRange(14, 30),
        roamTick: randomRange(0.6, 2.2),
        state: "wild"
    });
}

function refreshMonsters(delta) {
    gameState.monsters.forEach((monster) => {
        if (gameState.battle && gameState.battle.monsterId === monster.uid) {
            monster.state = "battle";
            return;
        }

        monster.state = "wild";
        monster.expiresIn -= delta;
        monster.roamTick -= delta;

        if (monster.roamTick <= 0) {
            monster.roamTick = randomRange(0.9, 2.6);
            monster.roamAngle += randomRange(-1.8, 1.8);
            monster.roamSpeed = randomRange(10, 34);
        }

        monster.x += Math.cos(monster.roamAngle) * monster.roamSpeed * delta;
        monster.y += Math.sin(monster.roamAngle) * monster.roamSpeed * delta;

        const margin = 46;
        if (monster.x < margin || monster.x > WORLD.width - margin) {
            monster.roamAngle = Math.PI - monster.roamAngle;
        }
        if (monster.y < margin || monster.y > WORLD.height - margin) {
            monster.roamAngle = -monster.roamAngle;
        }

        monster.x = clamp(monster.x, margin, WORLD.width - margin);
        monster.y = clamp(monster.y, margin, WORLD.height - margin);
    });

    gameState.monsters = gameState.monsters.filter((monster) => {
        if (gameState.battle && gameState.battle.monsterId === monster.uid) {
            return true;
        }
        return monster.expiresIn > 0;
    });

    gameState.spawnCooldown -= delta;
    if (gameState.spawnCooldown <= 0) {
        if (gameState.monsters.length < 10) {
            spawnMonster();
            if (Math.random() < 0.48) {
                spawnMonster();
            }
        }
        gameState.spawnCooldown = randomRange(8, 14);
    }
}

function spawnHealingItem() {
    const type = HEALING_ITEM_TYPES[randomInt(0, HEALING_ITEM_TYPES.length - 1)];
    gameState.healingItems.push({
        uid: `${type.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        type,
        x: randomRange(80, WORLD.width - 80),
        y: randomRange(80, WORLD.height - 80),
        ttl: randomRange(30, 70),
        pulse: randomRange(0, Math.PI * 2)
    });
}

function refreshHealingItems(delta) {
    gameState.healingItems.forEach((item) => {
        item.ttl -= delta;
        item.pulse += delta * 3.5;
    });

    gameState.healingItems = gameState.healingItems.filter((item) => item.ttl > 0);

    gameState.itemSpawnCooldown -= delta;
    if (gameState.itemSpawnCooldown <= 0) {
        if (gameState.healingItems.length < 8) {
            spawnHealingItem();
            if (Math.random() < 0.22) {
                spawnHealingItem();
            }
        }
        gameState.itemSpawnCooldown = randomRange(6, 12);
    }
}

function applyHealingItem(item) {
    const player = gameState.player;
    const beforeHp = player.hp;
    const beforeStamina = player.stamina;

    player.hp = clamp(player.hp + item.type.hp, 0, player.maxHp);
    player.stamina = clamp(player.stamina + item.type.stamina, 0, player.maxStamina);

    const healedHp = Math.round(player.hp - beforeHp);
    const healedStamina = Math.round(player.stamina - beforeStamina);

    createHitEffect(player.x, player.y - 18, item.type.id === "ration" ? "128,220,255" : "164,245,168");
    addLog(`${item.type.name} を取得: HP +${healedHp} / ST +${healedStamina}`, "good");
}

function collectNearbyHealingItems() {
    if (gameState.healingItems.length === 0) {
        return;
    }

    const player = gameState.player;
    const remains = [];

    gameState.healingItems.forEach((item) => {
        if (distance(player, item) <= ITEM_PICKUP_RANGE) {
            applyHealingItem(item);
        } else {
            remains.push(item);
        }
    });

    gameState.healingItems = remains;
}

function findMonster(uid) {
    return gameState.monsters.find((monster) => monster.uid === uid) || null;
}

function getNearestMonster(maxDistance = Infinity) {
    const player = gameState.player;
    let closest = null;
    let best = maxDistance;

    gameState.monsters.forEach((monster) => {
        if (monster.state !== "wild") {
            return;
        }
        const d = distance(player, monster);
        if (d < best) {
            best = d;
            closest = monster;
        }
    });

    return closest;
}

function tryAutoEngageByContact() {
    if (gameState.battle) {
        return;
    }

    const nearest = getNearestMonster(AUTO_ENGAGE_RANGE);
    if (!nearest) {
        return;
    }

    gameState.selectedMonsterId = nearest.uid;
    addLog(`${nearest.base.name} に接触。自動で戦闘開始。`, "warn");
    startBattle(nearest.uid);
}

function updateSelectedMonster() {
    if (gameState.battle) {
        gameState.selectedMonsterId = gameState.battle.monsterId;
        return;
    }

    const selected = findMonster(gameState.selectedMonsterId);
    if (selected) {
        return;
    }

    const nearby = getNearestMonster(360);
    gameState.selectedMonsterId = nearby ? nearby.uid : null;
}

function startBattle(monsterId) {
    if (gameState.battle) {
        return;
    }

    const monster = findMonster(monsterId);
    if (!monster) {
        addLog("ターゲットが見失われました。", "warn");
        return;
    }

    const player = gameState.player;
    const dist = distance(player, monster);
    if (dist > ENCOUNTER_RANGE) {
        addLog("モンスターに近づいてください。", "warn");
        return;
    }

    gameState.battle = {
        monsterId: monster.uid,
        hp: monster.hpMax,
        timer: 75,
        turnCooldown: 0,
        round: 0,
        winStreak: 0,
        lastPlayerHand: null,
        lastMonsterHand: null,
        playerAnim: 0,
        monsterAnim: 0
    };

    monster.state = "battle";
    monster.x = clamp(player.x + player.dirX * 120 + randomRange(-20, 20), 50, WORLD.width - 50);
    monster.y = clamp(player.y + player.dirY * 80 + randomRange(-18, 18), 50, WORLD.height - 50);
    player.moveTarget = null;
    clearTouchVector();

    addLog(`${monster.base.name} と交戦開始。`, "good");
    addLog("じゃんけんで攻撃: グー / チョキ / パーを選択。");
}

function consumeStamina(amount) {
    const player = gameState.player;
    if (player.stamina < amount) {
        addLog("スタミナ不足。", "warn");
        return false;
    }
    player.stamina -= amount;
    return true;
}

function createHitEffect(x, y, color) {
    gameState.effects.push({
        x,
        y,
        size: randomRange(22, 38),
        ttl: 0.25,
        maxTtl: 0.25,
        color
    });
}

function getWinningHandAgainst(hand) {
    if (hand === "rock") {
        return "paper";
    }
    if (hand === "scissors") {
        return "rock";
    }
    return "scissors";
}

function evaluateRps(playerHand, monsterHand) {
    if (playerHand === monsterHand) {
        return "draw";
    }

    if (
        (playerHand === "rock" && monsterHand === "scissors")
        || (playerHand === "scissors" && monsterHand === "paper")
        || (playerHand === "paper" && monsterHand === "rock")
    ) {
        return "win";
    }
    return "lose";
}

function chooseMonsterHand(monster, battle) {
    const adaptiveChance = clamp(0.18 + monster.star * 0.07, 0.2, 0.52);
    if (battle.lastPlayerHand && Math.random() < adaptiveChance) {
        return getWinningHandAgainst(battle.lastPlayerHand);
    }
    return RPS_HANDS[randomInt(0, RPS_HANDS.length - 1)];
}

function playRpsRound(playerHand) {
    const battle = gameState.battle;
    if (!battle || battle.turnCooldown > 0) {
        return;
    }

    if (!consumeStamina(12)) {
        return;
    }

    const monster = findMonster(battle.monsterId);
    if (!monster) {
        finishBattle(false, "ターゲットロスト");
        return;
    }

    const player = gameState.player;
    const monsterHand = chooseMonsterHand(monster, battle);
    const result = evaluateRps(playerHand, monsterHand);

    battle.lastPlayerHand = playerHand;
    battle.lastMonsterHand = monsterHand;
    battle.round += 1;
    battle.turnCooldown = 0.55;

    if (result === "win") {
        const baseDamage = 22 + player.weaponLevel * 6 + randomInt(0, 10);
        const streakBonus = battle.winStreak * 4;
        const monsterDamage = baseDamage + streakBonus;

        battle.hp -= monsterDamage;
        battle.winStreak += 1;
        battle.playerAnim = 0.26;
        createHitEffect(monster.x, monster.y - 20, "255,208,112");
        addLog(`あなた:${RPS_LABEL[playerHand]} 相手:${RPS_LABEL[monsterHand]} 勝ち! ${monsterDamage} ダメージ。`, "good");
    } else if (result === "lose") {
        const playerDamage = Math.floor(monster.attack + randomRange(4, 12));
        player.hp = clamp(player.hp - playerDamage, 0, player.maxHp);
        battle.winStreak = 0;
        battle.monsterAnim = 0.3;
        createHitEffect(player.x, player.y - 18, "255,116,104");
        addLog(`あなた:${RPS_LABEL[playerHand]} 相手:${RPS_LABEL[monsterHand]} 負け... ${playerDamage} ダメージ。`, "danger");
    } else {
        const chipDamage = 6 + randomInt(0, 4);
        battle.hp -= chipDamage;
        battle.winStreak = 0;
        battle.playerAnim = 0.14;
        battle.monsterAnim = 0.14;
        createHitEffect(monster.x, monster.y - 20, "170,221,255");
        addLog(`あなた:${RPS_LABEL[playerHand]} 相手:${RPS_LABEL[monsterHand]} あいこ。 ${chipDamage} ダメージ。`);
    }

    if (battle.hp <= 0) {
        finishBattle(true, "討伐成功");
        return;
    }

    if (player.hp <= 0) {
        finishBattle(false, "力尽きました");
    }
}

function gainExp(amount) {
    const player = gameState.player;
    player.exp += amount;

    let next = expToNextRank(player.rank);
    while (player.exp >= next) {
        player.exp -= next;
        player.rank += 1;
        player.maxHp += 6;
        player.hp = player.maxHp;
        addLog(`ハンターランク ${player.rank} に上昇。`, "good");
        next = expToNextRank(player.rank);
    }
}

function finishBattle(won, reason) {
    const battle = gameState.battle;
    if (!battle) {
        return;
    }

    const player = gameState.player;
    const monster = findMonster(battle.monsterId);

    if (won && monster) {
        const materialGain = randomInt(6, 13) + monster.star * 3;
        const zennyGain = randomInt(70, 120) + monster.star * 42;
        const expGain = randomInt(20, 36) + monster.star * 15;

        player.materials += materialGain;
        player.zenny += zennyGain;
        gainExp(expGain);

        ui.rewardTitle.textContent = "狩猟成功";
        ui.rewardSummary.textContent = `${reason}\n${monster.base.rewardMaterial} +${materialGain}\n${zennyGain}z / EXP +${expGain}`;
        ui.rewardModal.classList.remove("hidden");

        addLog(`${monster.base.name} の討伐完了。`, "good");
        gameState.monsters = gameState.monsters.filter((item) => item.uid !== monster.uid);
    }

    if (!won) {
        ui.rewardTitle.textContent = "狩猟失敗";
        ui.rewardSummary.textContent = `${reason}\n体制を整えて再挑戦してください。`;
        ui.rewardModal.classList.remove("hidden");

        player.hp = Math.max(Math.floor(player.maxHp * 0.4), 1);
        addLog(`狩猟失敗: ${reason}`, "warn");

        if (monster) {
            monster.expiresIn = Math.max(monster.expiresIn, 30);
            monster.state = "wild";
            monster.x = clamp(monster.x + randomRange(130, 220), 50, WORLD.width - 50);
            monster.y = clamp(monster.y + randomRange(-120, 120), 50, WORLD.height - 50);
        }
    }

    gameState.battle = null;
    gameState.selectedMonsterId = null;
    clearTouchVector();
}

function upgradeWeapon() {
    const player = gameState.player;
    const needMaterial = 120 + (player.weaponLevel - 1) * 50;
    const needZenny = 500 + (player.weaponLevel - 1) * 220;

    if (player.materials < needMaterial || player.zenny < needZenny) {
        addLog(`強化素材不足: 素材${needMaterial}, ${needZenny}z。`, "warn");
        return;
    }

    player.materials -= needMaterial;
    player.zenny -= needZenny;
    player.weaponLevel += 1;

    addLog(`武器レベル ${player.weaponLevel} に強化。`, "good");
}

function updateBattle(delta) {
    const battle = gameState.battle;
    if (!battle) {
        return;
    }

    const player = gameState.player;
    const monster = findMonster(battle.monsterId);
    if (!monster) {
        finishBattle(false, "ターゲットロスト");
        return;
    }

    const toMonsterX = monster.x - player.x;
    const toMonsterY = monster.y - player.y;
    const pull = Math.max(0.001, Math.hypot(toMonsterX, toMonsterY));

    monster.x = player.x + (toMonsterX / pull) * clamp(pull, 94, 136);
    monster.y = player.y + (toMonsterY / pull) * clamp(pull, 70, 120);

    battle.timer -= delta;
    battle.turnCooldown = Math.max(0, battle.turnCooldown - delta);
    battle.playerAnim = Math.max(0, battle.playerAnim - delta);
    battle.monsterAnim = Math.max(0, battle.monsterAnim - delta);

    player.stamina = clamp(player.stamina + delta * 13.5, 0, player.maxStamina);

    if (battle.timer <= 0) {
        finishBattle(false, "時間切れ");
    }
}

function updateOutOfBattle(delta) {
    const player = gameState.player;
    player.stamina = clamp(player.stamina + delta * 20, 0, player.maxStamina);
    player.hp = clamp(player.hp + delta * 2.4, 1, player.maxHp);
}

function updateEffects(delta) {
    gameState.effects.forEach((effect) => {
        effect.ttl -= delta;
    });
    gameState.effects = gameState.effects.filter((effect) => effect.ttl > 0);
}

function updatePlayer(delta) {
    const player = gameState.player;
    if (gameState.battle) {
        return;
    }

    const input = gameState.input;
    const keyboardX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const keyboardY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const manualX = keyboardX + input.touchX;
    const manualY = keyboardY + input.touchY;

    let vx = 0;
    let vy = 0;

    if (Math.abs(manualX) > 0.001 || Math.abs(manualY) > 0.001) {
        const mag = Math.hypot(manualX, manualY) || 1;
        vx = manualX / mag;
        vy = manualY / mag;
        player.moveTarget = null;
    } else if (player.moveTarget) {
        const dx = player.moveTarget.x - player.x;
        const dy = player.moveTarget.y - player.y;
        const remain = Math.hypot(dx, dy);
        if (remain < 6) {
            player.moveTarget = null;
        } else {
            vx = dx / remain;
            vy = dy / remain;
        }
    }

    if (vx === 0 && vy === 0) {
        return;
    }

    player.dirX = vx;
    player.dirY = vy;
    movePlayerBy(vx * player.speed * delta, vy * player.speed * delta);
}

function updateCamera() {
    gameState.camera.x = clamp(gameState.player.x - canvas.width / 2, 0, WORLD.width - canvas.width);
    gameState.camera.y = clamp(gameState.player.y - canvas.height / 2, 0, WORLD.height - canvas.height);
}

function worldToScreen(x, y) {
    return {
        x: x - gameState.camera.x,
        y: y - gameState.camera.y
    };
}

function screenToWorld(x, y) {
    return {
        x: x + gameState.camera.x,
        y: y + gameState.camera.y
    };
}

function drawBackground() {
    ctx.fillStyle = "#13210f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startX = Math.floor(gameState.camera.x / WORLD.biomeGrid) * WORLD.biomeGrid;
    const endX = gameState.camera.x + canvas.width + WORLD.biomeGrid;
    const startY = Math.floor(gameState.camera.y / WORLD.biomeGrid) * WORLD.biomeGrid;
    const endY = gameState.camera.y + canvas.height + WORLD.biomeGrid;

    for (let x = startX; x < endX; x += WORLD.biomeGrid) {
        for (let y = startY; y < endY; y += WORLD.biomeGrid) {
            const nx = Math.floor(x / WORLD.biomeGrid);
            const ny = Math.floor(y / WORLD.biomeGrid);
            const noise = (nx * 928371 + ny * 1237) % 5;
            if (noise === 0) {
                ctx.fillStyle = "rgba(116, 170, 85, 0.12)";
            } else if (noise === 1) {
                ctx.fillStyle = "rgba(74, 125, 56, 0.1)";
            } else {
                ctx.fillStyle = "rgba(53, 90, 41, 0.08)";
            }

            const tile = worldToScreen(x, y);
            ctx.fillRect(tile.x, tile.y, WORLD.biomeGrid - 2, WORLD.biomeGrid - 2);
        }
    }
}

function drawWorldObjects() {
    gameState.worldObjects.forEach((obj) => {
        const pos = worldToScreen(obj.x, obj.y);
        if (pos.x < -60 || pos.x > canvas.width + 60 || pos.y < -60 || pos.y > canvas.height + 60) {
            return;
        }

        if (obj.kind === "tree") {
            ctx.fillStyle = "rgba(20, 35, 19, 0.5)";
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y + obj.size * 0.42, obj.size * 0.48, obj.size * 0.24, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#3f7132";
            ctx.beginPath();
            ctx.arc(pos.x, pos.y - obj.size * 0.2, obj.size * 0.52, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#335727";
            ctx.fillRect(pos.x - 4, pos.y + obj.size * 0.1, 8, obj.size * 0.52);
        } else {
            ctx.fillStyle = "#57615a";
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, obj.size * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#707972";
            ctx.beginPath();
            ctx.arc(pos.x - obj.size * 0.12, pos.y - obj.size * 0.1, obj.size * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawHealingItems() {
    gameState.healingItems.forEach((item) => {
        const pos = worldToScreen(item.x, item.y);
        if (pos.x < -40 || pos.x > canvas.width + 40 || pos.y < -40 || pos.y > canvas.height + 40) {
            return;
        }

        const pulse = 1 + Math.sin(item.pulse) * 0.1;
        const radius = 12 * pulse;
        const ring = 17 + Math.sin(item.pulse * 1.4) * 2.5;

        ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + 8, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `${item.type.color}aa`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ring, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = item.type.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#102018";
        ctx.font = "bold 12px 'Orbitron', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.type.glyph, pos.x, pos.y + 1);
    });
}

function drawEntityShadow(x, y, w, h) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawSprite(name, x, y, width, height) {
    const img = sprites[name];
    if (img && img.complete) {
        ctx.drawImage(img, x - width / 2, y - height, width, height);
        return;
    }

    ctx.fillStyle = "#dce5cf";
    ctx.fillRect(x - width / 2, y - height, width, height);
}

function drawMonster(monster) {
    const pos = worldToScreen(monster.x, monster.y);
    if (pos.x < -90 || pos.x > canvas.width + 90 || pos.y < -90 || pos.y > canvas.height + 90) {
        return;
    }

    const battle = gameState.battle;
    const isTarget = battle && battle.monsterId === monster.uid;
    const isSelected = gameState.selectedMonsterId === monster.uid;

    drawEntityShadow(pos.x, pos.y + 6, 30, 10);

    const shakeX = isTarget && battle.monsterAnim > 0 ? randomRange(-3, 3) : 0;
    const shakeY = isTarget && battle.monsterAnim > 0 ? randomRange(-2, 2) : 0;
    drawSprite(monster.base.id, pos.x + shakeX, pos.y + shakeY, 92, 88);

    if (isSelected) {
        ctx.strokeStyle = "rgba(255, 229, 118, 0.95)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - 34, 18 + Math.sin(gameState.time * 6) * 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.fillStyle = "rgba(8, 16, 6, 0.76)";
    ctx.fillRect(pos.x - 42, pos.y - 54, 84, 10);
    const hpRate = gameState.battle && gameState.battle.monsterId === monster.uid
        ? clamp(gameState.battle.hp / monster.hpMax, 0, 1)
        : 1;
    ctx.fillStyle = "#ff9a62";
    ctx.fillRect(pos.x - 42, pos.y - 54, 84 * hpRate, 10);

    ctx.fillStyle = "#f4e27f";
    ctx.font = "12px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(starsText(monster.star), pos.x, pos.y - 60);
}

function drawPlayer() {
    const player = gameState.player;
    const pos = worldToScreen(player.x, player.y);
    const battle = gameState.battle;

    drawEntityShadow(pos.x, pos.y + 6, 26, 9);

    const bob = Math.sin(gameState.time * 8) * 1.6;
    const shakeX = battle && battle.playerAnim > 0 ? randomRange(-2, 2) : 0;
    drawSprite("player", pos.x + shakeX, pos.y + bob, 82, 94);

    ctx.strokeStyle = "rgba(185, 246, 143, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y - 10, 26, 0, Math.PI * 2);
    ctx.stroke();
}

function drawEffects() {
    gameState.effects.forEach((effect) => {
        const pos = worldToScreen(effect.x, effect.y);
        const rate = effect.ttl / effect.maxTtl;
        const alpha = clamp(rate, 0, 1);

        ctx.strokeStyle = `rgba(${effect.color}, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, effect.size * (1 + (1 - rate) * 0.4), 0, Math.PI * 2);
        ctx.stroke();
    });
}

function drawField() {
    drawBackground();
    drawWorldObjects();
    drawHealingItems();

    const entities = [];
    gameState.monsters.forEach((monster) => {
        entities.push({ y: monster.y, type: "monster", ref: monster });
    });
    entities.push({ y: gameState.player.y, type: "player" });

    entities.sort((a, b) => a.y - b.y);
    entities.forEach((entity) => {
        if (entity.type === "player") {
            drawPlayer();
        } else {
            drawMonster(entity.ref);
        }
    });

    drawEffects();
}

function getSelectedMonster() {
    if (gameState.battle) {
        return findMonster(gameState.battle.monsterId);
    }
    return findMonster(gameState.selectedMonsterId);
}

function renderBattle() {
    const battle = gameState.battle;
    const player = gameState.player;
    const selected = getSelectedMonster();

    if (!battle || !selected) {
        ui.battleTimer.textContent = "待機中";
        ui.targetName.textContent = "ターゲットなし";
        ui.targetDetail.textContent = `武器 Lv.${player.weaponLevel} / フィールドで接敵`;
        ui.monsterHpText.textContent = "-- / --";
        ui.monsterHpBar.style.width = "0%";
        ui.target.classList.add("idle");
        return;
    }

    ui.target.classList.remove("idle");
    ui.battleTimer.textContent = `残り ${Math.max(0, Math.ceil(battle.timer))} 秒`;
    ui.targetName.textContent = `${selected.base.name} (${starsText(selected.star)})`;
    const turnLabel = battle.turnCooldown > 0
        ? `次の手まで ${battle.turnCooldown.toFixed(1)}s`
        : "手を選択";
    const handLabel = battle.lastPlayerHand
        ? `前手: ${RPS_LABEL[battle.lastPlayerHand]} / ${RPS_LABEL[battle.lastMonsterHand]}`
        : "初手を選択";
    ui.targetDetail.textContent = `Round ${battle.round} | ${turnLabel} | ${handLabel}`;

    const hpRate = clamp((battle.hp / selected.hpMax) * 100, 0, 100);
    ui.monsterHpBar.style.width = `${hpRate}%`;
    ui.monsterHpText.textContent = `${Math.max(0, Math.ceil(battle.hp))} / ${selected.hpMax}`;
}

function renderPlayerStatus() {
    const player = gameState.player;
    const next = expToNextRank(player.rank);

    ui.rank.textContent = String(player.rank);
    ui.exp.textContent = String(Math.floor(player.exp));
    ui.nextExp.textContent = String(next);

    const hpRate = clamp((player.hp / player.maxHp) * 100, 0, 100);
    const staminaRate = clamp((player.stamina / player.maxStamina) * 100, 0, 100);

    ui.hpBar.style.width = `${hpRate}%`;
    ui.staminaBar.style.width = `${staminaRate}%`;
    ui.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    ui.staminaText.textContent = `${Math.ceil(player.stamina)} / ${player.maxStamina}`;
    ui.material.textContent = String(player.materials);
    ui.zenny.textContent = String(player.zenny);
    ui.fieldHr.textContent = String(player.rank);
    ui.fieldWeapon.textContent = String(player.weaponLevel);
    ui.fieldZenny.textContent = String(player.zenny);
    ui.fieldHpText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
    ui.fieldStaminaText.textContent = `${Math.ceil(player.stamina)}/${player.maxStamina}`;
    ui.fieldHpBar.style.width = `${hpRate}%`;
    ui.fieldStaminaBar.style.width = `${staminaRate}%`;

    const needMaterial = 120 + (player.weaponLevel - 1) * 50;
    const needZenny = 500 + (player.weaponLevel - 1) * 220;
    ui.upgradeBtn.textContent = `武器強化 Lv.${player.weaponLevel} -> ${player.weaponLevel + 1} (素材${needMaterial} / ${needZenny}z)`;
    renderCoordinateInfo();
}

function renderFieldInfo() {
    const selected = getSelectedMonster();
    const inBattle = Boolean(gameState.battle);
    const itemCount = gameState.healingItems.length;

    ui.spawnTimer.textContent = String(Math.max(0, Math.ceil(gameState.spawnCooldown)));

    if (!selected) {
        ui.mapHint.textContent = IS_TOUCH_DEVICE
            ? `探索中: ${gameState.monsters.length}体検知 / 回復${itemCount}個`
            : `探索中: ${gameState.monsters.length}体検知 / 回復アイテム${itemCount}個`;
        ui.selectedDistance.textContent = "ターゲット: なし";
        return;
    }

    const d = Math.ceil(distance(gameState.player, selected));
    ui.selectedDistance.textContent = `ターゲット: ${selected.base.name} ${d}m`;

    if (inBattle) {
        ui.mapHint.textContent = "戦闘中: じゃんけんで手を選択";
    } else if (d <= ENCOUNTER_RANGE) {
        ui.mapHint.textContent = `接敵可能: ${selected.base.name} を狩猟開始できます`;
    } else {
        ui.mapHint.textContent = IS_TOUCH_DEVICE
            ? `${selected.base.name} へ接近（タップ移動 / フリックダッシュ）`
            : `${selected.base.name} へ接近してください`;
    }
}

function renderActions() {
    const inBattle = Boolean(gameState.battle);
    const selected = getSelectedMonster();
    const near = selected ? distance(gameState.player, selected) <= ENCOUNTER_RANGE : false;
    const locked = inBattle && gameState.battle && gameState.battle.turnCooldown > 0;

    ui.rpsRockBtn.disabled = !inBattle || locked;
    ui.rpsScissorsBtn.disabled = !inBattle || locked;
    ui.rpsPaperBtn.disabled = !inBattle || locked;
    ui.engageBtn.disabled = inBattle || !selected || !near;
}

function renderAll() {
    updateCamera();
    drawField();
    renderBattle();
    renderPlayerStatus();
    renderFieldInfo();
    renderActions();
}

function gameLoop(now) {
    const delta = Math.min(0.2, (now - gameState.lastFrame) / 1000);
    gameState.lastFrame = now;
    gameState.time += delta;

    refreshMonsters(delta);
    refreshHealingItems(delta);
    updatePlayer(delta);
    if (!gameState.battle) {
        collectNearbyHealingItems();
        tryAutoEngageByContact();
    }

    if (gameState.battle) {
        updateBattle(delta);
    } else {
        updateOutOfBattle(delta);
    }

    updateSelectedMonster();
    updateEffects(delta);
    renderAll();

    requestAnimationFrame(gameLoop);
}

function onKeyChange(event, pressed) {
    if (event.code === "ArrowUp" || event.code === "KeyW") {
        gameState.input.up = pressed;
    }
    if (event.code === "ArrowDown" || event.code === "KeyS") {
        gameState.input.down = pressed;
    }
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
        gameState.input.left = pressed;
    }
    if (event.code === "ArrowRight" || event.code === "KeyD") {
        gameState.input.right = pressed;
    }
}

window.addEventListener("keydown", (event) => {
    onKeyChange(event, true);
});

window.addEventListener("keyup", (event) => {
    onKeyChange(event, false);
});

ui.touchPadButtons.forEach((button) => {
    const dir = button.getAttribute("data-dir");
    if (!dir) {
        return;
    }

    const setValue = (value) => {
        gameState.input[dir] = value;
    };

    button.addEventListener("pointerdown", (event) => {
        setValue(true);
        button.setPointerCapture?.(event.pointerId);
    });

    button.addEventListener("pointerup", () => {
        setValue(false);
    });

    button.addEventListener("pointerleave", () => {
        setValue(false);
    });

    button.addEventListener("pointercancel", () => {
        setValue(false);
    });
});

function pickMonsterOnField(worldPos) {
    let hit = null;
    let hitDistance = 999;

    gameState.monsters.forEach((monster) => {
        if (monster.state !== "wild") {
            return;
        }

        const d = Math.hypot(worldPos.x - monster.x, worldPos.y - monster.y);
        if (d < 50 && d < hitDistance) {
            hit = monster;
            hitDistance = d;
        }
    });

    return hit;
}

function selectMonsterAndTryEngage(monster) {
    gameState.selectedMonsterId = monster.uid;
    if (!gameState.battle && distance(gameState.player, monster) <= ENCOUNTER_RANGE) {
        startBattle(monster.uid);
    } else if (!gameState.battle) {
        const remain = Math.max(0, Math.ceil(distance(gameState.player, monster) - ENCOUNTER_RANGE));
        addLog(`${monster.base.name} まであと ${remain}m。`, "warn");
    }
}

function resetTouchGesture() {
    gameState.touch.pointerId = null;
    gameState.touch.startX = 0;
    gameState.touch.startY = 0;
    gameState.touch.startWorldX = 0;
    gameState.touch.startWorldY = 0;
    gameState.touch.startAt = 0;
    gameState.touch.startedOnMonster = false;
    gameState.touch.monsterId = null;
    clearTouchVector();
}

function beginMapGesture(event, worldPos, pickedMonster) {
    gameState.touch.pointerId = event.pointerId;
    gameState.touch.startX = event.clientX;
    gameState.touch.startY = event.clientY;
    gameState.touch.startWorldX = worldPos.x;
    gameState.touch.startWorldY = worldPos.y;
    gameState.touch.startAt = performance.now();
    gameState.touch.startedOnMonster = Boolean(pickedMonster);
    gameState.touch.monsterId = pickedMonster ? pickedMonster.uid : null;
    clearTouchVector();
    canvas.setPointerCapture?.(event.pointerId);
}

function updateMapGesture(event) {
    if (gameState.touch.pointerId !== event.pointerId) {
        return;
    }
    if (gameState.battle || gameState.touch.startedOnMonster) {
        clearTouchVector();
        return;
    }

    const dx = event.clientX - gameState.touch.startX;
    const dy = event.clientY - gameState.touch.startY;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
        clearTouchVector();
        return;
    }

    setTouchVector(dx / 72, dy / 72);
    event.preventDefault();
}

function endMapGesture(event, canceled = false) {
    if (gameState.touch.pointerId !== event.pointerId) {
        return;
    }

    const dx = event.clientX - gameState.touch.startX;
    const dy = event.clientY - gameState.touch.startY;
    const dist = Math.hypot(dx, dy);
    const elapsedMs = performance.now() - gameState.touch.startAt;

    if (!canceled && !gameState.battle) {
        if (gameState.touch.startedOnMonster) {
            const selected = findMonster(gameState.touch.monsterId);
            if (selected && distance(gameState.player, selected) > ENCOUNTER_RANGE) {
                setMoveTarget(selected.x, selected.y);
            }
        } else if (dist >= 56 && elapsedMs <= 260) {
            const nx = dx / dist;
            const ny = dy / dist;
            const dash = clamp(120 + dist * 0.4, 120, 230);
            movePlayerBy(nx * dash, ny * dash);
            gameState.player.moveTarget = null;
        } else if (dist <= 12) {
            setMoveTarget(gameState.touch.startWorldX, gameState.touch.startWorldY);
        }
    }

    canvas.releasePointerCapture?.(event.pointerId);
    resetTouchGesture();
    event.preventDefault();
}

canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    const worldPos = screenToWorld(sx, sy);
    const pickedMonster = pickMonsterOnField(worldPos);

    if (pickedMonster) {
        selectMonsterAndTryEngage(pickedMonster);
    }

    if (event.pointerType !== "mouse") {
        beginMapGesture(event, worldPos, pickedMonster);
        event.preventDefault();
    }
});

canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse") {
        return;
    }
    updateMapGesture(event);
});

canvas.addEventListener("pointerup", (event) => {
    if (event.pointerType === "mouse") {
        return;
    }
    endMapGesture(event, false);
});

canvas.addEventListener("pointercancel", (event) => {
    if (event.pointerType === "mouse") {
        return;
    }
    endMapGesture(event, true);
});

ui.engageBtn.addEventListener("click", () => {
    const selected = getSelectedMonster();
    if (!selected) {
        return;
    }
    startBattle(selected.uid);
});

ui.rpsRockBtn.addEventListener("click", () => {
    playRpsRound("rock");
});
ui.rpsScissorsBtn.addEventListener("click", () => {
    playRpsRound("scissors");
});
ui.rpsPaperBtn.addEventListener("click", () => {
    playRpsRound("paper");
});
ui.upgradeBtn.addEventListener("click", upgradeWeapon);
ui.rewardClose.addEventListener("click", () => {
    ui.rewardModal.classList.add("hidden");
});

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(180, Math.floor(rect.height));

    canvas.width = width;
    canvas.height = height;

    updateCamera();
    renderAll();
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", stopGeolocationTracking);

if (IS_TOUCH_DEVICE) {
    document.body.classList.add("input-touch");
} else {
    document.body.classList.add("input-desktop");
}

createWorldObjects();
for (let i = 0; i < 6; i += 1) {
    spawnMonster();
}
for (let i = 0; i < 4; i += 1) {
    spawnHealingItem();
}

addLog("フィールド展開完了。モンスターへ接近して狩猟開始。", "good");
startGeolocationTracking();
resizeCanvas();
requestAnimationFrame(gameLoop);
