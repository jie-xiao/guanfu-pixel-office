/* Utility Functions - extracted from index.html */

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatSizeHuman(n) {
    if (!n) return '0 KB';
    if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
    return (n / 1024).toFixed(1) + ' KB';
}

function toAssetStem(v) {
    const s = (v || '').toLowerCase();
    const file = s.split('/').pop() || s;
    return file.replace(/\.[^.]+$/, '');
}

function getAssetDisplayName(path) {
    const stem = toAssetStem(path);
    const lang = (uiLang || 'zh');
    const globalMap = window.ASSET_DISPLAY_NAME_MAP || {};
    const langMap = globalMap[lang] || globalMap.zh || {};
    return langMap[stem] || stem;
}


function getAssetHelpText(path) {
    const stem = toAssetStem(path);
    const lang = (uiLang || 'zh');
    const globalMap = window.ASSET_HELP_TEXT_MAP || {};
    const map = globalMap[lang] || globalMap.zh || {};
    return map[stem] || t('assetHintDefault');
}

function formatRelativeTime(isoString) {
    if (!isoString) return '未知';
    try {
        const diff = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '刚刚';
        if (mins < 60) return mins + '分钟';
        const hours = Math.floor(mins / 60);
        if (hours < 24) return hours + '小时';
        return Math.floor(hours / 24) + '天前';
    } catch (e) { return '未知'; }
}

async function fetchJsonSafe(url, options = {}) {
    const res = await fetch(url, options);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
        const txt = await res.text();
        const brief = (txt || '').replace(/\s+/g, ' ').slice(0, 120);
        throw new Error(`接口未返回JSON: ${res.status}: ${brief || 'empty response'}`);
    }
    return await res.json();
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPointInRect(rect) {
    return { x: randomInt(rect.x1, rect.x2), y: randomInt(rect.y1, rect.y2) };
}

function getAreaRect(area) {
    const rects = {
        breakroom: { x1: 511, y1: 262, x2: 841, y2: 621 },
        writing:   { x1: 190, y1: 526, x2: 380, y2: 683 },
        error:     { x1: 932, y1: 275, x2: 1109, y2: 327 }
    };
    return rects[area] || rects.breakroom;
}

