/* Background Generation & RPG - extracted from index.html */

// ========== State Variables ==========
let isMoving = false;
let waypoints = []; // list of (x,y) to walk through in order
let lastWanderAt = 0;

let roomLoadingTimer = null;
let roomLoadingIndex = 0;
let roomLoadingEmojiIndex = 0;

// ========== Room Loading Overlay ==========
function showRoomLoadingOverlay(baseText) {
    const overlay = document.getElementById('room-loading-overlay');
    const textEl = document.getElementById('room-loading-text');
    const emojiEl = document.getElementById('room-loading-emoji');
    if (!overlay || !textEl || !emojiEl) return;

    placeOverlayAndStatusAtCanvasBottomLeft();
    const loadingTexts = {
        zh: [
            '正在打包今天的灵感行李……',
            '正在抽取下一站数字坐标……',
            '正在查看本次漂流目的地……',
            '正在把办公室折叠成随身模式……',
            '正在给钳子装上远行 Buff……',
            '正在匹配下一段创作气候……',
            '正在把时差调成冒险模式……',
            '正在接收陌生街区的 Wi‑Fi 心跳……',
            '正在试播下一站的海风 BGM……',
            '正在加载"也许会爱上"的新房间……',
            '正在为未知邻居准备自我介绍……',
            '正在解锁下一片数字海域……',
            '正在把好奇心调到满格……',
            '正在等待旅程投递下一张门牌号……'
        ],
        en: [
            'Packing today\'s luggage of inspiration…',
            'Drawing the digital coordinates for the next stop…',
            'Checking the destination of this drift…',
            'Folding the office into portable mode…',
            'Installing a travel buff on the claws…',
            'Matching the creative climate for the next chapter…',
            'Switching the time zone to adventure mode…',
            'Receiving Wi‑Fi heartbeats from an unfamiliar block…',
            'Previewing the sea-breeze BGM of the next stop…',
            'Loading a new room you might just fall in love with…',
            'Preparing an intro for unknown neighbors…',
            'Unlocking the next digital sea…',
            'Turning curiosity up to max…',
            'Waiting for the journey to deliver the next door number…'
        ],
        ja: [
            '今日のひらめき荷物を梱包しています……',
            '次の目的地のデジタル座標を抽出しています……',
            '今回の漂流先を確認しています……',
            'オフィスを携帯モードに折りたたんでいます……',
            'ハサミに遠征 Buff を装着しています……',
            '次の創作区間の気候をマッチングしています……',
            '時差を冒険モードに切り替えています……',
            '見知らぬ街区の Wi‑Fi ハートビートを受信しています……',
            '次の目的地の潮風 BGM を試聴しています……',
            '「好きになるかもしれない」新しい部屋を読み込んでいます……',
            '未知のご近所さん向けに自己紹介を準備しています……',
            '次のデジタル海域をアンロックしています……',
            '好奇心を最大値まで上げています……',
            '旅が次の番地を届けるのを待っています……'
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

// ========== Background Refresh ==========
async function refreshOfficeBackgroundOnly() {
    return await refreshSceneObjectByAssetPath('office_bg_small.webp');
}

// ========== Move Success ==========
function markMoveSuccess(outEl, btnEl = null) {
    if (outEl) outEl.textContent = t('moveSuccess');
    if (btnEl) setButtonDone(btnEl);
    try { setState('idle', t('moveSuccess').replace('✅ ', '')); } catch (e) {}
}

// ========== Working Status ==========
function setWorkingStatus(detail = '工作中') {
    try { setState('writing', detail); } catch (e) {}
}

// ========== Button Helpers ==========
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

// ========== Generation Helpers ==========
// Async generation: start task then poll for result (avoids Cloudflare 524 timeout)
async function _startAndPollGeneration(body, out, progressMsg) {
    const res = await fetch('/assets/generate-rpg-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) return data;
    if (!data.async || !data.task_id) return data; // sync fallback (shouldn't happen)

    // Poll for completion
    const taskId = data.task_id;
    const maxPollTime = 300000; // 5 minutes max
    const pollInterval = 3000;  // 3 seconds
    const startTime = Date.now();
    let dots = 0;

    while (Date.now() - startTime < maxPollTime) {
        await new Promise(r => setTimeout(r, pollInterval));
        dots = (dots + 1) % 4;
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        out.textContent = progressMsg + '（已等待 ' + elapsed + '秒）' + '.'.repeat(dots);
        try {
            const pollRes = await fetch('/assets/generate-rpg-background/poll?task_id=' + encodeURIComponent(taskId));
            const pollData = await pollRes.json();
            if (pollData.status === 'pending') continue;
            return pollData; // done or error
        } catch (pollErr) {
            // Network error during poll, keep trying
            continue;
        }
    }
    return { ok: false, msg: '生图超时（超过5分钟），请重试' };
}

function _handleGenError(data, out) {
    if (data.code === 'MISSING_API_KEY') {
        out.textContent = t('brokerMissingKey');
        const box = document.getElementById('asset-gemini-config');
        if (box) box.style.display = 'block';
    } else if (data.code === 'API_KEY_REVOKED_OR_LEAKED') {
        out.textContent = '❌ 当前 API Key 已失效/疑似泄露，请更换新 Key 后重试';
        const box = document.getElementById('asset-gemini-config');
        if (box) box.style.display = 'block';
    } else if (data.code === 'MODEL_NOT_AVAILABLE') {
        out.textContent = '❌ 当前模型在此通道不可用，请切换可用模型后重试' + (data.detail ? ('\n\n详情：' + data.detail) : '');
    } else {
        out.textContent = `❌ 生成失败：${data.msg || 'unknown error'}`;
    }
}

// ========== Broker Panel ==========
function toggleBrokerPanel() {
    const btn = document.querySelector('#asset-broker-row .btn-broker');
    flashButtonActive(btn);
    const p = document.getElementById('asset-broker-panel');
    if (!p) return;
    p.classList.toggle('open');
}

// ========== Manual Panel ==========
function toggleManualPanel() {
    const btn = document.querySelector('#asset-broker-row .btn-diy');
    flashButtonActive(btn);
    assetManualPanelOpen = !assetManualPanelOpen;
    updateManualPanelUI();
}

// ========== Scene Preview ==========
function applyScenePreview(path) {
    const ok = highlightSpriteByAssetPath(path);
    const ok2 = drawSelectionBoxOnScene(path);
    return !!(ok && ok2);
}

// ========== Main Generation Functions ==========
async function generateCustomRpgBackground() {
    const brokerBtn = document.querySelector('#asset-broker-row .btn-broker');
    flashButtonActive(brokerBtn);
    setWorkingStatus('正在处理中介装修方案');
    const out = document.getElementById('asset-move-result') || document.getElementById('asset-upload-result');
    const prompt = (document.getElementById('asset-broker-prompt')?.value || '').trim();
    if (!prompt) {
        out.textContent = t('brokerNeedPrompt');
        return;
    }
    showRoomLoadingOverlay();
    out.textContent = t('brokerGenerating');
    try {
        const data = await _startAndPollGeneration(
            { prompt, speed_mode: speedMode },
            out,
            '🏘️ 正在按中介方案生成底图'
        );
        if (!data.ok) {
            _handleGenError(data, out);
            return;
        }
        out.textContent = t('brokerDone');
        const ok = await refreshOfficeBackgroundOnly();
        if (ok) {
            markMoveSuccess(out, brokerBtn);
        } else {
            out.textContent = '✅ 已生成并替换底图（局部刷新失败，可手动刷新页面）';
        }
    } catch (e) {
        out.textContent = `❌ 生成失败：${e}`;
    } finally {
        hideRoomLoadingOverlay();
    }
}

async function generateRpgBackground() {
    const moveBtn = document.getElementById('btn-move-house');
    flashButtonActive(moveBtn);
    setWorkingStatus('正在搬新家');
    const out = document.getElementById('asset-move-result') || document.getElementById('asset-upload-result');
    showRoomLoadingOverlay();
    out.textContent = '🧳 正在打包行李，请稍后（约30~120秒）';
    try {
        const data = await _startAndPollGeneration(
            { speed_mode: speedMode },
            out,
            '🧳 正在生成新房间'
        );
        if (!data.ok) {
            _handleGenError(data, out);
            return;
        }
        out.textContent = '✅ 已生成并替换底图，正在刷新房间...';
        const ok = await refreshOfficeBackgroundOnly();
        if (ok) {
            markMoveSuccess(out, moveBtn);
        } else {
            out.textContent = '✅ 已生成并替换底图（局部刷新失败，可手动刷新页面）';
        }
    } catch (e) {
        out.textContent = `❌ 生成失败：${e}`;
    } finally {
        hideRoomLoadingOverlay();
    }
}

async function restoreHomeBackground() {
    const homeBtn = document.getElementById('btn-back-home');
    flashButtonActive(homeBtn);
    const out = document.getElementById('asset-move-result') || document.getElementById('asset-upload-result');

    const confirmMsg = '⚠️ 回老家会覆盖当前自定义房间背景（可从 bg-history 恢复历史图）。\n确定继续吗？';
    if (!window.confirm(confirmMsg)) {
        out.textContent = '已取消回老家';
        return;
    }

    setWorkingStatus('正在回老家');
    // 点击即刻显示遮罩，先于任何网络调用
    showRoomLoadingOverlay();
    out.textContent = '🏡 正在回老家（恢复初始底图）...';
    try {
        const res = await fetch('/assets/restore-reference-background', { method: 'POST' });
        const data = await res.json();
        if (!data.ok) {
            out.textContent = `❌ 恢复失败：${data.msg || res.status}`;
            return;
        }
        out.textContent = '✅ 已恢复初始底图';
        const ok = await refreshOfficeBackgroundOnly();
        if (ok) {
            markMoveSuccess(out, homeBtn);
        } else {
            out.textContent = '✅ 已恢复初始底图（局部刷新失败，可手动刷新页面）';
        }
    } catch (e) {
        out.textContent = `❌ 恢复失败：${e}`;
    } finally {
        hideRoomLoadingOverlay();
    }
}

async function restoreLastGeneratedBackground() {
    const btn = document.getElementById('btn-back-last-bg');
    flashButtonActive(btn);
    const out = document.getElementById('asset-move-result') || document.getElementById('asset-upload-result');

    const confirmMsg = '⚠️ 将回退到最近一次生成的房间背景，确定继续吗？';
    if (!window.confirm(confirmMsg)) {
        out.textContent = '已取消回退';
        return;
    }

    setWorkingStatus('正在回退到上一次背景');
    showRoomLoadingOverlay();
    out.textContent = '↩️ 正在回退到最近一次生成底图...';
    try {
        const res = await fetch('/assets/restore-last-generated-background', { method: 'POST' });
        const data = await res.json();
        if (!data.ok) {
            out.textContent = `❌ 回退失败：${data.msg || res.status}`;
            return;
        }
        const ok = await refreshOfficeBackgroundOnly();
        if (ok) {
            out.textContent = '✅ 已回退到上一次背景';
        } else {
            out.textContent = '✅ 已回退到上一次背景（局部刷新失败，可手动刷新页面）';
        }
        try { setState('idle', '已回退到上一次背景'); } catch (e) {}
    } catch (e) {
        out.textContent = `❌ 回退失败：${e}`;
    } finally {
        hideRoomLoadingOverlay();
    }
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

// ========== Visual State ==========
function applyVisualState(nextState) {
    // Idle: show Star idle animation (main character)
    if (nextState === 'idle') {
        sofa.anims.stop();
        sofa.setTexture('sofa_idle');

        if (window.starWorking) {
            window.starWorking.setVisible(false);
            window.starWorking.anims.stop();
        }

        star.setVisible(true);
        star.setScale(IDLE_STAR_SCALE);
        star.anims.play('star_idle', true);
        star.setPosition(IDLE_SOFA_ANCHOR.x, IDLE_SOFA_ANCHOR.y);
    } else if (nextState === 'error') {
        // Error: no working animation at desk
        sofa.anims.stop();
        sofa.setTexture('sofa_idle');
        star.setVisible(false);
        star.anims.stop();
        if (window.starWorking) {
            window.starWorking.setVisible(false);
            window.starWorking.anims.stop();
        }
    } else if (nextState === 'syncing') {
        // Syncing: also no working animation at desk
        sofa.anims.stop();
        sofa.setTexture('sofa_idle');
        star.setVisible(false);
        star.anims.stop();
        if (window.starWorking) {
            window.starWorking.setVisible(false);
            window.starWorking.anims.stop();
        }
    } else {
        // Non-idle non-error: starWorking animation at desk
        sofa.anims.stop();
        sofa.setTexture('sofa_idle');
        // Hide moving star, show desk star
        star.setVisible(false);
        star.anims.stop();
        if (window.starWorking) {
            window.starWorking.setVisible(true);
            window.starWorking.anims.play('star_working', true);
        }
    }

    // Server room logic
    if (serverroom) {
        if (nextState === 'idle') {
            serverroom.anims.stop();
            serverroom.setFrame(0);
        } else {
            serverroom.anims.play('serverroom_on', true);
        }
    }

    // Sync animation logic: default frame0; syncing play loop
    if (syncAnimSprite) {
        if (nextState === 'syncing') {
            if (syncAnimPlayable && syncAnimSprite.anims && syncAnimSprite.anims.play && syncAnimSprite.scene?.anims?.exists('sync_anim')) {
                if (!syncAnimSprite.anims.isPlaying || syncAnimSprite.anims.currentAnim?.key !== 'sync_anim') {
                    syncAnimSprite.anims.play('sync_anim', true);
                }
            } else {
                syncAnimSprite.setFrame(0);
            }
        } else {
            if (syncAnimSprite.anims && syncAnimSprite.anims.isPlaying) syncAnimSprite.anims.stop();
            syncAnimSprite.setFrame(0);
        }
    }
}

// ========== State Control ==========
function setState(state, detail) {
    fetch('/set_state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, detail })
    })
    .then((res) => {
        if (!res.ok) throw new Error(`set_state failed: ${res.status}`);
        return fetchStatus();
    })
    .catch((e) => {
        console.error('setState failed', e);
    });
}
