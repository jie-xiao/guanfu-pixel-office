/* Department Panels - extracted from index.html, split from departments.js */

/* ============================================================
   DEPARTMENT PANEL FUNCTIONS
   ============================================================ */

// ------------------- 2F 分析部 -------------------
function showAnalysisPanel() {
    // 模拟漏洞情报数据
    const vulns = [
        { id: 'CVE-2026-0001', severity: 'critical', title: 'SQL注入漏洞', product: '某电商系统', time: '2小时前', status: '待验证' },
        { id: 'CVE-2026-0002', severity: 'high', title: '远程代码执行', product: '某CMS系统', time: '5小时前', status: '验证中' },
        { id: 'CVE-2026-0003', severity: 'medium', title: '敏感信息泄露', product: '某社交平台', time: '1天前', status: '已上报' },
        { id: 'CVE-2026-0004', severity: 'low', title: 'CSRF跨站请求', product: '某企业内部系统', time: '2天前', status: '已修复' }
    ];

    const severityColors = {
        'critical': '#f44336',
        'high': '#ff9800',
        'medium': '#ffc107',
        'low': '#4caf50'
    };

    const radarItems = [
        { angle: 0, label: 'Web漏洞', value: 72 },
        { angle: 45, label: 'API安全', value: 58 },
        { angle: 90, label: '移动端', value: 45 },
        { angle: 135, label: '云安全', value: 83 },
        { angle: 180, label: '数据安全', value: 67 },
        { angle: 225, label: '身份认证', value: 91 },
        { angle: 270, label: '供应链', value: 54 },
        { angle: 315, label: '社工攻击', value: 38 }
    ];

    const panel = document.createElement('div');
    panel.id = 'analysis-panel';
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a0a20 0%, #0d1117 100%);
        border: 2px solid #9c27b0;
        border-radius: 16px;
        padding: 25px 30px;
        z-index: 1000015;
        font-family: 'ArkPixel', monospace;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(156,39,176,0.3);
        min-width: 520px;
    `;

    let vulnsHTML = vulns.map(v => `
        <div style="display: flex; align-items: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px; border-left: 3px solid ${severityColors[v.severity]};">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="background: ${severityColors[v.severity]}30; color: ${severityColors[v.severity]}; padding: 2px 8px; border-radius: 4px; font-size: 10px; text-transform: uppercase;">${v.severity}</span>
                    <span style="color: #c8d3e8; font-size: 13px;">${v.title}</span>
                </div>
                <div style="color: #666; font-size: 11px; margin-top: 4px;">${v.product} · ${v.time}</div>
            </div>
            <div style="color: ${v.status === '已修复' ? '#4caf50' : v.status === '已上报' ? '#2196f3' : '#ff9800'}; font-size: 11px; padding: 3px 10px; background: rgba(255,255,255,0.05); border-radius: 4px;">${v.status}</div>
        </div>
    `).join('');

    // 雷达图 SVG
    const radarSize = 140;
    const radarCx = radarSize / 2;
    const radarCy = radarSize / 2;
    const radarR = radarSize / 2 - 15;
    const gridLines = [0.25, 0.5, 0.75, 1.0];
    let radarSVG = `<svg width="${radarSize}" height="${radarSize}" style="display: block; margin: 0 auto;">`;

    gridLines.forEach(scale => {
        const r = radarR * scale;
        radarSVG += `<circle cx="${radarCx}" cy="${radarCy}" r="${r}" fill="none" stroke="#3b2252" stroke-width="1"/>`;
    });

    radarItems.forEach(item => {
        const rad = (item.angle - 90) * Math.PI / 180;
        const x2 = radarCx + radarR * Math.cos(rad);
        const y2 = radarCy + radarR * Math.sin(rad);
        radarSVG += `<line x1="${radarCx}" y1="${radarCy}" x2="${x2}" y2="${y2}" stroke="#3b2252" stroke-width="1"/>`;
    });

    let points = radarItems.map(item => {
        const rad = (item.angle - 90) * Math.PI / 180;
        const r = radarR * (item.value / 100);
        const x = radarCx + r * Math.cos(rad);
        const y = radarCy + r * Math.sin(rad);
        return `${x},${y}`;
    }).join(' ');
    radarSVG += `<polygon points="${points}" fill="rgba(156,39,176,0.3)" stroke="#9c27b0" stroke-width="2"/>`;

    radarItems.forEach(item => {
        const rad = (item.angle - 90) * Math.PI / 180;
        const labelR = radarR + 14;
        const x = radarCx + labelR * Math.cos(rad);
        const y = radarCy + labelR * Math.sin(rad);
        radarSVG += `<text x="${x}" y="${y}" fill="#8b949e" font-size="9" text-anchor="middle" dominant-baseline="middle">${item.label}</text>`;
    });

    radarSVG += '</svg>';

    panel.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 28px;">📡</div>
            <div style="color: #9c27b0; font-size: 18px; font-weight: bold;">分析部 · 安全雷达</div>
            <div style="color: #8b949e; font-size: 12px;">漏洞情报监控面板</div>
        </div>
        <div style="display: flex; gap: 20px;">
            <div style="flex: 0 0 160px; text-align: center;">
                ${radarSVG}
                <div style="margin-top: 8px;">
                    <div style="color: #9c27b0; font-size: 11px;">威胁等级</div>
                    <div style="color: #ffc107; font-size: 16px; font-weight: bold;">中高级 ⚠️</div>
                </div>
            </div>
            <div style="flex: 1;">
                <div style="color: #c8d3e8; font-size: 13px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span>📋 最新漏洞情报</span>
                    <span style="color: #9c27b0;">${vulns.length} 条</span>
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${vulnsHTML}
                </div>
            </div>
        </div>
        <div style="display: flex; justify-content: space-around; margin-top: 15px; padding: 12px; background: rgba(156,39,176,0.1); border-radius: 8px;">
            <div style="text-align: center;">
                <div style="color: #f44336; font-size: 20px; font-weight: bold;">1</div>
                <div style="color: #666; font-size: 10px;">严重</div>
            </div>
            <div style="text-align: center;">
                <div style="color: #ff9800; font-size: 20px; font-weight: bold;">1</div>
                <div style="color: #666; font-size: 10px;">高危</div>
            </div>
            <div style="text-align: center;">
                <div style="color: #ffc107; font-size: 20px; font-weight: bold;">1</div>
                <div style="color: #666; font-size: 10px;">中危</div>
            </div>
            <div style="text-align: center;">
                <div style="color: #4caf50; font-size: 20px; font-weight: bold;">1</div>
                <div style="color: #666; font-size: 10px;">低危</div>
            </div>
            <div style="text-align: center;">
                <div style="color: #9c27b0; font-size: 20px; font-weight: bold;">0</div>
                <div style="color: #666; font-size: 10px;">待上报</div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 15px; color: #666; font-size: 11px;">点击其他区域关闭</div>
    `;

    document.body.appendChild(panel);

    const closeHandler = (e) => {
        if (e.target === panel || panel.contains(e.target)) return;
        panel.remove();
        document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
}

// ------------------- B2 服务器房 -------------------
function showServerStatus() {
    const statuses = [
        { name: '主服务器', status: '运行中', cpu: 45, mem: 62, color: '#4caf50' },
        { name: '数据库', status: '运行中', cpu: 32, mem: 58, color: '#4caf50' },
        { name: '缓存服务', status: '运行中', cpu: 18, mem: 24, color: '#4caf50' },
        { name: 'API网关', status: '运行中', cpu: 28, mem: 35, color: '#4caf50' }
    ];

    const panel = document.createElement('div');
    panel.id = 'server-status-panel';
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #0a1628 0%, #0d1117 100%);
        border: 2px solid #00bcd4;
        border-radius: 16px;
        padding: 25px 30px;
        z-index: 1000015;
        font-family: 'ArkPixel', monospace;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(0,188,212,0.2);
        min-width: 400px;
    `;

    let statusHTML = statuses.map(s => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;">
            <div>
                <span style="color: ${s.color}; font-size: 12px;">● ${s.status}</span>
                <span style="color: #c8d3e8; margin-left: 10px;">${s.name}</span>
            </div>
            <div style="font-size: 11px; color: #8b949e;">
                CPU: ${s.cpu}% | MEM: ${s.mem}%
            </div>
        </div>
    `).join('');

    panel.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 32px;">🖥️</div>
            <div style="color: #00bcd4; font-size: 18px; font-weight: bold;">服务器状态监控</div>
            <div style="color: #8b949e; font-size: 12px;">观复阁核心机房 · B2</div>
        </div>
        ${statusHTML}
        <div style="text-align: center; margin-top: 15px; color: #666; font-size: 11px;">点击其他区域关闭</div>
    `;

    document.body.appendChild(panel);

    const closeHandler = (e) => {
        if (e.target === panel || panel.contains(e.target)) return;
        panel.remove();
        document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
}

// ------------------- B1 档案室 -------------------
function showArchiveSearch() {
    const archives = [
        { id: 1, title: '项目启动会议记录', date: '2026-03-15', category: '会议' },
        { id: 2, title: 'Q1季度报告', date: '2026-03-10', category: '报告' },
        { id: 3, title: '系统架构设计文档', date: '2026-03-08', category: '技术' },
        { id: 4, title: '用户反馈汇总', date: '2026-03-05', category: '运营' },
        { id: 5, title: '财务审计报告', date: '2026-03-01', category: '财务' },
    ];

    const panel = document.createElement('div');
    panel.id = 'archive-search-panel';
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1410 0%, #0d0a08 100%);
        border: 2px solid #8d6e63;
        border-radius: 16px;
        padding: 25px;
        z-index: 1000015;
        font-family: 'ArkPixel', monospace;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(141,110,99,0.2);
        min-width: 450px;
    `;

    const categoryColors = {
        '会议': '#4caf50',
        '报告': '#2196f3',
        '技术': '#ff9800',
        '运营': '#e91e63',
        '财务': '#9c27b0'
    };

    let archivesHTML = archives.map(a => `
        <div style="display: flex; align-items: center; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s;"
             onmouseover="this.style.background='rgba(141,110,99,0.15)'"
             onmouseout="this.style.background='rgba(255,255,255,0.03)'">
            <div style="flex: 1;">
                <div style="color: #c8d3e8; font-size: 14px;">${a.title}</div>
                <div style="color: #8b949e; font-size: 11px; margin-top: 4px;">📅 ${a.date}</div>
            </div>
            <div style="background: ${categoryColors[a.category]}20; color: ${categoryColors[a.category]}; padding: 3px 10px; border-radius: 10px; font-size: 11px;">
                ${a.category}
            </div>
        </div>
    `).join('');

    panel.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 32px;">📚</div>
            <div style="color: #d4a574; font-size: 18px; font-weight: bold;">档案室</div>
            <div style="color: #8b7355; font-size: 12px;">历史记录存档</div>
        </div>
        <div style="margin-bottom: 15px;">
            <input type="text" id="archive-search-input" placeholder="搜索档案..."
                style="width: 100%; padding: 10px 15px; background: rgba(255,255,255,0.05);
                border: 1px solid #8d6e63; border-radius: 8px; color: #c8d3e8;
                font-family: 'ArkPixel', monospace; font-size: 13px;">
        </div>
        <div id="archive-list" style="max-height: 250px; overflow-y: auto;">
            ${archivesHTML}
        </div>
        <div style="text-align: center; margin-top: 15px; color: #666; font-size: 11px;">
            共 ${archives.length} 份档案 | 点击其他区域关闭
        </div>
    `;

    document.body.appendChild(panel);

    const searchInput = document.getElementById('archive-search-input');
    const archiveList = document.getElementById('archive-list');

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const items = archiveList.querySelectorAll('div[style*="cursor: pointer"]');
        items.forEach((item) => {
            const text = item.textContent.toLowerCase();
            if (text.includes(keyword)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    const closeHandler = (e) => {
        if (e.target === panel || panel.contains(e.target)) return;
        panel.remove();
        document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
}

// ------------------- 8F 成就系统 -------------------
function showAchievements() {
    loadCheckInData();

    // 获取8F成员信息 (观复)
    const floorMember = FLOOR_MEMBERS['8F'].members[0];
    const memberColor = floorMember.color || '#00BCD4';
    const memberStatus = MEMBER_STATUS_DISPLAY[floorMember.status] || { text: floorMember.scene, color: memberColor };

    const achievements = [
        { id: 'first_checkin', name: '初来乍到', desc: '完成首次打卡', unlocked: checkInData.streak >= 1, icon: '🎯' },
        { id: 'streak_7', name: '坚持不懈', desc: '连续打卡7天', unlocked: checkInData.streak >= 7, icon: '⭐' },
        { id: 'streak_14', name: '习惯养成', desc: '连续打卡14天', unlocked: checkInData.streak >= 14, icon: '🌟' },
        { id: 'streak_30', name: '月度之星', desc: '连续打卡30天', unlocked: checkInData.streak >= 30, icon: '🏆' },
        { id: 'visitor', name: '访客达人', desc: '访问所有楼层', unlocked: true, icon: '🗺️' },
    ];

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    const panel = document.createElement('div');
    panel.id = 'achievements-panel';
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e 0%, #0d1117 100%);
        border: 2px solid #ffd700;
        border-radius: 16px;
        padding: 25px 30px;
        z-index: 1000015;
        font-family: 'ArkPixel', monospace;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(255,215,0,0.2);
        min-width: 400px;
    `;

    let achievementsHTML = achievements.map(a => `
        <div style="display: flex; align-items: center; padding: 12px; background: ${a.unlocked ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)'}; border-radius: 8px; margin-bottom: 8px; ${!a.unlocked ? 'opacity: 0.5;' : ''}">
            <div style="font-size: 28px; margin-right: 15px; filter: ${a.unlocked ? 'none' : 'grayscale(100%)'};">${a.icon}</div>
            <div>
                <div style="color: ${a.unlocked ? '#ffd700' : '#8b949e'}; font-size: 14px; font-weight: bold;">${a.name}</div>
                <div style="color: #666; font-size: 11px;">${a.desc}</div>
            </div>
            ${a.unlocked ? '<div style="margin-left: auto; color: #4caf50;">✓</div>' : ''}
        </div>
    `).join('');

    panel.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 32px;">👑</div>
            <div style="color: #ffd700; font-size: 18px; font-weight: bold;">成就殿堂</div>
            <div style="color: #8b949e; font-size: 12px;">已解锁 ${unlockedCount}/${achievements.length}</div>
        </div>
        <div style="background: rgba(0,188,212,0.1); border: 1px solid ${memberColor}; border-radius: 10px; padding: 12px; margin-bottom: 15px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 32px;">${floorMember.emoji}</span>
            <div style="flex: 1; text-align: left;">
                <div style="color: ${memberColor}; font-size: 14px; font-weight: bold;">${floorMember.name} · ${floorMember.role}</div>
                <div style="color: ${memberStatus.color}; font-size: 12px;">● ${memberStatus.text}</div>
            </div>
        </div>
        ${achievementsHTML}
        <div style="text-align: center; margin-top: 15px; color: #666; font-size: 11px;">点击其他区域关闭</div>
    `;

    document.body.appendChild(panel);

    const closeHandler = (e) => {
        if (e.target === panel || panel.contains(e.target)) return;
        panel.remove();
        document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
}

// ------------------- 7F 会议日程 -------------------
function showMeetingSchedule() {
    const now = new Date();
    const meetings = [
        { time: '09:00', title: '晨会', status: 'ended' },
        { time: '14:00', title: '产品评审', status: 'upcoming' },
        { time: '16:00', title: '周报汇总', status: 'upcoming' },
    ];

    const panel = document.createElement('div');
    panel.id = 'meeting-panel';
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #0a2818 0%, #0d1117 100%);
        border: 2px solid #4caf50;
        border-radius: 16px;
        padding: 25px 30px;
        z-index: 1000015;
        font-family: 'ArkPixel', monospace;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(76,175,80,0.2);
        min-width: 350px;
    `;

    let meetingsHTML = meetings.map(m => `
        <div style="display: flex; align-items: center; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;">
            <div style="color: ${m.status === 'ended' ? '#666' : '#4caf50'}; font-size: 14px; font-weight: bold; width: 60px;">${m.time}</div>
            <div style="color: ${m.status === 'ended' ? '#666' : '#c8d3e8'}; font-size: 14px;">${m.title}</div>
            <div style="margin-left: auto; font-size: 12px; color: ${m.status === 'ended' ? '#666' : '#4caf50'};">
                ${m.status === 'ended' ? '已结束' : '待开始'}
            </div>
        </div>
    `).join('');

    panel.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 32px;">📋</div>
            <div style="color: #4caf50; font-size: 18px; font-weight: bold;">今日会议</div>
            <div style="color: #8b949e; font-size: 12px;">${now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</div>
        </div>
        ${meetingsHTML}
        <div style="text-align: center; margin-top: 15px; color: #666; font-size: 11px;">点击其他区域关闭</div>
    `;

    document.body.appendChild(panel);

    const closeHandler = (e) => {
        if (e.target === panel || panel.contains(e.target)) return;
        panel.remove();
        document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
}

// ------------------- 5F 销售部 -------------------
function showSalesPanel() {
    const panel = document.createElement('div');
    panel.id = 'dept-sales-panel';
    panel.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(13,17,23,0.98) 0%, rgba(20,15,10,0.98) 100%);
        border: 2px solid #FF9800; border-radius: 16px;
        padding: 24px; z-index: 1000020;
        font-family: 'ArkPixel', monospace;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(255,152,0,0.15);
        min-width: 480px; max-width: 560px;
    `;

    const clients = [
        { name: '北京华信科技', contact: '李总', status: '跟进中', last: '3小时前', value: '¥12万' },
        { name: '上海鼎丰贸易', contact: '王经理', status: '已签约', last: '1天前', value: '¥28万' },
        { name: '广州智云数据', contact: '张总', status: '洽谈中', last: '2小时前', value: '¥8万' },
        { name: '深圳创新互联', contact: '陈经理', status: '跟进中', last: '5小时前', value: '¥15万' },
        { name: '成都天府软件', contact: '刘总', status: '已签约', last: '1天前', value: '¥20万' }
    ];

    const statusColors = { '跟进中': '#FF9800', '已签约': '#4CAF50', '洽谈中': '#42A5F5' };

    const todayFollowups = [
        { client: '北京华信科技', action: '电话沟通需求', time: '10:00' },
        { client: '广州智云数据', action: '发送方案报价', time: '14:30' },
        { client: '深圳创新互联', action: '合同确认跟进', time: '16:00' }
    ];

    let clientsHTML = clients.map(c => `
        <div style="display:flex; align-items:center; padding:9px 12px; background:rgba(255,255,255,0.03); border-radius:8px; margin-bottom:6px; border-left:3px solid ${statusColors[c.status]};">
            <div style="flex:1;">
                <div style="color:#c8d3e8; font-size:13px;">${c.name}</div>
                <div style="color:#8b949e; font-size:11px; margin-top:2px;">📞 ${c.contact} · ${c.last}</div>
            </div>
            <div style="text-align:right;">
                <div style="color:${statusColors[c.status]}; font-size:11px; background:${statusColors[c.status]}20; padding:2px 8px; border-radius:4px;">${c.status}</div>
                <div style="color:#ffd700; font-size:11px; margin-top:3px;">${c.value}</div>
            </div>
        </div>
    `).join('');

    let todayHTML = todayFollowups.map(f => `
        <div style="display:flex; align-items:center; padding:7px 10px; background:rgba(255,152,0,0.08); border-radius:6px; margin-bottom:5px;">
            <span style="color:#FF9800; font-size:11px; min-width:45px;">${f.time}</span>
            <span style="color:#c8d3e8; font-size:12px; flex:1;">${f.client}</span>
            <span style="color:#8b949e; font-size:11px;">${f.action}</span>
        </div>
    `).join('');

    panel.innerHTML = `
        <div style="text-align:center; margin-bottom:18px;">
            <div style="font-size:28px;">🛒</div>
            <div style="color:#FF9800; font-size:17px; font-weight:bold;">销售部 · 拾遗</div>
            <div style="color:#8b949e; font-size:11px; margin-top:3px;">客户管理 &amp; 今日跟进</div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
                <div style="color:#FF9800; font-size:12px; font-weight:bold; margin-bottom:8px;">👥 客户列表</div>
                <div style="max-height:200px; overflow-y:auto;">${clientsHTML}</div>
            </div>
            <div>
                <div style="color:#FF9800; font-size:12px; font-weight:bold; margin-bottom:8px;">📅 今日跟进</div>
                <div style="max-height:200px; overflow-y:auto;">${todayHTML}</div>
                <button onclick="showToast('📞 外呼系统开发中...')" style="
                    width:100%; margin-top:10px; padding:8px;
                    background:linear-gradient(135deg,#FF9800,#f57c00);
                    color:#1a1a2e; border:none; border-radius:8px;
                    font-family:'ArkPixel',monospace; font-size:12px;
                    cursor:pointer;
                ">📞 快速外呼</button>
            </div>
        </div>
        <div style="text-align:center; margin-top:14px; color:#666; font-size:11px;">点击其他区域关闭</div>
    `;

    document.body.appendChild(panel);
    const close = (e) => { if (e.target === panel || !panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 100);
}
