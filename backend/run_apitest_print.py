import json
import urllib.request
import urllib.error

base = 'http://127.0.0.1:8000/api/'

def send(req):
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read().decode('utf-8')
            print('STATUS', r.status)
            print('BODY:\n', body)
            return {'status': r.status, 'body': body}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print('HTTP ERROR', e.code)
        print('BODY:\n', body)
        return {'status': e.code, 'body': body}
    except Exception as e:
        print('EXCEPTION', e)
        return {'status': 'EXCEPTION', 'body': str(e)}

req = urllib.request.Request(base + 'token/', data=json.dumps({'username': 'reception1', 'password': 'reception@123'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
print('Requesting token...')
res = send(req)
if res['status'] == 200:
    token = json.loads(res['body'])['access']
    headers = {'Authorization': f'Bearer {token}'}
    req = urllib.request.Request(base + 'patients/search/?search=sneha', headers=headers)
    print('\nSearching patient...')
    res2 = send(req)
    if res2['status'] == 200:
        data = json.loads(res2['body'])
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
    print('\nCreating appointment...')
    res3 = send(req)
else:
    print('Failed to get token', res)
