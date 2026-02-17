const SAVE_KEY = 'legend-of-code-save-v3';
const WORLD_WIDTH = 30;
const WORLD_HEIGHT = 18;

const screens = {
    world: document.getElementById('world-screen'),
    location: document.getElementById('location-screen'),
    battle: document.getElementById('battle-screen'),
};

const worldMapEl = document.getElementById('world-map');
const worldMessageEl = document.getElementById('world-message');
const statusTextEl = document.getElementById('status-text');
const partyTextEl = document.getElementById('party-text');
const inventoryTextEl = document.getElementById('inventory-text');

const locationTitleEl = document.getElementById('location-title');
const locationDescEl = document.getElementById('location-desc');
const locationMapEl = document.getElementById('location-map');
const locationHintEl = document.getElementById('location-hint');
const locationStatusEl = document.getElementById('location-status');
const locationPartyEl = document.getElementById('location-party');
const locationMenuTitleEl = document.getElementById('location-menu-title');
const locationOptionsEl = document.getElementById('location-options');
const locationMessageEl = document.getElementById('location-message');

const battlePartyEl = document.getElementById('battle-party');
const enemyNameEl = document.getElementById('enemy-name');
const enemySpriteEl = document.getElementById('enemy-sprite');
const enemyHpEl = document.getElementById('enemy-hp');
const battleStatusEl = document.getElementById('battle-status');
const battleMessageEl = document.getElementById('battle-message');
const battleOptionEls = Array.from(document.querySelectorAll('#battle-options li'));

const sprites = {
    party: {
        勇者: 'assets/party/hero_knight.svg',
        剣士アオイ: 'assets/party/ally_swordsman.svg',
        魔導士セツナ: 'assets/party/ally_mage.svg',
        海賊レオ: 'assets/party/ally_pirate.svg',
        神官ユイ: 'assets/party/ally_priest.svg',
    },
    monsters: {
        slime: 'assets/monsters/monster_slime.svg',
        wolf: 'assets/monsters/monster_wolf.svg',
        golem: 'assets/monsters/monster_golem.svg',
        dragon: 'assets/monsters/monster_dragon.svg',
        demon: 'assets/monsters/monster_demon.svg',
        guardian: 'assets/monsters/monster_guardian.svg',
    },
    world: {
        town: 'assets/world/icon_town.svg',
        castle: 'assets/world/icon_castle.svg',
        dungeon: 'assets/world/icon_dungeon.svg',
        elf: 'assets/world/icon_elf.svg',
        demon: 'assets/world/icon_demon_castle.svg',
        ship: 'assets/world/icon_ship.svg',
    },
};

const continents = [
    { id: 'lumina', name: 'ルミナ大陸', contains: (x, y) => x >= 1 && x <= 9 && y >= 5 && y <= 13 },
    { id: 'frost', name: 'フロスト大陸', contains: (x, y) => x >= 12 && x <= 19 && y >= 2 && y <= 8 },
    { id: 'east', name: 'アストラ大陸', contains: (x, y) => x >= 21 && x <= 29 && y >= 5 && y <= 12 },
    { id: 'south', name: 'ソル大陸', contains: (x, y) => x >= 10 && x <= 19 && y >= 11 && y <= 16 },
    { id: 'dark', name: '暗黒大陸', contains: (x, y) => x >= 24 && x <= 29 && y >= 0 && y <= 3 },
    { id: 'elf', name: '霊樹の孤島', contains: (x, y) => x >= 10 && x <= 11 && y >= 2 && y <= 3 },
];

const locations = [
    { id: 'lumina_town', name: 'はじまりの街 コードリア', type: 'town', x: 4, y: 9, continent: 'ルミナ大陸', description: '旅立ちの街。商店、宿、ギルドが並ぶ。' },
    { id: 'lumina_castle', name: '白光城', type: 'castle', x: 8, y: 7, continent: 'ルミナ大陸', description: '古くから大陸を守る王城。' },
    { id: 'tide_dungeon', name: '潮風の洞窟', type: 'dungeon', x: 5, y: 12, continent: 'ルミナ大陸', description: '船の手がかりが眠る洞窟。' },

    { id: 'frost_town', name: '氷河の街 ノースリンク', type: 'town', x: 14, y: 5, continent: 'フロスト大陸', description: '雪と魔法で栄える街。' },
    { id: 'frost_castle', name: '蒼氷城', type: 'castle', x: 17, y: 3, continent: 'フロスト大陸', description: '北の王家が治める城。' },
    { id: 'frost_dungeon', name: '氷晶の迷宮', type: 'dungeon', x: 13, y: 8, continent: 'フロスト大陸', description: '冷気の紋章が眠る迷宮。' },

    { id: 'east_town', name: '港町 マリネス', type: 'town', x: 24, y: 8, continent: 'アストラ大陸', description: '交易でにぎわう港町。' },
    { id: 'east_castle', name: '暁星城', type: 'castle', x: 27, y: 6, continent: 'アストラ大陸', description: '海を見下ろす東方の城。' },
    { id: 'east_dungeon', name: '雷鳴の遺跡', type: 'dungeon', x: 23, y: 11, continent: 'アストラ大陸', description: '稲妻の紋章が眠る遺跡。' },

    { id: 'south_town', name: '砂陽の街 サンベル', type: 'town', x: 14, y: 14, continent: 'ソル大陸', description: '熱風が吹く商人の街。' },
    { id: 'south_castle', name: '紅炎城', type: 'castle', x: 18, y: 12, continent: 'ソル大陸', description: '炎の加護を持つ城。' },
    { id: 'south_dungeon', name: '灼熱火口洞', type: 'dungeon', x: 12, y: 15, continent: 'ソル大陸', description: '炎の紋章が眠る火口洞。' },

    { id: 'king_west', name: '西天王 グラウズ城', type: 'four-king', x: 2, y: 6, continent: 'ルミナ大陸', description: '四天王の砦。西の猛将が待つ。' },
    { id: 'king_north', name: '北天王 ブリザル城', type: 'four-king', x: 18, y: 6, continent: 'フロスト大陸', description: '四天王の砦。北の氷将が待つ。' },
    { id: 'king_east', name: '東天王 ボルテス城', type: 'four-king', x: 28, y: 9, continent: 'アストラ大陸', description: '四天王の砦。東の雷将が待つ。' },
    { id: 'king_south', name: '南天王 イグニス城', type: 'four-king', x: 19, y: 15, continent: 'ソル大陸', description: '四天王の砦。南の炎将が待つ。' },

    { id: 'elf_village', name: '伝説のエルフの里', type: 'elf', x: 10, y: 2, continent: '霊樹の孤島', description: '勇者の剣の試練を受けられる里。' },
    { id: 'demon_castle', name: '魔王城 ネザーフォート', type: 'demon', x: 27, y: 1, continent: '暗黒大陸', description: '魔王が待つ最後の城。' },
];

const towns = {
    lumina_town: { recruit: '剣士アオイ' },
    frost_town: { recruit: '魔導士セツナ' },
    east_town: { recruit: '海賊レオ' },
    south_town: { recruit: '神官ユイ' },
};

