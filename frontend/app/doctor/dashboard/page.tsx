"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/services/api";

interface QueueItem {
  id: number;
  token: string;
  patient: string;
  status: string;
  position: number;
  estimated_wait: number;
}

interface DashboardData {
  doctor: string;
  department: string;
  room: string;
  duty_hours: string;
  today_summary: {
    total_patients: number;
    waiting: number;
    completed: number;
  };
  current_queue: QueueItem[];
}

function DoctorDashboardInner() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryId = searchParams?.get("doctor_id");
    if (queryId) {
      const parsedId = Number(queryId);
      if (!Number.isNaN(parsedId)) {
        setDoctorId(parsedId);
        return;
      }
    }

    async function resolveDoctorId() {
      try {
        const token = localStorage.getItem("access");
        if (!token) return;

        const payload = JSON.parse(
          atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        const username = String(payload.username || "").toLowerCase();
        if (!username) return;

        const pairsResponse = await api.get("doctor-pairs/");
        const pair = pairsResponse.data.find(
          (item: { username: string; doctor_id?: number }) =>
            item.username?.toLowerCase() === username
        );

        if (pair?.doctor_id) {
          setDoctorId(pair.doctor_id);
        }
      } catch (error) {
        console.error("Failed to resolve doctor ID from token", error);
      }
    }

    resolveDoctorId();
  }, [searchParams]);

  useEffect(() => {
    if (!doctorId) return;

    loadDashboard(doctorId);
    const interval = window.setInterval(() => loadDashboard(doctorId), 5000);
    return () => window.clearInterval(interval);
  }, [doctorId]);

  async function loadDashboard(userId: number) {
    try {
      const response = await api.get(`doctor/${userId}/dashboard/`);

      console.log("Dashboard Response:", response.data);

      setDashboard(response.data);
      setQueue(response.data.current_queue ?? []);
    } catch (error: any) {
      console.log("STATUS:", error.response?.status);
      console.log("DATA:", error.response?.data);
      console.log("ERROR:", error);
      console.error(error);
    }
  }

  async function handleCallNext() {
    if (!queue.length || !doctorId) return;
    try {
      await api.patch(`queue/${queue[0].id}/call/`);
      loadDashboard(doctorId);
    } catch (error) {
      console.error("Call next patient failed", error);
    }
  }

  async function handleSkipPatient() {
    if (!queue.length || !doctorId) return;
    try {
      await api.patch(`queue/${queue[0].id}/skip/`);
      loadDashboard(doctorId);
    } catch (error) {
      console.error("Skip patient failed", error);
    }
  }

  async function handleCompleteConsultation() {
    if (!queue.length || !doctorId) return;
    try {
      await api.patch(`queue/${queue[0].id}/complete/`);
      loadDashboard(doctorId);
    } catch (error) {
      console.error("Completing consultation failed", error);
    }
  }

  if (!dashboard) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">Loading Dashboard...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-slate-100 p-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[2rem] bg-white p-8 shadow-2xl ring-1 ring-slate-200">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-sky-100 px-4 py-2 text-sky-700 shadow-sm ring-1 ring-sky-200">
                <span className="h-3.5 w-3.5 rounded-full bg-sky-600" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">MedaQueue</span>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Doctor Dashboard</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                  Welcome back, {dashboard.doctor}
                </h1>
                <p className="mt-3 max-w-2xl text-base text-slate-600">
                  Your patient queue is updated automatically every 5 seconds. Manage the next token, progress the queue, and keep an eye on today&apos;s metrics.
                </p>
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 px-7 py-6 text-center shadow-inner ring-1 ring-slate-200">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Room</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{dashboard.room}</p>
              <p className="mt-2 text-sm text-slate-500">Department: {dashboard.department}</p>
              <p className="mt-2 text-sm font-semibold text-sky-700">Duty: {dashboard.duty_hours}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Current Patient</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    The next patient waiting in your queue.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  Auto-refresh every 5s
                </span>
              </div>

              {queue.length ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Patient</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{queue[0].patient}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Token</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">{queue[0].token}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Position</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">{queue[0].position}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Estimated wait</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{queue[0].estimated_wait} mins</p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={handleCallNext}
                      className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:bg-slate-300"
                      disabled={!queue.length}
                    >
                      Call Next Patient
                    </button>
                    <button
                      onClick={handleSkipPatient}
                      className="rounded-3xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-rose-700 disabled:bg-slate-300"
                      disabled={!queue.length}
                    >
                      Skip Patient
                    </button>
                    <button
                      onClick={handleCompleteConsultation}
                      className="rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:bg-slate-300"
                      disabled={!queue.length}
                    >
                      Mark Consultation Complete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                  No waiting patients in the queue.
                </div>
              )}
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] bg-white p-6 shadow-xl ring-1 ring-slate-200">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Total Patients</p>
                <p className="mt-4 text-4xl font-semibold text-slate-900">{dashboard.today_summary.total_patients}</p>
              </div>
              <div className="rounded-[1.75rem] bg-white p-6 shadow-xl ring-1 ring-slate-200">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Waiting</p>
                <p className="mt-4 text-4xl font-semibold text-slate-900">{dashboard.today_summary.waiting}</p>
              </div>
              <div className="rounded-[1.75rem] bg-white p-6 shadow-xl ring-1 ring-slate-200">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Completed</p>
                <p className="mt-4 text-4xl font-semibold text-slate-900">{dashboard.today_summary.completed}</p>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Quick Notes</h3>
              <p className="mt-3 text-slate-600">
                Keep the doctor dashboard open while consulting patients. The queue updates automatically, and you can call or skip the next patient without refreshing.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">Loading Dashboard...</h1>
      </div>
    }>
      <DoctorDashboardInner />
    </Suspense>
  );
}
