/* Phaser create - split from game.js */
let hasManuallyPanned = false;
let plaqueTextObj = null;

window.create = function() {
    game = this;
    hideGameSkeleton();
    officeBgSprite = this.add.image(640, 360, 'office_bg');

    // Sign overlays to cover old text
    const signOverlay = this.add.rectangle(120, 85, 180, 55, 0x4a3728);
    signOverlay.setDepth(1);
    const signBorder = this.add.rectangle(120, 85, 184, 59, 0x000000, 0);
    signBorder.setStrokeStyle(2, 0x2d1f14);
    signBorder.setDepth(2);
    const signText = this.add.text(120, 85, '山居雅舍', {
        fontFamily: 'ArkPixel, monospace', fontSize: '14px', fill: '#ffd700',
        fontStyle: 'bold', stroke: '#2d1f14', strokeThickness: 2
    }).setOrigin(0.5);
    signText.setDepth(3);

    const signOverlay2 = this.add.rectangle(865, 69, 146, 82, 0x4a3728);
    signOverlay2.setDepth(1);
    const signBorder2 = this.add.rectangle(865, 69, 150, 86, 0x000000, 0);
    signBorder2.setStrokeStyle(2, 0x2d1f14);
    signBorder2.setDepth(2);
    const signText2 = this.add.text(865, 69, '云栖阁', {
        fontFamily: 'ArkPixel, monospace', fontSize: '14px', fill: '#ffd700',
        fontStyle: 'bold', stroke: '#2d1f14', strokeThickness: 2
    }).setOrigin(0.5);
    signText2.setDepth(3);

    // Areas / waypoints
    const sofaShadow = this.add.image(IDLE_SOFA_ANCHOR.x, IDLE_SOFA_ANCHOR.y, 'sofa_shadow').setOrigin(0.5);
    sofaShadow.setDepth(9);
    sofa = this.add.sprite(IDLE_SOFA_ANCHOR.x, IDLE_SOFA_ANCHOR.y, 'sofa_idle').setOrigin(0.5);
    sofa.setDepth(10);
    areas = {
        door: { x: 640, y: 550 },
        writing: { x: 320, y: 360 },
        researching: { x: 320, y: 360 },
        error: { x: 1066, y: 180 },
        breakroom: { x: IDLE_SOFA_ANCHOR.x, y: IDLE_SOFA_ANCHOR.y }
    };

    // Star idle animation
    const starIdleFrameMax = Math.max(0, (this.textures.get('star_idle')?.frameTotal || 1) - 1);
    if (this.anims.exists('star_idle')) this.anims.remove('star_idle');
    this.anims.create({
        key: 'star_idle',
        frames: this.anims.generateFrameNumbers('star_idle', { start: 0, end: starIdleFrameMax }),
        frameRate: 12, repeat: -1
    });

    // Guest idle animations
    for (let i = 1; i <= 6; i++) {
        this.anims.create({
            key: `guest_anim_${i}_idle`,
            frames: this.anims.generateFrameNumbers(`guest_anim_${i}`, { start: 0, end: 7 }),
            frameRate: 8, repeat: -1
        });
    }

    star = game.physics.add.sprite(areas.breakroom.x, areas.breakroom.y, 'star_idle');
    star.setOrigin(0.5);
    star.setScale(IDLE_STAR_SCALE);
    star.setAlpha(0.95);
    star.setDepth(20);
    star.setVisible(true);
    star.anims.play('star_idle', true);

    sofa.anims.stop();
    sofa.setTexture('sofa_idle');

    // Plaque
    const plaqueX = config.width / 2;
    const plaqueY = config.height - 36;
    const plaqueBg = game.add.rectangle(plaqueX, plaqueY, 420, 44, 0x5d4037);
    plaqueBg.setStrokeStyle(3, 0x3e2723);
    const plaqueText = game.add.text(plaqueX, plaqueY, '观复阁 · 大堂', {
        fontFamily: 'ArkPixel, monospace', fontSize: '18px', fill: '#ffd700',
        fontWeight: '900', fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
        wordWrap: { width: 400 }, align: 'center'
    }).setOrigin(0.5);
    game.add.text(plaqueX - 190, plaqueY, '⭐', { fontFamily: 'ArkPixel, monospace', fontSize: '20px' }).setOrigin(0.5);
    game.add.text(plaqueX + 190, plaqueY, '⭐', { fontFamily: 'ArkPixel, monospace', fontSize: '20px' }).setOrigin(0.5);
    window.officePlaqueText = plaqueText;
    plaqueTextObj = plaqueText;

    // Random plants
    const plantFrameCount = 16;
    const randomPlantFrame = Math.floor(Math.random() * plantFrameCount);
    const plant = game.add.sprite(565, 178, 'plants', randomPlantFrame).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    window.plantSprite = plant;
    window.plantFrameCount = plantFrameCount;
    plant.on('pointerdown', () => {
        const next = Math.floor(Math.random() * window.plantFrameCount);
        window.plantSprite.setFrame(next);
    });

    const plant2Frame = Math.floor(Math.random() * plantFrameCount);
    const plant2 = game.add.sprite(230, 185, 'plants', plant2Frame).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    window.plantSprite2 = plant2;
    plant2.on('pointerdown', () => {
        const next = Math.floor(Math.random() * window.plantFrameCount);
        window.plantSprite2.setFrame(next);
    });

    const plant3Frame = Math.floor(Math.random() * plantFrameCount);
    const plant3 = game.add.sprite(977, 496, 'plants', plant3Frame).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    window.plantSprite3 = plant3;
    plant3.on('pointerdown', () => {
        const next = Math.floor(Math.random() * window.plantFrameCount);
        window.plantSprite3.setFrame(next);
    });

    // Random posters
    const postersFrameCount = (this.textures.get('posters')?.frameTotal || 1) - 1;
    const randomPosterFrame = Math.floor(Math.random() * Math.max(1, postersFrameCount));
    const poster = game.add.sprite(252, 66, 'posters', randomPosterFrame).setOrigin(0.5).setDepth(4).setInteractive({ useHandCursor: true });
    window.posterSprite = poster;
    window.posterFrameCount = postersFrameCount;
    poster.on('pointerdown', () => {
        const next = Math.floor(Math.random() * window.posterFrameCount);
        window.posterSprite.setFrame(next);
    });

    // Cat
    const catsFrameCount = (this.textures.get('cats')?.frameTotal || 1) - 1;
    const randomCatFrame = Math.floor(Math.random() * Math.max(1, catsFrameCount));
    const cat = game.add.sprite(94, 557, 'cats', randomCatFrame).setOrigin(0.5).setDepth(2000).setInteractive({ useHandCursor: true });
    window.catSprite = cat;
    window.catsFrameCount = catsFrameCount;
    cat.on('pointerdown', () => {
        const next = Math.floor(Math.random() * window.catsFrameCount);
        window.catSprite.setFrame(next);
    });

    // Coffee machine
    const coffeeMachineShadow = this.add.image(659, 397, 'coffee_machine_shadow').setOrigin(0.5).setDepth(98);
    const coffeeFrameMax = Math.max(0, (this.textures.get('coffee_machine')?.frameTotal || 1) - 2);
    if (this.anims.exists('coffee_machine')) this.anims.remove('coffee_machine');
    this.anims.create({
        key: 'coffee_machine',
        frames: this.anims.generateFrameNumbers('coffee_machine', { start: 0, end: coffeeFrameMax }),
        frameRate: 12.5, repeat: -1
    });
    const coffeeMachine = this.add.sprite(659, 397, 'coffee_machine').setOrigin(0.5).setDepth(99);
    coffeeMachine.anims.play('coffee_machine', true);

    // Server room
    const serverFrameMax = Math.max(0, (this.textures.get('serverroom')?.frameTotal || 1) - 2);
    this.anims.create({
        key: 'serverroom_on',
        frames: this.anims.generateFrameNumbers('serverroom', { start: 0, end: serverFrameMax }),
        frameRate: 6, repeat: -1
    });
    serverroom = this.add.sprite(1021, 142, 'serverroom', 0).setOrigin(0.5).setDepth(2);
    serverroom.anims.stop();
    serverroom.setFrame(0);

    // Desk
    const desk = this.add.image(218, 417, 'desk_v2').setOrigin(0.5).setDepth(1001);

    // Flowers
    const flowerFrameCount = Math.max(1, FLOWERS_FRAME_COLS * FLOWERS_FRAME_ROWS);
    const randomFlowerFrame = Math.floor(Math.random() * flowerFrameCount);
    const flower = this.add.sprite(310, 390, 'flowers', randomFlowerFrame).setOrigin(0.5).setScale(0.8).setDepth(1100).setInteractive({ useHandCursor: true });
    window.flowerSprite = flower;
    window.flowerFrameCount = flowerFrameCount;
    flower.on('pointerdown', () => {
        const next = Math.floor(Math.random() * window.flowerFrameCount);
        window.flowerSprite.setFrame(next);
    });

    // Star working animation
    this.anims.create({
        key: 'star_working',
        frames: this.anims.generateFrameNumbers('star_working', { start: 0, end: 37 }),
        frameRate: 12, repeat: -1
    });

    // Error bug animation
    this.anims.create({
        key: 'error_bug',
        frames: this.anims.generateFrameNumbers('error_bug', { start: 0, end: 71 }),
        frameRate: 12, repeat: -1
    });

    // Error bug character
    const errorBug = this.add.sprite(1007, 221, 'error_bug', 0).setOrigin(0.5).setDepth(50).setVisible(false).setScale(0.9);
    errorBug.anims.play('error_bug', true);
    window.errorBug = errorBug;
    window.errorBugDir = 1;

    // Star working sprite (at desk)
    const starWorking = this.add.sprite(217, 343, 'star_working', 0).setOrigin(0.5).setVisible(false).setScale(0.9).setDepth(900);
    window.starWorking = starWorking;

    // Sync animation
    const syncFrameTotal = Number(this.textures.get('sync_anim')?.frameTotal || 0);
    const syncFrameStart = 1;
    const syncFrameEnd = Math.max(0, syncFrameTotal - 2);
    syncAnimPlayable = syncFrameTotal >= 3 && syncFrameEnd >= syncFrameStart;
    if (this.anims.exists('sync_anim')) this.anims.remove('sync_anim');
    if (syncAnimPlayable) {
        this.anims.create({
            key: 'sync_anim',
            frames: this.anims.generateFrameNumbers('sync_anim', { start: syncFrameStart, end: syncFrameEnd }),
            frameRate: 12, repeat: -1
        });
    }
    syncAnimSprite = this.add.sprite(1157, 592, 'sync_anim', 0).setOrigin(0.5).setDepth(40);
    syncAnimSprite.anims.stop();
    syncAnimSprite.setFrame(0);

    window.starSprite = star;

    statusText = document.getElementById('status-text');
    placeOverlayAndStatusAtCanvasBottomLeft();
    window.addEventListener('resize', placeOverlayAndStatusAtCanvasBottomLeft);
    window.addEventListener('scroll', placeOverlayAndStatusAtCanvasBottomLeft, { passive: true });

    coordsOverlay = document.getElementById('coords-overlay');
    coordsDisplay = document.getElementById('coords-display');
    coordsToggle = document.getElementById('coords-toggle');

    coordsToggle.addEventListener('click', () => {
        showCoords = !showCoords;
        coordsOverlay.style.display = showCoords ? 'block' : 'none';
        coordsToggle.textContent = showCoords ? t('hideCoords') : t('showCoords');
        coordsToggle.style.background = showCoords ? '#e94560' : '#333';
    });

    // Camera / pan setup
    const panToggle = document.getElementById('pan-toggle');
    const isTouchDevice = IS_TOUCH_DEVICE;
    let panEnabled = false;
    let isPanning = false;
    let panStart = null;
    const camera = game.cameras.main;
    const MAP_W = config.width;
    const MAP_H = config.height;

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function maxScrollX() {
        const viewportW = camera.width / Math.max(0.01, camera.zoom);
        return Math.max(0, MAP_W - viewportW);
    }
    function maxScrollY() {
        const viewportH = camera.height / Math.max(0.01, camera.zoom);
        return Math.max(0, MAP_H - viewportH);
    }
    function clampCameraScroll() {
        camera.scrollX = clamp(camera.scrollX, 0, maxScrollX());
        camera.scrollY = clamp(camera.scrollY, 0, maxScrollY());
    }

    function applyMobileCameraFit() {
        if (!isTouchDevice) return;
        const h = Math.max(1, camera.height);
        const w = Math.max(1, camera.width);
        const fitHeightZoom = h / MAP_H;
        const candidateZoom = fitHeightZoom;
        const viewW = w / candidateZoom;
        const maxX = Math.max(0, MAP_W - viewW);
        camera.setZoom(candidateZoom);
        camera.scrollX = Math.min(camera.scrollX, maxX);
        camera.scrollY = 0;
        if (!hasManuallyPanned) camera.centerOn(MAP_W / 2, MAP_H / 2);
        camera.scrollX = clamp(camera.scrollX, 0, maxX);
        camera.scrollY = 0;
    }
    applyMobileCameraFit();

    if (isTouchDevice && game.scale) {
        game.scale.on('resize', () => {
            applyMobileCameraFit();
            placeOverlayAndStatusAtCanvasBottomLeft();
        });
    }

    camera.setBounds(0, 0, MAP_W, MAP_H);
    clampCameraScroll();

    function setPanEnabled(on) {
        panEnabled = on;
        if (panToggle) {
            panToggle.dataset.on = on ? '1' : '0';
            panToggle.textContent = on ? t('lockView') : t('moveView');
            panToggle.style.background = on ? '#e94560' : '#333';
        }
        game.input.setDefaultCursor(on ? 'grab' : 'default');
        if (isTouchDevice && statusText) {
            const info = on ? '视野拖动已开启（可左右拖动画布）' : '视野拖动已关闭（点击左上角"移动视野"可开启）';
            statusText.textContent = `状态：[${(STATES[currentState] && STATES[currentState].name) || '待命'}] ${info}`;
        }
    }

    if (panToggle) panToggle.addEventListener('click', () => setPanEnabled(!panEnabled));
    if (isTouchDevice) setPanEnabled(false);

    const canvasEl = game.canvas;
    let touchPan = null;
    if (canvasEl) {
        canvasEl.style.touchAction = 'auto';
        canvasEl.addEventListener('touchstart', (e) => {
            if (!panEnabled || e.touches.length !== 1) return;
            const t = e.touches[0];
            touchPan = { x: t.clientX, y: t.clientY, sx: camera.scrollX, sy: camera.scrollY, lock: null };
        }, { passive: true });
        canvasEl.addEventListener('touchmove', (e) => {
            if (!panEnabled || !touchPan || e.touches.length !== 1) return;
            const t = e.touches[0];
            const dx = t.clientX - touchPan.x;
            const dy = t.clientY - touchPan.y;
            if (!touchPan.lock) {
                if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
                touchPan.lock = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
            }
            if (touchPan.lock === 'x') {
                e.preventDefault();
                hasManuallyPanned = true;
                camera.scrollX = clamp(touchPan.sx - dx, 0, maxScrollX());
            }
        }, { passive: false });
        const clearTouchPan = () => { touchPan = null; };
        canvasEl.addEventListener('touchend', clearTouchPan, { passive: true });
        canvasEl.addEventListener('touchcancel', clearTouchPan, { passive: true });
    }

    game.input.on('pointerdown', (pointer) => {
        if (!panEnabled) return;
        isPanning = true;
        panStart = { x: pointer.x, y: pointer.y, sx: camera.scrollX, sy: camera.scrollY };
        game.input.setDefaultCursor('grabbing');
    });

    game.input.on('pointerup', () => {
        if (!panEnabled) return;
        isPanning = false;
        panStart = null;
        game.input.setDefaultCursor('grab');
    });

    game.input.on('pointermove', (pointer) => {
        if (!panEnabled || !isPanning || !panStart) return;
        const dx = pointer.x - panStart.x;
        const dy = pointer.y - panStart.y;
        if (isTouchDevice && Math.abs(dy) > Math.abs(dx)) return;
        const newX = panStart.sx - dx;
        hasManuallyPanned = true;
        camera.scrollX = clamp(newX, 0, maxScrollX());
        if (!isTouchDevice) {
            const newY = panStart.sy - dy;
            camera.scrollY = clamp(newY, 0, maxScrollY());
        }
    });

    game.input.on('pointermove', (pointer) => {
        if (!showCoords) return;
        const x = Math.max(0, Math.min(config.width - 1, Math.round(pointer.x)));
        const y = Math.max(0, Math.min(config.height - 1, Math.round(pointer.y)));
        coordsDisplay.textContent = `${x}, ${y}`;
        coordsOverlay.style.left = (pointer.x + 18) + 'px';
        coordsOverlay.style.top = (pointer.y + 18) + 'px';
    });

    // Post-create data loading
    loadMemo();
    loadCheckinStats();
    fetchStatus();
    fetchGuestAgents();
    fetchMembersStatus();
    fetchDeptOverview();
    initFloorNav();
    fetchFloorState();

    floorPlaqueControl = true;
    updatePlaqueText(currentFloor);
    updateFloorBackgroundTint(currentFloor);
    setTimeout(() => {
        updateFloorDecorations(currentFloor);
        createFloorParticles(currentFloor);
    }, 500);
}