const itemMaster = {
    ポーション: { buy: 30, sell: 15, heal: 45 },
    エーテル: { buy: 80, sell: 40 },
    ハイポーション: { buy: 90, sell: 45, heal: 90 },
};

const dungeonData = {
    tide_dungeon: {
        monsters: [
            { name: 'クラッシュクラブ', hp: 100, atkMin: 11, atkMax: 18, gold: 26, sprite: sprites.monsters.slime },
            { name: 'バイトサーペント', hp: 115, atkMin: 12, atkMax: 19, gold: 30, sprite: sprites.monsters.wolf },
        ],
        boss: { name: '深海オクトコード', hp: 240, atkMin: 17, atkMax: 24, gold: 190, sprite: sprites.monsters.golem },
        chests: [
            { id: 't1', x: 4, y: 3, reward: { type: 'gold', amount: 80 }, text: '古びた宝箱から 80G を手に入れた。' },
            { id: 't2', x: 8, y: 9, reward: { type: 'item', item: 'ポーション', amount: 2 }, text: '宝箱から ポーション x2 を手に入れた。' },
            { id: 't3', x: 12, y: 5, reward: { type: 'item', item: '潮騒のコンパス', amount: 1 }, text: '潮騒のコンパスを発見した。' },
        ],
        rewards: [
            { type: 'ship', text: '帆船を手に入れた。海を航海できる！' },
            { type: 'item', item: '海神のしずく', amount: 1, text: '海神のしずくを手に入れた。' },
        ],
    },
    frost_dungeon: {
        monsters: [
            { name: 'フリーズウルフ', hp: 124, atkMin: 14, atkMax: 21, gold: 36, sprite: sprites.monsters.wolf },
            { name: 'アイスゴーレム', hp: 142, atkMin: 15, atkMax: 23, gold: 42, sprite: sprites.monsters.golem },
        ],
        boss: { name: '零度竜グラシオン', hp: 300, atkMin: 19, atkMax: 27, gold: 240, sprite: sprites.monsters.dragon },
        chests: [
            { id: 'f1', x: 4, y: 3, reward: { type: 'gold', amount: 120 }, text: '凍った宝箱から 120G を得た。' },
            { id: 'f2', x: 8, y: 9, reward: { type: 'item', item: 'ハイポーション', amount: 1 }, text: 'ハイポーションを見つけた。' },
            { id: 'f3', x: 12, y: 5, reward: { type: 'item', item: '氷の紋章', amount: 1 }, text: '氷の紋章を見つけた。' },
        ],
        rewards: [{ type: 'item', item: '氷の紋章', amount: 1, text: '氷の紋章を獲得した。' }],
    },
    east_dungeon: {
        monsters: [
            { name: 'サンダービット', hp: 134, atkMin: 16, atkMax: 23, gold: 40, sprite: sprites.monsters.slime },
            { name: '機巧スナイパー', hp: 150, atkMin: 17, atkMax: 24, gold: 46, sprite: sprites.monsters.golem },
        ],
        boss: { name: '雷帝トールガード', hp: 325, atkMin: 20, atkMax: 29, gold: 270, sprite: sprites.monsters.dragon },
        chests: [
            { id: 'e1', x: 4, y: 3, reward: { type: 'gold', amount: 140 }, text: '遺跡の宝箱から 140G を手に入れた。' },
            { id: 'e2', x: 8, y: 9, reward: { type: 'item', item: 'エーテル', amount: 2 }, text: 'エーテル x2 を見つけた。' },
            { id: 'e3', x: 12, y: 5, reward: { type: 'item', item: '雷の紋章', amount: 1 }, text: '雷の紋章を見つけた。' },
        ],
        rewards: [{ type: 'item', item: '雷の紋章', amount: 1, text: '雷の紋章を獲得した。' }],
    },
    south_dungeon: {
        monsters: [
            { name: 'フレイムリザード', hp: 140, atkMin: 17, atkMax: 24, gold: 44, sprite: sprites.monsters.wolf },
            { name: 'ラーヴァナイト', hp: 156, atkMin: 18, atkMax: 25, gold: 48, sprite: sprites.monsters.golem },
        ],
        boss: { name: '炎獣ヴォルガン', hp: 350, atkMin: 22, atkMax: 30, gold: 300, sprite: sprites.monsters.dragon },
        chests: [
            { id: 's1', x: 4, y: 3, reward: { type: 'gold', amount: 160 }, text: '火口の奥で 160G を発見した。' },
            { id: 's2', x: 8, y: 9, reward: { type: 'item', item: 'ハイポーション', amount: 1 }, text: 'ハイポーションを得た。' },
            { id: 's3', x: 12, y: 5, reward: { type: 'item', item: '炎の紋章', amount: 1 }, text: '炎の紋章を見つけた。' },
        ],
        rewards: [{ type: 'item', item: '炎の紋章', amount: 1, text: '炎の紋章を獲得した。' }],
    },
};

const fourKingData = {
    king_west: {
        kingId: 'west',
        boss: { name: '西天王グラウズ', hp: 360, atkMin: 23, atkMax: 31, gold: 340, sprite: sprites.monsters.golem },
        chests: [
            { id: 'w1', x: 4, y: 3, reward: { type: 'gold', amount: 180 }, text: '王家の金庫から 180G を得た。' },
            { id: 'w2', x: 12, y: 3, reward: { type: 'item', item: '王の証・西', amount: 1 }, text: '王の証・西を得た。' },
        ],
    },
    king_north: {
        kingId: 'north',
        boss: { name: '北天王ブリザル', hp: 380, atkMin: 24, atkMax: 32, gold: 360, sprite: sprites.monsters.dragon },
        chests: [
            { id: 'n1', x: 4, y: 3, reward: { type: 'gold', amount: 190 }, text: '氷の金庫から 190G を得た。' },
            { id: 'n2', x: 12, y: 3, reward: { type: 'item', item: '王の証・北', amount: 1 }, text: '王の証・北を得た。' },
        ],
    },
    king_east: {
        kingId: 'east',
        boss: { name: '東天王ボルテス', hp: 402, atkMin: 25, atkMax: 33, gold: 380, sprite: sprites.monsters.dragon },
        chests: [
            { id: 'e1', x: 4, y: 3, reward: { type: 'gold', amount: 200 }, text: '雷光の宝物庫から 200G を得た。' },
            { id: 'e2', x: 12, y: 3, reward: { type: 'item', item: '王の証・東', amount: 1 }, text: '王の証・東を得た。' },
        ],
    },
    king_south: {
        kingId: 'south',
        boss: { name: '南天王イグニス', hp: 430, atkMin: 26, atkMax: 34, gold: 400, sprite: sprites.monsters.dragon },
        chests: [
            { id: 's1', x: 4, y: 3, reward: { type: 'gold', amount: 220 }, text: '灼熱の宝物庫から 220G を得た。' },
            { id: 's2', x: 12, y: 3, reward: { type: 'item', item: '王の証・南', amount: 1 }, text: '王の証・南を得た。' },
        ],
    },
};

const worldTiles = createWorldTiles();
const locationByCoord = new Map(locations.map((loc) => [`${loc.x},${loc.y}`, loc]));

