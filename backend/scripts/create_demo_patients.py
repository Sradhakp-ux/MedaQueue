import os
import sys
from pathlib import Path

# ensure project root is on sys.path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from django.contrib.auth.models import User

usernames = ['patient1', 'patient2', 'patient3', 'patient4', 'patient5']
password = 'patient@123'

for u in usernames:
    if User.objects.filter(username=u).exists():
        print(f"exists {u}")
    else:
        User.objects.create_user(username=u, password=password)
        print(f"created {u}")

print('done')
