const LANDMARKS = {
    NOSE: 0,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
};

const TRACKED_MOTION_POINTS = [
    LANDMARKS.LEFT_WRIST,
    LANDMARKS.RIGHT_WRIST,
    LANDMARKS.LEFT_ELBOW,
    LANDMARKS.RIGHT_ELBOW,
    LANDMARKS.LEFT_KNEE,
    LANDMARKS.RIGHT_KNEE,
    LANDMARKS.LEFT_ANKLE,
    LANDMARKS.RIGHT_ANKLE,
];

const RELIABILITY_POINTS = [
    LANDMARKS.LEFT_SHOULDER,
    LANDMARKS.RIGHT_SHOULDER,
    LANDMARKS.LEFT_HIP,
    LANDMARKS.RIGHT_HIP,
    LANDMARKS.LEFT_KNEE,
    LANDMARKS.RIGHT_KNEE,
    LANDMARKS.LEFT_ANKLE,
    LANDMARKS.RIGHT_ANKLE,
];

const FEATURE_KEYS = ['silhouette', 'symmetry', 'motion', 'hair', 'contour'];
const ANALYSIS_WIDTH = 192;
const HISTORY_KEY = 'scouterResultsV1';
const HISTORY_LIMIT = 10;
const ASCII_PALETTE = '@%#*+=-:. ';

const el = {
    camera: document.getElementById('camera'),
    hudCanvas: document.getElementById('hud-canvas'),
    placeholder: document.getElementById('stage-placeholder'),
    startCamera: document.getElementById('start-camera'),
    stopCamera: document.getElementById('stop-camera'),
    resetBaseline: document.getElementById('reset-baseline'),
    cameraFacing: document.getElementById('camera-facing'),
    scanDuration: document.getElementById('scan-duration'),
    scanProgress: document.getElementById('scan-progress'),
    countdown: document.getElementById('countdown'),
    status: document.getElementById('status'),
    battlePower: document.getElementById('battle-power'),
    rarity: document.getElementById('rarity'),
    confidence: document.getElementById('confidence'),
    scanSummary: document.getElementById('scan-summary'),
    asciiArt: document.getElementById('ascii-art'),
    historyList: document.getElementById('history-list'),
    featureText: {
        silhouette: document.getElementById('f-silhouette'),
        symmetry: document.getElementById('f-symmetry'),
        motion: document.getElementById('f-motion'),
        hair: document.getElementById('f-hair'),
        contour: document.getElementById('f-contour'),
    },
    featureMeter: {
        silhouette: document.getElementById('m-silhouette'),
        symmetry: document.getElementById('m-symmetry'),
        motion: document.getElementById('m-motion'),
        hair: document.getElementById('m-hair'),
        contour: document.getElementById('m-contour'),
    },
};

const hudCtx = el.hudCanvas.getContext('2d');

const state = {
    pose: null,
    camera: null,
    running: false,
    facingMode: 'user',
    lastLandmarks: null,
    lastTs: 0,
    baseline: createBaselineState(),
    analysis: createAnalysisBuffers(1280, 720),
    scan: createScanState(5000),
    history: [],
    smooth: {
        power: 900,
        rarity: 0.2,
        features: {
            silhouette: 0,
            symmetry: 0,
            motion: 0,
            hair: 0,
            contour: 0,
        },
        confidence: 0,
    },
};

function createFeatureBucket(value = 0) {
    return {
        silhouette: value,
        symmetry: value,
        motion: value,
        hair: value,
        contour: value,
    };
}

function createScanState(durationMs = 5000) {
    const snapshotCanvas = document.createElement('canvas');
    snapshotCanvas.width = 1;
    snapshotCanvas.height = 1;

    return {
        active: false,
        finalizing: false,
        durationMs,
        startAt: 0,
        endAt: 0,
        ticker: null,
        sampleCount: 0,
        weightSum: 0,
        confidenceSum: 0,
        featureWeightedSum: createFeatureBucket(0),
        bestPower: 0,
        snapshotCanvas,
        snapshotCtx: snapshotCanvas.getContext('2d', { willReadFrequently: true }),
    };
}

function createBaselineState() {
    return {
        count: 0,
        mean: createFeatureBucket(0),
        m2: createFeatureBucket(0),
    };
}

