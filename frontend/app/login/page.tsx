"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import api from "@/services/api";
import auth from "@/services/auth";

function LoginPageInner() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const u = searchParams?.get("username");
    const p = searchParams?.get("password");
    if (u) setUsername(u);
    if (p) setPassword(p);
  }, [searchParams]);

  async function handleLogin() {
    try {
      const response = await api.post("token/", {
        username,
        password,
      });

      auth.setTokens(response.data.access, response.data.refresh);
      auth.scheduleRefresh(response.data.access);

      setLoginMessage("Login successful — opening your dashboard…");
      const redirect = (path: string) => window.setTimeout(() => router.push(path), 650);

      const normalized = username.trim().toLowerCase();
      if (normalized === "administrator" || normalized.includes("administrator") || normalized === "admin") {
        redirect("/administrator/dashboard");
        return;
      }
      if (normalized.startsWith("reception") || normalized.includes("receptionist")) {
        redirect("/receptionist/dashboard");
        return;
      }
      if (normalized.startsWith("patient")) {
        redirect("/patient");
        return;
      }

      try {
        await api.get("patient/profile/");
        redirect("/patient");
        return;
      } catch {
      }

      let doctorId: number | null = null;
      try {
        const pairsResponse = await api.get("doctor-pairs/");
        const pair = pairsResponse.data.find(
          (item: { username: string; doctor_id?: number }) =>
            item.username?.toLowerCase() === normalized
        );
        if (pair?.doctor_id) {
          doctorId = pair.doctor_id;
        }
      } catch (error) {
        console.error("Failed to resolve doctor mapping", error);
      }

      redirect(
        `/doctor/dashboard${doctorId ? `?doctor_id=${doctorId}` : ""}`
      );
    } catch (error) {
      const message = axios.isAxiosError(error) && !error.response
        ? "Unable to reach the login server. Start the backend on port 8000 and try again."
        : "Invalid username or password";
      alert(message);
      console.error(error);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-slate-100 to-slate-200 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl ring-1 ring-slate-200">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-600">Welcome to</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">MedaQueue</h1>
          <p className="mt-3 text-sm text-slate-500">Login as Patient, Doctor, Receptionist, or Administrator — or book an appointment directly.</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Username</label>
          <input
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={handleLogin}
              className="rounded-2xl bg-sky-600 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/50 transition hover:bg-sky-700"
            >
              Login
            </button>
            <a
              href="/patient/book"
              className="inline-flex items-center justify-center rounded-2xl border border-sky-600 bg-white py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
            >
              Book Appointment
            </a>
          </div>
          {loginMessage && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{loginMessage}</p>}
        </div>

        <div className="mt-8 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
          <p className="font-semibold text-slate-900">Demo credentials (click to quick-fill)</p>
          <div className="mt-2 flex flex-col gap-2">
            <button
              onClick={() => { setUsername('doctor1'); setPassword('doctor@123'); }}
              className="text-left text-sm hover:underline"
            >
              Doctor: <span className="font-medium">doctor1 / doctor@123</span>
            </button>
            <button
              onClick={() => { setUsername('reception1'); setPassword('reception@123'); }}
              className="text-left text-sm hover:underline"
            >
              Receptionist: <span className="font-medium">reception1 / reception@123</span>
            </button>
            <button
              onClick={() => { setUsername('patient1'); setPassword('patient123'); }}
              className="text-left text-sm hover:underline"
            >
              Patient: <span className="font-medium">patient1 / patient123</span>
            </button>
            <button
              onClick={() => { setUsername('administrator'); setPassword('administrator@123'); }}
              className="text-left text-sm hover:underline"
            >
              Administrator: <span className="font-medium">administrator / administrator@123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-slate-100 to-slate-200 px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl ring-1 ring-slate-200">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-600">Welcome to</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">MedaQueue</h1>
            <p className="mt-3 text-sm text-slate-500">Login as Patient, Doctor, Receptionist, or Administrator — or book an appointment directly.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-10 rounded-2xl border border-slate-300 bg-slate-50"></div>
              <div className="h-10 rounded-2xl border border-slate-300 bg-slate-50"></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-12 rounded-2xl bg-slate-100"></div>
              <div className="h-12 rounded-2xl border border-slate-300 bg-white"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
