#!/usr/bin/env python3
"""命令处理入口 - 供 OpenClaw exec 调用"""
import sys
import os

os.environ['PYTHONIOENCODING'] = 'utf-8'

# 添加路径
sys.path.insert(0, r'E:\guanfu\Star-Office-UI\matrix-commands')

import importlib.util

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

BASE = r'E:\guanfu\Star-Office-UI\matrix-commands'
hook = load_module('hook', os.path.join(BASE, 'hook_server.py'))
m1 = load_module('m1', os.path.join(BASE, 'm1_commands.py'))

def process(member_id, command_str):
    """处理命令并推送状态"""
    parts = command_str.strip().split(maxsplit=2)
    if not parts:
        return "未知命令"
    
    cmd = parts[0].lower()
    args = parts[1:] if len(parts) > 1 else []
    
    try:
        if cmd == "who":
            result = m1.cmd_who()
            return result
        elif cmd == "status":
            if not args:
                return "用法: !status <状态> [详情]"
            state = args[0]
            detail = args[1] if len(args) > 1 else ""
            m1.cmd_status(member_id, state, detail)
            hook.on_command(member_id, "status", f"{state} {detail}")
            return f"✅ {member_id} 状态已更新: {state}"
        elif cmd == "go":
            if not args:
                return "用法: !go <楼层>"
            m1.cmd_go(member_id, args[0])
            hook.on_command(member_id, "go", args[0])
            return f"✅ {member_id} 已移动到 {args[0]}"
        elif cmd == "checkin":
            loc = args[0] if args else "办公室"
            m1.cmd_checkin(member_id, loc)
            hook.on_command(member_id, "checkin", loc)
            return f"✅ {member_id} 已在 {loc} 打卡"
        elif cmd == "checkout":
            m1.cmd_checkout(member_id)
            hook.on_command(member_id, "checkout", "")
            return f"✅ {member_id} 已下班打卡"
        elif cmd == "board":
            return m1.cmd_board(member_id, args[0] if args else "")
        elif cmd == "booking":
            if len(args) < 2:
                return "用法: !booking <时间> <用途>"
            return m1.cmd_booking(member_id, args[0], args[1])
        elif cmd == "help":
            return m1.cmd_help()
        else:
            return f"未知命令: !{cmd}\n输入 !help 查看可用命令"
    except Exception as e:
        return f"命令执行出错: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: process_cmd.py <member_id> <command>")
        sys.exit(1)
    
    member_id = sys.argv[1]
    command_str = " ".join(sys.argv[2:])
    result = process(member_id, command_str)
    print(result)
