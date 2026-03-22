#!/usr/bin/env python3
import re

with open(r'E:\guanfu\Star-Office-UI\frontend\game.js', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Find fetch API calls
apis = re.findall(r"fetch\(['\"]([^'\"]+)['\"]", content)
print('Fetch APIs found:')
for a in sorted(set(apis)):
    print(' ', a)

print()
print('Phase 3 keywords:')
keywords = ['dice', 'vote', 'buff', 'guest', 'invite', 'visit', '串门', 'desk', 'upgrade', 'upgrad']
for i, line in enumerate(content.split('\n')):
    low = line.lower()
    if any(kw in low for kw in keywords) or any(kw in line for kw in keywords):
        print(f'{i+1}: {line[:200]}')
