const STORAGE_KEY = 'barcodeFighterCollectionV1';
const MAX_COLLECTION = 40;
const GRAVITY = 0.48;
const GROUND_Y = 360;

const abilities = {
    sonicRush: {
        name: 'ソニックラッシュ',
        desc: '高速ダッシュで一気に間合いを詰める連撃。',
        cooldown: 3600,
        type: 'dash',
    },
    ironAegis: {
        name: 'アイアンイージス',
        desc: '短時間、防御を大きく引き上げる装甲展開。',
        cooldown: 5000,
        type: 'guard',
    },
    photonShot: {
        name: 'フォトンショット',
        desc: '遠距離へエネルギー弾を発射する。',
        cooldown: 4200,
        type: 'projectile',
    },
    meteorPress: {
        name: 'メテオプレス',
        desc: '跳躍から叩きつける範囲攻撃。',
        cooldown: 4800,
        type: 'slam',
    },
};

const fighterNames = {
    character: {
        first: ['雷迅', '剛牙', '蒼刃', '閃光', '紅蓮', '黒鋼', '翠嵐', '白夜'],
        last: ['レンジャー', 'バスター', 'キック', 'ストライカー', 'ブレイカー', 'ファング', 'クラッシャー', 'エース'],
    },
    monster: {
        first: ['ヴォイド', 'グリム', 'ネオ', 'バイオ', 'カオス', 'ヘル', 'ギガ', 'メタル'],
        last: ['ビースト', 'ワーム', 'ドラゴン', 'ハウンド', 'ゴーレム', 'スパイダー', 'マローダー', 'キマイラ'],
    },
};

const state = {
    detector: null,
    detectorBusy: false,
    cameraStream: null,
    cameraInterval: null,
    barcodeValue: '',
    barcodeFeatures: null,
    currentFighter: null,
    collection: [],
    activeLoop: false,
    battle: {
        running: false,
        phase: 'idle',
        phaseStartedAt: 0,
        lastTime: 0,
        keys: {},
        touch: {
            movePointerId: null,
            moveStartX: 0,
            moveStartY: 0,
            moveJumpTriggered: false,
            jumpKeyTimer: null,
            actionPointerId: null,
            actionStartX: 0,
            actionStartY: 0,
            lastTapAt: 0,
            singleTapTimer: null,
        },
        player: null,
        enemy: null,
        projectiles: [],
        effects: [],
        roundOver: false,
        winner: null,
    },
};

const el = {
    camera: document.getElementById('camera'),
    cameraPlaceholder: document.getElementById('camera-placeholder'),
    decodeCanvas: document.getElementById('decode-canvas'),
    startCamera: document.getElementById('start-camera'),
    stopCamera: document.getElementById('stop-camera'),
    fileInput: document.getElementById('file-input'),
    manualInput: document.getElementById('manual-input'),
    applyManual: document.getElementById('apply-manual'),
    detectorNote: document.getElementById('detector-note'),
    barcodeValue: document.getElementById('barcode-value'),
    featureSummary: document.getElementById('feature-summary'),
    generateBtn: document.getElementById('generate-btn'),
    saveBtn: document.getElementById('save-btn'),
    fightBtn: document.getElementById('fight-btn'),
    fighterName: document.getElementById('fighter-name'),
    fighterRank: document.getElementById('fighter-rank'),
    fighterType: document.getElementById('fighter-type'),
    fighterAbility: document.getElementById('fighter-ability'),
    statAttack: document.getElementById('stat-attack'),
    statDefense: document.getElementById('stat-defense'),
    statAgility: document.getElementById('stat-agility'),
    statHp: document.getElementById('stat-hp'),
    fighterDesc: document.getElementById('fighter-desc'),
    collectionList: document.getElementById('collection-list'),
    battleCanvas: document.getElementById('battle-canvas'),
    battleLog: document.getElementById('battle-log'),
    battleOverlay: document.getElementById('battle-overlay'),
    battleMainText: document.getElementById('battle-main-text'),
    battleSubText: document.getElementById('battle-sub-text'),
    battleWinnerBanner: document.getElementById('battle-winner-banner'),
    battleWinnerName: document.getElementById('battle-winner-name'),
    battleWinnerSide: document.getElementById('battle-winner-side'),
    moveZone: document.getElementById('move-zone'),
    actionZone: document.getElementById('action-zone'),
    playerHudName: document.getElementById('player-hud-name'),
    enemyHudName: document.getElementById('enemy-hud-name'),
    playerHpFill: document.getElementById('player-hp-fill'),
    enemyHpFill: document.getElementById('enemy-hp-fill'),
};

