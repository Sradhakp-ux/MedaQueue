import json, urllib.request, urllib.error
base = 'http://127.0.0.1:8000/api/'

def send(req):
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read().decode('utf-8')
            print('OK', r.status, body)
            return json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print('ERROR', e.code, body)
        return None
    except Exception as e:
        print('EXCEPTION', e)
        return None

# fetch token
req = urllib.request.Request(base + 'token/', data=json.dumps({'username':'reception1','password':'reception@123'}).encode('utf-8'), headers={'Content-Type':'application/json'})
print('TOKEN REQUEST')
tok = send(req)
if not tok:
    raise SystemExit('token failed')
print('ACCESS', tok.get('access')[:80])

# search patient by phone or name
req = urllib.request.Request(base + 'patients/search/?search=sneha', headers={'Authorization': f"Bearer {tok['access']}"})
print('PATIENT SEARCH')
search = send(req)
print('SEARCH TYPE', type(search), 'RESULTS', search)

# create appointment
post_data = {
    'patient_id': search[0]['id'] if search and isinstance(search, list) and len(search) > 0 else 1,
    'doctor_id': 108,
    'department_id': 5,
    'date': '2026-08-02',
    'time': '10:00',
    'priority': 'Normal',
    'remarks': 'Test booking'
}
print('APPOINTMENT BODY', json.dumps(post_data))
req = urllib.request.Request(base + 'appointments/create/', data=json.dumps(post_data).encode('utf-8'), headers={'Content-Type':'application/json', 'Authorization': f"Bearer {tok['access']}"})
print('APPOINTMENT CREATE')
send(req)
