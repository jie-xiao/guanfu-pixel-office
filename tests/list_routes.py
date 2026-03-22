#!/usr/bin/env python3
"""List all backend routes"""
import urllib.request
import json

BASE = 'http://127.0.0.1:19000'

# Try to get the index page which might list routes
try:
    req = urllib.request.urlopen(BASE + '/', timeout=5)
    content = req.read().decode('utf-8', errors='replace')
    print("Root page (first 2000 chars):")
    print(content[:2000])
except Exception as e:
    print(f"Error getting root: {e}")

print("\n\n=== Testing specific paths ===")

# Test common paths
paths = [
    '/health',
    '/agents',
    '/floor/current',
    '/floors',
    '/status',
    '/announcements',
    '/events',
    '/checkin/stats',
    '/api/guest/invite',
    '/api/guest/floor-access',
    '/api/visit/notify',
    '/api/breakroom/dice',
    '/api/breakroom/vote',
    '/static/desk-v2.png',
    '/static/desk.png',
]

for path in paths:
    try:
        req = urllib.request.urlopen(BASE + path, timeout=2)
        print(f"{path}: HTTP {req.status}")
    except urllib.error.HTTPError as e:
        print(f"{path}: HTTP {e.code} {e.reason}")
    except Exception as e:
        print(f"{path}: ERROR {e}")