const battleCtx = el.battleCanvas.getContext('2d');
const BARCODE_FORMAT_HINTS = ['qr_code', 'data_matrix', 'aztec', 'pdf417', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'codabar'];
const QUAGGA_READERS = ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader', 'code_39_reader', 'codabar_reader', 'i2of5_reader', '2of5_reader', 'code_93_reader'];

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function hashString(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function mulberry32(seed) {
    let t = seed >>> 0;
    return function rand() {
        t += 0x6D2B79F5;
        let n = Math.imul(t ^ (t >>> 15), 1 | t);
        n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
        return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
}

function pick(list, rand) {
    return list[Math.floor(rand() * list.length)];
}

function formatDateTime(ts) {
    const d = new Date(ts);
    const pad = (v) => String(v).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function summarizeFeatures(features) {
    return `長さ${features.length} / 数字${Math.round(features.digitRatio * 100)}% / 英字${Math.round(features.letterRatio * 100)}% / 記号${Math.round(features.symbolRatio * 100)}% / ${features.productStyle}`;
}

function analyzeBarcode(value) {
    const length = value.length;
    const digits = (value.match(/[0-9]/g) || []).length;
    const letters = (value.match(/[a-zA-Z]/g) || []).length;
    const symbols = length - digits - letters;
    const unique = new Set(value).size;
    const digitRatio = length ? digits / length : 0;
    const letterRatio = length ? letters / length : 0;
    const symbolRatio = length ? symbols / length : 0;
    const isUrl = /^https?:\/\//i.test(value);
    const hasPackWord = /(eco|pro|max|plus|ultra|bio|premium|gold|lite)/i.test(value);

    let productStyle = '汎用コード';
    if (isUrl) {
        productStyle = 'リンク型商品';
    } else if (digitRatio >= 0.7) {
        productStyle = '数値管理型商品';
    } else if (letterRatio >= 0.5) {
        productStyle = 'ブランド訴求型商品';
    } else if (symbolRatio >= 0.18) {
        productStyle = '複合管理型商品';
    }

    return {
        length,
        digits,
        letters,
        symbols,
        unique,
        digitRatio,
        letterRatio,
        symbolRatio,
        isUrl,
        hasPackWord,
        productStyle,
    };
}

function pickAbility(features, rand) {
    const order = [];
    if (features.digitRatio > 0.66) {
        order.push('ironAegis', 'meteorPress', 'sonicRush');
    }
    if (features.letterRatio > 0.52) {
        order.push('sonicRush', 'photonShot');
    }
    if (features.symbolRatio > 0.15 || features.isUrl) {
        order.push('photonShot', 'meteorPress');
    }
    if (features.hasPackWord) {
        order.push('sonicRush');
    }
    order.push('sonicRush', 'ironAegis', 'photonShot', 'meteorPress');

    return order[Math.floor(rand() * order.length)];
}

function calcRank(total) {
    if (total >= 300) {
        return 'S';
    }
    if (total >= 265) {
        return 'A';
    }
    if (total >= 230) {
        return 'B';
    }
    if (total >= 200) {
        return 'C';
    }
    return 'D';
}

function generateFighterFromBarcode(barcode, options = {}) {
    const nonce = options.nonce || `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const features = analyzeBarcode(barcode);
    const seed = hashString(`${barcode}|${nonce}`);
    const rand = mulberry32(seed);

    const monsterBias = features.symbolRatio + (features.isUrl ? 0.13 : 0) + (features.unique / Math.max(1, features.length)) * 0.2;
    const type = rand() + monsterBias > 0.9 ? 'monster' : 'character';

    const attack = clamp(Math.round(46 + features.letterRatio * 28 + rand() * 30 + (features.hasPackWord ? 4 : 0)), 34, 99);
    const defense = clamp(Math.round(42 + features.digitRatio * 30 + rand() * 30 + (features.length > 30 ? 6 : 0)), 30, 99);
    const agility = clamp(Math.round(40 + (1 - features.digitRatio) * 18 + features.symbolRatio * 24 + rand() * 32), 28, 99);
    const hp = clamp(Math.round(180 + defense * 2 + (features.length * 0.8) + rand() * 42), 180, 360);

    const abilityKey = pickAbility(features, rand);
    const ability = abilities[abilityKey];

    const naming = fighterNames[type];
    const name = `${pick(naming.first, rand)}${pick(naming.last, rand)}`;
    const hue = hashString(barcode) % 360;
    const rank = calcRank(attack + defense + agility + Math.round(hp / 3));

    const desc = `${features.productStyle}の情報密度が反映され、${ability.name}を獲得。${type === 'monster' ? '攻撃は荒いが爆発力が高い。' : 'バランス重視で安定して戦える。'}`;

    return {
        id: `fighter-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        barcode,
        createdAt: Date.now(),
        type,
        name,
        rank,
        color: `hsl(${hue} 80% 60%)`,
        abilityKey,
        abilityName: ability.name,
        abilityDesc: ability.desc,
        stats: {
            attack,
            defense,
            agility,
            hp,
        },
        features,
        desc,
    };
}

function displayFighter(fighter) {
    el.fighterName.textContent = fighter.name;
    el.fighterRank.textContent = `RANK ${fighter.rank}`;
    el.fighterType.textContent = `タイプ: ${fighter.type === 'monster' ? 'モンスター' : 'キャラクター'}`;
    el.fighterAbility.textContent = `特殊能力: ${fighter.abilityName}`;
    el.statAttack.textContent = String(fighter.stats.attack);
    el.statDefense.textContent = String(fighter.stats.defense);
    el.statAgility.textContent = String(fighter.stats.agility);
    el.statHp.textContent = String(fighter.stats.hp);
    el.fighterDesc.textContent = fighter.desc;
}

function setBarcodeValue(value, sourceLabel = '取得') {
    const normalized = value.trim();
    if (!normalized) {
        return;
    }
    state.barcodeValue = normalized;
    state.barcodeFeatures = analyzeBarcode(normalized);
    el.barcodeValue.textContent = `${normalized} (${sourceLabel})`;
    el.featureSummary.textContent = summarizeFeatures(state.barcodeFeatures);
    setBattleLog('バーコード情報を更新しました。ファイターを生成してください。');
}

function hasAnyDecoder() {
    return !!state.detector || typeof window.jsQR === 'function' || !!window.Quagga;
}

function getSourceSize(source) {
    if (source instanceof HTMLVideoElement) {
        return { width: source.videoWidth, height: source.videoHeight };
    }
    if (source instanceof HTMLCanvasElement) {
        return { width: source.width, height: source.height };
    }
    if (source instanceof HTMLImageElement) {
        return { width: source.naturalWidth || source.width, height: source.naturalHeight || source.height };
    }
    if (typeof source.width === 'number' && typeof source.height === 'number') {
        return { width: source.width, height: source.height };
    }
    return { width: 0, height: 0 };
}

function drawSourceToCanvas(source, options = {}) {
    const { rotate = 0, crop = null, maxSide = 1500 } = options;
    const size = getSourceSize(source);
    if (!size.width || !size.height) {
        return null;
    }

    let sx = 0;
    let sy = 0;
    let sw = size.width;
    let sh = size.height;

    if (crop) {
        sx = Math.max(0, Math.floor(size.width * crop.x));
        sy = Math.max(0, Math.floor(size.height * crop.y));
        sw = Math.max(4, Math.floor(size.width * crop.w));
        sh = Math.max(4, Math.floor(size.height * crop.h));
        if (sx + sw > size.width) {
            sw = size.width - sx;
        }
        if (sy + sh > size.height) {
            sh = size.height - sy;
        }
    }

    const scale = Math.min(1, maxSide / Math.max(sw, sh));
    const dw = Math.max(2, Math.floor(sw * scale));
    const dh = Math.max(2, Math.floor(sh * scale));
    const rotateNorm = ((rotate % 360) + 360) % 360;
    const quarter = rotateNorm === 90 || rotateNorm === 270;

    const canvas = document.createElement('canvas');
    canvas.width = quarter ? dh : dw;
    canvas.height = quarter ? dw : dh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotateNorm * Math.PI) / 180);
    ctx.drawImage(source, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    return canvas;
}

function buildDecodeCandidates(source, options = {}) {
    const { deep = false } = options;
    const presets = deep
        ? [
            { label: 'full', crop: { x: 0, y: 0, w: 1, h: 1 }, rotations: [0, 90, 270, 180] },
            { label: 'center', crop: { x: 0.12, y: 0.12, w: 0.76, h: 0.76 }, rotations: [0, 90, 270] },
            { label: 'left', crop: { x: 0.02, y: 0.08, w: 0.64, h: 0.84 }, rotations: [90, 270, 0] },
            { label: 'right', crop: { x: 0.34, y: 0.08, w: 0.64, h: 0.84 }, rotations: [90, 270, 0] },
            { label: 'midBand', crop: { x: 0.08, y: 0.24, w: 0.84, h: 0.56 }, rotations: [90, 270, 0] },
        ]
        : [
            { label: 'full', crop: { x: 0, y: 0, w: 1, h: 1 }, rotations: [0, 90, 270] },
            { label: 'center', crop: { x: 0.14, y: 0.14, w: 0.72, h: 0.72 }, rotations: [90, 270] },
        ];

    const candidates = [];
    for (const preset of presets) {
        for (const rotate of preset.rotations) {
            const canvas = drawSourceToCanvas(source, { rotate, crop: preset.crop, maxSide: deep ? 1700 : 1280 });
            if (canvas) {
                candidates.push({ label: `${preset.label}-${rotate}`, canvas });
            }
        }
    }
    return candidates;
}

function enhanceForLinearBarcode(inputCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = inputCanvas.width;
    canvas.height = inputCanvas.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(inputCanvas, 0, 0);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    const contrast = 1.85;
    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const boosted = clamp(Math.round((gray - 128) * contrast + 128), 0, 255);
        const mono = boosted > 142 ? 255 : 0;
        data[i] = mono;
        data[i + 1] = mono;
        data[i + 2] = mono;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
}

function detectWithJsQR(canvas) {
    if (typeof window.jsQR !== 'function') {
        return null;
    }

    const { width, height } = getSourceSize(canvas);
    if (!width || !height) {
        return null;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, width, height);
    let decoded = window.jsQR(imageData.data, width, height, { inversionAttempts: 'dontInvert' });
    if (!decoded) {
        decoded = window.jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' });
    }
    return decoded?.data || null;
}

function decodeWithQuagga(dataUrl, readers, locate) {
    if (!window.Quagga) {
        return Promise.resolve(null);
    }
    return new Promise((resolve) => {
        window.Quagga.decodeSingle(
            {
                src: dataUrl,
                numOfWorkers: 0,
                locate,
                inputStream: {
                    size: 1280,
                    singleChannel: false,
                },
                decoder: {
                    readers,
                    multiple: false,
                },
            },
            (result) => {
                resolve(result?.codeResult?.code || null);
            }
        );
    });
}

async function detectWithQuagga(canvas) {
    if (!window.Quagga) {
        return null;
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    let result = await decodeWithQuagga(dataUrl, QUAGGA_READERS, true);
    if (result) {
        return result;
    }
    result = await decodeWithQuagga(dataUrl, ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader'], false);
    if (result) {
        return result;
    }

    const boosted = enhanceForLinearBarcode(canvas);
    const boostedUrl = boosted.toDataURL('image/png');
    result = await decodeWithQuagga(boostedUrl, QUAGGA_READERS, true);
    if (result) {
        return result;
    }
    return decodeWithQuagga(boostedUrl, ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader'], false);
}

async function initDetector() {
    if ('BarcodeDetector' in window) {
        try {
            let formats = [...BARCODE_FORMAT_HINTS];
            if (typeof BarcodeDetector.getSupportedFormats === 'function') {
                const supported = await BarcodeDetector.getSupportedFormats();
                formats = formats.filter((f) => supported.includes(f));
            }
            state.detector = formats.length > 0 ? new BarcodeDetector({ formats }) : new BarcodeDetector();
            const enabled = ['BarcodeDetector', typeof window.jsQR === 'function' ? 'jsQR' : null, window.Quagga ? 'Quagga2' : null]
                .filter(Boolean)
                .join(' + ');
            el.detectorNote.textContent = `読取方式: ${enabled}`;
            return;
        } catch (error) {
            state.detector = null;
            const fallbackOnly = typeof window.jsQR === 'function' || !!window.Quagga;
            el.detectorNote.textContent = fallbackOnly
                ? `BarcodeDetector初期化失敗のためフォールバックで読取します: ${error.message}`
                : `読取初期化に失敗: ${error.message}`;
            return;
        }
    }

    if (typeof window.jsQR === 'function' || window.Quagga) {
        const fallback = [typeof window.jsQR === 'function' ? 'jsQR(2D)' : null, window.Quagga ? 'Quagga2(1D)' : null]
            .filter(Boolean)
            .join(' + ');
        el.detectorNote.textContent = `読取方式: ${fallback}（BarcodeDetector非対応のためフォールバック）`;
    } else {
        el.detectorNote.textContent = 'このブラウザでは自動読取が使えません。手動入力を使ってください。';
    }
}

async function detectFromSource(source, options = {}) {
    const { deep = false } = options;
    if (state.detectorBusy) {
        return null;
    }
    const sourceSize = getSourceSize(source);
    if (!sourceSize.width || !sourceSize.height) {
        return null;
    }

    state.detectorBusy = true;
    try {
        if (state.detector) {
            try {
                const result = await state.detector.detect(source);
                if (result && result.length > 0) {
                    return result[0].rawValue || '';
                }
            } catch (error) {
                // 続行してフォールバック
            }
        }

        const candidates = buildDecodeCandidates(source, { deep });

        if (state.detector) {
            for (const candidate of candidates) {
                try {
                    const result = await state.detector.detect(candidate.canvas);
                    if (result && result.length > 0) {
                        return result[0].rawValue || '';
                    }
                } catch (error) {
                    // 続行して他候補を試す
                }
            }
        }

        if (typeof window.jsQR === 'function') {
            for (const candidate of candidates) {
                const decoded = detectWithJsQR(candidate.canvas);
                if (decoded) {
                    return decoded;
                }
            }
        }

        if (window.Quagga) {
            for (const candidate of candidates) {
                const decoded = await detectWithQuagga(candidate.canvas);
                if (decoded) {
                    return decoded;
                }
            }
        }

        return null;
    } finally {
        state.detectorBusy = false;
    }
}

async function startCamera() {
    if (!hasAnyDecoder()) {
        setBattleLog('この環境では自動読取が使えません。手動入力を利用してください。');
        return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
        setBattleLog('このブラウザはカメラAPI未対応です。画像読取か手動入力を使ってください。');
        return;
    }
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        setBattleLog('カメラ読取はHTTPSまたはlocalhostでのみ利用できます。');
        return;
    }
    if (state.cameraStream) {
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
            audio: false,
        });
        state.cameraStream = stream;
        el.camera.srcObject = stream;
        await el.camera.play();
        el.camera.style.display = 'block';
        el.cameraPlaceholder.style.display = 'none';
        setBattleLog('カメラを開始しました。バーコードを映してください。');
        state.cameraInterval = window.setInterval(async () => {
            if (!state.cameraStream || el.camera.readyState < 2) {
                return;
            }
            const scanned = await detectFromSource(el.camera, { deep: false });
            if (scanned) {
                setBarcodeValue(scanned, 'カメラ');
                stopCamera();
            }
        }, 700);
    } catch (error) {
        setBattleLog(`カメラ起動に失敗: ${error.message}`);
    }
}

function stopCamera() {
    if (state.cameraInterval) {
        clearInterval(state.cameraInterval);
        state.cameraInterval = null;
    }
    if (state.cameraStream) {
        state.cameraStream.getTracks().forEach((track) => track.stop());
        state.cameraStream = null;
    }
    el.camera.srcObject = null;
    el.camera.style.display = 'none';
    el.cameraPlaceholder.style.display = 'grid';
}

async function drawFileToDecodeCanvas(file) {
    const canvas = el.decodeCanvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    try {
        const bitmap = await createImageBitmap(file);
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        ctx.drawImage(bitmap, 0, 0);
        return canvas;
    } catch (error) {
        const blobUrl = URL.createObjectURL(file);
        try {
            const img = await new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
                image.src = blobUrl;
            });
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            ctx.drawImage(img, 0, 0);
            return canvas;
        } finally {
            URL.revokeObjectURL(blobUrl);
        }
    }
}

