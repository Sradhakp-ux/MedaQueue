from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import Patient


class Command(BaseCommand):
    help = "Create patient1, patient2, ... accounts for all patient records."

    def handle(self, *args, **options):
        patient_group, _ = Group.objects.get_or_create(name="Patient")
        created = 0
        linked = 0

        with transaction.atomic():
            for index, patient in enumerate(Patient.objects.order_by("id"), start=1):
                username = f"patient{index}"
                user, was_created = User.objects.get_or_create(username=username)

                # Do not attach an account that is already assigned to someone else.
                if hasattr(user, "patient_profile") and user.patient_profile.pk != patient.pk:
                    self.stdout.write(self.style.WARNING(
                        f"Skipped {patient.patient_name}: {username} is already linked to another patient."
                    ))
                    continue

                user.set_password("patient123")
                user.first_name = patient.patient_name.split()[0]
                user.last_name = " ".join(patient.patient_name.split()[1:])
                user.save()
                user.groups.add(patient_group)

                if patient.user_id != user.id:
                    patient.user = user
                    patient.save(update_fields=["user"])
                    linked += 1
                if was_created:
                    created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Patient accounts ready: {created} created, {linked} linked. Password: patient123"
        ))
