/**
 * i18n.js - Internationalization (i18n) functions for Star Office UI
 *
 * This module handles UI language switching and translation lookup.
 *
 * The I18N object (translation strings) is defined in config.js as window.I18N.
 * This file manages: uiLang, speedMode state, translation function t(),
 * and all language-dependent UI rendering functions.
 *
 * Dependencies:
 *   - window.I18N (from config.js) - translation strings object
 *   - renderAssetDrawerList()    (from assets.js)
 *   - renderSelectedAssetGuidance() (from assets.js)
 *   - showRoomLoadingOverlay()   (from utils.js or game.js)
 */

'use strict';

// ── Language state ──────────────────────────────────────────────────────────────
let uiLang = localStorage.getItem('uiLang') || 'en';

// ── Speed mode state ────────────────────────────────────────────────────────────
let speedMode = localStorage.getItem('speedMode') || 'quality';

// ── Translation helper ─────────────────────────────────────────────────────────
/**
 * Look up a translation key in the current UI language.
 * Falls back to the key itself if translation is missing.
 * @param {string} key - Translation key
 * @returns {string}
 */
function t(key) {
    return (window.I18N && window.I18N[uiLang] && window.I18N[uiLang][key]) || key;
}

// ── Boot loading text ───────────────────────────────────────────────────────────
/**
 * Update the boot loading overlay text with current language and optional progress percent.
 * @param {number} [percent] - Optional loading percentage (0-100)
 */
function renderBootLoadingText(percent) {
    const loadingEl = document.getElementById('loading-text');
    if (!loadingEl) return;
    const base = t('loadingOffice');
    const p = Number.isFinite(percent) ? ' ' + Math.max(0, Math.min(100, Math.round(percent))) + '%' : '';
    loadingEl.textContent = base + p;
}

// ── Memo background ────────────────────────────────────────────────────────────
/**
 * Ensure the memo panel has its background image visible.
 */
function ensureMemoBgVisible() {
    const panel = document.getElementById('memo-panel');
    if (!panel) return;
    panel.style.backgroundImage = "url('/static/memo-bg.webp?v=20260322')";
    panel.classList.remove('no-bg');
}

// ── Apply language to all UI elements ─────────────────────────────────────────
/**
 * Apply the current uiLang to all static UI elements in the DOM.
 * Called after language switch and on initial page load.
 */
function applyLanguage() {
    const setText = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };
    const setPh = (id, key) => { const el = document.getElementById(id); if (el) el.placeholder = t(key); };

    setText('control-bar-title', 'controlTitle');
    setText('btn-state-idle', 'btnIdle');
    setText('btn-state-writing', 'btnWork');
    setText('btn-state-syncing', 'btnSync');
    setText('btn-state-error', 'btnError');
    setText('btn-open-drawer', 'btnDecor');

    // Language toggle buttons
    const langButtons = [
        { id: 'lang-btn-en', lang: 'en' },
        { id: 'lang-btn-jp', lang: 'ja' },
        { id: 'lang-btn-cn', lang: 'zh' }
    ];
    langButtons.forEach(({ id, lang }) => {
        const el = document.getElementById(id);
        if (!el) return;
        const active = (uiLang === lang);
        el.style.background = active ? '#22c55e' : '#333';
        el.style.borderColor = active ? '#22c55e' : '#333';
        el.style.color = '#fff';
    });

    // Asset drawer header
    const drawerTitle = document.querySelector('#asset-drawer-header span');
    if (drawerTitle) drawerTitle.textContent = t('drawerTitle');
    const drawerClose = document.getElementById('btn-close-drawer');
    if (drawerClose) drawerClose.textContent = t('drawerClose');

    // Auth gate
    const authTitle = document.querySelector('#asset-auth-gate .asset-preview-title');
    if (authTitle) authTitle.textContent = t('authTitle');
    setPh('asset-pass-input', 'authPlaceholder');
    const authVerifyBtn = document.querySelector('#asset-auth-gate .asset-toolbar button');
    if (authVerifyBtn) authVerifyBtn.textContent = t('authVerify');

    // Asset drawer body
    setText('btn-move-house', 'btnMove');
    setText('btn-back-home', 'btnHome');
    const brokerBtn = document.querySelector('#asset-broker-row .btn-broker'); if (brokerBtn) brokerBtn.textContent = t('btnBroker');
    const diyBtn = document.querySelector('#asset-broker-row .btn-diy'); if (diyBtn) diyBtn.textContent = t('btnDIY');
    const backLastBtn = document.getElementById('btn-back-last-bg'); if (backLastBtn) backLastBtn.textContent = t('btnHomeLast');
    const favHomeBtn = document.getElementById('btn-favorite-home'); if (favHomeBtn) favHomeBtn.textContent = t('btnHomeFavorite');
    const favTitle = document.getElementById('asset-home-favorites-title'); if (favTitle) favTitle.textContent = t('homeFavTitle');
    const brokerHint = document.querySelector('#asset-broker-panel .asset-sub'); if (brokerHint) brokerHint.textContent = t('brokerHint');
    const brokerPrompt = document.getElementById('asset-broker-prompt'); if (brokerPrompt) brokerPrompt.placeholder = t('brokerPromptPh');
    const brokerGoBtn = document.querySelector('#asset-broker-actions button'); if (brokerGoBtn) brokerGoBtn.textContent = t('btnBrokerGo');

    // Speed mode labels
    const speedLbl = document.getElementById('speed-mode-label'); if (speedLbl) speedLbl.textContent = t('speedModeLabel');
    const speedFastBtn = document.getElementById('speed-fast-btn'); if (speedFastBtn) speedFastBtn.textContent = t('speedFast');
    const speedQualityBtn = document.getElementById('speed-quality-btn'); if (speedQualityBtn) speedQualityBtn.textContent = t('speedQuality');

    // Gemini config panel
    const geminiPanelSummary = document.getElementById('gemini-panel-summary'); if (geminiPanelSummary) geminiPanelSummary.textContent = t('geminiPanelTitle');
    const geminiHint = document.getElementById('gemini-config-hint'); if (geminiHint) geminiHint.textContent = t('geminiHint');
    const geminiDocLink = document.getElementById('gemini-api-doc-link'); if (geminiDocLink) geminiDocLink.textContent = t('geminiApiDoc');
    const geminiInput = document.getElementById('gemini-api-key-input'); if (geminiInput) geminiInput.placeholder = t('geminiInputPh');
    const geminiSaveBtn = document.getElementById('btn-save-gemini-key'); if (geminiSaveBtn) geminiSaveBtn.textContent = t('geminiSaveKey');

    // Asset manual panel
    setPh('asset-search', 'searchPlaceholder');
    setText('asset-choose-btn', 'chooseImage');
    setText('asset-commit-refresh-btn', 'confirmUpload');
    setText('asset-reset-default-btn', 'resetToDefault');
    setText('asset-restore-prev-btn', 'restorePrevAsset');

    // Bottom panels
    const memoTitle = document.getElementById('memo-title');
    if (memoTitle) memoTitle.textContent = t('memoTitle');
    const guestTitle = document.getElementById('guest-agent-panel-title');
    if (guestTitle) guestTitle.textContent = t('guestTitle');

    // Office plaque
    const plaqueTitle = (typeof window.officeNameFromServer !== 'undefined' && window.officeNameFromServer) || t('officeTitle');
    if (window.officePlaqueText && window.officePlaqueText.setText) {
        window.officePlaqueText.setText(plaqueTitle);
    }

    // Coords / pan toggles
    const coordsBtn = document.getElementById('coords-toggle');
    if (coordsBtn) coordsBtn.textContent = (window.showCoords || false) ? t('hideCoords') : t('showCoords');
    const panBtn = document.getElementById('pan-toggle');
    if (panBtn) {
        const on = panBtn.dataset.on === '1';
        panBtn.textContent = on ? t('lockView') : t('moveView');
    }

    // Refresh dynamic elements
    ensureMemoBgVisible();
    const progressBarEl = window.loadingProgressBar;
    const progressValue = (progressBarEl && progressBarEl.style && progressBarEl.style.width) ? parseInt(progressBarEl.style.width.replace('%','') || '0', 10) : 0;
    renderBootLoadingText(progressValue);
}