async function decodeFromFile(file) {
    if (!file) {
        return;
    }
    if (!hasAnyDecoder()) {
        setBattleLog('画像読取は未対応です。手動入力でバーコード値を入力してください。');
        return;
    }

    try {
        const canvas = await drawFileToDecodeCanvas(file);
        const scanned = await detectFromSource(canvas, { deep: true });
        if (scanned) {
            setBarcodeValue(scanned, '画像');
        } else {
            setBattleLog('画像からバーコードを検出できませんでした。別画像か手動入力を試してください。');
        }
    } catch (error) {
        setBattleLog(`画像処理に失敗: ${error.message}`);
    }
}

function saveCollection() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.collection));
}

function loadCollection() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        state.collection = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(state.collection)) {
            state.collection = [];
        }
    } catch (error) {
        state.collection = [];
    }
    renderCollection();
}

function addCurrentToCollection() {
    if (!state.currentFighter) {
        setBattleLog('保存する前にファイターを生成してください。');
        return;
    }

    state.collection.unshift(state.currentFighter);
    if (state.collection.length > MAX_COLLECTION) {
        state.collection = state.collection.slice(0, MAX_COLLECTION);
    }
    saveCollection();
    renderCollection();
    setBattleLog(`${state.currentFighter.name}をコレクションに保存しました。`);
}

