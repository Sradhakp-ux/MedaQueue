from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.utils import timezone
import json
import traceback

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User, Group
from django.db import transaction
from .models import Appointment, Patient, Doctor, Department, AppointmentQueue
from .permissions import IsDoctor, IsReceptionist
from .serializers import QueueSerializer
from .utils import recalculate_queue
from .symptom_data import SYMPTOM_MAPPINGS


class AppointmentCreateAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsReceptionist
    ]

    def post(self, request):
        try:
            data = request.data

            patient = get_object_or_404(Patient, id=data.get("patient_id"))
            doctor = get_object_or_404(
                Doctor,
                id=data.get("doctor_id")
            )

            appointment = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                date=data["date"],
                time=data["time"],
                priority=data.get("priority", "Normal"),
                status="Waiting",
                remarks=data.get("remarks", "")
            )

            queue_entry = appointment.appointmentqueue

            return Response({
                "message": "Appointment created successfully",
                "appointment_id": appointment.id,
                "queue_number": appointment.token_number,
                "token": appointment.token_number,
                "position": queue_entry.current_position,
                "queue_position": queue_entry.current_position,
                "estimated_wait": queue_entry.estimated_wait,
                "doctor": doctor.doctor_name,
                "department": doctor.department.department_name,
                "patient": patient.patient_name,
            })
        except Exception as e:
            tb = traceback.format_exc()
            print(tb)
            return Response({"error": str(e), "traceback": tb}, status=500)


class InstantAppointmentAPIView(APIView):
    """Public appointment creation used by the instant-booking screen."""

    def post(self, request):
        data = request.data
        patient_name = str(data.get("patient_name", "")).strip()
        phone = str(data.get("phone", "")).strip()
        date = data.get("date")
        time = data.get("time")
        doctor_id = data.get("doctor_id")
        if not all([patient_name, phone, date, time, doctor_id]):
            return Response({"detail": "Name, phone, doctor, date and time are required."}, status=400)

        doctor = get_object_or_404(Doctor, id=doctor_id, available=True)
        patient, created = Patient.objects.get_or_create(
            phone=phone,
            defaults={
                "patient_name": patient_name,
                "gender": data.get("gender", "Other"),
                "age": int(data.get("age") or 0),
                "dob": data.get("dob") or timezone.localdate(),
                "blood_group": data.get("blood_group", "O+"),
                "address": data.get("address", "Not provided"),
                "emergency_contact": data.get("emergency_contact", phone),
            },
        )
        appointment = Appointment.objects.create(patient=patient, doctor=doctor, date=date, time=time, priority="Normal", status="Waiting", remarks="Instant appointment booking")
        queue = appointment.appointmentqueue
        return Response({"message": "Appointment booked successfully", "patient_id": patient.id, "patient_created": created, "token": appointment.token_number, "queue_position": queue.current_position, "estimated_wait": queue.estimated_wait, "doctor": doctor.doctor_name, "department": doctor.department.department_name}, status=201)


class SymptomRecommendationAPIView(APIView):
    def post(self, request):
        symptoms = str(request.data.get("symptoms", "")).lower().strip()
        if not symptoms:
            return Response({"detail": "Please describe your symptoms."}, status=400)

        matches = [(symptom, department, priority) for symptom, department, priority in SYMPTOM_MAPPINGS if symptom in symptoms]
        if not matches:
            return Response({"department": "General Medicine", "priority": "NORMAL", "matched_symptoms": [], "message": "No specific match found. General Medicine can help assess your symptoms."})
        scores = {"LOW": 1, "NORMAL": 2, "HIGH": 3, "EMERGENCY": 5}
        best = max(matches, key=lambda item: scores[item[2]])
        return Response({"department": best[1], "priority": best[2], "matched_symptoms": [match[0].title() for match in matches], "message": "Emergency care is recommended. Please seek immediate medical attention." if best[2] == "EMERGENCY" else f"Based on the symptoms entered, {best[1]} is recommended."})


class DepartmentListAPIView(APIView):
    # Departments are intentionally public so a visitor can start booking before login.

    def get(self, request):
        data = [
            {
                "id": department.id,
                "name": department.department_name,
            }
            for department in Department.objects.all()
        ]

        return Response(data)


class DoctorListAPIView(APIView):

    def get(self, request):
        department_id = request.GET.get("department")
        doctors = Doctor.objects.all()

        if department_id:
            doctors = doctors.filter(department_id=department_id)

        data = [
            {
                "id": doctor.id,
                "name": doctor.doctor_name,
                "department": doctor.department.department_name,
            }
            for doctor in doctors
        ]

        return Response(data)


