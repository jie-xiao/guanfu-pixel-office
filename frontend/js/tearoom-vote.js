/* Tea Room - extracted from index.html, split from tearoom.js */


// ===========================================
// Function: rollDice (lines 7782-7796)
// ===========================================
        async function rollDice() {
            try {
                const response = await fetch('/api/breakroom/dice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ player: 'Star', bet: '' })
                });
                const data = await response.json();
                if (data.ok) {
                    showDiceResult(data.dice1, data.dice2, data.total, data.result);
                }
            } catch (e) {
                console.warn('掷骰子失败:', e);
            }
        }

// ===========================================
// Function: showCreateVoteDialog (lines 7690-7704)
// ===========================================
        function showCreateVoteDialog() {
            const question = prompt('请输入投票问题：');
            if (!question) return;

            const optionsStr = prompt('请输入选项（用逗号分隔，例如：选项1,选项2,选项3）：');
            if (!optionsStr) return;

            const options = optionsStr.split(',').map(o => o.trim()).filter(o => o.length > 0);
            if (options.length < 2) {
                alert('至少需要2个选项');
                return;
            }

            createVote(question, options);
        }

// ===========================================
// Function: createVote (lines 7709-7724)
// ===========================================
        async function createVote(question, options) {
            try {
                const response = await fetch('/api/breakroom/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question, options, creator: 'Star' })
                });
                const data = await response.json();
                if (data.ok) {
                    showToast('投票 "' + question + '" 已创建！');
                    renderVotesList();
                }
            } catch (e) {
                console.warn('创建投票失败:', e);
            }
        }

// ===========================================
// Function: voteOption (lines 7760-7777)
// ===========================================
        async function voteOption(voteId, optionIndex) {
            try {
                const response = await fetch('/api/breakroom/vote/' + voteId, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ optionIndex, voter: 'Star' })
                });
                const data = await response.json();
                if (data.ok) {
                    showToast('投票成功！');
                    renderVotesList();
                } else {
                    showToast(data.msg || '投票失败');
                }
            } catch (e) {
                console.warn('投票失败:', e);
            }
        }

// ===========================================
// Function: showDiceResult (lines 7801-7847)
// ===========================================
        function showDiceResult(dice1, dice2, total, result) {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100002;
                cursor: pointer;
            `;

            overlay.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #1a1a2e, #2a2a45);
                    border: 3px solid #ffd700;
                    border-radius: 20px;
                    padding: 30px 50px;
                    text-align: center;
                ">
                    <div style="font-size: 48px; margin-bottom: 20px;">
                        🎲 🎲 🎲
                    </div>
                    <div style="font-size: 36px; color: #ffd700; font-family: 'ArkPixel', monospace; margin-bottom: 10px;">
                        ${dice1} + ${dice2} = ${total}
                    </div>
                    <div style="font-size: 20px; color: #fff; font-family: 'ArkPixel', monospace;">
                        ${result}
                    </div>
                    <div style="color: #8b949e; font-size: 12px; margin-top: 20px;">
                        点击任意处关闭
                    </div>
                </div>
            `;

            overlay.onclick = () => {
                overlay.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => overlay.remove(), 300);
            };

            document.body.appendChild(overlay);
            setTimeout(() => overlay.remove(), 5000);
        }

// ===========================================
// Function: renderVotesList (lines 7729-7755)
// ===========================================
        async function renderVotesList() {
            const container = document.getElementById('tearoom-votes-list');
            if (!container) return;

            try {
                const response = await fetch('/api/breakroom/votes?t=' + Date.now());
                const data = await response.json();
                if (data.ok && data.votes && data.votes.length > 0) {
                    container.innerHTML = data.votes.map(vote => `
                        <div class="tearoom-vote-item">
                            <div class="tearoom-vote-question">${vote.question}</div>
                            <div class="tearoom-vote-options">
                                ${vote.options.map((opt, i) => `
                                    <button class="tearoom-vote-option" onclick="voteOption(${vote.id}, ${i})">
                                        ${opt.text} (${opt.votes}票)
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<div style="color: #8b949e; font-size: 12px; text-align: center; padding: 10px;">暂无活跃投票</div>';
                }
            } catch (e) {
                console.warn('获取投票失败:', e);
            }
        }
