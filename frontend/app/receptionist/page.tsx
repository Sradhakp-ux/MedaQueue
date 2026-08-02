"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";

interface Department {
  id: number;
  name: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  room_number: string;
}

interface PatientSearchResult {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
}

export default function ReceptionistPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | "">("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | "">("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<PatientSearchResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [registration, setRegistration] = useState({
    patient_name: "",
    age: "",
    gender: "Male",
    dob: "",
    phone: "",
    email: "",
    blood_group: "A+",
    emergency_contact: "",
    address: "",
    medical_history: "",
    allergies: "",
  });
  const [appointment, setAppointment] = useState({
    date: "",
    time: "",
    priority: "Normal",
    remarks: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<string | null>(null);
  const [stats, setStats] = useState({ patientsToday: 0, appointments: 0, doctorsAvailable: 0, avgWait: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadDepartments();
    loadStats();
  }, []);

  async function loadStats() {
    setLoadingStats(true);
    try {
      const [qRes, dRes, aRes] = await Promise.all([
        api.get("queue/").catch(() => ({ data: [] })),
        api.get("doctors/").catch(() => ({ data: [] })),
        api.get("appointments/today/").catch(() => ({ data: [] })),
      ]);

      const queue = qRes.data || [];
      const docs = dRes.data || [];
      const apps = aRes.data || [];

      const doctorsAvailable = Array.isArray(docs) ? docs.filter((d: any) => d.is_available || d.available).length : 0;
      const patientsToday = Array.isArray(queue) ? queue.length : 0;
      const appointments = Array.isArray(apps) ? apps.length : 0;
      const avgWait = Math.round((patientsToday > 0 ? (patientsToday * 3) : 14));

      setStats({ patientsToday, appointments, doctorsAvailable, avgWait });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    if (patientSearch.trim().length >= 3) {
      const timeout = window.setTimeout(() => {
        handlePatientSearch();
      }, 250);

      return () => window.clearTimeout(timeout);
    }

    setPatientResults([]);
  }, [patientSearch]);

  const canSearchPatient = patientSearch.trim().length >= 3;
  const canBookAppointment = useMemo(
    () =>
      selectedPatient &&
      selectedDoctor &&
      appointment.date &&
      appointment.time,
    [selectedPatient, selectedDoctor, appointment]
  );

  async function loadDepartments() {
    try {
      const response = await api.get("departments/");
      setDepartments(response.data);
    } catch (error) {
      console.error("Failed to load departments", error);
    }
  }

  async function loadDoctors(departmentId: number) {
    try {
      const response = await api.get("doctors/", {
        params: { department: departmentId },
      });
      setDoctors(response.data);
      setSelectedDoctor("");
    } catch (error) {
      console.error("Failed to load doctors", error);
      setDoctors([]);
    }
  }

  async function handleDepartmentChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(event.target.value);
    setSelectedDepartment(id);
    if (id) {
      await loadDoctors(id);
    } else {
      setDoctors([]);
    }
  }

  async function handlePatientSearch() {
    if (!canSearchPatient) return;

    try {
      const response = await api.get("patients/search/", {
        params: { search: patientSearch },
      });
      setPatientResults(response.data);
    } catch (error) {
      console.error("Patient search failed", error);
    }
  }

  function selectPatient(patient: PatientSearchResult) {
    setSelectedPatient(patient);
    setPatientResults([]);
    setMessage(null);
  }

  async function handleRegisterPatient() {
    try {
      const response = await api.post("patients/create/", {
        patient_name: registration.patient_name,
        age: Number(registration.age),
        gender: registration.gender,
        dob: registration.dob,
        phone: registration.phone,
        email: registration.email,
        blood_group: registration.blood_group,
        emergency_contact: registration.emergency_contact,
        address: registration.address,
        medical_history: registration.medical_history,
        allergies: registration.allergies,
      });

      setSelectedPatient({
        id: response.data.patient_id,
        name: response.data.name,
        age: Number(registration.age),
        gender: registration.gender,
        phone: registration.phone,
      });
      setMessage("Patient registered successfully.");
      setRegistration({
        patient_name: "",
        age: "",
        gender: "Male",
        dob: "",
        phone: "",
        email: "",
        blood_group: "A+",
        emergency_contact: "",
        address: "",
        medical_history: "",
        allergies: "",
      });
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Registration failed.");
      console.error("Register patient failed", error);
    }
  }

  async function handleCreateAppointment() {
    if (!canBookAppointment || !selectedPatient || !selectedDoctor) return;

    try {
      const response = await api.post("appointments/create/", {
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor,
        department_id: selectedDepartment,
        date: appointment.date,
        time: appointment.time,
        priority: appointment.priority,
        remarks: appointment.remarks,
      });

      setTokenInfo(
        `Token ${response.data.queue_number || response.data.token} created. Position ${response.data.queue_position || response.data.position}, estimated wait ${response.data.estimated_wait} mins.`
      );
      setMessage("Appointment booked and patient added to queue.");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Appointment creation failed.");
      console.error("Create appointment failed", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2563EB] to-[#60A5FA] text-white py-6 px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="text-lg font-extrabold">MedaQueue — Reception Desk</div>
          <div className="flex items-center gap-4">
            <div className="text-sm">🔔 Notifications</div>
            <div className="text-sm">👩 Receptionist</div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-6">
        {/* Welcome card + Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">👋 Welcome Back!</h2>
                <p className="text-slate-600">Let's keep today's appointments running smoothly.</p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-slate-500">Patients Today</div>
                    <div className="text-2xl font-bold">{loadingStats ? '—' : stats.patientsToday}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Appointments</div>
                    <div className="text-2xl font-bold">{loadingStats ? '—' : stats.appointments}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Doctors Available</div>
                    <div className="text-2xl font-bold">{loadingStats ? '—' : stats.doctorsAvailable}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Average Wait</div>
                    <div className="text-2xl font-bold">{loadingStats ? '—' : `${stats.avgWait} min`}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a href="#register" className="block rounded-lg bg-emerald-500 px-4 py-2 text-white text-sm font-semibold">➕ Register Patient</a>
                <a href="#book" className="block rounded-lg bg-sky-600 px-4 py-2 text-white text-sm font-semibold">📅 Book Appointment</a>
                <a href="#print" className="block rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold">🖨 Print Token</a>
                <a href="#doctors" className="block rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold">👨‍⚕️ Doctor Status</a>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow">
            <h3 className="font-semibold">Search Patient</h3>
            <p className="text-sm text-slate-500">Search by Name, Phone or Patient ID</p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full rounded-xl border px-4 py-3"
                placeholder="Search by name or phone"
              />
              <button
                onClick={handlePatientSearch}
                className="rounded-xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700"
                disabled={!canSearchPatient}
              >
                Search
              </button>
            </div>
            {patientResults.length > 0 && (
              <div className="mt-3 rounded-md border bg-slate-50 p-3">
                {patientResults.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.age} • {p.gender} • {p.phone}</div>
                    </div>
                    <button onClick={() => selectPatient(p)} className="text-sm text-sky-600">Select</button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        {/* Main area: left = register/search/book, right = department/doctor/book controls */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-6">
          <div>
            <div id="register" className="rounded-2xl bg-white p-6 shadow mb-6">
              <h3 className="text-lg font-semibold">➕ Register New Patient</h3>
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <input
                  value={registration.patient_name}
                  onChange={(e) => setRegistration({ ...registration, patient_name: e.target.value })}
                  placeholder="Full name"
                  className="rounded-xl border px-4 py-3"
                />
                <input
                  value={registration.phone}
                  onChange={(e) => setRegistration({ ...registration, phone: e.target.value })}
                  placeholder="Phone"
                  type="tel"
                  className="rounded-xl border px-4 py-3"
                />
                <input
                  value={registration.dob}
                  onChange={(e) => setRegistration({ ...registration, dob: e.target.value })}
                  placeholder="Date of birth"
                  type="date"
                  className="rounded-xl border px-4 py-3"
                />
                <input
                  value={registration.age}
                  onChange={(e) => setRegistration({ ...registration, age: e.target.value })}
                  placeholder="Age"
                  type="number"
                  className="rounded-xl border px-4 py-3"
                />
                <select
                  value={registration.gender}
                  onChange={(e) => setRegistration({ ...registration, gender: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <select
                  value={registration.blood_group}
                  onChange={(e) => setRegistration({ ...registration, blood_group: e.target.value })}
                  className="rounded-xl border px-4 py-3"
                >
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
                <input
                  value={registration.email}
                  onChange={(e) => setRegistration({ ...registration, email: e.target.value })}
                  placeholder="Email"
                  className="rounded-xl border px-4 py-3 col-span-2"
                />
                <input
                  value={registration.emergency_contact}
                  onChange={(e) => setRegistration({ ...registration, emergency_contact: e.target.value })}
                  placeholder="Emergency contact"
                  className="rounded-xl border px-4 py-3"
                />
                <textarea
                  value={registration.address}
                  onChange={(e) => setRegistration({ ...registration, address: e.target.value })}
                  placeholder="Address"
                  className="col-span-2 min-h-[120px] rounded-xl border px-4 py-3"
                />
                <textarea
                  value={registration.medical_history}
                  onChange={(e) => setRegistration({ ...registration, medical_history: e.target.value })}
                  placeholder="Medical history"
                  className="col-span-2 min-h-[120px] rounded-xl border px-4 py-3"
                />
                <textarea
                  value={registration.allergies}
                  onChange={(e) => setRegistration({ ...registration, allergies: e.target.value })}
                  placeholder="Allergies"
                  className="col-span-2 min-h-[120px] rounded-xl border px-4 py-3"
                />
              </div>
              <div className="mt-4">
                <button onClick={handleRegisterPatient} className="rounded-xl bg-emerald-600 px-6 py-3 text-white">Register Patient</button>
              </div>
            </div>

            <div id="recent" className="rounded-2xl bg-white p-6 shadow">
              <h3 className="text-lg font-semibold">Recent Appointments</h3>
              <div className="mt-3 text-sm text-slate-700">
                {/* placeholder recent items; could be replaced with real endpoint */}
                <div className="py-2 border-b">10:30 — Rahul Kumar — Dr Arun — Completed</div>
                <div className="py-2 border-b">11:00 — Anita Roy — Dr Meera — Waiting</div>
                <div className="py-2">11:20 — Akhil Raj — Dr Vivek — Confirmed</div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow">
              <h4 className="font-semibold">Department</h4>
              <select
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                className="w-full rounded-xl border px-4 py-3 mt-3"
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <h4 className="font-semibold">Doctor</h4>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(Number(e.target.value))}
                className="w-full rounded-xl border px-4 py-3 mt-3"
              >
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} — {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <h4 className="font-semibold">Appointment</h4>
              <label className="block text-sm text-slate-500 mt-2">Date</label>
              <input type="date" value={appointment.date} onChange={(e) => setAppointment({ ...appointment, date: e.target.value })} className="w-full rounded-xl border px-4 py-3 mt-1" />
              <label className="block text-sm text-slate-500 mt-3">Time</label>
              <input type="time" value={appointment.time} onChange={(e) => setAppointment({ ...appointment, time: e.target.value })} className="w-full rounded-xl border px-4 py-3 mt-1" />
              <label className="block text-sm text-slate-500 mt-3">Priority</label>
              <select value={appointment.priority} onChange={(e) => setAppointment({ ...appointment, priority: e.target.value })} className="w-full rounded-xl border px-4 py-3 mt-1">
                <option>Normal</option>
                <option>Urgent</option>
                <option>Emergency</option>
              </select>

              <div className="mt-4">
                <button onClick={handleCreateAppointment} disabled={!canBookAppointment} className="w-full rounded-xl bg-blue-600 px-6 py-3 text-white disabled:bg-slate-300">Create Appointment & Generate Token</button>
              </div>
              {tokenInfo && <div className="mt-3 rounded-md bg-sky-50 p-3">{tokenInfo}</div>}
              {message && <div className="mt-3 rounded-md bg-slate-50 p-3">{message}</div>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
