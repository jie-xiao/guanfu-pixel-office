#!/usr/bin/env python3
import urllib.request
import json

# Test Phase 3 features

# First check backend status
for port in [19000, 3009, 8080]:
    try:
        req = urllib.request.urlopen(f'http://127.0.0.1:{port}/health', timeout=2)
        data = json.loads(req.read())
        print(f'Backend found at port {port}: {data}')
    except Exception as e:
        print(f'Port {port}: {e}')