const state = {
    screen: 'world',
    worldMessage: '魔王討伐の旅が始まる。潮風の洞窟を攻略し、船を手に入れよう。',
    player: {
        x: 4,
        y: 9,
        trail: [],
        hp: 190,
        maxHp: 190,
        gold: 200,
        hasShip: false,
        heroSword: false,
        party: ['勇者'],
        inventory: {
            ポーション: 3,
            エーテル: 1,
            ハイポーション: 0,
        },
    },
    story: {
        recruited: [],
        locationProgress: {},
        fourKingsCleared: [],
        demonKingDefeated: false,
    },
    location: {
        id: null,
        scene: null,
        playerX: 0,
        playerY: 0,
        mode: 'explore',
        menuTitle: '行動',
        menuOptions: [],
        menuIndex: 0,
        hint: '',
        message: '',
    },
    battle: {
        active: false,
        optionIndex: 0,
        enemy: null,
        canRun: true,
        returnScreen: 'world',
        onWin: null,
    },
    savePoint: null,
};

document.addEventListener('keydown', (event) => {
    const key = event.key;
    if (key.startsWith('Arrow')) {
        event.preventDefault();
    }

    if (state.screen === 'world') {
        handleWorldInput(key);
    } else if (state.screen === 'location') {
        handleLocationInput(key);
    } else if (state.screen === 'battle') {
        handleBattleInput(key);
    }
});

initGame();

function initGame() {
    const loaded = tryLoadSavedGame();
    if (!loaded) {
        state.savePoint = createSnapshot('旅立ちの記録');
    }
    showScreen('world');
    renderWorld();
}

function createWorldTiles() {
    const grid = Array.from({ length: WORLD_HEIGHT }, () => Array.from({ length: WORLD_WIDTH }, () => 'ocean'));

    paintRect(grid, 2, 5, 9, 13);
    paintRect(grid, 1, 7, 4, 11);
    paintRect(grid, 12, 2, 19, 8);
    paintRect(grid, 21, 5, 29, 12);
    paintRect(grid, 10, 11, 19, 16);
    paintRect(grid, 24, 0, 29, 3);
    paintRect(grid, 10, 2, 11, 3);

    grid[9][10] = 'ocean';
    grid[8][10] = 'ocean';
    return grid;
}

function paintRect(grid, fromX, fromY, toX, toY) {
    for (let y = fromY; y <= toY; y += 1) {
        for (let x = fromX; x <= toX; x += 1) {
            grid[y][x] = 'land';
        }
    }
}

function handleWorldInput(key) {
    if (key === 'Enter' || key === ' ') {
        const location = getLocationAt(state.player.x, state.player.y);
        if (!location) {
            setWorldMessage('ここには入れる施設がない。');
            renderWorld();
            return;
        }
        openLocation(location.id);
        return;
    }

    if (key === 's' || key === 'S') {
        setWorldMessage('セーブは街や城の中にあるセーブ結晶で行える。');
        renderWorld();
        return;
    }

    const dir = directionFromKey(key);
    if (!dir) return;
    moveWorldPlayer(dir.dx, dir.dy);
}

function handleLocationInput(key) {
    if (state.location.mode === 'menu') {
        if (key === 'Escape') {
            closeLocationMenu();
            return;
        }
        if (key === 'ArrowUp') {
            moveLocationMenu(-1);
            return;
        }
        if (key === 'ArrowDown') {
            moveLocationMenu(1);
            return;
        }
        if (key === 'Enter' || key === ' ') {
            executeLocationMenu();
        }
        return;
    }

    if (key === 'Escape') {
        leaveLocation('ワールドへ戻った。');
        return;
    }

    if (key === 'Enter' || key === ' ') {
        interactLocationObject();
        return;
    }

    const dir = directionFromKey(key);
    if (!dir) return;
    moveLocationPlayer(dir.dx, dir.dy);
}

function handleBattleInput(key) {
    if (!state.battle.active) return;

    if (key === 'ArrowUp') {
        state.battle.optionIndex = (state.battle.optionIndex - 1 + battleOptionEls.length) % battleOptionEls.length;
        renderBattle();
        return;
    }

    if (key === 'ArrowDown') {
        state.battle.optionIndex = (state.battle.optionIndex + 1) % battleOptionEls.length;
        renderBattle();
        return;
    }

    if (key === 'Enter' || key === ' ') {
        executeBattleCommand(battleOptionEls[state.battle.optionIndex].dataset.cmd);
    }
}

function directionFromKey(key) {
    if (key === 'ArrowUp') return { dx: 0, dy: -1 };
    if (key === 'ArrowDown') return { dx: 0, dy: 1 };
    if (key === 'ArrowLeft') return { dx: -1, dy: 0 };
    if (key === 'ArrowRight') return { dx: 1, dy: 0 };
    return null;
}

function moveWorldPlayer(dx, dy) {
    const nx = state.player.x + dx;
    const ny = state.player.y + dy;

    if (nx < 0 || nx >= WORLD_WIDTH || ny < 0 || ny >= WORLD_HEIGHT) return;

    const nextTile = worldTiles[ny][nx];
    if (nextTile === 'ocean' && !state.player.hasShip) {
        setWorldMessage('海を渡るには船が必要だ。潮風の洞窟を攻略しよう。');
        renderWorld();
        return;
    }

    const oldPos = { x: state.player.x, y: state.player.y };
    state.player.x = nx;
    state.player.y = ny;
    updateWorldTrail(oldPos);

    const location = getLocationAt(nx, ny);
    const continent = getCurrentContinentName();

    if (location) {
        setWorldMessage(`${location.name} に到着。Enter で入る。`);
    } else if (nextTile === 'ocean') {
        setWorldMessage(`航海中... (${continent})`);
    } else {
        setWorldMessage(`${continent} を移動中。`);
    }

    maybeStartWorldBattle(nextTile);
    renderWorld();
}

function updateWorldTrail(prev) {
    state.player.trail.unshift(prev);
    const maxTrail = Math.max(0, state.player.party.length - 1);
    state.player.trail = state.player.trail.slice(0, maxTrail);
}

function maybeStartWorldBattle(tileType) {
    if (tileType !== 'land') return;
    if (getLocationAt(state.player.x, state.player.y)) return;
    if (Math.random() > 0.08) return;

    const enemy = createFieldEnemy();
    startBattle(enemy, {
        canRun: true,
        returnScreen: 'world',
        onWin: () => {
            setWorldMessage(`${enemy.name} を倒した。`);
        },
    });
}

function createFieldEnemy() {
    const continent = getCurrentContinentName();
    const pool = [
        { name: `${continent}のスライム`, hp: 104, atkMin: 12, atkMax: 19, gold: 26, sprite: sprites.monsters.slime },
        { name: `${continent}のウルフ`, hp: 120, atkMin: 13, atkMax: 20, gold: 31, sprite: sprites.monsters.wolf },
        { name: `${continent}のゴーレム`, hp: 138, atkMin: 15, atkMax: 22, gold: 36, sprite: sprites.monsters.golem },
    ];
    return cloneObject(pool[randomInt(0, pool.length - 1)]);
}

