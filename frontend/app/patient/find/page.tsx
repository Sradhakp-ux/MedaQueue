"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import DoctorCard from "@/components/DoctorCard";
import DepartmentsList from "@/components/DepartmentsList";

export default function FindDoctors() {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [minRating, setMinRating] = useState<number>(0);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      api
        .get("doctors/", { params: { search: query, department: specialty, min_rating: minRating, available: availableOnly } })
        .then((res) => {
          if (cancelled) return;
          const list = res.data || [];
          setDoctors(list);
          // derive specialties for filter dropdown
          const s = Array.from(new Set(list.map((d: any) => d.department || d.specialization).filter(Boolean)));
          setSpecialties(s as string[]);
        })
        .catch(() => {});
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, specialty, minRating, availableOnly]);

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Find Doctors</h1>
          <p className="text-sm text-slate-500">Search and filter doctors by specialty, rating, availability.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <DepartmentsList onSelect={(id) => setSpecialty(String(id))} />
          </div>
          <div className="md:col-span-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctor name or speciality"
                className="flex-1 rounded-lg border px-3 py-2"
              />
              <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="rounded-lg border px-3 py-2">
                <option value="">All Specialities</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="rounded-lg border px-3 py-2">
                <option value={0}>Any rating</option>
                <option value={3}>3+ stars</option>
                <option value={4}>4+ stars</option>
                <option value={4.5}>4.5+ stars</option>
              </select>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} /> Available only
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
              {doctors.map((d) => (
                <DoctorCard key={d.id} doctor={{
                  id: d.id,
                  name: d.name || d.doctor_name || `Doctor ${d.id}`,
                  specialization: d.department || d.specialization || "",
                  experience: d.experience || 0,
                  patients_treated: d.patients_treated || 0,
                  rating: d.rating || 4.5,
                  available: d.available ?? true,
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
