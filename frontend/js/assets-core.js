/* Asset Drawer Core - split from assets.js */

function updateAssetAuthUI() {
    const gate = document.getElementById('asset-auth-gate');
    const main = document.getElementById('asset-main-content');
    if (!gate || !main) return;
    gate.style.display = assetDrawerAuthed ? 'none' : 'block';
    main.style.display = assetDrawerAuthed ? 'block' : 'none';
    updateManualPanelUI();
}


function updateManualPanelUI() {
    const panel = document.getElementById('asset-manual-panel');
    if (!panel) return;
    panel.classList.toggle('open', !!assetManualPanelOpen && !!assetDrawerAuthed);
}


async function unlockAssetDrawer() {
    const input = document.getElementById('asset-pass-input');
    const msg = document.getElementById('asset-auth-msg');
    const val = (input?.value || '').trim();
    if (!val) {
        if (msg) msg.textContent = '❌ 请输入验证码';
        return;
    }
    try {
        const res = await fetch('/assets/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: val })
        });
        const data = await res.json();
        if (data && data.ok) {
            assetDrawerAuthed = true;
            if (msg) msg.textContent = '✅ 验证通过';
            updateAssetAuthUI();
            await refreshAssetDrawerList();
            await renderHomeFavorites(false);
            bindDrawerFileMeta();
        } else {
            assetDrawerAuthed = false;
            if (msg) msg.textContent = '❌ 验证码错误';
        }
    } catch (e) {
        assetDrawerAuthed = false;
        if (msg) msg.textContent = `❌ 验证失败：${e}`;
    }
}

