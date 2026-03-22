/* Meeting Room - split from tearoom-meeting.js */


// ===========================================
// Function: loadMeetingRoomData
// ===========================================
        function loadMeetingRoomData() {
            try {
                const saved = localStorage.getItem('guanfu_meeting_rooms');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    meetingRoomData.bookings = parsed.bookings || [];
                    // 清理过期预约（超过今天的）
                    const today = new Date().toDateString();
                    meetingRoomData.bookings = meetingRoomData.bookings.filter(b => {
                        const bookingDate = new Date(b.date).toDateString();
                        return bookingDate >= today;
                    });
                }
            } catch (e) {
                console.warn('加载会议室数据失败:', e);
                meetingRoomData.bookings = [];
            }
        }

// ===========================================
// Function: saveMeetingRoomData
// ===========================================
        function saveMeetingRoomData() {
            try {
                localStorage.setItem('guanfu_meeting_rooms', JSON.stringify({
                    bookings: meetingRoomData.bookings
                }));
            } catch (e) {
                console.warn('保存会议室数据失败:', e);
            }
        }

// ===========================================
// Function: showMeetingRoomBooking
// ===========================================
        function showMeetingRoomBooking() {
            loadMeetingRoomData();
            const today = new Date();
            const dateStr = today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
            const todayKey = today.toISOString().split('T')[0];

            const panel = document.createElement('div');
            panel.id = 'meeting-booking-panel';
            panel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #0a2818 0%, #0d1117 100%);
                border: 2px solid #4caf50;
                border-radius: 16px;
                padding: 25px;
                z-index: 1000020;
                font-family: 'ArkPixel', monospace;
                box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(76,175,80,0.2);
                min-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
            `;

            // 生成时间格子
            let gridHTML = '<div style="display: grid; grid-template-columns: 80px repeat(3, 1fr); gap: 6px; margin-top: 15px;">';

            // 表头
            gridHTML += '<div style="text-align: center; color: #8b949e; font-size: 12px;">时间</div>';
            meetingRoomData.rooms.forEach(room => {
                gridHTML += `<div style="text-align: center; color: ${room.color}; font-size: 12px; font-weight: bold;">${room.name}<br><span style="font-size: 10px; color: #666;">${room.capacity}人</span></div>`;
            });

            // 时间行
            meetingRoomData.timeSlots.forEach(time => {
                gridHTML += `<div style="color: #c8d3e8; font-size: 12px; display: flex; align-items: center; justify-content: center;">${time}</div>`;

                meetingRoomData.rooms.forEach(room => {
                    const booking = meetingRoomData.bookings.find(b =>
                        b.roomId === room.id && b.time === time && b.date === todayKey
                    );

                    if (booking) {
                        gridHTML += `
                            <div class="slot-booked" data-room="${room.id}" data-time="${time}"
                                style="background: rgba(244,67,54,0.2); border: 1px solid #f44336; border-radius: 6px;
                                padding: 8px 4px; text-align: center; cursor: pointer;">
                                <div style="color: #f44336; font-size: 10px;">已预约</div>
                                <div style="color: #c8d3e8; font-size: 11px;">${booking.title}</div>
                                <div style="color: #8b949e; font-size: 10px;">${booking.booker}</div>
                            </div>`;
                    } else {
                        gridHTML += `
                            <div class="slot-available" data-room="${room.id}" data-time="${time}"
                                style="background: rgba(76,175,80,0.1); border: 1px solid rgba(76,175,80,0.3); border-radius: 6px;
                                padding: 8px 4px; text-align: center; cursor: pointer; transition: all 0.2s;">
                                <div style="color: #4caf50; font-size: 11px;">+ 预约</div>
                            </div>`;
                    }
                });
            });

            gridHTML += '</div>';

            panel.innerHTML = `
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="font-size: 32px;">📅</div>
                    <div style="color: #4caf50; font-size: 18px; font-weight: bold;">会议室预约</div>
                    <div style="color: #8b949e; font-size: 12px;">${dateStr}</div>
                </div>
                <div style="display: flex; gap: 15px; margin-bottom: 10px; justify-content: center;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 12px; height: 12px; background: rgba(76,175,80,0.3); border: 1px solid #4caf50; border-radius: 3px;"></div>
                        <span style="color: #8b949e; font-size: 11px;">可预约</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 12px; height: 12px; background: rgba(244,67,54,0.2); border: 1px solid #f44336; border-radius: 3px;"></div>
                        <span style="color: #8b949e; font-size: 11px;">已预约</span>
                    </div>
                </div>
                ${gridHTML}
                <div style="text-align: center; margin-top: 15px; color: #666; font-size: 11px;">点击空位预约 | 点击已预约可取消</div>
            `;

            document.body.appendChild(panel);

            // 绑定点击事件
            panel.querySelectorAll('.slot-available').forEach(slot => {
                slot.addEventListener('mouseenter', () => {
                    slot.style.background = 'rgba(76,175,80,0.3)';
                    slot.style.borderColor = '#4caf50';
                });
                slot.addEventListener('mouseleave', () => {
                    slot.style.background = 'rgba(76,175,80,0.1)';
                    slot.style.borderColor = 'rgba(76,175,80,0.3)';
                });
                slot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showBookingForm(slot.dataset.room, slot.dataset.time, todayKey);
                });
            });

            panel.querySelectorAll('.slot-booked').forEach(slot => {
                slot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const booking = meetingRoomData.bookings.find(b =>
                        b.roomId === slot.dataset.room && b.time === slot.dataset.time && b.date === todayKey
                    );
                    if (booking && confirm(`取消预约 "${booking.title}"？`)) {
                        meetingRoomData.bookings = meetingRoomData.bookings.filter(b => b !== booking);
                        saveMeetingRoomData();
                        panel.remove();
                        showMeetingRoomBooking();
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
// Function: showBookingForm
// ===========================================
        function showBookingForm(roomId, time, date) {
            const room = meetingRoomData.rooms.find(r => r.id === roomId);
            const existingPanel = document.getElementById('booking-form-panel');
            if (existingPanel) existingPanel.remove();

            const formPanel = document.createElement('div');
            formPanel.id = 'booking-form-panel';
            formPanel.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #0d2818 0%, #0a1520 100%);
                border: 2px solid #4caf50;
                border-radius: 12px;
                padding: 25px;
                z-index: 1000025;
                font-family: 'ArkPixel', monospace;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                min-width: 300px;
            `;

            formPanel.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="color: ${room.color}; font-size: 16px; font-weight: bold;">预约 ${room.name}</div>
                    <div style="color: #8b949e; font-size: 12px; margin-top: 5px;">${time} · ${room.capacity}人容量</div>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="color: #c8d3e8; font-size: 12px; display: block; margin-bottom: 5px;">会议主题</label>
                    <input type="text" id="booking-title" placeholder="输入会议主题"
                        style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #4caf50;
                        border-radius: 6px; color: #c8d3e8; font-family: 'ArkPixel', monospace; font-size: 13px;">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="color: #c8d3e8; font-size: 12px; display: block; margin-bottom: 5px;">预约人</label>
                    <input type="text" id="booking-booker" placeholder="输入您的名字"
                        style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #4caf50;
                        border-radius: 6px; color: #c8d3e8; font-family: 'ArkPixel', monospace; font-size: 13px;">
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="cancel-booking-btn" style="padding: 10px 20px; background: rgba(255,255,255,0.1); border: 1px solid #666;
                        border-radius: 6px; color: #8b949e; cursor: pointer; font-family: 'ArkPixel', monospace;">取消</button>
                    <button id="confirm-booking-btn" style="padding: 10px 20px; background: linear-gradient(135deg, #4caf50, #388e3c);
                        border: none; border-radius: 6px; color: white; cursor: pointer; font-family: 'ArkPixel', monospace; font-weight: bold;">确认预约</button>
                </div>
            `;

            document.body.appendChild(formPanel);

            document.getElementById('cancel-booking-btn').addEventListener('click', () => {
                formPanel.remove();
            });

            document.getElementById('confirm-booking-btn').addEventListener('click', () => {
                const title = document.getElementById('booking-title').value.trim();
                const booker = document.getElementById('booking-booker').value.trim();

                if (!title || !booker) {
                    alert('请填写完整信息');
                    return;
                }

                meetingRoomData.bookings.push({
                    roomId,
                    roomName: room.name,
                    time,
                    date,
                    title,
                    booker,
                    createdAt: Date.now()
                });

                saveMeetingRoomData();
                formPanel.remove();

                // 刷新预约面板
                const mainPanel = document.getElementById('meeting-booking-panel');
                if (mainPanel) mainPanel.remove();
                showMeetingRoomBooking();

                // 显示成功提示
                showBookingSuccess(room.name, time, title);
            });
        }

// ===========================================
// Function: showBookingSuccess
// ===========================================
        function showBookingSuccess(roomName, time, title) {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #4caf50, #388e3c);
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                font-family: 'ArkPixel', monospace;
                font-size: 14px;
                z-index: 1000030;
                box-shadow: 0 4px 20px rgba(76,175,80,0.4);
                animation: slideDown 0.3s ease;
            `;
            toast.innerHTML = `✓ 预约成功：${roomName} ${time} - ${title}`;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s';
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }
