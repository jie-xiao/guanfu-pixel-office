/* Phaser game core state & init - split from game.js */
console.log('[game-init] START');

let game, star, sofa, serverroom, officeBgSprite, areas = {}, currentState = 'idle', pendingDesiredState = null, statusText, lastFetch = 0, lastBlink = 0, lastBubble = 0, targetX = 660, targetY = 170, bubble = null, typewriterText = '', typewriterTarget = '', typewriterIndex = 0, lastTypewriter = 0, syncAnimSprite = null, syncAnimPlayable = false, catBubble = null, selectionBoxGraphics = null;
console.log('[game-init] vars declared');
const IDLE_SOFA_ANCHOR = { x: 798, y: 272 };
const IDLE_STAR_SCALE = 1.0;
let FLOWERS_FRAME_W = 65;
let FLOWERS_FRAME_H = 65;
let FLOWERS_FRAME_COLS = 4;
let FLOWERS_FRAME_ROWS = 4;
let currentOfficeBgTextureKey = 'office_bg';

let coordsOverlay, coordsDisplay, coordsToggle;
window.showCoords = false;  // Expose to window for i18n.js access

const TYPEWRITER_DELAY = 50;

// Loading system (used by preload) - expose to window for i18n.js access
let totalAssets = 0;
let loadedAssets = 0;
window.loadingProgressBar = null;
window.loadingProgressContainer = null;
window.loadingOverlay = null;
window.loadingText = null;

// ============ Core helpers ============
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

function setWorkingStatus(detail) {
    try { setState('writing', detail); } catch (e) {}
}

function getBubbleTextsByState(stateKey) {
    const langPack = BUBBLE_TEXTS[uiLang] || BUBBLE_TEXTS.zh;
    return langPack[stateKey] || langPack.idle || [];
}

function normalizeState(s) {
    if (!s) return 'idle';
    if (s === 'working') return 'writing';
    if (s === 'run' || s === 'running') return 'executing';
    if (s === 'sync') return 'syncing';
    if (s === 'research') return 'researching';
    return s;
}

