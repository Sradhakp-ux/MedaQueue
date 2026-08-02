from django.db import models


class Patient(models.Model):

    GENDER_CHOICES = [
        ('Male','Male'),
        ('Female','Female'),
        ('Other','Other'),
    ]

    BLOOD_GROUPS = [
        ('A+','A+'),
        ('A-','A-'),
        ('B+','B+'),
        ('B-','B-'),
        ('AB+','AB+'),
        ('AB-','AB-'),
        ('O+','O+'),
        ('O-','O-'),
    ]


    name = models.CharField(max_length=100)

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES
    )

    age = models.IntegerField()

    dob = models.DateField()

    phone = models.CharField(
        max_length=15
    )

    email = models.EmailField(
        blank=True
    )

    blood_group = models.CharField(
        max_length=5,
        choices=BLOOD_GROUPS
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


    def __str__(self):
        return self.name

# Create your models here.
