/* Tea Room - extracted from index.html, split from tearoom.js */


// ===========================================
// Function: loadTeaRoomStats (lines 6086-6095)
// ===========================================
        function loadTeaRoomStats() {
            try {
                const saved = localStorage.getItem('guanfu_tearoom_stats');
                if (saved) {
                    teaRoomStats = JSON.parse(saved);
                }
            } catch (e) {
                console.warn('加载茶水间数据失败:', e);
            }
        }

// ===========================================
// Function: saveTeaRoomStats (lines 6097-6103)
// ===========================================
        function saveTeaRoomStats() {
            try {
                localStorage.setItem('guanfu_tearoom_stats', JSON.stringify(teaRoomStats));
            } catch (e) {
                console.warn('保存茶水间数据失败:', e);
            }
        }

// ===========================================
// Function: createTeaRoomButton (lines 6402-6440)
// ===========================================
        function createTeaRoomButton() {
            const btn = document.createElement('div');
            btn.id = 'tearoom-btn';
            btn.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #8d6e63, #6d4c41);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                cursor: pointer;
                z-index: 1000005;
                box-shadow: 0 4px 15px rgba(141,110,99,0.4);
                transition: transform 0.2s, box-shadow 0.2s;
            `;
            btn.innerHTML = '🍵';
            btn.title = '茶水间';

            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 6px 20px rgba(141,110,99,0.6)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 15px rgba(141,110,99,0.4)';
            });
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                loadTeaRoomStats();
                showTeaRoomPanel();
            });

            document.body.appendChild(btn);
        }

// ===========================================
// Function: showTeaRoomPanel (lines 6105-6200)
// ===========================================
        function showTeaRoomPanel() {
            if (teaRoomCooldown) {
                showToast('茶水间正在准备中，请稍后再来~ ⏳', '#ff9800');
                return;
            }

            const panel = document.createElement('div');
            panel.id = 'tearoom-panel';
            panel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #2d1810 0%, #1a0f0a 100%);
                border: 2px solid #8d6e63;
                border-radius: 16px;
                padding: 25px;
                z-index: 1000020;
                font-family: 'ArkPixel', monospace;
                box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(141,110,99,0.2);
                min-width: 400px;
            `;

            // 随机选择一个茶水间遇到的同事
            const randomMember = TEA_ROOM_MEMBERS[Math.floor(Math.random() * TEA_ROOM_MEMBERS.length)];
            const randomDialogue = randomMember.dialogue[Math.floor(Math.random() * randomMember.dialogue.length)];

            panel.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 40px;">🍵</div>
                    <div style="color: #d4a574; font-size: 20px; font-weight: bold;">茶水间</div>
                    <div style="color: #8b7355; font-size: 12px;">休息一下，充充电~</div>
                </div>

                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span style="font-size: 28px;">${randomMember.emoji}</span>
                        <div>
                            <div style="color: #d4a574; font-size: 14px; font-weight: bold;">${randomMember.name}</div>
                            <div style="color: #a0826d; font-size: 12px;">"${randomDialogue}"</div>
                        </div>
                    </div>
                </div>

                <div id="tearoom-event-area" style="min-height: 80px;">
                    <button id="draw-event-btn" style="
                        width: 100%;
                        padding: 15px;
                        background: linear-gradient(135deg, #8d6e63, #6d4c41);
                        border: none;
                        border-radius: 10px;
                        color: #fff;
                        font-family: 'ArkPixel', monospace;
                        font-size: 16px;
                        cursor: pointer;
                        transition: transform 0.2s;">
                        🎲 随机事件
                    </button>
                </div>

                <div style="display: flex; justify-content: space-around; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="text-align: center;">
                        <div style="color: #8b7355; font-size: 11px;">访问次数</div>
                        <div style="color: #d4a574; font-size: 18px; font-weight: bold;">${teaRoomStats.visitCount}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #8b7355; font-size: 11px;">能量值</div>
                        <div style="color: #4caf50; font-size: 18px; font-weight: bold;">${teaRoomStats.totalEnergy}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #8b7355; font-size: 11px;">快乐值</div>
                        <div style="color: #ff9800; font-size: 18px; font-weight: bold;">${teaRoomStats.totalHappy}</div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 15px; color: #666; font-size: 11px;">点击其他区域关闭</div>
            `;

            document.body.appendChild(panel);

            // 绑定随机事件按钮
            document.getElementById('draw-event-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                triggerTeaRoomEvent();
            });

            teaRoomStats.visitCount++;
            saveTeaRoomStats();

            const closeHandler = (e) => {
                if (e.target === panel || panel.contains(e.target)) return;
                panel.remove();
                document.removeEventListener('click', closeHandler);
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 100);
        }

// ===========================================
// Function: createTeaRoomParticles (lines 6248-6269)
// ===========================================
        function createTeaRoomParticles() {
            const container = document.getElementById('game-container');
            if (!container) return;

            for (let i = 0; i < 15; i++) {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: absolute;
                    left: ${600 + Math.random() * 200}px;
                    top: ${300 + Math.random() * 150}px;
                    width: 8px;
                    height: 8px;
                    background: #ffd700;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 1000030;
                    animation: teaParticle 1s ease-out forwards;
                `;
                container.appendChild(particle);
                setTimeout(() => particle.remove(), 1000);
            }
        }

// ===========================================
// Function: triggerTeaRoomEvent (lines 6202-6233)
// ===========================================
        function triggerTeaRoomEvent() {
            const eventArea = document.getElementById('tearoom-event-area');
            if (!eventArea) return;

            // 随机选择事件
            const event = TEA_ROOM_EVENTS[Math.floor(Math.random() * TEA_ROOM_EVENTS.length)];

            // 更新统计
            if (event.effect === 'energy') teaRoomStats.totalEnergy += event.value;
            if (event.effect === 'happy') teaRoomStats.totalHappy += event.value;
            teaRoomStats.events.push({ id: event.id, time: Date.now() });
            saveTeaRoomStats();

            // 显示事件动画
            eventArea.innerHTML = `
                <div style="text-align: center; animation: fadeIn 0.3s ease;">
                    <div style="font-size: 48px; margin-bottom: 10px;">${event.emoji}</div>
                    <div style="color: #d4a574; font-size: 16px; font-weight: bold;">${event.title}</div>
                    <div style="color: #a0826d; font-size: 12px; margin: 8px 0;">${event.desc}</div>
                    <div style="display: inline-block; background: rgba(76,175,80,0.2); color: #4caf50; padding: 5px 15px; border-radius: 15px; font-size: 12px;">
                        +${event.value} ${getEffectName(event.effect)}
                    </div>
                </div>
            `;

            // 设置冷却时间
            teaRoomCooldown = true;
            setTimeout(() => { teaRoomCooldown = false; }, 30000); // 30秒冷却

            // 显示庆祝粒子
            createTeaRoomParticles();
        }
