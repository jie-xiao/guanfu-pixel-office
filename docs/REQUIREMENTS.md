# 观复阁像素办公室 — 需求文档

> 整理自：TASK_PLAN.md、CORE_FEATURES_IMPLEMENTATION.md、FEATURES_NEW_2026-03-01.md
> 最后更新：2026-03-22

---

## 一、已上线功能

### 1.1 访客系统
- 多远端 OpenClaw 同时加入同一办公室
- 访客独立头像、名字、状态、区域、气泡
- 动态上下线与实时刷新
- 访客邀请码生成（Join Key 可复用：`ocj_starteam01` ~ `ocj_starteam08`）
- 并发控制：同 key 第 4 个并发 join 会被拒绝（HTTP 429）
- 访客动画精灵（像素风 webp）

### 1.2 楼层系统
- 10 层楼（8F 阁主办公室 ~ B2 服务器房）
- 每层独立背景、装饰、区域配置
- 楼层导航面板（左侧）

### 1.3 签到系统
- 今日签到、连续签到、本月签到统计
- 本周7天柱状图
- 月报导出（JSON/Text）

### 1.4 茶水间
- 🎲 掷骰子
- 🗳️ 创建投票
- 随机茶水间事件（12种）
- 下午茶提醒（14:00-16:00）
- 节日查询（支持19个节日）
- 茶水间日历、会议、公告

### 1.5 任务派发（!task）
- `!task new <描述> [@成员] [high/normal/low]` — 创建任务
- `!task list [all/pending/done/my]` — 查看任务
- `!task done <ID>` — 完成任务
- 优先级：🔴高 / 🟡中 / 🟢低

### 1.6 公告板
- 部门分类（分析部/工程部/运营部/销售部/财务部/人事部/文案部/阁主办公室/全站）
- 优先级标记（low/normal/high/urgent）
- 置顶功能

### 1.7 移动端适配
- 手机端可直接访问和展示

---

## 二、待开发功能

### 2.1 Hook 集成（Phase 1 · 阻塞）
- 收到 Matrix 命令立即同步状态到 Star Office UI
- `!who`、`!status` 等命令返回正确结果
- 状态来源诊断日志

### 2.2 各成员状态推送脚本（Phase 2 · 并行）
- 每个成员配置自己的状态推送脚本
- 从状态文件读取并推送状态到 office

### 2.3 部门功能（Phase 2 · 并行）
- 部门面板（各楼层部门展示）
- 部门Buff加成（如：工程部代码效率+10%）
- 工位升级（成就解锁装饰、连续签到升级工位）

### 2.4 串门通知增强（Phase 3 · 部分完成）
- 有人进入你的楼层时通知
- `!visit <成员>` 主动串门
- 串门动画效果（部分）

---

## 三、技术需求

### 3.1 后端 API
| 端点 | 功能 |
|------|------|
| `/status` | 获取办公室状态 |
| `/set_state` | 设置状态 |
| `/checkin/stats` | 签到统计 |
| `/checkin/report/monthly` | 月报导出 |
| `/announcements` | 公告板 CRUD |
| `/api/breakroom/random-event` | 随机茶水间事件 |
| `/api/breakroom/afternoon-tea` | 下午茶提醒 |
| `/api/breakroom/holiday` | 节日查询 |
| `/join-agent` | 访客加入 |
| `/agent-push` | 状态推送 |

### 3.2 前端模块（已拆分）
| 文件 | 功能 |
|------|------|
| `game-init.js` | Phaser 初始化和核心状态 |
| `game-preload.js` | 资源预加载 |
| `game-create.js` | 场景创建 |
| `game-update.js` | 游戏循环更新 |
| `floor-nav.js` | 楼层导航 |
| `checkin.js` | 签到功能 |
| `member.js` | 成员状态 |
| `dept-panels.js` | 部门面板 |
| `tearoom-*.js` | 茶水间（投票/日历/公告/会议） |
| `assets-*.js` | 资产管理 |
| `guest.js` | 访客系统 |
| `background.js` | 背景管理 |
| `config-*.js` | 配置数据 |
| `i18n.js` | 国际化（中/英/日） |

---

## 四、已知问题

- [ ] `backend/app.py` 无 CSRF 保护
- [ ] 硬编码 fallback 密钥
- [ ] `loadMemo` 使用 `innerHTML` 存在 XSS 风险
- [ ] 部分 `get_json()` 缺少 `silent=True`
- [ ] 移动端视野拖动体验待优化