function formatSizeHuman(n) {

function renderSelectedAssetGuidance(path, inScene = null) {
    const out = document.getElementById('asset-upload-result');
    if (!out) return;
    if (!path) { out.innerHTML = ''; return; }
    const displayName = getAssetDisplayName(path);
    const line1 = `📌 ${displayName}（${path}）`;
    const line2 = `💡 ${getAssetHelpText(path)}`;
    const line3 = (inScene === false) ? `⚠️ ${t('assetHintNotInScene')}` : '';
    out.innerHTML = [line1, line2, line3]
        .filter(Boolean)
        .map(v => `<p class="hint-p">${v}</p>`)
        .join('');
}

function clearAssetSelectionUI() {
    const hl = document.getElementById('asset-highlight');
    if (hl) hl.style.display = 'none';
    if (selectionBoxGraphics) selectionBoxGraphics.setVisible(false);
}


function clearAssetSelection(resetInputs = true) {
    selectedAssetInfo = null;
    updateActiveAssetItem('');
    clearAssetSelectionUI();
    const out = document.getElementById('asset-upload-result');
    if (out) out.textContent = '';

    updateAssetConfirmButtonState();
}

function applyScenePreview(path) {
    const ok = highlightSpriteByAssetPath(path);
}

function updateActiveAssetItem(path) {
    document.querySelectorAll('#asset-list .asset-item').forEach(el => {
        const p = el.getAttribute('data-path');
        el.classList.toggle('active', p === path);
    });
}


function updateAssetConfirmButtonState() {
    const btn = document.getElementById('asset-commit-refresh-btn');
    const btnReset = document.getElementById('asset-reset-default-btn');
    const btnPrev = document.getElementById('asset-restore-prev-btn');
    const panel = document.getElementById('asset-upload-panel');
    const can = !!(selectedAssetInfo && selectedAssetInfo.path);
    if (panel) panel.classList.toggle('active', can);
    [btn, btnReset, btnPrev].forEach((b) => {
        if (!b) return;
        b.disabled = !can;
        b.style.opacity = can ? '1' : '.55';
    });
}


function selectAssetInDrawer(path) {
    // 二次点击同一资产 = 取消选择
    if (selectedAssetInfo && selectedAssetInfo.path === path) {
        clearAssetSelection(true);
        return;
    }
    selectedAssetInfo = assetListData.find(x => x.path === path) || null;
    updateActiveAssetItem(path);
    const ok = applyScenePreview(path);
    renderSelectedAssetGuidance(path, ok);
    updateAssetConfirmButtonState();
}

function isAssetHidden(path) {
    return hiddenAssetPaths.has(path || '');
}


function setAssetVisible(path, visible) {
    const p = (path || '').trim();
    if (!p) return;
    if (visible) hiddenAssetPaths.delete(p);
    else hiddenAssetPaths.add(p);

    const sp = mapAssetPathToSprite(p);
    if (sp && sp.setVisible) {
        sp.setVisible(!!visible);
    }
}


function toggleAssetVisibility(path, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    const p = (path || '').trim();
    if (!p) return;
    const nextVisible = isAssetHidden(p);
    setAssetVisible(p, nextVisible);
    renderAssetDrawerList();
    const out = document.getElementById('asset-upload-result');
    if (out) out.textContent = nextVisible ? `✅ 已显示：${p}` : `🙈 已隐藏：${p}`;
    if (selectedAssetInfo && selectedAssetInfo.path === p) {
        if (!nextVisible) clearAssetSelectionUI();
        else applyScenePreview(p);
    }
}


function renderAssetDrawerList() {
    const q = (document.getElementById('asset-search')?.value || '').trim().toLowerCase();
    const list = document.getElementById('asset-list');
    if (!list) return;

    // 统一显示后端全部资产（不再区分已加载/全部）
    const baseRows = assetListData.map(it => ({ ...it, key: '' }));

    const statePriority = [
        'star-idle-v5.png',
        'star-working-spritesheet-grid.webp',
        'sync-animation-v3-grid.webp',
        'error-bug-spritesheet-grid.webp'
    ];
    const assetRank = (path='') => {
        const p = (path || '').toLowerCase();
        const idx = statePriority.findIndex(x => p.endsWith(x));
        if (idx >= 0) return idx; // 0~3: 四个主状态最前

        // 按钮素材最不重要：统一沉到列表末尾
        if (p.includes('/btn-') || p.includes('btn-') || p.includes('button')) return 1000;

        if (p.includes('guest_anim_')) return 999; // guest 动画靠后
        return 100;
    };
    const rows = baseRows
        .filter(it => !q || (it.path || '').toLowerCase().includes(q) || (it.key || '').toLowerCase().includes(q))
        .sort((a,b)=> {
            const ra = assetRank(a.path), rb = assetRank(b.path);
            if (ra !== rb) return ra - rb;
            return (a.path || '').localeCompare(b.path || '');
        });

    clearAssetThumbTimers();

    if (rows.length === 0) {
        list.innerHTML = '<div class="asset-sub" style="padding:8px">暂无资产（可点"刷新"重试）</div>';
        return;
    }

    list.innerHTML = rows.map(it => {
        const isActive = ((selectedAssetInfo && selectedAssetInfo.path) ? selectedAssetInfo.path : '') === it.path;
        const reso = (it.width && it.height) ? `${it.width}×${it.height}` : '-';
        const displayName = getAssetDisplayName(it.path || '');
        const thumbId = `asset-thumb-canvas-${(it.path || '').replace(/[^a-zA-Z0-9]/g, '_')}`;
        const hidden = isAssetHidden(it.path);
        const visEmoji = hidden ? '🙈' : '👀';
        return `<div class="asset-item ${isActive ? 'active' : ''}" data-path="${it.path}" onclick="selectAssetInDrawer('${(it.path || '').replace(/'/g, "\\'")}')">
            <canvas id="${thumbId}" class="asset-thumb" width="56" height="56"></canvas>
            <div class="asset-meta">
                <div class="asset-path">${it.path}</div>
                <div class="asset-sub">${displayName} ｜ ${reso}${hidden ? ' ｜ 已隐藏' : ''}</div>
            </div>
            <button class="asset-vis-btn" onclick="toggleAssetVisibility('${(it.path || '').replace(/'/g, "\\'")}', event)">${visEmoji}</button>
        </div>`;
    }).join('');

    // 先画静态缩略图，再尝试对精灵表做逐帧预览
    rows.forEach(it => {
        const canvas = document.getElementById(`asset-thumb-canvas-${(it.path || '').replace(/[^a-zA-Z0-9]/g, '_')}`);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            tryAnimateAssetThumb(it);
        };
        img.src = `/static/${it.path}?t=${Date.now()}`;
    });
}


