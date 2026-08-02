from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_doctor_demo_accounts(apps, schema_editor):
    User = apps.get_model("auth", "User")
    Group = apps.get_model("auth", "Group")
    doctor_group, _ = Group.objects.get_or_create(name="Doctor")
    password_hash = make_password("doctor@123")
    for number in range(1, 51):
        user, _ = User.objects.get_or_create(username=f"doctor{number}")
        user.password = password_hash
        user.save(update_fields=["password"])
        user.groups.add(doctor_group)


class Migration(migrations.Migration):
    dependencies = [("core", "0009_create_dashboard_demo_users")]
    operations = [migrations.RunPython(create_doctor_demo_accounts, migrations.RunPython.noop)]
