"use client";

import Link from "next/link";

type Doctor = {
  id: number;
  name: string;
  specialization?: string;
  experience?: number;
  patients_treated?: number;
  rating?: number;
  available?: boolean;
};

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-semibold text-slate-700">
          {doctor.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{doctor.name}</h3>
            <div className="text-sm text-amber-600 font-medium">{doctor.rating ?? "-"} ★</div>
          </div>
          <p className="text-sm text-slate-500">{doctor.specialization}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
            <div>Experience: {doctor.experience ?? "-"} yrs</div>
            <div>Patients: {doctor.patients_treated ?? "-"}+</div>
            <div className={`ml-2 ${doctor.available ? "text-emerald-600" : "text-rose-600"}`}>
              {doctor.available ? "Available" : "Not available"}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link href={`/patient/profile?doctor_id=${doctor.id}`} className="rounded-lg border px-3 py-1 text-sm">
              View Profile
            </Link>
            <Link href={`/patient/book?doctor_id=${doctor.id}`} className="rounded-lg bg-sky-600 text-white px-3 py-1 text-sm">
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
