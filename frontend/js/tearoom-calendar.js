/* Events Calendar - split from tearoom-meeting.js */


// ===========================================
// Function: showMeetingSchedule
// ===========================================
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

// ===========================================
// Function: fetchEvents
// ===========================================
        async function fetchEvents(force = false) {
            const now = Date.now();
            if (!force && now - eventsData.lastFetch < EVENTS_CACHE_TTL) {
                return eventsData.events;
            }

            try {
                const response = await fetch('/events');
                const data = await response.json();
                if (data.ok) {
                    eventsData.events = data.events;
                    eventsData.lastFetch = now;
                    return data.events;
                }
            } catch (e) {
                console.warn('获取事件失败:', e);
            }
            return [];
        }

// ===========================================
// Function: showEventsPanel
// ===========================================
        async function showEventsPanel() {
            const events = await fetchEvents(true);

            const panel = document.createElement('div');
            panel.id = 'events-panel';
            panel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
                border: 2px solid #66bb6a;
                border-radius: 16px;
                padding: 25px;
                z-index: 1000020;
                font-family: 'ArkPixel', monospace;
                box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(102,187,106,0.2);
                min-width: 500px;
                max-width: 600px;
            `;

            const categoryIcons = {
                'meeting': '👥',
                'deadline': '⏰',
                'reminder': '🔔',
                'other': '📌'
            };

            const categoryColors = {
                'meeting': '#4caf50',
                'deadline': '#f44336',
                'reminder': '#ff9800',
                'other': '#9c27b0'
            };

            let eventsHTML = '';
            if (events.length === 0) {
                eventsHTML = `
                    <div style="text-align: center; padding: 40px; color: #a5d6a7;">
                        <div style="font-size: 48px;">📅</div>
                        <div style="margin-top: 15px;">暂无日程安排</div>
                    </div>
                `;
            } else {
                eventsHTML = events.map(e => `
                    <div style="background: rgba(255,255,255,0.05); border-left: 3px solid ${categoryColors[e.category] || '#66bb6a'}; border-radius: 8px; padding: 15px; margin-bottom: 12px; position: relative;">
                        <button class="event-delete-btn" data-id="${e.id}" style="
                            position: absolute;
                            top: 8px;
                            right: 8px;
                            background: transparent;
                            border: 1px solid rgba(255,255,255,0.2);
                            color: #8b949e;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            padding: 2px 6px;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='rgba(244,67,54,0.3)';this.style.borderColor='#f44336';this.style.color='#f44336'" onmouseout="this.style.background='transparent';this.style.borderColor='rgba(255,255,255,0.2)';this.style.color='#8b949e'">✕</button>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <span style="font-size: 20px;">${categoryIcons[e.category] || '📌'}</span>
                            <div style="color: #c8e6c9; font-size: 16px; font-weight: bold;">${e.title}</div>
                        </div>
                        <div style="color: #a5d6a7; font-size: 13px; margin-bottom: 8px;">
                            📅 ${e.date}${e.time ? ' ' + e.time : ''}
                        </div>
                        ${e.description ? `<div style="color: #81c784; font-size: 12px; margin-bottom: 8px;">${e.description}</div>` : ''}
                        ${e.participants && e.participants.length > 0 ? `
                            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                                ${e.participants.map(p => `<span style="background: rgba(255,255,255,0.1); color: #c8e6c9; padding: 2px 8px; border-radius: 10px; font-size: 11px;">${p}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            }

            panel.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 32px;">📅</div>
                    <div style="color: #66bb6a; font-size: 20px; font-weight: bold;">事件日历</div>
                    <div style="color: #81c784; font-size: 12px;">共 ${events.length} 个日程</div>
                </div>

                <div style="margin-bottom: 15px;">
                    <button id="new-event-btn" style="
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #66bb6a, #43a047);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-family: 'ArkPixel', monospace;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.2s;">
                        + 添加新日程
                    </button>
                </div>

                <div id="events-list" style="max-height: 350px; overflow-y: auto;">
                    ${eventsHTML}
                </div>

                <div style="text-align: center; margin-top: 15px; color: #4caf50; font-size: 11px;">点击其他区域关闭</div>
            `;

            document.body.appendChild(panel);

            document.getElementById('new-event-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showNewEventForm();
            });

            // Bind delete buttons
            panel.querySelectorAll('.event-delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const eventId = btn.dataset.id;
                    if (confirm('确定要删除这个日程吗？')) {
                        try {
                            const response = await fetch(`/events/${eventId}`, { method: 'DELETE' });
                            const result = await response.json();
                            if (result.ok) {
                                panel.remove();
                                showEventsPanel();
                                showToast('日程已删除', '#ff9800');
                            } else {
                                alert('删除失败: ' + result.msg);
                            }
                        } catch (err) {
                            alert('删除失败: ' + err.message);
                        }
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

// ===========================================
// Function: showNewEventForm
// ===========================================
        function showNewEventForm() {
            const existingForm = document.getElementById('event-form-panel');
            if (existingForm) existingForm.remove();

            const formPanel = document.createElement('div');
            formPanel.id = 'event-form-panel';
            formPanel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%);
                border: 2px solid #66bb6a;
                border-radius: 12px;
                padding: 25px;
                z-index: 1000025;
                font-family: 'ArkPixel', monospace;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                min-width: 400px;
            `;

            // Get today's date as default
            const today = new Date().toISOString().split('T')[0];

            formPanel.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="color: #66bb6a; font-size: 18px; font-weight: bold;">添加新日程</div>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="color: #c8e6c9; font-size: 12px; display: block; margin-bottom: 5px;">标题</label>
                    <input type="text" id="event-title" placeholder="输入日程标题"
                        style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #66bb6a;
                        border-radius: 6px; color: #c8e6c9; font-family: 'ArkPixel', monospace; font-size: 13px;">
                </div>

                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="color: #c8e6c9; font-size: 12px; display: block; margin-bottom: 5px;">日期</label>
                        <input type="date" id="event-date" value="${today}"
                            style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #66bb6a;
                            border-radius: 6px; color: #c8e6c9; font-family: 'ArkPixel', monospace; font-size: 13px;">
                    </div>
                    <div style="flex: 1;">
                        <label style="color: #c8e6c9; font-size: 12px; display: block; margin-bottom: 5px;">时间</label>
                        <input type="time" id="event-time"
                            style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #66bb6a;
                            border-radius: 6px; color: #c8e6c9; font-family: 'ArkPixel', monospace; font-size: 13px;">
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="color: #c8e6c9; font-size: 12px; display: block; margin-bottom: 5px;">类型</label>
                    <select id="event-category" style="
                        width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #66bb6a;
                        border-radius: 6px; color: #c8e6c9; font-family: 'ArkPixel', monospace; font-size: 13px;">
                        <option value="meeting">👥 会议</option>
                        <option value="deadline">⏰ 截止日期</option>
                        <option value="reminder">🔔 提醒</option>
                        <option value="other">📌 其他</option>
                    </select>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="color: #c8e6c9; font-size: 12px; display: block; margin-bottom: 5px;">描述</label>
                    <textarea id="event-description" placeholder="输入描述（可选）" rows="3"
                        style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #66bb6a;
                        border-radius: 6px; color: #c8e6c9; font-family: 'ArkPixel', monospace; font-size: 13px; resize: vertical;"></textarea>
                </div>

                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="cancel-event-btn" style="padding: 10px 20px; background: rgba(255,255,255,0.1); border: 1px solid #666;
                        border-radius: 6px; color: #81c784; cursor: pointer; font-family: 'ArkPixel', monospace;">取消</button>
                    <button id="submit-event-btn" style="padding: 10px 20px; background: linear-gradient(135deg, #66bb6a, #43a047);
                        border: none; border-radius: 6px; color: white; cursor: pointer; font-family: 'ArkPixel', monospace; font-weight: bold;">添加日程</button>
                </div>
            `;

            document.body.appendChild(formPanel);

            document.getElementById('cancel-event-btn').addEventListener('click', () => {
                formPanel.remove();
            });

            document.getElementById('submit-event-btn').addEventListener('click', async () => {
                const title = document.getElementById('event-title').value.trim();
                const date = document.getElementById('event-date').value;
                const time = document.getElementById('event-time').value;
                const category = document.getElementById('event-category').value;
                const description = document.getElementById('event-description').value.trim();

                if (!title || !date) {
                    alert('请填写标题和日期');
                    return;
                }

                try {
                    const response = await fetch('/events', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, date, time, category, description, participants: [] })
                    });
                    const result = await response.json();

                    if (result.ok) {
                        formPanel.remove();
                        const mainPanel = document.getElementById('events-panel');
                        if (mainPanel) mainPanel.remove();
                        showEventsPanel();
                        showToast('日程添加成功！', '#4caf50');
                    } else {
                        alert('添加失败: ' + result.msg);
                    }
                } catch (e) {
                    alert('添加失败: ' + e.message);
                }
            });
        }

// ===========================================
// Function: createEventCalendarButton
// ===========================================
        function createEventCalendarButton() {
            const btn = document.createElement('div');
            btn.id = 'event-calendar-btn';
            btn.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 140px;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #66bb6a, #43a047);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                cursor: pointer;
                z-index: 1000005;
                box-shadow: 0 4px 15px rgba(102,187,106,0.4);
                transition: transform 0.2s, box-shadow 0.2s;
            `;
            btn.innerHTML = '📅';
            btn.title = '事件日历';

            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 6px 20px rgba(102,187,106,0.6)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 15px rgba(102,187,106,0.4)';
            });
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showEventsPanel();
            });

            document.body.appendChild(btn);
        }