function renderCollection() {
    if (!state.collection.length) {
        el.collectionList.innerHTML = '<p class="mini">保存済みファイターはまだありません。</p>';
        return;
    }

    const html = state.collection
        .map((fighter) => {
            return `
                <article class="collection-item" data-id="${fighter.id}">
                    <h4>${fighter.name} <span class="mini">RANK ${fighter.rank}</span></h4>
                    <p class="mini">${fighter.type === 'monster' ? 'モンスター' : 'キャラクター'} / ${fighter.abilityName}</p>
                    <p class="mini">ATK ${fighter.stats.attack} | DEF ${fighter.stats.defense} | AGI ${fighter.stats.agility}</p>
                    <p class="mini">登録: ${formatDateTime(fighter.createdAt)}</p>
                    <div class="collection-actions">
                        <button type="button" class="ghost" data-action="select">再表示</button>
                        <button type="button" data-action="fight">出撃</button>
                        <button type="button" class="ghost" data-action="delete">削除</button>
                    </div>
                </article>
            `;
        })
        .join('');

    el.collectionList.innerHTML = html;
}

function selectCollectionFighter(id, autoFight = false) {
    const found = state.collection.find((fighter) => fighter.id === id);
    if (!found) {
        return;
    }
    state.currentFighter = found;
    state.barcodeValue = found.barcode;
    state.barcodeFeatures = found.features || analyzeBarcode(found.barcode);
    el.barcodeValue.textContent = `${found.barcode} (コレクション)`;
    el.featureSummary.textContent = summarizeFeatures(state.barcodeFeatures);
    displayFighter(found);
    if (autoFight) {
        launchBattle(found);
    } else {
        setBattleLog(`${found.name}を選択しました。`);
    }
}

function deleteCollectionFighter(id) {
    const before = state.collection.length;
    state.collection = state.collection.filter((fighter) => fighter.id !== id);
    if (state.collection.length === before) {
        return;
    }
    saveCollection();
    renderCollection();
    setBattleLog('コレクションから削除しました。');
}

function createBattleEntity(fighter, x, dir, isEnemy) {
    return {
        fighter,
        name: fighter.name,
        color: fighter.color,
        x,
        y: GROUND_Y - 118,
        width: 60,
        height: 118,
        vx: 0,
        vy: 0,
        dir,
        hp: fighter.stats.hp,
        maxHp: fighter.stats.hp,
        attack: fighter.stats.attack,
        defense: fighter.stats.defense,
        agility: fighter.stats.agility,
        speed: 2.2 + fighter.stats.agility / 38,
        jumpPower: 10 + fighter.stats.agility / 16,
        onGround: true,
        attackCd: 0,
        specialCd: 0,
        hitFlash: 0,
        punchLock: 0,
        buffUntil: 0,
        shieldUntil: 0,
        slamReady: false,
        isEnemy,
    };
}

function createRivalFromPlayer(playerFighter) {
    const reverse = playerFighter.barcode.split('').reverse().join('');
    const rival = generateFighterFromBarcode(`${reverse}:${Math.floor(Math.random() * 9999)}`);
    rival.name = `CPU ${rival.name}`;
    return rival;
}

function launchBattle(fighter) {
    const rival = createRivalFromPlayer(fighter);
    resetTouchBattleInput();
    state.battle.player = createBattleEntity(fighter, 230, 1, false);
    state.battle.enemy = createBattleEntity(rival, 670, -1, true);
    state.battle.projectiles = [];
    state.battle.effects = [];
    state.battle.roundOver = false;
    state.battle.winner = null;
    state.battle.running = true;
    state.battle.phase = 'intro';
    state.battle.phaseStartedAt = performance.now();
    state.battle.lastTime = 0;

    el.playerHudName.textContent = fighter.name;
    el.enemyHudName.textContent = rival.name;
    updateHpHud();
    hideWinnerBanner();
    setBattleOverlay('ROUND 1', `${fighter.name} vs ${rival.name}`, 'round');
    setBattleLog(`${fighter.name} 出撃。相手は ${rival.name}。ROUND 1 開始。`);

    if (!state.activeLoop) {
        state.activeLoop = true;
        requestAnimationFrame(gameLoop);
    }
}

