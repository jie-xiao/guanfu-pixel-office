#!/usr/bin/env python3
"""
观复阁 Matrix 命令层模块 - M1

处理 Matrix 消息中的 ! 命令，提供虚拟办公室功能。

命令列表：
- !who              查看所有成员状态
- !status <状态>    设置当前状态
- !go <楼层>        前往指定楼层
- !checkin          上班打卡
- !checkout         下班打卡
- !board [内容]     查看/发布公告
- !booking <时间> <用途>  会议室预约
- !help             显示帮助
"""

import json
import os
import sys
from datetime import datetime
from typing import Optional, Dict, Any, List

# 数据目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
STATE_FILE = os.path.join(BASE_DIR, "state.json")
ATTENDANCE_FILE = os.path.join(DATA_DIR, "attendance.json")
BOARD_FILE = os.path.join(DATA_DIR, "board.json")
BOOKING_FILE = os.path.join(DATA_DIR, "booking.json")
TASKS_FILE = os.path.join(DATA_DIR, "tasks.json")

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)

# 观复阁成员列表
MEMBERS = {
    "guanfu": {"name": "观复", "floor": "B2", "room": "服务器房"},
    "geying": {"name": "阁影", "floor": "6F", "room": "运营部"},
    "shiuyi": {"name": "拾遗", "floor": "5F", "room": "销售部"},
    "zhivey": {"name": "知微", "floor": "4F", "room": "财务部"},
    "echo": {"name": "Echo", "floor": "3F", "room": "工程部"},
    "lingyi": {"name": "灵犀", "floor": "2F", "room": "分析部"},
    "xiaoyan": {"name": "小砚", "floor": "1F", "room": "人事部"},
    "mubi": {"name": "墨白", "floor": "1F", "room": "文案部"},
}

# 楼层列表
FLOORS = ["8F", "7F", "6F", "5F", "4F", "3F", "2F", "1F", "GF", "B1", "B2"]

# 状态选项（兼容原有6种 + 新增4种在线状态）
STATES = ["idle", "writing", "researching", "executing", "syncing", "error", "online", "busy", "away", "offline"]

# 状态映射：新4种 → 原有6种
STATE_DISPLAY = {
    "idle": "🛋️ 休息中",
    "writing": "💻工作中",
    "researching": "🔍研究中",
    "executing": "⚡执行中",
    "syncing": "🔄同步中",
    "error": "🐛Bug区",
    "online": "🟢 在线",
    "busy": "🔴 忙碌",
    "away": "🟡 离开",
    "offline": "⚫ 离线",
}

# 新状态到原有状态的映射
STATE_TO_INTERNAL = {
    "online": "idle",      # 在线 → 空闲
    "busy": "writing",     # 忙碌 → 工作中
    "away": "idle",        # 离开 → 空闲（但不在）
    "offline": "idle",     # 离线 → 空闲（断线）
}

# 内部状态到新状态的映射（用于显示）
INTERNAL_TO_STATE = {
    "idle": "online",
    "writing": "busy",
    "researching": "busy",
    "executing": "busy",
    "syncing": "busy",
    "error": "busy",
}

# ============ 数据存取函数 ============

def load_json(filepath: str, default: Any = None) -> Any:
    """加载 JSON 文件"""
    if default is None:
        default = {}
    if not os.path.exists(filepath):
        return default
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def save_json(filepath: str, data: Any) -> bool:
    """保存 JSON 文件"""
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False

def load_attendance() -> Dict:
    """加载打卡记录"""
    return load_json(ATTENDANCE_FILE, {})

def save_attendance(data: Dict) -> bool:
    """保存打卡记录"""
    return save_json(ATTENDANCE_FILE, data)

def load_board() -> List:
    """加载公告"""
    return load_json(BOARD_FILE, [])

def save_board(data: List) -> bool:
    """保存公告"""
    return save_json(BOARD_FILE, data)

def load_booking() -> List:
    """加载预约"""
    return load_json(BOOKING_FILE, [])

def save_booking(data: List) -> bool:
    """保存预约"""
    return save_json(BOOKING_FILE, data)