function openLocation(locationId) {
    const location = locations.find((loc) => loc.id === locationId);
    if (!location) return;

    state.location.id = locationId;
    state.location.scene = buildLocationScene(location);
    state.location.playerX = state.location.scene.start.x;
    state.location.playerY = state.location.scene.start.y;
    state.location.mode = 'explore';
    state.location.menuTitle = '行動';
    state.location.menuOptions = [];
    state.location.menuIndex = 0;

    if (location.type === 'demon') {
        if (state.story.demonKingDefeated) {
            setLocationMessage('魔王はすでに討伐済みだ。世界は平和になった。');
        } else if (!hasAllFourKings()) {
            setLocationMessage('四天王を全員倒さないと魔王城の結界を破れない。');
        } else if (!state.player.heroSword) {
            setLocationMessage('魔王を倒すには勇者の剣が必要だ。エルフの里へ向かおう。');
        } else {
            setLocationMessage('決戦の時だ。魔王を倒そう。');
        }
    } else {
        setLocationMessage(`${location.name} に入った。`);
    }

    showScreen('location');
    renderLocation();
}

function leaveLocation(message) {
    state.location.id = null;
    state.location.scene = null;
    state.location.mode = 'explore';
    setWorldMessage(message || 'ワールドへ戻った。');
    showScreen('world');
    renderWorld();
}

function moveLocationPlayer(dx, dy) {
    const scene = state.location.scene;
    if (!scene) return;

    const nx = state.location.playerX + dx;
    const ny = state.location.playerY + dy;

    if (nx < 0 || nx >= scene.width || ny < 0 || ny >= scene.height) return;
    const tileType = scene.tiles[ny][nx];
    if (!isLocationTilePassable(tileType)) return;

    state.location.playerX = nx;
    state.location.playerY = ny;

    const object = getCurrentLocationObject();
    if (object) {
        state.location.hint = `Enter: ${object.label}`;
    } else {
        state.location.hint = '矢印キーで散策。対象の上で Enter。Esc で外へ。';
    }

    renderLocation();
}

function isLocationTilePassable(tileType) {
    return tileType !== 'wall' && tileType !== 'water';
}

function interactLocationObject() {
    const object = getCurrentLocationObject();
    if (!object) {
        setLocationMessage('ここには調べるものがない。');
        renderLocation();
        return;
    }

    if (object.type === 'exit') {
        leaveLocation(`${getCurrentLocation().name} を出た。`);
        return;
    }

    if (object.type === 'shop') {
        openShopMenu();
        return;
    }

    if (object.type === 'inn') {
        restByLocation(object.meta?.free === true);
        return;
    }

    if (object.type === 'save') {
        saveGameFromLocation();
        return;
    }

    if (object.type === 'guild') {
        recruitCurrentTownMember();
        return;
    }

    if (object.type === 'throne') {
        setLocationMessage('王は「四天王を討伐し、勇者の剣で魔王を倒せ」と告げた。');
        renderLocation();
        return;
    }

    if (object.type === 'chest') {
        openLocationChest(object);
        return;
    }

    if (object.type === 'encounter') {
        startLocationEncounter();
        return;
    }

    if (object.type === 'boss') {
        startLocationBoss();
        return;
    }

    if (object.type === 'trial') {
        startElfTrial();
        return;
    }

    if (object.type === 'npc') {
        setLocationMessage(object.meta?.text || '旅の無事を祈っている。');
        renderLocation();
    }
}

function openShopMenu() {
    openLocationMenu('道具屋', [
        {
            label: `ポーションを買う (${itemMaster.ポーション.buy}G)`,
            action: () => {
                buyItem('ポーション');
                openShopMenu();
            },
        },
        {
            label: `エーテルを買う (${itemMaster.エーテル.buy}G)`,
            action: () => {
                buyItem('エーテル');
                openShopMenu();
            },
        },
        {
            label: `ハイポーションを買う (${itemMaster.ハイポーション.buy}G)`,
            action: () => {
                buyItem('ハイポーション');
                openShopMenu();
            },
        },
        {
            label: `ポーションを売る (${itemMaster.ポーション.sell}G)`,
            action: () => {
                sellItem('ポーション');
                openShopMenu();
            },
            disabled: getItemCount('ポーション') <= 0,
        },
        {
            label: `エーテルを売る (${itemMaster.エーテル.sell}G)`,
            action: () => {
                sellItem('エーテル');
                openShopMenu();
            },
            disabled: getItemCount('エーテル') <= 0,
        },
        {
            label: `ハイポーションを売る (${itemMaster.ハイポーション.sell}G)`,
            action: () => {
                sellItem('ハイポーション');
                openShopMenu();
            },
            disabled: getItemCount('ハイポーション') <= 0,
        },
        { label: '店を出る', action: closeLocationMenu },
    ]);
}

function openLocationMenu(title, options) {
    state.location.mode = 'menu';
    state.location.menuTitle = title;
    state.location.menuOptions = options;
    state.location.menuIndex = 0;
    renderLocation();
}

function closeLocationMenu() {
    state.location.mode = 'explore';
    state.location.menuTitle = '行動';
    state.location.menuOptions = [];
    state.location.menuIndex = 0;
    renderLocation();
}

function moveLocationMenu(step) {
    const options = state.location.menuOptions;
    if (options.length === 0) return;
    const len = options.length;
    state.location.menuIndex = (state.location.menuIndex + step + len) % len;
    renderLocation();
}

function executeLocationMenu() {
    const option = state.location.menuOptions[state.location.menuIndex];
    if (!option) return;
    if (option.disabled) {
        setLocationMessage('その選択は実行できない。');
        renderLocation();
        return;
    }
    option.action();
}

function buyItem(itemName) {
    const item = itemMaster[itemName];
    if (!item) return;
    if (state.player.gold < item.buy) {
        setLocationMessage('ゴールドが足りない。');
        return;
    }

    state.player.gold -= item.buy;
    addItem(itemName, 1);
    setLocationMessage(`${itemName} を購入した。`);
}

function sellItem(itemName) {
    const item = itemMaster[itemName];
    if (!item) return;
    if (getItemCount(itemName) <= 0) {
        setLocationMessage(`${itemName} を持っていない。`);
        return;
    }

    removeItem(itemName, 1);
    state.player.gold += item.sell;
    setLocationMessage(`${itemName} を売却した。`);
}

function restByLocation(free = false) {
    if (!free && state.player.gold < 20) {
        setLocationMessage('宿代 20G が足りない。');
        renderLocation();
        return;
    }

    if (!free) {
        state.player.gold -= 20;
    }
    state.player.hp = state.player.maxHp;
    setLocationMessage(free ? '城で休み、HPが全回復した。' : '宿で休み、HPが全回復した。');
    renderLocation();
}

function recruitCurrentTownMember() {
    const location = getCurrentLocation();
    const recruit = towns[location.id]?.recruit;
    if (!recruit) {
        setLocationMessage('この街では仲間募集は行っていない。');
        renderLocation();
        return;
    }

    if (state.story.recruited.includes(recruit)) {
        setLocationMessage(`${recruit} はすでに仲間だ。`);
        renderLocation();
        return;
    }

    state.story.recruited.push(recruit);
    state.player.party.push(recruit);
    setLocationMessage(`${recruit} が仲間になった。`);
    renderLocation();
}