function applyVisualState(nextState) {
    if (nextState === 'idle') {
        sofa.anims && sofa.anims.stop();
        sofa.setTexture('sofa_idle');
        if (window.starWorking) {
            window.starWorking.setVisible(false);
            window.starWorking.anims && window.starWorking.anims.stop();
        }
        star.setVisible(true);
        star.setScale(IDLE_STAR_SCALE);
        star.anims.play('star_idle', true);
        star.setPosition(IDLE_SOFA_ANCHOR.x, IDLE_SOFA_ANCHOR.y);
    } else if (nextState === 'error') {
        sofa.anims && sofa.anims.stop();
        sofa.setTexture('sofa_idle');
        star.setVisible(false);
        star.anims && star.anims.stop();
        if (window.starWorking) {
            window.starWorking.setVisible(false);
            window.starWorking.anims && window.starWorking.anims.stop();
        }
    } else if (nextState === 'syncing') {
        sofa.anims && sofa.anims.stop();
        sofa.setTexture('sofa_idle');
        star.setVisible(false);
        star.anims && star.anims.stop();
        if (window.starWorking) {
            window.starWorking.setVisible(false);
            window.starWorking.anims && window.starWorking.anims.stop();
        }
    } else {
        sofa.anims && sofa.anims.stop();
        sofa.setTexture('sofa_idle');
        star.setVisible(false);
        star.anims && star.anims.stop();
        if (window.starWorking) {
            window.starWorking.setVisible(true);
            window.starWorking.anims.play('star_working', true);
        }
    }

    if (serverroom) {
        if (nextState === 'idle') {
            serverroom.anims.stop();
            serverroom.setFrame(0);
        } else {
            serverroom.anims.play('serverroom_on', true);
        }
    }

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

function fetchStatus() {
    return fetch('/status', { cache: 'no-store' })
        .then(response => response.json())
        .then(data => {
            try {
                if (data.officeName) {
                    window.officeNameFromServer = data.officeName;
                    if (!floorPlaqueControl && window.officePlaqueText && window.officePlaqueText.setText) {
                        window.officePlaqueText.setText(data.officeName);
                    }
                }
                const nextState = normalizeState(data.state);
                const stateInfo = STATES[nextState] || STATES.idle;
                const changed = (pendingDesiredState === null) && (nextState !== currentState);
                const nextLine = '[' + stateInfo.name + '] ' + (data.detail || '...');
                pendingDesiredState = null;
                if (currentState !== nextState) {
                    currentState = nextState;
                }
                applyVisualState(nextState);

                if (changed) {
                    typewriterTarget = nextLine;
                    typewriterText = '';
                    typewriterIndex = 0;
                } else {
                    if (!typewriterTarget || typewriterTarget !== nextLine) {
                        typewriterTarget = nextLine;
                        typewriterText = '';
                        typewriterIndex = 0;
                    }
                }
            } catch (err) {
                console.error('fetchStatus apply error', err);
                typewriterTarget = '状态更新异常，正在恢复...';
                typewriterText = '';
                typewriterIndex = 0;
            }
        })
        .catch(error => {
            typewriterTarget = '连接失败，正在重试...';
            typewriterText = '';
            typewriterIndex = 0;
        });
}

function showBubble() {
    if (bubble) { bubble.destroy(); bubble = null; }
    const texts = getBubbleTextsByState(currentState);
    if (currentState === 'idle') return;

    let anchorX = star.x;
    let anchorY = star.y;
    if (currentState === 'syncing' && syncAnimSprite && syncAnimSprite.visible) {
        anchorX = syncAnimSprite.x;
        anchorY = syncAnimSprite.y;
    } else if (currentState === 'error' && window.errorBug && window.errorBug.visible) {
        anchorX = window.errorBug.x;
        anchorY = window.errorBug.y;
    } else if (!star.visible && window.starWorking && window.starWorking.visible) {
        anchorX = window.starWorking.x;
        anchorY = window.starWorking.y;
    }

    const text = texts[Math.floor(Math.random() * texts.length)];
    const bubbleOffsetY = (currentState === 'writing') ? 85 : 70;
    const bubbleY = anchorY - bubbleOffsetY;
    const isTouch = IS_TOUCH_DEVICE;
    const fontSize = isTouch ? 14 : 12;
    const bg = game.add.rectangle(anchorX, bubbleY, text.length * 10 + 20, 28, 0xffffff, 0.95);
    bg.setStrokeStyle(2, 0x000000);
    const txt = game.add.text(anchorX, bubbleY, text, { fontFamily: 'ArkPixel, monospace', fontSize: fontSize + 'px', fill: '#000', align: 'center' }).setOrigin(0.5);
    bubble = game.add.container(0, 0, [bg, txt]);
    bubble.setDepth(1200);
    setTimeout(() => { if (bubble) { bubble.destroy(); bubble = null; } }, 3000);
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
                        if (window.starWorking) {
                            window.starWorking.setVisible(false);
                            window.starWorking.anims && window.starWorking.anims.stop();
                        }
                        star.setVisible(true);
                        star.setScale(IDLE_STAR_SCALE);
                        star.anims.play('star_idle', true);
                        star.setPosition(IDLE_SOFA_ANCHOR.x, IDLE_SOFA_ANCHOR.y);
                        sofa.anims && sofa.anims.stop();
                        sofa.setTexture('sofa_idle');
                    } else {
                        star.setVisible(false);
                        star.anims && star.anims.stop();
                        if (window.starWorking) {
                            window.starWorking.setVisible(true);
                            window.starWorking.anims.play('star_working', true);
                        }
                    }
                }
            }
        } else {
            if (pendingDesiredState !== null) {
                isMoving = false;
                currentState = pendingDesiredState;
                pendingDesiredState = null;

                if (currentState === 'idle') {
                    if (window.starWorking) {
                        window.starWorking.setVisible(false);
                        window.starWorking.anims && window.starWorking.anims.stop();
                    }
                    star.setVisible(true);
                    star.setScale(IDLE_STAR_SCALE);
                    star.anims.play('star_idle', true);
                    star.setPosition(IDLE_SOFA_ANCHOR.x, IDLE_SOFA_ANCHOR.y);
                    sofa.anims && sofa.anims.stop();
                    sofa.setTexture('sofa_idle');
                } else {
                    star.setVisible(false);
                    star.anims && star.anims.stop();
                    if (window.starWorking) {
                        window.starWorking.setVisible(true);
                        window.starWorking.anims.play('star_working', true);
                    }
                    sofa.anims && sofa.anims.stop();
                    sofa.setTexture('sofa_idle');
                }
            }
        }
    }
}

function placeOverlayAndStatusAtCanvasBottomLeft() {
    const canvasEl = game?.canvas || document.querySelector('#game-container canvas');
    const fallbackBox = document.getElementById('game-container');
    const rect = canvasEl?.getBoundingClientRect?.() || fallbackBox?.getBoundingClientRect?.();

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

function updateLoadingProgress() {
    loadedAssets++;
    const percent = Math.min(100, Math.round((loadedAssets / totalAssets) * 100));
    if (loadingProgressBar) loadingProgressBar.style.width = percent + '%';
    if (loadingText) renderBootLoadingText(percent);
}

function hideLoadingOverlay() {
    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.style.transition = 'opacity 0.35s ease';
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                if (loadingOverlay) loadingOverlay.style.display = 'none';
            }, 360);
        }
    }, 80);
}

function hideGameSkeleton() {
    const sk = document.getElementById('game-skeleton');
    if (!sk) return;
    sk.style.transition = 'opacity 0.25s ease';
    sk.style.opacity = '0';
    setTimeout(() => { if (sk && sk.parentNode) sk.parentNode.removeChild(sk); }, 260);
}

// ============================================================
// NOTE: Phaser.Game is created by inline-main.js (initGame)
// DO NOT create Phaser.Game here - it would conflict
// ============================================================
