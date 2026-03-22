/* Guest Agent System - extracted from index.html */

// ========== State Variables ==========
let guestAgents = [];
let guestSprites = {}; // agentId -> {sprite, nameText}
let guestBubbles = {}; // agentId -> bubble container
const GUEST_AVATARS = ['guest_role_1','guest_role_2','guest_role_3','guest_role_4','guest_role_5','guest_role_6'];
let guestTweens = {};  // agentId -> {move, name}
let hiddenDemoNames = new Set();
const DEMO_MODE = new URLSearchParams(window.location.search).get('demo') === '1';
const FETCH_INTERVAL = 1000;
const GUEST_AGENTS_FETCH_INTERVAL = 3500;
const BLINK_INTERVAL = 2500;
const BUBBLE_INTERVAL = 8000;
const CAT_BUBBLE_INTERVAL = 18000; // cat bubble much less frequent
let lastCatBubble = 0;
let lastGuestAgentsFetch = 0;
let lastGuestBubbleAt = 0;
const TYPEWRITER_DELAY = 50;
let lastSeenGuestIds = new Set(); // 用于检测新加入的访客，触发欢迎气泡
let guestWelcomeInitialized = false;

// ========== Helper Functions (used by guest system) ==========
function getAreaRect(area) {
    // 区域坐标（海辛提供，左上-右下；这里的 x/y 作为 sprite 底部锚点坐标来用）
    // 休息区域范围（511,262）（841,621）
    // 工作区域范围（190,526）（380,683）
    // error 区域范围（932,275）（1109,327）
    const rects = {
        breakroom: { x1: 511, y1: 262, x2: 841, y2: 621 },
        writing:   { x1: 190, y1: 526, x2: 380, y2: 683 },
        error:     { x1: 932, y1: 275, x2: 1109, y2: 327 }
    };
    return rects[area] || rects.breakroom;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPointInRect(rect) {
    return { x: randomInt(rect.x1, rect.x2), y: randomInt(rect.y1, rect.y2) };
}

function getAreaPoint(area, idx) {
    // 非 demo 访客：仍用固定点位，避免每次轮询都抖动。
    const map = {
        breakroom: [
            { x: 511, y: 262 },
            { x: 841, y: 621 },
            { x: 690, y: 470 },
            { x: 600, y: 340 },
            { x: 770, y: 540 },
            { x: 550, y: 420 },
            { x: 720, y: 310 },
            { x: 650, y: 580 }
        ],
        writing: [
            { x: 190, y: 526 },
            { x: 380, y: 683 },
            { x: 300, y: 610 },
            { x: 240, y: 570 },
            { x: 350, y: 640 },
            { x: 160, y: 600 },
            { x: 420, y: 560 },
            { x: 280, y: 660 }
        ],
        error: [
            { x: 932, y: 275 },
            { x: 1109, y: 327 },
            { x: 1020, y: 305 },
            { x: 960, y: 340 },
            { x: 1070, y: 280 },
            { x: 990, y: 260 },
            { x: 1050, y: 350 },
            { x: 940, y: 310 }
        ]
    };
    const arr = map[area] || map.breakroom;
    return arr[idx % arr.length];
}

// ========== Core Guest Functions ==========

function removeGuestSpriteByName(name) {
    const target = guestAgents.find(a => (a.name || '') === name);
    if (target && guestSprites[target.agentId]) {
        guestSprites[target.agentId].sprite.destroy();
        guestSprites[target.agentId].nameText.destroy();
        delete guestSprites[target.agentId];
    }
    if (target && guestBubbles[target.agentId]) {
        guestBubbles[target.agentId].destroy();
        delete guestBubbles[target.agentId];
    }
}

function leaveGuestAgent(agentId, name) {
    fetch('/leave-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, name })
    }).then(response => response.json()).then(data => {
        if (data.ok) {
            // 优先按 agentId 清理，避免重名误伤
            if (agentId && guestSprites[agentId]) {
                guestSprites[agentId].sprite.destroy();
                guestSprites[agentId].nameText.destroy();
                delete guestSprites[agentId];
            }
            if (agentId && guestBubbles[agentId]) {
                guestBubbles[agentId].destroy();
                delete guestBubbles[agentId];
            }
            fetchGuestAgents();
            alert((name || agentId) + ' 已离开房间');
        } else {
            // demo agent 没在后端也允许本地隐藏
            if (DEMO_MODE && (name === '尼卡' || name === '水星')) {
                hiddenDemoNames.add(name);
                removeGuestSpriteByName(name);
                renderGuestAgentList();
                alert(name + ' 已离开房间（demo）');
                return;
            }
            alert('离开失败：' + (data.msg || '未知错误'));
        }
    }).catch(error => {
        alert('请求失败：' + error);
    });
}