function createAnalysisBuffers(width, height) {
    const ratio = height / Math.max(1, width);
    const h = Math.max(72, Math.round(ANALYSIS_WIDTH * ratio));

    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = ANALYSIS_WIDTH;
    frameCanvas.height = h;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = ANALYSIS_WIDTH;
    maskCanvas.height = h;

    return {
        width: ANALYSIS_WIDTH,
        height: h,
        frameCtx: frameCanvas.getContext('2d', { willReadFrequently: true }),
        maskCtx: maskCanvas.getContext('2d', { willReadFrequently: true }),
    };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalize(value, min, max) {
    if (max <= min) {
        return 0;
    }
    return clamp((value - min) / (max - min), 0, 1);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function getLandmark(landmarks, index) {
    return landmarks && landmarks[index] ? landmarks[index] : null;
}

function isVisible(landmark, threshold = 0.35) {
    return !!landmark && (landmark.visibility == null || landmark.visibility >= threshold);
}

function avgVisibility(landmarks, indices) {
    let sum = 0;
    let count = 0;
    for (const idx of indices) {
        const lm = landmarks[idx];
        if (!lm) {
            continue;
        }
        sum += lm.visibility == null ? 0.5 : clamp(lm.visibility, 0, 1);
        count += 1;
    }
    return count ? sum / count : 0;
}

function formatDateTime(ts) {
    const d = new Date(ts);
    const pad = (v) => String(v).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function setStatus(text) {
    el.status.textContent = text;
}

function setCountdown(text) {
    el.countdown.textContent = text;
}

function setScanProgress(progress) {
    el.scanProgress.style.width = `${Math.round(clamp(progress, 0, 1) * 100)}%`;
}

function setCameraVisibility(active) {
    el.camera.style.display = active ? 'block' : 'none';
    el.hudCanvas.style.display = active ? 'block' : 'none';
    el.placeholder.style.display = active ? 'none' : 'grid';
}

function getScanDurationMs() {
    const sec = Number(el.scanDuration.value) || 5;
    return clamp(sec * 1000, 2000, 12000);
}

function updateStartButtonLabel() {
    const sec = Number(el.scanDuration.value) || 5;
    el.startCamera.textContent = `${sec}秒スキャン開始`;
}

function updateActionButtons() {
    el.startCamera.disabled = state.running;
    el.stopCamera.disabled = !state.running;
    el.cameraFacing.disabled = state.running;
    el.scanDuration.disabled = state.running;
}

async function initPoseModel() {
    if (!window.Pose || !window.Camera) {
        setStatus('MediaPipe の読み込みに失敗しました。ページを再読み込みしてください。');
        return false;
    }

    if (state.pose) {
        return true;
    }

    try {
        const pose = new window.Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: true,
            smoothSegmentation: true,
            minDetectionConfidence: 0.55,
            minTrackingConfidence: 0.55,
        });

        pose.onResults(onPoseResults);
        state.pose = pose;
        setStatus('モデル初期化完了。スキャン開始を押してください。');
        return true;
    } catch (error) {
        setStatus(`モデル初期化エラー: ${error.message}`);
        return false;
    }
}

function getCameraPreset() {
    const portrait = window.matchMedia('(orientation: portrait)').matches || window.innerHeight > window.innerWidth;
    if (portrait) {
        return { width: 720, height: 1280 };
    }
    return { width: 1280, height: 720 };
}

function startScanTicker() {
    clearScanTicker();
    state.scan.ticker = window.setInterval(() => {
        if (!state.scan.active) {
            return;
        }

        const now = performance.now();
        const remainingMs = Math.max(0, state.scan.endAt - now);
        const progress = (state.scan.durationMs - remainingMs) / Math.max(1, state.scan.durationMs);
        setCountdown(`残り ${(remainingMs / 1000).toFixed(1)} 秒`);
        setScanProgress(progress);

        if (remainingMs <= 0) {
            finalizeScan('timeout');
        }
    }, 80);
}

function clearScanTicker() {
    if (state.scan.ticker) {
        clearInterval(state.scan.ticker);
        state.scan.ticker = null;
    }
}

async function startTimedScan() {
    if (state.running || state.scan.active) {
        return;
    }

    const ok = await initPoseModel();
    if (!ok) {
        return;
    }

    const durationMs = getScanDurationMs();
    state.scan = createScanState(durationMs);
    state.scan.active = true;
    state.scan.startAt = performance.now();
    state.scan.endAt = state.scan.startAt + durationMs;

    try {
        const preset = getCameraPreset();
        state.camera = new window.Camera(el.camera, {
            onFrame: async () => {
                if (state.pose && state.running) {
                    await state.pose.send({ image: el.camera });
                }
            },
            width: preset.width,
            height: preset.height,
            facingMode: state.facingMode,
        });

        await state.camera.start();
        state.running = true;
        state.lastLandmarks = null;
        state.lastTs = 0;

        setCameraVisibility(true);
        startScanTicker();
        setStatus('スキャン中... 人物を画面中央に収めてください。');
        setCountdown(`残り ${(durationMs / 1000).toFixed(1)} 秒`);
        setScanProgress(0);
        updateActionButtons();
    } catch (error) {
        setStatus(`カメラ起動エラー: ${error.message}`);
        state.running = false;
        state.scan.active = false;
        state.camera = null;
        clearScanTicker();
        setCameraVisibility(false);
        setCountdown('待機中');
        setScanProgress(0);
        updateActionButtons();
    }
}

function stopCamera(options = {}) {
    const { keepStatus = false } = options;

    clearScanTicker();

    if (state.camera && typeof state.camera.stop === 'function') {
        state.camera.stop();
    }

    const stream = el.camera.srcObject;
    if (stream && stream.getTracks) {
        stream.getTracks().forEach((track) => track.stop());
    }

    el.camera.srcObject = null;
    state.camera = null;
    state.running = false;
    state.lastLandmarks = null;
    state.lastTs = 0;
    setCameraVisibility(false);

    if (!keepStatus) {
        setStatus('スキャンを停止しました。');
        setCountdown('待機中');
        setScanProgress(0);
    }

    updateActionButtons();
}

function resetBaseline() {
    state.baseline = createBaselineState();
    setStatus('レア度基準をリセットしました。');
}

function onPoseResults(results) {
    const image = results.image;
    if (!image || !image.width || !image.height) {
        return;
    }

    if (el.hudCanvas.width !== image.width || el.hudCanvas.height !== image.height) {
        el.hudCanvas.width = image.width;
        el.hudCanvas.height = image.height;
        state.analysis = createAnalysisBuffers(image.width, image.height);
    }

    drawBaseFrame(results);

    if (!results.poseLandmarks || !results.segmentationMask) {
        decayUi();
        return;
    }

    const now = performance.now();
    const metrics = extractMetrics(results, now);
    renderHud(results.poseLandmarks, metrics, now);
    updateScores(metrics);

    if (state.scan.active && metrics.valid) {
        collectScanSample(metrics, image);
        if (now >= state.scan.endAt) {
            finalizeScan('timeout');
        }
    }

    state.lastLandmarks = results.poseLandmarks.map((lm) => ({ ...lm }));
    state.lastTs = now;
}

function drawBaseFrame(results) {
    hudCtx.save();
    hudCtx.clearRect(0, 0, el.hudCanvas.width, el.hudCanvas.height);
    hudCtx.drawImage(results.image, 0, 0, el.hudCanvas.width, el.hudCanvas.height);

    if (results.segmentationMask) {
        hudCtx.globalCompositeOperation = 'source-atop';
        hudCtx.globalAlpha = 0.18;
        hudCtx.drawImage(results.segmentationMask, 0, 0, el.hudCanvas.width, el.hudCanvas.height);
        hudCtx.fillStyle = 'rgba(135, 255, 240, 0.35)';
        hudCtx.fillRect(0, 0, el.hudCanvas.width, el.hudCanvas.height);
    }

    hudCtx.globalCompositeOperation = 'source-over';
    hudCtx.globalAlpha = 1;
    drawScanLines(hudCtx, el.hudCanvas.width, el.hudCanvas.height, performance.now());
    hudCtx.restore();
}

function drawScanLines(ctx, w, h, time) {
    const sweepY = ((time * 0.08) % (h + 120)) - 60;
    ctx.save();
    ctx.strokeStyle = 'rgba(119, 242, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    const grad = ctx.createLinearGradient(0, sweepY - 22, 0, sweepY + 22);
    grad.addColorStop(0, 'rgba(119, 242, 255, 0)');
    grad.addColorStop(0.5, 'rgba(119, 242, 255, 0.45)');
    grad.addColorStop(1, 'rgba(119, 242, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, sweepY - 22, w, 44);
    ctx.restore();
}

function extractMetrics(results, now) {
    const { frameCtx, maskCtx, width, height } = state.analysis;

    frameCtx.drawImage(results.image, 0, 0, width, height);
    maskCtx.drawImage(results.segmentationMask, 0, 0, width, height);

    const frame = frameCtx.getImageData(0, 0, width, height).data;
    const mask = maskCtx.getImageData(0, 0, width, height).data;

    const totalPixels = width * height;
    const fgMask = new Uint8Array(totalPixels);
    const gray = new Uint8Array(totalPixels);

    let fgCount = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    let m00 = 0;
    let m10 = 0;
    let m01 = 0;
    let m20 = 0;
    let m02 = 0;
    let m11 = 0;
    let m30 = 0;
    let m03 = 0;
    let m12 = 0;
    let m21 = 0;

    for (let i = 0; i < totalPixels; i += 1) {
        const i4 = i * 4;
        const r = frame[i4];
        const g = frame[i4 + 1];
        const b = frame[i4 + 2];
        gray[i] = (0.299 * r + 0.587 * g + 0.114 * b) | 0;

        const maskValue = Math.max(mask[i4], mask[i4 + 3]);
        if (maskValue < 120) {
            continue;
        }

        fgMask[i] = 1;
        fgCount += 1;
        const x = i % width;
        const y = (i / width) | 0;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        m00 += 1;
        m10 += x;
        m01 += y;
        m20 += x * x;
        m02 += y * y;
        m11 += x * y;
        m30 += x * x * x;
        m03 += y * y * y;
        m12 += x * y * y;
        m21 += x * x * y;
    }

    if (fgCount < 40 || maxX <= minX || maxY <= minY) {
        return {
            valid: false,
            confidence: 0,
        };
    }

    const areaRatio = fgCount / Math.max(1, totalPixels);
    const bboxW = maxX - minX + 1;
    const bboxH = maxY - minY + 1;
    const bboxArea = bboxW * bboxH;
    const compactness = fgCount / Math.max(1, bboxArea);

    const xBar = m10 / Math.max(1, m00);
    const yBar = m01 / Math.max(1, m00);

    // Hu moments: silhouette shape を回転・スケール変化に強い指標へ変換する。
    const mu20 = m20 - xBar * m10;
    const mu02 = m02 - yBar * m01;
    const mu11 = m11 - xBar * m01;

    const mu30 = m30 - (3 * xBar * m20) + (2 * xBar * xBar * m10);
    const mu03 = m03 - (3 * yBar * m02) + (2 * yBar * yBar * m01);
    const mu12 = m12 - (2 * yBar * m11) - (xBar * m02) + (2 * yBar * yBar * m10);
    const mu21 = m21 - (2 * xBar * m11) - (yBar * m20) + (2 * xBar * xBar * m01);

    const etaDen2 = Math.pow(m00, 2);
    const etaDen25 = Math.pow(m00, 2.5);

    const eta20 = mu20 / Math.max(1e-6, etaDen2);
    const eta02 = mu02 / Math.max(1e-6, etaDen2);
    const eta11 = mu11 / Math.max(1e-6, etaDen2);
    const eta30 = mu30 / Math.max(1e-6, etaDen25);
    const eta03 = mu03 / Math.max(1e-6, etaDen25);
    const eta12 = mu12 / Math.max(1e-6, etaDen25);
    const eta21 = mu21 / Math.max(1e-6, etaDen25);

    const hu1 = eta20 + eta02;
    const hu2 = Math.pow(eta20 - eta02, 2) + (4 * eta11 * eta11);
    const hu3 = Math.pow(eta30 - (3 * eta12), 2) + Math.pow((3 * eta21) - eta03, 2);

    const contourInvariant = clamp(
        normalize(-Math.log10(Math.abs(hu2) + 1e-12), 2.2, 9.2) * 0.7 +
        normalize(-Math.log10(Math.abs(hu3) + 1e-16), 3.0, 12.0) * 0.3,
        0,
        1,
    );

    const landmarks = results.poseLandmarks;
    const shouldersVisible = isVisible(landmarks[LANDMARKS.LEFT_SHOULDER]) && isVisible(landmarks[LANDMARKS.RIGHT_SHOULDER]);
    const axisX = shouldersVisible
        ? (((landmarks[LANDMARKS.LEFT_SHOULDER].x + landmarks[LANDMARKS.RIGHT_SHOULDER].x) * 0.5) * width)
        : xBar;

    let symMatch = 0;
    let symTotal = 0;
    for (let y = minY; y <= maxY; y += 2) {
        for (let x = minX; x <= maxX; x += 2) {
            const idx = y * width + x;
            if (!fgMask[idx]) {
                continue;
            }
            const mirrorX = Math.round((2 * axisX) - x);
            if (mirrorX < 0 || mirrorX >= width) {
                continue;
            }
            symTotal += 1;
            if (fgMask[y * width + mirrorX]) {
                symMatch += 1;
            }
        }
    }

    const rawSymmetry = symTotal ? (symMatch / symTotal) : 0;
    const symmetry = normalize(rawSymmetry, 0.42, 0.96);

    const silhouette = clamp(
        normalize(areaRatio, 0.05, 0.42) * 0.42 +
        normalize(bboxH / height, 0.34, 0.9) * 0.36 +
        normalize(compactness, 0.18, 0.82) * 0.22,
        0,
        1,
    );

    const motion = calculateMotion(landmarks, now);
    const hair = calculateHairComplexity(landmarks, gray, fgMask, width, height, xBar, yBar);
    const confidence = avgVisibility(landmarks, RELIABILITY_POINTS);

    return {
        valid: true,
        confidence,
        features: {
            silhouette,
            symmetry,
            motion,
            hair,
            contour: contourInvariant,
        },
        bbox: {
            x: minX / width,
            y: minY / height,
            w: bboxW / width,
            h: bboxH / height,
        },
        hu: {
            hu1,
            hu2,
            hu3,
        },
    };
}

function calculateMotion(landmarks, now) {
    if (!state.lastLandmarks || state.lastTs <= 0) {
        return 0;
    }

    const dt = Math.max(0.016, (now - state.lastTs) / 1000);
    let speedSum = 0;
    let count = 0;

    for (const idx of TRACKED_MOTION_POINTS) {
        const current = landmarks[idx];
        const prev = state.lastLandmarks[idx];
        if (!isVisible(current, 0.3) || !isVisible(prev, 0.3)) {
            continue;
        }
        speedSum += dist(current, prev) / dt;
        count += 1;
    }

    if (!count) {
        return 0;
    }

    return clamp((speedSum / count) / 1.6, 0, 1);
}

function calculateHairComplexity(landmarks, gray, fgMask, width, height, xBar, yBar) {
    const nose = getLandmark(landmarks, LANDMARKS.NOSE);
    const leftEar = getLandmark(landmarks, LANDMARKS.LEFT_EAR);
    const rightEar = getLandmark(landmarks, LANDMARKS.RIGHT_EAR);
    const leftShoulder = getLandmark(landmarks, LANDMARKS.LEFT_SHOULDER);
    const rightShoulder = getLandmark(landmarks, LANDMARKS.RIGHT_SHOULDER);

    let centerX = xBar;
    let centerY = yBar * 0.72;

    if (isVisible(nose, 0.15)) {
        centerX = nose.x * width;
        centerY = nose.y * height;
    }

    const shoulderDist = isVisible(leftShoulder) && isVisible(rightShoulder)
        ? dist(leftShoulder, rightShoulder) * width
        : width * 0.22;

    const earDist = isVisible(leftEar, 0.15) && isVisible(rightEar, 0.15)
        ? dist(leftEar, rightEar) * width
        : shoulderDist * 0.45;

    const headW = clamp(Math.max(earDist * 1.75, shoulderDist * 0.4), width * 0.1, width * 0.36);
    const left = clamp(Math.round(centerX - (headW * 0.86)), 1, width - 2);
    const right = clamp(Math.round(centerX + (headW * 0.86)), 1, width - 2);
    const top = clamp(Math.round(centerY - (headW * 1.2)), 1, height - 2);
    const bottom = clamp(Math.round(centerY + (headW * 0.46)), 1, height - 2);

    let edgeCount = 0;
    let headPixelCount = 0;
    const bins = new Array(8).fill(0);

    for (let y = top; y <= bottom; y += 1) {
        for (let x = left; x <= right; x += 1) {
            const idx = y * width + x;
            if (!fgMask[idx]) {
                continue;
            }
            if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) {
                continue;
            }

            headPixelCount += 1;
            const gx =
                -gray[(y - 1) * width + (x - 1)] - (2 * gray[y * width + (x - 1)]) - gray[(y + 1) * width + (x - 1)] +
                gray[(y - 1) * width + (x + 1)] + (2 * gray[y * width + (x + 1)]) + gray[(y + 1) * width + (x + 1)];

            const gy =
                -gray[(y - 1) * width + (x - 1)] - (2 * gray[(y - 1) * width + x]) - gray[(y - 1) * width + (x + 1)] +
                gray[(y + 1) * width + (x - 1)] + (2 * gray[(y + 1) * width + x]) + gray[(y + 1) * width + (x + 1)];

            const mag = Math.hypot(gx, gy);
            if (mag > 56) {
                edgeCount += 1;
                const angle = Math.atan2(gy, gx) + Math.PI;
                const bin = Math.min(7, Math.floor(angle / (Math.PI / 4)));
                bins[bin] += 1;
            }
        }
    }

    if (!headPixelCount) {
        return 0;
    }

    const edgeDensity = edgeCount / headPixelCount;
    const edgeNorm = clamp(edgeDensity * 3.3, 0, 1);
    const entropyNorm = normalizedEntropy(bins);

    return clamp((edgeNorm * 0.65) + (entropyNorm * 0.35), 0, 1);
}

function normalizedEntropy(bins) {
    const total = bins.reduce((sum, value) => sum + value, 0);
    if (!total) {
        return 0;
    }

    let entropy = 0;
    for (const value of bins) {
        if (!value) {
            continue;
        }
        const p = value / total;
        entropy -= p * Math.log2(p);
    }

    return clamp(entropy / Math.log2(bins.length), 0, 1);
}

function updateBaseline(features) {
    state.baseline.count += 1;
    const n = state.baseline.count;

    for (const key of FEATURE_KEYS) {
        const x = features[key];
        const delta = x - state.baseline.mean[key];
        state.baseline.mean[key] += delta / n;
        const delta2 = x - state.baseline.mean[key];
        state.baseline.m2[key] += delta * delta2;
    }
}

function computeRarity(features) {
    const n = state.baseline.count;
    if (n < 18) {
        return clamp(0.22 + 0.54 * ((features.hair + features.contour) * 0.5), 0, 1);
    }

    // セッション内の分布から z-score を計算し、希少性としてレア度へ反映する。
    let zSum = 0;
    for (const key of FEATURE_KEYS) {
        const mean = state.baseline.mean[key];
        const variance = n > 1 ? state.baseline.m2[key] / (n - 1) : 0;
        const std = Math.sqrt(Math.max(variance, 0.0025));
        const z = Math.abs((features[key] - mean) / std);
        zSum += clamp(z / 2.8, 0, 1);
    }

    const meanZ = zSum / FEATURE_KEYS.length;
    return clamp((meanZ * 0.6) + (((features.hair + features.contour) * 0.5) * 0.4), 0, 1);
}

function rarityLabel(rarity) {
    if (rarity >= 0.9) {
        return { label: 'LEGENDARY', cls: 'legendary' };
    }
    if (rarity >= 0.77) {
        return { label: 'EPIC', cls: 'epic' };
    }
    if (rarity >= 0.6) {
        return { label: 'RARE', cls: 'rare' };
    }
    if (rarity >= 0.42) {
        return { label: 'UNCOMMON', cls: 'uncommon' };
    }
    return { label: 'COMMON', cls: 'common' };
}

function calculatePower(features, confidence) {
    const confidenceBoost = 0.72 + (confidence * 0.5);
    const powerBase =
        (0.24 * features.motion) +
        (0.22 * features.silhouette) +
        (0.20 * features.symmetry) +
        (0.18 * features.hair) +
        (0.16 * features.contour);

    return Math.round((900 + (14500 * powerBase)) * confidenceBoost);
}

function updateScores(metrics) {
    if (!metrics.valid) {
        decayUi();
        return;
    }

    const f = metrics.features;
    const confidence = clamp(metrics.confidence, 0, 1);

    if (confidence >= 0.45) {
        updateBaseline(f);
    }

    const rarityRaw = computeRarity(f);
    const power = calculatePower(f, confidence);

    state.smooth.power = lerp(state.smooth.power, power, 0.23);
    state.smooth.rarity = lerp(state.smooth.rarity, rarityRaw, 0.18);
    state.smooth.confidence = lerp(state.smooth.confidence, confidence, 0.2);

    for (const key of FEATURE_KEYS) {
        state.smooth.features[key] = lerp(state.smooth.features[key], f[key], 0.22);
    }

    renderUi();
}

function renderUi() {
    el.battlePower.textContent = Math.round(state.smooth.power).toLocaleString('ja-JP');

    const rarityInfo = rarityLabel(state.smooth.rarity);
    el.rarity.textContent = rarityInfo.label;
    el.rarity.className = `rarity ${rarityInfo.cls}`;

    const confidencePct = Math.round(state.smooth.confidence * 100);
    el.confidence.textContent = `認識信頼度: ${confidencePct}%`;

    for (const key of FEATURE_KEYS) {
        const value = clamp(state.smooth.features[key], 0, 1);
        el.featureText[key].textContent = value.toFixed(2);
        el.featureMeter[key].style.width = `${Math.round(value * 100)}%`;
    }
}

function decayUi() {
    state.smooth.power = lerp(state.smooth.power, 900, 0.06);
    state.smooth.rarity = lerp(state.smooth.rarity, 0.2, 0.06);
    state.smooth.confidence = lerp(state.smooth.confidence, 0, 0.08);

    for (const key of FEATURE_KEYS) {
        state.smooth.features[key] = lerp(state.smooth.features[key], 0, 0.07);
    }

    renderUi();
}

function renderHud(landmarks, metrics, now) {
    if (!metrics.valid || !metrics.bbox) {
        return;
    }

    const box = metrics.bbox;
    const x = box.x * el.hudCanvas.width;
    const y = box.y * el.hudCanvas.height;
    const w = box.w * el.hudCanvas.width;
    const h = box.h * el.hudCanvas.height;

    const rarity = rarityLabel(state.smooth.rarity);
    const hudColor = rarity.cls === 'legendary'
        ? '#ff7f9f'
        : rarity.cls === 'epic'
            ? '#ffd46e'
            : '#77f2ff';

    hudCtx.save();
    hudCtx.strokeStyle = hudColor;
    hudCtx.lineWidth = 2;
    drawCornerRect(hudCtx, x, y, w, h, Math.min(34, w * 0.2, h * 0.2));

    hudCtx.fillStyle = 'rgba(3, 11, 22, 0.76)';
    hudCtx.fillRect(x, Math.max(0, y - 58), Math.min(w, 320), 52);

    hudCtx.fillStyle = hudColor;
    hudCtx.font = '700 15px Orbitron, sans-serif';
    hudCtx.fillText('TARGET LOCK', x + 8, Math.max(18, y - 36));

    hudCtx.fillStyle = '#d4f8ff';
    hudCtx.font = '600 13px Orbitron, sans-serif';
    hudCtx.fillText(`PL ${Math.round(state.smooth.power).toLocaleString('ja-JP')} | ${rarity.label}`, x + 8, Math.max(34, y - 16));

    drawConnectors(hudCtx, landmarks, POSE_CONNECTIONS, {
        color: 'rgba(119, 242, 255, 0.72)',
        lineWidth: 2,
    });

    drawLandmarks(hudCtx, landmarks, {
        color: 'rgba(255, 234, 173, 0.92)',
        lineWidth: 1,
        radius: 2,
    });

    const pulse = 0.5 + (0.5 * Math.sin(now * 0.006));
    hudCtx.strokeStyle = `rgba(119, 242, 255, ${0.2 + pulse * 0.3})`;
    hudCtx.lineWidth = 1;
    hudCtx.beginPath();
    hudCtx.moveTo(el.hudCanvas.width * 0.5, 0);
    hudCtx.lineTo(el.hudCanvas.width * 0.5, el.hudCanvas.height);
    hudCtx.stroke();
    hudCtx.restore();
}

function drawCornerRect(ctx, x, y, w, h, size) {
    const s = Math.max(8, size);

    ctx.beginPath();
    ctx.moveTo(x, y + s);
    ctx.lineTo(x, y);
    ctx.lineTo(x + s, y);

    ctx.moveTo(x + w - s, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + s);

    ctx.moveTo(x, y + h - s);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + s, y + h);

    ctx.moveTo(x + w - s, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - s);
    ctx.stroke();
}

