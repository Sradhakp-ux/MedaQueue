"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import auth from "@/services/auth";

type Patient = { id: number; code?: string; name: string; age: number; gender: string; phone: string };
type Doctor = { id: number; name: string; department: string; specialization: string; available: boolean };
type Appointment = { id: number; patient: string; doctor: string; department: string; date: string; time: string; status: string };
type Department = { name: string; doctors: number; appointments: number; waiting: number };
type QueueItem = { id: number; patient: string; doctor: string; department: string; status: string; token: string; current_position: number };
type Overview = { patients: Patient[]; doctors: Doctor[]; appointments: Appointment[]; departments: Department[] };

const Icon = ({ children }: { children: string }) => <span className="material-symbols-outlined" aria-hidden="true">{children}</span>;
const nav = [["home", "Dashboard"], ["groups", "Patients"], ["medical_services", "Doctors"], ["calendar_month", "Appointments"], ["format_list_bulleted", "Queue"], ["domain", "Departments"], ["bar_chart", "Reports"]] as const;

export default function AdministratorDashboard() {
  const [active, setActive] = useState<(typeof nav)[number][1]>("Dashboard");
  const [data, setData] = useState<Overview>({ patients: [], doctors: [], appointments: [], departments: [] });
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [overview, queueResponse] = await Promise.all([
        api.get("admin/overview/").catch(() => ({ data: null })),
        api.get("queue/").catch(() => ({ data: [] })),
      ]);
      if (overview.data) setData(overview.data);
      setQueue(queueResponse.data || []);
      setLoading(false);
    };
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const waiting = queue.filter((item) => item.status?.toLowerCase() === "waiting");
  const maxQueue = Math.max(...data.departments.map((item) => item.waiting), 1);
  const query = search.toLowerCase();
  const filtered = useMemo(() => ({
    patients: data.patients.filter((item) => `${item.name} ${item.code} ${item.phone}`.toLowerCase().includes(query)),
    doctors: data.doctors.filter((item) => `${item.name} ${item.department} ${item.specialization}`.toLowerCase().includes(query)),
    appointments: data.appointments.filter((item) => `${item.patient} ${item.doctor} ${item.department}`.toLowerCase().includes(query)),
    queue: queue.filter((item) => `${item.patient} ${item.doctor} ${item.department}`.toLowerCase().includes(query)),
  }), [data, queue, query]);

  function logout() { auth.clearTokens(); window.location.href = "/login"; }

  return <main className="min-h-screen bg-[#f7f9ff] text-[#08135d]">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0" />
    <div className="grid min-h-screen lg:grid-cols-[245px_1fr]">
      <aside className="hidden bg-gradient-to-b from-[#03163a] via-[#061a44] to-[#020c25] px-3 py-5 text-white lg:block">
        <div className="flex items-center gap-3 px-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-400 text-[#062052]"><Icon>health_and_safety</Icon></span><div><b className="text-xl">MedaQueue</b><p className="text-[9px] text-sky-100">Smart Appointment & Queue Management</p></div></div>
        <nav className="mt-10 space-y-2 text-[16px]">{nav.map(([icon, label]) => <button key={label} onClick={() => setActive(label)} className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left ${active === label ? "bg-[#1453db] font-semibold" : "text-blue-50 hover:bg-white/10"}`}><Icon>{icon}</Icon>{label}</button>)}<button onClick={logout} className="mt-5 flex w-full items-center gap-4 px-4 py-3 text-left text-blue-50"><Icon>logout</Icon>Logout</button></nav>
      </aside>
      <section className="min-w-0">
        <header className="flex h-[68px] items-center justify-between border-b border-blue-100 bg-white px-5 shadow-sm"><b className="text-lg lg:hidden">MedaQueue</b><div className="hidden w-full max-w-xs items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-slate-500 sm:flex"><Icon>search</Icon><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full outline-none" placeholder={`Search ${active.toLowerCase()}...`} /></div><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-blue-700"><Icon>admin_panel_settings</Icon></span><div><b className="block text-sm">Admin</b><small className="text-emerald-600">● Online</small></div></div></header>
        <div className="p-5 lg:p-7">
          <h1 className="text-3xl font-extrabold tracking-tight">{active === "Dashboard" ? "Admin Dashboard" : active}</h1>
          <p className="mt-1 text-[#365198]">{active === "Dashboard" ? "Hospital management overview" : `Manage hospital ${active.toLowerCase()} and activity`}</p>
          {loading ? <p className="mt-8 text-slate-500">Loading administrator data…</p> : <AdminContent active={active} data={data} queue={queue} filtered={filtered} waiting={waiting} maxQueue={maxQueue} />}
        </div>
      </section>
    </div>
  </main>;
}

function AdminContent({ active, data, queue, filtered, waiting, maxQueue }: { active: string; data: Overview; queue: QueueItem[]; filtered: { patients: Patient[]; doctors: Doctor[]; appointments: Appointment[]; queue: QueueItem[] }; waiting: QueueItem[]; maxQueue: number }) {
  if (active === "Patients") return <Table headers={["Patient", "ID", "Age / Gender", "Phone"]} rows={filtered.patients.map((p) => [p.name, p.code || "—", `${p.age} / ${p.gender}`, p.phone])} empty="No patient records found." />;
  if (active === "Doctors") return <Table headers={["Doctor", "Department", "Specialization", "Status"]} rows={filtered.doctors.map((d) => [d.name, d.department, d.specialization, d.available ? "Available" : "Unavailable"])} empty="No doctors found." />;
  if (active === "Appointments") return <><StatCards items={data.departments.map((d) => [d.name, d.appointments])} label="Appointments by department" /><Table headers={["Patient", "Doctor", "Department", "Date", "Status"]} rows={filtered.appointments.map((a) => [a.patient, a.doctor, a.department, a.date, a.status])} empty="No appointments found." /></>;
  if (active === "Departments") return <Table headers={["Department", "Doctors", "Appointments", "Patients Waiting"]} rows={data.departments.map((d) => [d.name, String(d.doctors), String(d.appointments), String(d.waiting)])} empty="No departments found." />;
  if (active === "Queue") return <><QueueChart departments={data.departments} max={maxQueue} /><Table headers={["Token", "Patient", "Doctor", "Department", "Position", "Status"]} rows={filtered.queue.map((q) => [q.token, q.patient, q.doctor, q.department, String(q.current_position), q.status])} empty="No queue entries found." /></>;
  if (active === "Reports") return <><StatCards items={[["Registered patients", data.patients.length], ["Doctors", data.doctors.length], ["Total appointments", data.appointments.length], ["Currently waiting", waiting.length]]} label="Overall hospital statistics" /><QueueChart departments={data.departments} max={maxQueue} /></>;
  return <><StatCards items={[["Patients", data.patients.length], ["Doctors", data.doctors.length], ["Appointments", data.appointments.length], ["Waiting queue", waiting.length]]} label="Today at a glance" /><QueueChart departments={data.departments} max={maxQueue} /><Table headers={["Token", "Patient", "Department", "Status"]} rows={queue.slice(0, 6).map((q) => [q.token, q.patient, q.department, q.status])} empty="No queue records found." /></>;
}

function StatCards({ items, label }: { items: [string, number][]; label: string }) { return <section className="mt-7"><h2 className="mb-3 text-lg font-bold">{label}</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map(([name, value]) => <article key={name} className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">{name}</p><b className="mt-2 block text-3xl text-slate-950">{value}</b></article>)}</div></section>; }
function QueueChart({ departments, max }: { departments: Department[]; max: number }) { return <section className="mt-7 rounded-xl border border-blue-100 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Queue load by department</h2><p className="text-sm text-slate-500">Departments with the most patients currently waiting</p><div className="mt-6 space-y-4">{departments.map((d) => <div key={d.name}><div className="mb-1 flex justify-between text-sm"><b>{d.name}</b><span>{d.waiting} waiting</span></div><div className="h-4 overflow-hidden rounded-full bg-blue-50"><div className="h-full rounded-full bg-blue-600" style={{ width: `${(d.waiting / max) * 100}%` }} /></div></div>)}{!departments.length && <p className="text-slate-500">No department data available.</p>}</div></section>; }
function Table({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) { return <section className="mt-7 overflow-x-auto rounded-xl border border-blue-100 bg-white shadow-sm"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#f1f5ff]"><tr>{headers.map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`} className="border-t border-slate-100">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 text-slate-700">{cell}</td>)}</tr>)}{!rows.length && <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-slate-500">{empty}</td></tr>}</tbody></table></section>; }
