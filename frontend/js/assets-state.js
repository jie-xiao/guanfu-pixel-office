/* Asset Drawer State - split from assets.js */

let assetDrawerOpen = false;
let assetDrawerAuthed = false;
let assetManualPanelOpen = false;
let assetFilterMode = 'all';
let assetListData = [];
let sceneAssetItems = [];
let selectedAssetInfo = null;
let hiddenAssetPaths = new Set();
let assetThumbTimers = [];
let homeFavoritesCache = [];
let homeFavoritesLoadedAt = 0;

// 坐标以服务端为准；清理历史本地缓存，避免把素材挪飞
let assetPositionOverrides = {};

let assetDrawerBackgroundBinded = false;

let _drawerScrollY = 0;
