from django.shortcuts import get_object_or_404
from .utils import recalculate_queue
from rest_framework import generics
from .models import AppointmentQueue
from .serializers import QueueSerializer


class QueueListAPIView(generics.ListAPIView):
    serializer_class = QueueSerializer

    def get_queryset(self):
        return AppointmentQueue.objects.select_related(
            "appointment",
            "appointment__patient",
            "appointment__doctor",
            "appointment__department"
        ).order_by("current_position")