function approveGuestAgent(agentId) {
    fetch('/agent-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
    }).then(response => response.json()).then(data => {
        if (data.ok) {
            fetchGuestAgents();
            alert('已批准该访客接入');
        } else {
            alert('批准失败：' + (data.msg || '未知错误'));
        }
    }).catch(error => {
        alert('请求失败：' + error);
    });
}

function rejectGuestAgent(agentId) {
    fetch('/agent-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
    }).then(response => response.json()).then(data => {
        if (data.ok) {
            fetchGuestAgents();
            alert('已拒绝该访客');
        } else {
            alert('拒绝失败：' + (data.msg || '未知错误'));
        }
    }).catch(error => {
        alert('请求失败：' + error);
    });
}

function ensureDemoVisitors() {
    if (!DEMO_MODE) return;
    if (!Array.isArray(window.__demoVisitors) || window.__demoVisitors.length === 0) {
        window.__demoVisitors = [
            { agentId: 'demo_nika', name: '尼卡', authStatus: 'approved', state: 'writing', bubbleText: '我在工作中', isDemo: true, updated_at: new Date().toISOString() },
            { agentId: 'demo_mercury', name: '水星', authStatus: 'approved', state: 'idle', bubbleText: '我去休息区躺一下', isDemo: true, updated_at: new Date().toISOString() }
        ];
    }
}

function getMergedVisitors() {
    const realVisitors = (guestAgents || []).filter(a => !a.isMain);
    if (!DEMO_MODE) return realVisitors;

    ensureDemoVisitors();
    const demoVisitors = window.__demoVisitors.filter(v => !hiddenDemoNames.has(v.name));
    return [...realVisitors, ...demoVisitors];
}

function renderGuestAgentList() {
    const list = document.getElementById('guest-agent-list');
    if (!list) return;

    const visitors = getMergedVisitors();
    if (visitors.length === 0) {
        list.innerHTML = '<div style="color:#9ca3af;font-size:12px;text-align:center;padding:20px 0;">暂无访客</div>';
        return;
    }

    list.innerHTML = visitors.map(agent => {
        const name = agent.name || '未命名访客';
        const escapedName = escapeHtml(name);
        const escapedAgentId = escapeHtml(agent.agentId || '');
        const authStatus = agent.authStatus || 'pending';
        const state = agent.state || 'idle';
        const statusMap = {
            approved: '已授权',
            pending: '待授权',
            rejected: '已拒绝',
            offline: '离线'
        };
        const stateMap = {
            idle: '待命',
            writing: '工作',
            researching: '调研',
            executing: '执行',
            syncing: '同步',
            error: '报警'
        };

        const statusText = statusMap[authStatus] || authStatus;
        const stateText = stateMap[state] || state;
        const subtitle = `${statusText} · ${stateText}`;

        const pendingActions = `<button onclick="alert('交换 skill 功能开发中')">交换skill</button><button class="leave-btn" onclick="leaveGuestAgent('${escapedAgentId}','${escapedName}')">离开房间</button>`;

        return `
          <div class="guest-agent-item" data-name="${escapedName}">
            <div>
              <div class="guest-agent-name">${escapedName}</div>
              <div style="font-size:11px;color:#cbd5e1;">${subtitle}</div>
            </div>
            <div class="guest-agent-buttons">
              ${pendingActions}
            </div>
          </div>
        `;
    }).join('');
}