function saveGameFromLocation() {
    const location = getCurrentLocation();
    state.savePoint = createSnapshot(`${location.name} のセーブ`);
    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
            snapshot: state.savePoint,
            savedAt: new Date().toISOString(),
        })
    );
    setLocationMessage('冒険の記録をセーブした。');
    renderLocation();
}

function openLocationChest(object) {
    const location = getCurrentLocation();
    const progress = getProgress(location.id);
    const chestId = object.meta?.chestId;
    if (!chestId) {
        setLocationMessage('宝箱は空だった。');
        renderLocation();
        return;
    }

    if (progress.openedChestIds.includes(chestId)) {
        setLocationMessage('この宝箱はすでに開いている。');
        renderLocation();
        return;
    }

    let chestData = null;
    if (location.type === 'dungeon') {
        chestData = dungeonData[location.id].chests.find((chest) => chest.id === chestId);
    } else if (location.type === 'four-king') {
        chestData = fourKingData[location.id].chests.find((chest) => chest.id === chestId);
    }

    if (!chestData) {
        setLocationMessage('宝箱は空だった。');
        renderLocation();
        return;
    }

    progress.openedChestIds.push(chestId);
    grantReward(chestData.reward);
    object.active = false;
    setLocationMessage(chestData.text);

    if (location.type === 'dungeon' && Math.random() < 0.35) {
        const ambush = cloneObject(dungeonData[location.id].monsters[randomInt(0, dungeonData[location.id].monsters.length - 1)]);
        startBattle(ambush, {
            canRun: true,
            returnScreen: 'location',
            onWin: () => {
                setLocationMessage(`${ambush.name} の奇襲を退けた。`);
            },
        });
        return;
    }

    renderLocation();
}

function startLocationEncounter() {
    const location = getCurrentLocation();
    if (location.type === 'dungeon') {
        const enemy = cloneObject(dungeonData[location.id].monsters[randomInt(0, dungeonData[location.id].monsters.length - 1)]);
        startBattle(enemy, {
            canRun: true,
            returnScreen: 'location',
            onWin: () => setLocationMessage(`${enemy.name} を倒した。`),
        });
        return;
    }

    const enemy = createFieldEnemy();
    startBattle(enemy, {
        canRun: true,
        returnScreen: 'location',
        onWin: () => setLocationMessage(`${enemy.name} を倒した。`),
    });
}

function startLocationBoss() {
    const location = getCurrentLocation();

    if (location.type === 'dungeon') {
        challengeDungeonBoss(location.id);
        return;
    }

    if (location.type === 'four-king') {
        challengeFourKing(location.id);
        return;
    }

    if (location.type === 'demon') {
        challengeDemonKing();
    }
}

function challengeDungeonBoss(locationId) {
    const data = dungeonData[locationId];
    const progress = getProgress(locationId);

    if (progress.cleared) {
        setLocationMessage('このダンジョンのボスは討伐済みだ。');
        renderLocation();
        return;
    }

    const boss = cloneObject(data.boss);
    startBattle(boss, {
        canRun: false,
        returnScreen: 'location',
        onWin: () => {
            progress.cleared = true;
            data.rewards.forEach((reward) => grantReward(reward));
            const rewardText = data.rewards.map((reward) => reward.text).join('\n');
            setLocationMessage(`${boss.name} を討伐した！\n${rewardText}`);
        },
    });
}

function challengeFourKing(locationId) {
    const data = fourKingData[locationId];
    if (state.story.fourKingsCleared.includes(data.kingId)) {
        setLocationMessage('この四天王はすでに討伐済みだ。');
        renderLocation();
        return;
    }

    const boss = cloneObject(data.boss);
    startBattle(boss, {
        canRun: false,
        returnScreen: 'location',
        onWin: () => {
            state.story.fourKingsCleared.push(data.kingId);
            getProgress(locationId).cleared = true;
            addItem(`四天王の紋章(${data.kingId})`, 1);
            setLocationMessage(`${boss.name} を撃破した！ 四天王討伐 ${state.story.fourKingsCleared.length}/4`);
        },
    });
}

function startElfTrial() {
    if (state.player.heroSword) {
        setLocationMessage('すでに勇者の剣を授かっている。');
        renderLocation();
        return;
    }

    const required = ['氷の紋章', '雷の紋章', '炎の紋章'];
    const missing = required.filter((item) => getItemCount(item) <= 0);
    if (missing.length > 0) {
        setLocationMessage(`試練を受けるには ${missing.join(' / ')} が必要だ。`);
        renderLocation();
        return;
    }

    const guardian = {
        name: '古代守護者アルヴ',
        hp: 430,
        atkMin: 24,
        atkMax: 33,
        gold: 0,
        sprite: sprites.monsters.guardian,
    };

    startBattle(guardian, {
        canRun: false,
        returnScreen: 'location',
        onWin: () => {
            state.player.heroSword = true;
            addItem('勇者の剣', 1);
            setLocationMessage('試練を突破し、伝説の勇者の剣を授かった。');
        },
    });
}

function challengeDemonKing() {
    if (!hasAllFourKings()) {
        setLocationMessage('四天王の城をすべて攻略する必要がある。');
        renderLocation();
        return;
    }

    if (!state.player.heroSword) {
        setLocationMessage('勇者の剣がなければ魔王に刃は届かない。');
        renderLocation();
        return;
    }

    if (state.story.demonKingDefeated) {
        setLocationMessage('魔王はすでに討伐済みだ。');
        renderLocation();
        return;
    }

    const demonKing = {
        name: '魔王ゼロバグ',
        hp: 580,
        atkMin: 28,
        atkMax: 38,
        gold: 900,
        sprite: sprites.monsters.demon,
    };

    startBattle(demonKing, {
        canRun: false,
        returnScreen: 'location',
        onWin: () => {
            state.story.demonKingDefeated = true;
            setLocationMessage('魔王を討伐した！ 世界に平和が戻った。Legend of Code クリア！');
        },
    });
}

function startBattle(enemy, config) {
    state.battle.active = true;
    state.battle.optionIndex = 0;
    state.battle.enemy = {
        ...enemy,
        currentHp: enemy.hp,
    };
    state.battle.canRun = config.canRun;
    state.battle.returnScreen = config.returnScreen || 'world';
    state.battle.onWin = config.onWin;

    state.battleMessage = `${enemy.name} が あらわれた！`;
    showScreen('battle');
    renderBattle();
}

