from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_alter_appointment_status_and_more'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Queue',
            new_name='AppointmentQueue',
        ),
    ]