function renderGuestAgentsInScene() {
    if (!game) return;
    const visitors = getMergedVisitors();
    const seenIds = new Set();
    let idxBreak = 0, idxWrite = 0, idxError = 0;

    visitors.forEach(agent => {
        const id = agent.agentId;

        // 楼层过滤：只显示当前楼层的Agent（或未指定楼层的Agent）
        const agentFloor = agent.floor || '1F'; // 默认在大堂
        if (agentFloor !== currentFloor) {
            // 隐藏不在当前楼层的Agent
            if (guestSprites[id]) {
                guestSprites[id].sprite.setVisible(false);
                guestSprites[id].nameText.setVisible(false);
            }
            return;
        }

        // 确保在当前楼层的Agent可见
        if (guestSprites[id]) {
            guestSprites[id].sprite.setVisible(true);
            guestSprites[id].nameText.setVisible(true);
        }

        seenIds.add(id);

        const isDemo = !!agent.isDemo || (DEMO_MODE && (id === 'demo_nika' || id === 'demo_mercury' || agent.name === '尼卡' || agent.name === '水星'));
        const area = agent.area || (agent.state === 'error' ? 'error' : (agent.state === 'idle' ? 'breakroom' : 'writing'));

        const idx = area === 'breakroom' ? idxBreak++ : area === 'error' ? idxError++ : idxWrite++;
        const p = isDemo
            ? randomPointInRect(getAreaRect(area))
            : getAreaPoint(area, idx);

        if (!guestSprites[id]) {
            // 优先用图标：demo visitor 有专门映射
            let sprite;
            const isDemoNika = DEMO_MODE && (agent.agentId === 'demo_nika' || agent.name === '尼卡');
            const isDemoMercury = DEMO_MODE && (agent.agentId === 'demo_mercury' || agent.name === '水星');

            if (isDemoNika || isDemoMercury) {
                // 统一使用动态像素角色，避免依赖已删除的 demo 静态图
                const animKey = 'guest_anim_1';
                const f = 0;
                sprite = game.add.sprite(p.x, p.y, animKey, f).setOrigin(0.5, 1).setScale(1.1);
                if (sprite.anims && sprite.anims.play) sprite.anims.play(animKey, true);
            } else {
                // 非 demo 访客：优先用动画精灵（guest_anim_x），其次静态图，兜底星星
                // 先确定角色索引（1-6）
                let animIdx = agent.avatar
                    ? parseInt((agent.avatar.match(/_(\d+)$/) || [])[1] || '0', 10)
                    : 0;
                if (!animIdx || animIdx < 1 || animIdx > 6) {
                    const aid = String(agent.agentId || '');
                    let hash = 0;
                    for (let i = 0; i < aid.length; i++) hash = (hash * 31 + aid.charCodeAt(i)) >>> 0;
                    animIdx = (hash % 6) + 1;
                }
                const animKey = `guest_anim_${animIdx}`;
                const animIdleKey = `guest_anim_${animIdx}_idle`;

                if (game.textures.exists(animKey) && game.anims.exists(animIdleKey)) {
                    sprite = game.add.sprite(p.x, p.y, animKey).setOrigin(0.5, 1).setScale(4.0);
                    sprite.anims.play(animIdleKey, true);
                } else {
                    const staticAvatarKey = agent.avatar && game.textures.exists(agent.avatar)
                        ? agent.avatar
                        : (() => {
                            const aid = String(agent.agentId || '');
                            let hash = 0;
                            for (let i = 0; i < aid.length; i++) hash = (hash * 31 + aid.charCodeAt(i)) >>> 0;
                            return GUEST_AVATARS[hash % GUEST_AVATARS.length];
                        })();

                    if (staticAvatarKey && game.textures.exists(staticAvatarKey)) {
                        sprite = game.add.image(p.x, p.y, staticAvatarKey).setOrigin(0.5, 1).setScale(1.15);
                    } else {
                        sprite = game.add.text(p.x, p.y, '⭐', { fontFamily: 'ArkPixel, monospace', fontSize: '30px' }).setOrigin(0.5, 1);
                    }
                }
            }
            sprite.setDepth(2600);
            if (DEMO_MODE && (agent.agentId === 'demo_mercury' || agent.name === '水星')) {
                sprite.y = sprite.y + 10;
            }

            // demo 水星下移 10px（仅 demo_mercury）
            const yOffset = (DEMO_MODE && (agent.agentId === 'demo_mercury' || agent.name === '水星')) ? 10 : 0;

            const nameTextY = isDemo ? ((p.y + yOffset) - 80) : ((p.y + yOffset) - 120);
            const nameText = game.add.text(p.x, nameTextY, agent.name || '访客', {
                fontFamily: 'ArkPixel, monospace',
                fontSize: isDemo ? '16px' : '15px',
                fill: '#ffffff',
                stroke: '#000',
                strokeThickness: 3
            }).setOrigin(0.5);
            nameText.setDepth(2601);

            guestSprites[id] = { sprite, nameText };
        } else {
            const g = guestSprites[id];
            const yOffset = (DEMO_MODE && (agent.agentId === 'demo_mercury' || agent.name === '水星')) ? 10 : 0;

            // demo：平滑移动（避免闪现）；非 demo：保持稳定位置（避免轮询抖动）
            if (isDemo) {
                // kill previous tweens for this id
                if (guestTweens[id] && guestTweens[id].move) {
                    guestTweens[id].move.stop();
                }
                if (guestTweens[id] && guestTweens[id].name) {
                    guestTweens[id].name.stop();
                }

                const duration = 2000 + Math.floor(Math.random() * 1000); // 2~3s 走路感
                const ease = 'Sine.easeInOut';

                const moveTween = game.tweens.add({
                    targets: g.sprite,
                    x: p.x,
                    y: p.y + yOffset,
                    duration,
                    ease
                });
                const nameTween = game.tweens.add({
                    targets: g.nameText,
                    x: p.x,
                    y: (p.y + yOffset) - 80,
                    duration,
                    ease
                });
                guestTweens[id] = { move: moveTween, name: nameTween };
            } else {
                g.sprite.x = p.x;
                g.sprite.y = p.y + yOffset;
                g.nameText.x = p.x;
                g.nameText.y = (p.y + yOffset) - 120;
            }

            g.nameText.setText(agent.name || '访客');
        }
    });

    // 删除消失的 agent + 清理其气泡/tween
    Object.keys(guestSprites).forEach(id => {
        if (!seenIds.has(id)) {
            guestSprites[id].sprite.destroy();
            guestSprites[id].nameText.destroy();
            delete guestSprites[id];
            if (guestBubbles[id]) {
                guestBubbles[id].destroy();
                delete guestBubbles[id];
            }
            if (guestTweens[id]) {
                try { guestTweens[id].move && guestTweens[id].move.stop(); } catch(e) {}
                try { guestTweens[id].name && guestTweens[id].name.stop(); } catch(e) {}
                delete guestTweens[id];
            }
        }
    });
}

