"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import auth from "@/services/auth";

type Department = { id: number; name: string };
type Doctor = { id: number; name?: string; doctor_name?: string };

export default function BookAppointment() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | "">("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const slots = ["09:00","09:20","09:40","10:00","10:20","10:40","11:00","11:20","11:40","12:00"];

  useEffect(() => {
    api.get("departments/")
      .then((res) => setDepartments(res.data || []))
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (!selectedDept) return;
    api.get("doctors/", { params: { department: selectedDept } })
      .then((res) => setDoctors(res.data || []))
      .catch(() => setDoctors([]));
  }, [selectedDept]);

  async function handleConfirm() {
    if (!selectedDoctor || !date || !time || !patientName || !phone) {
      alert("Please fill all required fields.");
      return;
    }
    // if not authenticated, offer to sign in for immediate backend booking
    if (false) {
      const goLogin = confirm(
        "You are not signed in. Sign in for instant booking (recommended) — Cancel to continue as guest and save locally."
      );
      if (goLogin) {
        router.push(`/login?username=&password=`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        doctor_id: selectedDoctor,
        date,
        time,
        patient_name: patientName,
        phone,
        // In this demo we send patient details in remarks for backend that requires receptionist auth
        remarks: JSON.stringify({ patient_name: patientName, phone }),
      };

      let token = "";
      let doctorName = "";
      let departmentName = "";

      try {
        const res = await api.post("appointments/instant/", payload);
        token = res.data.token || res.data.queue_number || "";
        doctorName = res.data.doctor || "";
        departmentName = res.data.department || "";
    } catch (e: unknown) {
        alert("We could not create your appointment. Please check the details and try again.");
        return;
        // if backend call fails (likely due to permissions), fallback to local-only booking
        console.error("Backend booking failed, falling back to local save.", e);
        token = `LOCAL-${Date.now()}`;
        doctorName = doctors.find((d) => d.id === selectedDoctor)?.name || "";
        departmentName = departments.find((d) => d.id === Number(selectedDept))?.name || "";
        alert("Could not complete server booking. Saved locally for demo.");
      }

      // save to local appointments for demo
      try {
        const raw = localStorage.getItem("myAppointments");
        const arr = raw ? JSON.parse(raw) : [];
        arr.push({ token, doctor: doctorName, department: departmentName, date, time, status: "Upcoming" });
        localStorage.setItem("myAppointments", JSON.stringify(arr));
      } catch {
        // ignore
      }

      router.push(`/patient/book/confirm?token=${encodeURIComponent(token)}&doctor=${encodeURIComponent(doctorName)}&department=${encodeURIComponent(departmentName)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7faff] p-5 text-[#0a1c64] sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#e3f0ff] to-[#eef4ff] p-7"><p className="font-bold text-blue-600">INSTANT APPOINTMENT</p><h1 className="mt-1 text-3xl font-extrabold">Choose a department and doctor</h1><p className="mt-2 text-[#365198]">Select your care area first. Available doctors appear immediately below.</p></div>
        {false && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-slate-700">
            You are not signed in. Sign in for instant backend booking or continue as guest and save locally.
            <a className="ml-3 text-sky-600 underline" href="/login">Sign in</a>
          </div>
        )}

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <label className="block text-lg font-bold text-[#0a1c64]">1. Select Department</label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{departments.map((d) => <button key={d.id} onClick={() => { setSelectedDept(d.id); setSelectedDoctor(""); }} className={`rounded-xl border p-4 text-left transition ${selectedDept === d.id ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"}`}><span className="text-2xl">✚</span><b className="mt-2 block">{d.name}</b><small className="text-slate-500">View doctors</small></button>)}</div>
          {!departments.length && <p className="mt-3 text-sm text-slate-500">No departments available.</p>}

          {selectedDept && <><label className="mt-7 block text-lg font-bold text-[#0a1c64]">2. Choose Doctor</label><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{doctors.map((d) => <button key={d.id} onClick={() => setSelectedDoctor(d.id)} className={`rounded-xl border p-4 text-left transition ${selectedDoctor === d.id ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "border-slate-200 hover:border-emerald-300"}`}><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-700">Dr</span><b className="mt-2 block text-slate-900">{d.name || d.doctor_name || `Doctor ${d.id}`}</b><small className="text-violet-600">Available for appointment</small></button>)}</div>{!doctors.length && <p className="mt-3 text-sm text-slate-500">No doctors are currently listed in this department.</p>}</>}

          <div className="grid grid-cols-1 gap-3 mt-7 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded border px-3 py-2 mt-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Time Slot</label>
              <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded border px-3 py-2 mt-2">
                <option value="">Choose slot</option>
                {slots.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Patient Name</label>
            <input value={patientName} onChange={(e) => setPatientName(e.target.value)} className="w-full rounded border px-3 py-2 mt-2" />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded border px-3 py-2 mt-2" />
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleConfirm} className="rounded-lg bg-emerald-600 text-white px-4 py-2" disabled={loading}>
              {loading ? "Booking..." : "Confirm Appointment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