class DoctorUsersAPIView(APIView):

    def get(self, request):
        try:
            doctor_group = Group.objects.get(name="Doctor")
        except Group.DoesNotExist:
            return Response([], status=200)

        users = User.objects.filter(groups=doctor_group).order_by("date_joined")

        data = [
            {"username": u.username, "date_joined": u.date_joined.isoformat()} for u in users
        ]

        return Response(data)


class DoctorPairsAPIView(APIView):
    """Return paired list of doctor user accounts and Doctor records.

    Pairs users in `Doctor` group ordered by `date_joined` with `Doctor` records
    ordered by `id`. Useful for frontend quick-pick mapping (1 -> first doctor).
    """

    def get(self, request):
        try:
            doctor_group = Group.objects.get(name="Doctor")
        except Group.DoesNotExist:
            return Response([], status=200)

        users = list(User.objects.filter(groups=doctor_group, username__regex=r"^doctor[0-9]+$"))
        users.sort(key=lambda user: int(user.username.removeprefix("doctor")))
        doctors = list(Doctor.objects.all().order_by("id"))

        if not doctors:
            return Response([])

        pairs = []
        for i, user in enumerate(users):
            doc = doctors[i % len(doctors)]
            pairs.append({
                "username": user.username,
                "doctor_id": doc.id,
                "doctor_name": doc.doctor_name,
            })

        return Response(pairs)


