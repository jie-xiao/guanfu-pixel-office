#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import os
import io

# Fix stdout encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'matrix-commands'))

from m1_commands import cmd_dice, cmd_vote, cmd_help

print('Import OK')

# Test dice
result = cmd_dice('guanfu', 'test bet')
print('dice result type:', type(result))
print('dice result length:', len(result))

# Test vote
result = cmd_vote('guanfu', 'what to eat?', ['hotpot', 'bbq', 'sushi'])
print('vote result type:', type(result))
print('vote result length:', len(result))

# Test help includes dice and vote
help_text = cmd_help()
print('help includes dice:', 'dice' in help_text.lower())
print('help includes vote:', 'vote' in help_text.lower())

print('All tests passed!')
