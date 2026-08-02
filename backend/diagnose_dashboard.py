import json
import urllib.request
import urllib.error

TOKEN_URL = 'http://127.0.0.1:8000/api/token/'
DASH_URL = 'http://127.0.0.1:8000/api/doctor/34/dashboard/'

creds = {'username': 'doctor1', 'password': 'doctor@123'}

req = urllib.request.Request(
    TOKEN_URL,
    data=json.dumps(creds).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode('utf-8'))
        access = body.get('access')
        print('TOKEN_OK')
        print('ACCESS_LEN', len(access) if access else 'None')
except urllib.error.HTTPError as exc:
    print('TOKEN_ERROR', exc.code)
    print(exc.read().decode('utf-8', errors='ignore'))
    raise SystemExit(1)

req2 = urllib.request.Request(DASH_URL)
req2.add_header('Authorization', 'Bearer ' + access)
try:
    with urllib.request.urlopen(req2) as resp:
        print('DASH_STATUS', resp.status)
        print(resp.read().decode('utf-8', errors='ignore'))
except urllib.error.HTTPError as exc:
    print('DASH_ERROR', exc.code)
    print(exc.read().decode('utf-8', errors='ignore'))
    raise
except Exception as exc:
    import traceback
    traceback.print_exc()
    raise