function setBattleLog(text) {
    el.battleLog.textContent = text;
}

function isBattleInteractive() {
    return state.battle.running && state.battle.phase === 'fight' && !state.battle.roundOver;
}

function setBattleOverlay(mainText = '', subText = '', phase = '') {
    if (!el.battleOverlay || !el.battleMainText || !el.battleSubText) {
        return;
    }
    const hasText = !!mainText;
    el.battleMainText.textContent = mainText;
    el.battleSubText.textContent = subText;
    el.battleOverlay.classList.toggle('active', hasText);
    el.battleOverlay.classList.remove('phase-round', 'phase-ready', 'phase-fight', 'phase-ko', 'phase-result');
    if (phase) {
        el.battleOverlay.classList.add(`phase-${phase}`);
    }
}

function showWinnerBanner(winner) {
    if (!el.battleWinnerBanner || !el.battleWinnerName || !el.battleWinnerSide || !winner) {
        return;
    }
    el.battleWinnerName.textContent = winner.name;
    el.battleWinnerSide.textContent = winner.isPlayer ? 'YOU WIN' : 'YOU LOSE';
    el.battleWinnerSide.style.color = winner.isPlayer ? '#9bffbf' : '#ff9db7';
    el.battleWinnerBanner.classList.add('visible');
}

function hideWinnerBanner() {
    if (!el.battleWinnerBanner) {
        return;
    }
    el.battleWinnerBanner.classList.remove('visible');
}

function applyDamage(attacker, defender, baseDamage, knockback = 4.2) {
    const now = performance.now();
    const atkBuff = attacker.buffUntil > now ? 1.22 : 1;
    const defenseBuff = defender.shieldUntil > now ? 1.45 : 1;
    const damage = Math.max(2, Math.round((baseDamage * atkBuff) * (100 / (100 + defender.defense * defenseBuff * 0.75))));

    defender.hp = clamp(defender.hp - damage, 0, defender.maxHp);
    defender.vx += knockback * attacker.dir;
    defender.hitFlash = 8;

    if (defender.hp <= 0 && !state.battle.roundOver) {
        state.battle.roundOver = true;
        state.battle.phase = 'ko';
        state.battle.phaseStartedAt = now;
        state.battle.winner = {
            name: attacker.name,
            isPlayer: attacker === state.battle.player,
        };
        state.battle.projectiles = [];
        attacker.vx *= 0.45;
        defender.vx *= 0.3;
        resetTouchBattleInput();
        setBattleOverlay('K.O.', '', 'ko');
        setBattleLog(`K.O. ${attacker.name} の勝利。`);
    }
}

function isFacing(attacker, defender) {
    return (attacker.dir > 0 && attacker.x <= defender.x) || (attacker.dir < 0 && attacker.x >= defender.x);
}

function nudgeTowardTarget(attacker, defender, scale = 1) {
    const dx = (defender.x + defender.width / 2) - (attacker.x + attacker.width / 2);
    if (Math.abs(dx) < 2) {
        return;
    }
    attacker.dir = dx >= 0 ? 1 : -1;
    attacker.vx += attacker.dir * (2.8 + attacker.speed * 0.95 * scale);
}

function tryAttack(attacker, defender, kind) {
    if (!state.battle.running || attacker.attackCd > 0) {
        return;
    }

    const distance = Math.abs((attacker.x + attacker.width / 2) - (defender.x + defender.width / 2));
    const inRange = kind === 'kick' ? distance < 108 : distance < 84;
    if (!isFacing(attacker, defender)) {
        attacker.dir = attacker.x <= defender.x ? 1 : -1;
    }

    if (!inRange) {
        if (distance < 240) {
            nudgeTowardTarget(attacker, defender, kind === 'kick' ? 1.25 : 1);
            attacker.attackCd = 7;
        } else {
            attacker.attackCd = 10;
        }
        return;
    }

    const base = kind === 'kick' ? attacker.attack * 0.32 + 14 : attacker.attack * 0.26 + 10;
    const push = kind === 'kick' ? 6.2 : 4.2;
    applyDamage(attacker, defender, base, push);
    attacker.attackCd = kind === 'kick' ? 20 : 15;
    attacker.punchLock = 8;
}

function useSpecial(attacker, defender) {
    if (!state.battle.running || attacker.specialCd > 0) {
        return;
    }

    const ability = abilities[attacker.fighter.abilityKey];
    const now = performance.now();

    if (!ability) {
        return;
    }

    if (ability.type === 'dash') {
        attacker.vx += attacker.dir * 13;
        const dist = Math.abs((attacker.x + attacker.width / 2) - (defender.x + defender.width / 2));
        if (dist < 140) {
            applyDamage(attacker, defender, attacker.attack * 0.45 + 18, 7.2);
        }
    }

    if (ability.type === 'guard') {
        attacker.buffUntil = now + 2600;
        attacker.shieldUntil = now + 2600;
    }

    if (ability.type === 'projectile') {
        state.battle.projectiles.push({
            owner: attacker,
            x: attacker.x + attacker.width / 2 + attacker.dir * 26,
            y: attacker.y + attacker.height * 0.45,
            vx: attacker.dir * 8.2,
            radius: 8,
            damage: attacker.attack * 0.34 + 12,
            life: 90,
            color: attacker.color,
        });
    }

    if (ability.type === 'slam') {
        if (attacker.onGround) {
            attacker.vy = -13;
            attacker.onGround = false;
            attacker.slamReady = true;
        }
    }

    attacker.specialCd = Math.round(ability.cooldown / 16);
}

function updateEntity(entity, dt) {
    entity.attackCd = Math.max(0, entity.attackCd - dt);
    entity.specialCd = Math.max(0, entity.specialCd - dt);
    entity.hitFlash = Math.max(0, entity.hitFlash - dt);
    entity.punchLock = Math.max(0, entity.punchLock - dt);

    entity.vy += GRAVITY * dt;
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;
    entity.vx *= 0.86;

    if (entity.y + entity.height >= GROUND_Y) {
        entity.y = GROUND_Y - entity.height;
        if (!entity.onGround && entity.slamReady) {
            const foe = entity.isEnemy ? state.battle.player : state.battle.enemy;
            const dist = Math.abs((entity.x + entity.width / 2) - (foe.x + foe.width / 2));
            if (dist < 130) {
                applyDamage(entity, foe, entity.attack * 0.4 + 20, 7.8);
            }
        }
        entity.slamReady = false;
        entity.vy = 0;
        entity.onGround = true;
    }

    entity.x = clamp(entity.x, 24, el.battleCanvas.width - entity.width - 24);
}

