"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/services/api";

export default function DemoCredentialsPage() {
  const router = useRouter();

  const creds = [
    { username: "doctor1", password: "doctor@123", role: "Doctor" },
    { username: "doctor2", password: "doctor@123", role: "Doctor" },
    { username: "doctor3", password: "doctor@123", role: "Doctor" },
    { username: "doctor4", password: "doctor@123", role: "Doctor" },
    { username: "doctor5", password: "doctor@123", role: "Doctor" },
    { username: "reception1", password: "reception@123", role: "Receptionist" },
    { username: "patient1", password: "patient123", role: "Patient" },
    { username: "patient2", password: "patient123", role: "Patient" },
    { username: "patient3", password: "patient123", role: "Patient" },
    { username: "patient4", password: "patient123", role: "Patient" },
    { username: "patient5", password: "patient123", role: "Patient" },
    { username: "administrator", password: "administrator@123", role: "Administrator" },
  ];

  const [doctorUsers, setDoctorUsers] = useState<{ username: string; doctor_id?: number; doctor_name?: string }[]>([]);
  const [index, setIndex] = useState("");

  function copy(cred: { username: string; password: string }) {
    navigator.clipboard?.writeText(`username: ${cred.username}\npassword: ${cred.password}`);
    alert('Copied to clipboard');
  }

  useEffect(() => {
    let cancelled = false;
    api.get("doctor-pairs/").then((res) => {
      if (cancelled) return;
      setDoctorUsers(res.data || []);
    }).catch(() => {});
    return () => { cancelled = true };
  }, []);

  function goNumber(nStr: string) {
    const n = parseInt(nStr || "0", 10);
    if (!n || n < 1 || n > doctorUsers.length) {
      alert(`Enter a number between 1 and ${doctorUsers.length}`);
      return;
    }
    const pair = doctorUsers[n - 1];
    if (!pair.username) {
      // navigate directly to doctor dashboard if no mapped username
      router.push(`/doctor/dashboard?doctor_id=${pair.doctor_id}`);
      return;
    }
    router.push(`/login?username=${encodeURIComponent(pair.username)}&password=doctor@123`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl bg-white rounded-xl p-6 shadow">
        <h1 className="text-2xl font-semibold mb-4">Demo Credentials</h1>
        <p className="text-sm text-slate-600 mb-4">Use these accounts to sign in for demo or testing.</p>

        <ul className="space-y-3">
          {creds.map((c) => (
            <li key={c.username} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">{c.username} — <span className="text-sm text-slate-500">{c.role}</span></div>
                <div className="text-sm text-slate-600">Password: {c.password}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copy(c)}
                  className="rounded-lg bg-sky-600 text-white px-3 py-1 text-sm hover:bg-sky-700"
                >
                  Copy
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="rounded-lg border px-3 py-1 text-sm"
                >
                  Go to Login
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <p className="text-sm font-semibold">Quick pick by number</p>
          <p className="text-xs text-slate-500">Enter a number and jump to that doctor's login (1 = first)</p>
          <div className="mt-2 flex gap-2">
            <input
              value={index}
              onChange={(e) => setIndex(e.target.value)}
              placeholder={`1 - ${doctorUsers.length || 0}`}
              className="rounded border px-3 py-2 w-28"
            />
            <button onClick={() => goNumber(index)} className="rounded bg-sky-600 text-white px-3 py-2">Go</button>
          </div>
          <div className="mt-2 text-xs text-slate-500">Loaded {doctorUsers.length} doctor accounts from server.</div>
        </div>

        <div className="mt-6 text-sm text-slate-500">
          <p>Open <a className="text-sky-600 underline" href="/login">Login page</a> and sign in.</p>
        </div>
      </div>
    </div>
  );
}
