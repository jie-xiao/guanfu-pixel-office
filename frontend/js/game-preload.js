/* Phaser preload - split from game.js */
window.preload = function() {
    loadingOverlay = document.getElementById('loading-overlay');
    loadingProgressBar = document.getElementById('loading-progress-bar');
    loadingText = document.getElementById('loading-text');
    loadingProgressContainer = document.getElementById('loading-progress-container');

    totalAssets = 22;
    loadedAssets = 0;

    this.load.on('filecomplete', () => { updateLoadingProgress(); });
    this.load.on('complete', () => { hideLoadingOverlay(); });

    // Background
    this.load.image('office_bg', '/static/office_bg_small.webp?v=20260322');
    this.load.spritesheet('star_idle', '/static/star-idle-v5.png?v=20260322', { frameWidth: 256, frameHeight: 256 });

    // Furniture
    this.load.image('sofa_idle', '/static/sofa-idle-v3.png?v=20260322');
    this.load.image('sofa_shadow', '/static/sofa-shadow-v1.png?v=20260322');

    // Decor
    this.load.spritesheet('plants', '/static/plants-spritesheet.webp?v=20260322', { frameWidth: 160, frameHeight: 160 });
    this.load.spritesheet('posters', '/static/posters-spritesheet.webp?v=20260322', { frameWidth: 160, frameHeight: 160 });
    this.load.spritesheet('coffee_machine', '/static/coffee-machine-v3-grid.webp?v=20260322', { frameWidth: 230, frameHeight: 230 });
    this.load.image('coffee_machine_shadow', '/static/coffee-machine-shadow-v1.png?v=20260322');
    this.load.spritesheet('serverroom', '/static/serverroom-spritesheet.webp?v=20260322', { frameWidth: 180, frameHeight: 251 });
    this.load.spritesheet('error_bug', '/static/error-bug-spritesheet-grid.webp?v=20260322', { frameWidth: 220, frameHeight: 220 });

    this.geminiConfig = { hasKey: false, model: 'gemini-3.1-flash-image-preview' };

    this.load.spritesheet('cats', '/static/cats-spritesheet.webp?v=20260322', { frameWidth: 160, frameHeight: 160 });
    this.load.spritesheet('star_working', '/static/star-working-spritesheet-grid.webp?v=20260322', { frameWidth: 300, frameHeight: 300 });
    this.load.spritesheet('sync_anim', '/static/sync-animation-v3-grid.webp?v=20260322', { frameWidth: 256, frameHeight: 256 });
    this.load.image('memo_bg', '/static/memo-bg.webp?v=20260322');
    this.load.image('desk_v2', '/static/desk-v3.webp?v=20260322');
    this.load.spritesheet('flowers', '/static/flowers-bloom-v2.webp?v=20260322', { frameWidth: FLOWERS_FRAME_W, frameHeight: FLOWERS_FRAME_H });

    // Guest agents
    this.load.spritesheet('guest_anim_1', '/static/guest_anim_1.webp?v=20260322', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('guest_anim_2', '/static/guest_anim_2.webp?v=20260322', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('guest_anim_3', '/static/guest_anim_3.webp?v=20260322', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('guest_anim_4', '/static/guest_anim_4.webp?v=20260322', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('guest_anim_5', '/static/guest_anim_5.webp?v=20260322', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('guest_anim_6', '/static/guest_anim_6.webp?v=20260322', { frameWidth: 32, frameHeight: 32 });
}
