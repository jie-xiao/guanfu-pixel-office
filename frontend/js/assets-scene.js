/* Asset Scene Helpers - split from assets.js */

function pathToTextureCandidates(path) {
    const file = (path || '').split('/').pop() || '';
    const stem = file.replace(/\.[^.]+$/, '');
    const map = {
        'office_bg_small': 'office_bg',
        'star-idle-v5': 'star_idle',
        'sofa-idle-v3': 'sofa_idle',
        'sofa-shadow-v1': 'sofa_shadow',
        'plants-spritesheet': 'plants',
        'posters-spritesheet': 'posters',
        'coffee-machine-v3-grid': 'coffee_machine',
        'coffee-machine-shadow-v1': 'coffee_machine_shadow',
        'serverroom-spritesheet': 'serverroom',
        'error-bug-spritesheet-grid': 'error_bug',
        'cats-spritesheet': 'cats',
        'desk-v3': 'desk_v2',
        'desk': 'desk',
        'star-working-spritesheet-grid': 'star_working',
        'sync-animation-v3-grid': 'sync_anim',
        'memo-bg': 'memo_bg',
        'flowers-bloom-v2': 'flowers',
    };
    const cands = [];
    if (map[stem]) cands.push(map[stem]);
    cands.push(stem.replace(/-/g, '_'));
    cands.push(stem);
    return [...new Set(cands)];
}


function getCurrentScene() {
    if (!game) return null;
    if (game.children && game.add) return game;
    if (game.scene && game.scene.scenes && game.scene.scenes.length) return game.scene.scenes[0];
    return null;
}


function getSceneChildren() {
    const scene = getCurrentScene();
    return (scene && scene.children && scene.children.list) ? scene.children.list : [];
}


function resolveAssetPathByTextureKey(key) {
    if (!key) return null;
    const keyToStem = {
        office_bg: 'office_bg_small',
        star_idle: 'star-idle-v5',
        sofa_idle: 'sofa-idle-v3',
        sofa_shadow: 'sofa-shadow-v1',
        plants: 'plants-spritesheet',
        posters: 'posters-spritesheet',
        coffee_machine: 'coffee-machine-v3-grid',
        coffee_machine_shadow: 'coffee-machine-shadow-v1',
        serverroom: 'serverroom-spritesheet',
        error_bug: 'error-bug-spritesheet-grid',
        cats: 'cats-spritesheet',
        desk_v2: 'desk-v3',
        desk: 'desk',
        star_working: 'star-working-spritesheet-grid',
        sync_anim: 'sync-animation-v3-grid',
        memo_bg: 'memo-bg',
        flowers: 'flowers-bloom-v2',
    };
    const stem = keyToStem[key] || key.replace(/_/g, '-');
    const cands = assetListData.filter(it => (it.path || '').includes(stem + '.'));
    const extPriority = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.avif'];
    for (const ext of extPriority) {
        const hit = cands.find(it => (it.path || '').endsWith(ext));
        if (hit) return hit.path;
    }
    return cands[0]?.path || null;
}


function buildSceneAssetItems() {
    const children = getSceneChildren();
    const byKey = new Map();
    for (const ch of children) {
        const key = ch && ch.texture && ch.texture.key;
        if (!key) continue;
        if (!byKey.has(key)) byKey.set(key, ch);
    }
    const items = [];
    for (const [key, ref] of byKey.entries()) {
        const path = resolveAssetPathByTextureKey(key);
        if (!path) continue;
        const meta = assetListData.find(x => x.path === path) || {};
        items.push({ id: `k:${key}`, key, path, ref, ext: meta.ext || '', size: meta.size || 0, width: meta.width || null, height: meta.height || null });
    }
    sceneAssetItems = items.sort((a, b) => a.key.localeCompare(b.key));
}


function mapAssetPathToSprite(path) {
    // 背景做特殊映射：即使纹理 key 已变成 office_bg_live_xxx，也能稳定定位到背景对象
    if ((path || '').includes('office_bg_small.webp') && officeBgSprite) return officeBgSprite;

    const item = sceneAssetItems.find(x => x.path === path && x.ref && x.ref.getBounds);
    if (item) return item.ref;
    const cands = pathToTextureCandidates(path);
    const children = getSceneChildren();
    for (const ch of children) {
        const key = ch && ch.texture && ch.texture.key;
        if (key && cands.includes(key)) return ch;
    }
    return null;
}


