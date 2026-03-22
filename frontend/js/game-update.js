/* Phaser update - split from game.js */
window.update = function(time, delta) {
    if (time - lastFetch > FETCH_INTERVAL) { fetchStatus(); lastFetch = time; }
    if (time - lastGuestAgentsFetch > GUEST_AGENTS_FETCH_INTERVAL) { fetchGuestAgents(); lastGuestAgentsFetch = time; }
    if (time - lastMembersStatusFetch > MEMBER_STATUS_INTERVAL) { fetchMembersStatus(); lastMembersStatusFetch = time; }
    if (time - lastDeptOverviewFetch > DEPT_OVERVIEW_INTERVAL) { fetchDeptOverview(); lastDeptOverviewFetch = time; }

    const effectiveStateForServer = pendingDesiredState || currentState;

    // Server room
    if (serverroom) {
        if (effectiveStateForServer === 'idle') {
            if (serverroom.anims.isPlaying) { serverroom.anims.stop(); serverroom.setFrame(0); }
        } else {
            if (!serverroom.anims.isPlaying || serverroom.anims.currentAnim?.key !== 'serverroom_on') {
                serverroom.anims.play('serverroom_on', true);
            }
        }
    }

    // Error bug
    if (window.errorBug) {
        if (effectiveStateForServer === 'error') {
            window.errorBug.setVisible(true);
            if (!window.errorBug.anims.isPlaying || window.errorBug.anims.currentAnim?.key !== 'error_bug') {
                window.errorBug.anims.play('error_bug', true);
            }
            window.errorBug.x = 1007;
            window.errorBug.y = 221;
        } else {
            window.errorBug.setVisible(false);
            window.errorBug.anims.stop();
        }
    }

    // Sync animation
    if (syncAnimSprite) {
        if (effectiveStateForServer === 'syncing') {
            if (syncAnimPlayable && syncAnimSprite.anims && syncAnimSprite.anims.play && syncAnimSprite.scene?.anims?.exists('sync_anim')) {
                if (!syncAnimSprite.anims.isPlaying || syncAnimSprite.anims.currentAnim?.key !== 'sync_anim') {
                    syncAnimSprite.anims.play('sync_anim', true);
                }
            } else {
                syncAnimSprite.setFrame(0);
            }
        } else {
            if (syncAnimSprite.anims && syncAnimSprite.anims.isPlaying) syncAnimSprite.anims.stop();
            syncAnimSprite.setFrame(0);
        }
    }

    // Bubbles
    if (time - lastBubble > BUBBLE_INTERVAL) { showBubble(); lastBubble = time; }
    if (time - lastCatBubble > CAT_BUBBLE_INTERVAL) { showCatBubble(); lastCatBubble = time; }

    // Typewriter
    if (typewriterIndex < typewriterTarget.length && time - lastTypewriter > TYPEWRITER_DELAY) {
        typewriterText += typewriterTarget[typewriterIndex];
        statusText.textContent = typewriterText;
        typewriterIndex++;
        lastTypewriter = time;
    }

    // Star movement
    moveStar(time);

    // Guest bubbles
    maybeShowGuestBubble(time);

    // Guest bubble follow
    try {
        Object.keys(guestBubbles).forEach(id => {
            const b = guestBubbles[id];
            const g = guestSprites[id];
            if (!b || !g) return;
            if (b.__followAgentId !== id) return;
            const bx = g.sprite.x;
            const isDemoGuest = (id === 'demo_nika' || id === 'demo_mercury');
            const nameH = (g.nameText && g.nameText.height) ? g.nameText.height : 16;
            const by = isDemoGuest ? (g.sprite.y - 90) : ((g.nameText ? g.nameText.y : (g.sprite.y - 150)) - (nameH / 2) - 22);
            if (b.list && b.list[0]) { b.list[0].x = bx; b.list[0].y = by; }
            if (b.list && b.list[1]) { b.list[1].x = bx; b.list[1].y = by; }
        });
    } catch (e) {}
}
