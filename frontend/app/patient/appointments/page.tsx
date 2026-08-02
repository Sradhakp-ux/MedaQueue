"use client";

import { useEffect, useState } from "react";

type Appointment = {
  id?: string;
  token?: string;
  doctor?: string;
  department?: string;
  date?: string;
  time?: string;
  status?: "Upcoming" | "Completed" | "Cancelled";
};

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("myAppointments");
    if (raw) {
      try {
        setAppointments(JSON.parse(raw));
      } catch (e) {
        setAppointments([]);
      }
    }
  }, []);

  function save(appts: Appointment[]) {
    localStorage.setItem("myAppointments", JSON.stringify(appts));
    setAppointments(appts);
  }

  function cancelAppointment(idx: number) {
    const copy = [...appointments];
    copy[idx].status = "Cancelled";
    save(copy);
  }

  function markCompleted(idx: number) {
    const copy = [...appointments];
    copy[idx].status = "Completed";
    save(copy);
  }

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">My Appointments</h1>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
          {appointments.filter(a => a.status === "Upcoming").length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming appointments.</p>
          ) : (
            appointments.filter(a => a.status === "Upcoming").map((a, i) => (
              <div key={a.id || i} className="mb-4 rounded-lg border p-4">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{a.doctor}</div>
                    <div className="text-sm text-slate-500">{a.department}</div>
                    <div className="text-sm mt-1">{a.date} • {a.time}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm">Status: <strong>{a.status}</strong></div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => cancelAppointment(appointments.indexOf(a))} className="rounded-lg border px-3 py-1 text-sm">Cancel</button>
                      <button onClick={() => markCompleted(appointments.indexOf(a))} className="rounded-lg bg-emerald-600 text-white px-3 py-1 text-sm">Mark Completed</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">History</h2>
          {appointments.filter(a => a.status !== "Upcoming").length === 0 ? (
            <p className="text-sm text-slate-500">No past appointments.</p>
          ) : (
            appointments.filter(a => a.status !== "Upcoming").map((a, i) => (
              <div key={a.id || i} className="mb-4 rounded-lg border p-4">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{a.doctor}</div>
                    <div className="text-sm text-slate-500">{a.department}</div>
                    <div className="text-sm mt-1">{a.date} • {a.time}</div>
                  </div>
                  <div className="text-sm">Status: <strong>{a.status}</strong></div>
                </div>
              </div>
            ))
          )}
        </section>

        <div className="text-sm text-slate-500">Appointments are stored locally for demo purposes. Backend sync requires patient mapping or receptionist privileges.</div>
      </div>
    </div>
  );
}