function handlePlayerInput(player) {
    const left = !!state.battle.keys.KeyA;
    const right = !!state.battle.keys.KeyD;
    const jump = !!state.battle.keys.KeyW;
    const enemy = state.battle.enemy;

    if (left && !right) {
        player.vx -= player.speed * 0.58;
        player.dir = -1;
    }
    if (right && !left) {
        player.vx += player.speed * 0.58;
        player.dir = 1;
    }

    if (jump && player.onGround) {
        player.vy = -player.jumpPower;
        player.onGround = false;
    }

    if (enemy) {
        const dx = (enemy.x + enemy.width / 2) - (player.x + player.width / 2);
        if (Math.abs(dx) > 10) {
            player.dir = dx > 0 ? 1 : -1;
        }
    }
}

function handleEnemyAi(enemy, player, dt) {
    if (!state.battle.running) {
        return;
    }

    const dx = (player.x + player.width / 2) - (enemy.x + enemy.width / 2);
    const distance = Math.abs(dx);
    enemy.dir = dx >= 0 ? 1 : -1;

    if (distance > 92) {
        enemy.vx += (dx > 0 ? 1 : -1) * enemy.speed * 0.5 * dt;
    }

    if (distance < 125 && enemy.attackCd <= 0) {
        if (Math.random() < 0.6) {
            tryAttack(enemy, player, 'punch');
        } else {
            tryAttack(enemy, player, 'kick');
        }
    }

    if (distance < 230 && enemy.specialCd <= 0 && Math.random() < 0.02 * dt) {
        useSpecial(enemy, player);
    }

    if (enemy.onGround && Math.random() < 0.005 * dt && distance > 140) {
        enemy.vy = -enemy.jumpPower * 0.86;
        enemy.onGround = false;
    }
}

function updateProjectiles(dt) {
    const player = state.battle.player;
    const enemy = state.battle.enemy;

    state.battle.projectiles = state.battle.projectiles.filter((shot) => {
        shot.x += shot.vx * dt;
        shot.life -= dt;
        const target = shot.owner === player ? enemy : player;
        if (!target) {
            return false;
        }

        const withinX = shot.x > target.x && shot.x < target.x + target.width;
        const withinY = shot.y > target.y && shot.y < target.y + target.height;
        if (withinX && withinY) {
            applyDamage(shot.owner, target, shot.damage, 3.4);
            return false;
        }

        return shot.life > 0 && shot.x > 0 && shot.x < el.battleCanvas.width;
    });
}

function updateHpHud() {
    const player = state.battle.player;
    const enemy = state.battle.enemy;
    if (!player || !enemy) {
        el.playerHpFill.style.width = '100%';
        el.enemyHpFill.style.width = '100%';
        return;
    }

    const playerRatio = (player.hp / player.maxHp) * 100;
    const enemyRatio = (enemy.hp / enemy.maxHp) * 100;
    el.playerHpFill.style.width = `${clamp(playerRatio, 0, 100)}%`;
    el.enemyHpFill.style.width = `${clamp(enemyRatio, 0, 100)}%`;
}

function drawArenaBackground() {
    const w = el.battleCanvas.width;
    const h = el.battleCanvas.height;

    battleCtx.clearRect(0, 0, w, h);

    const grad = battleCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#22355f');
    grad.addColorStop(0.55, '#111a35');
    grad.addColorStop(1, '#090f24');
    battleCtx.fillStyle = grad;
    battleCtx.fillRect(0, 0, w, h);

    battleCtx.strokeStyle = 'rgba(140, 190, 255, 0.18)';
    for (let x = 0; x <= w; x += 48) {
        battleCtx.beginPath();
        battleCtx.moveTo(x, 0);
        battleCtx.lineTo(x, h);
        battleCtx.stroke();
    }

    battleCtx.fillStyle = 'rgba(250, 225, 170, 0.12)';
    battleCtx.fillRect(0, GROUND_Y, w, h - GROUND_Y);

    battleCtx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    battleCtx.beginPath();
    battleCtx.moveTo(0, GROUND_Y + 1);
    battleCtx.lineTo(w, GROUND_Y + 1);
    battleCtx.stroke();
}

function drawEntity(entity) {
    battleCtx.save();

    if (entity.hitFlash > 0) {
        battleCtx.shadowColor = 'rgba(255, 245, 170, 0.8)';
        battleCtx.shadowBlur = 22;
    }
    if (entity.shieldUntil > performance.now()) {
        battleCtx.shadowColor = 'rgba(87, 225, 255, 0.75)';
        battleCtx.shadowBlur = 25;
    }

    battleCtx.fillStyle = entity.color;
    battleCtx.fillRect(entity.x + 8, entity.y + 32, entity.width - 16, entity.height - 32);

    battleCtx.fillStyle = '#e8f4ff';
    battleCtx.beginPath();
    battleCtx.arc(entity.x + entity.width / 2, entity.y + 18, 14, 0, Math.PI * 2);
    battleCtx.fill();

    battleCtx.fillStyle = '#0b1224';
    const eyeOffset = entity.dir > 0 ? 5 : -5;
    battleCtx.beginPath();
    battleCtx.arc(entity.x + entity.width / 2 + eyeOffset, entity.y + 16, 2.4, 0, Math.PI * 2);
    battleCtx.fill();

    const armSwing = entity.punchLock > 0 ? 8 : 0;
    battleCtx.strokeStyle = entity.color;
    battleCtx.lineWidth = 7;

    battleCtx.beginPath();
    battleCtx.moveTo(entity.x + 12, entity.y + 52);
    battleCtx.lineTo(entity.x - 8 + armSwing * entity.dir, entity.y + 76);
    battleCtx.stroke();

    battleCtx.beginPath();
    battleCtx.moveTo(entity.x + entity.width - 12, entity.y + 52);
    battleCtx.lineTo(entity.x + entity.width + 8 + armSwing * entity.dir, entity.y + 76);
    battleCtx.stroke();

    battleCtx.beginPath();
    battleCtx.moveTo(entity.x + 22, entity.y + entity.height);
    battleCtx.lineTo(entity.x + 18, entity.y + entity.height + 22);
    battleCtx.stroke();

    battleCtx.beginPath();
    battleCtx.moveTo(entity.x + entity.width - 22, entity.y + entity.height);
    battleCtx.lineTo(entity.x + entity.width - 18, entity.y + entity.height + 22);
    battleCtx.stroke();

    battleCtx.restore();
}