async function refreshAssetDrawerList() {
    const out = document.getElementById('asset-upload-result');
    try {
        const selectedPath = (selectedAssetInfo && selectedAssetInfo.path) ? selectedAssetInfo.path : '';
        const res = await fetch('/assets/list?t=' + Date.now(), { cache: 'no-store' });
        const data = await res.json();
        assetListData = data.items || [];

        // 场景渲染可能稍晚，做一次延迟抓取
        buildSceneAssetItems();
        if (sceneAssetItems.length === 0) {
            setTimeout(() => {
                buildSceneAssetItems();
                renderAssetDrawerList();
            }, 500);
        }

        renderAssetDrawerList();
        if (out) out.textContent = `已加载资产：${assetListData.length} ｜ 场景抓取：${sceneAssetItems.length}`;

        if (selectedPath) {
            updateActiveAssetItem(selectedPath);
            applyScenePreview(selectedPath);
        }
    } catch (e) {
        console.error('加载资产列表失败', e);
        if (out) out.textContent = '❌ 资产加载失败，请点"刷新"重试';
    }
}


function bindDrawerFileMeta() {
    const input = document.getElementById('asset-upload-file');
    const out = document.getElementById('asset-upload-result');
    if (!input || !out) return;
    input.onchange = () => {
        const f = input.files && input.files[0];
        const targetPath = (selectedAssetInfo && selectedAssetInfo.path) ? selectedAssetInfo.path : '';
        if (!f) {
            if (targetPath) {
                const inScene = !!applyScenePreview(targetPath);
                renderSelectedAssetGuidance(targetPath, inScene);
            } else {
                out.textContent = '';
            }
            updateAssetConfirmButtonState();
            return;
        }
        const targetLabel = targetPath || '-';
        const pending = `${t('uploadPending')}：${f.name} ｜ ${formatSizeHuman(f.size)} ｜ ${t('uploadTarget')}：${targetLabel}`;
        if (targetPath) {
            const inScene = !!mapAssetPathToSprite(targetPath);
            const displayName = getAssetDisplayName(targetPath);
            const hint = getAssetHelpText(targetPath);
            const warn = inScene ? '' : `⚠️ ${t('assetHintNotInScene')}`;
            out.innerHTML = [
                `<p class="hint-p">${pending}</p>`,
                `<p class="hint-p">📌 ${displayName}（${targetPath}）</p>`,
                `<p class="hint-p">💡 ${hint}</p>`,
                warn ? `<p class="hint-p">${warn}</p>` : ''
            ].filter(Boolean).join('');
        } else {
            out.innerHTML = `<p class="hint-p">${pending}</p>`;
        }
        updateAssetConfirmButtonState();
    };
    updateAssetConfirmButtonState();
}

var assetDrawerBackgroundBinded = false;

function bindAssetDrawerBackgroundDeselect() {
    if (assetDrawerBackgroundBinded) return;
    assetDrawerBackgroundBinded = true;
    const body = document.getElementById('asset-drawer-body');
    if (!body) return;
    body.addEventListener('click', (e) => {
        if (!assetDrawerOpen || !assetDrawerAuthed) return;
        // 点击空白处才取消选择；点击控件/资产项不取消
        const keep = e.target.closest('.asset-item, .asset-toolbar, #asset-upload-panel, #asset-move-panel, button, input, textarea, label, canvas');
        if (keep) return;
        clearAssetSelection(true);
    });
}