// ── Language switcher ─────────────────────────────────────────────────────────
/**
 * Switch the UI language to the specified language.
 * Persists choice to localStorage, then refreshes all i18n text.
 *
 * @param {string} lang - Target language code: 'zh' | 'en' | 'ja'
 */
function setUILanguage(lang) {
    if (!['zh', 'en', 'ja'].includes(lang)) return;
    uiLang = lang;
    localStorage.setItem('uiLang', uiLang);
    applyLanguage();
    updateSpeedModeUI();

    // Language switch: immediately redraw asset sidebar so translatable names refresh
    if (typeof renderAssetDrawerList === 'function') {
        renderAssetDrawerList();
    }

    // Language switch: refresh guidance text for the currently selected asset
    if (typeof renderSelectedAssetGuidance === 'function' && selectedAssetInfo && selectedAssetInfo.path) {
        const inScene = !!mapAssetPathToSprite(selectedAssetInfo.path);
        renderSelectedAssetGuidance(selectedAssetInfo.path, inScene);
    }

    // Language switch: if room loading overlay is visible, refresh its text
    if (typeof showRoomLoadingOverlay === 'function') {
        const overlay = document.getElementById('room-loading-overlay');
        if (overlay && overlay.style.display === 'flex') {
            showRoomLoadingOverlay();
        }
    }
}

// ── Speed mode (render quality preset) ────────────────────────────────────────
/**
 * Update the visual state of speed mode buttons (fast / quality).
 */
function updateSpeedModeUI() {
    const fastBtn = document.getElementById('speed-fast-btn');
    const qBtn = document.getElementById('speed-quality-btn');
    if (!fastBtn || !qBtn) return;
    const fastOn = speedMode === 'fast';
    fastBtn.style.background = fastOn ? '#22c55e' : '#334155';
    fastBtn.style.color = fastOn ? '#052e16' : '#e5e7eb';
    fastBtn.style.borderColor = fastOn ? '#16a34a' : '#475569';
    qBtn.style.background = fastOn ? '#334155' : '#22c55e';
    qBtn.style.color = fastOn ? '#e5e7eb' : '#052e16';
    qBtn.style.borderColor = fastOn ? '#475569' : '#16a34a';
}

/**
 * Set the render speed mode and persist to localStorage.
 * @param {string} mode - 'fast' or 'quality'
 */
function setSpeedMode(mode) {
    speedMode = (mode === 'quality') ? 'quality' : 'fast';
    try { localStorage.setItem('speedMode', speedMode); } catch (e) {}
    updateSpeedModeUI();
}
