import urllib.request, urllib.error, json

data = json.dumps({'username': 'doctor1', 'password': 'doctor@123'}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/api/token/', data=data, headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req)
access = json.loads(resp.read().decode())['access']
print('TOKEN_OK')
req2 = urllib.request.Request('http://127.0.0.1:8000/api/doctor/34/dashboard/')
req2.add_header('Authorization', 'Bearer ' + access)
try:
    resp2 = urllib.request.urlopen(req2)
    print('STATUS', resp2.status)
    print(resp2.read().decode())
except urllib.error.HTTPError as e:
    print('ERROR', e.code)
    print(e.read().decode())
except Exception as ex:
    import traceback
    traceback.print_exc()