function executeBattleCommand(command) {
    const enemy = state.battle.enemy;
    if (!enemy) return;

    if (command === 'attack') {
        const damage = randomInt(20, 32) + state.player.party.length * 3 + (state.player.heroSword ? 14 : 0);
        enemy.currentHp = Math.max(0, enemy.currentHp - damage);
        state.battleMessage = `勇者パーティの攻撃！ ${enemy.name} に ${damage} ダメージ。`;

        if (enemy.currentHp <= 0) {
            handleBattleVictory();
            return;
        }
        enemyTurn();
        return;
    }

    if (command === 'skill') {
        if (getItemCount('エーテル') <= 0) {
            state.battleMessage = 'エーテルがない。ひっさつを使えない。';
            renderBattle();
            return;
        }

        removeItem('エーテル', 1);
        const damage = randomInt(58, 90) + state.player.party.length * 2 + (state.player.heroSword ? 10 : 0);
        enemy.currentHp = Math.max(0, enemy.currentHp - damage);
        state.battleMessage = `ひっさつ・コードブレイク！ ${damage} ダメージ。`;

        if (enemy.currentHp <= 0) {
            handleBattleVictory();
            return;
        }
        enemyTurn();
        return;
    }

    if (command === 'item') {
        if (getItemCount('ハイポーション') > 0) {
            removeItem('ハイポーション', 1);
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + 90);
            state.battleMessage = 'ハイポーションで HP を 90 回復。';
            enemyTurn();
            return;
        }

        if (getItemCount('ポーション') > 0) {
            removeItem('ポーション', 1);
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + 45);
            state.battleMessage = 'ポーションで HP を 45 回復。';
            enemyTurn();
            return;
        }

        state.battleMessage = '回復アイテムがない。';
        renderBattle();
        return;
    }

    if (command === 'run') {
        if (!state.battle.canRun) {
            state.battleMessage = 'この戦いからは逃げられない。';
            renderBattle();
            return;
        }

        if (Math.random() < 0.6) {
            state.battleMessage = 'うまく逃げ切った。';
            endBattle(false);
            return;
        }

        state.battleMessage = '逃走に失敗した。';
        enemyTurn();
    }
}

function enemyTurn() {
    const enemy = state.battle.enemy;
    if (!enemy || enemy.currentHp <= 0) return;

    const damage = randomInt(enemy.atkMin, enemy.atkMax);
    state.player.hp = Math.max(0, state.player.hp - damage);
    state.battleMessage += `\n${enemy.name} の反撃！ ${damage} ダメージ。`;

    if (state.player.hp <= 0) {
        handleBattleDefeat();
        return;
    }

    renderBattle();
}

function handleBattleVictory() {
    const enemy = state.battle.enemy;
    state.player.gold += enemy.gold || 0;
    state.battleMessage += `\n${enemy.name} を倒した！ ${enemy.gold || 0}G を獲得。`;

    if (typeof state.battle.onWin === 'function') {
        state.battle.onWin();
    }

    endBattle(true);
}

function handleBattleDefeat() {
    state.battleMessage += '\n勇者たちは倒れた...';

    if (state.savePoint) {
        applySnapshot(state.savePoint);
        state.worldMessage = '全滅したが、最後のセーブ地点から再開した。';
    } else {
        state.player.hp = state.player.maxHp;
        state.player.x = 4;
        state.player.y = 9;
        state.player.gold = Math.max(0, state.player.gold - 100);
        state.worldMessage = '倒れてしまった。旅立ちの街に戻された。';
    }

    state.location.id = null;
    state.location.scene = null;
    endBattle(false, true);
}

function endBattle(won, forcedWorld = false) {
    state.battle.active = false;

    if (forcedWorld) {
        showScreen('world');
        renderWorld();
        return;
    }

    if (state.battle.returnScreen === 'location' && state.location.id) {
        showScreen('location');
        renderLocation();
        return;
    }

    showScreen('world');
    if (!won && state.battleMessage === 'うまく逃げ切った。') {
        setWorldMessage('戦闘から離脱した。');
    }
    renderWorld();
}

function grantReward(reward) {
    if (!reward) return;

    if (reward.type === 'gold') {
        state.player.gold += reward.amount;
    }
    if (reward.type === 'item') {
        addItem(reward.item, reward.amount || 1);
    }
    if (reward.type === 'ship') {
        state.player.hasShip = true;
    }
}

function addItem(itemName, amount) {
    const current = state.player.inventory[itemName] || 0;
    state.player.inventory[itemName] = current + amount;
}

function removeItem(itemName, amount) {
    const current = state.player.inventory[itemName] || 0;
    state.player.inventory[itemName] = Math.max(0, current - amount);
}

function getItemCount(itemName) {
    return state.player.inventory[itemName] || 0;
}

function hasAllFourKings() {
    const required = ['west', 'north', 'east', 'south'];
    return required.every((id) => state.story.fourKingsCleared.includes(id));
}

function buildLocationScene(location) {
    if (location.type === 'town') return buildTownScene(location);
    if (location.type === 'castle') return buildCastleScene(location);
    if (location.type === 'dungeon') return buildDungeonScene(location);
    if (location.type === 'four-king') return buildFourKingScene(location);
    if (location.type === 'elf') return buildElfScene();
    if (location.type === 'demon') return buildDemonScene();
    return buildTownScene(location);
}

function buildTownScene(location) {
    const width = 16;
    const height = 12;
    const tiles = createTileGrid(width, height, 'floor-town');
    surroundWalls(tiles);

    for (let x = 2; x <= 13; x += 1) {
        tiles[2][x] = 'wall';
    }
    for (let y = 3; y <= 9; y += 1) {
        tiles[y][1] = 'water';
    }

    const recruitName = towns[location.id]?.recruit || null;
    const objects = [
        { id: 'shop', type: 'shop', x: 4, y: 4, label: '道具屋で売買する', active: true },
        { id: 'inn', type: 'inn', x: 7, y: 4, label: '宿で休む (20G)', active: true, meta: { free: false } },
        { id: 'guild', type: 'guild', x: 10, y: 4, label: recruitName ? `${recruitName} に会う` : 'ギルドを調べる', active: true },
        { id: 'save', type: 'save', x: 13, y: 4, label: 'セーブ結晶を使う', active: true },
        { id: 'npc', type: 'npc', x: 12, y: 8, label: '住人と話す', active: true, meta: { text: '四天王の城は各大陸の端にあるらしい。' } },
        { id: 'exit', type: 'exit', x: 8, y: 10, label: '街を出る', active: true },
    ];

    return {
        width,
        height,
        tiles,
        start: { x: 8, y: 10 },
        objects,
    };
}

function buildCastleScene() {
    const width = 16;
    const height = 12;
    const tiles = createTileGrid(width, height, 'floor-castle');
    surroundWalls(tiles);

    for (let y = 2; y <= 9; y += 1) {
        tiles[y][5] = 'wall';
        tiles[y][10] = 'wall';
    }
    for (let x = 6; x <= 9; x += 1) {
        tiles[4][x] = 'wall';
    }

    const objects = [
        { id: 'throne', type: 'throne', x: 8, y: 2, label: '王に謁見する', active: true },
        { id: 'inn', type: 'inn', x: 3, y: 8, label: '城で休む (無料)', active: true, meta: { free: true } },
        { id: 'save', type: 'save', x: 13, y: 8, label: 'セーブ結晶を使う', active: true },
        { id: 'exit', type: 'exit', x: 8, y: 10, label: '城を出る', active: true },
    ];

    return {
        width,
        height,
        tiles,
        start: { x: 8, y: 10 },
        objects,
    };
}

