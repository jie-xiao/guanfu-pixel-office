/**
 * 楼层导航模块
 * 提取自 index.html inline script
 * 
 * 依赖的全局变量（FLOORS, FLOOR_ORDER, currentFloor 等）来自 index.html
 */

function initFloorNav() {
    const floorNavList = document.getElementById('floor-nav-list');
    if (!floorNavList) return;

    floorNavList.innerHTML = '';

    FLOOR_ORDER.forEach(floorId => {
        const floorInfo = FLOORS[floorId];
        if (!floorInfo) return;

        const btn = document.createElement('button');
        btn.className = 'floor-btn';
        if (floorId === currentFloor) btn.classList.add('active');
        btn.dataset.floor = floorId;
        btn.innerHTML = `
            <span class="floor-icon">${floorInfo.icon}</span>
            <span class="floor-id">${floorId}</span>
            <span class="floor-name">${floorInfo.name}</span>
        `;
        btn.addEventListener('click', () => switchFloor(floorId));
        floorNavList.appendChild(btn);
    });

    updateFloorDisplay();

    // 初始化键盘快捷键
    initFloorKeyboardShortcuts();
}

// 楼层键盘快捷键
function initFloorKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // 忽略输入框中的按键
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const currentIndex = FLOOR_ORDER.indexOf(currentFloor);

        // Page Up: 上一楼层
        if (e.key === 'PageUp') {
            e.preventDefault();
            if (currentIndex < FLOOR_ORDER.length - 1) {
                switchFloor(FLOOR_ORDER[currentIndex + 1]);
            }
        }
        // Page Down: 下一楼层
        else if (e.key === 'PageDown') {
            e.preventDefault();
            if (currentIndex > 0) {
                switchFloor(FLOOR_ORDER[currentIndex - 1]);
            }
        }
        // Home: 到顶层 (8F)
        else if (e.key === 'Home') {
            e.preventDefault();
            switchFloor('8F');
        }
        // End: 到底层 (B2)
        else if (e.key === 'End') {
            e.preventDefault();
            switchFloor('B2');
        }
        // 数字键 1-8: 切换到对应楼层
        else if (e.key >= '1' && e.key <= '8' && !e.ctrlKey && !e.altKey) {
            const floorMap = { '1': '8F', '2': '7F', '3': '6F', '4': '5F', '5': '4F', '6': '3F', '7': '2F', '8': '1F' };
            if (floorMap[e.key]) {
                e.preventDefault();
                switchFloor(floorMap[e.key]);
            }
        }
        // 0: B1, 9: B2
        else if (e.key === '0') {
            e.preventDefault();
            switchFloor('B1');
        }
        else if (e.key === '9') {
            e.preventDefault();
            switchFloor('B2');
        }
    });
}

// 切换楼层
async function switchFloor(floorId) {
    if (!FLOORS[floorId]) return;
    if (floorId === currentFloor) return;

    const prevFloor = currentFloor;
    const goingUp = FLOOR_ORDER.indexOf(floorId) < FLOOR_ORDER.indexOf(prevFloor);

    // 播放电梯切换动画
    await playFloorTransitionAnimation(prevFloor, floorId, goingUp);

    currentFloor = floorId;

    // 更新导航按钮状态
    document.querySelectorAll('.floor-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.floor === floorId);
    });

    // 更新显示
    updateFloorDisplay();
    updatePlaqueText(floorId);
    updateFloorDecorations(floorId);
    updateFloorBackgroundTint(floorId);
    createFloorParticles(floorId);
    updateFloorInfoPanel(floorId);

    // 尝试同步到后端
    try {
        await fetch('/floor/set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ floor: floorId })
        });
    } catch (e) {
        console.warn('楼层同步失败:', e);
    }

    console.log('切换到楼层:', floorId, FLOORS[floorId].name);

    // 切换楼层后自动显示该楼层的专属面板
    triggerFloorInteraction(floorId);
}
