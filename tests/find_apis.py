#!/usr/bin/env python3
import re

with open(r'E:\guanfu\Star-Office-UI\frontend\game.js', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Find all API endpoints referenced
endpoints = re.findall(r"['\"](/api/[^'\"]+)['\"]", content)
print('API endpoints in game.js:')
for e in sorted(set(endpoints)):
    print(' ', e)

print()
print('Checking for Phase 3 features...')
features = ['dice', 'vote', 'buff', 'guest', 'invite', 'visit', 'desk', 'upgrade']
for feat in features:
    if feat in content.lower():
        print(f'  {feat}: FOUND')
    else:
        print(f'  {feat}: not found')