function drawProjectiles() {
    for (const shot of state.battle.projectiles) {
        battleCtx.save();
        battleCtx.fillStyle = shot.color;
        battleCtx.shadowColor = shot.color;
        battleCtx.shadowBlur = 16;
        battleCtx.beginPath();
        battleCtx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
        battleCtx.fill();
        battleCtx.restore();
    }
}

function drawIdleScene() {
    drawArenaBackground();
    setBattleOverlay('', '', '');
    hideWinnerBanner();
    battleCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    battleCtx.font = '700 24px Orbitron, sans-serif';
    battleCtx.fillText('READY FOR NEXT BATTLE', 300, 190);
}

function updateBattlePhase(now) {
    const battle = state.battle;
    const elapsed = now - battle.phaseStartedAt;

    if (battle.phase === 'intro') {
        if (elapsed < 900) {
            setBattleOverlay('ROUND 1', 'BATTLE SETUP', 'round');
            return;
        }
        if (elapsed < 1800) {
            setBattleOverlay('READY', 'GUARD UP', 'ready');
            return;
        }
        if (elapsed < 2500) {
            setBattleOverlay('FIGHT', 'GO FOR IT', 'fight');
            return;
        }
        battle.phase = 'fight';
        battle.phaseStartedAt = now;
        setBattleOverlay('', '', '');
        setBattleLog('FIGHT! 攻撃開始。');
        return;
    }

    if (battle.phase === 'fight') {
        return;
    }

    if (battle.phase === 'ko') {
        setBattleOverlay('K.O.', '', 'ko');
        if (elapsed > 550 && battle.winner) {
            showWinnerBanner(battle.winner);
        }
        if (elapsed > 2100) {
            battle.phase = 'result';
            battle.phaseStartedAt = now;
            if (battle.winner) {
                setBattleOverlay(battle.winner.isPlayer ? 'YOU WIN' : 'YOU LOSE', `${battle.winner.name} WINS`, 'result');
                setBattleLog(`${battle.winner.name} の勝利。もう一度「出撃」で再戦できます。`);
            }
        }
        return;
    }

    if (battle.phase === 'result' && battle.winner) {
        setBattleOverlay(battle.winner.isPlayer ? 'YOU WIN' : 'YOU LOSE', `${battle.winner.name} WINS`, 'result');
        showWinnerBanner(battle.winner);
    }
}

function gameLoop(timestamp) {
    if (!state.activeLoop) {
        return;
    }

    if (!state.battle.running) {
        drawIdleScene();
        requestAnimationFrame(gameLoop);
        return;
    }

    const deltaMs = state.battle.lastTime ? timestamp - state.battle.lastTime : 16.67;
    state.battle.lastTime = timestamp;
    const dt = clamp(deltaMs / 16.67, 0.65, 1.7);

    const player = state.battle.player;
    const enemy = state.battle.enemy;
    updateBattlePhase(timestamp);

    if (isBattleInteractive()) {
        handlePlayerInput(player);
        handleEnemyAi(enemy, player, dt);
    } else {
        clearMoveKeys();
        state.battle.keys.KeyW = false;
    }

    updateEntity(player, dt);
    updateEntity(enemy, dt);
    updateProjectiles(dt);
    updateHpHud();

    drawArenaBackground();
    drawEntity(player);
    drawEntity(enemy);
    drawProjectiles();

    requestAnimationFrame(gameLoop);
}

function handleActionKey(code, isEnemy = false) {
    if (!isBattleInteractive()) {
        return;
    }

    const actor = isEnemy ? state.battle.enemy : state.battle.player;
    const target = isEnemy ? state.battle.player : state.battle.enemy;

    if (!actor || !target) {
        return;
    }

    if (code === 'KeyJ') {
        tryAttack(actor, target, 'punch');
    }
    if (code === 'KeyK') {
        tryAttack(actor, target, 'kick');
    }
    if (code === 'KeyL') {
        useSpecial(actor, target);
    }
}

function clearMoveKeys() {
    state.battle.keys.KeyA = false;
    state.battle.keys.KeyD = false;
}

function resetTouchBattleInput() {
    clearMoveKeys();
    state.battle.keys.KeyW = false;
    const touch = state.battle.touch;
    touch.movePointerId = null;
    touch.actionPointerId = null;
    touch.moveJumpTriggered = false;
    if (touch.jumpKeyTimer) {
        clearTimeout(touch.jumpKeyTimer);
        touch.jumpKeyTimer = null;
    }
    if (touch.singleTapTimer) {
        clearTimeout(touch.singleTapTimer);
        touch.singleTapTimer = null;
    }
    touch.lastTapAt = 0;
    if (el.moveZone) {
        el.moveZone.classList.remove('is-active');
    }
    if (el.actionZone) {
        el.actionZone.classList.remove('is-active');
    }
}

function updateMoveKeysByDelta(dx) {
    const deadzone = 14;
    if (Math.abs(dx) < deadzone) {
        clearMoveKeys();
        return;
    }
    if (dx < 0) {
        state.battle.keys.KeyA = true;
        state.battle.keys.KeyD = false;
    } else {
        state.battle.keys.KeyA = false;
        state.battle.keys.KeyD = true;
    }
}

function pulseJumpKey() {
    const touch = state.battle.touch;
    if (touch.jumpKeyTimer) {
        clearTimeout(touch.jumpKeyTimer);
    }
    state.battle.keys.KeyW = true;
    touch.jumpKeyTimer = window.setTimeout(() => {
        state.battle.keys.KeyW = false;
        touch.jumpKeyTimer = null;
    }, 120);
}

function bindMoveZoneGesture() {
    if (!el.moveZone) {
        return;
    }
    const touch = state.battle.touch;

    const onPointerDown = (event) => {
        if (touch.movePointerId !== null) {
            return;
        }
        touch.movePointerId = event.pointerId;
        touch.moveStartX = event.clientX;
        touch.moveStartY = event.clientY;
        touch.moveJumpTriggered = false;
        el.moveZone.classList.add('is-active');
        el.moveZone.setPointerCapture(event.pointerId);
        event.preventDefault();
    };

    const onPointerMove = (event) => {
        if (touch.movePointerId !== event.pointerId) {
            return;
        }
        const dx = event.clientX - touch.moveStartX;
        const dy = event.clientY - touch.moveStartY;
        updateMoveKeysByDelta(dx);

        if (!touch.moveJumpTriggered && dy < -34 && Math.abs(dy) > Math.abs(dx) * 0.65) {
            pulseJumpKey();
            touch.moveJumpTriggered = true;
        }
        event.preventDefault();
    };

    const onPointerEnd = (event) => {
        if (touch.movePointerId !== event.pointerId) {
            return;
        }
        clearMoveKeys();
        touch.movePointerId = null;
        touch.moveJumpTriggered = false;
        el.moveZone.classList.remove('is-active');
        if (el.moveZone.hasPointerCapture(event.pointerId)) {
            el.moveZone.releasePointerCapture(event.pointerId);
        }
        event.preventDefault();
    };

    el.moveZone.addEventListener('pointerdown', onPointerDown);
    el.moveZone.addEventListener('pointermove', onPointerMove);
    el.moveZone.addEventListener('pointerup', onPointerEnd);
    el.moveZone.addEventListener('pointercancel', onPointerEnd);
    el.moveZone.addEventListener('contextmenu', (event) => event.preventDefault());
}

