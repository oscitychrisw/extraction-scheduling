"use client";

import React, { useMemo, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SHIFTS = [
  { id: "AM", label: "AM", time: "5:45–2:15", firstHalf: "5:45–9:45", secondHalf: "9:45–1:45", startHour: 5, startMinute: 45 },
  { id: "PM", label: "PM", time: "1:45–10:15", firstHalf: "1:45–5:45", secondHalf: "5:45–9:45", startHour: 13, startMinute: 45 },
  { id: "ON", label: "ON", time: "9:45–6:15", firstHalf: "9:45–1:45", secondHalf: "1:45–5:45", startHour: 21, startMinute: 45 },
];

const ROLES = [
  { id: "sup", label: "Supervisor", competency: "Supervisor" },
  { id: "cr1", label: "Crystallization 1", competency: "Crystallization" },
  { id: "cr2", label: "Crystallization 2", competency: "Crystallization" },
  { id: "sr", label: "Solvent Recovery", competency: "Solvent Recovery" },
  { id: "mw", label: "Matrix Washing", competency: "Matrix Washing" },
];

const ROLE_OPTIONS = ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"];
const SHIFT_OPTIONS = ["AM", "PM", "ON"];
const REASON_OPTIONS = ["PTO", "Sick Time"];
const TRAINING_BOOKING_URL = "https://bookings.cloud.microsoft/bookwithme/?anonymous&ismsaljsauthenabled=true";

const initialEmployees = [
  { id: "1", name: "Drew", notes: "AM shift supervisor", competencies: ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["AM"], expiredTraining: [] },
  { id: "2", name: "Jim", notes: "AM shift only", competencies: ["Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["AM"], expiredTraining: [] },
  { id: "3", name: "Tiawan", notes: "Solvent recovery, AM shift only", competencies: ["Solvent Recovery"], shifts: ["AM"], expiredTraining: [] },
  { id: "4", name: "Mark", notes: "Solvent recovery, PM shift only", competencies: ["Solvent Recovery"], shifts: ["PM"], expiredTraining: [] },
  { id: "5", name: "Michael", notes: "Overnight shift only", competencies: ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["ON"], expiredTraining: [] },
  { id: "6", name: "Tyler", notes: "Potential PM shift supervisor", competencies: ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["PM"], expiredTraining: [] },
  { id: "7", name: "Adam", notes: "Potential overnight shift supervisor", competencies: ["Supervisor", "Solvent Recovery"], shifts: ["ON"], expiredTraining: [] },
  { id: "8", name: "Andrew", notes: "Solvent recovery and matrix washing, AM shift only", competencies: ["Solvent Recovery", "Matrix Washing"], shifts: ["AM"], expiredTraining: [] },
];

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function getEmployeeMap(employees) {
  return Object.fromEntries(employees.map((e) => [e.id, e]));
}

function getRole(roleId) {
  return ROLES.find((role) => role.id === roleId);
}

function getShift(shiftId) {
  return SHIFTS.find((shift) => shift.id === shiftId);
}

function canWorkRole(employee, roleId, shiftId) {
  const role = getRole(roleId);
  if (!employee || !role) return false;
  return employee.competencies?.includes(role.competency) && employee.shifts?.includes(shiftId);
}

function getTrainingStatus(employee, competency) {
  if (!employee.competencies?.includes(competency)) return "Not Trained";
  const expired = employee.expiredTraining?.includes(competency);
  return expired ? "Out of Date" : "Current";
}

function getShiftDateTime(dateString, shiftId) {
  if (!dateString) return null;
  const shift = getShift(shiftId);
  if (!shift) return null;
  const date = new Date(`${dateString}T00:00:00`);
  date.setHours(shift.startHour, shift.startMinute, 0, 0);
  return date;
}

function getAdjacentShift(day, shiftId, direction) {
  const dayIndex = DAYS.indexOf(day);
  const shiftIndex = SHIFTS.findIndex((shift) => shift.id === shiftId);
  if (dayIndex === -1 || shiftIndex === -1) return null;

  if (direction === "previous") {
    if (shiftIndex > 0) return { day, shiftId: SHIFTS[shiftIndex - 1].id };
    if (dayIndex > 0) return { day: DAYS[dayIndex - 1], shiftId: SHIFTS[SHIFTS.length - 1].id };
    return null;
  }

  if (direction === "next") {
    if (shiftIndex < SHIFTS.length - 1) return { day, shiftId: SHIFTS[shiftIndex + 1].id };
    if (dayIndex < DAYS.length - 1) return { day: DAYS[dayIndex + 1], shiftId: SHIFTS[0].id };
    return null;
  }

  return null;
}

function buildCoveragePlan({ request, assignments, employees }) {
  const employeeMap = getEmployeeMap(employees);
  const role = getRole(request.roleId);
  const shift = getShift(request.shiftId);
  const previousShift = getAdjacentShift(request.day, request.shiftId, "previous");
  const nextShift = getAdjacentShift(request.day, request.shiftId, "next");

  const previousEmployeeId = previousShift ? assignments?.[previousShift.day]?.[previousShift.shiftId]?.[request.roleId] : null;
  const nextEmployeeId = nextShift ? assignments?.[nextShift.day]?.[nextShift.shiftId]?.[request.roleId] : null;

  return {
    roleLabel: role?.label || request.roleId,
    shiftLabel: `${request.day} ${shift?.label || request.shiftId}`,
    firstHalf: previousEmployeeId
      ? `${employeeMap[previousEmployeeId]?.name || "Unknown"} covers first half (${shift?.firstHalf || "first 4 hours"})`
      : previousShift
        ? `First half uncovered — no ${role?.label || "role"} assigned in previous shift`
        : "First half uncovered — no previous operating shift exists",
    secondHalf: nextEmployeeId
      ? `${employeeMap[nextEmployeeId]?.name || "Unknown"} covers second half (${shift?.secondHalf || "second 4 hours"})`
      : nextShift
        ? `Second half uncovered — no ${role?.label || "role"} assigned in following shift`
        : "Second half uncovered — no following operating shift exists",
    previousEmployeeId,
    nextEmployeeId,
  };
}

function validateCoverageTiming(reason, shiftDate, shiftId) {
  const shiftDateTime = getShiftDateTime(shiftDate, shiftId);
  if (!shiftDateTime) return { valid: false, message: "Select a shift date before submitting." };

  const now = new Date();
  const hoursUntilShift = (shiftDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (reason === "PTO" && hoursUntilShift < 168) {
    return { valid: false, message: "PTO coverage requests must be submitted at least 1 week before the shift." };
  }

  if (reason === "Sick Time" && hoursUntilShift < 12) {
    return { valid: false, message: "Sick time coverage requests must be submitted at least 12 hours before the shift." };
  }

  return { valid: true, message: "Request meets timing requirement." };
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
            onClick={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])}
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
  const employeeMap = useMemo(() => getEmployeeMap(employees), [employees]);
  const [dropMessage, setDropMessage] = useState("");

  function flashDropMessage(message) {
    setDropMessage(message);
    window.setTimeout(() => setDropMessage(""), 2500);
  }

  function handleDrop(day, shift, role, empId) {
    const employee = employeeMap[empId];
    const roleInfo = getRole(role);
    if (!canWorkRole(employee, role, shift)) {
      flashDropMessage(`${employee?.name || "Employee"} cannot be assigned to ${roleInfo?.label || role} on ${shift}. Missing competency or shift availability.`);
      return;
    }

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
        <p className="mb-3 text-xs text-slate-600">Drag employees into valid planner cells. Invalid competency/shift drops are blocked.</p>
        {dropMessage && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">{dropMessage}</div>}
        {employees.map((emp) => (
          <div
            key={emp.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", emp.id)}
            className="mb-2 cursor-grab rounded-lg border bg-white p-2 text-sm shadow-sm"
          >
            <div className="font-semibold">{emp.name}</div>
            <div className="text-xs text-slate-500">{emp.notes}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {(emp.competencies || []).map((item) => <span key={item} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{item}</span>)}
            </div>
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
                <td className="border bg-slate-50 p-1 font-semibold">
                  <div>{role.label}</div>
                  <div className="text-[10px] font-normal text-slate-500">Requires: {role.competency}</div>
                </td>
                {DAYS.flatMap((day) =>
                  SHIFTS.map((shift) => {
                    const assigned = assignments?.[day]?.[shift.id]?.[role.id];
                    const assignedEmployee = employeeMap[assigned];
                    const valid = assigned ? canWorkRole(assignedEmployee, role.id, shift.id) : true;
                    return (
                      <td
                        key={day + shift.id + role.id}
                        className={`h-[42px] min-w-[80px] border p-1 align-top ${valid ? "" : "bg-red-50"}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const id = e.dataTransfer.getData("text/plain");
                          handleDrop(day, shift.id, role.id, id);
                        }}
                      >
                        {assigned ? (
                          <div className={`flex items-center justify-between rounded border px-1 py-0.5 ${valid ? "bg-slate-50" : "border-red-300 bg-red-100"}`}>
                            <span className="truncate font-semibold">{assignedEmployee?.name}</span>
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
      { id: makeId(), name: newEmployee.name.trim(), notes: newEmployee.notes.trim(), competencies: newEmployee.competencies, shifts: newEmployee.shifts },
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

function CoverageRequestsPage({ employees, assignments, coverageRequests, setCoverageRequests }) {
  const [request, setRequest] = useState({ employeeId: "", reason: "PTO", shiftDate: "", day: "Mon", shiftId: "AM", roleId: "sr", notes: "" });
  const employeeMap = useMemo(() => getEmployeeMap(employees), [employees]);

  function submitRequest() {
    const timing = validateCoverageTiming(request.reason, request.shiftDate, request.shiftId);
    const plan = buildCoveragePlan({ request, assignments, employees });
    const newRequest = { id: makeId(), ...request, status: timing.valid ? "Pending Review" : "Timing Issue", timing, plan, createdAt: new Date().toISOString() };
    setCoverageRequests((prev) => [newRequest, ...prev]);
  }

  return (
    <div className="p-4">
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-bold">Coverage Request</h2>
        <p className="mb-4 text-sm text-slate-600">PTO requires 1 week notice. Sick time requires 12 hours notice. Coverage is recommended from the same station in the previous and following shifts. Bookend shifts only recommend the continuing adjacent half.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <div><label className="mb-1 block text-sm font-semibold">Requesting Employee</label><select className="w-full rounded border p-2" value={request.employeeId} onChange={(e) => setRequest({ ...request, employeeId: e.target.value })}><option value="">Select employee</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}</select></div>
          <div><label className="mb-1 block text-sm font-semibold">Reason</label><select className="w-full rounded border p-2" value={request.reason} onChange={(e) => setRequest({ ...request, reason: e.target.value })}>{REASON_OPTIONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></div>
          <div><label className="mb-1 block text-sm font-semibold">Shift Date</label><input type="date" className="w-full rounded border p-2" value={request.shiftDate} onChange={(e) => setRequest({ ...request, shiftDate: e.target.value })} /></div>
          <div><label className="mb-1 block text-sm font-semibold">Day</label><select className="w-full rounded border p-2" value={request.day} onChange={(e) => setRequest({ ...request, day: e.target.value })}>{DAYS.map((day) => <option key={day} value={day}>{day}</option>)}</select></div>
          <div><label className="mb-1 block text-sm font-semibold">Shift</label><select className="w-full rounded border p-2" value={request.shiftId} onChange={(e) => setRequest({ ...request, shiftId: e.target.value })}>{SHIFTS.map((shift) => <option key={shift.id} value={shift.id}>{shift.label} — {shift.time}</option>)}</select></div>
          <div><label className="mb-1 block text-sm font-semibold">Station / Role</label><select className="w-full rounded border p-2" value={request.roleId} onChange={(e) => setRequest({ ...request, roleId: e.target.value })}>{ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></div>
        </div>
        <div className="mt-3"><label className="mb-1 block text-sm font-semibold">Notes</label><input className="w-full rounded border p-2" value={request.notes} onChange={(e) => setRequest({ ...request, notes: e.target.value })} placeholder="Optional details" /></div>
        <button onClick={submitRequest} className="mt-4 rounded bg-slate-900 px-4 py-2 text-white">Submit Coverage Request</button>
      </div>

      <div className="space-y-3">
        {coverageRequests.length === 0 && <div className="rounded-xl border bg-white p-4 text-sm text-slate-500">No coverage requests submitted yet.</div>}
        {coverageRequests.map((item) => (
          <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="font-bold">{employeeMap[item.employeeId]?.name || "Unknown employee"} — {item.reason}</div><div className={`rounded-full px-3 py-1 text-xs font-semibold ${item.timing.valid ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{item.status}</div></div>
            <div className="text-sm text-slate-700">Requested shift: {item.shiftDate || "No date"} / {item.plan.shiftLabel} / {item.plan.roleLabel}</div>
            <div className="mt-2 rounded-lg border bg-slate-50 p-3 text-sm"><div className="font-semibold">Recommended Coverage</div><div>First half: {item.plan.firstHalf}</div><div>Second half: {item.plan.secondHalf}</div></div>
            <div className="mt-2 text-sm text-slate-600">Timing check: {item.timing.message}</div>
            {item.notes && <div className="mt-2 text-sm text-slate-600">Notes: {item.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TrainingPage({ employees }) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || "");
  const selectedEmployee = employees.find((emp) => emp.id === selectedEmployeeId) || employees[0];

  return (
    <div className="p-4">
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-bold">Training Status</h2>
        <p className="mb-4 text-sm text-slate-600">Employees can view their current training status. If a training item is out of date, they can schedule a training meeting using the booking link.</p>
        <label className="mb-1 block text-sm font-semibold">Employee</label>
        <select className="w-full max-w-md rounded border p-2" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </select>
      </div>

      {selectedEmployee && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-lg font-bold">{selectedEmployee.name}</h3><p className="text-sm text-slate-600">{selectedEmployee.notes}</p></div>
            <a href={TRAINING_BOOKING_URL} target="_blank" rel="noreferrer" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Schedule Training Meeting</a>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr><th className="border bg-slate-100 p-2 text-left">Training Area</th><th className="border bg-slate-100 p-2 text-left">Status</th><th className="border bg-slate-100 p-2 text-left">Action</th></tr>
            </thead>
            <tbody>
              {ROLE_OPTIONS.map((competency) => {
                const status = getTrainingStatus(selectedEmployee, competency);
                const issue = status !== "Current";
                return (
                  <tr key={competency}>
                    <td className="border p-2 font-semibold">{competency}</td>
                    <td className="border p-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${status === "Current" ? "bg-emerald-100 text-emerald-800" : status === "Out of Date" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{status}</span></td>
                    <td className="border p-2">{issue ? <a href={TRAINING_BOOKING_URL} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700 underline">Schedule training</a> : <span className="text-slate-400">No action needed</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProcessingTeamScheduler() {
  const [page, setPage] = useState("planner");
  const [employees, setEmployees] = useState(initialEmployees);
  const [assignments, setAssignments] = useState({});
  const [coverageRequests, setCoverageRequests] = useState([]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold">Processing Team Scheduler</h1>
        <p className="text-sm text-slate-600">Schedule employees by shift, role, and production coverage need.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setPage("planner")} className={`rounded px-4 py-2 ${page === "planner" ? "bg-slate-900 text-white" : "border bg-white"}`}>Planner</button>
          <button onClick={() => setPage("employees")} className={`rounded px-4 py-2 ${page === "employees" ? "bg-slate-900 text-white" : "border bg-white"}`}>Employee Maintenance</button>
          <button onClick={() => setPage("coverage")} className={`rounded px-4 py-2 ${page === "coverage" ? "bg-slate-900 text-white" : "border bg-white"}`}>Coverage Requests</button>
          <button onClick={() => setPage("training")} className={`rounded px-4 py-2 ${page === "training" ? "bg-slate-900 text-white" : "border bg-white"}`}>Training Status</button>
        </div>
      </header>

      {page === "planner" && <PlannerPage employees={employees} assignments={assignments} setAssignments={setAssignments} />}
      {page === "employees" && <EmployeeMaintenancePage employees={employees} setEmployees={setEmployees} />}
      {page === "coverage" && <CoverageRequestsPage employees={employees} assignments={assignments} coverageRequests={coverageRequests} setCoverageRequests={setCoverageRequests} />}
      {page === "training" && <TrainingPage employees={employees} />}
    </main>
  );
}
