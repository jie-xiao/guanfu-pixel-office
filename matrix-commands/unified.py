#!/usr/bin/env python3
"""
观复阁办公室 - 统一命令接口

整合 M1 命令处理 + Hook 状态同步，提供统一的命令行接口。

用法：
    python unified.py <command> [args]
"""

import json
import sys
import os
from pathlib import Path

# 添加当前目录到路径
BASE_DIR = Path(__file__).parent.parent.absolute()
sys.path.insert(0, str(BASE_DIR))

from matrix_commands.m1_commands import (
    cmd_who, cmd_status, cmd_go, cmd_checkin, cmd_checkout,
    cmd_board, cmd_booking, cmd_help, MEMBERS
)
from matrix_commands.hook_server import on_command

def main():
    if len(sys.argv) < 2:
        print(cmd_help())
        sys.exit(1)
    
    command = sys.argv[1].lower()
    args = sys.argv[2:] if len(sys.argv) > 2 else []
    
    # 默认 sender_id
    sender_id = "guanfu"
    if args and args[0] in MEMBERS:
        sender_id = args.pop(0)
    
    # 执行命令
    if command == "who":
        result = cmd_who()
    elif command == "status":
        state = args[0] if args else "idle"
        detail = " ".join(args[1:]) if len(args) > 1 else ""
        result = cmd_status(sender_id, state, detail)
        # 触发 hook
        on_command(sender_id, "status", f"{state} {detail}")
    elif command == "go":
        floor = args[0] if args else ""
        result = cmd_go(sender_id, floor)
        # 触发 hook
        on_command(sender_id, "go", floor)
    elif command == "checkin":
        location = args[0] if args else ""
        result = cmd_checkin(sender_id, location)
        # 触发 hook
        on_command(sender_id, "checkin", location)
    elif command == "checkout":
        result = cmd_checkout(sender_id)
        # 触发 hook
        on_command(sender_id, "checkout", "")
    elif command == "board":
        content = " ".join(args) if args else ""
        result = cmd_board(sender_id, content)
    elif command == "booking":
        time = args[0] if len(args) > 0 else ""
        purpose = " ".join(args[1:]) if len(args) > 1 else ""
        result = cmd_booking(sender_id, time, purpose)
    elif command == "help":
        result = cmd_help()
    else:
        result = f"Unknown command: {command}"
    
    print(result)

if __name__ == "__main__":
    main()
