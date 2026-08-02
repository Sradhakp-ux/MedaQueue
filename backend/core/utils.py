from .models import AppointmentQueue


def recalculate_queue(doctor):
    """
    Recalculate queue positions and waiting time
    for all waiting patients of a doctor.
    """

    waiting_queues = AppointmentQueue.objects.filter(
        appointment__doctor=doctor,
        status="Waiting"
    ).order_by("created_at")

    average_consultation_time = 15

    for index, queue in enumerate(waiting_queues, start=1):
        queue.current_position = index
        queue.estimated_wait = (index - 1) * average_consultation_time
        queue.save()
