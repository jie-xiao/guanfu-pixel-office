/* Core Config - split from config.js */
/* Contains: IS_TOUCH_DEVICE, config, STATES, FLOORS, FLOOR_ORDER, currentFloor, FLOOR_DECORATIONS, LAYOUT, FLOOR_TINTS, various constants, FLOOR_PARTICLE_CONFIGS */

(function() {
    'use strict';

    // ========== Device Detection ==========
    window.IS_TOUCH_DEVICE = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;

    // ========== Phaser Config ==========
    window.config = {
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        parent: 'game-container',
        pixelArt: true,
        scale: {
            mode: window.IS_TOUCH_DEVICE ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 1280,
            height: 720
        },
        physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
        scene: { preload: window.preload, create: window.create, update: window.update }
    };

    // NOTE: Do NOT call new Phaser.Game() here. That is done in game-init.js
    // after window.preload, window.create, and window.update are defined.
    // Calling new Phaser.Game(window.config) here would create a broken instance
    // with undefined scene callbacks because game-preload.js / game-create.js /
    // game-update.js have not been loaded yet.

    // ========== Agent States ==========
    window.STATES = {
        idle: { name: '待命', area: 'breakroom' },
        writing: { name: '整理文档', area: 'writing' },
        researching: { name: '搜索信息', area: 'researching' },
        executing: { name: '执行任务', area: 'writing' },
        syncing: { name: '同步备份', area: 'writing' },
        error: { name: '出错了', area: 'error' }
    };

    // ========== Floor System (观复阁 10 层：8F ~ B2) ==========
    window.FLOORS = {
        '8F': { name: '阁主办公室', owner: '阁主', icon: '👑', type: 'private', color: '#FFD700' },
        '7F': { name: '文案部', owner: '墨白', icon: '✍️', type: 'department', color: '#4CAF50' },
        '6F': { name: '运营部', owner: '阁影', icon: '📊', type: 'department', color: '#2196F3' },
        '5F': { name: '销售部', owner: '拾遗', icon: '🛒', type: 'department', color: '#FF9800' },
        '4F': { name: '财务部', owner: '知微', icon: '💰', type: 'department', color: '#9C27B0' },
        '3F': { name: '工程部', owner: 'Echo', icon: '🔧', type: 'department', color: '#607D8B' },
        '2F': { name: '分析部', owner: '灵犀', icon: '📡', type: 'department', color: '#E91E63' },
        '1F': { name: '人事部', owner: '小砚', icon: '👥', type: 'department', color: '#E91E63' },
        'B1': { name: '档案室', owner: '拾遗', icon: '📚', type: 'archive', color: '#8D6E63' },
        'B2': { name: '服务器房', owner: '观复', icon: '🖥️', type: 'infra', color: '#00BCD4' }
    };

    window.FLOOR_ORDER = ['8F', '7F', '6F', '5F', '4F', '3F', '2F', '1F', 'B1', 'B2'];

    // Current floor state
    window.currentFloor = '1F';

    // ========== Floor Decorations ==========
    window.FLOOR_DECORATIONS = {
        '8F': { emoji: '👑🏆⭐', label: '阁主宝座', desc: '顶层视野，统领全局' },
        '7F': { emoji: '✍️📝✨', label: '文案工坊', desc: '内容创作，品牌表达' },
        '6F': { emoji: '📊📈💹', label: '数据驾驶舱', desc: '运营监控，增长引擎' },
        '5F': { emoji: '🛒💎🤝', label: '客户接待区', desc: '销售精英，业绩创造' },
        '4F': { emoji: '💰🏦💳', label: '金库入口', desc: '财务管控，资金流转' },
        '3F': { emoji: '🔧⚙️💻', label: '工程工坊', desc: '代码构建，系统维护' },
        '2F': { emoji: '📡📉🔍', label: '分析仪表盘', desc: '数据洞察，趋势研判' },
        '1F': { emoji: '👥📋🤝', label: '人事中心', desc: '招聘培训，人才发展' },
        'B1': { emoji: '📚🗃️📜', label: '档案密室', desc: '历史存档，知识宝库' },
        'B2': { emoji: '🖥️⚡🔒', label: '核心机房', desc: '服务器阵列，系统命脉' }
    };

    // ========== LAYOUT.floorDecorations ==========
    window.LAYOUT = {
        floorDecorations: {
            '8F': [
                { id: 'throne', x: 480, y: 360, w: 130, h: 110, depth: 3, bg: 0xfff8e1, border: 0xffd700, icon: '👑', label: '阁主宝座', tooltip: '阁主宝座：观复阁最高决策位置，俯瞰全局' },
                { id: 'command_center', x: 950, y: 260, w: 160, h: 100, depth: 3, bg: 0xfff9c4, border: 0xf9a825, icon: '🗺️', label: '全楼监控', tooltip: '全楼监控视角：实时俯瞰观复阁各楼层动态，一键协调各部门' },
                { id: 'task_board_8f', x: 950, y: 420, w: 140, h: 90, depth: 3, bg: 0xe8f5e9, border: 0x4caf50, icon: '📋', label: '任务派发板', tooltip: '任务派发板：分配任务、追踪进度、协调资源' },
                { id: 'honor_wall', x: 750, y: 120, w: 140, h: 90, depth: 3, bg: 0xfff3e0, border: 0xff9800, icon: '🏆', label: '荣誉墙', tooltip: '荣誉墙：团队漏洞成果与里程碑记录' },
                { id: 'owner_plaque_8f', x: 640, y: 60, w: 180, h: 40, depth: 3, bg: 0xfff8e1, border: 0xffd700, icon: '👑', label: '观复阁 · 阁主办公室', tooltip: '8F阁主办公室：观复阁最高管理层，余生阁主的专属领地' }
            ],
            '6F': [
                { id: 'task_kanban', x: 950, y: 280, w: 160, h: 110, depth: 3, bg: 0xe3f2fd, border: 0x2196f3, icon: '📋', label: '任务看板', tooltip: '任务看板：运营部核心工具，查看/分配/追踪全部任务进度' },
                { id: 'ops_data_screen', x: 950, y: 440, w: 160, h: 90, depth: 3, bg: 0xbbdefb, border: 0x1565c0, icon: '📊', label: '运营数据屏', tooltip: '运营数据屏：实时业务指标与关键数据可视化' },
                { id: 'schedule_board', x: 80, y: 200, w: 130, h: 80, depth: 3, bg: 0xe8f5e9, border: 0x2e7d32, icon: '📅', label: '日程安排板', tooltip: '日程安排板：本周/本月重要运营事项一览' },
                { id: 'ops_plaque', x: 640, y: 60, w: 180, h: 40, depth: 3, bg: 0xe3f2fd, border: 0x2196f3, icon: '📊', label: '运营部 · 阁影工作室', tooltip: '运营部：6F核心运营中心，负责任务统筹与进度追踪，归阁影管辖' }
            ],
            '5F': [
                { id: 'client_wall', x: 950, y: 160, w: 120, h: 90, depth: 3, bg: 0xfff8e1, border: 0xff9800, icon: '📋', label: '客户名单墙', tooltip: '客户名单墙：展示重点客户信息与跟进状态' },
                { id: 'order_board', x: 1080, y: 160, w: 120, h: 90, depth: 3, bg: 0xfff3e0, border: 0xff5722, icon: '📊', label: '订单追踪板', tooltip: '订单追踪板：实时显示本月订单进度与业绩目标' },
                { id: 'reception_label', x: 670, y: 60, w: 160, h: 36, depth: 3, bg: 0xffe0b2, border: 0xff9800, icon: '🛋️', label: '客户接待区', tooltip: '客户接待区：销售部专属，接待来访客户与商务洽谈' }
            ],
            '4F': [
                { id: 'file_cabinet', x: 850, y: 480, w: 90, h: 70, depth: 3, bg: 0xf3e5f5, border: 0x9c27b0, icon: '🗄️', label: '文件柜', tooltip: '文件柜：存放财务凭证、报表与合同档案' },
                { id: 'budget_tree', x: 980, y: 450, w: 90, h: 90, depth: 3, bg: 0xe8f5e9, border: 0x4caf50, icon: '🌳', label: '预算树', tooltip: '预算树：可视化的年度预算分配结构' },
                { id: 'vault_door', x: 1100, y: 480, w: 90, h: 100, depth: 3, bg: 0xfff9c4, border: 0xf9a825, icon: '🔐', label: '金库门', tooltip: '金库门：财务核心区域，需授权访问' },
                { id: 'invoice_printer', x: 750, y: 500, w: 90, h: 60, depth: 3, bg: 0xfce4ec, border: 0xe91e63, icon: '🖨️', label: '发票打印机', tooltip: '发票打印机：快速开具增值税专用发票' }
            ],
            '3F': [
                { id: 'multi_screen', x: 80, y: 320, w: 130, h: 80, depth: 3, bg: 0xefebe9, border: 0x607d8b, icon: '🖥️', label: '多屏工作站', tooltip: '多屏工作站：工程部代码开发与调试环境' },
                { id: 'bug_board', x: 80, y: 480, w: 130, h: 90, depth: 3, bg: 0xffebee, border: 0xf44336, icon: '🐛', label: 'Bug追踪板', tooltip: 'Bug追踪板：当前项目缺陷管理与修复进度' },
                { id: 'server_rack_label', x: 1021, y: 60, w: 140, h: 36, depth: 3, bg: 0xcfd8dc, border: 0x455a64, icon: '🖥️', label: '代码工厂·服务器', tooltip: '代码工厂：工程部测试/预生产服务器集群' }
            ],
            '2F': [
                { id: 'data_screen', x: 400, y: 100, w: 200, h: 110, depth: 3, bg: 0xfce4ec, border: 0xe91e63, icon: '📺', label: '数据大屏', tooltip: '数据大屏：实时数据监控与关键指标展示' },
                { id: 'radar_chart', x: 650, y: 100, w: 120, h: 100, depth: 3, bg: 0xf3e5f5, border: 0x9c27b0, icon: '📡', label: '雷达图', tooltip: '雷达图：多维度威胁情报分析视图' },
                { id: 'threat_map', x: 820, y: 100, w: 140, h: 100, depth: 3, bg: 0xffebee, border: 0xd32f2f, icon: '🗺️', label: '威胁地图', tooltip: '威胁地图：全球威胁态势与攻击源分布' },
                { id: 'surveillance', x: 1000, y: 100, w: 160, h: 90, depth: 3, bg: 0xe8f5e9, border: 0x388e3c, icon: '📹', label: '监控墙', tooltip: '监控墙：7×24小时安全事件监控面板' }
            ],
            '1F': [
                { id: 'whiteboard', x: 80, y: 120, w: 140, h: 90, depth: 3, bg: 0xe3f2fd, border: 0x2196f3, icon: '📝', label: '创意白板', tooltip: '创意白板：团队头脑风暴与创意碰撞' },
                { id: 'bookshelf', x: 80, y: 260, w: 110, h: 120, depth: 3, bg: 0xfff8e1, border: 0x795548, icon: '📚', label: '知识书架', tooltip: '知识书架：收藏专业书籍与参考资料' },
                { id: 'portfolio', x: 1100, y: 280, w: 120, h: 120, depth: 3, bg: 0xfff3e0, border: 0xff9800, icon: '🏆', label: '作品展示墙', tooltip: '作品展示墙：团队优秀成果与成功案例' }
            ],
            '7F': [
                { id: 'conference_table_label', x: 640, y: 180, w: 180, h: 40, depth: 3, bg: 0xe8f5e9, border: 0x4caf50, icon: '🗳️', label: '会议室·会议区', tooltip: '会议区：大型会议室，支持远程视频会议' },
                { id: 'projector', x: 640, y: 80, w: 100, h: 60, depth: 3, bg: 0x212121, border: 0x424242, icon: '📽️', label: '投影系统', tooltip: '投影系统：4K高清投影，支持无线投屏' },
                { id: 'meeting_whiteboard', x: 400, y: 200, w: 100, h: 80, depth: 3, bg: 0xe3f2fd, border: 0x1976d2, icon: '📋', label: '会议白板', tooltip: '会议白板：会中记录要点与决策事项' },
                { id: 'booking_board', x: 880, y: 80, w: 120, h: 80, depth: 3, bg: 0xfff8e1, border: 0xf9a825, icon: '📅', label: '会议预定板', tooltip: '会议预定板：查看本周会议室使用情况' }
            ],
            'B1': [
                { id: 'archive_cabinet_1', x: 200, y: 200, w: 100, h: 80, depth: 3, bg: 0xd7ccc8, border: 0x6d4c41, icon: '🗄️', label: '档案柜 A区', tooltip: '档案柜A区：按年份归档的历史资料' },
                { id: 'archive_cabinet_2', x: 200, y: 320, w: 100, h: 80, depth: 3, bg: 0xcfcfc4, border: 0x6d4c41, icon: '🗄️', label: '档案柜 B区', tooltip: '档案柜B区：按部门分类的业务文档' },
                { id: 'file_shelf', x: 350, y: 280, w: 120, h: 100, depth: 3, bg: 0xbcaaa4, border: 0x795548, icon: '📂', label: '文件架', tooltip: '文件架：近期常用文件快速检索区' },
                { id: 'lending_desk', x: 550, y: 500, w: 140, h: 70, depth: 3, bg: 0xefebe9, border: 0x8d6e63, icon: '✍️', label: '借阅登记台', tooltip: '借阅登记台：档案借出/归还记录办理点' },
                { id: 'archive_label', x: 640, y: 80, w: 160, h: 36, depth: 3, bg: 0xbfafa5, border: 0x6d4c41, icon: '📚', label: '档案室·资料库', tooltip: '资料库：B1档案室，保存公司所有重要文档' }
            ],
            'B2': [
                { id: 'server_rack_1', x: 850, y: 180, w: 80, h: 120, depth: 3, bg: 0xe0f7fa, border: 0x00bcd4, icon: '🖥️', label: '机架 #1', tooltip: '机架#1：主业务服务器集群（8台）' },
                { id: 'server_rack_2', x: 950, y: 180, w: 80, h: 120, depth: 3, bg: 0xe0f7fa, border: 0x00acc1, icon: '🖥️', label: '机架 #2', tooltip: '机架#2：数据库服务器（4台）' },
                { id: 'server_rack_3', x: 1050, y: 180, w: 80, h: 120, depth: 3, bg: 0xe0f7fa, border: 0x0097a7, icon: '🖥️', label: '机架 #3', tooltip: '机架#3：缓存与中间件服务器（6台）' },
                { id: 'monitor_screen', x: 750, y: 400, w: 160, h: 90, depth: 3, bg: 0xe8f5e9, border: 0x00897b, icon: '📺', label: '监控中心', tooltip: '监控中心：服务器健康状态与告警面板' },
                { id: 'status_light_wall', x: 640, y: 80, w: 300, h: 50, depth: 3, bg: 0x006064, border: 0x00bcd4, icon: '💡', label: '状态灯墙', tooltip: '状态灯墙：所有服务器状态一目了然（绿=正常，黄=警告，红=故障）' },
                { id: 'server_room_label', x: 640, y: 140, w: 160, h: 36, depth: 3, bg: 0xb2ebf2, border: 0x00bcd4, icon: '🖥️', label: '机房·服务器房', tooltip: '机房：B2服务器房，观复阁数字基础设施核心' }
            ]
        }
    };

    // ========== Floor Tints ==========
    window.FLOOR_TINTS = {
        '8F': { tint: 0xffd700, overlay: 'rgba(255, 215, 0, 0.08)' },
        '7F': { tint: 0x4caf50, overlay: 'rgba(76, 175, 80, 0.06)' },
        '6F': { tint: 0x2196f3, overlay: 'rgba(33, 150, 243, 0.06)' },
        '5F': { tint: 0xff9800, overlay: 'rgba(255, 152, 0, 0.06)' },
        '4F': { tint: 0x9c27b0, overlay: 'rgba(156, 39, 176, 0.06)' },
        '3F': { tint: 0x607d8b, overlay: 'rgba(96, 125, 139, 0.06)' },
        '2F': { tint: 0xe91e63, overlay: 'rgba(233, 30, 99, 0.06)' },
        '1F': { tint: 0x795548, overlay: 'rgba(121, 85, 72, 0.05)' },
        'B1': { tint: 0x8d6e63, overlay: 'rgba(141, 110, 99, 0.08)' },
        'B2': { tint: 0x00bcd4, overlay: 'rgba(0, 188, 212, 0.1)' }
    };

    // ========== Layout/Sprite Constants ==========
    window.IDLE_SOFA_ANCHOR = { x: 798, y: 272 };
    window.IDLE_STAR_SCALE = 1.0;
    window.FLOWERS_FRAME_W = 65;
    window.FLOWERS_FRAME_H = 65;
    window.FLOWERS_FRAME_COLS = 4;
    window.FLOWERS_FRAME_ROWS = 4;

    // ========== Timing Intervals ==========
    window.DEMO_MODE = new URLSearchParams(window.location.search).get('demo') === '1';
    window.FETCH_INTERVAL = 1000;
    window.GUEST_AGENTS_FETCH_INTERVAL = 3500;
    window.BLINK_INTERVAL = 2500;
    window.BUBBLE_INTERVAL = 8000;
    window.CAT_BUBBLE_INTERVAL = 18000;
    window.TYPEWRITER_DELAY = 50;

    // ========== Guest Avatars ==========
    window.GUEST_AVATARS = ['guest_role_1','guest_role_2','guest_role_3','guest_role_4','guest_role_5','guest_role_6'];

    // ========== Floor Particle Configs ==========
    window.FLOOR_PARTICLE_CONFIGS = {
        '8F': { color: 0xffd700, count: 20, speed: 0.3, size: 3, pattern: 'sparkle', desc: '金色星尘' },
        '7F': { color: 0x4caf50, count: 15, speed: 0.2, size: 4, pattern: 'float', desc: '思维气泡' },
        '6F': { color: 0x2196f3, count: 25, speed: 0.4, size: 2, pattern: 'data', desc: '数据流' },
        '5F': { color: 0xff9800, count: 18, speed: 0.25, size: 3, pattern: 'rise', desc: '业绩上升' },
        '4F': { color: 0x9c27b0, count: 12, speed: 0.15, size: 4, pattern: 'coin', desc: '金币飘落' },
        '3F': { color: 0x607d8b, count: 30, speed: 0.5, size: 2, pattern: 'code', desc: '代码碎片' },
        '2F': { color: 0xe91e63, count: 22, speed: 0.35, size: 2, pattern: 'wave', desc: '信号波' },
        '1F': { color: 0x795548, count: 10, speed: 0.1, size: 5, pattern: 'dust', desc: '尘埃漂浮' },
        'B1': { color: 0x8d6e63, count: 8, speed: 0.08, size: 3, pattern: 'dust', desc: '古籍尘埃' },
        'B2': { color: 0x00bcd4, count: 35, speed: 0.6, size: 2, pattern: 'matrix', desc: '数据矩阵' }
    };

})();
