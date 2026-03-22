#!/usr/bin/env python3
"""Check room messages without using since token"""
import requests
import time
import os

os.environ['PYTHONIOENCODING'] = 'utf-8'

HOMESERVER = "http://localhost:8008"
ROOM_ID = "!kDAGSXnsMB56zxLt:localhost"
TOKEN = "XfRUYFQparlYs3AEUdFjzOQrwQNxY6hOEsVHqlme58E"

print("Checking room messages...", flush=True)

# Get messages WITHOUT since token (fresh sync)
params = {'access_token': TOKEN, 'timeout': 5000, 'dir': 'b', 'limit': 20}
r = requests.get(
    f"{HOMESERVER}/_matrix/client/r0/rooms/{ROOM_ID}/messages",
    params=params,
    timeout=30
)
print(f"Status: {r.status_code}", flush=True)
data = r.json()

chunk = data.get('chunk', [])
print(f"Got {len(chunk)} messages", flush=True)
print(f"End token: {data.get('end', 'N/A')[:20]}...", flush=True)

for msg in chunk[-5:]:  # Last 5 messages
    sender = msg.get('sender', '')
    body = msg.get('content', {}).get('body', '')[:60]
    print(f"  {sender}: {body}", flush=True)
