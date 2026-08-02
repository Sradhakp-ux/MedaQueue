from django.db import IntegrityError, transaction, models
from datetime import datetime
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User


class Department(models.Model):
    department_name = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.department_name


class Doctor(models.Model):
    doctor_name = models.CharField(max_length=100)

    email = models.EmailField(unique=True)

    phone = models.CharField(max_length=15)

    specialization = models.CharField(max_length=100)

    qualification = models.CharField(max_length=150)

    experience = models.PositiveIntegerField()

    consultation_fee = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )

    room_number = models.CharField(max_length=20)

    available = models.BooleanField(default=True)

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="doctors"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.doctor_name


class Patient(models.Model):
    # A patient account is optional so existing reception-created records remain valid.
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        related_name="patient_profile",
        null=True,
        blank=True,
    )
    GENDER_CHOICES = [
        ("Male", "Male"),
        ("Female", "Female"),
        ("Other", "Other"),
    ]

    BLOOD_GROUP_CHOICES = [
        ("A+", "A+"),
        ("A-", "A-"),
        ("B+", "B+"),
        ("B-", "B-"),
        ("AB+", "AB+"),
        ("AB-", "AB-"),
        ("O+", "O+"),
        ("O-", "O-"),
    ]

    patient_id = models.CharField(
        max_length=10,
        unique=True,
        editable=False,
        null=True,
        blank=True
    )

    patient_name = models.CharField(
        max_length=100
    )

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES
    )

    age = models.PositiveIntegerField()

    dob = models.DateField()

    phone = models.CharField(
        max_length=15,
        unique=True
    )

    email = models.EmailField(
        blank=True,
        null=True
    )

    blood_group = models.CharField(
        max_length=5,
        choices=BLOOD_GROUP_CHOICES
    )

    address = models.TextField()

    emergency_contact = models.CharField(
        max_length=15
    )

    medical_history = models.TextField(
        blank=True
    )

    allergies = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def save(self, *args, **kwargs):
        if not self.patient_id:
            last_patient = Patient.objects.count() + 1
            self.patient_id = f"PT{last_patient:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient_id} - {self.patient_name}"


class Appointment(models.Model):

    STATUS_CHOICES = [
        ("Scheduled", "Scheduled"),
        ("Waiting", "Waiting"),
        ("Completed", "Completed"),
        ("Cancelled", "Cancelled"),
    ]

    PRIORITY_CHOICES = [
        ("Normal", "Normal"),
        ("Urgent", "Urgent"),
        ("Emergency", "Emergency"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    # Automatically filled from doctor
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE
    )

    date = models.DateField()

    time = models.TimeField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Scheduled"
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="Normal"
    )

    token_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False
    )

    remarks = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def save(self, *args, **kwargs):

        # Automatically assign department from doctor
        if self.doctor:
            self.department = self.doctor.department

        # Automatically generate token
        if not self.token_number:
            # ensure date is a date object (may be passed as ISO string from API)
            if isinstance(self.date, str):
                try:
                    self.date = datetime.strptime(self.date, "%Y-%m-%d").date()
                except Exception:
                    pass
            department_code = (
                self.department.department_name[:3]
                .upper()
            )
            department_code = f"{department_code}{self.department.id:03d}"
            date_code = self.date.strftime("%Y%m%d")
            token_prefix = f"{department_code}-{date_code}"

            attempt = 0
            while True:
                attempt += 1
                max_number = 0

                with transaction.atomic():
                    existing_tokens = Appointment.objects.filter(
                        token_number__startswith=f"{token_prefix}-"
                    ).values_list("token_number", flat=True)

                    for token in existing_tokens:
                        parts = token.rsplit("-", 1)
                        if len(parts) == 2 and parts[0] == token_prefix and parts[1].isdigit():
                            max_number = max(max_number, int(parts[1]))

                    self.token_number = f"{token_prefix}-{max_number + 1:03d}"

                    try:
                        super().save(*args, **kwargs)
                        break
                    except IntegrityError:
                        if attempt >= 5:
                            raise IntegrityError(
                                f"Could not generate unique token for department {department_code} on {self.date}."
                            )
                        continue
            return

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.token_number} - {self.patient.patient_name}"


class AppointmentQueue(models.Model):

    STATUS_CHOICES = [
        ("Waiting", "Waiting"),
        ("Called", "Called"),
        ("Completed", "Completed"),
        ("Skipped", "Skipped"),
    ]

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE
    )

    queue_number = models.CharField(
        max_length=20
    )

    current_position = models.IntegerField(
        default=0
    )

    estimated_wait = models.IntegerField(
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Waiting"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def calculate_wait_time(self):
        waiting_before = self.__class__.objects.filter(
            status="Waiting",
            created_at__lt=self.created_at
        ).count()

        consultation_time = 15

        priority_adjustment = {
            "Emergency": -10,
            "Urgent": -5,
            "Normal": 0,
        }

        adjustment = priority_adjustment.get(
            self.appointment.priority,
            0
        )

        wait_time = (
            waiting_before * consultation_time
        ) + adjustment

        if wait_time < 0:
            wait_time = 0

        return wait_time

    @classmethod
    def update_waiting_times(cls, doctor=None):
        if doctor is not None:
            waiting_queues = cls.objects.filter(
                status="Waiting",
                appointment__doctor=doctor
            ).order_by("created_at")
        else:
            waiting_queues = cls.objects.filter(
                status="Waiting"
            ).order_by("created_at")

        position = 1

        for queue in waiting_queues:
            queue.current_position = position
            queue.estimated_wait = queue.calculate_wait_time()
            queue.save(
                update_fields=[
                    "current_position",
                    "estimated_wait"
                ]
            )
            position += 1

    def update_positions(self):

        waiting_queues = self.__class__.objects.filter(
            status="Waiting"
        ).order_by(
            "created_at"
        )

        position = 1

        for queue in waiting_queues:

            queue.current_position = position

            queue.estimated_wait = (
                position - 1
            ) * 15

            queue.save()

            position += 1


    def __str__(self):
        return self.queue_number


@receiver(post_save, sender=Appointment)
def create_queue(sender, instance, created, **kwargs):

    if created:

        average_time = 15

        patients_ahead = AppointmentQueue.objects.filter(
            appointment__doctor=instance.doctor,
            status="Waiting"
        ).count()

        priority_adjustment = {
            "Normal": 0,
            "Urgent": -10,
            "Emergency": -30,
        }

        wait_time = (
            patients_ahead * average_time
            + priority_adjustment[instance.priority]
        )

        if wait_time < 0:
            wait_time = 0

        AppointmentQueue.objects.create(
            appointment=instance,
            queue_number=instance.token_number,
            current_position=patients_ahead + 1,
            estimated_wait=wait_time,
            status="Waiting"
        )
