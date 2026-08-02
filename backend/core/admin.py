from django.contrib import admin
from .models import (
    Department,
    Doctor,
    Patient,
    Appointment,
    AppointmentQueue,
)

admin.site.register(Department)
admin.site.register(Doctor)
admin.site.register(Patient)
admin.site.register(Appointment)


@admin.register(AppointmentQueue)
class AppointmentQueueAdmin(admin.ModelAdmin):

    list_display = (
        "queue_number",
        "appointment",
        "current_position",
        "estimated_wait",
        "status",
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "queue_number",
        "appointment__patient__patient_name",
    )