function collectScanSample(metrics, image) {
    const confidence = clamp(metrics.confidence, 0, 1);
    if (confidence < 0.2) {
        return;
    }

    const weight = 0.35 + confidence;
    state.scan.sampleCount += 1;
    state.scan.weightSum += weight;
    state.scan.confidenceSum += confidence;

    for (const key of FEATURE_KEYS) {
        state.scan.featureWeightedSum[key] += metrics.features[key] * weight;
    }

    const framePower = calculatePower(metrics.features, confidence);
    if (framePower >= state.scan.bestPower) {
        state.scan.bestPower = framePower;
        captureSnapshot(image, metrics.bbox);
    }
}

function captureSnapshot(image, bbox) {
    if (!bbox) {
        return;
    }

    const iw = image.videoWidth || image.width;
    const ih = image.videoHeight || image.height;
    if (!iw || !ih) {
        return;
    }

    const padX = bbox.w * 0.2;
    const padTop = bbox.h * 0.24;
    const padBottom = bbox.h * 0.12;

    const sx = Math.floor(clamp((bbox.x - padX) * iw, 0, iw - 1));
    const sy = Math.floor(clamp((bbox.y - padTop) * ih, 0, ih - 1));
    const sw = Math.floor(clamp((bbox.w + padX * 2) * iw, 32, iw - sx));
    const sh = Math.floor(clamp((bbox.h + padTop + padBottom) * ih, 32, ih - sy));

    const canvas = state.scan.snapshotCanvas;
    const ctx = state.scan.snapshotCtx;
    canvas.width = sw;
    canvas.height = sh;

    try {
        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    } catch (error) {
        // drawImage が失敗した場合は前回スナップショットを保持する。
    }
}

