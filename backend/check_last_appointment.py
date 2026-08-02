import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
django.setup()
from core.models import Appointment
print(Appointment.objects.order_by('-id').values_list('id','token_number','patient_id','doctor_id').first())
