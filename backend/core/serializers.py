from rest_framework import serializers
from .models import AppointmentQueue


class QueueSerializer(serializers.ModelSerializer):

    patient = serializers.CharField(
        source="appointment.patient.patient_name",
        read_only=True
    )

    doctor = serializers.CharField(
        source="appointment.doctor.doctor_name",
        read_only=True
    )

    department = serializers.CharField(
        source="appointment.department.department_name",
        read_only=True
    )

    token = serializers.CharField(
        source="queue_number",
        read_only=True
    )

    class Meta:
        model = AppointmentQueue
        fields = [
            "id",
            "token",
            "patient",
            "doctor",
            "department",
            "current_position",
            "estimated_wait",
            "status",
        ]


class DoctorDashboardSerializer(serializers.Serializer):
    doctor = serializers.CharField()
    department = serializers.CharField()
    current_patient = serializers.DictField()
    waiting_patients = serializers.ListField()
    completed_today = serializers.IntegerField()
    waiting_count = serializers.IntegerField()
    skipped_count = serializers.IntegerField()
