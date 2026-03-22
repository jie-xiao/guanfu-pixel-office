/* Check-in system - extracted from index.html */

// ==================== 打卡系统 ====================
let checkInData = {
    lastCheckIn: null,
    streak: 0,
    todayCheckedIn: false,
    records: []
};

// 加载打卡数据
function loadCheckInData() {
    try {
        const saved = localStorage.getItem('guanfu_checkin_data');
        if (saved) {
            checkInData = JSON.parse(saved);
            // 检查是否是新的一天
            const today = new Date().toDateString();
            const lastDay = checkInData.lastCheckIn ? new Date(checkInData.lastCheckIn).toDateString() : null;
            checkInData.todayCheckedIn = (today === lastDay);
        }
    } catch (e) {
        console.warn('加载打卡数据失败:', e);
    }
}

// 保存打卡数据
function saveCheckInData() {
    try {
        localStorage.setItem('guanfu_checkin_data', JSON.stringify(checkInData));
    } catch (e) {
        console.warn('保存打卡数据失败:', e);
    }
}

// 执行打卡
function performCheckIn() {
    const now = new Date();
    const today = now.toDateString();
    const lastDay = checkInData.lastCheckIn ? new Date(checkInData.lastCheckIn).toDateString() : null;
    const yesterday = new Date(now.getTime() - 86400000).toDateString();

    if (today === lastDay) {
        // 今天已经打卡
        showCheckInResult(false, '今日已打卡', `连续打卡 ${checkInData.streak} 天`);
        return;
    }

    // 检查是否连续打卡
    if (lastDay === yesterday) {
        checkInData.streak++;
    } else {
        checkInData.streak = 1;
    }

    checkInData.lastCheckIn = now.toISOString();
    checkInData.todayCheckedIn = true;
    checkInData.records.push({
        time: now.toISOString(),
        floor: currentFloor,
        streak: checkInData.streak
    });

    // 只保留最近30天的记录
    if (checkInData.records.length > 30) {
        checkInData.records = checkInData.records.slice(-30);
    }

    saveCheckInData();
    showCheckInResult(true, '打卡成功！', `连续打卡 ${checkInData.streak} 天 🎉`);
    triggerCheckInAnimation();
}

// 显示打卡结果
function showCheckInResult(success, title, message) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    const resultBox = document.createElement('div');
    resultBox.id = 'checkin-result';
    resultBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.8);
        background: ${success ? 'linear-gradient(135deg, #1a472a 0%, #0d1117 100%)' : 'linear-gradient(135deg, #2a1a0a 0%, #0d1117 100%)'};
        border: 2px solid ${success ? '#4caf50' : '#ff9800'};
        border-radius: 16px;
        padding: 30px 40px;
        z-index: 1000020;
        font-family: 'ArkPixel', monospace;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px ${success ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)'};
        animation: checkInPop 0.4s ease-out forwards;
    `;
    resultBox.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">${success ? '✅' : '⏰'}</div>
        <div style="color: ${success ? '#4caf50' : '#ff9800'}; font-size: 22px; font-weight: bold; margin-bottom: 10px;">${title}</div>
        <div style="color: #c8d3e8; font-size: 16px; margin-bottom: 15px;">${message}</div>
        <div style="color: #8b949e; font-size: 12px;">打卡时间: ${timeStr}</div>
        <div style="color: #666; font-size: 11px; margin-top: 20px;">点击任意处关闭</div>
    `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes checkInPop {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.05); }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(resultBox);

    // 点击关闭
    const closeHandler = () => {
        resultBox.style.animation = 'checkInPop 0.3s ease-in reverse forwards';
        setTimeout(() => resultBox.remove(), 300);
        document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);

    // 自动关闭
    setTimeout(() => {
        if (document.getElementById('checkin-result')) {
            closeHandler();
        }
    }, 5000);
}

