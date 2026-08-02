from django.core.management.base import BaseCommand
from faker import Faker
import random
from datetime import date, timedelta

from core.models import Patient


class Command(BaseCommand):
    help = "Generate sample patients"

    def handle(self, *args, **kwargs):
        fake = Faker("en_IN")

        blood_groups = [
            "A+", "A-", "B+", "B-",
            "AB+", "AB-", "O+", "O-"
        ]

        histories = [
            "None",
            "Diabetes",
            "Hypertension",
            "Asthma",
            "Thyroid Disorder",
            "Heart Disease",
            "Migraine"
        ]

        allergies = [
            "None",
            "Penicillin",
            "Dust",
            "Pollen",
            "Seafood",
            "Peanuts"
        ]

        sample_patients = [
            {"patient_name": "Rahul Kumar", "age": 32, "gender": "Male", "phone": "9876543210"},
            {"patient_name": "Anita Roy", "age": 28, "gender": "Female", "phone": "9876543211"},
            {"patient_name": "Suresh Nair", "age": 45, "gender": "Male", "phone": "9876543212"},
            {"patient_name": "Neha Sharma", "age": 36, "gender": "Female", "phone": "9876543213"},
            {"patient_name": "Akhil Raj", "age": 24, "gender": "Male", "phone": "9876543214"},
            {"patient_name": "Megha Das", "age": 52, "gender": "Female", "phone": "9876543215"},
            {"patient_name": "Arjun P", "age": 18, "gender": "Male", "phone": "9876543216"},
            {"patient_name": "Divya K", "age": 41, "gender": "Female", "phone": "9876543217"},
            {"patient_name": "Ramesh Babu", "age": 60, "gender": "Male", "phone": "9876543218"},
            {"patient_name": "Sneha Paul", "age": 30, "gender": "Female", "phone": "9876543219"},
        ]

        created = 0

        for patient_data in sample_patients:
            dob = date.today() - timedelta(days=patient_data["age"] * 365)
            email = f"{patient_data['patient_name'].lower().replace(' ', '.')}@example.com"

            Patient.objects.update_or_create(
                phone=patient_data["phone"],
                defaults={
                    "patient_name": patient_data["patient_name"],
                    "gender": patient_data["gender"],
                    "age": patient_data["age"],
                    "dob": dob,
                    "email": email,
                    "blood_group": random.choice(blood_groups),
                    "address": fake.address(),
                    "emergency_contact": fake.msisdn()[:10],
                    "medical_history": random.choice(histories),
                    "allergies": random.choice(allergies),
                }
            )
            created += 1

        for _ in range(40):
            age = random.randint(1, 80)
            dob = date.today() - timedelta(days=age * 365)
            email = fake.unique.email()

            Patient.objects.update_or_create(
                email=email,
                defaults={
                    "patient_name": fake.name(),
                    "gender": random.choice(["Male", "Female"]),
                    "age": age,
                    "dob": dob,
                    "phone": fake.msisdn()[:10],
                    "blood_group": random.choice(blood_groups),
                    "address": fake.address(),
                    "emergency_contact": fake.msisdn()[:10],
                    "medical_history": random.choice(histories),
                    "allergies": random.choice(allergies),
                }
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{created} patients added successfully!"
            )
        )