function highlightSpriteByAssetPath(path) {
    const hl = document.getElementById('asset-highlight');
    if (!hl || !game || !game.canvas) return false;
    const sp = mapAssetPathToSprite(path);
    if (!sp || !sp.getBounds) {
        hl.style.display = 'none';
        return false;
    }
    const b = sp.getBounds();
    const canvasRect = game.canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / config.width;
    const scaleY = canvasRect.height / config.height;
    hl.style.display = 'block';
    hl.style.left = (canvasRect.left + b.x * scaleX) + 'px';
    hl.style.top = (canvasRect.top + b.y * scaleY) + 'px';
    hl.style.width = Math.max(24, b.width * scaleX) + 'px';
    hl.style.height = Math.max(24, b.height * scaleY) + 'px';
    return true;
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



function getLiveFrameSizeByAssetPath(path) {
    try {
        const sprite = mapAssetPathToSprite(path);
        if (sprite && sprite.frame) {
            const w = Number(sprite.frame.width || 0);
            const h = Number(sprite.frame.height || 0);
            if (w > 0 && h > 0) return { w, h };
        }
    } catch (e) {}
    return null;
}

function saveAssetPositionOverrides() { /* deprecated: backend only */ }

async function applySavedPositionOverrides() {
    try {
        // 优先：后端持久化坐标；回退：后端默认坐标；最后：本地内存覆盖
        let serverPositions = {};
        let serverDefaults = {};
        try {
            const res = await fetch('/assets/positions?t=' + Date.now(), { cache: 'no-store' });
            const data = await res.json();
            if (data && data.ok && data.items) serverPositions = data.items;
        } catch (e) {}
        try {
            const res2 = await fetch('/assets/defaults?t=' + Date.now(), { cache: 'no-store' });
            const data2 = await res2.json();
            if (data2 && data2.ok && data2.items) serverDefaults = data2.items;
        } catch (e) {}

        const children = getSceneChildren();
        for (const ch of children) {
            const texKey = ch?.texture?.key;
            if (!texKey) continue;

            // 先尝试资产路径命中（推荐持久化键，优先级最高）
            const assetPath = resolveAssetPathByTextureKey(texKey);
            let ov = null;
            if (assetPath) {
                ov = serverPositions[assetPath] || serverDefaults[assetPath] || assetPositionOverrides[assetPath];
            }

            // 再尝试 textureKey 命中（兼容旧数据）
            if (!ov) {
                ov = serverPositions[texKey] || serverDefaults[texKey] || assetPositionOverrides[texKey];
            }

            // 最后按 stem 模糊匹配（处理 webp/png 或 live key 差异）
            if (!ov) {
                const stem = toAssetStem(assetPath || texKey);
                const hitKey = Object.keys(serverPositions).find(k => toAssetStem(k) === stem)
                    || Object.keys(serverDefaults).find(k => toAssetStem(k) === stem)
                    || Object.keys(assetPositionOverrides).find(k => toAssetStem(k) === stem);
                if (hitKey) ov = serverPositions[hitKey] || serverDefaults[hitKey] || assetPositionOverrides[hitKey];
            }

            if (!ov) continue;
            const x = Number(ov.x), y = Number(ov.y), sc = Number(ov.scale || 1);
            if (Number.isFinite(x) && Number.isFinite(y)) {
                ch.x = x;
                ch.y = y;
                if (Number.isFinite(sc) && sc > 0 && ch.setScale) ch.setScale(sc);
            }
        }
    } catch (e) {}
}

function clearAssetThumbTimers() {
    assetThumbTimers.forEach(t => clearInterval(t));
    assetThumbTimers = [];
}


function inferSpritesheetFrameMetaByPath(path) {
    const p = (path || '').toLowerCase();
    if (!p) return null;
    // 优先用文件命名约定推断（不写死具体尺寸）
    if (p.includes('spritesheet') || p.includes('sprite-sheet') || p.includes('sheet') || p.includes('anim') || p.includes('grid')) {
        return { w: null, h: null };
    }
    return null;
}


function getSpritesheetFrameMeta(item) {
    // 先看命名是否属于精灵表
    const inferred = inferSpritesheetFrameMetaByPath(item?.path || '');
    if (!inferred) return null;
    // 仅返回"是精灵表"的信号，单帧尺寸后续自动推断
    return { w: null, h: null, isSheet: true };
}


function guessThumbFrameSize(fullW, fullH, path = '') {
    const p = (path || '').toLowerCase();
    // 常见核心资产优先用显式提示（避免误判）
    const hints = [
        [/star-working-spritesheet-grid\.webp$/, 300, 300],
        [/star-idle-v5\.(webp|png)$/, 256, 256],
        [/sync-animation-v3-grid\.webp$/, 256, 256],
        [/error-bug-spritesheet-grid\.webp$/, 220, 220],
        [/flowers-bloom-v2\.webp$/, 128, 128],
        [/plants-spritesheet\.webp$/, 160, 160]
    ];
    for (const [re, fw, fh] of hints) {
        if (re.test(p) && fullW % fw === 0 && fullH % fh === 0) return { fw, fh };
    }

    // 通用推断：枚举可整除候选，偏好 cols≈8、帧尺寸适中、近似方形
    const divisors = (n) => {
        const arr = [];
        for (let i = 1; i * i <= n; i++) {
            if (n % i === 0) {
                arr.push(i);
                if (i * i !== n) arr.push(n / i);
            }
        }
        return arr.sort((a, b) => a - b);
    };
    const fwCand = divisors(fullW).filter(v => v >= 48 && v <= 512);
    const fhCand = divisors(fullH).filter(v => v >= 48 && v <= 512);
    let best = null;
    for (const fw of fwCand) {
        for (const fh of fhCand) {
            const cols = fullW / fw;
            const rows = fullH / fh;
            if (!Number.isInteger(cols) || !Number.isInteger(rows)) continue;
            const frames = cols * rows;
            if (frames <= 1 || cols < 2 || rows < 1) continue;
            let score = 0;
            if (cols === 8) score += 120;
            else if (cols >= 4 && cols <= 10) score += 45;
            if (rows >= 1 && rows <= 10) score += 25;
            score += Math.min(frames, 120) * 0.8;
            score -= Math.abs(fw - fh) * 0.12;
            if (fw === fullW || fh === fullH) score -= 80;
            if (!best || score > best.score) best = { fw, fh, score };
        }
    }
    return best ? { fw: best.fw, fh: best.fh } : null;
}


function tryAnimateAssetThumb(item) {
    if (!item) return;
    const canvas = document.getElementById(`asset-thumb-canvas-${(item.path || '').replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
        const fullW = img.naturalWidth || img.width;
        const fullH = img.naturalHeight || img.height;
        const meta = getSpritesheetFrameMeta(item);
        if (!meta) return;
        const guessed = guessThumbFrameSize(fullW, fullH, item?.path || '');
        if (!guessed) return;
        const fw = guessed.fw;
        const fh = guessed.fh;

        // 判断是否可能是精灵表：整图宽高至少是单帧的整数倍，且总帧数>1
        const cols = Math.floor(fullW / fw);
        const rows = Math.floor(fullH / fh);
        const frames = cols * rows;
        if (cols < 1 || rows < 1 || frames <= 1) return;

        let idx = 0;
        const draw = () => {
            const cx = (idx % cols) * fw;
            const cy = Math.floor(idx / cols) * fh;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, cx, cy, fw, fh, 0, 0, canvas.width, canvas.height);
            idx = (idx + 1) % frames;
        };
        draw();
        const timer = setInterval(draw, 120);
        assetThumbTimers.push(timer);
    };
    img.src = `/static/${item.path}?t=${Date.now()}`;
}


async function renderHomeFavorites(force = false) {
    const box = document.getElementById('asset-home-favorites-list');
    if (!box) return;
    const now = Date.now();
    if (!force && homeFavoritesCache.length > 0 && (now - homeFavoritesLoadedAt) < 30000) {
        // 使用缓存，避免频繁请求
    } else {
        try {
            const data = await fetchJsonSafe('/assets/home-favorites/list', { cache: 'no-store' });
            if (data && data.ok && Array.isArray(data.items)) {
                homeFavoritesCache = data.items;
                homeFavoritesLoadedAt = now;
            }
        } catch (e) {
            const out = document.getElementById('asset-move-result') || document.getElementById('asset-upload-result');
            if (out) out.textContent = `❌ 收藏列表加载失败：${e.message || e}`;
        }
    }

    if (!homeFavoritesCache.length) {
        box.innerHTML = `<div class="asset-sub" style="padding:4px 2px;">${t('homeFavEmpty')}</div>`;
        return;
    }

    box.innerHTML = homeFavoritesCache.map((it) => {
        const id = (it.id || '').replace(/'/g, "\\'");
        const thumb = it.thumb_url || it.url || '';
        const time = it.created_at || '';
        return `<div class="home-fav-item">
            <img src="${thumb}" loading="lazy" alt="favorite-home" />
            <div class="home-fav-meta">${time}</div>
            <button onclick="applyHomeFavorite('${id}')">${t('homeFavApply')}</button>
            <button class="home-fav-del" onclick="deleteHomeFavorite('${id}')">${t('homeFavDelete')}</button>
        </div>`;
    }).join('');
}

async function saveCurrentHomeFavorite() {
    const btn = document.getElementById('btn-favorite-home');
    flashButtonActive(btn);
    const out = document.getElementById('asset-move-result') || document.getElementById('asset-upload-result');
    try {
        const data = await fetchJsonSafe('/assets/home-favorites/save-current', { method: 'POST' });
        if (!data.ok) {
            out.textContent = `❌ 收藏失败：${data.msg || 'unknown error'}`;
            return;
        }
        out.textContent = t('homeFavSaved');
        await renderHomeFavorites(true);
    } catch (e) {
        out.textContent = `❌ 收藏失败：${e.message || e}`;
    }
}


async function applyHomeFavorite(id) {
    const out = document.getElementById('asset-move-result') || document.getElementById('asset-upload-result');
    if (!id) return;
    showRoomLoadingOverlay();
    setWorkingStatus('正在替换收藏地图');
    try {
        const data = await fetchJsonSafe('/assets/home-favorites/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if (!data.ok) {
            out.textContent = `❌ 替换失败：${data.msg || 'unknown error'}`;
            return;
        }
        const ok = await refreshOfficeBackgroundOnly();
        out.textContent = ok ? t('homeFavApplied') : `${t('homeFavApplied')}（局部刷新失败，可手动刷新页面）`;
        try { setState('idle', '已应用收藏地图'); } catch (e) {}
    } catch (e) {
        out.textContent = `❌ 替换失败：${e.message || e}`;
    } finally {
        hideRoomLoadingOverlay();
    }
}


async function deleteHomeFavorite(id) {
    const out = document.getElementById('asset-move-result') || document.getElementById('asset-upload-result');
    if (!id) return;
    if (!window.confirm('确定删除这个收藏吗？删除后不可恢复。')) return;
    try {
        const data = await fetchJsonSafe('/assets/home-favorites/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if (!data.ok) {
            out.textContent = `❌ 删除失败：${data.msg || 'unknown error'}`;
            return;
        }
        out.textContent = t('homeFavDeleted');
        await renderHomeFavorites(true);
    } catch (e) {}
}

async function ensureGeminiConfigLoaded() {
    try {
        const authRes = await fetch('/assets/auth/status', { cache: 'no-store' });
        const authData = await authRes.json();
        assetDrawerAuthed = !!(authData && authData.ok && authData.authed);
        updateAssetAuthUI();
        if (!assetDrawerAuthed) return;

        const res = await fetch('/config/gemini', { cache: 'no-store' });
        const data = await res.json();
        if (data && data.ok) {
            window.geminiConfig = {
                hasKey: !!data.has_api_key,
                model: data.gemini_model || 'nanobanana-pro'
            };
            const box = document.getElementById('asset-gemini-config');
            if (box) box.style.display = 'block';
            const ms = document.getElementById('gemini-mask-status');
            if (ms) {
                ms.textContent = data.has_api_key
                    ? `${t('geminiMaskHasKey')} ${data.api_key_masked || ''}`
                    : t('geminiMaskNoKey');
            }
        }
    } catch (e) {}
}

async function saveGeminiConfigFromUI() {
    const input = document.getElementById('gemini-api-key-input');
    const msg = document.getElementById('gemini-config-msg');
    const key = (input?.value || '').trim();
    if (!key) {
        if (msg) msg.textContent = '请输入有效 API Key';
        return;
    }
    try {
        const res = await fetch('/config/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: key, model: 'nanobanana-pro' })
        });
        const data = await res.json();
        if (!data.ok) {
            if (msg) msg.textContent = `保存失败：${data.msg || res.status}`;
            return;
        }
        if (msg) msg.textContent = '✅ 已保存，可重新点击搬家/中介';
        const box = document.getElementById('asset-gemini-config');
        if (box) box.style.display = 'none';
        await ensureGeminiConfigLoaded();
    } catch (e) {
        if (msg) msg.textContent = `保存失败：${e}`;
    }
}