function buildScanResult() {
    if (state.scan.sampleCount < 3 || state.scan.weightSum <= 0) {
        return null;
    }

    const features = createFeatureBucket(0);
    for (const key of FEATURE_KEYS) {
        features[key] = clamp(state.scan.featureWeightedSum[key] / state.scan.weightSum, 0, 1);
    }

    const confidence = clamp(state.scan.confidenceSum / state.scan.sampleCount, 0, 1);
    const rarityRaw = computeRarity(features);
    const rarity = rarityLabel(rarityRaw);
    const power = calculatePower(features, confidence);
    const ascii = generateAsciiArt(state.scan.snapshotCanvas);

    return {
        id: `scan-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        createdAt: Date.now(),
        power,
        confidence,
        rarityLabel: rarity.label,
        rarityClass: rarity.cls,
        rarityRaw,
        features,
        ascii,
    };
}

function generateAsciiArt(sourceCanvas) {
    if (!sourceCanvas || sourceCanvas.width < 8 || sourceCanvas.height < 8) {
        return 'ASCII生成に失敗しました。';
    }

    const targetCols = 46;
    const aspect = sourceCanvas.height / Math.max(1, sourceCanvas.width);
    const targetRows = Math.max(24, Math.round(targetCols * aspect * 0.57));

    const canvas = document.createElement('canvas');
    canvas.width = targetCols;
    canvas.height = targetRows;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(sourceCanvas, 0, 0, targetCols, targetRows);

    const pixels = ctx.getImageData(0, 0, targetCols, targetRows).data;

    let minL = 255;
    let maxL = 0;
    const luminance = new Float32Array(targetCols * targetRows);

    for (let i = 0; i < luminance.length; i += 1) {
        const i4 = i * 4;
        const l = (0.299 * pixels[i4]) + (0.587 * pixels[i4 + 1]) + (0.114 * pixels[i4 + 2]);
        luminance[i] = l;
        minL = Math.min(minL, l);
        maxL = Math.max(maxL, l);
    }

    const span = Math.max(1, maxL - minL);
    const lines = [];

    for (let y = 0; y < targetRows; y += 1) {
        let line = '';
        for (let x = 0; x < targetCols; x += 1) {
            const idx = y * targetCols + x;
            const norm = clamp((luminance[idx] - minL) / span, 0, 1);
            const charIndex = Math.floor((1 - norm) * (ASCII_PALETTE.length - 1));
            line += ASCII_PALETTE[charIndex];
        }
        lines.push(line.replace(/\s+$/g, ''));
    }

    return lines.join('\n');
}

function applyFinalResult(result) {
    state.smooth.power = result.power;
    state.smooth.rarity = result.rarityRaw;
    state.smooth.confidence = result.confidence;
    for (const key of FEATURE_KEYS) {
        state.smooth.features[key] = result.features[key];
    }
    renderUi();

    el.scanSummary.textContent = `最新スキャン: ${formatDateTime(result.createdAt)}`;
    el.asciiArt.textContent = result.ascii;
}

function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
}

function loadHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        state.history = Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
    } catch (error) {
        state.history = [];
    }

    renderHistory();
}

function addHistoryResult(result) {
    state.history.unshift({
        id: result.id,
        createdAt: result.createdAt,
        power: result.power,
        confidence: result.confidence,
        rarityLabel: result.rarityLabel,
        rarityClass: result.rarityClass,
        ascii: result.ascii,
    });

    if (state.history.length > HISTORY_LIMIT) {
        state.history = state.history.slice(0, HISTORY_LIMIT);
    }

    saveHistory();
    renderHistory();
}

function renderHistory() {
    el.historyList.innerHTML = '';

    if (!state.history.length) {
        const p = document.createElement('p');
        p.className = 'history-empty';
        p.textContent = '保存された結果はまだありません。';
        el.historyList.appendChild(p);
        return;
    }

    for (const item of state.history) {
        const card = document.createElement('article');
        card.className = 'history-item';

        const head = document.createElement('div');
        head.className = 'history-head';

        const time = document.createElement('span');
        time.className = 'history-time';
        time.textContent = formatDateTime(item.createdAt);

        const rarity = document.createElement('span');
        rarity.className = `history-rarity rarity ${item.rarityClass || 'common'}`;
        rarity.textContent = item.rarityLabel || 'COMMON';

        head.appendChild(time);
        head.appendChild(rarity);

        const meta = document.createElement('p');
        meta.className = 'history-meta';
        meta.textContent = `戦闘力 ${Number(item.power || 0).toLocaleString('ja-JP')} / 信頼度 ${Math.round((item.confidence || 0) * 100)}%`;

        const ascii = document.createElement('pre');
        ascii.className = 'history-ascii';
        ascii.textContent = item.ascii || 'ASCII生成なし';

        card.appendChild(head);
        card.appendChild(meta);
        card.appendChild(ascii);
        el.historyList.appendChild(card);
    }
}

function finalizeScan(reason = 'timeout') {
    if (!state.scan.active || state.scan.finalizing) {
        return;
    }

    state.scan.finalizing = true;
    clearScanTicker();

    const result = buildScanResult();
    stopCamera({ keepStatus: true });

    state.scan.active = false;
    state.scan.finalizing = false;
    setScanProgress(1);

    if (result) {
        applyFinalResult(result);
        addHistoryResult(result);
        setStatus(`スキャン完了: ${result.rarityLabel} / 戦闘力 ${result.power.toLocaleString('ja-JP')}`);
    } else {
        setStatus('スキャン完了: 人物検出が十分に行えませんでした。');
    }

    if (reason === 'manual') {
        setCountdown('手動停止で終了');
    } else if (reason === 'orientation') {
        setCountdown('向き変更で終了');
    } else {
        setCountdown('スキャン完了');
    }

    updateActionButtons();
}

function handleStopRequest() {
    if (state.scan.active) {
        finalizeScan('manual');
        return;
    }

    stopCamera();
}

function bindEvents() {
    el.startCamera.addEventListener('click', startTimedScan);
    el.stopCamera.addEventListener('click', handleStopRequest);
    el.resetBaseline.addEventListener('click', resetBaseline);

    el.cameraFacing.addEventListener('change', (event) => {
        state.facingMode = event.target.value;
    });

    el.scanDuration.addEventListener('change', () => {
        updateStartButtonLabel();
    });

    window.addEventListener('orientationchange', () => {
        if (state.scan.active) {
            finalizeScan('orientation');
        }
    });

    window.addEventListener('beforeunload', () => {
        stopCamera({ keepStatus: true });
    });
}

async function bootstrap() {
    bindEvents();
    await initPoseModel();
    setCameraVisibility(false);
    setCountdown('待機中');
    setScanProgress(0);
    updateStartButtonLabel();
    updateActionButtons();
    loadHistory();
    renderUi();
}

bootstrap();
