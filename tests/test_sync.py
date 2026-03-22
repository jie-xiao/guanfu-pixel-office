#!/usr/bin/env python3
"""Minimal test - just try to sync once"""
import requests
import time
import sys

HOMESERVER = "http://localhost:8008"
ROOM_ID = "!kDAGSXnsMB56zxLt:localhost"
TOKEN = "XfRUYFQparlYs3AEUdFjzOQrwQNxY6hOEsVHqlme58E"

print("[I] Starting test sync...", flush=True)

try:
    # Join room first
    print("[I] Joining room...", flush=True)
    r = requests.post(
        f"{HOMESERVER}/_matrix/client/r0/rooms/{ROOM_ID}/join",
        json={},
        params={"access_token": TOKEN},
        timeout=10
    )
    print(f"[I] Join status: {r.status_code}", flush=True)
    
    # Now try sync with short timeout
    print("[I] Starting sync...", flush=True)
    params = {"access_token": TOKEN, "timeout": 5000, "dir": "b"}
    r = requests.get(
        f"{HOMESERVER}/_matrix/client/r0/rooms/{ROOM_ID}/messages",
        params=params,
        timeout=35
    )
    print(f"[I] Sync status: {r.status_code}", flush=True)
    data = r.json()
    print(f"[I] Got {len(data.get('chunk', []))} messages", flush=True)
    
    for msg in data.get("chunk", []):
        body = msg.get("content", {}).get("body", "")[:50]
        sender = msg.get("sender", "")
        print(f"  {sender}: {body}", flush=True)
    
    print("[I] Test complete!", flush=True)
    
except Exception as e:
    print(f"[E] Error: {e}", flush=True)
    import traceback
    traceback.print_exc(file=sys.stdout)
    sys.exit(1)

print("[I] Exiting normally", flush=True)