function bindActionZoneGesture() {
    if (!el.actionZone) {
        return;
    }
    const touch = state.battle.touch;

    const onPointerDown = (event) => {
        if (touch.actionPointerId !== null) {
            return;
        }
        touch.actionPointerId = event.pointerId;
        touch.actionStartX = event.clientX;
        touch.actionStartY = event.clientY;
        el.actionZone.classList.add('is-active');
        el.actionZone.setPointerCapture(event.pointerId);
        event.preventDefault();
    };

    const onPointerEnd = (event) => {
        if (touch.actionPointerId !== event.pointerId) {
            return;
        }
        const dx = event.clientX - touch.actionStartX;
        const dy = event.clientY - touch.actionStartY;
        const now = performance.now();

        if (el.actionZone.hasPointerCapture(event.pointerId)) {
            el.actionZone.releasePointerCapture(event.pointerId);
        }
        touch.actionPointerId = null;
        el.actionZone.classList.remove('is-active');

        if (dy < -30 && Math.abs(dy) > Math.abs(dx) * 0.75) {
            if (touch.singleTapTimer) {
                clearTimeout(touch.singleTapTimer);
                touch.singleTapTimer = null;
            }
            touch.lastTapAt = 0;
            handleActionKey('KeyL', false);
            event.preventDefault();
            return;
        }

        const interval = now - touch.lastTapAt;
        if (interval > 0 && interval < 280) {
            if (touch.singleTapTimer) {
                clearTimeout(touch.singleTapTimer);
                touch.singleTapTimer = null;
            }
            touch.lastTapAt = 0;
            handleActionKey('KeyK', false);
            event.preventDefault();
            return;
        }

        touch.lastTapAt = now;
        if (touch.singleTapTimer) {
            clearTimeout(touch.singleTapTimer);
            touch.singleTapTimer = null;
        }
        touch.singleTapTimer = window.setTimeout(() => {
            handleActionKey('KeyJ', false);
            touch.singleTapTimer = null;
        }, 170);
        event.preventDefault();
    };

    const onPointerCancel = (event) => {
        if (touch.actionPointerId !== event.pointerId) {
            return;
        }
        touch.actionPointerId = null;
        el.actionZone.classList.remove('is-active');
        if (el.actionZone.hasPointerCapture(event.pointerId)) {
            el.actionZone.releasePointerCapture(event.pointerId);
        }
        event.preventDefault();
    };

    el.actionZone.addEventListener('pointerdown', onPointerDown);
    el.actionZone.addEventListener('pointerup', onPointerEnd);
    el.actionZone.addEventListener('pointercancel', onPointerCancel);
    el.actionZone.addEventListener('contextmenu', (event) => event.preventDefault());
}

function bindQuickActionButtons() {
    document.querySelectorAll('.mobile-quick-actions button[data-key]').forEach((btn) => {
        const code = btn.dataset.key;
        const trigger = (event) => {
            event.preventDefault();
            handleActionKey(code, false);
        };
        if ('PointerEvent' in window) {
            btn.addEventListener('pointerdown', trigger);
        } else {
            btn.addEventListener('touchstart', trigger, { passive: false });
            btn.addEventListener('mousedown', trigger);
        }
        btn.addEventListener('contextmenu', (event) => event.preventDefault());
    });
}

function bindEvents() {
    el.startCamera.addEventListener('click', startCamera);
    el.stopCamera.addEventListener('click', stopCamera);

    el.fileInput.addEventListener('change', (event) => {
        const [file] = event.target.files || [];
        decodeFromFile(file);
    });

    el.applyManual.addEventListener('click', () => {
        const value = el.manualInput.value.trim();
        if (!value) {
            setBattleLog('手動入力が空です。');
            return;
        }
        setBarcodeValue(value, '手動入力');
    });

    el.generateBtn.addEventListener('click', () => {
        if (!state.barcodeValue) {
            setBattleLog('先にバーコードを読み込んでください。');
            return;
        }
        state.currentFighter = generateFighterFromBarcode(state.barcodeValue);
        displayFighter(state.currentFighter);
        setBattleLog(`${state.currentFighter.name} を生成しました。`);
    });

    el.saveBtn.addEventListener('click', addCurrentToCollection);

    el.fightBtn.addEventListener('click', () => {
        if (!state.currentFighter) {
            setBattleLog('出撃するファイターが未選択です。');
            return;
        }
        launchBattle(state.currentFighter);
    });

    el.collectionList.addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-action]');
        if (!btn) {
            return;
        }
        const parent = btn.closest('.collection-item');
        if (!parent) {
            return;
        }

        const id = parent.dataset.id;
        const action = btn.dataset.action;
        if (action === 'select') {
            selectCollectionFighter(id, false);
        }
        if (action === 'fight') {
            selectCollectionFighter(id, true);
        }
        if (action === 'delete') {
            deleteCollectionFighter(id);
        }
    });

    window.addEventListener('keydown', (event) => {
        const code = event.code;
        if (['KeyA', 'KeyD', 'KeyW', 'KeyJ', 'KeyK', 'KeyL'].includes(code)) {
            state.battle.keys[code] = true;
            event.preventDefault();
            if (!event.repeat) {
                handleActionKey(code, false);
            }
        }
    });

    window.addEventListener('keyup', (event) => {
        const code = event.code;
        if (['KeyA', 'KeyD', 'KeyW', 'KeyJ', 'KeyK', 'KeyL'].includes(code)) {
            state.battle.keys[code] = false;
            event.preventDefault();
        }
    });

    bindMoveZoneGesture();
    bindActionZoneGesture();
    bindQuickActionButtons();

    window.addEventListener('beforeunload', stopCamera);
}

async function bootstrap() {
    drawIdleScene();
    bindEvents();
    loadCollection();
    await initDetector();
}

bootstrap();
