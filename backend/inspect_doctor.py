import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from core.models import Doctor, Department
print('Doctor 108:', list(Doctor.objects.filter(id=108).values()))
print('Department 5:', list(Department.objects.filter(id=5).values()))
