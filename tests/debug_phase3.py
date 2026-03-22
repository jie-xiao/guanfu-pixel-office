#!/usr/bin/env python3
"""Debug Phase 3 API issues"""
import urllib.request
import json

BASE = 'http://127.0.0.1:19000'

def api_get(path):
    try:
        req = urllib.request.urlopen(BASE + path, timeout=5)
        content = req.read()
        print(f"Status: {req.status}")
        print(f"Content-Type: {req.headers.get('Content-Type')}")
        print(f"Content (first 500 bytes): {content[:500]}")
        return json.loads(content)
    except Exception as e:
        print(f"Error: {e}")
        # Try to read anyway
        try:
            req = urllib.request.urlopen(BASE + path, timeout=5)
            content = req.read()
            print(f"Raw content: {content[:500]}")
        except:
            pass
        return None

def api_post(path, data):
    try:
        req = urllib.request.Request(BASE + path, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(req, timeout=5)
        content = resp.read()
        print(f"Status: {resp.status}")
        print(f"Content (first 500 bytes): {content[:500]}")
        return json.loads(content)
    except Exception as e:
        print(f"Error: {e}")
        try:
            req = urllib.request.Request(BASE + path, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
            resp = urllib.request.urlopen(req, timeout=5)
            content = resp.read()
            print(f"Raw content: {content[:500]}")
        except Exception as e2:
            print(f"Raw error: {e2}")
        return None

print("=== Debug Phase 3 APIs ===\n")

print("1. POST /api/visit/notify")
api_post('/api/visit/notify', {"visitorId": "test", "visitorName": "测试", "targetFloor": "2F"})
print()

print("2. GET /api/visit/notifications")
api_get('/api/visit/notifications?floor=2F')
print()

print("3. GET /api/visit/active")
api_get('/api/visit/active?floor=GF')
print()

print("4. POST /api/breakroom/dice")
api_post('/api/breakroom/dice', {"player": "测试", "bet": "测试"})
print()

print("5. GET /api/breakroom/dice/history")
api_get('/api/breakroom/dice/history')
print()

print("6. POST /api/breakroom/vote")
api_post('/api/breakroom/vote', {"question": "测试?", "options": ["A", "B"], "creator": "测试"})
print()

print("7. GET /static/desk-v2.png")
try:
    req = urllib.request.urlopen(BASE + '/static/desk-v2.png', timeout=5)
    print(f"Status: {req.status}, Content-Type: {req.headers.get('Content-Type')}")
except Exception as e:
    print(f"Error: {e}")
print()

print("8. GET /static/desk.png")
try:
    req = urllib.request.urlopen(BASE + '/static/desk.png', timeout=5)
    print(f"Status: {req.status}, Content-Type: {req.headers.get('Content-Type')}")
except Exception as e:
    print(f"Error: {e}")
