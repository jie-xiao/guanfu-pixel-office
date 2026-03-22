#!/usr/bin/env python3
import re

with open(r'E:\guanfu\Star-Office-UI\backend\app.py', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Search for Phase 3 features
keywords = ['dice', 'vote', 'buff', '串门', 'visit_notify', 'desk_upgrade', '工位', '升级']

for i, line in enumerate(content.split('\n')):
    low = line.lower()
    if any(kw in low for kw in keywords) or any(kw in line for kw in ['串门', '通知']):
        # Print surrounding context
        print(f'Line {i+1}: {line[:200]}')

print("\n\n=== Routes/Functions ===")
routes = re.findall(r'(@app\.(?:route|get|post)\([^)]+\))\s*\ndef\s+(\w+)', content)
for r, name in routes:
    print(f'{name}: {r}')
