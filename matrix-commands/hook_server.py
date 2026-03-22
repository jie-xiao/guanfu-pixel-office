#!/usr/bin/env python3
"""
观复阁 Matrix Hook 服务

当 Matrix 消息触发命令时，立即同步状态到 Star Office UI。
无需定时轮询，状态更新更及时。

工作原理：
1. 监听 Matrix 消息
2. 当检测到 ! 命令时，立即触发状态同步
3. 同时将状态变更推送到 Star Office UI
"""

import json
import os
import sys
import time
import requests
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

# 配置
OFFICE_URL = "http://127.0.0.1:19000"
BASE_DIR = Path(__file__).parent.parent.absolute()
STATE_FILE = BASE_DIR / "state.json"
AGENT_STATE_FILE = BASE_DIR / ".agent-state.json"
FLOOR_STATE_FILE = BASE_DIR / "floor-state.json"

# 新状态到内部状态的映射
STATE_TO_INTERNAL = {
    "online": "idle",
    "busy": "writing",
    "away": "idle",
    "offline": "idle",
}

# 成员配置
MEMBERS = {
    "guanfu": {"name": "观复", "floor": "B2"},
    "geying": {"name": "阁影", "floor": "6F"},
    "shiuyi": {"name": "拾遗", "floor": "5F"},
    "zhivey": {"name": "知微", "floor": "4F"},
    "echo": {"name": "Echo", "floor": "3F"},
    "lingyi": {"name": "灵犀", "floor": "2F"},
    "xiaoyan": {"name": "小砚", "floor": "1F"},
    "mubi": {"name": "墨白", "floor": "1F"},
}

JOIN_KEYS = {
    "guanfu": "ocj_guanfu_01",
    "geying": "ocj_geying_01",
    "shiuyi": "ocj_shiuyi_01",
    "zhivey": "ocj_zhivey_01",
    "echo": "ocj_echo_01",
    "lingyi": "ocj_lingyi_01",
    "xiaoyan": "ocj_xiaoyan_01",
    "mubi": "ocj_mubi_01",
}

def load_state() -> Dict:
    """加载状态"""
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_state(data: Dict) -> bool:
    """保存状态"""
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False

