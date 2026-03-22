import re

with open(r'E:\guanfu\Star-Office-UI\frontend\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the switchFloor function
idx = content.find('function switchFloor(')
print(content[idx:idx+1500])