function getAreaPoint(area, idx) {
    const map = {
        breakroom: [
            { x: 511, y: 262 }, { x: 841, y: 621 }, { x: 690, y: 470 }, { x: 600, y: 340 },
            { x: 770, y: 540 }, { x: 550, y: 420 }, { x: 720, y: 310 }, { x: 650, y: 580 }
        ],
        writing: [
            { x: 190, y: 526 }, { x: 380, y: 683 }, { x: 300, y: 610 }, { x: 240, y: 570 },
            { x: 350, y: 640 }, { x: 160, y: 600 }, { x: 420, y: 560 }, { x: 280, y: 660 }
        ],
        error: [
            { x: 932, y: 275 }, { x: 1109, y: 327 }, { x: 1020, y: 305 }, { x: 960, y: 340 },
            { x: 1070, y: 280 }, { x: 990, y: 260 }, { x: 1050, y: 350 }, { x: 940, y: 310 }
        ]
    };
    const arr = map[area] || map.breakroom;
    return arr[idx % arr.length];
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function clampCameraScroll(camera, maxX, maxY) {
    if (!camera) return;
    camera.scrollX = clamp(camera.scrollX, 0, maxX);
    camera.scrollY = clamp(camera.scrollY, 0, maxY);
}

function applyMobileCameraFit(camera, MAP_W, MAP_H) {
    if (!camera || !IS_TOUCH_DEVICE) return;
    const h = Math.max(1, camera.height);
    const w = Math.max(1, camera.width);
    const candidateZoom = h / MAP_H;
    const viewW = w / candidateZoom;
    const maxX = Math.max(0, MAP_W - viewW);
    camera.setZoom(candidateZoom);
    camera.scrollX = Math.min(camera.scrollX, maxX);
    camera.scrollY = 0;
    camera.scrollX = clamp(camera.scrollX, 0, maxX);
    camera.scrollY = 0;
}

function setPanEnabled(enabled, panToggle, camera, config) {
    const on = !!enabled;
    if (panToggle) {
        panToggle.dataset.on = on ? '1' : '0';
        panToggle.textContent = on ? t('lockView') : t('moveView');
        panToggle.style.background = on ? '#e94560' : '#333';
    }
    if (typeof game !== 'undefined' && game.input) {
        game.input.setDefaultCursor(on ? 'grab' : 'default');
    }
}

function drawSelectionBoxOnScene(path) {
    const scene = getCurrentScene();
    if (!scene) return false;
    const sp = mapAssetPathToSprite(path);
    if (!sp || !sp.getBounds) {
        if (selectionBoxGraphics) selectionBoxGraphics.setVisible(false);
        return false;
    }
    if (!selectionBoxGraphics) selectionBoxGraphics = scene.add.graphics();
    const b = sp.getBounds();
    selectionBoxGraphics.clear();
    selectionBoxGraphics.lineStyle(4, 0x22c55e, 1);
    selectionBoxGraphics.strokeRect(b.x, b.y, b.width, b.height);
    selectionBoxGraphics.setDepth(999999);
    selectionBoxGraphics.setVisible(true);
    return true;
}

function placeOverlayAndStatusAtCanvasBottomLeft() {
    const canvasEl = game?.canvas || document.querySelector('#game-container canvas');
    const fallbackBox = document.getElementById('game-container');
    const rect = canvasEl?.getBoundingClientRect?.() || fallbackBox?.getBoundingClientRect?.();

    // loading 遮罩
    const overlay = document.getElementById('room-loading-overlay');
    if (overlay) {
        if (!rect || !(rect.width > 0 && rect.height > 0)) {
            overlay.style.left = '0px';
            overlay.style.top = '0px';
            overlay.style.width = window.innerWidth + 'px';
            overlay.style.height = window.innerHeight + 'px';
        } else {
            overlay.style.left = rect.left + 'px';
            overlay.style.top = rect.top + 'px';
            overlay.style.width = rect.width + 'px';
            overlay.style.height = rect.height + 'px';
        }
    }

    // detail/status 严格限制在画布内部左下角
    const st = document.getElementById('status-text');
    const gameContainer = document.getElementById('game-container');
    if (st && gameContainer) {
        if (rect && rect.width > 0 && rect.height > 0) {
            const localLeft = Math.max(8, Math.round(rect.left - gameContainer.getBoundingClientRect().left + 14));
            const localBottom = 14;
            st.style.left = localLeft + 'px';
            st.style.bottom = localBottom + 'px';
            st.style.maxWidth = Math.max(120, Math.floor(rect.width - 28)) + 'px';
        } else {
            st.style.left = '14px';
            st.style.bottom = '14px';
            st.style.maxWidth = 'calc(100% - 28px)';
        }
    }
}

function flashButtonActive(el, ms = 180) {
    if (!el) return;
    el.classList.add('is-active');
    setTimeout(() => el.classList.remove('is-active'), ms);
}

function setButtonDone(el, holdMs = 1200) {
    if (!el) return;
    el.classList.remove('is-active');
    el.classList.add('is-done');
    setTimeout(() => el.classList.remove('is-done'), holdMs);
}

function showToast(message, color = '#4caf50') {
    // 动画样式（幂等注入）
    if (!document.getElementById('toast-anim-style')) {
        const s = document.createElement('style');
        s.id = 'toast-anim-style';
        s.textContent = `@keyframes fadeInOut {0%{opacity:0;transform:translate(-50%,-20px)}15%{opacity:1;transform:translate(-50%,0)}85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-20px)}}`;
        document.head.appendChild(s);
    }
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed;top:20%;left:50%;transform:translateX(-50%);
        background:${color};color:white;padding:12px 24px;border-radius:8px;
        font-family:'ArkPixel',monospace;font-size:14px;z-index:1000050;
        box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:fadeInOut 2s ease forwards;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

let roomLoadingTimer = null;
let roomLoadingIndex = 0;
let roomLoadingEmojiIndex = 0;

function showRoomLoadingOverlay(baseText) {
    const overlay = document.getElementById('room-loading-overlay');
    const textEl = document.getElementById('room-loading-text');
    const emojiEl = document.getElementById('room-loading-emoji');
    if (!overlay || !textEl || !emojiEl) return;

    placeOverlayAndStatusAtCanvasBottomLeft();
    const loadingTexts = {
        zh: [
            '正在打包今天的灵感行李…', '正在抽取下一站数字坐标…', '正在查看本次漂流目的地…',
            '正在把办公室折叠成随身模式…', '正在给钳子装上远征Buff…', '正在匹配下一段创作气候…',
            '正在把时差调成冒险模式…', '正在接收陌生街区Wi-Fi心跳…', '正在试播下一站的海风BGM…',
            '正在加载"也许会爱上的"新房间…', '正在为未知邻居准备自我介绍…', '正在解锁下一片数字海域…',
            '正在把好奇心调到满格…', '正在等待旅程投递下一张门牌号…'
        ],
        en: [
            'Packing today\'s luggage of inspiration…', 'Drawing the digital coordinates for the next stop…',
            'Checking the destination of this drift…', 'Folding the office into portable mode…',
            'Installing a travel buff on the claws…', 'Matching the creative climate for the next chapter…',
            'Switching the time zone to adventure mode…', 'Receiving Wi-Fi heartbeats from an unfamiliar block…',
            'Previewing the sea-breeze BGM of the next stop…', 'Loading a new room you might just fall in love with…',
            'Preparing an intro for unknown neighbors…', 'Unlocking the next digital sea…',
            'Turning curiosity up to max…', 'Waiting for the journey to deliver the next door number…'
        ],
        ja: [
            '今日のひらめき荷物を梱包しています…', '次の目的地のデジタル座標を抽出しています…',
            '今回の漂流先を確認しています…', 'オフィスを携帯モードに折りたたんでいます…',
            'ハサミに遠征Buffを装着しています…', '次の創作区間の気候をマッチングしています…',
            '時差を冒険モードに切り替えています…', '見知らぬ街区Wi-Fiハートビートを受信しています…',
            '次の目的地の潮風BGMを試聴しています…', '「好きになるかもしれない」新しい部屋を読み込んでいます…',
            '未知のご近所さん向けに自己紹介を準備しています…', '次のデジタル海域をアンロックしています…',
            '好奇心を最大値まで上げています…', '旅が次の番地を届けるのを待っています…'
        ]
    };
    const steps = loadingTexts[uiLang] || loadingTexts.zh;
    const emojis = ['🦞','🦀','🦐','🦑','🐙','🐟','🐠','🐡','🦪','🍣','🍤','🍱','🍲','🍜','🍝','🌊','🐚','🪸'];

    roomLoadingIndex = 0;
    roomLoadingEmojiIndex = 0;
    textEl.textContent = baseText || steps[0];
    emojiEl.textContent = emojis[0];
    overlay.style.display = 'flex';
    if (roomLoadingTimer) clearInterval(roomLoadingTimer);
    roomLoadingTimer = setInterval(() => {
        roomLoadingIndex = (roomLoadingIndex + 1) % steps.length;
        roomLoadingEmojiIndex = (roomLoadingEmojiIndex + 1) % emojis.length;
        textEl.textContent = steps[roomLoadingIndex];
        emojiEl.textContent = emojis[roomLoadingEmojiIndex];
    }, 900);
}

function hideRoomLoadingOverlay() {
    const overlay = document.getElementById('room-loading-overlay');
    if (roomLoadingTimer) {
        clearInterval(roomLoadingTimer);
        roomLoadingTimer = null;
    }
    if (overlay) overlay.style.display = 'none';
}

async function loadMemo() {
    const memoDate = document.getElementById('memo-date');
    const memoContent = document.getElementById('memo-content');
    try {
        const response = await fetch('/yesterday-memo?t=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        if (data.success && data.memo) {
            memoDate.textContent = data.date || '';
            memoContent.innerHTML = data.memo.replace(/\n/g, '<br>');
        } else {
            memoContent.innerHTML = '<div id="memo-placeholder">暂无昨日日记</div>';
        }
    } catch (e) {
        console.error('加载 memo 失败:', e);
        memoContent.innerHTML = '<div id="memo-placeholder">加载失败</div>';
    }
}

function showCatBubble() {
    if (!window.catSprite) return;
    if (window.catBubble) { window.catBubble.destroy(); window.catBubble = null; }
    const texts = getBubbleTextsByState('cat');
    const text = texts[Math.floor(Math.random() * texts.length)];
    const anchorX = window.catSprite.x;
    const anchorY = window.catSprite.y - 60;
    const bg = game.add.rectangle(anchorX, anchorY, text.length * 10 + 20, 24, 0xfffbeb, 0.95);
    bg.setStrokeStyle(2, 0xd4a574);
    const txt = game.add.text(anchorX, anchorY, text, { fontFamily: 'ArkPixel, monospace', fontSize: '11px', fill: '#8b6914', align: 'center' }).setOrigin(0.5);
    window.catBubble = game.add.container(0, 0, [bg, txt]);
    window.catBubble.setDepth(2100);
    setTimeout(() => { if (window.catBubble) { window.catBubble.destroy(); window.catBubble = null; } }, 4000);
}

// WebP support detection
function checkWebPSupport() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
            resolve(canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
        } else {
            resolve(false);
        }
    });
}

