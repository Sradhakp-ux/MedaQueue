"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/services/api";
import auth from "@/services/auth";

type Dashboard = {
  patient: { name: string; patient_id: string };
  upcoming: null | { doctor: string; department: string; date: string; time: string; status: string };
  queue: null | { token: string; position: number; estimated_wait: number; status: string };
};

type Doctor = { id: number; name: string; department: string };

const actions = [
  ["Find Doctors", "Search & know more", "/patient/find", "medical_services", "from-blue-50 to-indigo-50"],
  ["Book Appointment", "Schedule your visit", "/patient/book", "calendar_month", "from-violet-50 to-purple-50"],
  ["Track Queue", "Live updates", "/patient/track", "confirmation_number", "from-emerald-50 to-teal-50"],
  ["My Appointments", "View your history", "/patient/appointments", "assignment", "from-amber-50 to-orange-50"],
];

function Icon({ children, className = "" }: { children: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>;
}

export default function PatientHome() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [symptoms, setSymptoms] = useState("");
  const [recommendation, setRecommendation] = useState<{ department: string; priority: string; matched_symptoms: string[]; message: string } | null>(null);
  const [checkingSymptoms, setCheckingSymptoms] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      window.location.href = "/login";
      return;
    }
    Promise.all([api.get("patient/dashboard/"), api.get("doctors/")])
      .then(([dashboard, doctorList]) => {
        setData(dashboard.data);
        setDoctors(doctorList.data || []);
      })
      .catch(() => setDoctors([]));
  }, []);

  const name = data?.patient?.name || auth.getUsername() || "Patient";
  const upcoming = data?.upcoming;
  const queue = data?.queue;
  const doctorCards = doctors.slice(0, 3);

  function logout() {
    auth.clearTokens();
    window.location.href = "/login";
  }

  async function findDepartment() {
    if (!symptoms.trim()) return;
    setCheckingSymptoms(true);
    try {
      const response = await api.post("symptoms/recommend/", { symptoms });
      setRecommendation(response.data);
    } catch {
      setRecommendation({ department: "General Medicine", priority: "NORMAL", matched_symptoms: [], message: "We could not assess the symptoms right now. General Medicine can help assess your symptoms." });
    } finally {
      setCheckingSymptoms(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0a1c64]">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0" />
      <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[70px] max-w-[1600px] items-center justify-between px-4 lg:px-7">
          <Link href="/patient" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-[#1237d8]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1748e8] text-white"><Icon className="text-[26px]">add</Icon></span>
            MedaQueue
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">
            <Link className="border-b-2 border-[#1d4ed8] py-[25px] text-[#1545dc]" href="/patient"><Icon className="mr-1 align-middle text-lg">home</Icon>Home</Link>
            <Link href="/patient/find"><Icon className="mr-1 align-middle text-lg">search</Icon>Find Doctors</Link>
            <Link href="/patient/book"><Icon className="mr-1 align-middle text-lg">calendar_month</Icon>Book Appointment</Link>
            <Link href="/patient/appointments"><Icon className="mr-1 align-middle text-lg">event_note</Icon>My Appointments</Link>
            <Link href="/patient/track"><Icon className="mr-1 align-middle text-lg">confirmation_number</Icon>Track Token</Link>
          </nav>
          <div className="flex items-center gap-3">
            <button className="relative rounded-full p-2 hover:bg-blue-50" aria-label="Notifications"><Icon>notifications</Icon><span className="absolute right-1 top-0 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[10px] text-white">2</span></button>
            <div className="hidden text-right sm:block"><p className="text-sm font-bold text-slate-900">{name}</p><p className="text-xs text-slate-500">Patient</p></div>
            <button onClick={logout} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Logout"><Icon>logout</Icon></button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-70px)] border-r border-blue-100 bg-white px-4 py-7 lg:block">
          <nav className="space-y-2 text-[15px] font-semibold">
            <Link className="flex items-center gap-4 rounded-xl bg-blue-50 px-4 py-4 text-[#1d4ed8]" href="/patient"><Icon>home</Icon>Dashboard</Link>
            <Link className="flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-slate-50" href="/patient/find"><Icon>medical_services</Icon>Find Doctors</Link>
            <Link className="flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-slate-50" href="/patient/book"><Icon>calendar_month</Icon>Book Appointment</Link>
            <Link className="flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-slate-50" href="/patient/track"><Icon>confirmation_number</Icon>Track Queue</Link>
            <Link className="flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-slate-50" href="/patient/appointments"><Icon>assignment</Icon>My Appointments</Link>
            <button className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left hover:bg-slate-50"><Icon>notifications</Icon>Notifications <span className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-xs text-white">2</span></button>
            <button className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left hover:bg-slate-50"><Icon>person</Icon>My Profile</button>
          </nav>
          <div className="mt-6 border-t border-slate-200 pt-5"><button onClick={logout} className="flex items-center gap-4 px-4 py-3 font-semibold text-slate-700"><Icon>power_settings_new</Icon>Logout</button></div>
          <div className="mt-36 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-5 text-[#1451da]"><Icon className="text-4xl">favorite</Icon><p className="mt-3 font-bold">Your Health</p><p className="font-semibold">Our Priority</p></div>
        </aside>

        <section className="min-w-0 p-4 sm:p-6 lg:p-7">
          <section className="relative overflow-hidden rounded-[22px] border border-blue-100 bg-gradient-to-r from-[#e8f2ff] via-[#dcecff] to-[#d8eaff] px-6 py-6 shadow-sm sm:px-10">
            <div className="relative z-10 max-w-2xl"><p className="font-bold">Good day, {name.split(" ")[0]}!</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#09145d] sm:text-4xl">The Wait is Over.</h1><p className="text-xl font-bold text-[#1251e8]">Healthcare, On Time.</p><p className="mt-1 text-sm text-blue-950">Book appointments, track your queue, and get the care you deserve.</p></div>
            <Icon className="absolute right-8 top-5 text-[150px] text-blue-200/70">local_hospital</Icon>
            <Link href="/patient/book" className="relative z-10 mt-5 inline-flex items-center gap-2 rounded-full bg-[#1553e8] px-6 py-3 font-bold text-white shadow-lg shadow-blue-300 transition hover:bg-blue-700"><Icon>calendar_month</Icon>Book Appointment</Link>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{actions.map(([title, sub, href, icon, color]) => <Link key={title} href={href} className={`group flex items-center gap-4 rounded-2xl border border-slate-100 bg-gradient-to-br ${color} p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}><span className="grid h-12 w-12 place-items-center rounded-full bg-white/70 text-[#3047ec]"><Icon className="text-3xl">{icon}</Icon></span><span><b className="block text-[17px]">{title}</b><small className="text-blue-900">{sub}</small></span><Icon className="ml-auto transition group-hover:translate-x-1">chevron_right</Icon></Link>)}</section>

          <section className="mt-7 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-3 text-xl font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-full bg-violet-50 text-violet-600"><Icon>calendar_month</Icon></span>Upcoming Appointment</h2><Link className="font-bold text-blue-600" href="/patient/appointments">View all →</Link></div>{upcoming ? <div className="grid gap-4 sm:grid-cols-[1fr_auto]"><div><p className="text-lg font-bold">{upcoming.doctor}</p><p className="text-sm text-violet-600">{upcoming.department}</p><p className="mt-3 text-sm text-slate-600"><Icon className="mr-2 align-middle text-base">calendar_today</Icon>{upcoming.date}</p><p className="mt-1 text-sm text-slate-600"><Icon className="mr-2 align-middle text-base">schedule</Icon>{upcoming.time}</p></div><div className="sm:text-right"><span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600">✓ {upcoming.status}</span><Link href="/patient/appointments" className="mt-7 block rounded-full border border-blue-200 px-5 py-2 text-sm font-bold text-blue-600">View Details</Link></div></div> : <div className="rounded-xl bg-slate-50 p-6 text-center"><Icon className="text-4xl text-blue-300">event_available</Icon><p className="mt-2 font-bold">No upcoming appointment</p><Link className="mt-3 inline-block font-bold text-blue-600" href="/patient/book">Book a visit →</Link></div>}</article>
            <article className="rounded-2xl bg-gradient-to-br from-[#eafff5] to-[#ecfff8] p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><h2 className="flex items-center gap-3 text-xl font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Icon>confirmation_number</Icon></span>Live Queue</h2><Link className="font-bold text-blue-600" href="/patient/track">View all →</Link></div>{queue ? <><div className="mt-5 grid grid-cols-3 rounded-2xl bg-white/70 py-4 text-center"><div><small>Your Token</small><b className="block text-xl">{queue.token}</b></div><div className="border-x border-slate-200"><small>Patients Ahead</small><b className="block text-xl">{Math.max(0, queue.position - 1)}</b></div><div><small>Status</small><b className="block text-sm">{queue.status}</b></div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(15, 100 - queue.position * 12)}%` }} /></div><p className="mt-3 font-bold"><Icon className="mr-2 align-middle">schedule</Icon>Estimated wait: {queue.estimated_wait} minutes</p></> : <div className="mt-5 rounded-2xl bg-white/70 p-7 text-center"><Icon className="text-4xl text-emerald-400">confirmation_number</Icon><p className="mt-2 font-bold">No active queue token</p><p className="text-sm text-slate-600">Your live queue status will appear here.</p></div>}</article>
          </section>

          <section className="mt-7 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            <article className="rounded-2xl bg-gradient-to-br from-[#f0efff] to-[#faf8ff] p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-3 text-xl font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-full bg-violet-100 text-violet-600"><Icon>smart_toy</Icon></span>AI Health Assistant</h2>
              <p className="mt-1 text-sm text-blue-900">Describe your symptoms and get smart recommendations.</p>
              <div className="mt-5 flex items-center rounded-2xl border border-violet-200 bg-white px-4 py-3"><input value={symptoms} onChange={(event) => setSymptoms(event.target.value)} onKeyDown={(event) => event.key === "Enter" && findDepartment()} className="min-w-0 flex-1 outline-none" placeholder="Describe your symptoms, e.g. chest pain and breathlessness" /><Icon className="text-blue-600">mic</Icon></div>
              <button onClick={findDepartment} disabled={!symptoms.trim() || checkingSymptoms} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#243be9] to-[#7359ee] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"><Icon>search</Icon>{checkingSymptoms ? "Checking symptoms..." : "Find Best Department"}</button>
              {recommendation && <div className={`mt-4 rounded-xl border p-4 text-sm ${recommendation.priority === "EMERGENCY" ? "border-rose-300 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}><p className="font-extrabold">{recommendation.priority === "EMERGENCY" ? "Emergency warning" : `Recommended: ${recommendation.department}`}</p><p className="mt-1">{recommendation.message}</p>{recommendation.matched_symptoms.length > 0 && <p className="mt-2 text-xs font-semibold">Matched: {recommendation.matched_symptoms.join(", ")}</p>}</div>}
            </article>
            <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><h2 className="flex items-center gap-3 text-xl font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-full bg-amber-50 text-amber-500"><Icon>workspace_premium</Icon></span>Top Doctors</h2><Link className="font-bold text-blue-600" href="/patient/find">View all →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{doctorCards.length ? doctorCards.map((doctor) => <div key={doctor.id} className="rounded-xl border border-slate-100 p-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-600"><Icon>person</Icon></span><p className="mt-2 truncate font-bold text-slate-900">{doctor.name}</p><p className="truncate text-xs text-violet-600">{doctor.department}</p><p className="mt-2 text-xs font-semibold text-emerald-600">● Available</p><Link href="/patient/find" className="mt-2 block rounded-lg border border-blue-200 py-1 text-center text-xs font-bold text-blue-600">View Profile</Link></div>) : <p className="col-span-3 text-sm text-slate-500">Doctors will appear here when available.</p>}</div></article>
          </section>
        </section>
      </div>
      <footer className="border-t border-blue-100 bg-[#eef5ff] px-6 py-3 text-center text-xs text-blue-900">Made with care for better healthcare · MedaQueue</footer>
    </main>
  );
}
