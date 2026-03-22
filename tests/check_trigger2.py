import re

with open(r'E:\guanfu\Star-Office-UI\frontend\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the triggerFloorInteraction function
idx = content.find('function triggerFloorInteraction')
print(content[idx:idx+2000])
