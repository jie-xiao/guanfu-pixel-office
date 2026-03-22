/* Floor Display - extracted from index.html, split from departments.js */

/* ============================================================
   FLOOR PARTICLE SYSTEM
   ============================================================ */

// 楼层粒子特效全局状态
let floorParticles = [];

// 楼层牌匾控制标志 - true 表示楼层系统接管牌匾显示
let floorPlaqueControl = false;

// 楼层粒子特效配置（从 config.js 引用全局变量）
// window.FLOOR_PARTICLE_CONFIGS 由 config.js 的 IIFE 暴露

function createFloorParticles(floorId) {
    // 清除旧粒子
    clearFloorParticles();

    const config = FLOOR_PARTICLE_CONFIGS[floorId];
    if (!config || !game) return;

    for (let i = 0; i < config.count; i++) {
        const particle = createParticle(floorId, config, i);
        if (particle) floorParticles.push(particle);
    }
}

function createParticle(floorId, config, index) {
    const container = document.getElementById('game-container');
    if (!container) return null;

    const particle = document.createElement('div');
    particle.className = 'floor-particle';
    particle.dataset.floor = floorId;
    particle.dataset.index = index;

    // 根据模式设置初始位置和动画
    let startX, startY, endX, endY, duration, delay;

    switch (config.pattern) {
        case 'sparkle': // 闪烁星尘
            startX = Math.random() * 1280;
            startY = Math.random() * 720;
            duration = 2000 + Math.random() * 2000;
            delay = Math.random() * 3000;
            break;
        case 'float': // 漂浮上升
            startX = Math.random() * 1280;
            startY = 720 + Math.random() * 100;
            endX = startX + (Math.random() - 0.5) * 100;
            endY = -50;
            duration = 8000 + Math.random() * 4000;
            delay = Math.random() * 5000;
            break;
        case 'data': // 数据流下落
            startX = Math.random() * 1280;
            startY = -20;
            endX = startX;
            endY = 750;
            duration = 3000 + Math.random() * 2000;
            delay = Math.random() * 2000;
            break;
        case 'rise': // 上升粒子
            startX = Math.random() * 1280;
            startY = 750;
            endX = startX + (Math.random() - 0.5) * 50;
            endY = -50;
            duration = 6000 + Math.random() * 4000;
            delay = Math.random() * 3000;
            break;
        case 'coin': // 金币下落
            startX = Math.random() * 1280;
            startY = -30;
            endX = startX + (Math.random() - 0.5) * 100;
            endY = 750;
            duration = 5000 + Math.random() * 3000;
            delay = Math.random() * 4000;
            break;
        case 'code': // 代码碎片
            startX = Math.random() * 1280;
            startY = Math.random() * 720;
            duration = 1500 + Math.random() * 1500;
            delay = Math.random() * 2000;
            break;
        case 'wave': // 信号波
            startX = 0;
            startY = 100 + Math.random() * 500;
            endX = 1300;
            endY = startY + (Math.random() - 0.5) * 100;
            duration = 4000 + Math.random() * 2000;
            delay = Math.random() * 3000;
            break;
        case 'dust': // 尘埃慢飘
            startX = Math.random() * 1280;
            startY = Math.random() * 720;
            endX = startX + (Math.random() - 0.5) * 200;
            endY = startY + (Math.random() - 0.5) * 200;
            duration = 10000 + Math.random() * 5000;
            delay = Math.random() * 5000;
            break;
        case 'matrix': // 矩阵雨
            startX = Math.random() * 1280;
            startY = -20;
            endX = startX;
            endY = 750;
            duration = 2000 + Math.random() * 1500;
            delay = Math.random() * 1000;
            break;
        default:
            startX = Math.random() * 1280;
            startY = Math.random() * 720;
            duration = 3000;
            delay = 0;
    }

    particle.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: ${config.size}px;
        height: ${config.size}px;
        background: #${config.color.toString(16).padStart(6, '0')};
        border-radius: ${config.pattern === 'coin' ? '50%' : '50%'};
        opacity: ${0.3 + Math.random() * 0.5};
        pointer-events: none;
        z-index: 8;
        box-shadow: 0 0 ${config.size * 2}px #${config.color.toString(16).padStart(6, '0')};
        animation: particle-${config.pattern}-${index} ${duration}ms ease-in-out ${delay}ms infinite;
    `;

    // 创建动画关键帧
    const styleSheet = document.styleSheets[0];
    const keyframes = generateParticleKeyframes(config.pattern, startX, startY, endX, endY, index);
    try {
        styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    } catch (e) {}

    container.appendChild(particle);
    return particle;
}

function generateParticleKeyframes(pattern, startX, startY, endX, endY, index) {
    let keyframes = `@keyframes particle-${pattern}-${index} {`;

    switch (pattern) {
        case 'sparkle':
            keyframes += `
                0% { opacity: 0; transform: scale(0.5); }
                50% { opacity: 0.8; transform: scale(1.2); }
                100% { opacity: 0; transform: scale(0.5); }
            `;
            break;
        case 'float':
        case 'rise':
            keyframes += `
                0% { left: ${startX}px; top: ${startY}px; opacity: 0; }
                10% { opacity: 0.6; }
                90% { opacity: 0.6; }
                100% { left: ${endX}px; top: ${endY}px; opacity: 0; }
            `;
            break;
        case 'data':
        case 'coin':
        case 'matrix':
            keyframes += `
                0% { left: ${startX}px; top: ${startY}px; opacity: 0.8; }
                100% { left: ${endX}px; top: ${endY}px; opacity: 0.2; }
            `;
            break;
        case 'code':
            keyframes += `
                0% { opacity: 0; transform: scale(0.5) rotate(0deg); }
                20% { opacity: 0.7; }
                80% { opacity: 0.7; }
                100% { opacity: 0; transform: scale(1.5) rotate(360deg); }
            `;
            break;
        case 'wave':
            keyframes += `
                0% { left: ${startX}px; top: ${startY}px; opacity: 0; width: 5px; }
                10% { opacity: 0.6; }
                90% { opacity: 0.6; }
                100% { left: ${endX}px; top: ${endY}px; opacity: 0; width: 30px; }
            `;
            break;
        case 'dust':
            keyframes += `
                0% { left: ${startX}px; top: ${startY}px; opacity: 0.2; }
                50% { opacity: 0.5; }
                100% { left: ${endX}px; top: ${endY}px; opacity: 0.2; }
            `;
            break;
        default:
            keyframes += `
                0% { opacity: 0.5; }
                50% { opacity: 1; }
                100% { opacity: 0.5; }
            `;
    }

    keyframes += '}';
    return keyframes;
}

function clearFloorParticles() {
    floorParticles.forEach(p => {
        if (p && p.remove) p.remove();
    });
    floorParticles = [];

    // 清理动画关键帧（通过添加特定类名标记）
    document.querySelectorAll('.floor-particle').forEach(p => p.remove());
}


/* ============================================================
   FLOOR DISPLAY FUNCTIONS
   ============================================================ */

// 楼层切换过渡状态
let transitionOverlay = null;

async function playFloorTransitionAnimation(fromFloor, toFloor, goingUp) {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    // 创建过渡遮罩
    if (!transitionOverlay) {
        transitionOverlay = document.createElement('div');
        transitionOverlay.id = 'floor-transition-overlay';
        transitionOverlay.style.cssText = `
            position: absolute;
            inset: 0;
            z-index: 100;
            pointer-events: none;
            display: none;
            overflow: hidden;
        `;
        gameContainer.appendChild(transitionOverlay);
    }

    return new Promise((resolve) => {
        transitionOverlay.style.display = 'block';
        transitionOverlay.innerHTML = `
            <div style="
                position: absolute;
                inset: 0;
                background: linear-gradient(${goingUp ? '180deg' : '0deg'},
                    rgba(0,0,0,0.9) 0%,
                    rgba(0,0,0,0.7) 30%,
                    transparent 50%,
                    rgba(0,0,0,0.7) 70%,
                    rgba(0,0,0,0.9) 100%
                );
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                animation: elevatorSlide 0.6s ease-in-out;
            ">
                <div style="
                    font-family: 'ArkPixel', monospace;
                    color: #ffd700;
                    font-size: 24px;
                    text-shadow: 0 0 20px rgba(255,215,0,0.5);
                    animation: floorPulse 0.3s ease-in-out infinite alternate;
                ">${fromFloor}</div>
                <div style="
                    font-family: 'ArkPixel', monospace;
                    color: #fff;
                    font-size: 32px;
                    margin: 10px 0;
                    animation: arrowBounce 0.2s ease-in-out infinite alternate;
                ">${goingUp ? '▲' : '▼'}</div>
                <div style="
                    font-family: 'ArkPixel', monospace;
                    color: ${FLOORS[toFloor].color};
                    font-size: 24px;
                    text-shadow: 0 0 20px ${FLOORS[toFloor].color}80;
                    animation: floorPulse 0.3s ease-in-out infinite alternate;
                ">${toFloor}</div>
                <div style="
                    font-family: 'ArkPixel', monospace;
                    color: #8b949e;
                    font-size: 12px;
                    margin-top: 15px;
                ">${FLOORS[toFloor].name}</div>
            </div>
            <link rel="stylesheet" href="/static/css/main.css">
        `;

        // 动画结束后隐藏
        setTimeout(() => {
            transitionOverlay.style.display = 'none';
            resolve();
        }, 600);
    });
}

// 更新楼层显示
function updateFloorDisplay() {
    const floorCurrent = document.getElementById('floor-current');
    if (floorCurrent && FLOORS[currentFloor]) {
        floorCurrent.textContent = `${currentFloor} ${FLOORS[currentFloor].name}`;
    }
}

// 更新牌匾文字
function updatePlaqueText(floorId) {
    if (!FLOORS[floorId] || !plaqueTextObj) return;

    floorPlaqueControl = true; // 楼层系统接管牌匾

    const floorInfo = FLOORS[floorId];
    let text = '观复阁';

    if (floorInfo.type === 'private' && floorInfo.owner) {
        text = `${floorInfo.owner}的办公室`;
    } else if (floorInfo.type === 'department' && floorInfo.owner) {
        text = `${floorInfo.owner}的${floorInfo.name}`;
    } else {
        text = `观复阁 · ${floorInfo.name}`;
    }

    plaqueTextObj.setText(text);
}

// 更新楼层装饰（使用Phaser游戏场景，基于 LAYOUT.floorDecorations）
function updateFloorDecorations(floorId) {
    // 清除旧装饰
    floorDecorations.forEach(obj => {
        if (obj && obj.destroy) obj.destroy();
    });
    floorDecorations = [];

    const decorations = LAYOUT.floorDecorations[floorId];
    if (!decorations || !game) return;

    decorations.forEach(dec => {
        const cx = dec.x;
        const cy = dec.y;
        const hw = dec.w / 2;
        const hh = dec.h / 2;

        // 主背景色块
        const bg = game.add.graphics();
        bg.fillStyle(dec.bg, 0.92);
        bg.fillRoundedRect(cx - hw, cy - hh, dec.w, dec.h, 6);
        bg.lineStyle(3, dec.border, 1);
        bg.strokeRoundedRect(cx - hw, cy - hh, dec.w, dec.h, 6);
        bg.setDepth(dec.depth || 3);
        floorDecorations.push(bg);

        // 图标 Emoji
        const iconText = game.add.text(cx, cy - 10, dec.icon, {
            fontSize: '20px',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(dec.depth + 1);
        floorDecorations.push(iconText);

        // 标签文字
        const labelText = game.add.text(cx, cy + 12, dec.label, {
            fontSize: '11px',
            fontFamily: 'ArkPixel, monospace',
            fill: '#' + dec.border.toString(16).padStart(6, '0'),
            stroke: '#000',
            strokeThickness: 0,
            wordWrap: true,
            wordWrapWidth: dec.w - 10,
            align: 'center'
        }).setOrigin(0.5).setDepth(dec.depth + 1);
        floorDecorations.push(labelText);

        // Tooltip 背景（隐藏状态）
        const tooltipBg = game.add.graphics();
        tooltipBg.setDepth(9999);
        tooltipBg.setVisible(false);
        floorDecorations.push(tooltipBg);

        const tooltipText = game.add.text(0, 0, dec.tooltip, {
            fontSize: '11px',
            fontFamily: 'ArkPixel, monospace',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 1,
            wordWrap: true,
            wordWrapWidth: 180
        }).setOrigin(0.5).setDepth(10000);
        tooltipText.setVisible(false);
        floorDecorations.push(tooltipText);

        // 透明热区（可交互）
        const hitZone = game.add.zone(cx, cy, dec.w, dec.h);
        hitZone.setDepth(dec.depth + 2);
        hitZone.setInteractive({ useHandCursor: true });
        floorDecorations.push(hitZone);

        // Hover: 显示 tooltip
        hitZone.on('pointerover', () => {
            tooltipBg.clear();
            const tw = tooltipText.width + 16;
            const th = tooltipText.height + 10;
            let tx = cx;
            let ty = cy - hh - th / 2 - 4;
            if (ty < 10) ty = cy + hh + th / 2 + 4;
            if (tx + tw / 2 > 1270) tx = 1270 - tw / 2;
            if (tx - tw / 2 < 5) tx = tw / 2 + 5;
            tooltipBg.fillStyle(0x1a1a2e, 0.95);
            tooltipBg.fillRoundedRect(tx - tw / 2, ty - th / 2, tw, th, 4);
            tooltipBg.setVisible(true);
            tooltipText.setPosition(tx, ty);
            tooltipText.setVisible(true);
        });

        hitZone.on('pointerout', () => {
            tooltipBg.setVisible(false);
            tooltipText.setVisible(false);
        });
    });

    console.log(`[FloorDecor] ${floorId}: 加载了 ${decorations.length} 个专属场景元素`);
}

// 更新楼层信息面板（HTML层级，场景和提示分离）
function updateFloorInfoPanel(floorId) {
    const floorInfo = FLOORS[floorId];
    const decor = FLOOR_DECORATIONS[floorId];
    const floorInfoEl = document.getElementById('floor-info');
    if (!floorInfoEl || !floorInfo) return;

    if (decor) {
        floorInfoEl.innerHTML = `
            <span class="floor-info-emoji">${decor.emoji}</span>
            <div class="floor-info-label">${floorInfo.name}</div>
            <div class="floor-info-desc">${decor.desc || ''}</div>
        `;
        floorInfoEl.style.display = 'block';
    } else {
        floorInfoEl.style.display = 'none';
    }
}

// 楼层背景色调映射（从 config.js 引用全局变量 FLOOR_TINTS）
// window.FLOOR_TINTS 由 config.js 的 IIFE 暴露

// 更新楼层背景色调
function updateFloorBackgroundTint(floorId) {
    const tintInfo = FLOOR_TINTS[floorId];
    if (!tintInfo) return;

    // 更新游戏容器的背景色调（CSS 方案）
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.transition = 'background-color 0.5s ease';
        gameContainer.style.backgroundColor = tintInfo.overlay;
    }

    // 为楼层导航添加微光效果
    const floorNav = document.getElementById('floor-nav');
    if (floorNav) {
        floorNav.style.transition = 'box-shadow 0.5s ease';
        floorNav.style.boxShadow = `0 0 20px ${tintInfo.overlay}, 0 4px 12px rgba(0,0,0,0.4)`;
    }

    // 调用 Phaser 楼层色调叠加层（P1 新功能：真正的画面色调效果）
    if (typeof window.applyFloorTint === 'function') {
        window.applyFloorTint(floorId);
    }
}

// 楼层消息超时句柄
let floorMessageTimeout = null;

// 楼层消息提示
function showFloorMessage(title, content) {
    // 移除旧消息
    const existingMsg = document.getElementById('floor-message');
    if (existingMsg) existingMsg.remove();

    // 创建消息框
    const msgBox = document.createElement('div');
    msgBox.id = 'floor-message';
    msgBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 23, 34, 0.95);
        border: 2px solid #ffd700;
        border-radius: 12px;
        padding: 20px 30px;
        z-index: 1000010;
        font-family: 'ArkPixel', monospace;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;
    msgBox.innerHTML = `
        <div style="color: #ffd700; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${title}</div>
        <div style="color: #c8d3e8; font-size: 14px;">${content}</div>
        <div style="color: #666; font-size: 11px; margin-top: 15px;">点击任意处关闭</div>
    `;
    document.body.appendChild(msgBox);

    // 点击关闭
    const closeHandler = () => {
        msgBox.remove();
        document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);

    // 自动关闭
    if (floorMessageTimeout) clearTimeout(floorMessageTimeout);
    floorMessageTimeout = setTimeout(() => closeHandler(), 5000);
}

// 从后端同步楼层状态
async function fetchFloorState() {
    try {
        const resp = await fetch('/floor/current?t=' + Date.now(), { cache: 'no-store' });
        const data = await resp.json();
        if (data.ok && data.currentFloor && data.currentFloor !== currentFloor) {
            switchFloor(data.currentFloor);
        }
    } catch (e) {
        // 静默失败
    }
}
