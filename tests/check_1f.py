import re

with open(r'E:\guanfu\Star-Office-UI\frontend\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the case '1F': in triggerFloorInteraction
idx = content.find("case '1F':")
if idx == -1:
    print("case '1F': NOT FOUND")
else:
    print("Found at:", idx)
    print(content[idx:idx+200])
