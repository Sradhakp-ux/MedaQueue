from django.urls import path
from django.views.generic import RedirectView
from .views import (
    AppointmentCreateAPIView,
    InstantAppointmentAPIView,
    SymptomRecommendationAPIView,
    doctors_by_department,
    complete_patient,
    call_patient,
    skip_patient,
    CallNextPatientAPIView,
    SkipPatientAPIView,
    DoctorDashboardAPIView,
    PatientCreateAPIView,
    PatientRegistrationAPIView,
    PatientSearchAPIView,
    PatientHistoryAPIView,
    PatientDashboardAPIView,
    PatientNotificationsAPIView,
    PatientProfileAPIView,
    DoctorListAPIView,
    DoctorUsersAPIView,
    DoctorPairsAPIView,
    AdminOverviewAPIView,
    DepartmentListAPIView,
    QueueListAPIView,
)

urlpatterns = [
    path("", RedirectView.as_view(url="/api/doctors/", permanent=False)),
    path(
        "doctors/department/<int:department_id>/",
        doctors_by_department,
        name="doctors_by_department"
    ),

    path(
        "appointments/create/",
        AppointmentCreateAPIView.as_view(),
        name="create_appointment"
    ),
    path(
        "departments/",
        DepartmentListAPIView.as_view(),
        name="department-list"
    ),

    path(
        "doctors/",
        DoctorListAPIView.as_view(),
        name="doctor-list"
    ),
    path(
        "doctor-users/",
        DoctorUsersAPIView.as_view(),
        name="doctor-users"
    ),
    path(
        "doctor-pairs/",
        DoctorPairsAPIView.as_view(),
        name="doctor-pairs"
    ),

    path(
        "queue/<int:queue_id>/complete/",
        complete_patient,
        name="complete-patient"
    ),

    path(
        "queue/<int:queue_id>/call/",
        CallNextPatientAPIView.as_view(),
        name="call-patient"
    ),

    path(
        "queue/<int:queue_id>/skip/",
        SkipPatientAPIView.as_view(),
        name="skip-patient"
    ),

    path(
        "doctor/<int:doctor_id>/dashboard/",
        DoctorDashboardAPIView.as_view(),
        name="doctor-dashboard"
    ),

    path(
        "patients/create/",
        PatientCreateAPIView.as_view(),
        name="patient-create"
    ),
    path(
        "patients/register/",
        PatientRegistrationAPIView.as_view(),
        name="patient-register"
    ),

    path(
        "patients/search/",
        PatientSearchAPIView.as_view(),
        name="patient-search"
    ),

    path(
        "patients/<int:patient_id>/history/",
        PatientHistoryAPIView.as_view(),
        name="patient-history"
    ),
    path("admin/overview/", AdminOverviewAPIView.as_view(), name="admin-overview"),
    path("appointments/instant/", InstantAppointmentAPIView.as_view(), name="instant-appointment"),
    path("symptoms/recommend/", SymptomRecommendationAPIView.as_view(), name="symptom-recommendation"),
    path(
        "patient/dashboard/",
        PatientDashboardAPIView.as_view(),
        name="patient-dashboard",
    ),
    path("patient/notifications/", PatientNotificationsAPIView.as_view(), name="patient-notifications"),
    path("patient/profile/", PatientProfileAPIView.as_view(), name="patient-profile"),

    path(
        "queue/",
        QueueListAPIView.as_view(),
        name="queue-list"
    ),
]
