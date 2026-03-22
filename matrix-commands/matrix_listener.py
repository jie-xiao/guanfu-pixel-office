#!/usr/bin/env python3
"""
观复阁 Matrix 消息监听服务

监听 Matrix 房间消息，当收到 ! 命令时调用 hook_server。

注意：这是轮询方式实现，不是 WebSocket
"""

import json
import time
import requests
import importlib.util
from datetime import datetime
from pathlib import Path

# 配置
MATRIX_HOMESERVER = "http://localhost:8008"
ROOM_ID = "!kDAGSXnsMB56zxLt:localhost"
ACCESS_TOKEN = "XfRUYFQparlYs3AEUdFjzOQrwQNxY6hOEsVHqlme58E"  # guanfu token

# 获取当前脚本所在目录
SCRIPT_DIR = Path(__file__).parent.absolute()
PARENT_DIR = SCRIPT_DIR.parent.absolute()

# 动态加载模块
def load_module(name, filepath):
    spec = importlib.util.spec_from_file_location(name, filepath)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

# 加载 hook_server 和 m1_commands
hook_module = load_module('hook_server', str(SCRIPT_DIR / 'hook_server.py'))
m1_module = load_module('m1_commands', str(SCRIPT_DIR / 'm1_commands.py'))

on_command = hook_module.on_command
cmd_who = m1_module.cmd_who
cmd_status = m1_module.cmd_status
cmd_go = m1_module.cmd_go
cmd_checkin = m1_module.cmd_checkin
cmd_checkout = m1_module.cmd_checkout
cmd_board = m1_module.cmd_board
cmd_booking = m1_module.cmd_booking
cmd_help = m1_module.cmd_help
MEMBERS = m1_module.MEMBERS

# 状态缓存
next_batch = None
seen_events = set()

def matrix_get(endpoint, params=None):
    """Matrix GET 请求"""
    url = f"{MATRIX_HOMESERVER}/_matrix/client/r0/{endpoint}"
    params = params or {}
    params["access_token"] = ACCESS_TOKEN
    
    r = requests.get(url, params=params, timeout=30)
    return r.json()

def matrix_post(endpoint, data):
    """Matrix POST 请求"""
    url = f"{MATRIX_HOMESERVER}/_matrix/client/r0/{endpoint}"
    data["access_token"] = ACCESS_TOKEN
    
    r = requests.post(url, json=data, timeout=30)
    return r.json()

def send_message(content):
    """发送消息到房间"""
    url = f"{MATRIX_HOMESERVER}/_matrix/client/r0/rooms/{ROOM_ID}/send/m.room.message"
    data = {
        "access_token": ACCESS_TOKEN,
        "msgtype": "m.text",
        "body": content
    }
    
    # 生成 txn_id
    txn_id = f"m{int(time.time() * 1000)}"
    r = requests.put(f"{url}/{txn_id}", json=data, timeout=30)
    return r.json()

def parse_command(sender_id, content):
    """解析并执行命令"""
    if not content.startswith("!"):
        return None
    
    parts = content[1:].split(maxsplit=2)
    if not parts:
        return None
    
    command = parts[0].lower()
    args = parts[1:] if len(parts) > 1 else []
    
    # 确定 sender_id
    member_id = None
    for mid, minfo in MEMBERS.items():
        if minfo.get("name") in sender_id or sender_id.startswith(f"@{mid}"):
            member_id = mid
            break
    
    if not member_id:
        # 尝试从 sender_id 提取
        if "guanfu" in sender_id:
            member_id = "guanfu"
        elif "geying" in sender_id:
            member_id = "geying"
        elif "echo" in sender_id:
            member_id = "echo"
        else:
            member_id = "guanfu"  # 默认
    
    try:
        if command == "who":
            return cmd_who()
        
        elif command == "status":
            if not args:
                return "用法: !status <状态> [详情]"
            state = args[0]
            detail = args[1] if len(args) > 1 else ""
            result = cmd_status(member_id, state, detail)
            on_command(member_id, "status", f"{state} {detail}")
            return result
        
        elif command == "go":
            if not args:
                return f"用法: !go <楼层>"
            floor = args[0]
            result = cmd_go(member_id, floor)
            on_command(member_id, "go", floor)
            return result
        
        elif command == "checkin":
            location = args[0] if args else ""
            result = cmd_checkin(member_id, location)
            on_command(member_id, "checkin", location)
            return result
        
        elif command == "checkout":
            result = cmd_checkout(member_id)
            on_command(member_id, "checkout", "")
            return result
        
        elif command == "board":
            content = args[0] if args else ""
            return cmd_board(member_id, content)
        
        elif command == "booking":
            if len(args) < 2:
                return "用法: !booking <时间> <用途>"
            time = args[0]
            purpose = args[1]
            return cmd_booking(member_id, time, purpose)
        
        elif command == "help":
            return cmd_help()
        
        else:
            return f"未知命令: !{command}\n输入 !help 查看可用命令"
    
    except Exception as e:
        return f"命令执行出错: {e}"

def sync():
    """同步并处理新消息"""
    global next_batch
    
    params = {"timeout": 5000}
    if next_batch:
        params["since"] = next_batch
    
    try:
        result = matrix_get(f"rooms/{ROOM_ID}/messages", params)
        
        if "chunk" in result:
            for event in result["chunk"]:
                if event["type"] == "m.room.message":
                    event_id = event["event_id"]
                    if event_id in seen_events:
                        continue
                    seen_events.add(event_id)
                    
                    sender = event["sender"]
                    content = event["content"].get("body", "")
                    
                    # 忽略自己的消息
                    if sender == "@guanfu:localhost":
                        continue
                    
                    # 忽略不含 ! 的消息
                    if not content.startswith("!"):
                        continue
                    
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] {sender}: {content}")
                    
                    # 处理命令
                    response = parse_command(sender, content)
                    if response:
                        # 发送响应（限制长度）
                        if len(response) > 2000:
                            response = response[:2000] + "\n...(太长已截断)"
                        send_message(response)
        
        if "end" in result:
            next_batch = result["end"]
    
    except Exception as e:
        print(f"[E] Sync error: {e}")
        time.sleep(5)

def ensure_joined():
    """确保已加入房间"""
    try:
        result = matrix_get(f"rooms/{ROOM_ID}/joined_members")
        if "joined_members" in result:
            members = result["joined_members"]
            if "@guanfu:localhost" in members:
                print("[I] Already joined room")
                return True
    except Exception:
        pass
    
    # 尝试加入
    try:
        matrix_post(f"rooms/{ROOM_ID}/join", {})
        print("[I] Joined room")
        return True
    except Exception as e:
        print(f"[E] Join failed: {e}")
        return False

def main():
    print("[I] Matrix listener starting...")
    print(f"[I] Room: {ROOM_ID}")
    print(f"[I] Homeserver: {MATRIX_HOMESERVER}")
    
    # 确保已加入
    if not ensure_joined():
        print("[E] Failed to join room, exiting")
        return
    
    # 初始化 hook
    print("[I] Initializing hook...")
    try:
        from hook_server import ensure_all_joined
        ensure_all_joined()
    except Exception as e:
        print(f"[W] Hook init warning: {e}")
    
    print("[I] Listening for commands...")
    print("[I] Press Ctrl+C to stop")
    
    # 主循环
    while True:
        try:
            sync()
        except KeyboardInterrupt:
            print("\n[I] Stopping...")
            break
        except Exception as e:
            print(f"[E] Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
