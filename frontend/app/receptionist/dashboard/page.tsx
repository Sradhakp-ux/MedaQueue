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
}

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
}

interface Receipt {
  token: string;
  position: number;
  doctor: string;
  department: string;
  patient: string;
  date: string;
  time: string;
  priority: string;
  estimated_wait: number;
  status: string;
  remarks: string;
}

export default function ReceptionistDashboard() {
  const [patientSearch, setPatientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | "">("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | "">("");
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
  const [appointmentData, setAppointmentData] = useState({
    date: "",
    time: "",
    priority: "Normal",
    remarks: "",
  });
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (patientSearch.trim().length >= 3) {
      const timeout = window.setTimeout(() => {
        handlePatientSearch();
      }, 250);

      return () => window.clearTimeout(timeout);
    }

    setSearchResults([]);
  }, [patientSearch]);

  const canSearchPatient = patientSearch.trim().length >= 3;
  const canCreateAppointment = useMemo(
    () =>
      !!selectedPatient &&
      !!selectedDepartment &&
      !!selectedDoctor &&
      !!appointmentData.date &&
      !!appointmentData.time,
    [selectedPatient, selectedDepartment, selectedDoctor, appointmentData]
  );

  async function loadDepartments() {
    try {
      const response = await api.get("departments/");
      setDepartments(response.data);
    } catch (error) {
      console.error("Failed to load departments", error);
      setMessage("Unable to load departments.");
    }
  }

  async function loadDoctors(departmentId: number) {
    try {
      const response = await api.get("doctors/", {
        params: { department: departmentId },
      });
      setDoctors(response.data);
    } catch (error) {
      console.error("Failed to load doctors", error);
      setDoctors([]);
      setMessage("Unable to load doctors for selected department.");
    }
  }

  async function handlePatientSearch() {
    if (!canSearchPatient) return;

    try {
      const response = await api.get("patients/search/", {
        params: { search: patientSearch },
      });
      setSearchResults(response.data);
      setMessage(response.data.length ? null : "No patients found.");
    } catch (error) {
      console.error("Patient search failed", error);
      setMessage("Patient search failed.");
    }
  }

  async function handleRegisterPatient() {
    if (!registration.patient_name.trim()) {
      setMessage("Patient name is required for registration.");
      return;
    }

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

      const newPatient: Patient = {
        id: response.data.patient_id,
        name: response.data.name,
        age: Number(registration.age),
        gender: registration.gender,
        phone: registration.phone,
      };

      setSelectedPatient(newPatient);
      setSearchResults([]);
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
      setMessage(error.response?.data?.message || "Patient registration failed.");
      console.error("Register patient failed", error);
    }
  }

  async function handleCreateAppointment() {
    if (!canCreateAppointment || !selectedPatient) return;

    try {
      const response = await api.post("appointments/create/", {
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor,
        department_id: selectedDepartment,
        date: appointmentData.date,
        time: appointmentData.time,
        priority: appointmentData.priority,
        remarks: appointmentData.remarks,
      });

      const newReceipt: Receipt = {
        token: response.data.queue_number || response.data.token,
        position: response.data.queue_position || response.data.position,
        doctor: response.data.doctor,
        department: response.data.department,
        patient: selectedPatient.name,
        date: appointmentData.date,
        time: appointmentData.time,
        priority: appointmentData.priority,
        estimated_wait: response.data.estimated_wait,
        status: "Waiting",
        remarks: appointmentData.remarks,
      };

      setReceipt(newReceipt);
      setMessage("Appointment created and patient added to the queue.");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Appointment creation failed.");
      console.error("Create appointment failed", error);
    }
  }

  function handlePrintReceipt() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <h1 className="text-3xl font-bold mb-8">Receptionist Dashboard</h1>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] print:hidden">
        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Patient Section</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Start typing patient name or phone..."
                className="w-full border rounded-lg p-3"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
              <button
                onClick={handlePatientSearch}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                disabled={!canSearchPatient}
              >
                Search
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">Type 3 or more characters to show matching patient names and phone numbers.</p>
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-3">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setSearchResults([]);
                      setMessage(null);
                    }}
                    className="flex w-full justify-between rounded-xl border px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-semibold">{patient.name}</div>
                      <div className="text-sm text-slate-500">{patient.gender} • Age {patient.age}</div>
                    </div>
                    <div className="text-sm text-slate-500">{patient.phone}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-2xl border bg-slate-50 p-4">
              <h3 className="font-semibold mb-2">Selected Patient</h3>
              {selectedPatient ? (
                <div className="space-y-1 text-slate-700">
                  <p>{selectedPatient.name}</p>
                  <p>Age {selectedPatient.age} • {selectedPatient.gender}</p>
                  <p>Phone: {selectedPatient.phone}</p>
                </div>
              ) : (
                <p className="text-slate-500">No patient selected.</p>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Register New Patient</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={registration.patient_name}
                onChange={(e) => setRegistration({ ...registration, patient_name: e.target.value })}
                placeholder="Patient Name"
                className="border p-3 rounded-lg"
              />
              <input
                value={registration.age}
                onChange={(e) => setRegistration({ ...registration, age: e.target.value })}
                placeholder="Age"
                type="number"
                className="border p-3 rounded-lg"
              />
              <select
                value={registration.gender}
                onChange={(e) => setRegistration({ ...registration, gender: e.target.value })}
                className="border p-3 rounded-lg"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              <input
                value={registration.phone}
                onChange={(e) => setRegistration({ ...registration, phone: e.target.value })}
                placeholder="Phone"
                className="border p-3 rounded-lg"
              />
              <input
                value={registration.dob}
                onChange={(e) => setRegistration({ ...registration, dob: e.target.value })}
                type="date"
                className="border p-3 rounded-lg"
              />
              <input
                value={registration.email}
                onChange={(e) => setRegistration({ ...registration, email: e.target.value })}
                placeholder="Email"
                className="border p-3 rounded-lg"
              />
              <select
                value={registration.blood_group}
                onChange={(e) => setRegistration({ ...registration, blood_group: e.target.value })}
                className="border p-3 rounded-lg"
              >
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              <input
                value={registration.emergency_contact}
                onChange={(e) => setRegistration({ ...registration, emergency_contact: e.target.value })}
                placeholder="Emergency Contact"
                className="border p-3 rounded-lg"
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
                placeholder="Medical History"
                className="col-span-2 min-h-[120px] rounded-xl border px-4 py-3"
              />
              <textarea
                value={registration.allergies}
                onChange={(e) => setRegistration({ ...registration, allergies: e.target.value })}
                placeholder="Allergies"
                className="col-span-2 min-h-[120px] rounded-xl border px-4 py-3"
              />
            </div>
            <button
              onClick={handleRegisterPatient}
              className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700"
            >
              Register Patient
            </button>
          </section>

          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Appointment Section</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">Department</label>
                <select
                  className="border p-3 rounded-lg w-full"
                  value={selectedDepartment}
                  onChange={(e) => {
                    const departmentId = Number(e.target.value);
                    setSelectedDepartment(departmentId);
                    loadDoctors(departmentId);
                  }}
                >
                  <option value="">Select Department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-700">All Departments</p>
                  <div className="mt-3 grid gap-2">
                    {departments.map((department) => (
                      <div key={department.id} className="rounded-xl bg-white px-4 py-2 text-sm text-slate-700">
                        {department.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">Doctor</label>
                <select
                  className="border p-3 rounded-lg w-full"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(Number(e.target.value))}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} — {doctor.specialization}
                    </option>
                  ))}
                </select>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-700">Doctors in selected department</p>
                  <div className="mt-3 grid gap-2">
                    {doctors.length > 0 ? (
                      doctors.map((doctor) => (
                        <div key={doctor.id} className="rounded-xl bg-white px-4 py-2 text-sm text-slate-700">
                          {doctor.name}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Select a department to view available doctors.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                type="date"
                value={appointmentData.date}
                onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
                className="border p-3 rounded-lg"
              />
              <input
                type="time"
                value={appointmentData.time}
                onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
                className="border p-3 rounded-lg"
              />
            </div>
            <div className="mt-4">
              <select
                value={appointmentData.priority}
                onChange={(e) => setAppointmentData({ ...appointmentData, priority: e.target.value })}
                className="border p-3 rounded-lg w-full"
              >
                <option>Normal</option>
                <option>Urgent</option>
                <option>Emergency</option>
              </select>
            </div>
            <textarea
              value={appointmentData.remarks}
              onChange={(e) => setAppointmentData({ ...appointmentData, remarks: e.target.value })}
              placeholder="Remarks"
              className="mt-4 min-h-[120px] w-full rounded-xl border px-4 py-3"
            />
            <button
              onClick={handleCreateAppointment}
              className="mt-6 w-full rounded-xl bg-purple-600 px-6 py-3 text-white hover:bg-purple-700 disabled:bg-slate-300"
              disabled={!canCreateAppointment}
            >
              Create Appointment
            </button>
          </section>
        </div>

        <aside className="space-y-6 rounded-xl bg-white p-6 shadow">
          <div>
            <h2 className="text-xl font-semibold mb-4">Generated Token</h2>
            {receipt ? (
              <div className="space-y-3 text-slate-700">
                <div className="rounded-2xl border p-4 bg-slate-50">
                  <p className="text-2xl font-bold">{receipt.token}</p>
                  <p className="text-sm text-slate-500">Position: {receipt.position}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-semibold">Patient:</span> {receipt.patient}</p>
                  <p><span className="font-semibold">Doctor:</span> {receipt.doctor}</p>
                  <p><span className="font-semibold">Department:</span> {receipt.department}</p>
                  <p><span className="font-semibold">Date:</span> {receipt.date}</p>
                  <p><span className="font-semibold">Time:</span> {receipt.time}</p>
                  <p><span className="font-semibold">Priority:</span> {receipt.priority}</p>
                <p><span className="font-semibold">Estimated Wait:</span> {receipt.estimated_wait} mins</p>
                <p><span className="font-semibold">Status:</span> {receipt.status}</p>
                  {receipt.remarks && <p><span className="font-semibold">Remarks:</span> {receipt.remarks}</p>}
                </div>
                <button
                  onClick={handlePrintReceipt}
                  className="mt-4 w-full rounded-xl bg-sky-600 px-6 py-3 text-white hover:bg-sky-700"
                >
                  Print Receipt
                </button>
              </div>
            ) : (
              <p className="text-slate-500">No token generated yet.</p>
            )}
          </div>

          {message && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              {message}
            </div>
          )}
        </aside>
      </div>

      {receipt && (
        <div className="hidden print:block">
          <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-300 bg-white p-8 shadow-xl">
            <div className="mb-6 rounded-3xl bg-slate-100 p-6 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">MedaQueue Token Receipt</p>
              <p className="mt-3 text-4xl font-semibold text-slate-900">{receipt.token}</p>
              <p className="mt-2 text-sm text-slate-600">Position: {receipt.position}</p>
            </div>
            <div className="space-y-4 text-slate-700">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Patient</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{receipt.patient}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Doctor</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{receipt.doctor}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Department</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{receipt.department}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Priority</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{receipt.priority}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Date</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{receipt.date}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Time</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{receipt.time}</p>
                </div>
              </div>
              {receipt.remarks && (
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Remarks</p>
                  <p className="mt-2 text-lg text-slate-900">{receipt.remarks}</p>
                </div>
              )}
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6 text-sm text-slate-500">
              <p>Printed from MedaQueue</p>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
