import json
import urllib.request
import urllib.error

base='http://127.0.0.1:8000/api/'

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

req = urllib.request.Request(base+'token/', data=json.dumps({'username':'reception1','password':'reception@123'}).encode('utf-8'), headers={'Content-Type':'application/json'})
resp = send(req)
if not resp:
    raise SystemExit('token failed')
print('token', resp.get('access')[:80] if resp.get('access') else resp)

req = urllib.request.Request(base+'departments/')
send(req)
req = urllib.request.Request(base+'doctors/')
send(req)
req = urllib.request.Request(base+'patients/search/?search=sneha')
search = send(req)
if not search:
    raise SystemExit('search failed')
if isinstance(search, list) and len(search) > 0:
    patient_id = search[0]['id']
else:
    patient_id = 1
    print('using fallback patient id', patient_id)

post_data = json.dumps({'patient_id': patient_id, 'doctor_id': 1, 'department_id': 1, 'date': '2026-08-02', 'time': '10:00', 'priority': 'Normal', 'remarks': 'Test booking'}).encode('utf-8')
req = urllib.request.Request(base+'appointments/create/', data=post_data, headers={'Content-Type':'application/json', 'Authorization': f"Bearer {resp.get('access')}"})
send(req)
