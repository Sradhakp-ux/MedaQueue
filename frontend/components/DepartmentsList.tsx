"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import Link from "next/link";

export default function DepartmentsList({ onSelect }: { onSelect?: (id: number) => void }) {
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.get("departments/")
      .then((res) => {
        if (cancelled) return;
        setDepartments(res.data || []);
      })
      .catch(() => setDepartments([]));
    return () => { cancelled = true };
  }, []);

  return (
    <aside className="rounded-lg bg-white p-4 shadow">
      <h3 className="text-sm font-semibold mb-2">Departments</h3>
      <ul className="space-y-1 text-sm">
        <li>
          <Link href="/patient/find" onClick={() => onSelect && onSelect(0)} className="text-slate-700">All</Link>
        </li>
        {departments.map((d) => (
          <li key={d.id}>
            <Link href={`/patient/find?department=${d.id}`} onClick={() => onSelect && onSelect(d.id)} className="text-slate-700">{d.name}</Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
