"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import axios from "axios";
import api from "@/services/api";

export default function Home() {
  const [form, setForm] = useState({ full_name: "", username: "", password: "", phone: "", email: "", dob: "", age: "", gender: "", blood_group: "" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await api.post("patients/register/", form);
      setMessage(`${response.data.message} Sign in with ${response.data.username}.`);
      setForm({ full_name: "", username: "", password: "", phone: "", email: "", dob: "", age: "", gender: "", blood_group: "" });
    } catch (error) {
      setMessage(axios.isAxiosError(error) ? error.response?.data?.detail || "Registration failed. Please try again." : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-6 shadow-lg sm:p-10">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold" style={{ color: "#2563EB" }}>MedaQueue</h1>
          <h2 className="mt-4 text-5xl font-extrabold" style={{ color: "#111827" }}>The Wait is Over.</h2>
          <p className="mt-3 text-2xl font-semibold" style={{ color: "#10B981" }}>Healthcare, On Time.</p>
          <p className="mt-6 max-w-2xl mx-auto text-center" style={{ color: "#6B7280" }}>
            Book appointments, manage queues, and reduce waiting times for patients and staff — simple, fast, and reliable.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,.8fr)] lg:items-start">
          <section className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5 sm:p-7">
            <h3 className="text-2xl font-bold text-slate-900">New patient? Register here</h3>
            <p className="mt-1 text-sm text-slate-600">Create your MedaQueue account to manage appointments and track your queue.</p>
            <form onSubmit={register} className="mt-5 grid gap-3 sm:grid-cols-2">
              {([['full_name', 'Full name', 'text'], ['username', 'Choose a username', 'text'], ['phone', 'Phone number', 'tel'], ['email', 'Email address (optional)', 'email'], ['dob', 'Date of birth', 'date'], ['age', 'Age', 'number']] as const).map(([key, label, type]) => <input key={key} required={key !== 'email'} type={type} placeholder={label} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />)}
              <select required value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-sky-500"><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select>
              <select required value={form.blood_group} onChange={(event) => setForm({ ...form, blood_group: event.target.value })} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-sky-500"><option value="">Blood group</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group}>{group}</option>)}</select>
              <input required type="password" placeholder="Create a password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="sm:col-span-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
              <button disabled={submitting} className="sm:col-span-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60">{submitting ? 'Creating account…' : 'Register account'}</button>
            </form>
            {message && <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${message.startsWith('Your account') ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{message}</p>}
          </section>

          <aside className="rounded-2xl border border-blue-200 bg-white p-6 text-center shadow-sm lg:sticky lg:top-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-600">Already registered?</p>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">Sign in to your account</h3>
            <p className="mt-3 text-sm text-slate-600">Access your appointments, queue updates, and dashboard.</p>
            <Link href="/login" className="mt-6 block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-blue-700">Sign in</Link>
            <Link href="/patient/book" className="mt-3 block rounded-xl border border-blue-600 px-6 py-3 font-semibold text-blue-700 transition hover:bg-blue-50">Book without signing in</Link>
            <p className="mt-6 text-xs text-slate-500">Demo user? Visit <Link href="/demo-credentials" className="text-sky-600 underline">Demo Credentials</Link>.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
