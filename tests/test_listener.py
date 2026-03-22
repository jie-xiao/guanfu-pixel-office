import requests
print('Testing...', flush=True)

TOKEN = 'XfRUYFQparlYs3AEUdFjzOQrwQNxY6hOEsVHqlme58E'
ROOM_ID = '!kDAGSXnsMB56zxLt:localhost'
HOMESERVER = 'http://localhost:8008'

try:
    r = requests.post(f'{HOMESERVER}/_matrix/client/r0/rooms/{ROOM_ID}/join', 
        json={}, params={'access_token': TOKEN}, timeout=10)
    print(f'Join: {r.status_code}', flush=True)
    
    params = {'access_token': TOKEN, 'timeout': 1000, 'dir': 'b'}
    r = requests.get(f'{HOMESERVER}/_matrix/client/r0/rooms/{ROOM_ID}/messages', 
        params=params, timeout=30)
    print(f'Sync: {r.status_code}', flush=True)
    data = r.json()
    chunk = data.get('chunk', [])
    print(f'Chunk len: {len(chunk)}', flush=True)
    
    # Check recent messages
    for msg in chunk[:3]:
        body = msg.get('content', {}).get('body', '')
        sender = msg.get('sender', '')
        print(f'  {sender}: {body[:50]}', flush=True)
    
    print('All OK!', flush=True)
except Exception as e:
    print(f'Error: {e}', flush=True)
