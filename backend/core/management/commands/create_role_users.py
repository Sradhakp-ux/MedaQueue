from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from django.core.management import call_command
from django.contrib.auth.hashers import make_password

from core.models import Doctor


class Command(BaseCommand):

    help = "Create or reset all demo dashboard accounts in the backend."

    def handle(self, *args, **kwargs):

        doctor_group, _ = Group.objects.get_or_create(name="Doctor")
        reception_group, _ = Group.objects.get_or_create(name="Receptionist")
        administrator_group, _ = Group.objects.get_or_create(name="Administrator")

        created = []

        # One hash is enough for the shared demo password; this creates every
        # requested login without making setup slow.
        password_hash = make_password("doctor@123")
        doctors = list(Doctor.objects.order_by("id"))
        for index in range(1, 51):
            username = f"doctor{index}"
            user, _ = User.objects.get_or_create(username=username)
            user.password = password_hash
            user.save(update_fields=["password"])

            user.groups.add(doctor_group)
            doctor_name = doctors[(index - 1) % len(doctors)].doctor_name if doctors else "Demo Doctor"
            created.append((username, "doctor@123", doctor_name))
            self.stdout.write(self.style.SUCCESS(f"{username} ready for '{doctor_name}'"))

        # Ensure the non-doctor dashboards have real backend accounts too.
        recv_user, recv_created = User.objects.get_or_create(username="reception1")
        recv_user.set_password("reception@123")
        recv_user.save()
        recv_user.groups.add(reception_group)
        self.stdout.write(self.style.SUCCESS("reception1 created and added to Receptionist"))

        admin_user, _ = User.objects.get_or_create(username="administrator")
        admin_user.set_password("administrator@123")
        admin_user.is_staff = True
        admin_user.save()
        admin_user.groups.add(administrator_group)
        self.stdout.write(self.style.SUCCESS("administrator created and added to Administrator"))

        # Patient records have a one-to-one backend user mapping, so use the
        # dedicated command to create/link every patient dashboard account.
        call_command("create_patient_users", stdout=self.stdout)

        # summary
        self.stdout.write(self.style.SUCCESS("\nCreated demo users (username / password / linked doctor name):"))
        for u, p, docname in created:
            self.stdout.write(self.style.SUCCESS(f"{u} / {p}  -> {docname}"))