function maybeShowGuestBubble(time) {
    if (time - lastGuestBubbleAt < 5200) return;
    lastGuestBubbleAt = time;
    const ids = Object.keys(guestSprites);
    if (ids.length === 0) return;
    const id = ids[Math.floor(Math.random() * ids.length)];
    const g = guestSprites[id];

    // demo 气泡：优先展示与状态对应的内容，便于验证"状态→区域→气泡"链路
    const demoVisitor = (DEMO_MODE && window.__demoVisitors)
        ? (window.__demoVisitors.find(v => v.agentId === id) || window.__demoVisitors.find(v => v.name === (g.nameText && g.nameText.text)))
        : null;

    const statusThoughtsMap = {
        idle: ['我在休息区待命', '先放松一下，等下一步任务', '我在休息充电中'],
        writing: ['我在工作区处理任务', '正在整理文档与执行中', '工作区专注推进中'],
        researching: ['我在调研模式，搜集信息', '正在查资料和验证线索', '研究中，稍后同步结论'],
        executing: ['执行中，正在跑流程', '我在工作区推进任务', '正在把计划落地执行'],
        syncing: ['同步中，马上更新状态', '正在同步进度到系统', '数据同步中请稍候'],
        error: ['我在 bug 区排查问题', '检测到异常，正在修复', '报警中，先定位再处理']
    };
    const agentState = (guestAgents.find(a => a.agentId === id) || {}).state || 'idle';
    const thoughts = statusThoughtsMap[agentState] || statusThoughtsMap.idle;
    const text = (demoVisitor && demoVisitor.bubbleText) ? demoVisitor.bubbleText : thoughts[Math.floor(Math.random() * thoughts.length)];

    if (guestBubbles[id]) {
        guestBubbles[id].destroy();
        delete guestBubbles[id];
    }

    const bx = g.sprite.x;
    // 气泡位置：demo 维持原逻辑；真实访客放在"名字上方"，避免压角色也避免压名字
    const isDemoGuest = (demoVisitor && demoVisitor.isDemo) || (id === 'demo_nika' || id === 'demo_mercury');
    const nameH = (g.nameText && g.nameText.height) ? g.nameText.height : 16;
    const by = isDemoGuest ? (g.sprite.y - 90) : ((g.nameText ? g.nameText.y : (g.sprite.y - 150)) - (nameH / 2) - 22);
    const fontSize = IS_TOUCH_DEVICE ? 14 : 12;
    const bg = game.add.rectangle(bx, by, text.length * 10 + 24, 28, 0xffffff, 0.95);
    bg.setStrokeStyle(2, 0x000000);
    const txt = game.add.text(bx, by, text, { fontFamily: 'ArkPixel, monospace', fontSize: fontSize + 'px', fill: '#000' }).setOrigin(0.5);
    const bubble = game.add.container(0, 0, [bg, txt]);
    bubble.setDepth(2700);
    guestBubbles[id] = bubble;

    // 让气泡跟随 sprite 锚点（用于 demo 平滑移动时也保持贴合）
    bubble.__followAgentId = id;

    setTimeout(() => {
        if (guestBubbles[id]) {
            guestBubbles[id].destroy();
            delete guestBubbles[id];
        }
    }, 3200);
}

