
from django.core.management.base import BaseCommand
from faker import Faker
import random

from core.models import Doctor, Department


class Command(BaseCommand):
    help = "Seed doctors"

    def handle(self, *args, **kwargs):

        fake = Faker("en_IN")

        department_details = {
            "Cardiology": {
                "count": 2,
                "qualification": "MBBS, DM Cardiology",
                "specialization": "Cardiologist",
                "fee": (300, 800),
                "room": "C"
            },
            "Neurology": {
                "count": 2,
                "qualification": "MBBS, DM Neurology",
                "specialization": "Neurologist",
                "fee": (300, 800),
                "room": "N"
            },
            "Orthopedics": {
                "count": 2,
                "qualification": "MBBS, MS Orthopedics",
                "specialization": "Orthopedic Surgeon",
                "fee": (800, 1200),
                "room": "O"
            },
            "Pediatrics": {
                "count": 2,
                "qualification": "MBBS, MD Pediatrics",
                "specialization": "Pediatrician",
                "fee": (600, 900),
                "room": "P"
            },
            "General Medicine": {
                "count": 3,
                "qualification": "MBBS, MD General Medicine",
                "specialization": "Physician",
                "fee": (500, 900),
                "room": "GM"
            },
            "General Surgery": {
                "count": 2,
                "qualification": "MBBS, MS General Surgery",
                "specialization": "General Surgeon",
                "fee": (800, 1200),
                "room": "GS"
            },
            "Emergency Medicine": {
                "count": 2,
                "qualification": "MBBS, MD Emergency Medicine",
                "specialization": "Emergency Physician",
                "fee": (700, 1000),
                "room": "ER"
            },
            "Dermatology": {
                "count": 2,
                "qualification": "MBBS, MD Dermatology",
                "specialization": "Dermatologist",
                "fee": (700, 1000),
                "room": "D"
            },
            "Ophthalmology": {
                "count": 2,
                "qualification": "MBBS, MS Ophthalmology",
                "specialization": "Eye Specialist",
                "fee": (700, 1000),
                "room": "OP"
            },
            "ENT (Otolaryngology)": {
                "count": 2,
                "qualification": "MBBS, MS ENT",
                "specialization": "ENT Surgeon",
                "fee": (700, 1000),
                "room": "ENT"
            },
            "Gynecology": {
                "count": 2,
                "qualification": "MBBS, MS Obstetrics & Gynecology",
                "specialization": "Gynecologist",
                "fee": (800, 1200),
                "room": "GY"
            },
            "Obstetrics": {
                "count": 2,
                "qualification": "MBBS, MS Obstetrics & Gynecology",
                "specialization": "Obstetrician",
                "fee": (800, 1200),
                "room": "OBS"
            },
            "Urology": {
                "count": 1,
                "qualification": "MBBS, MCh Urology",
                "specialization": "Urologist",
                "fee": (900, 1300),
                "room": "U"
            },
            "Nephrology": {
                "count": 1,
                "qualification": "MBBS, DM Nephrology",
                "specialization": "Nephrologist",
                "fee": (900, 1300),
                "room": "NE"
            },
            "Oncology": {
                "count": 1,
                "qualification": "MBBS, DM Oncology",
                "specialization": "Oncologist",
                "fee": (1000, 1500),
                "room": "ON"
            },
            "Pulmonology": {
                "count": 1,
                "qualification": "MBBS, DM Pulmonology",
                "specialization": "Pulmonologist",
                "fee": (800, 1200),
                "room": "PU"
            },
            "Gastroenterology": {
                "count": 1,
                "qualification": "MBBS, DM Gastroenterology",
                "specialization": "Gastroenterologist",
                "fee": (900, 1300),
                "room": "GI"
            },
            "Psychiatry": {
                "count": 1,
                "qualification": "MBBS, MD Psychiatry",
                "specialization": "Psychiatrist",
                "fee": (700, 1000),
                "room": "PS"
            },
            "Endocrinology": {
                "count": 1,
                "qualification": "MBBS, DM Endocrinology",
                "specialization": "Endocrinologist",
                "fee": (800, 1200),
                "room": "EN"
            },
            "Radiology": {
                "count": 1,
                "qualification": "MBBS, MD Radiology",
                "specialization": "Radiologist",
                "fee": (700, 1000),
                "room": "RA"
            }
        }

        total = 0

        for dept_name, info in department_details.items():

            department = Department.objects.get(
                department_name=dept_name
            )

            for i in range(info["count"]):

                Doctor.objects.update_or_create(
                    email=fake.unique.email(),
                    defaults={
                        "doctor_name": fake.name(),
                        "phone": fake.msisdn()[:10],
                        "qualification": info["qualification"],
                        "specialization": info["specialization"],
                        "experience": random.randint(5, 25),
                        "consultation_fee": random.randint(
                            info["fee"][0],
                            info["fee"][1]
                        ),
                        "room_number": f"{info['room']}-{100+i}",
                        "available": random.choice([True, True, True, False]),
                        "department": department,
                    }
                )

                total += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{total} doctors added successfully!"
            )
        )