// 打卡成功动画
function triggerCheckInAnimation() {
    const container = document.getElementById('game-container');
    if (!container) return;

    // 创建庆祝粒子
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            width: 8px;
            height: 8px;
            background: ${['#ffd700', '#4caf50', '#2196f3', '#ff9800', '#e91e63'][Math.floor(Math.random() * 5)]};
            border-radius: 50%;
            pointer-events: none;
            z-index: 200;
            animation: celebrateParticle 1s ease-out forwards;
            --tx: ${(Math.random() - 0.5) * 400}px;
            --ty: ${(Math.random() - 0.5) * 400}px;
        `;
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }

    // 添加动画样式
    if (!document.getElementById('celebrate-style')) {
        const style = document.createElement('style');
        style.id = 'celebrate-style';
        style.textContent = `
            @keyframes celebrateParticle {
                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// 显示打卡面板
function showCheckInPanel() {
    loadCheckInData();

    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    // 获取1F成员信息
    const floorMember = FLOOR_MEMBERS['1F'].members[0];
    const memberColor = floorMember.color || '#E91E63';
    const memberStatus = MEMBER_STATUS_DISPLAY[floorMember.status] || { text: floorMember.scene, color: memberColor };

    const panel = document.createElement('div');
    panel.id = 'checkin-panel';
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e 0%, #0d1117 100%);
        border: 2px solid #ffd700;
        border-radius: 16px;
        padding: 30px 40px;
        z-index: 1000015;
        font-family: 'ArkPixel', monospace;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(255,215,0,0.2);
        min-width: 380px;
    `;

    const streakEmoji = checkInData.streak >= 30 ? '🏆' : checkInData.streak >= 14 ? '🌟' : checkInData.streak >= 7 ? '⭐' : '📌';
    const statusText = checkInData.todayCheckedIn ? '今日已打卡 ✓' : '今日未打卡';
    const statusColor = checkInData.todayCheckedIn ? '#4caf50' : '#ff9800';

    panel.innerHTML = `
        <div style="font-size: 14px; color: #8b949e; margin-bottom: 10px;">🏢 观复阁 · 打卡系统</div>
        <div style="font-size: 16px; color: #c8d3e8; margin-bottom: 20px;">${dateStr}</div>

        <div style="background: rgba(255,215,0,0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px;">${streakEmoji}</div>
            <div style="font-size: 14px; color: #8b949e;">连续打卡</div>
            <div style="font-size: 36px; color: #ffd700; font-weight: bold;">${checkInData.streak} 天</div>
        </div>

        <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 20px;">
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px 15px;">
                <div style="font-size: 12px; color: #8b949e;">当前状态</div>
                <div style="font-size: 14px; color: ${statusColor};">${statusText}</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px 15px;">
                <div style="font-size: 12px; color: #8b949e;">当前时间</div>
                <div style="font-size: 14px; color: #c8d3e8;">${timeStr}</div>
            </div>
        </div>

        <button id="checkin-btn" style="
            background: ${checkInData.todayCheckedIn ? '#333' : 'linear-gradient(135deg, #ffd700 0%, #ff9800 100%)'};
            color: ${checkInData.todayCheckedIn ? '#666' : '#1a1a2e'};
            border: none;
            border-radius: 8px;
            padding: 12px 40px;
            font-family: 'ArkPixel', monospace;
            font-size: 16px;
            font-weight: bold;
            cursor: ${checkInData.todayCheckedIn ? 'not-allowed' : 'pointer'};
            transition: all 0.3s ease;
            margin-bottom: 15px;
        " ${checkInData.todayCheckedIn ? 'disabled' : ''}>
            ${checkInData.todayCheckedIn ? '✓ 已打卡' : '📍 立即打卡'}
        </button>

        <div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 15px -40px 15px -40px; padding-top: 15px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                <span style="font-size: 28px;">${floorMember.emoji}</span>
                <div style="text-align: left;">
                    <div style="color: ${memberColor}; font-size: 14px; font-weight: bold;">${floorMember.name} · ${floorMember.role}</div>
                    <div style="color: ${memberStatus.color}; font-size: 11px;">● ${memberStatus.text}</div>
                </div>
            </div>
        </div>

        <div style="color: #666; font-size: 11px;">点击其他区域关闭</div>
    `;

    document.body.appendChild(panel);

    // 绑定打卡按钮
    const checkInBtn = document.getElementById('checkin-btn');
    if (checkInBtn && !checkInData.todayCheckedIn) {
        checkInBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.remove();
            performCheckIn();
        });
        checkInBtn.addEventListener('mouseenter', () => {
            if (!checkInData.todayCheckedIn) {
                checkInBtn.style.transform = 'scale(1.05)';
                checkInBtn.style.boxShadow = '0 5px 20px rgba(255,215,0,0.4)';
            }
        });
        checkInBtn.addEventListener('mouseleave', () => {
            checkInBtn.style.transform = 'scale(1)';
            checkInBtn.style.boxShadow = 'none';
        });
    }

    // 点击关闭
    const closeHandler = (e) => {
        if (e.target === panel || panel.contains(e.target)) return;
        panel.remove();
        document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
}

// ==================== 签到统计面板 ====================

// 加载并渲染签到统计面板
async function loadCheckinStats() {
    try {
        const resp = await fetch('/checkin/stats?t=' + Date.now());
        const data = await resp.json();
        if (!data.ok) return;

        // 更新今日状态
        const todayBadge = document.getElementById('checkin-today-badge');
        if (todayBadge) {
            if (data.todayChecked) {
                todayBadge.textContent = '✓ 已签到';
                todayBadge.className = 'checkin-today-badge checked';
            } else {
                todayBadge.textContent = '未签到';
                todayBadge.className = 'checkin-today-badge unchecked';
            }
        }

        // 更新连续签到（从 localStorage 读取）
        loadCheckInData();
        const streakEl = document.getElementById('checkin-streak');
        if (streakEl) streakEl.textContent = checkInData.streak + ' 天';

        // 更新本月统计
        const monthEl = document.getElementById('checkin-month');
        if (monthEl) monthEl.textContent = data.monthCount + ' 次';

        // 渲染本周图表
        renderCheckinWeekChart(data.weekDays || []);

        // 更新签到按钮状态
        const doBtn = document.getElementById('checkin-do-btn');
        if (doBtn) {
            doBtn.disabled = data.todayChecked;
            doBtn.textContent = data.todayChecked ? '✓ 今日已完成' : '📍 立即签到';
        }
    } catch (e) {
        console.warn('加载签到统计失败:', e);
        // 降级到 localStorage
        loadCheckInData();
        const streakEl = document.getElementById('checkin-streak');
        if (streakEl) streakEl.textContent = checkInData.streak + ' 天';
        const monthEl = document.getElementById('checkin-month');
        if (monthEl) {
            const now = new Date();
            const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
            const monthCount = (checkInData.records || []).filter(r => r.time && r.time.startsWith(thisMonth)).length;
            monthEl.textContent = monthCount + ' 次';
        }
        const doBtn = document.getElementById('checkin-do-btn');
        if (doBtn) {
            doBtn.disabled = checkInData.todayChecked;
            doBtn.textContent = checkInData.todayChecked ? '✓ 今日已完成' : '📍 立即签到';
        }
    }
}

// 渲染本周签到柱状图
function renderCheckinWeekChart(weekDays) {
    const chartEl = document.getElementById('checkin-week-chart');
    if (!chartEl) return;

    const maxCount = Math.max(1, ...weekDays.map(d => d.count));
    const today = new Date().toISOString().slice(0, 10);

    chartEl.innerHTML = weekDays.map(d => {
        const heightPct = Math.max(5, Math.round((d.count / maxCount) * 100));
        const isToday = d.date === today;
        const barStyle = isToday ? 'background: linear-gradient(to top, #ffd700, #ff9800);' : 'background: linear-gradient(to top, #4caf50, #81c784);';
        return `
            <div class="checkin-day-bar">
                <div class="checkin-bar-fill" style="${barStyle} height: ${heightPct}%;"></div>
                <div class="checkin-bar-label">${d.label.slice(5)}</div>
            </div>
        `;
    }).join('');
}

// 从签到统计面板触发签到
async function doCheckinFromPanel() {
    const doBtn = document.getElementById('checkin-do-btn');
    if (doBtn) {
        doBtn.disabled = true;
        doBtn.textContent = '签到中...';
    }
    try {
        const resp = await fetch('/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: 'star', floor: currentFloor })
        });
        const data = await resp.json();
        if (data.ok) {
            // 刷新统计
            await loadCheckinStats();
            // 触发庆祝动画
            triggerCheckInAnimation();
            // 显示成功提示
            showFloorMessage('✅ 签到成功', `今日第 ${data.totalToday} 位签到`);
        } else {
            if (data.alreadyCheckedIn) {
                showFloorMessage('⏰ 已签到', '今日不要重复签到哦');
            } else {
                showFloorMessage('❌ 签到失败', data.msg || '请稍后重试');
            }
            await loadCheckinStats();
        }
    } catch (e) {
        console.warn('签到请求失败:', e);
        showFloorMessage('❌ 签到失败', '网络错误，请稍后重试');
        await loadCheckinStats();
    }
}
