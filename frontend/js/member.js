/* Member Status & Department Panels - extracted from index.html */

// ========== 成员场景+特殊功能组合面板 ==========

// 1F大堂：成员场景 + 打卡入口
function showMemberSceneWithCheckin(floorId) {
    showMemberScene(floorId);
    // 添加打卡按钮
    setTimeout(() => {
        const panel = document.getElementById('member-scene-panel');
        if (panel) {
            const checkinBtn = document.createElement('button');
            checkinBtn.textContent = '📍 打卡系统';
            checkinBtn.style.cssText = `
                position: absolute;
                bottom: 15px;
                right: 15px;
                background: linear-gradient(135deg, #ffd700, #ff9800);
                color: #1a1a2e;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-family: 'ArkPixel', monospace;
                font-size: 12px;
            `;
            checkinBtn.onclick = () => {
                panel.remove();
                showCheckInPanel();
            };
            panel.appendChild(checkinBtn);
        }
    }, 100);
}

// 8F阁主：成员场景 + 成就入口
function showMemberSceneWithAchievements(floorId) {
    showMemberScene(floorId);
    setTimeout(() => {
        const panel = document.getElementById('member-scene-panel');
        if (panel) {
            const achBtn = document.createElement('button');
            achBtn.textContent = '🏆 成就系统';
            achBtn.style.cssText = `
                position: absolute;
                bottom: 15px;
                right: 15px;
                background: linear-gradient(135deg, #ffd700, #ff9800);
                color: #1a1a2e;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-family: 'ArkPixel', monospace;
                font-size: 12px;
            `;
            achBtn.onclick = () => {
                panel.remove();
                showAchievements();
            };
            panel.appendChild(achBtn);
        }
    }, 100);
}

// 7F会议室：成员场景 + 预约入口
function showMemberSceneWithMeeting(floorId) {
    showMemberScene(floorId);
    setTimeout(() => {
        const panel = document.getElementById('member-scene-panel');
        if (panel) {
            const meetBtn = document.createElement('button');
            meetBtn.textContent = '📅 会议室预约';
            meetBtn.style.cssText = `
                position: absolute;
                bottom: 15px;
                right: 15px;
                background: linear-gradient(135deg, #ffd700, #ff9800);
                color: #1a1a2e;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-family: 'ArkPixel', monospace;
                font-size: 12px;
            `;
            meetBtn.onclick = () => {
                panel.remove();
                showMeetingRoomBooking();
            };
            panel.appendChild(meetBtn);
        }
    }, 100);
}

// ==================== 楼层专属互动功能 ====================

function triggerFloorInteraction(floorId) {
    const floorInfo = FLOORS[floorId];
    const decor = FLOOR_DECORATIONS[floorId];

    switch (floorId) {
        case '1F':
            // 人事部：招聘进度 + 今日待办
            showHumanResourcesPanel();
            break;
        case '2F':
            // 分析部：安全雷达/漏洞情报面板
            showAnalysisPanel();
            break;
        case '3F':
            // 工程部：服务器状态 + Bug追踪 + 代码广播
            showEngineeringPanel();
            break;
        case '4F':
            // 财务部：今日待处理 + 预算状态 + 审批入口
            showFinancePanel();
            break;
        case '5F':
            // 销售部：客户列表 + 今日跟进 + 快速外呼
            showSalesPanel();
            break;
        case '7F':
            // 文案部：今日任务 + 发布统计
            showWritingPanel();
            break;
        case 'B2':
            // 服务器房：显示系统状态
            showServerStatus();
            break;
        case 'B1':
            // 档案室：搜索历史
            showArchiveSearch();
            break;
        case '8F':
            // 阁主办公室：成员场景 + 成就入口
            showMemberSceneWithAchievements(floorId);
            break;
        default:
            // 其他楼层：显示成员场景
            showMemberScene(floorId);
    }
}

// ==================== 成员场景面板 ====================

let memberScenePanel = null;

