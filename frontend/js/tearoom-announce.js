/* Announcements System - split from tearoom-meeting.js */


// ===========================================
// Function: fetchAnnouncements
// ===========================================
        async function fetchAnnouncements(force = false) {
            const now = Date.now();
            if (!force && now - announcementsData.lastFetch < ANNOUNCEMENTS_CACHE_TTL) {
                return announcementsData.announcements;
            }

            try {
                const response = await fetch('/announcements');
                const data = await response.json();
                if (data.ok) {
                    announcementsData.announcements = data.announcements;
                    announcementsData.lastFetch = now;
                    return data.announcements;
                }
            } catch (e) {
                console.warn('获取公告失败:', e);
            }
            return [];
        }

// ===========================================
// Function: showAnnouncementsPanel
// ===========================================
        async function showAnnouncementsPanel() {
            const announcements = await fetchAnnouncements(true);

            const panel = document.createElement('div');
            panel.id = 'announcements-panel';
            panel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
                border: 2px solid #42a5f5;
                border-radius: 16px;
                padding: 25px;
                z-index: 1000020;
                font-family: 'ArkPixel', monospace;
                box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(66,165,245,0.2);
                min-width: 500px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            `;

            const priorityColors = {
                'low': '#8b949e',
                'normal': '#42a5f5',
                'high': '#ff9800',
                'urgent': '#f44336'
            };

            const priorityLabels = {
                'low': '低',
                'normal': '普通',
                'high': '重要',
                'urgent': '紧急'
            };

            let announcementsHTML = '';
            if (announcements.length === 0) {
                announcementsHTML = `
                    <div style="text-align: center; padding: 40px; color: #8b949e;">
                        <div style="font-size: 48px;">📋</div>
                        <div style="margin-top: 15px;">暂无公告</div>
                    </div>
                `;
            } else {
                announcementsHTML = announcements.map(a => `
                    <div class="announcement-item" data-id="${a.id}" style="background: rgba(255,255,255,0.05); border-left: 3px solid ${priorityColors[a.priority] || priorityColors.normal}; border-radius: 8px; padding: 15px; margin-bottom: 12px; position: relative;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div style="color: ${priorityColors[a.priority] || '#c8d3e8'}; font-size: 16px; font-weight: bold; flex: 1;">${a.title}</div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="background: ${priorityColors[a.priority]}20; color: ${priorityColors[a.priority]}; padding: 2px 8px; border-radius: 10px; font-size: 10px;">
                                    ${priorityLabels[a.priority] || '普通'}
                                </div>
                                <button class="delete-ann-btn" data-id="${a.id}" style="background: none; border: none; color: #666; cursor: pointer; font-size: 14px; padding: 2px;" title="删除">✕</button>
                            </div>
                        </div>
                        <div style="color: #c8d3e8; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${a.content}</div>
                        <div style="display: flex; justify-content: space-between; margin-top: 10px; color: #666; font-size: 11px;">
                            <span>发布者: ${a.author}</span>
                            <span>${new Date(a.created_at).toLocaleString('zh-CN')}</span>
                        </div>
                    </div>
                `).join('');
            }

            panel.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 32px;">📢</div>
                    <div style="color: #42a5f5; font-size: 20px; font-weight: bold;">观复阁公告板</div>
                    <div style="color: #8b949e; font-size: 12px;">共 ${announcements.length} 条公告</div>
                </div>

                <div style="margin-bottom: 15px;">
                    <button id="new-announcement-btn" style="
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #42a5f5, #1e88e5);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-family: 'ArkPixel', monospace;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.2s;">
                        + 发布新公告
                    </button>
                </div>

                <div id="announcements-list" style="max-height: 350px; overflow-y: auto;">
                    ${announcementsHTML}
                </div>

                <div style="text-align: center; margin-top: 15px; color: #666; font-size: 11px;">点击其他区域关闭</div>
            `;

            document.body.appendChild(panel);

            // 绑定新建公告按钮
            document.getElementById('new-announcement-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showNewAnnouncementForm();
            });

            // Bind delete buttons
            panel.querySelectorAll('.ann-delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const annId = btn.dataset.id;
                    if (confirm('确定要删除这条公告吗？')) {
                        try {
                            const response = await fetch(`/announcements/${annId}`, { method: 'DELETE' });
                            const result = await response.json();
                            if (result.ok) {
                                panel.remove();
                                showAnnouncementsPanel();
                                showToast('公告已删除', '#ff9800');
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
// Function: showNewAnnouncementForm
// ===========================================
        function showNewAnnouncementForm() {
            const existingForm = document.getElementById('announcement-form-panel');
            if (existingForm) existingForm.remove();

            const formPanel = document.createElement('div');
            formPanel.id = 'announcement-form-panel';
            formPanel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
                border: 2px solid #42a5f5;
                border-radius: 12px;
                padding: 25px;
                z-index: 1000025;
                font-family: 'ArkPixel', monospace;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                min-width: 400px;
            `;

            formPanel.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="color: #42a5f5; font-size: 18px; font-weight: bold;">发布新公告</div>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="color: #c8d3e8; font-size: 12px; display: block; margin-bottom: 5px;">标题</label>
                    <input type="text" id="ann-title" placeholder="输入公告标题"
                        style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #42a5f5;
                        border-radius: 6px; color: #c8d3e8; font-family: 'ArkPixel', monospace; font-size: 13px;">
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="color: #c8d3e8; font-size: 12px; display: block; margin-bottom: 5px;">内容</label>
                    <textarea id="ann-content" placeholder="输入公告内容" rows="4"
                        style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #42a5f5;
                        border-radius: 6px; color: #c8d3e8; font-family: 'ArkPixel', monospace; font-size: 13px; resize: vertical;"></textarea>
                </div>

                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="color: #c8d3e8; font-size: 12px; display: block; margin-bottom: 5px;">优先级</label>
                        <select id="ann-priority" style="
                            width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #42a5f5;
                            border-radius: 6px; color: #c8d3e8; font-family: 'ArkPixel', monospace; font-size: 13px;">
                            <option value="low">低</option>
                            <option value="normal" selected>普通</option>
                            <option value="high">重要</option>
                            <option value="urgent">紧急</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="color: #c8d3e8; font-size: 12px; display: block; margin-bottom: 5px;">发布者</label>
                        <input type="text" id="ann-author" placeholder="您的名字"
                            style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #42a5f5;
                            border-radius: 6px; color: #c8d3e8; font-family: 'ArkPixel', monospace; font-size: 13px;">
                    </div>
                </div>

                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="cancel-ann-btn" style="padding: 10px 20px; background: rgba(255,255,255,0.1); border: 1px solid #666;
                        border-radius: 6px; color: #8b949e; cursor: pointer; font-family: 'ArkPixel', monospace;">取消</button>
                    <button id="submit-ann-btn" style="padding: 10px 20px; background: linear-gradient(135deg, #42a5f5, #1e88e5);
                        border: none; border-radius: 6px; color: white; cursor: pointer; font-family: 'ArkPixel', monospace; font-weight: bold;">发布公告</button>
                </div>
            `;

            document.body.appendChild(formPanel);

            document.getElementById('cancel-ann-btn').addEventListener('click', () => {
                formPanel.remove();
            });

            document.getElementById('submit-ann-btn').addEventListener('click', async () => {
                const title = document.getElementById('ann-title').value.trim();
                const content = document.getElementById('ann-content').value.trim();
                const priority = document.getElementById('ann-priority').value;
                const author = document.getElementById('ann-author').value.trim() || '匿名';

                if (!title || !content) {
                    alert('请填写标题和内容');
                    return;
                }

                try {
                    const response = await fetch('/announcements', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, content, priority, author })
                    });
                    const result = await response.json();

                    if (result.ok) {
                        formPanel.remove();
                        // 刷新公告列表
                        const mainPanel = document.getElementById('announcements-panel');
                        if (mainPanel) mainPanel.remove();
                        showAnnouncementsPanel();
                        showToast('公告发布成功！', '#4caf50');
                    } else {
                        alert('发布失败: ' + result.msg);
                    }
                } catch (e) {
                    alert('发布失败: ' + e.message);
                }
            });
        }

// ===========================================
// Function: createAnnouncementButton
// ===========================================
        function createAnnouncementButton() {
            const btn = document.createElement('div');
            btn.id = 'announcement-btn';
            btn.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 80px;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #42a5f5, #1e88e5);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                cursor: pointer;
                z-index: 1000005;
                box-shadow: 0 4px 15px rgba(66,165,245,0.4);
                transition: transform 0.2s, box-shadow 0.2s;
            `;
            btn.innerHTML = '📢';
            btn.title = '公告板';

            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 6px 20px rgba(66,165,245,0.6)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 15px rgba(66,165,245,0.4)';
            });
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showAnnouncementsPanel();
            });

            document.body.appendChild(btn);
        }

// ===========================================
// Function: initAnnouncementSystem
// ===========================================
        function initAnnouncementSystem() {
            createAnnouncementButton();
            createEventCalendarButton();
            // 预加载公告和事件
            fetchAnnouncements();
            fetchEvents();
            console.log('公告板和日历系统已启动');
        }