# ============ 状态推送 ============

def push_state(name: str, state: str, detail: str = "") -> bool:
    """推送状态到 Star-Office-UI"""
    try:
        import subprocess
        cmd = [
            sys.executable,
            os.path.join(BASE_DIR, "push-status.py"),
            name, state, detail
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except Exception:
        return False

# ============ 命令处理函数 ============

def cmd_who() -> str:
    """查看所有成员状态"""
    state_data = load_json(STATE_FILE, {})
    
    lines = [
        "🏢 观复阁 · 在线成员",
        "═" * 35,
        ""
    ]
    
    for member_id, member_info in MEMBERS.items():
        member_state = state_data.get(member_id, {})
        state = member_state.get("state", "idle")
        detail = member_state.get("detail", "")
        floor = member_info["floor"]
        room = member_info["room"]
        name = member_info["name"]
        
        state_icon = STATE_DISPLAY.get(state, "❓")
        lines.append(f"{state_icon} {name:<6} | {floor} {room}")
        if detail:
            lines.append(f"         └─ {detail}")
    
    lines.extend(["", "-" * 35])
    lines.append("💻 Writing  💻工作 | 🛋️ Idle 休息 | 🔍 Researching 研究")
    lines.append("⚡ Executing 执行 | 🔄 Syncing 同步 | 🐛 Error Bug")
    
    return "\n".join(lines)

def cmd_status(member_id: str, state: str, detail: str = "") -> str:
    """设置状态"""
    if state not in STATES:
        return f"❌ 无效状态: {state}\n可用状态: {', '.join(STATES)}"
    
    if member_id not in MEMBERS:
        return f"❌ 未知成员: {member_id}"
    
    # 新状态转换为内部状态
    internal_state = STATE_TO_INTERNAL.get(state, state)
    
    # 更新状态
    state_data = load_json(STATE_FILE, {})
    state_data[member_id] = {
        "state": internal_state,
        "display_state": state,  # 保存原始显示状态
        "detail": detail or f"{MEMBERS[member_id]['name']}{STATE_DISPLAY[state]}",
        "activity": detail or STATE_DISPLAY[state],
        "updated": datetime.now().isoformat(),
        "floor": MEMBERS[member_id]["floor"]  # 保持当前楼层
    }
    save_json(STATE_FILE, state_data)
    
    # 同时更新楼层状态文件（用于前端面板）
    _update_floor_state(member_id, MEMBERS[member_id]["floor"], internal_state, detail or STATE_DISPLAY[state])
    
    # 推送到 Star-Office-UI（使用内部状态）
    push_state(MEMBERS[member_id]["name"], internal_state, detail)
    
    return f"✅ {MEMBERS[member_id]['name']} 状态已更新: {STATE_DISPLAY[state]}"


def _update_floor_state(member_id: str, floor: str, state: str, activity: str = ""):
    """更新楼层状态文件"""
    try:
        floor_state_file = os.path.join(os.path.dirname(BASE_DIR), "floor-state.json")
        if os.path.exists(floor_state_file):
            with open(floor_state_file, "r", encoding="utf-8") as f:
                floor_data = json.load(f)
        else:
            floor_data = {"currentFloor": "1F", "agents": {}}
        
        if "agents" not in floor_data:
            floor_data["agents"] = {}
        
        floor_data["agents"][member_id] = {
            "floor": floor,
            "state": state,
            "activity": activity,
            "last_active": datetime.now().isoformat()
        }
        
        with open(floor_state_file, "w", encoding="utf-8") as f:
            json.dump(floor_data, f, ensure_ascii=False, indent=2)
    except Exception:
        pass  # 静默失败，不影响主流程

def cmd_go(member_id: str, floor: str) -> str:
    """前往楼层"""
    floor = floor.upper()
    
    if floor not in FLOORS:
        return f"❌ 无效楼层: {floor}\n可用楼层: {', '.join(FLOORS)}"
    
    if member_id not in MEMBERS:
        return f"❌ 未知成员: {member_id}"
    
    member_info = MEMBERS[member_id]
    current_state = load_json(STATE_FILE, {}).get(member_id, {}).get("state", "idle")
    state_data = load_json(STATE_FILE, {})
    state_data[member_id] = {
        "state": current_state,
        "detail": f"前往{floor}",
        "floor": floor,
        "room": member_info["room"],
        "updated": datetime.now().isoformat()
    }
    save_json(STATE_FILE, state_data)
    
    # 更新楼层状态
    _update_floor_state(member_id, floor, current_state, f"前往{floor}")
    
    return f"✅ {member_info['name']} 前往 【{floor}】{member_info['room']}"

def cmd_checkin(member_id: str, location: str = "") -> str:
    """上班打卡"""
    if member_id not in MEMBERS:
        return f"❌ 未知成员: {member_id}"
    
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")
    
    attendance = load_attendance()
    if today not in attendance:
        attendance[today] = {}
    
    # 检查是否已打过卡
    if member_id in attendance[today]:
        return f"⚠️ {MEMBERS[member_id]['name']} 今天已打过卡\n时间: {attendance[today][member_id].get('checkin', 'unknown')}"
    
    location = location or MEMBERS[member_id]["room"]
    
    attendance[today][member_id] = {
        "checkin": time_str,
        "location": location,
        "date": today
    }
    save_attendance(attendance)
    
    return (f"✅ {MEMBERS[member_id]['name']} 上班打卡成功\n"
            f"📍 位置: {location}\n"
            f"⏰ 时间: {time_str}\n"
            f"🏢 观复阁 · 考勤系统")

def cmd_checkout(member_id: str) -> str:
    """下班打卡"""
    if member_id not in MEMBERS:
        return f"❌ 未知成员: {member_id}"
    
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")
    
    attendance = load_attendance()
    
    if today not in attendance or member_id not in attendance[today]:
        return f"⚠️ {MEMBERS[member_id]['name']} 今天还未打卡"
    
    checkin_data = attendance[today][member_id]
    if "checkout" in checkin_data:
        return f"⚠️ {MEMBERS[member_id]['name']} 今天已下班打卡"
    
    # 计算工作时数
    checkin_time = checkin_data.get("checkin", "09:00:00")
    try:
        checkin_dt = datetime.strptime(checkin_time, "%H:%M:%S")
        checkout_dt = datetime.strptime(time_str, "%H:%M:%S")
        diff = checkout_dt - checkin_dt
        hours = diff.seconds // 3600
        minutes = (diff.seconds % 3600) // 60
        # 如果分钟超过30，四舍五入到1小时
        if minutes >= 30:
            hours += 1
    except ValueError:
        hours = int(time_str.split(":")[0]) - int(checkin_time.split(":")[0])
    
    attendance[today][member_id]["checkout"] = time_str
    attendance[today][member_id]["hours"] = hours
    save_attendance(attendance)
    
    return (f"✅ {MEMBERS[member_id]['name']} 下班打卡成功\n"
            f"⏰ 下班时间: {time_str}\n"
            f"📅 工作时长: {hours} 小时\n"
            f"🏢 观复阁 · 考勤系统")

def cmd_board(sender_id: str, content: str = "") -> str:
    """公告板"""
    sender_name = MEMBERS.get(sender_id, {}).get("name", sender_id)
    
    if not content:
        # 显示公告
        board = load_board()
        if not board:
            return "📋 观复阁公告板\n━━━━━━━━━━━━━━━\n暂无公告\n━━━━━━━━━━━━━━━\n发布公告: !board <内容>"
        
        lines = ["📋 观复阁公告板", "━" * 30, ""]
        for i, entry in enumerate(board[:10], 1):
            lines.append(f"{i}. {entry['content']}")
            lines.append(f"   {entry['date']} {entry.get('time', '')} | {entry.get('sender', '')}")
            lines.append("")
        lines.append("━" * 30)
        lines.append(f"共 {len(board)} 条公告")
        return "\n".join(lines)
    
    # 发布公告
    now = datetime.now()
    board = load_board()
    board.insert(0, {
        "id": now.timestamp(),
        "sender": sender_name,
        "content": content,
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M"),
        "pinned": False
    })
    
    # 只保留最近 50 条
    if len(board) > 50:
        board = board[:50]
    
    save_board(board)
    
    return (f"📢 公告已发布\n"
            f"━━━━━━━━━━━━━━━\n"
            f"{content}\n"
            f"━━━━━━━━━━━━━━━\n"
            f"发布人: {sender_name}\n"
            f"时间: {now.strftime('%Y-%m-%d %H:%M')}")

def cmd_booking(member_id: str, time: str, purpose: str) -> str:
    """会议室预约"""
    if member_id not in MEMBERS:
        return f"❌ 未知成员: {member_id}"
    
    if not time or not purpose:
        return "❌ 请提供时间和用途\n用法: !booking <时间> <用途>\n示例: !booking 15:00 项目评审"
    
    now = datetime.now()
    booking = load_booking()
    
    booking.append({
        "id": now.timestamp(),
        "member": MEMBERS[member_id]["name"],
        "time": time,
        "purpose": purpose,
        "date": now.strftime("%Y-%m-%d"),
        "created": now.strftime("%H:%M"),
        "status": "pending"
    })
    
    save_booking(booking)
    
    return (f"✅ 会议室预约成功\n"
            f"━━━━━━━━━━━━━━━\n"
            f"📅 时间: {time}\n"
            f"📝 用途: {purpose}\n"
            f"👤 预约人: {MEMBERS[member_id]['name']}\n"
            f"📆 日期: {now.strftime('%Y-%m-%d')}")

# ============ 任务派发系统 ============

def load_tasks() -> Dict:
    """加载任务列表"""
    return load_json(TASKS_FILE, {"tasks": [], "max_id": 0})

def save_tasks(data: Dict) -> bool:
    """保存任务列表"""
    return save_json(TASKS_FILE, data)

def cmd_task_new(sender_id: str, title: str, assignee: str = "", priority: str = "normal") -> str:
    """创建新任务"""
    sender_name = MEMBERS.get(sender_id, {}).get("name", sender_id)
    
    if not title:
        return ("📋 任务派发\n"
                f"━━━━━━━━━━━━━━━\n"
                f"用法: !task new <任务描述> [@成员] [high/normal/low]\n"
                f"示例: !task new 完成漏洞报告 @Echo high\n"
                f"      !task new 整理会议纪要")
    
    # 解析任务描述中的提及
    mentioned_members = []
    if "@" in title:
        for mid, minfo in MEMBERS.items():
            if f"@{minfo['name']}" in title:
                mentioned_members.append(mid)
                title = title.replace(f"@{minfo['name']}", "").strip()
    
    # 如果指定了负责人
    if assignee:
        assignee = assignee.strip("@")
        for mid, minfo in MEMBERS.items():
            if minfo["name"] == assignee:
                mentioned_members.append(mid)
                break
    
    # 优先级映射
    priority_map = {"high": "🔴高", "normal": "🟡中", "low": "🟢低"}
    priority_display = priority_map.get(priority.lower(), "🟡中")
    
    now = datetime.now()
    tasks_data = load_tasks()
    task_id = tasks_data["max_id"] + 1
    tasks_data["max_id"] = task_id
    
    task = {
        "id": task_id,
        "title": title,
        "creator": sender_name,
        "assignee": mentioned_members[0] if mentioned_members else "",
        "assignee_name": MEMBERS.get(mentioned_members[0], {}).get("name", "") if mentioned_members else "",
        "priority": priority.lower(),
        "priority_display": priority_display,
        "status": "pending",
        "created_at": now.isoformat(),
        "created_date": now.strftime("%Y-%m-%d"),
        "created_time": now.strftime("%H:%M"),
    }
    
    tasks_data["tasks"].insert(0, task)
    save_tasks(tasks_data)
    
    lines = [
        f"✅ 任务已创建",
        f"━━━━━━━━━━━━━━━",
        f"📋 任务: {title}",
        f"🔖 优先级: {priority_display}",
        f"👤 创建人: {sender_name}",
    ]
    if mentioned_members:
        lines.append(f"🎯 负责人: {task['assignee_name']}")
    lines.append(f"📎 任务ID: #{task_id}")
    
    return "\n".join(lines)

def cmd_task_list(sender_id: str, filter_type: str = "all") -> str:
    """查看任务列表"""
    tasks_data = load_tasks()
    tasks = tasks_data.get("tasks", [])
    
    if not tasks:
        return ("📋 任务列表\n"
                f"━━━━━━━━━━━━━━━\n"
                f"暂无任务\n"
                f"━━━━━━━━━━━━━━━\n"
                f"创建任务: !task new <任务描述>")
    
    # 筛选任务
    if filter_type == "pending":
        filtered = [t for t in tasks if t.get("status") == "pending"]
        title = "待办任务"
    elif filter_type == "done":
        filtered = [t for t in tasks if t.get("status") == "done"]
        title = "已完成任务"
    elif filter_type == "my":
        sender_name = MEMBERS.get(sender_id, {}).get("name", sender_id)
        filtered = [t for t in tasks if t.get("assignee_name") == sender_name or t.get("creator") == sender_name]
        title = f"我的任务"
    else:
        filtered = tasks
        title = "全部任务"
    
    if not filtered:
        return (f"📋 {title}\n"
                f"━━━━━━━━━━━━━━━\n"
                f"暂无任务")
    
    lines = [f"📋 {title}", f"━" * 30, ""]
    
    # 按优先级和创建时间排序
    priority_order = {"high": 0, "normal": 1, "low": 2}
    sorted_tasks = sorted(filtered, key=lambda t: (priority_order.get(t.get("priority", "normal"), 1), t.get("created_at", "")))
    
    for i, task in enumerate(sorted_tasks[:20], 1):
        status_icon = "✅" if task.get("status") == "done" else "⬜"
        priority = task.get("priority_display", "🟡中")
        title = task.get("title", "")[:30]
        creator = task.get("creator", "")
        assignee = task.get("assignee_name", "未分配")
        task_id = task.get("id", "?")
        
        lines.append(f"{i}. {status_icon} {priority} #{task_id} {title}")
        lines.append(f"   👤{creator} → 🎯{assignee}")
        lines.append("")
    
    lines.append("━" * 30)
    lines.append(f"共 {len(sorted_tasks)} 个任务")
    lines.append("筛选: !task list [all/pending/done/my]")
    
    return "\n".join(lines)

def cmd_task_done(sender_id: str, task_id_str: str = "") -> str:
    """完成任务"""
    if not task_id_str:
        return ("✅ 完成任务\n"
                f"━━━━━━━━━━━━━━━\n"
                f"用法: !task done <任务ID>\n"
                f"示例: !task done 1\n"
                f"查看任务: !task list")
    
    try:
        task_id = int(task_id_str)
    except ValueError:
        return f"❌ 无效的任务ID: {task_id_str}"
    
    tasks_data = load_tasks()
    tasks = tasks_data.get("tasks", [])
    
    # 查找任务
    task_found = None
    task_index = None
    for i, t in enumerate(tasks):
        if t.get("id") == task_id:
            task_found = t
            task_index = i
            break
    
    if not task_found:
        return f"❌ 找不到任务 #{task_id}"
    
    if task_found.get("status") == "done":
        return f"⚠️ 任务 #{task_id} 已完成"
    
    # 更新任务状态
    now = datetime.now()
    tasks[task_index]["status"] = "done"
    tasks[task_index]["completed_at"] = now.isoformat()
    tasks[task_index]["completed_date"] = now.strftime("%Y-%m-%d")
    tasks[task_index]["completed_time"] = now.strftime("%H:%M")
    tasks[task_index]["completed_by"] = MEMBERS.get(sender_id, {}).get("name", sender_id)
    
    save_tasks(tasks_data)
    
    return (f"✅ 任务已完成\n"
            f"━━━━━━━━━━━━━━━\n"
            f"📋 任务: {task_found.get('title', '')}\n"
            f"🔖 优先级: {task_found.get('priority_display', '🟡中')}\n"
            f"👤 完成人: {tasks[task_index]['completed_by']}\n"
            f"⏰ 完成时间: {now.strftime('%Y-%m-%d %H:%M')}")

def cmd_dice(member_id: str, bet: str = "") -> str:
    """掷骰子游戏"""
    import random
    
    # 随机生成2个骰子
    dice1 = random.randint(1, 6)
    dice2 = random.randint(1, 6)
    total = dice1 + dice2
    
    # 判断结果
    result_text = ""
    if total == 12:
        result_text = "🎉 超级幸运！满堂红！"
    elif total == 2:
        result_text = "😱 倒霉...蛇眼！"
    elif total % 2 == 0:
        result_text = "👍 双数，还不错"
    else:
        result_text = "🤔 单数，继续加油"
    
    player_name = MEMBERS.get(member_id, {}).get("name", member_id)
    
    return (f"🎲 骰子游戏\n"
            f"━━━━━━━━━━━━━━━\n"
            f"🎯 玩家: {player_name}\n"
            f"🎲 骰子: [{dice1}] + [{dice2}] = {total}\n"
            f"📝 结果: {result_text}")

def cmd_vote(member_id: str, question: str = "", options: List[str] = None) -> str:
    """创建投票"""
    if not question:
        return ("📊 投票系统\n"
                f"━━━━━━━━━━━━━━━\n"
                f"用法: !vote <问题> <选项1> <选项2> ...\n"
                f"示例: !vote 今天吃什么? 火锅 烤肉 寿司\n"
                f"投票: !vote <投票ID> <选项编号>")
    
    if not options or len(options) < 2:
        return "❌ 至少需要2个选项\n用法: !vote <问题> <选项1> <选项2> ..."
    
    if len(options) > 10:
        return "❌ 最多10个选项"
    
    player_name = MEMBERS.get(member_id, {}).get("name", member_id)
    
    return (f"📊 投票已创建\n"
            f"━━━━━━━━━━━━━━━\n"
            f"📝 问题: {question}\n"
            f"🔖 选项:\n" + "\n".join(f"   {i+1}. {opt}" for i, opt in enumerate(options)) + f"\n"
            f"━━━━━━━━━━━━━━━\n"
            f"👤 创建人: {player_name}")

def cmd_help() -> str:
    """显示帮助"""
    return """🏢 观复阁办公室 · 命令帮助
━━━━━━━━━━━━━━━━━━━━━━

📌 基础命令
  !who              查看所有成员状态
  !status <状态>     设置当前状态
  !help             显示此帮助

📅 打卡命令
  !checkin [位置]   上班打卡
  !checkout         下班打卡

🏢 楼层命令
  !go <楼层>        前往某楼层
  示例: !go 6F

📋 公告板
  !board            查看公告
  !board <内容>     发布公告

📅 会议室预约
  !booking <时间> <用途>
  示例: !booking 15:00 项目评审

📋 任务派发
  !task new <描述> [@成员] [high/normal/low]
  !task list [all/pending/done/my]
  !task done <任务ID>
  示例: !task new 完成漏洞报告 @Echo high
  示例: !task list pending

🎲 骰子游戏
  !dice [投注]      掷骰子试试手气

📊 投票系统
  !vote <问题> <选项1> <选项2> ...
  示例: !vote 今天吃什么? 火锅 烤肉 寿司

━━━━━━━━━━━━━━━━━━━━━━
状态选项（原有6种）:
  idle / writing / researching
  executing / syncing / error

状态选项（新增4种）:
  online  🟢 在线    → 空闲待命
  busy    🔴 忙碌    → 工作中
  away    🟡 离开    → 暂时离开
  offline ⚫ 离线    → 已下线

楼层选项:
  8F 7F 6F 5F 4F 3F 2F 1F GF B1 B2
"""

# ============ 主入口 ============

def handle_message(sender_id: str, message: str) -> Optional[str]:
    """
    处理消息，返回响应或 None
    
    Args:
        sender_id: 发送者 ID
        message: 消息内容
    
    Returns:
        响应字符串，或 None（不是命令）
    """
    trimmed = message.strip()
    
    # 不是命令不处理
    if not trimmed.startswith("!"):
        return None
    
    parts = trimmed[1:].split(maxsplit=2)
    if not parts:
        return None
    
    command = parts[0].lower()
    args = parts[1:] if len(parts) > 1 else []
    
    try:
        if command == "who":
            return cmd_who()
        
        elif command == "status":
            if not args:
                return "❌ 请提供状态\n用法: !status <状态>\n状态: idle, writing, researching, executing, syncing, error"
            return cmd_status(sender_id, args[0], args[1] if len(args) > 1 else "")
        
        elif command == "go":
            if not args:
                return f"❌ 请提供楼层\n可用楼层: {', '.join(FLOORS)}"
            return cmd_go(sender_id, args[0])
        
        elif command == "checkin":
            location = args[0] if args else ""
            return cmd_checkin(sender_id, location)
        
        elif command == "checkout":
            return cmd_checkout(sender_id)
        
        elif command == "board":
            content = args[0] if args else ""
            return cmd_board(sender_id, content)
        
        elif command == "booking":
            if len(args) < 2:
                return "❌ 请提供时间和用途\n用法: !booking <时间> <用途>"
            return cmd_booking(sender_id, args[0], args[1])
        
        elif command == "dice":
            bet = args[0] if args else ""
            return cmd_dice(sender_id, bet)
        
        elif command == "vote":
            # !vote <问题> <选项1> <选项2> ...
            if not args:
                return cmd_vote(sender_id, "")
            # 找到第一个空格分隔问题和建议
            # 格式: !vote 问题 选项1 选项2
            question = args[0]
            options = args[1:] if len(args) > 1 else []
            return cmd_vote(sender_id, question, options)
        
        elif command == "help":
            return cmd_help()
        
        elif command == "task":
            # !task <new|list|done> [参数]
            if not args:
                return ("📋 任务派发系统\n"
                        f"━━━━━━━━━━━━━━━━━━━━━━\n"
                        f"用法: !task <new|list|done> [参数]\n"
                        f"\n"
                        f"📌 !task new <任务描述> [@成员] [high/normal/low]\n"
                        f"   创建新任务\n"
                        f"   示例: !task new 完成漏洞报告 @Echo high\n"
                        f"   示例: !task new 整理会议纪要\n"
                        f"\n"
                        f"📌 !task list [all/pending/done/my]\n"
                        f"   查看任务列表\n"
                        f"   示例: !task list pending\n"
                        f"\n"
                        f"📌 !task done <任务ID>\n"
                        f"   标记任务完成\n"
                        f"   示例: !task done 1")
            
            subcmd = args[0].lower()
            subargs = args[1:] if len(args) > 1 else []
            
            if subcmd == "new":
                # 解析: !task new <title> [@assignee] [priority]
                title = ""
                assignee = ""
                priority = "normal"
                for arg in subargs:
                    if arg.startswith("@"):
                        assignee = arg[1:]
                    elif arg in ("high", "normal", "low"):
                        priority = arg
                    else:
                        title = arg if not title else title + " " + arg
                return cmd_task_new(sender_id, title, assignee, priority)
            
            elif subcmd == "list":
                filter_type = subargs[0] if subargs else "all"
                return cmd_task_list(sender_id, filter_type)
            
            elif subcmd == "done":
                task_id = subargs[0] if subargs else ""
                return cmd_task_done(sender_id, task_id)
            
            else:
                return f"❌ 未知的子命令: {subcmd}\n可用: new, list, done"
        
        else:
            return f"❌ 未知命令: !{command}\n输入 !help 查看可用命令"
    
    except Exception as e:
        return f"❌ 命令执行出错: {e}"

# ============ 直接运行测试 ============

if __name__ == "__main__":
    # 测试命令
    print("=== !who ===")
    print(cmd_who())
    print("\n=== !help ===")
    print(cmd_help())
