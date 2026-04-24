"use client";

import React, { useMemo, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SHIFTS = [
  { id: "AM", label: "AM", time: "5:45–2:15" },
  { id: "PM", label: "PM", time: "1:45–10:15" },
  { id: "ON", label: "ON", time: "9:45–6:15" },
];

const ROLES = [
  { id: "sup", label: "Supervisor" },
  { id: "cr1", label: "Crystallization 1" },
  { id: "cr2", label: "Crystallization 2" },
  { id: "sr", label: "Solvent Recovery" },
  { id: "mw", label: "Matrix Washing" },
];

const ROLE_OPTIONS = ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"];
const SHIFT_OPTIONS = ["AM", "PM", "ON"];

const initialEmployees = [
  { id: "1", name: "Drew", notes: "AM shift supervisor", competencies: ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["AM"] },
  { id: "2", name: "Jim", notes: "AM shift only", competencies: ["Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["AM"] },
  { id: "3", name: "Tiawan", notes: "Solvent recovery, AM shift only", competencies: ["Solvent Recovery"], shifts: ["AM"] },
  { id: "4", name: "Mark", notes: "Solvent recovery, PM shift only", competencies: ["Solvent Recovery"], shifts: ["PM"] },
  { id: "5", name: "Michael", notes: "Overnight shift only", competencies: ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["ON"] },
  { id: "6", name: "Tyler", notes: "Potential PM shift supervisor", competencies: ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["PM"] },
  { id: "7", name: "Adam", notes: "Potential overnight shift supervisor", competencies: ["Supervisor", "Solvent Recovery"], shifts: ["ON"] },
  { id: "8", name: "Andrew", notes: "Solvent recovery and matrix washing, AM shift only", competencies: ["Solvent Recovery", "Matrix Washing"], shifts: ["AM"] },
];

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function MultiToggle({ options, selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              onChange(active ? selected.filter((item) => item !== option) : [...selected, option]);
            }}
            className={`rounded-full border px-3 py-1 text-xs ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function PlannerPage({ employees, assignments, setAssignments }) {
  const employeeMap = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);

  function handleDrop(day, shift, role, empId) {
    setAssignments((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [shift]: {
          ...prev[day]?.[shift],
          [role]: empId,
        },
      },
    }));
  }

  function clearSlot(day, shift, role) {
    setAssignments((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [shift]: {
          ...prev[day]?.[shift],
          [role]: null,
        },
      },
    }));
  }

  return (
    <div className="flex gap-4 p-4">
      <div className="w-1/4 max-h-[85vh] overflow-y-auto rounded-xl border bg-slate-50 p-3">
        <h2 className="mb-2 text-lg font-bold">Employees</h2>
        <p className="mb-3 text-xs text-slate-600">Drag employees into the planner grid.</p>
        {employees.map((emp) => (
          <div
            key={emp.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", emp.id)}
            className="mb-2 cursor-grab rounded-lg border bg-white p-2 text-sm shadow-sm"
          >
            <div className="font-semibold">{emp.name}</div>
            <div className="text-xs text-slate-500">{emp.notes}</div>
          </div>
        ))}
      </div>

      <div className="w-3/4 overflow-auto rounded-xl border bg-white p-2">
        <table className="w-full min-w-[1200px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="border bg-slate-900 p-1 text-left text-white">Role</th>
              {DAYS.flatMap((day) =>
                SHIFTS.map((shift) => (
                  <th key={day + shift.id} className="border bg-slate-900 p-1 text-center text-white">
                    <div className="font-semibold">{day}</div>
                    <div className="text-[10px] text-slate-300">{shift.label}</div>
                    <div className="text-[9px] text-slate-400">{shift.time}</div>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role) => (
              <tr key={role.id}>
                <td className="border bg-slate-50 p-1 font-semibold">{role.label}</td>
                {DAYS.flatMap((day) =>
                  SHIFTS.map((shift) => {
                    const assigned = assignments?.[day]?.[shift.id]?.[role.id];
                    return (
                      <td
                        key={day + shift.id + role.id}
                        className="h-[42px] min-w-[80px] border p-1 align-top"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const id = e.dataTransfer.getData("text/plain");
                          handleDrop(day, shift.id, role.id, id);
                        }}
                      >
                        {assigned ? (
                          <div className="flex items-center justify-between rounded border bg-slate-50 px-1 py-0.5">
                            <span className="truncate font-semibold">{employeeMap[assigned]?.name}</span>
                            <button className="ml-1 text-slate-500 hover:text-red-600" onClick={() => clearSlot(day, shift.id, role.id)}>×</button>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmployeeMaintenancePage({ employees, setEmployees }) {
  const [newEmployee, setNewEmployee] = useState({ name: "", notes: "", competencies: [], shifts: [] });

  function updateEmployee(id, field, value) {
    setEmployees((prev) => prev.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp)));
  }

  function addEmployee() {
    if (!newEmployee.name.trim()) return;
    setEmployees((prev) => [
      ...prev,
      {
        id: makeId(),
        name: newEmployee.name.trim(),
        notes: newEmployee.notes.trim(),
        competencies: newEmployee.competencies,
        shifts: newEmployee.shifts,
      },
    ]);
    setNewEmployee({ name: "", notes: "", competencies: [], shifts: [] });
  }

  function removeEmployee(id) {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  }

  return (
    <div className="p-4">
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">Add Employee</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">Name</label>
            <input className="w-full rounded border p-2" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Notes</label>
            <input className="w-full rounded border p-2" value={newEmployee.notes} onChange={(e) => setNewEmployee({ ...newEmployee, notes: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Competencies</label>
            <MultiToggle options={ROLE_OPTIONS} selected={newEmployee.competencies} onChange={(value) => setNewEmployee({ ...newEmployee, competencies: value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Allowed Shifts</label>
            <MultiToggle options={SHIFT_OPTIONS} selected={newEmployee.shifts} onChange={(value) => setNewEmployee({ ...newEmployee, shifts: value })} />
          </div>
        </div>
        <button onClick={addEmployee} className="mt-4 rounded bg-slate-900 px-4 py-2 text-white">Add Employee</button>
      </div>

      <div className="space-y-3">
        {employees.map((emp) => (
          <div key={emp.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex gap-3">
              <input className="flex-1 rounded border p-2 font-semibold" value={emp.name} onChange={(e) => updateEmployee(emp.id, "name", e.target.value)} />
              <button onClick={() => removeEmployee(emp.id)} className="rounded bg-red-600 px-3 py-2 text-white">Remove</button>
            </div>
            <label className="mb-1 block text-sm font-semibold">Notes</label>
            <input className="mb-3 w-full rounded border p-2" value={emp.notes} onChange={(e) => updateEmployee(emp.id, "notes", e.target.value)} />
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">Competencies</label>
                <MultiToggle options={ROLE_OPTIONS} selected={emp.competencies || []} onChange={(value) => updateEmployee(emp.id, "competencies", value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Allowed Shifts</label>
                <MultiToggle options={SHIFT_OPTIONS} selected={emp.shifts || []} onChange={(value) => updateEmployee(emp.id, "shifts", value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProcessingTeamScheduler() {
  const [page, setPage] = useState("planner");
  const [employees, setEmployees] = useState(initialEmployees);
  const [assignments, setAssignments] = useState({});

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold">Processing Team Scheduler</h1>
        <p className="text-sm text-slate-600">Schedule employees by shift, role, and production coverage need.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setPage("planner")} className={`rounded px-4 py-2 ${page === "planner" ? "bg-slate-900 text-white" : "bg-white border"}`}>Planner</button>
          <button onClick={() => setPage("employees")} className={`rounded px-4 py-2 ${page === "employees" ? "bg-slate-900 text-white" : "bg-white border"}`}>Employee Maintenance</button>
        </div>
      </header>

      {page === "planner" ? (
        <PlannerPage employees={employees} assignments={assignments} setAssignments={setAssignments} />
      ) : (
        <EmployeeMaintenancePage employees={employees} setEmployees={setEmployees} />
      )}
    </main>
  );
}
