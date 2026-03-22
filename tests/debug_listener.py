#!/usr/bin/env python3
"""Debug version of listener"""
import sys
import os

# Force UTF-8
os.environ['PYTHONIOENCODING'] = 'utf-8'
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

print("[I] Debug listener starting", flush=True)

import requests
import time
import importlib.util
from datetime import datetime

HOMESERVER = "http://localhost:8008"
ROOM_ID = "!kDAGSXnsMB56zxLt:localhost"
TOKEN = "XfRUYFQparlYs3AEUdFjzOQrwQNxY6hOEsVHqlme58E"

print("[I] Loading modules...", flush=True)

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

BASE = "E:/guanfu/Star-Office-UI/matrix-commands"
try:
    hook = load_module('hook', f'{BASE}/hook_server.py')
    m1 = load_module('m1', f'{BASE}/m1_commands.py')
    print("[I] Modules loaded", flush=True)
except Exception as e:
    print(f"[E] Module load failed: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)

on_command = hook.on_command
cmd_who = m1.cmd_who
cmd_status = m1.cmd_status
cmd_go = m1.cmd_go
cmd_checkin = m1.cmd_checkin
cmd_checkout = m1.cmd_checkout
cmd_board = m1.cmd_board
cmd_booking = m1.cmd_booking
cmd_help = m1.cmd_help
MEMBERS = m1.MEMBERS

print(f"[I] MEMBERS: {list(MEMBERS.keys())}", flush=True)

next_batch = None
seen = set()
session = requests.Session()

def api_get(endpoint, params=None):
    params = params or {}
    params['access_token'] = TOKEN
    return session.get(f"{HOMESERVER}/_matrix/client/r0/{endpoint}", params=params, timeout=30).json()

def api_put(endpoint, data):
    data['access_token'] = TOKEN
    txn_id = f"m{int(time.time()*1000)}"
    return requests.put(f"{HOMESERVER}/_matrix/client/r0/{endpoint}/{txn_id}", json=data, timeout=30).json()

def send(text):
    if len(text) > 2000:
        text = text[:2000] + "\n...(太长已截断)"
    return api_put(f"rooms/{ROOM_ID}/send/m.room.message", {"msgtype": "m.text", "body": text})

def parse(sender, body):
    if not body.startswith("!"):
        return None
    parts = body[1:].split(maxsplit=2)
    if not parts:
        return None
    cmd = parts[0].lower()
    args = parts[1:] if len(parts) > 1 else []
    
    member_id = "guanfu"
    for mid in MEMBERS:
        if mid in sender:
            member_id = mid
            break
    
    try:
        if cmd == "who":
            return cmd_who()
        elif cmd == "status":
            if not args:
                return "用法: !status <状态> [详情]"
            state, detail = args[0], args[1] if len(args) > 1 else ""
            result = cmd_status(member_id, state, detail)
            on_command(member_id, "status", f"{state} {detail}")
            return result
        elif cmd == "go":
            if not args:
                return f"用法: !go <楼层>"
            result = cmd_go(member_id, args[0])
            on_command(member_id, "go", args[0])
            return result
        elif cmd == "checkin":
            result = cmd_checkin(member_id, args[0] if args else "")
            on_command(member_id, "checkin", "")
            return result
        elif cmd == "checkout":
            result = cmd_checkout(member_id)
            on_command(member_id, "checkout", "")
            return result
        elif cmd == "board":
            return cmd_board(member_id, args[0] if args else "")
        elif cmd == "booking":
            if len(args) < 2:
                return "用法: !booking <时间> <用途>"
            return cmd_booking(member_id, args[0], args[1])
        elif cmd == "help":
            return cmd_help()
        else:
            return f"未知命令: !{cmd}\n输入 !help 查看可用命令"
    except Exception as e:
        return f"命令执行出错: {e}"

def sync():
    global next_batch
    print("[D] sync() called", flush=True)
    params = {"timeout": 5000, "dir": "b"}
    if next_batch:
        params["since"] = next_batch
    
    try:
        print(f"[D] Calling API with params: {list(params.keys())}", flush=True)
        result = api_get(f"rooms/{ROOM_ID}/messages", params)
        print(f"[D] API returned, chunk count: {len(result.get('chunk', []))}", flush=True)
        if "chunk" in result:
            for event in result["chunk"]:
                if event["type"] != "m.room.message":
                    continue
                eid = event["event_id"]
                if eid in seen:
                    continue
                seen.add(eid)
                
                sender = event["sender"]
                body = event["content"].get("body", "")
                
                if sender == "@guanfu:localhost":
                    continue
                
                if not body.startswith("!"):
                    continue
                
                print(f"[{datetime.now().strftime('%H:%M:%S')}] {sender}: {body[:50]}", flush=True)
                
                resp = parse(sender, body)
                if resp:
                    send(resp)
        
        if "end" in result:
            next_batch = result["end"]
            print(f"[D] Updated next_batch to {next_batch}", flush=True)
    except Exception as e:
        print(f"[E] Sync error: {e}", flush=True)
        import traceback
        traceback.print_exc()
        next_batch = None
        time.sleep(5)

print("[I] Joining room...", flush=True)
try:
    r = api_get(f"rooms/{ROOM_ID}/joined_members")
    if "@guanfu:localhost" not in r.get("joined_members", {}):
        api_put(f"rooms/{ROOM_ID}/join", {})
except Exception as e:
    print(f"[E] Join error: {e}", flush=True)

print("[I] Ready, listening...", flush=True)

while True:
    try:
        sync()
    except KeyboardInterrupt:
        print("\n[I] Stopped", flush=True)
        break
    except Exception as e:
        print(f"[E] Main loop error: {e}", flush=True)
        import traceback
        traceback.print_exc()
        time.sleep(5)