def load_agent_state() -> Dict:
    """加载 agent 状态缓存"""
    if AGENT_STATE_FILE.exists():
        try:
            with open(AGENT_STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_agent_state(data: Dict) -> bool:
    """保存 agent 状态缓存"""
    try:
        with open(AGENT_STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False

def load_floor_state() -> Dict:
    """加载楼层状态"""
    if FLOOR_STATE_FILE.exists():
        try:
            with open(FLOOR_STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"currentFloor": "1F", "agents": {}}

def save_floor_state(data: Dict) -> bool:
    """保存楼层状态"""
    try:
        with open(FLOOR_STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False

def update_member_floor_state(member_id: str, state: str, activity: str = "") -> bool:
    """更新成员楼层状态"""
    member_info = MEMBERS.get(member_id, {})
    if not member_info:
        return False
    
    floor = member_info.get("floor", "1F")
    
    floor_state = load_floor_state()
    if "agents" not in floor_state:
        floor_state["agents"] = {}
    
    floor_state["agents"][member_id] = {
        "floor": floor,
        "state": state,
        "activity": activity,
        "last_active": datetime.now().isoformat()
    }
    
    return save_floor_state(floor_state)

def join_agent(member_id: str) -> Optional[str]:
    """加入办公室"""
    key = JOIN_KEYS.get(member_id)
    name = MEMBERS.get(member_id, {}).get("name", member_id)
    
    if not key:
        return None
    
    payload = {
        "name": name,
        "joinKey": key,
        "state": "idle",
        "detail": f"{name} joined"
    }
    
    try:
        r = requests.post(f"{OFFICE_URL}/join-agent", json=payload, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok"):
                return data.get("agentId")
    except Exception:
        pass
    
    return None

def push_state(member_id: str, state: str, detail: str = "") -> bool:
    """推送状态到 Star Office UI"""
    key = JOIN_KEYS.get(member_id)
    name = MEMBERS.get(member_id, {}).get("name", member_id)
    
    if not key:
        return False
    
    agent_state = load_agent_state()
    
    # 确保已加入
    if member_id not in agent_state or not agent_state.get(member_id, {}).get("agentId"):
        agent_id = join_agent(member_id)
        if not agent_id:
            return False
        agent_state[member_id] = {"agentId": agent_id, "key": key}
        save_agent_state(agent_state)
    
    agent_id = agent_state[member_id].get("agentId")
    
    payload = {
        "agentId": agent_id,
        "joinKey": key,
        "state": state,
        "detail": detail or f"{name} {state}"
    }
    
    try:
        r = requests.post(f"{OFFICE_URL}/agent-push", json=payload, timeout=10)
        if r.status_code == 200:
            data = r.json()
            return data.get("ok", False)
    except Exception:
        pass
    
    return False

def on_command(member_id: str, command: str, args: str = "") -> Dict[str, Any]:
    """
    命令触发时的 Hook 回调
    
    当 Matrix 收到命令时调用此函数：
    - !status <state> -> 立即同步到 Star Office UI
    - !go <floor> -> 更新位置
    - !checkin -> 更新状态为 writing
    - !checkout -> 更新状态为 idle
    """
    result = {"success": False, "pushed": False}
    
    if command == "status" and args:
        # !status <state> -> 立即推送
        state = args.split()[0] if args.split() else "idle"
        detail = " ".join(args.split()[1:]) if len(args.split()) > 1 else ""
        
        # 转换新状态到内部状态
        internal_state = STATE_TO_INTERNAL.get(state, state)
        
        # 更新本地状态
        state_data = load_state()
        state_data[member_id] = {
            "state": internal_state,
            "display_state": state,
            "detail": detail,
            "updated": datetime.now().isoformat()
        }
        save_state(state_data)
        
        # 立即推送到 Star Office UI（使用内部状态）
        pushed = push_state(member_id, internal_state, detail)
        
        # 更新楼层状态
        update_member_floor_state(member_id, internal_state, detail or state)
        
        result = {
            "success": True,
            "pushed": pushed,
            "state": state,
            "internal_state": internal_state,
            "detail": detail
        }
    
    elif command == "go" and args:
        # !go <floor> -> 更新位置
        floor = args.split()[0] if args.split() else ""
        
        state_data = load_state()
        current = state_data.get(member_id, {}).get("state", "idle")
        state_data[member_id] = {
            "state": current,
            "detail": f"前往 {floor}",
            "floor": floor,
            "updated": datetime.now().isoformat()
        }
        save_state(state_data)
        
        # 更新楼层状态
        update_member_floor_state(member_id, current, f"前往 {floor}")
        
        result = {"success": True, "floor": floor}
    
    elif command == "checkin":
        # !checkin -> 更新为 writing
        state_data = load_state()
        state_data[member_id] = {
            "state": "writing",
            "detail": "工作中",
            "updated": datetime.now().isoformat()
        }
        save_state(state_data)
        
        pushed = push_state(member_id, "writing", "上班打卡")
        update_member_floor_state(member_id, "writing", "上班打卡")
        result = {"success": True, "pushed": pushed}
    
    elif command == "checkout":
        # !checkout -> 更新为 idle
        state_data = load_state()
        state_data[member_id] = {
            "state": "idle",
            "detail": "已下班",
            "updated": datetime.now().isoformat()
        }
        save_state(state_data)
        
        pushed = push_state(member_id, "idle", "下班打卡")
        update_member_floor_state(member_id, "idle", "已下班")
        result = {"success": True, "pushed": pushed}
    
    elif command == "board" and args:
        # !board -> 不影响状态，只记录
        result = {"success": True, "action": "board"}
    
    return result

def ensure_all_joined():
    """确保所有成员都已加入"""
    agent_state = load_agent_state()
    
    for member_id in MEMBERS:
        if member_id not in agent_state or not agent_state.get(member_id, {}).get("agentId"):
            print(f"[I] Joining {MEMBERS[member_id]['name']}...")
            agent_id = join_agent(member_id)
            if agent_id:
                agent_state[member_id] = {
                    "agentId": agent_id,
                    "key": JOIN_KEYS[member_id]
                }
                save_agent_state(agent_state)
                time.sleep(0.5)

def sync_all_now():
    """同步所有成员当前状态"""
    state_data = load_state()
    
    for member_id in MEMBERS:
        member_state = state_data.get(member_id, {})
        state = member_state.get("state", "idle")
        detail = member_state.get("detail", "")
        
        push_state(member_id, state, detail)
        time.sleep(0.3)

def main():
    import argparse
    parser = argparse.ArgumentParser(description="观复阁 Matrix Hook 服务")
    parser.add_argument("--init", action="store_true", help="初始化：确保所有成员加入")
    parser.add_argument("--sync", action="store_true", help="立即同步所有状态")
    args = parser.parse_args()
    
    if args.init:
        print("[I] Initializing...")
        ensure_all_joined()
        print("[I] Done.")
    elif args.sync:
        print("[I] Syncing all...")
        sync_all_now()
        print("[I] Done.")
    else:
        print("[I] Hook service ready.")
        print("[I] Import this module and call on_command() when Matrix command received.")
        print("[I] Usage: from hook_server import on_command; on_command('guanfu', 'status', 'busy working')")
        print("[I] New states: online, busy, away, offline (in addition to: idle, writing, researching, executing, syncing, error)")

if __name__ == "__main__":
    main()