function maybeRandomizeDemoVisitors() {
    if (!DEMO_MODE) return;
    ensureDemoVisitors();

    // 按海辛需求：每 8 秒切换一次状态
    window.__demoNextAt = window.__demoNextAt || 0;
    const now = Date.now();
    if (now < window.__demoNextAt) return;
    window.__demoNextAt = now + 8000;

    const states = ['idle', 'writing', 'researching', 'executing', 'syncing', 'error'];
    const bubbleTextMapByLang = {
        zh: {
            idle: '我去休息区躺一下',
            writing: '我在工作中',
            researching: '我在调研中',
            executing: '我在执行任务',
            syncing: '我在同步状态',
            error: '出错了！我去报警区'
        },
        en: {
            idle: 'Taking a break in the lounge.',
            writing: 'I am working now.',
            researching: 'I am researching now.',
            executing: 'I am executing tasks.',
            syncing: 'I am syncing status.',
            error: 'Something broke! Heading to alert zone.'
        },
        ja: {
            idle: '休憩エリアでひと休み。',
            writing: '作業中です。',
            researching: '調査中です。',
            executing: 'タスクを実行中です。',
            syncing: '状態を同期中です。',
            error: 'エラー発生！アラートエリアへ。'
        }
    };
    const bubbleTextMap = bubbleTextMapByLang[uiLang] || bubbleTextMapByLang.zh;

    // 确保两位 demo 角色不会总是同一个状态（增加可观测性）
    const pickJs = (exclude) => {
        let s = states[Math.floor(Math.random() * states.length)];
        let tries = 0;
        while (exclude && s === exclude && tries < 5) {
            s = states[Math.floor(Math.random() * states.length)];
            tries++;
        }
        return s;
    };

    const current = window.__demoVisitors || [];
    const cur0 = current[0] ? (current[0].state || 'idle') : 'idle';

    const next0 = pickJs(cur0);
    const next1 = pickJs(next0); // 尽量不同
    const nextStates = [next0, next1];

    const prevVisitors = current.map((v) => ({ ...v }));
    window.__demoVisitors = current.map((v, i) => {
        const nextState = nextStates[i] || pickJs(v.state);
        return {
            ...v,
            state: nextState,
            bubbleText: bubbleTextMap[nextState] || String(nextState),
            updated_at: new Date().toISOString()
        };
    });

    // 状态切换时：每一位 demo 都立即冒泡（强制），用于清晰验证链路
    try {
        if (typeof game !== 'undefined' && game) {
            // 找出状态实际变了的 demo visitor，给他们强制冒泡
            const prevById = {};
            prevVisitors.forEach(v => { prevById[v.agentId] = v; });
            const newVisitors = window.__demoVisitors || [];
            newVisitors.forEach(agent => {
                const prev = prevById[agent.agentId];
                const changed = !prev || prev.state !== agent.state;
                if (changed) {
                    // 直接冒泡
                    if (guestSprites[agent.agentId]) {
                        const g = guestSprites[agent.agentId];
                        const text = agent.bubbleText || '';
                        if (guestBubbles[agent.agentId]) {
                            guestBubbles[agent.agentId].destroy();
                            delete guestBubbles[agent.agentId];
                        }
                        const bx = g.sprite.x;
                        const by = g.sprite.y - 90;
                        const fontSize = IS_TOUCH_DEVICE ? 14 : 12;
                        const bg = game.add.rectangle(bx, by, text.length * 10 + 24, 28, 0xffffff, 0.95);
                        bg.setStrokeStyle(2, 0x000000);
                        const txt = game.add.text(bx, by, text, { fontFamily: 'ArkPixel, monospace', fontSize: fontSize + 'px', fill: '#000' }).setOrigin(0.5);
                        const bubble = game.add.container(0, 0, [bg, txt]);
                        bubble.setDepth(2700);
                        bubble.__followAgentId = agent.agentId;
                        guestBubbles[agent.agentId] = bubble;
                        setTimeout(() => {
                            if (guestBubbles[agent.agentId]) {
                                guestBubbles[agent.agentId].destroy();
                                delete guestBubbles[agent.agentId];
                            }
                        }, 3200);
                    }
                }
            });
        }
    } catch (e) { console.error('强制冒泡失败:', e); }
}

