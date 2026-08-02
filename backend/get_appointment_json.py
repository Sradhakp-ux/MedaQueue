import os, json
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
django.setup()
from core.models import Appointment, AppointmentQueue
appt = Appointment.objects.get(id=15)
q = AppointmentQueue.objects.get(appointment=appt)
out = {
  'id': appt.id,
  'token': appt.token_number,
  'patient': appt.patient.patient_name,
  'doctor': appt.doctor.doctor_name,
  'department': appt.department.department_name,
  'date': str(appt.date),
  'time': str(appt.time),
  'priority': appt.priority,
  'estimated_wait': q.estimated_wait,
  'position': q.current_position,
  'remarks': appt.remarks
}
print(json.dumps(out))
