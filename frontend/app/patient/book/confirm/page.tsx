"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LiveQueue from "@/components/LiveQueue";

function BookingConfirmInner() {
  const search = useSearchParams();
  const token = search.get("token") || "";
  const doctor = search.get("doctor") || "";
  const department = search.get("department") || "";
  const date = search.get("date") || "";
  const time = search.get("time") || "";

  function downloadToken() {
    const tokenDetails = `MedaQueue Appointment Token\n\nToken: ${token}\nDoctor: ${doctor}\nDepartment: ${department}\nDate: ${date}\nTime: ${time}\n\nPlease show this token at the hospital.`;
    const blob = new Blob([tokenDetails], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `MedaQueue-${token || "token"}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("myAppointments");
      const arr = raw ? JSON.parse(raw) : [];
      const exists = arr.find((a: any) => a.token === token && a.date === date && a.time === time);
      if (!exists && token) {
        arr.push({ token, doctor, department, date, time, status: "Upcoming" });
        localStorage.setItem("myAppointments", JSON.stringify(arr));
      }
    } catch (e) {}
  }, [token, doctor, department, date, time]);

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="mx-auto max-w-md space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">Appointment Booked</h2>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Token</p>
            <p className="text-2xl font-bold">{token}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-slate-500">Doctor</p>
              <p className="font-medium">{doctor}</p>
            </div>
            <div>
              <p className="text-slate-500">Department</p>
              <p className="font-medium">{department}</p>
            </div>
            <div>
              <p className="text-slate-500">Date</p>
              <p className="font-medium">{date}</p>
            </div>
            <div>
              <p className="text-slate-500">Time</p>
              <p className="font-medium">{time}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={downloadToken} className="rounded-lg border border-blue-300 px-4 py-2 font-semibold text-blue-700">Download Token</button>
            <a className="rounded-lg border border-emerald-300 px-4 py-2 font-semibold text-emerald-700" href={`/patient/track?token=${encodeURIComponent(token)}`}>Track Queue</a>
            <a className="rounded-lg bg-sky-600 text-white px-4 py-2" href="/patient">Go to Dashboard</a>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Live Queue Tracking</h3>
            <LiveQueue tokenProp={token} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-8 bg-slate-50">
        <div className="mx-auto max-w-md space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-semibold">Appointment Booked</h2>
            <div className="mt-4 space-y-2">
              <div className="h-8 w-32 rounded bg-slate-100"></div>
              <div className="h-6 w-48 rounded bg-slate-100"></div>
            </div>
            <div className="mt-6 flex gap-3">
              <div className="h-10 w-36 rounded-lg bg-slate-100"></div>
              <div className="h-10 w-36 rounded-lg bg-slate-100"></div>
              <div className="h-10 w-36 rounded-lg bg-slate-100"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <BookingConfirmInner />
    </Suspense>
  );
}