function checkWebPSupportFallback() {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = 'data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQADADQlpAADcAD++/1QAA==';
    });
}

// Loading / skeleton functions
function hideGameSkeleton() {
    const sk = document.getElementById('game-skeleton');
    if (!sk) return;
    sk.style.transition = 'opacity 0.25s ease';
    sk.style.opacity = '0';
    setTimeout(() => {
        if (sk && sk.parentNode) sk.parentNode.removeChild(sk);
    }, 260);
}

function hideLoadingOverlay() {
    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.style.transition = 'opacity 0.35s ease';
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 360);
        }
    }, 80);
}

function updateLoadingProgress() {
    loadedAssets++;
    const percent = Math.min(100, Math.round((loadedAssets / totalAssets) * 100));
    if (loadingProgressBar) {
        loadingProgressBar.style.width = percent + '%';
    }
    if (loadingText) {
        renderBootLoadingText(percent);
    }
}

// Game control functions
function moveStar(time) {
    const effectiveState = pendingDesiredState || currentState;
    const stateInfo = STATES[effectiveState] || STATES.idle;
    const baseTarget = areas[stateInfo.area] || areas.breakroom;

    if (effectiveState === 'idle') {
        if (star && star.visible) {
            star.setPosition(IDLE_SOFA_ANCHOR.x, IDLE_SOFA_ANCHOR.y);
        }
        isMoving = false;
        return;
    }

    const dx = targetX - star.x;
    const dy = targetY - star.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 1.4;
    const wobble = Math.sin(time / 200) * 0.8;

    if (dist > 3) {
        star.x += (dx / dist) * speed;
        star.y += (dy / dist) * speed;
        star.setY(star.y + wobble);
        isMoving = true;
    } else {
        if (waypoints && waypoints.length > 0) {
            waypoints.shift();
            if (waypoints.length > 0) {
                targetX = waypoints[0].x;
                targetY = waypoints[0].y;
                isMoving = true;
            } else {
                if (pendingDesiredState !== null) {
                    isMoving = false;
                    currentState = pendingDesiredState;
                    pendingDesiredState = null;
                    if (currentState === 'idle') {
                        if (window.starWorking) { window.starWorking.setVisible(false); window.starWorking.anims.stop(); }
                        star.setVisible(true);
                        star.setScale(IDLE_STAR_SCALE);
                        star.anims.play('star_idle', true);
                        star.setPosition(IDLE_SOFA_ANCHOR.x, IDLE_SOFA_ANCHOR.y);
                        if (sofa) { sofa.anims.stop(); sofa.setTexture('sofa_idle'); }
                    } else {
                        star.setVisible(false);
                        star.anims.stop();
                        if (window.starWorking) { window.starWorking.setVisible(true); window.starWorking.anims.play('star_working', true); }
                    }
                }
            }
        } else {
            if (pendingDesiredState !== null) {
                isMoving = false;
                currentState = pendingDesiredState;
                pendingDesiredState = null;
                if (currentState === 'idle') {
                    if (window.starWorking) { window.starWorking.setVisible(false); window.starWorking.anims.stop(); }
                    star.setVisible(true);
                    star.setScale(IDLE_STAR_SCALE);
                    star.anims.play('star_idle', true);
                    star.setPosition(IDLE_SOFA_ANCHOR.x, IDLE_SOFA_ANCHOR.y);
                    if (sofa) { sofa.anims.stop(); sofa.setTexture('sofa_idle'); }
                } else {
                    star.setVisible(false);
                    star.anims.stop();
                    if (window.starWorking) { window.starWorking.setVisible(true); window.starWorking.anims.play('star_working', true); }
                    if (sofa) { sofa.anims.stop(); sofa.setTexture('sofa_idle'); }
                }
            }
        }
    }
}

function setWorkingStatus(detail = '工作中') {
    try { setState('writing', detail); } catch (e) {}
}

// State normalization
function normalizeState(s) {
    if (!s) return 'idle';
    const ss = s.toLowerCase();
    if (ss === 'writing' || ss === 'researching' || ss === 'executing' || ss === 'syncing') return ss;
    return 'idle';
}

// Bubble text helper
function getBubbleTextsByState(stateKey) {
    const langPack = BUBBLE_TEXTS[uiLang] || BUBBLE_TEXTS.zh;
    return langPack[stateKey] || langPack.idle || [];
}

// Effect name helper
function getEffectName(effect) {
    const names = {
        'energy': '能量', 'happy': '快乐', 'social': '社交',
        'luck': '幸运', 'relax': '放松', 'focus': '专注', 'health': '健康'
    };
    return names[effect] || effect;
}

// State variables exposed for game.js access
let showCoords = false;
let loadingProgressBar, loadingProgressContainer, loadingOverlay, loadingText;
