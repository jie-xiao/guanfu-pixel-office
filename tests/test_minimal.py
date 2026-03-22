#!/usr/bin/env python3
"""Minimal listener test"""
import sys
import os

# Set UTF-8 output FIRST
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

print("[I] Starting minimal test", flush=True)

import requests

HOMESERVER = "http://localhost:8008"
ROOM_ID = "!kDAGSXnsMB56zxLt:localhost"
TOKEN = "XfRUYFQparlYs3AEUdFjzOQrwQNxY6hOEsVHqlme58E"

try:
    print("[I] Joining room...", flush=True)
    r = requests.post(
        f"{HOMESERVER}/_matrix/client/r0/rooms/{ROOM_ID}/join",
        json={},
        params={"access_token": TOKEN},
        timeout=10
    )
    print(f"[I] Join: {r.status_code}", flush=True)
    
    print("[I] Starting sync...", flush=True)
    params = {"access_token": TOKEN, "timeout": 5000, "dir": "b"}
    r = requests.get(
        f"{HOMESERVER}/_matrix/client/r0/rooms/{ROOM_ID}/messages",
        params=params,
        timeout=35
    )
    print(f"[I] Sync: {r.status_code}", flush=True)
    data = r.json()
    chunk = data.get("chunk", [])
    print(f"[I] Got {len(chunk)} messages", flush=True)
    
    for msg in chunk:
        sender = msg.get("sender", "")
        body = msg.get("content", {}).get("body", "")[:60]
        print(f"  {sender}: {body}", flush=True)
    
    print("[I] Test complete!", flush=True)
    
except Exception as e:
    print(f"[E] Exception: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("[I] Exiting normally", flush=True)
