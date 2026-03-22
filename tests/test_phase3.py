#!/usr/bin/env python3
"""Test Phase 3 features"""
import urllib.request
import json

BASE = 'http://127.0.0.1:19000'

def api_get(path):
    try:
        req = urllib.request.urlopen(BASE + path, timeout=5)
        return json.loads(req.read())
    except Exception as e:
        return {'error': str(e)}

def api_post(path, data):
    try:
        req = urllib.request.Request(BASE + path, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(req, timeout=5)
        return json.loads(resp.read())
    except Exception as e:
        return {'error': str(e)}

print("=== Phase 3 Feature Tests ===\n")

# 1. Guest Invite System
print("1. Guest Invite System")
print("-" * 40)
result = api_post('/api/guest/invite', {'adminKey': 'guanfu-admin-2026'})
print(f"Create invite: {json.dumps(result, indent=2, ensure_ascii=False)}")
invite_code = result.get('inviteCode', 'VIP_TEST123')

result = api_get('/api/guest/invites')
print(f"List invites: OK, count={len(result.get('invites', []))}")

result = api_post('/api/guest/validate', {'code': invite_code})
print(f"Validate invite: valid={result.get('valid')}, ok={result.get('ok')}")

result = api_post('/api/guest/join', {'name': '测试访客2', 'inviteCode': invite_code})
print(f"Guest join: ok={result.get('ok')}, agentId={result.get('agentId')}")

result = api_get('/api/guest/floor-access')
print(f"Floor access: ok={result.get('ok')}, floors={result.get('allowedFloors')}")

print()

# 2. Check agent status (for visit notification context)
print("2. Agent Status")
print("-" * 40)
result = api_get('/agents')
if isinstance(result, list):
    agents = result
elif isinstance(result, dict):
    agents = result.get('agents', result.get('data', []))
else:
    agents = []
print(f"Total agents: {len(agents)}")
for a in agents[:5]:
    name = a.get('name', 'unknown')
    state = a.get('state', 'unknown')
    is_guest = a.get('isGuest', False)
    area = a.get('area', 'unknown')
    print(f"  - {name}: {state} (guest={is_guest}, area={area})")

print()

# 3. Check status for buff info
print("3. Status endpoint (buff info)")
print("-" * 40)
result = api_get('/status')
if isinstance(result, dict):
    print(f"Status keys: {list(result.keys())}")
    if 'buffs' in result:
        print(f"Buffs: {result['buffs']}")
    if 'department' in result:
        print(f"Department: {result['department']}")
    # Print first 500 chars
    print(f"Status preview: {json.dumps(result, ensure_ascii=False)[:500]}")
else:
    print(f"Status: {str(result)[:200]}")

print()

# 4. Check floor info
print("4. Floor info")
print("-" * 40)
result = api_get('/floor/current')
print(f"Current floor: {result}")
result = api_get('/floors')
print(f"Floors: {result}")

print()

# 5. Check if !dice and !vote are handled (check listener/hook)
print("5. Command system check")
print("-" * 40)
# Check listener log for dice/vote
import os
log_file = r'E:\guanfu\Star-Office-UI\listener.log'
if os.path.exists(log_file):
    with open(log_file, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()
    dice_lines = [l for l in lines if 'dice' in l.lower()]
    vote_lines = [l for l in lines if 'vote' in l.lower()]
    print(f"Dice mentions in log: {len(dice_lines)}")
    print(f"Vote mentions in log: {len(vote_lines)}")
    if dice_lines:
        print(f"Last dice: {dice_lines[-1][:200]}")
    if vote_lines:
        print(f"Last vote: {vote_lines[-1][:200]}")

print("\n=== Phase 3 Test Complete ===")
print("Note: !dice and !vote are likely Discord bot commands - check Discord channel")
print("Note: Buff display and desk upgrade are frontend features - check browser")