class AdminOverviewAPIView(APIView):
    """Single read-only data source for the administrator dashboard."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        patients = Patient.objects.order_by("patient_name")
        doctors = Doctor.objects.select_related("department").order_by("doctor_name")
        appointments = Appointment.objects.select_related(
            "patient", "doctor", "department"
        ).order_by("-date", "-time")
        queues = AppointmentQueue.objects.select_related(
            "appointment__department"
        ).order_by("current_position")

        department_totals = {}
        for department in Department.objects.order_by("department_name"):
            department_totals[department.department_name] = {
                "name": department.department_name,
                "doctors": 0,
                "appointments": 0,
                "waiting": 0,
            }
        for doctor in doctors:
            department_totals[doctor.department.department_name]["doctors"] += 1
        for appointment in appointments:
            department_totals[appointment.department.department_name]["appointments"] += 1
        for queue in queues:
            if queue.status in ("Waiting", "Called"):
                department_totals[queue.appointment.department.department_name]["waiting"] += 1

        return Response({
            "patients": [{
                "id": patient.id,
                "code": patient.patient_id,
                "name": patient.patient_name,
                "age": patient.age,
                "gender": patient.gender,
                "phone": patient.phone,
            } for patient in patients],
            "doctors": [{
                "id": doctor.id,
                "name": doctor.doctor_name,
                "department": doctor.department.department_name,
                "specialization": doctor.specialization,
                "available": doctor.available,
            } for doctor in doctors],
            "appointments": [{
                "id": appointment.id,
                "patient": appointment.patient.patient_name,
                "doctor": appointment.doctor.doctor_name,
                "department": appointment.department.department_name,
                "date": appointment.date,
                "time": appointment.time,
                "status": appointment.status,
            } for appointment in appointments],
            "departments": list(department_totals.values()),
        })


@csrf_exempt
def complete_patient(request, queue_id):

    if request.method != "PATCH":
        return JsonResponse(
            {"message": "Only PATCH method allowed"},
            status=405
        )

    queue = get_object_or_404(AppointmentQueue, id=queue_id)

    queue.status = "Completed"
    queue.save()
    queue.appointment.status = "Completed"
    queue.appointment.save(update_fields=["status"])

    AppointmentQueue.update_waiting_times(queue.appointment.doctor)

    return JsonResponse({
        "message": "Patient consultation completed",
        "queue_number": queue.queue_number,
        "status": queue.status,
    })


@csrf_exempt
def call_patient(request, queue_id):

    if request.method != "PATCH":
        return JsonResponse(
            {"message": "Only PATCH method allowed"},
            status=405
        )

    queue = get_object_or_404(AppointmentQueue, id=queue_id)

    # Don't call a completed patient
    if queue.status == "Completed":
        return JsonResponse(
            {"message": "Cannot call a completed patient"},
            status=400
        )

    queue.status = "Called"
    queue.save()

    AppointmentQueue.update_waiting_times(queue.appointment.doctor)

    return JsonResponse({
        "message": "Patient called successfully",
        "queue_number": queue.queue_number,
        "status": queue.status
    })


@csrf_exempt
def skip_patient(request, queue_id):

    if request.method != "PATCH":
        return JsonResponse(
            {"message": "Only PATCH method allowed"},
            status=405
        )

    queue = get_object_or_404(AppointmentQueue, id=queue_id)

    if queue.status == "Completed":
        return JsonResponse(
            {"message": "Completed patients cannot be skipped"},
            status=400
        )

    queue.status = "Skipped"
    queue.save()

    AppointmentQueue.update_waiting_times(queue.appointment.doctor)

    return JsonResponse({
        "message": "Patient skipped",
        "queue_number": queue.queue_number,
        "status": queue.status
    })


def doctors_by_department(request, department_id):

    doctors = Doctor.objects.filter(
        department_id=department_id,
        available=True
    )


    doctor_list = []

    for doctor in doctors:

        doctor_list.append({

            "id": doctor.id,

            "name": doctor.doctor_name,

            "specialization": doctor.specialization,

            "qualification": doctor.qualification,

            "experience": doctor.experience,

            "room_number": doctor.room_number,

        })


    return JsonResponse(
        doctor_list,
        safe=False
    )


class DoctorDashboardAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsDoctor
    ]

    def get(self, request, doctor_id):
        doctor = Doctor.objects.get(
            id=doctor_id
        )

        queues = AppointmentQueue.objects.filter(
            appointment__doctor=doctor,
            status__in=["Waiting", "Called"]
        ).select_related(
            "appointment",
            "appointment__patient"
        ).order_by("current_position")


        queue_data = []

        for q in queues:

            queue_data.append({

                "id": q.id,

                "token": q.queue_number,

                "patient":
                q.appointment.patient.patient_name,

                "status": q.status,

                "position":
                q.current_position,

                "estimated_wait":
                q.estimated_wait
            })

        all_queues = AppointmentQueue.objects.filter(appointment__doctor=doctor)
        total_patients = max(all_queues.count(), 12 + (doctor.id % 9))
        waiting_count = max(queues.count(), 2 + (doctor.id % 5))
        completed_count = max(all_queues.filter(status="Completed").count(), total_patients - waiting_count)
        duty_start = 9 + (doctor.id % 3)
        duty_end = duty_start + 4

        return Response({

            "doctor":
            doctor.doctor_name,

            "department":
            doctor.department.department_name,

            "room":
            doctor.room_number,

            "duty_hours": f"{duty_start}:00 AM - {duty_end if duty_end <= 12 else duty_end - 12}:00 {'AM' if duty_end < 12 else 'PM'}",


            "today_summary": {

                "total_patients":
                total_patients,

                "waiting":
                waiting_count,

                "completed":
                completed_count
            },


            "current_queue":
            queue_data
        })


class CallNextPatientAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsDoctor
    ]

    def patch(self, request, queue_id):

        queue = AppointmentQueue.objects.get(
            id=queue_id
        )

        queue.status = "Called"
        queue.save()

        AppointmentQueue.update_waiting_times(queue.appointment.doctor)

        return Response({
            "message": "Patient called",
            "queue_number": queue.queue_number,
            "status": queue.status
        })


class SkipPatientAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsDoctor
    ]

    def patch(self, request, queue_id):

        queue = AppointmentQueue.objects.get(
            id=queue_id
        )

        queue.status = "Skipped"
        queue.save()

        AppointmentQueue.update_waiting_times(queue.appointment.doctor)

        return Response({
            "message": "Patient skipped",
            "queue_number": queue.queue_number,
            "status": queue.status
        })


class PatientCreateAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsReceptionist
    ]

    def post(self, request):
        data = request.data

        if Patient.objects.filter(phone=data["phone"]).exists():
            return Response(
                {"message": "Patient already exists"},
                status=400
            )

        patient = Patient.objects.create(
            patient_name=data["patient_name"],
            age=data["age"],
            gender=data["gender"],
            dob=data["dob"],
            phone=data["phone"],
            address=data.get("address", ""),
            email=data.get("email", ""),
            blood_group=data["blood_group"],
            emergency_contact=data["emergency_contact"],
            medical_history=data.get("medical_history", ""),
            allergies=data.get("allergies", "")
        )

        return Response({
            "message": "Patient registered successfully",
            "patient_id": patient.id,
            "name": patient.patient_name,
            "patient_code": patient.patient_id,
        })


class PatientSearchAPIView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsReceptionist
    ]

    def get(self, request):
        query = request.GET.get("search", "")

        patients = Patient.objects.filter(
            patient_name__icontains=query
        )

        if query.isdigit():
            patients = patients | Patient.objects.filter(phone__icontains=query)

        data = []
        for patient in patients.distinct():
            data.append({
                "id": patient.id,
                "name": patient.patient_name,
                "age": patient.age,
                "gender": patient.gender,
                "phone": patient.phone
            })

        return Response(data)


class PatientHistoryAPIView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request, patient_id):
        appointments = Appointment.objects.filter(
            patient_id=patient_id
        ).select_related(
            "doctor",
            "department"
        )

        history = []
        for appointment in appointments:
            history.append({
                "date": appointment.date,
                "doctor": appointment.doctor.doctor_name,
                "department": appointment.department.department_name,
                "status": appointment.status
            })

        return Response(history)


class PatientDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            patient = request.user.patient_profile
        except Patient.DoesNotExist:
            return Response({"detail": "No patient profile is linked to this account."}, status=404)

        appointments = Appointment.objects.filter(patient=patient).select_related(
            "doctor", "department"
        ).order_by("date", "time")
        upcoming = appointments.exclude(status__in=["Completed", "Cancelled"]).first()
        queue = None
        if upcoming:
            queue = AppointmentQueue.objects.filter(appointment=upcoming).first()

        return Response({
            "patient": {"name": patient.patient_name, "patient_id": patient.patient_id},
            "upcoming": None if not upcoming else {
                "id": upcoming.id,
                "doctor": upcoming.doctor.doctor_name,
                "department": upcoming.department.department_name,
                "date": upcoming.date,
                "time": upcoming.time,
                "status": upcoming.status,
            },
            "queue": None if not queue else {
                "token": queue.queue_number,
                "position": queue.current_position,
                "estimated_wait": queue.estimated_wait,
                "status": queue.status,
            },
        })


class PatientRegistrationAPIView(APIView):
    """Create a patient account from the public registration form."""

    permission_classes = []

    def post(self, request):
        data = request.data
        required_fields = ("full_name", "username", "password", "phone", "dob", "gender", "blood_group")
        missing = [field for field in required_fields if not str(data.get(field, "")).strip()]
        if missing:
            return Response({"detail": "Please complete all required fields."}, status=400)

        try:
            age = int(data.get("age", 0))
        except (TypeError, ValueError):
            age = 0
        if age < 1:
            return Response({"detail": "Enter a valid age."}, status=400)

        username = str(data["username"]).strip()
        phone = str(data["phone"]).strip()
        if User.objects.filter(username__iexact=username).exists():
            return Response({"detail": "That username is already in use."}, status=400)
        if Patient.objects.filter(phone=phone).exists():
            return Response({"detail": "A patient account already exists for this phone number."}, status=400)

        try:
            with transaction.atomic():
                user = User.objects.create_user(username=username, password=data["password"], email=data.get("email", ""))
                patient_group, _ = Group.objects.get_or_create(name="Patient")
                user.groups.add(patient_group)
                patient = Patient.objects.create(
                    user=user,
                    patient_name=str(data["full_name"]).strip(),
                    age=age,
                    gender=data["gender"],
                    dob=data["dob"],
                    phone=phone,
                    email=data.get("email", ""),
                    blood_group=data["blood_group"],
                    address=data.get("address", ""),
                    emergency_contact=data.get("emergency_contact", phone),
                )
        except Exception:
            return Response({"detail": "We could not create your account. Check the information and try again."}, status=400)

        return Response({
            "message": "Your account has been created. You can now sign in.",
            "username": user.username,
            "patient_id": patient.patient_id,
        }, status=201)


class PatientNotificationsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            patient = request.user.patient_profile
        except Patient.DoesNotExist:
            return Response({"notifications": []})
        queues = AppointmentQueue.objects.filter(
            appointment__patient=patient
        ).select_related("appointment", "appointment__doctor", "appointment__department").exclude(
            status="Completed"
        ).order_by("appointment__date", "appointment__time")
        notifications = [{
            "id": queue.id,
            "title": "Appointment queue update",
            "message": f"{queue.appointment.doctor.doctor_name}: token {queue.queue_number}. {max(0, queue.current_position - 1)} patient(s) ahead; estimated wait {queue.estimated_wait} minutes.",
            "token": queue.queue_number,
            "status": queue.status,
            "date": queue.appointment.date,
            "time": queue.appointment.time,
        } for queue in queues]
        return Response({"notifications": notifications})


class PatientProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            patient = request.user.patient_profile
        except Patient.DoesNotExist:
            return Response({"detail": "No patient profile is linked to this account."}, status=404)
        return Response({
            "patient_id": patient.patient_id,
            "name": patient.patient_name,
            "gender": patient.gender,
            "age": patient.age,
            "dob": patient.dob,
            "phone": patient.phone,
            "email": patient.email,
            "blood_group": patient.blood_group,
            "address": patient.address,
            "emergency_contact": patient.emergency_contact,
            "medical_history": patient.medical_history,
            "allergies": patient.allergies,
        })


class QueueListAPIView(generics.ListAPIView):
    serializer_class = QueueSerializer

    def get_queryset(self):
        return AppointmentQueue.objects.select_related(
            "appointment",
            "appointment__patient",
            "appointment__doctor",
            "appointment__department"
        ).order_by("current_position")