function openInlineAssetUploader() {
    const input = document.getElementById('asset-upload-file');
    if (!input) return;
    input.click();
}

var selectionBoxGraphics = null;

async function refreshSceneObjectByAssetPath(path) {
    const scene = getCurrentScene();
    if (!scene || !path) return false;

    const sprite = mapAssetPathToSprite(path);
    if (!sprite || !sprite.texture) return false;

    const oldKey = sprite.texture.key;
    const ext = path.split('.').pop();
    const newKey = `${oldKey}_live_${Date.now()}`;
    const url = `/static/${path}?t=${Date.now()}`;

    return new Promise((resolve) => {
        try {
            scene.load.once('complete', () => {
                try {
                    // 替换到新纹理
                    if (sprite.setTexture) sprite.setTexture(newKey);
                    // 同 key 角色（如多个同材质装饰）一起替换
                    getSceneChildren().forEach(ch => {
                        if (ch !== sprite && ch.texture && ch.texture.key === oldKey && ch.setTexture) {
                            ch.setTexture(newKey);
                        }
                    });
                    // 更新背景引用
                    if (oldKey === 'office_bg' && officeBgSprite && officeBgSprite.texture && officeBgSprite.texture.key === newKey) {
                        currentOfficeBgTextureKey = newKey;
                    }
                    // 移除旧纹理，避免内存堆积
                    if (oldKey !== newKey && scene.textures.exists(oldKey)) {
                        scene.textures.remove(oldKey);
                    }
                    resolve(true);
                } catch (e) {
                    console.warn('替换场景纹理失败(setTexture):', e);
                    resolve(false);
                }
            });
            scene.load.once('loaderror', () => resolve(false));

            // 按扩展名用对应 loader
            if (ext === 'json') {
                resolve(false);
                return;
            }
            scene.load.image(newKey, url);
            scene.load.start();
        } catch (e) {
            console.warn('替换场景纹理失败(load):', e);
            resolve(false);
        }
    });
}


async function commitAssetUpdate() {
    const path = (selectedAssetInfo && selectedAssetInfo.path) ? selectedAssetInfo.path : '';
    const fi = document.getElementById('asset-upload-file');
    const out = document.getElementById('asset-upload-result');
    if (!path) { out.textContent = '请先选中一个资产路径'; return false; }
    if (!fi.files.length) { return true; } // 允许仅改坐标
    const file = fi.files[0];
    const fd = new FormData();
    fd.append('path', path);
    fd.append('backup', '1');
    fd.append('file', file);

    const nameLower = (file.name || '').toLowerCase();
    const isAnimInput = nameLower.endsWith('.gif') || nameLower.endsWith('.webp');
    const isSheetTarget = !!inferSpritesheetFrameMetaByPath(path);

    if (isSheetTarget) {
        fd.append('auto_spritesheet', '1');
        // 全自动：后端识别并切帧
        if (isAnimInput) {
            fd.append('preserve_original', '1');
        } else {
            // 静态图兜底切法
            fd.append('frame_w', '64');
            fd.append('frame_h', '64');
            fd.append('preserve_original', '0');
        }
        fd.append('pixel_art', '1');
    }

    out.textContent = '⏳ 正在上传并替换，请稍候...';
    const res = await fetch('/assets/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.ok) {
        out.textContent = `❌ 更新失败：${data.msg || res.status}`;
        return false;
    }

    if (data.converted) {
        const toType = data.converted.to || 'spritesheet';
        out.textContent = `✅ 已上传（动图→${toType}）：${data.path} ｜ ${data.converted.frames}帧 ${data.converted.frame_w}x${data.converted.frame_h}`;
    } else {
        out.textContent = `✅ 已上传：${data.path}`;
    }
    return true;
}