function buildDungeonScene(location) {
    const width = 16;
    const height = 12;
    const tiles = createTileGrid(width, height, 'floor-dungeon');
    surroundWalls(tiles);

    for (let x = 3; x <= 12; x += 1) {
        tiles[6][x] = 'wall';
    }
    tiles[6][8] = 'floor-dungeon';
    tiles[6][9] = 'floor-dungeon';
    for (let y = 2; y <= 8; y += 1) {
        tiles[y][6] = 'wall';
        tiles[y][11] = 'wall';
    }

    const progress = getProgress(location.id);
    const dungeon = dungeonData[location.id];
    const objects = [
        { id: 'exit', type: 'exit', x: 2, y: 10, label: 'ダンジョンを出る', active: true },
        { id: 'enc1', type: 'encounter', x: 8, y: 8, label: 'モンスターの気配を追う', active: true },
        { id: 'enc2', type: 'encounter', x: 13, y: 9, label: 'モンスターの気配を追う', active: true },
        {
            id: 'boss',
            type: 'boss',
            x: 13,
            y: 2,
            label: progress.cleared ? '討伐済みの祭壇を調べる' : 'ボスに挑む',
            active: true,
        },
    ];

    dungeon.chests.forEach((chest) => {
        objects.push({
            id: `chest-${chest.id}`,
            type: 'chest',
            x: chest.x,
            y: chest.y,
            label: '宝箱を開ける',
            active: !progress.openedChestIds.includes(chest.id),
            meta: { chestId: chest.id },
        });
    });

    return {
        width,
        height,
        tiles,
        start: { x: 2, y: 10 },
        objects,
    };
}

function buildFourKingScene(location) {
    const width = 16;
    const height = 12;
    const tiles = createTileGrid(width, height, 'floor-castle');
    surroundWalls(tiles);

    for (let x = 2; x <= 13; x += 1) {
        tiles[5][x] = 'wall';
    }
    tiles[5][8] = 'floor-castle';

    const data = fourKingData[location.id];
    const progress = getProgress(location.id);
    const cleared = state.story.fourKingsCleared.includes(data.kingId);

    const objects = [
        { id: 'exit', type: 'exit', x: 8, y: 10, label: '城を出る', active: true },
        { id: 'save', type: 'save', x: 2, y: 9, label: 'セーブ結晶を使う', active: true },
        { id: 'boss', type: 'boss', x: 8, y: 2, label: cleared ? '四天王は討伐済み' : '四天王に挑む', active: true },
    ];

    data.chests.forEach((chest) => {
        objects.push({
            id: `chest-${chest.id}`,
            type: 'chest',
            x: chest.x,
            y: chest.y,
            label: '宝物庫を開ける',
            active: !progress.openedChestIds.includes(chest.id),
            meta: { chestId: chest.id },
        });
    });

    return {
        width,
        height,
        tiles,
        start: { x: 8, y: 10 },
        objects,
    };
}

function buildElfScene() {
    const width = 16;
    const height = 12;
    const tiles = createTileGrid(width, height, 'floor-elf');
    surroundWalls(tiles);

    for (let x = 2; x <= 13; x += 1) {
        tiles[2][x] = 'wall';
    }

    const objects = [
        { id: 'trial', type: 'trial', x: 8, y: 4, label: '伝説の試練に挑む', active: true },
        { id: 'save', type: 'save', x: 13, y: 8, label: 'セーブ結晶を使う', active: true },
        { id: 'npc', type: 'npc', x: 5, y: 8, label: 'エルフ長老と話す', active: true, meta: { text: '紋章を3つ集めれば勇者の剣の試練を受けられる。' } },
        { id: 'exit', type: 'exit', x: 8, y: 10, label: '里を出る', active: true },
    ];

    return {
        width,
        height,
        tiles,
        start: { x: 8, y: 10 },
        objects,
    };
}

function buildDemonScene() {
    const width = 16;
    const height = 12;
    const tiles = createTileGrid(width, height, 'floor-demon');
    surroundWalls(tiles);

    for (let x = 2; x <= 13; x += 1) {
        tiles[3][x] = 'wall';
    }
    tiles[3][8] = 'floor-demon';

    const objects = [
        { id: 'boss', type: 'boss', x: 8, y: 2, label: '魔王に挑む', active: true },
        { id: 'save', type: 'save', x: 13, y: 9, label: 'セーブ結晶を使う', active: true },
        { id: 'exit', type: 'exit', x: 8, y: 10, label: '城を出る', active: true },
    ];

    return {
        width,
        height,
        tiles,
        start: { x: 8, y: 10 },
        objects,
    };
}

