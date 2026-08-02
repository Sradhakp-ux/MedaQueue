"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import DoctorCard from "@/components/DoctorCard";

export default function Recommendations({ departmentId }: { departmentId?: number }) {
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.get("doctors/", { params: departmentId ? { department: departmentId } : {} })
      .then((res) => {
        if (cancelled) return;
        // simple recommendation: highest rating (assume rating present)
        const data = (res.data || []).sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
        setDoctors(data.slice(0, 3));
      })
      .catch(() => setDoctors([]));
    return () => { cancelled = true };
  }, [departmentId]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Recommended for You</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
  );
}