async function commitAndRefresh() {
    const out = document.getElementById('asset-upload-result');
    const fi = document.getElementById('asset-upload-file');
    const hasFile = !!(fi && fi.files && fi.files.length > 0);

    const okUpload = await commitAssetUpdate();
    if (!okUpload) return;

    if (out) {
        if (hasFile) out.textContent += ' ｜ ✅ 已上传并刷新';
        else out.textContent = '✅ 已确认并刷新';
    }

    // 刷新前关闭侧边栏，行为与地图替换一致
    assetDrawerOpen = false;
    const drawer = document.getElementById('asset-drawer');
    if (drawer) drawer.classList.remove('open');

    setTimeout(() => window.location.reload(), 400);
}


async function resetSelectedAssetToDefault() {
    const out = document.getElementById('asset-upload-result');
    const path = selectedAssetInfo && selectedAssetInfo.path;
    if (!path) {
        if (out) out.textContent = '请先选择一个资产';
        return;
    }
    if (!window.confirm(`⚠️ 确定将 ${path} 重置为默认资产吗？`)) return;
    try {
        const res = await fetch('/assets/restore-default', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        const data = await res.json();
        if (!data.ok) {
            if (out) out.textContent = `❌ 重置失败：${data.msg || res.status}`;
            return;
        }
        await refreshSceneObjectByAssetPath(path);
        if (out) out.textContent = `✅ 已重置为默认资产：${path}`;
    } catch (e) {
        if (out) out.textContent = `❌ 重置失败：${e}`;
    }
}


async function restoreSelectedAssetPrev() {
    const out = document.getElementById('asset-upload-result');
    const path = selectedAssetInfo && selectedAssetInfo.path;
    if (!path) {
        if (out) out.textContent = '请先选择一个资产';
        return;
    }
    if (!window.confirm(`⚠️ 确定将 ${path} 回退到上一版吗？`)) return;
    try {
        const res = await fetch('/assets/restore-prev', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        const data = await res.json();
        if (!data.ok) {
            if (out) out.textContent = `❌ 回退失败：${data.msg || res.status}`;
            return;
        }
        await refreshSceneObjectByAssetPath(path);
        if (out) out.textContent = `✅ 已回退到上一版：${path}`;
    } catch (e) {
        if (out) out.textContent = `❌ 回退失败：${e}`;
    }
}

// 记录 body scroll 位置，drawer 关闭时恢复

async function toggleAssetDrawer(force) {
    const drawer = document.getElementById('asset-drawer');
    const backdrop = document.getElementById('asset-drawer-backdrop');
    const next = (typeof force === 'boolean') ? force : !assetDrawerOpen;
    assetDrawerOpen = next;
    drawer.classList.toggle('open', next);
    if (backdrop) backdrop.classList.toggle('open', next);
    // 移动端 body 锁定：打开时冻结滚动位置，关闭时恢复
    if (next) {
        _drawerScrollY = window.scrollY;
        document.body.style.top = `-${_drawerScrollY}px`;
    }
    document.body.classList.toggle('drawer-open', next);
    if (!next) {
        document.body.style.top = '';
        window.scrollTo(0, _drawerScrollY);
    }

    const openBtn = document.getElementById('btn-open-drawer');
    if (openBtn) {
        openBtn.classList.toggle('is-active', next);
        openBtn.textContent = t('btnDecor');
    }
    const closeBtn = document.getElementById('btn-close-drawer');
    if (closeBtn) closeBtn.textContent = t('drawerClose');
    if (next) {
        assetManualPanelOpen = false;
        updateAssetAuthUI();
        bindAssetDrawerBackgroundDeselect();
        await ensureGeminiConfigLoaded();
        if (assetDrawerAuthed) {
            await applySavedPositionOverrides();
            await refreshAssetDrawerList();
            await renderHomeFavorites(false);
            bindDrawerFileMeta();
        } else {
            const msg = document.getElementById('asset-auth-msg');
            if (msg) msg.textContent = t('authDefaultPassHint');
        }
    } else {
        assetManualPanelOpen = false;
        updateManualPanelUI();
        clearAssetSelectionUI();
    }
}
}