function createTileGrid(width, height, fill) {
    return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

function surroundWalls(tiles) {
    const h = tiles.length;
    const w = tiles[0].length;

    for (let x = 0; x < w; x += 1) {
        tiles[0][x] = 'wall';
        tiles[h - 1][x] = 'wall';
    }
    for (let y = 0; y < h; y += 1) {
        tiles[y][0] = 'wall';
        tiles[y][w - 1] = 'wall';
    }
}

function getCurrentLocationObject() {
    const scene = state.location.scene;
    if (!scene) return null;

    return scene.objects.find(
        (obj) => obj.active && obj.x === state.location.playerX && obj.y === state.location.playerY
    ) || null;
}

function getProgress(locationId) {
    if (!state.story.locationProgress[locationId]) {
        state.story.locationProgress[locationId] = {
            openedChestIds: [],
            cleared: false,
        };
    }
    return state.story.locationProgress[locationId];
}

function showScreen(screenName) {
    state.screen = screenName;
    Object.entries(screens).forEach(([name, el]) => {
        el.classList.toggle('active', name === screenName);
    });
}

function renderWorld() {
    const fragment = document.createDocumentFragment();

    for (let y = 0; y < WORLD_HEIGHT; y += 1) {
        for (let x = 0; x < WORLD_WIDTH; x += 1) {
            const tile = document.createElement('div');
            const tileType = worldTiles[y][x];
            tile.className = `world-tile ${tileType}`;

            const location = getLocationAt(x, y);
            if (location) {
                tile.classList.add('location');
                tile.style.backgroundImage = `url(${worldIconByLocation(location)})`;
            }

            const trailIndex = state.player.trail.findIndex((pos) => pos.x === x && pos.y === y);
            if (trailIndex >= 0 && trailIndex <= 3) {
                const memberName = state.player.party[trailIndex + 1];
                if (memberName) {
                    tile.style.backgroundImage = `url(${memberSprite(memberName)})`;
                } else {
                    tile.style.backgroundImage = '';
                }
            }

            if (state.player.x === x && state.player.y === y) {
                tile.classList.add('player');
                tile.style.backgroundImage = '';
                if (worldTiles[y][x] === 'ocean') {
                    tile.classList.add('ship');
                }
            }

            fragment.appendChild(tile);
        }
    }

    worldMapEl.innerHTML = '';
    worldMapEl.appendChild(fragment);

    worldMessageEl.textContent = `${state.worldMessage}\n目的: ${getObjectiveText()}`;
    statusTextEl.textContent = `HP ${state.player.hp}/${state.player.maxHp}\nGOLD ${state.player.gold}G\n現在地 ${getCurrentContinentName()}\n船 ${state.player.hasShip ? 'あり' : 'なし'}\n勇者の剣 ${state.player.heroSword ? 'あり' : 'なし'}`;
    partyTextEl.textContent = state.player.party.join(' / ');
    inventoryTextEl.textContent = formatInventoryText();
}

function renderLocation() {
    const location = getCurrentLocation();
    const scene = state.location.scene;
    if (!location || !scene) return;

    locationTitleEl.textContent = `${location.name} (${location.continent})`;
    locationDescEl.textContent = `${location.description}\nワールドより拡大したスケールで散策中。`;

    locationMapEl.style.gridTemplateColumns = `repeat(${scene.width}, var(--loc-tile-size))`;
    locationMapEl.style.gridTemplateRows = `repeat(${scene.height}, var(--loc-tile-size))`;

    const objectMap = new Map();
    scene.objects.forEach((obj) => {
        if (obj.active) {
            objectMap.set(`${obj.x},${obj.y}`, obj);
        }
    });

    const fragment = document.createDocumentFragment();
    for (let y = 0; y < scene.height; y += 1) {
        for (let x = 0; x < scene.width; x += 1) {
            const tile = document.createElement('div');
            tile.classList.add('location-tile', scene.tiles[y][x]);

            const obj = objectMap.get(`${x},${y}`);
            if (obj) {
                tile.classList.add('entity', objectClassByType(obj.type));
            }

            if (state.location.playerX === x && state.location.playerY === y) {
                tile.classList.add('player');
            }

            fragment.appendChild(tile);
        }
    }

    locationMapEl.innerHTML = '';
    locationMapEl.appendChild(fragment);

    const standingObject = getCurrentLocationObject();
    state.location.hint = standingObject
        ? `Enter: ${standingObject.label}`
        : '矢印キーで散策。対象の上で Enter。Esc で外へ。';

    locationHintEl.textContent = state.location.hint;
    locationStatusEl.textContent = `HP ${state.player.hp}/${state.player.maxHp}\nGOLD ${state.player.gold}G\n四天王 ${state.story.fourKingsCleared.length}/4\n勇者の剣 ${state.player.heroSword ? 'あり' : 'なし'}`;
    locationPartyEl.textContent = `${state.player.party.join(' / ')}\n${formatInventoryText()}`;

    if (state.location.mode === 'menu') {
        locationMenuTitleEl.textContent = state.location.menuTitle;
        locationOptionsEl.innerHTML = state.location.menuOptions
            .map((option, index) => {
                const classes = [];
                if (index === state.location.menuIndex) classes.push('selected');
                if (option.disabled) classes.push('disabled');
                return `<li class="${classes.join(' ')}">${option.label}</li>`;
            })
            .join('');
    } else {
        locationMenuTitleEl.textContent = '探索操作';
        locationOptionsEl.innerHTML = [
            '<li>矢印キー: 移動</li>',
            '<li>Enter: 調べる/行動</li>',
            '<li>Esc: 外へ戻る</li>',
        ].join('');
    }

    locationMessageEl.textContent = state.location.message;
}

function renderBattle() {
    const enemy = state.battle.enemy;
    if (!enemy) return;

    battlePartyEl.innerHTML = state.player.party
        .map((member) => {
            const sprite = memberSprite(member);
            return `
                <div class="battle-member">
                    <img src="${sprite}" alt="${member}">
                    <p>${member}</p>
                </div>
            `;
        })
        .join('');

    enemyNameEl.textContent = enemy.name;
    enemySpriteEl.src = enemy.sprite || sprites.monsters.slime;
    enemyHpEl.textContent = `${enemy.currentHp}/${enemy.hp}`;
    battleStatusEl.textContent = `勇者パーティ HP ${state.player.hp}/${state.player.maxHp} | 仲間 ${state.player.party.length}人 | GOLD ${state.player.gold}G`;
    battleMessageEl.textContent = state.battleMessage;

    battleOptionEls.forEach((el, index) => {
        el.classList.toggle('selected', index === state.battle.optionIndex);
        if (el.dataset.cmd === 'run') {
            el.classList.toggle('disabled', !state.battle.canRun);
        }
    });
}

function worldIconByLocation(location) {
    if (location.type === 'town') return sprites.world.town;
    if (location.type === 'castle' || location.type === 'four-king') return sprites.world.castle;
    if (location.type === 'dungeon') return sprites.world.dungeon;
    if (location.type === 'elf') return sprites.world.elf;
    if (location.type === 'demon') return sprites.world.demon;
    return sprites.world.town;
}

function objectClassByType(type) {
    if (['shop', 'inn', 'guild', 'save', 'chest', 'throne', 'boss', 'exit', 'trial', 'npc'].includes(type)) {
        return type;
    }
    if (type === 'encounter') return 'boss';
    return 'npc';
}

function memberSprite(name) {
    return sprites.party[name] || sprites.party.勇者;
}

function getObjectiveText() {
    if (!state.player.hasShip) {
        return '潮風の洞窟を攻略して船を手に入れる。';
    }

    if (!state.player.heroSword) {
        return '氷/雷/炎の紋章を集め、エルフの里で勇者の剣を得る。';
    }

    if (!hasAllFourKings()) {
        return `四天王の城を攻略する (${state.story.fourKingsCleared.length}/4)`;
    }

    if (!state.story.demonKingDefeated) {
        return '魔王城で魔王を倒す。';
    }

    return '世界は平和になった。自由に冒険しよう。';
}

function getCurrentContinentName() {
    const { x, y } = state.player;
    const continent = continents.find((area) => area.contains(x, y));
    return continent ? continent.name : '大海原';
}

function getLocationAt(x, y) {
    return locationByCoord.get(`${x},${y}`) || null;
}

function getCurrentLocation() {
    return locations.find((loc) => loc.id === state.location.id) || null;
}

function formatInventoryText() {
    const entries = Object.entries(state.player.inventory)
        .filter(([, amount]) => amount > 0)
        .map(([name, amount]) => `${name} x${amount}`);

    if (entries.length === 0) return '所持アイテム: なし';
    return `所持アイテム:\n${entries.join('\n')}`;
}

function setWorldMessage(message) {
    state.worldMessage = message;
}

function setLocationMessage(message) {
    state.location.message = message;
}

function createSnapshot(label) {
    return {
        label,
        player: cloneObject(state.player),
        story: cloneObject(state.story),
        worldMessage: state.worldMessage,
    };
}

function applySnapshot(snapshot) {
    state.player = cloneObject(snapshot.player);
    state.story = cloneObject(snapshot.story);
    state.worldMessage = snapshot.worldMessage || 'セーブ地点から再開した。';
}

function tryLoadSavedGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    try {
        const parsed = JSON.parse(raw);
        if (!parsed.snapshot) return false;

        const shouldLoad = window.confirm('前回のセーブデータがあります。読み込みますか？');
        if (!shouldLoad) return false;

        applySnapshot(parsed.snapshot);
        state.savePoint = cloneObject(parsed.snapshot);
        state.worldMessage = 'セーブデータを読み込んだ。冒険を続けよう。';
        return true;
    } catch (error) {
        console.error('セーブ読み込み失敗', error);
        return false;
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cloneObject(value) {
    return JSON.parse(JSON.stringify(value));
}
