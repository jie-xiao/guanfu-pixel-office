# 观复阁 Matrix 命令层 - 开发文档

## 模块结构

```
matrix-commands/
├── __init__.py          # 包初始化
├── __main__.py          # 命令行入口
├── m1_commands.py       # 命令处理（!who !status !go !checkin !board !booking）
├── m2_status_sync.py    # 状态同步服务
├── m3_storage.py        # 数据存储层
└── requirements.txt     # Python 依赖
```

## 快速开始

### 1. 安装依赖
```bash
pip install -r matrix-commands/requirements.txt
```

### 2. 测试命令
```bash
python matrix-commands/m1_commands.py
```

### 3. 启动状态同步服务
```bash
# 方式1：单次同步
python matrix-commands/m2_status_sync.py --once

# 方式2：定时同步（60秒间隔）
python matrix-commands/m2_status_sync.py --interval 60
```

### 4. 命令行使用
```bash
python -m matrix_commands who
python -m matrix_commands status guanfu writing "测试"
python -m matrix_commands board "测试公告"
```

## 命令列表

| 命令 | 说明 | 示例 |
|------|------|------|
| `!who` | 查看所有成员状态 | `!who` |
| `!status <state>` | 设置状态 | `!status writing` |
| `!go <floor>` | 前往楼层 | `!go 6F` |
| `!checkin` | 上班打卡 | `!checkin` |
| `!checkout` | 下班打卡 | `!checkout` |
| `!board <msg>` | 发布公告 | `!board Hello` |
| `!booking <time> <purpose>` | 会议室预约 | `!booking 15:00 评审` |
| `!help` | 显示帮助 | `!help` |

## 状态选项

- `idle` - 休息中
- `writing` - 工作中
- `researching` - 研究中
- `executing` - 执行中
- `syncing` - 同步中
- `error` - Bug区

## 楼层选项

8F, 7F, 6F, 5F, 4F, 3F, 2F, 1F, GF, B1, B2

## 数据存储

数据存储在 `data/` 目录：
- `status.json` - 成员状态
- `attendance.json` - 打卡记录
- `board.json` - 公告
- `booking.json` - 会议室预约

## Star Office UI 集成

状态同步到 Star Office UI（http://127.0.0.1:19000）：
- 使用 `push-status.py` 推送状态
- 使用 `/join-agent` 加入办公室
- 使用 `/agent-push` 推送状态更新

## 开发进度

- [x] M1 命令层
- [x] M2 状态同步服务
- [x] M3 数据存储层
- [ ] 部门专属功能
- [ ] 多楼层架构
