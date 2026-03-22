#!/usr/bin/env python3
import re

with open('E:/guanfu/Star-Office-UI/test_ui.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the selector issue - the problematic line has backslash-escaped quotes
old_pattern = r'f"button:has-text\(\\\'\{floor\}\\\)\\\'"\''
new = r'f"button:has-text(\'{floor}\')"'

# Let's just replace the specific problematic string
bad = "f\"button:has-text(\\'
'\\')\""
good = "f\"button:has-text('{floor}')\","

if bad in content:
    content = content.replace(bad, good)
    print(f"Fixed: replaced {repr(bad)}")
else:
    print(f"Not found: {repr(bad)}")
    # Find the line with button:has-text
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'button:has-text' in line:
            print(f"Line {i+1}: {repr(line)}")

with open('E:/guanfu/Star-Office-UI/test_ui.py', 'w', encoding='utf-8') as f:
    f.write(content)