function showMemberScene(floorId) {
    const floorInfo = FLOORS[floorId];
    const memberData = FLOOR_MEMBERS[floorId];

    if (!memberData || !memberData.members || memberData.members.length === 0) {
        showFloorMessage(floorInfo.name, '该楼层暂无成员信息');
        return;
    }

    // 移除旧面板
    if (memberScenePanel) {
        memberScenePanel.remove();
        memberScenePanel = null;
    }

    const panel = document.createElement('div');
    memberScenePanel = panel;
    panel.id = 'member-scene-panel';
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(13,17,23,0.98) 0%, rgba(10,15,20,0.98) 100%);
        border: 2px solid ${floorInfo.color};
        border-radius: 16px;
        padding: 25px;
        z-index: 1000020;
        font-family: 'ArkPixel', monospace;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px ${floorInfo.color}40;
        min-width: 400px;
    `;

    let membersHTML = memberData.members.map(member => {
        const statusInfo = MEMBER_STATUS_DISPLAY[member.status] || { text: '未知', color: '#666' };
        return `
            <div style="display: flex; align-items: center; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px; margin-bottom: 10px; border-left: 3px solid ${statusInfo.color};">
                <div style="font-size: 32px; margin-right: 15px;">${member.emoji}</div>
                <div style="flex: 1;">
                    <div style="color: #c8d3e8; font-size: 16px; font-weight: bold;">${member.name}</div>
                    <div style="color: #8b949e; font-size: 12px;">${member.role}</div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 5px;">
                        <span style="color: ${statusInfo.color}; font-size: 11px; background: ${statusInfo.color}20; padding: 2px 8px; border-radius: 4px;">● ${statusInfo.text}</span>
                        <span style="color: #666; font-size: 11px;">${member.scene}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    panel.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 28px;">${floorInfo.icon}</div>
            <div style="color: ${floorInfo.color}; font-size: 18px; font-weight: bold;">${floorInfo.name}</div>
            <div style="color: #8b949e; font-size: 12px;">${memberData.sceneDesc}</div>
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
            ${membersHTML}
        </div>
        <div style="text-align: center; margin-top: 15px; color: #666; font-size: 11px;">
            成员数: ${memberData.members.length} | 点击其他区域关闭
        </div>
    `;

    document.body.appendChild(panel);

    const closeHandler = (e) => {
        if (e.target === panel || panel.contains(e.target)) return;
        panel.remove();
        memberScenePanel = null;
        document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
}

// ==================== 扩展楼层互动（带成员场景） ====================

function triggerFloorInteractionExtended(floorId) {
    const floorInfo = FLOORS[floorId];
    const decor = FLOOR_DECORATIONS[floorId];

    switch (floorId) {
        case '1F':
            showCheckInPanel();
            break;
        case 'B2':
            showServerStatus();
            break;
        case 'B1':
            showArchiveSearch();
            break;
        case '8F':
            showAchievements();
            break;
        case '7F':
            // 会议室：显示预约面板
            showMeetingRoomBooking();
            break;
        default:
            // 其他楼层：显示成员场景
            showMemberScene(floorId);
    }
}

// ==================== 状态面板视图切换（成员视图 / 部门视图） ====================

let currentStatusView = 'members';
function switchStatusView(view) {
    currentStatusView = view;
    const memberList = document.getElementById('member-status-list');
    const deptList = document.getElementById('dept-overview-list');
    const btnMembers = document.getElementById('btn-view-members');
    const btnDepts = document.getElementById('btn-view-depts');
    const titleText = document.getElementById('member-status-title-text');
    if (view === 'members') {
        if (memberList) memberList.style.display = 'block';
        if (deptList) deptList.style.display = 'none';
        if (btnMembers) btnMembers.classList.add('active');
        if (btnDepts) btnDepts.classList.remove('active');
        if (titleText) titleText.textContent = '🏢 状 态 总 览';
    } else {
        if (memberList) memberList.style.display = 'none';
        if (deptList) deptList.style.display = 'block';
        if (btnMembers) btnMembers.classList.remove('active');
        if (btnDepts) btnDepts.classList.add('active');
        if (titleText) titleText.textContent = '🏢 部 门 总 览';
    }
}

// ========== 成员状态面板（成员/部门切换） ==========

const MEMBER_STATUS_INTERVAL = 3000; // 3秒刷新
const DEPT_OVERVIEW_INTERVAL = 5000; // 5秒刷新
let lastMembersStatusFetch = 0;
let lastDeptOverviewFetch = 0;

function fetchMembersStatus() {
    const now = Date.now();
    if (now - lastMembersStatusFetch < MEMBER_STATUS_INTERVAL) return;
    lastMembersStatusFetch = now;
    fetch('/members/status?t=' + now, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
            if (!data || !data.ok || !data.members) return;
            renderMembersStatusPanel(data.members);
        })
        .catch(e => console.warn('拉取成员状态失败:', e));
}

function renderMembersStatusPanel(members) {
    const container = document.getElementById('member-status-list');
    if (!container) return;
    if (!members || members.length === 0) {
        container.innerHTML = '<div style="color:#9ca3af;font-size:12px;text-align:center;padding:20px 0;">暂无成员数据</div>';
        return;
    }
    // 按楼层排序
    const floorOrder = ['8F','7F','6F','5F','4F','3F','2F','1F','B1','B2'];
    const sorted = [...members].sort((a, b) => {
        const ai = floorOrder.indexOf(a.floor);
        const bi = floorOrder.indexOf(b.floor);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    container.innerHTML = sorted.map(member => {
        const icon = member.state_icon || '🟢';
        const stateColor = member.state === 'busy' ? '#ef4444' : member.state === 'online' ? '#22c55e' : '#6b7280';
        const lastActive = member.last_active ? formatRelativeTime(member.last_active) : '未知';
        return `
            <div style="display:flex;align-items:center;padding:6px 10px;margin-bottom:6px;background:rgba(255,255,255,0.04);border-radius:8px;border-left:3px solid ${stateColor};">
                <span style="font-size:18px;margin-right:8px;flex-shrink:0;">${icon}</span>
                <div style="flex:1;min-width:0;">
                    <div style="color:#c8d3e8;font-size:12px;font-weight:bold;">${escapeHtml(member.name)} <span style="color:#ffd700;font-size:10px;">${member.floor}</span></div>
                    <div style="color:#8b949e;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(member.activity)}">${escapeHtml(member.activity)}</div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                    <div style="color:${stateColor};font-size:10px;font-weight:bold;">● ${member.state}</div>
                    <div style="color:#666;font-size:9px;">${lastActive}</div>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatRelativeTime(isoString) {
    if (!isoString) return '未知';
    try {
        const diff = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '刚刚';
        if (mins < 60) return mins + '分钟前';
        const hours = Math.floor(mins / 60);
        if (hours < 24) return hours + '小时前';
        return Math.floor(hours / 24) + '天前';
    } catch (e) { return '未知'; }
}

