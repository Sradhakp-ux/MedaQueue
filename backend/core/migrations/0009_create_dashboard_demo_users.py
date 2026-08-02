from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_dashboard_demo_users(apps, schema_editor):
    User = apps.get_model("auth", "User")
    Group = apps.get_model("auth", "Group")
    Doctor = apps.get_model("core", "Doctor")
    Patient = apps.get_model("core", "Patient")

    groups = {
        name: Group.objects.get_or_create(name=name)[0]
        for name in ("Administrator", "Doctor", "Receptionist", "Patient")
    }

    for index, doctor in enumerate(Doctor.objects.order_by("id"), start=1):
        user, _ = User.objects.get_or_create(username=f"doctor{index}")
        user.password = make_password("doctor@123")
        user.save(update_fields=["password"])
        user.groups.add(groups["Doctor"])

    receptionist, _ = User.objects.get_or_create(username="reception1")
    receptionist.password = make_password("reception@123")
    receptionist.save(update_fields=["password"])
    receptionist.groups.add(groups["Receptionist"])

    administrator, _ = User.objects.get_or_create(username="administrator")
    administrator.password = make_password("administrator@123")
    administrator.is_staff = True
    administrator.save(update_fields=["password", "is_staff"])
    administrator.groups.add(groups["Administrator"])

    for index, patient in enumerate(Patient.objects.order_by("id"), start=1):
        user, _ = User.objects.get_or_create(username=f"patient{index}")
        user.password = make_password("patient123")
        user.save(update_fields=["password"])
        user.groups.add(groups["Patient"])
        if patient.user_id != user.id:
            patient.user_id = user.id
            patient.save(update_fields=["user"])


class Migration(migrations.Migration):
    dependencies = [("core", "0008_patient_user")]

    operations = [migrations.RunPython(create_dashboard_demo_users, migrations.RunPython.noop)]
