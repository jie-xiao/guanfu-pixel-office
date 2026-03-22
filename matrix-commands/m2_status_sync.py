#!/usr/bin/env python3
"""
观复阁 Matrix 状态同步服务 - M2

功能：
1. 定时读取 Matrix 消息中的状态更新
2. 同步到 Star-Office-UI 看板
3. 定时推送各成员状态
"""

import json
import os
import sys
import time
import requests
from datetime import datetime
from pathlib import Path

# 路径配置
BASE_DIR = Path(__file__).parent.parent.absolute()
STATE_FILE = BASE_DIR / "state.json"
PUSH_SCRIPT = BASE_DIR / "push-status.py"
OFFICE_URL = "http://127.0.0.1:19000"

# 成员配置
MEMBERS = {
    "guanfu": "观复",
    "geying": "阁影",
    "shiuyi": "拾遗",
    "zhivey": "知微",
    "echo": "Echo",
    "lingyi": "灵犀",
    "xiaoyan": "小砚",
    "mubi": "墨白"
}

# 状态文件
AGENT_STATE_FILE = BASE_DIR / ".agent-state.json"

def load_agent_state():
    """加载 agent 状态缓存"""
    if AGENT_STATE_FILE.exists():
        try:
            with open(AGENT_STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_agent_state(state):
    """保存 agent 状态缓存"""
    try:
        with open(AGENT_STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def join_agent(member_id, member_name):
    """加入办公室"""
    key_map = {
        "guanfu": "ocj_guanfu_01",
        "geying": "ocj_geying_01",
        "shiuyi": "ocj_shiuyi_01",
        "zhivey": "ocj_zhivey_01",
        "echo": "ocj_echo_01",
        "lingyi": "ocj_lingyi_01",
        "xiaoyan": "ocj_xiaoyan_01",
        "mubi": "ocj_mubi_01"
    }
    
    key = key_map.get(member_id)
    if not key:
        print(f"[E] Unknown member: {member_id}")
        return None
    
    payload = {
        "name": member_name,
        "joinKey": key,
        "state": "idle",
        "detail": f"{member_name} joined"
    }
    
    try:
        r = requests.post(f"{OFFICE_URL}/join-agent", json=payload, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok"):
                agent_id = data.get("agentId")
                print(f"[I] {member_name} joined: {agent_id}")
                return agent_id
    except Exception as e:
        print(f"[E] Join failed: {e}")
    
    return None

def push_status(member_id, member_name, state, detail=""):
    """推送状态"""
    key_map = {
        "guanfu": "ocj_guanfu_01",
        "geying": "ocj_geying_01",
        "shiuyi": "ocj_shiuyi_01",
        "zhivey": "ocj_zhivey_01",
        "echo": "ocj_echo_01",
        "lingyi": "ocj_lingyi_01",
        "xiaoyan": "ocj_xiaoyan_01",
        "mubi": "ocj_mubi_01"
    }
    
    key = key_map.get(member_id)
    if not key:
        return False
    
    agent_state = load_agent_state()
    agent_id = agent_state.get(member_id, {}).get("agentId")
    
    if not agent_id:
        # 需要先 join
        agent_id = join_agent(member_id, member_name)
        if not agent_id:
            return False
        agent_state[member_id] = {"agentId": agent_id, "key": key}
        save_agent_state(agent_state)
    
    payload = {
        "agentId": agent_id,
        "joinKey": key,
        "state": state,
        "detail": detail or f"{member_name} {state}"
    }
    
    try:
        r = requests.post(f"{OFFICE_URL}/agent-push", json=payload, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok"):
                return True
    except Exception as e:
        print(f"[E] Push failed: {e}")
    
    return False

def ensure_all_joined():
    """确保所有成员都已加入"""
    agent_state = load_agent_state()
    for member_id, member_name in MEMBERS.items():
        if member_id not in agent_state or not agent_state[member_id].get("agentId"):
            print(f"[I] Joining {member_name}...")
            agent_id = join_agent(member_id, member_name)
            if agent_id:
                agent_state[member_id] = {
                    "agentId": agent_id,
                    "key": {
                        "guanfu": "ocj_guanfu_01",
                        "geying": "ocj_geying_01",
                        "shiuyi": "ocj_shiuyi_01",
                        "zhivey": "ocj_zhivey_01",
                        "echo": "ocj_echo_01",
                        "lingyi": "ocj_lingyi_01",
                        "xiaoyan": "ocj_xiaoyan_01",
                        "mubi": "ocj_mubi_01"
                    }.get(member_id)
                }
                save_agent_state(agent_state)
                time.sleep(1)  # 避免请求太快

def sync_all_states():
    """同步所有成员状态"""
    # 读取本地状态文件
    local_state_file = BASE_DIR / "matrix-commands" / "data" / "status.json"
    if not local_state_file.exists():
        # 使用默认状态
        for member_id, member_name in MEMBERS.items():
            push_status(member_id, member_name, "idle", "待命中")
        return
    
    try:
        with open(local_state_file, "r", encoding="utf-8") as f:
            status_data = json.load(f)
        
        for member_id, data in status_data.items():
            if member_id in MEMBERS:
                state = data.get("state", "idle")
                detail = data.get("detail", "")
                push_status(member_id, MEMBERS[member_id], state, detail)
    except Exception as e:
        print(f"[E] Sync error: {e}")
        # 回退到默认
        for member_id, member_name in MEMBERS.items():
            push_status(member_id, member_name, "idle", "待命中")

def run_sync_loop(interval=60):
    """定时同步循环"""
    print(f"[I] Status sync service started (interval={interval}s)")
    print(f"[I] Office URL: {OFFICE_URL}")
    
    # 先确保所有成员加入
    ensure_all_joined()
    
    # 主循环
    while True:
        try:
            sync_all_states()
        except Exception as e:
            print(f"[E] Sync error: {e}")
        
        time.sleep(interval)

def main():
    import argparse
    parser = argparse.ArgumentParser(description="观复阁状态同步服务")
    parser.add_argument("--interval", "-i", type=int, default=60, help="同步间隔（秒）")
    parser.add_argument("--once", action="store_true", help="单次执行后退出")
    args = parser.parse_args()
    
    if args.once:
        ensure_all_joined()
        sync_all_states()
    else:
        run_sync_loop(args.interval)

if __name__ == "__main__":
    main()