function fetchDeptOverview() {
    const now = Date.now();
    if (now - lastDeptOverviewFetch < DEPT_OVERVIEW_INTERVAL) return;
    lastDeptOverviewFetch = now;
    fetch('/departments/status?t=' + now, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
            if (!data || !data.ok || !data.departments) return;
            renderDeptOverviewPanel(data.departments);
        })
        .catch(e => console.warn('拉取部门概览失败:', e));
}

function renderDeptOverviewPanel(departments) {
    const container = document.getElementById('dept-overview-list');
    if (!container) return;
    if (!departments || departments.length === 0) {
        container.innerHTML = '<div style="color:#9ca3af;font-size:12px;text-align:center;padding:20px 0;">暂无部门数据</div>';
        return;
    }
    container.innerHTML = departments.map(dept => {
        const stateColor = dept.status === 'busy' ? '#ef4444' : dept.status === 'online' ? '#22c55e' : '#6b7280';
        const activity = dept.current_activity || '暂无活动';
        return `
            <div style="display:flex;align-items:center;padding:6px 10px;margin-bottom:6px;background:rgba(255,255,255,0.04);border-radius:8px;border-left:3px solid ${stateColor};">
                <span style="font-size:20px;margin-right:8px;flex-shrink:0;">${dept.icon || '🏢'}</span>
                <div style="flex:1;min-width:0;">
                    <div style="color:#c8d3e8;font-size:12px;font-weight:bold;">${escapeHtml(dept.name)} <span style="color:#ffd700;font-size:10px;">${dept.floor}</span></div>
                    <div style="color:#8b949e;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(activity)}">${escapeHtml(activity)}</div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                    <div style="color:${stateColor};font-size:10px;font-weight:bold;">${dept.busy_count || 0}/${dept.total_count || 0} 工作中</div>
                    <div style="color:#666;font-size:9px;">负责人: ${escapeHtml(dept.owner || '未指定')}</div>
                </div>
            </div>
        `;
    }).join('');
}