function fetchGuestAgents() {
    // demo 随机状态先更新（不依赖后端）
    maybeRandomizeDemoVisitors();

    return fetch('/agents?t=' + Date.now(), { cache: 'no-store' })
        .then(response => response.json())
        .then(data => {
            // 无论后端返回是否为数组，demo=1 都应保证本地 demo 访客可见
            guestAgents = Array.isArray(data) ? data : [];

            // 新访客检测：触发 Star 欢迎气泡（只欢迎真实访客，不欢迎 demo）
            try {
                const merged = getMergedVisitors();
                const currentIds = new Set((merged || []).filter(a => !a.isMain && !a.isDemo).map(a => a.agentId));

                if (!guestWelcomeInitialized) {
                    // 首次初始化不欢迎，避免刷新页面就刷屏
                    lastSeenGuestIds = currentIds;
                    guestWelcomeInitialized = true;
                } else {
                    const newIds = [];
                    currentIds.forEach(id => { if (!lastSeenGuestIds.has(id)) newIds.push(id); });

                    if (newIds.length > 0) {
                        // 只欢迎第一个新来的（避免同一时刻多人加入刷屏）
                        const newAgent = (merged || []).find(a => a.agentId === newIds[0]);
                        if (newAgent && newAgent.name) {
                            // 临时将 currentState 视为 writing 以允许 showBubble 展示
                            const oldState = currentState;
                            currentState = 'writing';
                            // 临时更换 bubble 文案
                            const lang = uiLang;
                            const welcomeTexts = {
                                zh: [`欢迎 ${newAgent.name} 来到办公室～`,`Hi ${newAgent.name}，一起开工吧`,`${newAgent.name} 已加入，欢迎！`],
                                en: [`Welcome ${newAgent.name} to the office!`,`Hi ${newAgent.name}, let's build something.`,`${newAgent.name} just joined — welcome!`],
                                ja: [`${newAgent.name} さん、オフィスへようこそ！`,`Hi ${newAgent.name}、一緒に進めよう。`,`${newAgent.name} さんが参加しました、歓迎！`]
                            };
                            const langPack = BUBBLE_TEXTS[lang] || BUBBLE_TEXTS.zh;
                            const oldTexts = Array.isArray(langPack.writing) ? [...langPack.writing] : [];
                            langPack.writing = welcomeTexts[lang] || welcomeTexts.zh;
                            showBubble();
                            // 还原
                            langPack.writing = oldTexts;
                            currentState = oldState;
                        }
                    }

                    lastSeenGuestIds = currentIds;
                }
            } catch (e) { /* ignore */ }

            renderGuestAgentList();
            renderGuestAgentsInScene();
        })
        .catch(error => {
            console.error('拉取访客列表失败:', error);
            // 即使拉取失败，demo 也要能渲染
            if (DEMO_MODE) {
                renderGuestAgentList();
                renderGuestAgentsInScene();
            }
        });
}
