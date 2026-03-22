/* Department Panels (part 2) - extracted from index.html, split from departments.js */

/* ============================================================
   REMAINING DEPARTMENT PANEL FUNCTIONS
   ============================================================ */

// ------------------- 4F 财务部 -------------------
function showFinancePanel() {
    const panel = document.createElement('div');
    panel.id = 'dept-finance-panel';
    panel.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(13,17,23,0.98) 0%, rgba(15,10,20,0.98) 100%);
        border: 2px solid #9C27B0; border-radius: 16px;
        padding: 24px; z-index: 1000020;
        font-family: 'ArkPixel', monospace;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(156,39,176,0.15);
        min-width: 480px; max-width: 560px;
    `;

    const todayTasks = [
        { task: '审核3月供应商付款申请', priority: 'high', time: '上午' },
        { task: '跟进客户应收账款', priority: 'high', time: '上午' },
        { task: '整理季度预算执行报告', priority: 'medium', time: '下午' },
        { task: '银行对账操作', priority: 'low', time: '下午' }
    ];

    const budgets = [
        { dept: '工程部', allocated: 50, used: 32, color: '#2196F3' },
        { dept: '运营部', allocated: 30, used: 28, color: '#FF9800' },
        { dept: '销售部', allocated: 20, used: 12, color: '#4CAF50' }
    ];

    const priorityColors = { high: '#f44336', medium: '#ff9800', low: '#4caf50' };
    const priorityLabels = { high: '紧急', medium: '一般', low: '低' };

    let tasksHTML = todayTasks.map(t => `
        <div style="display:flex; align-items:center; padding:8px 10px; background:rgba(255,255,255,0.03); border-radius:6px; margin-bottom:6px;">
            <div style="width:8px; height:8px; border-radius:50%; background:${priorityColors[t.priority]}; margin-right:10px; flex-shrink:0;"></div>
            <span style="color:#c8d3e8; font-size:12px; flex:1;">${t.task}</span>
            <span style="color:${priorityColors[t.priority]}; font-size:10px; background:${priorityColors[t.priority]}20; padding:2px 6px; border-radius:4px; margin-right:8px;">${priorityLabels[t.priority]}</span>
            <span style="color:#8b949e; font-size:11px;">${t.time}</span>
        </div>
    `).join('');

    let budgetHTML = budgets.map(b => `
        <div style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; color:#c8d3e8; font-size:12px; margin-bottom:4px;">
                <span>${b.dept}</span><span style="color:#8b949e;">¥${b.used}万 / ¥${b.allocated}万</span>
            </div>
            <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                <div style="height:100%; width:${Math.round(b.used/b.allocated*100)}%; background:${b.color}; border-radius:3px;"></div>
            </div>
        </div>
    `).join('');

    panel.innerHTML = `
        <div style="text-align:center; margin-bottom:18px;">
            <div style="font-size:28px;">💰</div>
            <div style="color:#9C27B0; font-size:17px; font-weight:bold;">财务部 · 知微</div>
            <div style="color:#8b949e; font-size:11px; margin-top:3px;">今日待处理 &amp; 预算状态</div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
                <div style="color:#9C27B0; font-size:12px; font-weight:bold; margin-bottom:8px;">📋 今日待处理 <span style="color:#f44336;">(${todayTasks.filter(t=>t.priority==='high').length}紧急)</span></div>
                ${tasksHTML}
            </div>
            <div>
                <div style="color:#9C27B0; font-size:12px; font-weight:bold; margin-bottom:8px;">📊 预算状态</div>
                ${budgetHTML}
                <button onclick="showToast('✅ 已提交审批请求')" style="
                    width:100%; margin-top:10px; padding:8px;
                    background:linear-gradient(135deg,#9C27B0,#7b1fa2);
                    color:#fff; border:none; border-radius:8px;
                    font-family:'ArkPixel',monospace; font-size:12px;
                    cursor:pointer;
                ">📝 提交审批</button>
            </div>
        </div>
        <div style="text-align:center; margin-top:14px; color:#666; font-size:11px;">点击其他区域关闭</div>
    `;

    document.body.appendChild(panel);
    const close = (e) => { if (e.target === panel || !panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 100);
}

// ------------------- 3F 工程部 -------------------
function showEngineeringPanel() {
    const panel = document.createElement('div');
    panel.id = 'dept-engineering-panel';
    panel.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(13,17,23,0.98) 0%, rgba(10,15,18,0.98) 100%);
        border: 2px solid #607D8B; border-radius: 16px;
        padding: 24px; z-index: 1000020;
        font-family: 'ArkPixel', monospace;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(96,125,139,0.15);
        min-width: 480px; max-width: 560px;
    `;

    const servers = [
        { name: '主服务器', status: '运行中', cpu: 45, mem: 62, color: '#4CAF50' },
        { name: 'API网关', status: '运行中', cpu: 28, mem: 35, color: '#4CAF50' },
        { name: '数据库', status: '运行中', cpu: 32, mem: 58, color: '#4CAF50' },
        { name: '缓存服务', status: '告警', cpu: 89, mem: 91, color: '#f44336' }
    ];

    const bugs = [
        { id: '#1024', title: '支付接口偶发性超时', severity: 'critical', owner: 'Echo', status: '修复中' },
        { id: '#1023', title: '用户头像上传失败', severity: 'high', owner: '小张', status: '待认领' },
        { id: '#1022', title: '后台列表分页异常', severity: 'medium', owner: '小李', status: '已修复' }
    ];

    const severityColors = { critical: '#f44336', high: '#ff9800', medium: '#ffc107' };
    const severityLabels = { critical: '严重', high: '高', medium: '中' };

    let serversHTML = servers.map(s => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; background:rgba(255,255,255,0.03); border-radius:6px; margin-bottom:5px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="color:${s.color}; font-size:10px;">●</span>
                <span style="color:#c8d3e8; font-size:12px;">${s.name}</span>
            </div>
            <div style="font-size:10px; color:#8b949e;">CPU ${s.cpu}% MEM ${s.mem}%</div>
        </div>
    `).join('');

    let bugsHTML = bugs.map(b => `
        <div style="display:flex; align-items:center; padding:7px 10px; background:rgba(255,255,255,0.03); border-radius:6px; margin-bottom:5px; border-left:3px solid ${severityColors[b.severity]};">
            <span style="color:#8b949e; font-size:11px; min-width:45px;">${b.id}</span>
            <span style="color:#c8d3e8; font-size:12px; flex:1;">${b.title}</span>
            <span style="color:${severityColors[b.severity]}; font-size:10px; background:${severityColors[b.severity]}20; padding:2px 6px; border-radius:4px; margin-right:6px;">${severityLabels[b.severity]}</span>
            <span style="color:#8b949e; font-size:10px;">${b.owner}</span>
        </div>
    `).join('');

    panel.innerHTML = `
        <div style="text-align:center; margin-bottom:18px;">
            <div style="font-size:28px;">🔧</div>
            <div style="color:#607D8B; font-size:17px; font-weight:bold;">工程部 · Echo</div>
            <div style="color:#8b949e; font-size:11px; margin-top:3px;">服务器状态 &amp; Bug追踪</div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
                <div style="color:#607D8B; font-size:12px; font-weight:bold; margin-bottom:8px;">🖥️ 服务器状态</div>
                ${serversHTML}
            </div>
            <div>
                <div style="color:#607D8B; font-size:12px; font-weight:bold; margin-bottom:8px;">🐛 Bug追踪</div>
                ${bugsHTML}
                <button onclick="showToast('📡 代码广播已发送')" style="
                    width:100%; margin-top:10px; padding:8px;
                    background:linear-gradient(135deg,#607D8B,#455A64);
                    color:#fff; border:none; border-radius:8px;
                    font-family:'ArkPixel',monospace; font-size:12px;
                    cursor:pointer;
                ">📡 代码广播</button>
            </div>
        </div>
        <div style="text-align:center; margin-top:14px; color:#666; font-size:11px;">点击其他区域关闭</div>
    `;

    document.body.appendChild(panel);
    const close = (e) => { if (e.target === panel || !panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 100);
}

// ------------------- 1F 人事部 -------------------
function showHumanResourcesPanel() {
    const panel = document.createElement('div');
    panel.id = 'dept-hr-panel';
    panel.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(13,17,23,0.98) 0%, rgba(18,12,20,0.98) 100%);
        border: 2px solid #E91E63; border-radius: 16px;
        padding: 24px; z-index: 1000020;
        font-family: 'ArkPixel', monospace;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(233,30,99,0.15);
        min-width: 480px; max-width: 560px;
    `;

    const recruits = [
        { position: '安全工程师', candidates: 8, stage: '面试中', salary: '25-35K', urgent: true },
        { position: '前端开发', candidates: 5, stage: '笔试', salary: '18-25K', urgent: false },
        { position: '产品经理', candidates: 3, stage: '初筛', salary: '20-30K', urgent: false },
        { position: '数据分析师', candidates: 6, stage: '面试中', salary: '18-28K', urgent: true }
    ];

    const todayTodos = [
        { task: '安排安全工程师二面', done: false, urgent: true },
        { task: '发送offer函给前端候选人', done: false, urgent: true },
        { task: '整理本周面试评估报告', done: false, urgent: false },
        { task: '更新招聘进度表', done: true, urgent: false }
    ];

    let recruitsHTML = recruits.map(r => `
        <div style="display:flex; align-items:center; padding:9px 12px; background:rgba(255,255,255,0.03); border-radius:8px; margin-bottom:6px; ${r.urgent ? 'border-left:3px solid #f44336;' : ''}">
            <div style="flex:1;">
                <div style="color:#c8d3e8; font-size:13px;">${r.position} ${r.urgent ? '<span style="color:#f44336; font-size:10px;">🔥</span>' : ''}</div>
                <div style="color:#8b949e; font-size:11px; margin-top:2px;">👤 ${r.candidates}人 · ${r.salary}</div>
            </div>
            <div style="color:#E91E63; font-size:11px; background:rgba(233,30,99,0.15); padding:2px 8px; border-radius:4px;">${r.stage}</div>
        </div>
    `).join('');

    let todosHTML = todayTodos.map(t => `
        <div style="display:flex; align-items:center; padding:7px 10px; background:${t.done ? 'rgba(76,175,80,0.08)' : 'rgba(255,255,255,0.03)'}; border-radius:6px; margin-bottom:5px; text-decoration:${t.done ? 'line-through' : 'none'}; opacity:${t.done ? '0.6' : '1'};">
            <div style="width:14px; height:14px; border-radius:3px; border:2px solid ${t.done ? '#4CAF50' : '#E91E63'}; background:${t.done ? '#4CAF50' : 'transparent'}; margin-right:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff;">${t.done ? '✓' : ''}</div>
            <span style="color:#c8d3e8; font-size:12px; flex:1;">${t.task}</span>
            ${t.urgent && !t.done ? '<span style="color:#f44336; font-size:10px;">!</span>' : ''}
        </div>
    `).join('');

    panel.innerHTML = `
        <div style="text-align:center; margin-bottom:18px;">
            <div style="font-size:28px;">👥</div>
            <div style="color:#E91E63; font-size:17px; font-weight:bold;">人事部 · 小砚</div>
            <div style="color:#8b949e; font-size:11px; margin-top:3px;">招聘进度 &amp; 今日待办</div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
                <div style="color:#E91E63; font-size:12px; font-weight:bold; margin-bottom:8px;">📋 招聘进度</div>
                <div style="max-height:200px; overflow-y:auto;">${recruitsHTML}</div>
            </div>
            <div>
                <div style="color:#E91E63; font-size:12px; font-weight:bold; margin-bottom:8px;">✅ 今日待办</div>
                <div style="max-height:200px; overflow-y:auto;">${todosHTML}</div>
            </div>
        </div>
        <div style="text-align:center; margin-top:14px; color:#666; font-size:11px;">点击其他区域关闭</div>
    `;

    document.body.appendChild(panel);
    const close = (e) => { if (e.target === panel || !panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 100);
}

// ------------------- 7F 文案部 -------------------
function showWritingPanel() {
    const panel = document.createElement('div');
    panel.id = 'dept-writing-panel';
    panel.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(13,17,23,0.98) 0%, rgba(15,18,12,0.98) 100%);
        border: 2px solid #4CAF50; border-radius: 16px;
        padding: 24px; z-index: 1000020;
        font-family: 'ArkPixel', monospace;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(76,175,80,0.15);
        min-width: 480px; max-width: 560px;
    `;

    const todayTasks = [
        { task: '撰写产品新功能介绍文章', platform: '公众号', deadline: '14:00', progress: 80, urgent: true },
        { task: '运营周报数据整理', platform: '飞书', deadline: '17:00', progress: 30, urgent: false },
        { task: '客户案例故事撰写', platform: '官网', deadline: '明日', progress: 10, urgent: false }
    ];

    const publishStats = [
        { platform: '微信公众号', today: 1, week: 5, month: 18, reach: '2.3万' },
        { platform: '小红书', today: 2, week: 8, month: 30, reach: '1.8万' },
        { platform: '知乎专栏', today: 0, week: 2, month: 9, reach: '5.6万' }
    ];

    let tasksHTML = todayTasks.map(t => `
        <div style="padding:9px 12px; background:rgba(255,255,255,0.03); border-radius:8px; margin-bottom:7px; ${t.urgent ? 'border-left:3px solid #f44336;' : ''}">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
                <span style="color:#c8d3e8; font-size:13px; flex:1;">${t.task}</span>
                <span style="color:#8b949e; font-size:10px; background:rgba(76,175,80,0.15); padding:2px 6px; border-radius:4px;">${t.platform}</span>
                <span style="color:#ffd700; font-size:11px;">⏰ ${t.deadline}</span>
            </div>
            <div style="height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
                <div style="height:100%; width:${t.progress}%; background:linear-gradient(90deg,#4CAF50,#81C784); border-radius:2px;"></div>
            </div>
            <div style="color:#8b949e; font-size:10px; margin-top:2px; text-align:right;">${t.progress}%</div>
        </div>
    `).join('');

    let statsHTML = publishStats.map(s => `
        <div style="display:flex; align-items:center; padding:8px 10px; background:rgba(255,255,255,0.03); border-radius:6px; margin-bottom:5px;">
            <span style="color:#c8d3e8; font-size:12px; flex:1;">${s.platform}</span>
            <span style="color:#4CAF50; font-size:11px; margin-right:10px;">今日 ${s.today}篇</span>
            <span style="color:#8b949e; font-size:11px; margin-right:10px;">本周 ${s.week}篇</span>
            <span style="color:#ffd700; font-size:11px;">👁 ${s.reach}</span>
        </div>
    `).join('');

    panel.innerHTML = `
        <div style="text-align:center; margin-bottom:18px;">
            <div style="font-size:28px;">✍️</div>
            <div style="color:#4CAF50; font-size:17px; font-weight:bold;">文案部 · 墨白</div>
            <div style="color:#8b949e; font-size:11px; margin-top:3px;">今日任务 &amp; 发布统计</div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
                <div style="color:#4CAF50; font-size:12px; font-weight:bold; margin-bottom:8px;">📝 今日任务</div>
                ${tasksHTML}
            </div>
            <div>
                <div style="color:#4CAF50; font-size:12px; font-weight:bold; margin-bottom:8px;">📊 发布统计</div>
                ${statsHTML}
                <div style="margin-top:12px; padding:8px; background:rgba(76,175,80,0.08); border-radius:8px; text-align:center;">
                    <div style="color:#8b949e; font-size:10px;">本月总曝光</div>
                    <div style="color:#ffd700; font-size:18px; font-weight:bold;">9.7万</div>
                </div>
            </div>
        </div>
        <div style="text-align:center; margin-top:14px; color:#666; font-size:11px;">点击其他区域关闭</div>
    `;

    document.body.appendChild(panel);
    const close = (e) => { if (e.target === panel || !panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 100);
}
