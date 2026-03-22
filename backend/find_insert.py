import re

with open(r'E:\guanfu\Star-Office-UI\backend\app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the POST /members/status endpoint
idx = content.find('methods=["POST"]', content.find('/members/status'))
print(f'POST /members/status at: {idx}')
fn_idx = content.rfind('\ndef ', 0, idx)
print(f'Function at: {fn_idx}')
print(content[fn_idx:fn_idx+50])

# Find where this function ends
# Look for the next @app.route after this POST
next_route = content.find('\n@app.route', idx+1)
print(f'Next route at: {next_route}')
# Find end of this function
fn_end = content.rfind('\n    return', 0, next_route)
print(f'Function end around: {fn_end}')
print('--- last 100 chars before next route ---')
print(repr(content[fn_end:fn_end+100]))
