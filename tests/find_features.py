#!/usr/bin/env python3
import re

# Check frontend game.js for Phase 3 features
with open(r'E:\guanfu\Star-Office-UI\frontend\game.js', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

lines = content.split('\n')

# Find dice, vote, buff related code
print("=== Dice/Vote/Buff references in game.js ===")
for i, line in enumerate(lines):
    low = line.lower()
    if any(k in low for k in ['dice', 'vote', 'buff', 'breakroom', 'workstation', 'desk']):
        # Print context
        start = max(0, i-2)
        end = min(len(lines), i+3)
        for j in range(start, end):
            marker = '>>>' if j == i else '   '
            print(f'{marker} {j+1}: {lines[j][:150]}')
        print('---')
        if i > 200:
            break
