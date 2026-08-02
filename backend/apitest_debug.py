import json
import urllib.request
import urllib.error

base = 'http://127.0.0.1:8000/api/'

def send(req):
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read().decode('utf-8')
            return {'status': r.status, 'body': body}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        return {'status': e.code, 'body': body}
    except Exception as e:
        return {'status': 'EXCEPTION', 'body': str(e)}

result = {}

req = urllib.request.Request(base + 'token/', data=json.dumps({'username': 'reception1', 'password': 'reception@123'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
result['token'] = send(req)
if result['token']['status'] == 200:
    token = json.loads(result['token']['body'])['access']
    headers = {'Authorization': f'Bearer {token}'}
    req = urllib.request.Request(base + 'patients/search/?search=sneha', headers=headers)
    result['search'] = send(req)
    if result['search']['status'] == 200:
        data = json.loads(result['search']['body'])
        patient_id = data[0]['id'] if isinstance(data, list) and data else 1
    else:
        patient_id = 1
    post_data = {
        'patient_id': patient_id,
        'doctor_id': 108,
        'department_id': 5,
        'date': '2026-08-02',
        'time': '10:00',
        'priority': 'Normal',
        'remarks': 'Test booking'
    }
    req = urllib.request.Request(base + 'appointments/create/', data=json.dumps(post_data).encode('utf-8'), headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
    result['appointment'] = send(req)

with open('apitest_result.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2)
