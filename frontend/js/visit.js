/* Visit Notification System - extracted from index.html */

// ==================== 串门通知系统 ====================
const VISIT_TEMPLATES = [
    { template: '{visitor} 从 {from} 来到 {to} 串门了', type: 'visit' },
    { template: '{visitor} 正在 {to} 溜达', type: 'wander' },
    { template: '{visitor} 说要去 {to} 看看', type: 'plan' },
    { template: '{visitor} 在 {to} 找人聊天', type: 'chat' },
    { template: '{visitor} 路过 {to}，打了个招呼', type: 'passby' },
    { template: '听说 {visitor} 去了 {to}', type: 'rumor' }
];

let visitNotificationQueue = [];
let visitNotificationTimer = null;

function startVisitNotificationSystem() {
    // 每30-60秒随机触发一次串门通知
    scheduleNextVisit();
}

function scheduleNextVisit() {
    const delay = 30000 + Math.random() * 30000; // 30-60秒
    visitNotificationTimer = setTimeout(() => {
        generateRandomVisit();
        scheduleNextVisit();
    }, delay);
}

function generateRandomVisit() {
    // 随机选择访客
    const allMembers = [];
    Object.keys(FLOOR_MEMBERS).forEach(floorId => {
        FLOOR_MEMBERS[floorId].members.forEach(member => {
            allMembers.push({ ...member, floor: floorId, floorName: FLOORS[floorId].name });
        });
    });

    if (allMembers.length === 0) return;

    const visitor = allMembers[Math.floor(Math.random() * allMembers.length)];

    // 随机选择目标楼层（不同于当前楼层）
    let targetFloorId = visitor.floor;
    while (targetFloorId === visitor.floor) {
        const floorKeys = Object.keys(FLOORS);
        targetFloorId = floorKeys[Math.floor(Math.random() * floorKeys.length)];
    }
    const targetFloor = FLOORS[targetFloorId];

    // 随机选择通知模板
    const template = VISIT_TEMPLATES[Math.floor(Math.random() * VISIT_TEMPLATES.length)];

    // 生成通知内容
    const content = template.template
        .replace('{visitor}', `${visitor.emoji} ${visitor.name}`)
        .replace('{from}', visitor.floorName)
        .replace('{to}', `${targetFloor.icon} ${targetFloor.name}`);

    // 显示通知
    showVisitNotification(content, visitor, targetFloorId);
}

function showVisitNotification(content, visitor, targetFloorId) {
    // 移除旧通知
    const existingNotif = document.getElementById('visit-notification');
    if (existingNotif) existingNotif.remove();

    const notif = document.createElement('div');
    notif.id = 'visit-notification';
    notif.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: linear-gradient(135deg, rgba(33,150,243,0.95), rgba(25,118,210,0.95));
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-family: 'ArkPixel', monospace;
        font-size: 13px;
        z-index: 1000040;
        box-shadow: 0 4px 20px rgba(33,150,243,0.4);
        cursor: pointer;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;

    notif.innerHTML = `
        <span style="font-size: 20px;">🚶</span>
        <span style="flex: 1;">${content}</span>
        <span style="font-size: 18px; opacity: 0.7;">→</span>
    `;

    // 点击跳转到对应楼层
    notif.addEventListener('click', () => {
        switchFloor(targetFloorId);
        notif.remove();
    });

    document.body.appendChild(notif);

    // 5秒后自动消失
    setTimeout(() => {
        if (notif && notif.parentNode) {
            notif.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }
    }, 5000);
}

// 添加必要的CSS动画
function addVisitNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes teaParticle {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-100px) scale(0); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

/**
 * 更新串门通知列表
 */
async function updateVisitNotifications() {
    const container = document.getElementById('visit-notifications-list');
    if (!container) return;

    const floor = typeof getCurrentFloor === 'function' ? getCurrentFloor() : '1F';

    try {
        const response = await fetch('/api/visit/notifications?floor=' + floor + '&t=' + Date.now());
        const data = await response.json();
        if (data.ok && data.notifications && data.notifications.length > 0) {
            container.innerHTML = data.notifications.map(n => `
                <div class="visit-notification">
                    <span class="visit-notification-icon">🚪</span>
                    <div class="visit-notification-text">
                        <div class="visit-notification-name">${n.visitorName || n.visitorId}</div>
                        <div class="visit-notification-floor">进入了 ${n.targetFloor}</div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div style="color: #8b949e; font-size: 12px; text-align: center; padding: 10px;">暂无访客通知</div>';
        }
    } catch (e) {
        console.warn('获取访客通知失败:', e);
    }
}

// 初始化茶水间和串门系统
// 注意：此函数也调用 loadTeaRoomStats() 和 createTeaRoomButton()，需确保这些函数已加载
function initTeaRoomAndVisitSystem() {
    addVisitNotificationStyles();
    loadTeaRoomStats();
    createTeaRoomButton();
    startVisitNotificationSystem();
    console.log('茶水间和串门系统已启动');
}
