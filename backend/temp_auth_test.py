import json, urllib.request, urllib.error
base = 'http://127.0.0.1:8000/api/'

def send(req):
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read().decode()
            print('OK', r.status, body)
            return json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print('ERROR', e.code, body)
        return None

req = urllib.request.Request(base + 'token/', data=json.dumps({'username':'reception1','password':'reception@123'}).encode('utf-8'), headers={'Content-Type':'application/json'})
resp = send(req)
if not resp:
    raise SystemExit('token failed')
token = resp['access']
print('TOKEN OK', token[:60])

for path in ['departments/', 'doctors/', 'patients/search/?search=sneha']:
    print('\nREQUEST', path)
    req = urllib.request.Request(base + path, headers={'Authorization': f'Bearer {token}'})
    send(req)

print('\nAPPOINTMENT')
post_data = json.dumps({'patient_id': 1, 'doctor_id': 1, 'department_id': 1, 'date': '2026-08-02', 'time': '10:00', 'priority': 'Normal', 'remarks': 'Test booking'}).encode('utf-8')
req = urllib.request.Request(base + 'appointments/create/', data=post_data, headers={'Content-Type':'application/json', 'Authorization': f'Bearer {token}'})
send(req)
