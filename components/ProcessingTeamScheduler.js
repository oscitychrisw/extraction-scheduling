"use client";

import React, { useMemo, useState } from "react";

const TRAINING_BOOKING_URL = "https://bookings.cloud.microsoft/bookwithme/?anonymous&ismsaljsauthenabled=true";

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

const SOP_REGISTRY = [
  // Extraction / processing
  { id: "EX002", name: "CIP Procedures", category: "Extraction", tier: "ROLE_ENHANCING", roles: ["Crystallization", "Solvent Recovery", "Matrix Washing"], renewalDays: 365 },
  { id: "EX005", name: "Isolate Washing", category: "Extraction", tier: "ROLE_ENHANCING", roles: ["Matrix Washing"], renewalDays: 365 },
  { id: "EX010", name: "Matrix Creation", category: "Extraction", tier: "BLOCKING", roles: ["Matrix Washing"], renewalDays: 365 },
  { id: "EX011", name: "Matrix Washing", category: "Extraction", tier: "BLOCKING", roles: ["Matrix Washing"], renewalDays: 365 },
  { id: "EX012", name: "Matrix LLE Vessel Operation", category: "Extraction", tier: "BLOCKING", roles: ["Solvent Recovery"], renewalDays: 365 },
  { id: "EX013", name: "Crystallization Vessel SOPs", category: "Extraction", tier: "BLOCKING", roles: ["Crystallization"], renewalDays: 365 },

  // Facilities
  { id: "FM001", name: "Environmental Monitoring Program", category: "Facilities", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "FM002", name: "Grounds Monitoring / Premises & Security", category: "Facilities", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "FM003", name: "Control of Metals and Blades", category: "Facilities", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "FM004", name: "Pest Management Plan", category: "Facilities", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "FM005", name: "Preventive Maintenance", category: "Facilities", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "FM006", name: "Warehouse Maintenance", category: "Facilities", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "FM007", name: "Waste Management Program", category: "Facilities", tier: "COMPLIANCE", roles: [], renewalDays: 365 },

  // Logistics
  { id: "L001", name: "Approved Supplier Program", category: "Logistics", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "L002", name: "Receiving of Products & Materials", category: "Logistics", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "L003", name: "Nonconforming Product: Holding & Labeling", category: "Logistics", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "L004", name: "Shipping and Transportation", category: "Logistics", tier: "COMPLIANCE", roles: [], renewalDays: 365 },

  // Personnel
  { id: "HR001", name: "Employee Training Requirements", category: "Personnel", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "HR002", name: "Dress Code Expectations & PPE", category: "Personnel", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "HR003", name: "Job Descriptions & Performance Evaluations", category: "Personnel", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "HR004", name: "Personnel Hygiene Policy", category: "Personnel", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "HR005", name: "Employee Illness Policy & Agreement", category: "Personnel", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "HR006", name: "Visitor Procedures", category: "Personnel", tier: "COMPLIANCE", roles: [], renewalDays: 365 },

  // Production / QC
  { id: "QC000", name: "Documents Control", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC001", name: "Quality Control & Food Safety Policy", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC002", name: "Corrective Action Preventive Action (CAPA) Plan", category: "Production / QC", tier: "ROLE_ENHANCING", roles: ["Supervisor"], renewalDays: 365 },
  { id: "QC003", name: "Food Defense Plan", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC004", name: "Specifications and Master Manufacturing Record", category: "Production / QC", tier: "ROLE_ENHANCING", roles: ["Supervisor"], renewalDays: 365 },
  { id: "QC005", name: "Batch Production Record", category: "Production / QC", tier: "BLOCKING", roles: ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"], renewalDays: 365 },
  { id: "QC006", name: "Allergen Management Program", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC007", name: "Product ID and Traceback", category: "Production / QC", tier: "ROLE_ENHANCING", roles: ["Supervisor"], renewalDays: 365 },
  { id: "QC008", name: "Foreign Material Procedure", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC009", name: "Pre/Post-Op Checklist - Observational QA Checks", category: "Production / QC", tier: "BLOCKING", roles: ["Supervisor"], renewalDays: 365 },
  { id: "QC010", name: "Adverse Event Procedure", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC011", name: "Customer Complaints", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC012", name: "Crisis Management", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC013", name: "Recall Procedures", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC014", name: "Stability Testing", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC015", name: "Testing Protocol - Hemp Plant Material", category: "Production / QC", tier: "ROLE_ENHANCING", roles: ["Supervisor"], renewalDays: 365 },
  { id: "QC015A", name: "Testing Protocol - Orally Ingested Products", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC015B", name: "Testing Protocol - Oils/Concentrates", category: "Production / QC", tier: "ROLE_ENHANCING", roles: ["Supervisor", "Solvent Recovery"], renewalDays: 365 },
  { id: "QC015C", name: "Testing Protocol - Cosmetics", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC016A", name: "Labeling & Packaging for Dietary Products", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC016B", name: "Labeling & Packaging for Food Products", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC016C", name: "Labeling & Packaging for Cosmetic Products", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC016D", name: "Labeling & Packaging for Bulk Raw Flower & Extracted Oils", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC017", name: "Internal Audits", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC018", name: "Identification of Regulations", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "QC019", name: "Regulatory Visits & Addressing Citations", category: "Production / QC", tier: "COMPLIANCE", roles: [], renewalDays: 365 },

  // Preventive / sanitation / calibration
  { id: "PM001", name: "Master Sanitation Standard", category: "Production Maintenance", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
  { id: "PM002", name: "Calibration of Equipment", category: "Production Maintenance", tier: "ROLE_ENHANCING", roles: ["Supervisor", "Solvent Recovery"], renewalDays: 365 },
  { id: "PM003", name: "Storage & Control of Temperature & Humidity", category: "Production Maintenance", tier: "COMPLIANCE", roles: [], renewalDays: 365 },
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

function getSop(sopId) {
  return SOP_REGISTRY.find((sop) => sop.id === sopId);
}

function getTrainingRecord(employee, sopId) {
  return employee.training?.[sopId] || { status: "Not Trained", lastCompleted: "" };
}

function getTrainingStatus(employee, sopId) {
  const sop = getSop(sopId);
  const record = getTrainingRecord(employee, sopId);
  if (!record || record.status === "Not Trained") return "Not Trained";
  if (record.status === "Expired" || record.status === "Out of Date") return "Expired";
  if (!record.lastCompleted || !sop?.renewalDays) return record.status || "Current";

  const completed = new Date(`${record.lastCompleted}T00:00:00`);
  if (Number.isNaN(completed.getTime())) return record.status || "Current";

  const expires = new Date(completed);
  expires.setDate(expires.getDate() + sop.renewalDays);
  const now = new Date();
  const daysUntilExpiration = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiration < 0) return "Expired";
  if (daysUntilExpiration <= 30) return "Expiring Soon";
  return "Current";
}

function isSopCurrent(employee, sopId) {
  return getTrainingStatus(employee, sopId) === "Current" || getTrainingStatus(employee, sopId) === "Expiring Soon";
}

function getRequiredSopsForRole(roleCompetency, tier = "BLOCKING") {
  return SOP_REGISTRY.filter((sop) => sop.tier === tier && sop.roles.includes(roleCompetency));
}

function getMissingBlockingSops(employee, roleId) {
  const role = getRole(roleId);
  if (!employee || !role) return [];
  return getRequiredSopsForRole(role.competency, "BLOCKING").filter((sop) => !isSopCurrent(employee, sop.id));
}

function canWorkRole(employee, roleId, shiftId) {
  const role = getRole(roleId);
  if (!employee || !role) return { valid: false, reasons: ["No employee or role selected."] };

  const reasons = [];
  if (!employee.competencies?.includes(role.competency)) reasons.push(`Missing competency: ${role.competency}`);
  if (!employee.shifts?.includes(shiftId)) reasons.push(`Not available for ${shiftId} shift`);

  const missingSops = getMissingBlockingSops(employee, roleId);
  if (missingSops.length) reasons.push(`Missing current SOP training: ${missingSops.map((sop) => sop.id).join(", ")}`);

  return { valid: reasons.length === 0, reasons };
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

  if (reason === "PTO" && hoursUntilShift < 168) return { valid: false, message: "PTO coverage requests must be submitted at least 1 week before the shift." };
  if (reason === "Sick Time" && hoursUntilShift < 12) return { valid: false, message: "Sick time coverage requests must be submitted at least 12 hours before the shift." };
  return { valid: true, message: "Request meets timing requirement." };
}

function makeTraining(overrides = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const training = {};
  SOP_REGISTRY.forEach((sop) => {
    training[sop.id] = { status: "Current", lastCompleted: today };
  });
  Object.entries(overrides).forEach(([sopId, record]) => {
    training[sopId] = record;
  });
  return training;
}

const initialEmployees = [
  { id: "1", name: "Drew", notes: "AM shift supervisor", competencies: ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["AM"], training: makeTraining() },
  { id: "2", name: "Jim", notes: "AM shift only", competencies: ["Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["AM"], training: makeTraining({ QC009: { status: "Not Trained", lastCompleted: "" } }) },
  { id: "3", name: "Tiawan", notes: "Solvent recovery, AM shift only", competencies: ["Solvent Recovery"], shifts: ["AM"], training: makeTraining({ EX012: { status: "Current", lastCompleted: new Date().toISOString().slice(0, 10) } }) },
  { id: "4", name: "Mark", notes: "Solvent recovery, PM shift only", competencies: ["Solvent Recovery"], shifts: ["PM"], training: makeTraining() },
  { id: "5", name: "Michael", notes: "Overnight shift only", competencies: ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["ON"], training: makeTraining() },
  { id: "6", name: "Tyler", notes: "Potential PM shift supervisor", competencies: ["Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"], shifts: ["PM"], training: makeTraining() },
  { id: "7", name: "Adam", notes: "Potential overnight shift supervisor", competencies: ["Supervisor", "Solvent Recovery"], shifts: ["ON"], training: makeTraining({ QC009: { status: "Not Trained", lastCompleted: "" } }) },
  { id: "8", name: "Andrew", notes: "Solvent recovery and matrix washing, AM shift only", competencies: ["Solvent Recovery", "Matrix Washing"], shifts: ["AM"], training: makeTraining() },
];

function MultiToggle({ options, selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button key={option} type="button" onClick={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])} className={`rounded-full border px-3 py-1 text-xs ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}>
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
    window.setTimeout(() => setDropMessage(""), 3500);
  }

  function copyMondayToRestOfWeek() {
    const mondaySchedule = assignments?.Mon;
    if (!mondaySchedule) {
      flashDropMessage("No Monday schedule exists to copy.");
      return;
    }

    setAssignments((prev) => {
      const next = { ...prev };
      for (const day of DAYS) {
        if (day === "Mon") continue;
        next[day] = JSON.parse(JSON.stringify(mondaySchedule));
      }
      return next;
    });

    flashDropMessage("Monday schedule copied to Tuesday through Friday.");
  }

  function handleDrop(day, shift, role, empId) {
    const employee = employeeMap[empId];
    const roleInfo = getRole(role);
    const check = canWorkRole(employee, role, shift);
    if (!check.valid) {
      flashDropMessage(`${employee?.name || "Employee"} cannot be assigned to ${roleInfo?.label || role}: ${check.reasons.join("; ")}.`);
      return;
    }

    setAssignments((prev) => ({ ...prev, [day]: { ...prev[day], [shift]: { ...prev[day]?.[shift], [role]: empId } } }));
  }

  function clearSlot(day, shift, role) {
    setAssignments((prev) => ({ ...prev, [day]: { ...prev[day], [shift]: { ...prev[day]?.[shift], [role]: null } } }));
  }

  return (
    <div className="flex gap-4 p-4">
      <div className="w-1/4 max-h-[85vh] overflow-y-auto rounded-xl border bg-slate-50 p-3">
        <h2 className="mb-2 text-lg font-bold">Employees</h2>
        <p className="mb-3 text-xs text-slate-600">Invalid drops are blocked for competency, shift availability, and required SOP training.</p>
        <button onClick={copyMondayToRestOfWeek} className="mb-3 w-full rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">Copy Monday to Tue–Fri</button>
        {dropMessage && <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-800">{dropMessage}</div>}
        {employees.map((emp) => (
          <div key={emp.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", emp.id)} className="mb-2 cursor-grab rounded-lg border bg-white p-2 text-sm shadow-sm">
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
              {DAYS.flatMap((day) => SHIFTS.map((shift) => (
                <th key={day + shift.id} className="border bg-slate-900 p-1 text-center text-white">
                  <div className="font-semibold">{day}</div>
                  <div className="text-[10px] text-slate-300">{shift.label}</div>
                  <div className="text-[9px] text-slate-400">{shift.time}</div>
                </th>
              )))}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role) => (
              <tr key={role.id}>
                <td className="border bg-slate-50 p-1 font-semibold">
                  <div>{role.label}</div>
                  <div className="text-[10px] font-normal text-slate-500">Requires: {role.competency}</div>
                </td>
                {DAYS.flatMap((day) => SHIFTS.map((shift) => {
                  const assigned = assignments?.[day]?.[shift.id]?.[role.id];
                  const assignedEmployee = employeeMap[assigned];
                  const check = assigned ? canWorkRole(assignedEmployee, role.id, shift.id) : { valid: true, reasons: [] };
                  return (
                    <td key={day + shift.id + role.id} className={`h-[42px] min-w-[80px] border p-1 align-top ${check.valid ? "" : "bg-red-50"}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(day, shift.id, role.id, e.dataTransfer.getData("text/plain"))}>
                      {assigned ? (
                        <div title={check.reasons.join("; ")} className={`flex items-center justify-between rounded border px-1 py-0.5 ${check.valid ? "bg-slate-50" : "border-red-300 bg-red-100"}`}>
                          <span className="truncate font-semibold">{assignedEmployee?.name}</span>
                          <button className="ml-1 text-slate-500 hover:text-red-600" onClick={() => clearSlot(day, shift.id, role.id)}>×</button>
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  );
                }))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmployeeMaintenancePage({ employees, setEmployees }) {
  const [newEmployee, setNewEmployee] = useState({ name: "", notes: "", competencies: [], shifts: [], training: makeTraining() });

  function updateEmployee(id, field, value) {
    setEmployees((prev) => prev.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp)));
  }

  function addEmployee() {
    if (!newEmployee.name.trim()) return;
    setEmployees((prev) => [...prev, { id: makeId(), name: newEmployee.name.trim(), notes: newEmployee.notes.trim(), competencies: newEmployee.competencies, shifts: newEmployee.shifts, training: newEmployee.training || makeTraining() }]);
    setNewEmployee({ name: "", notes: "", competencies: [], shifts: [], training: makeTraining() });
  }

  function removeEmployee(id) {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  }

  return (
    <div className="p-4">
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">Add Employee</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div><label className="mb-1 block text-sm font-semibold">Name</label><input className="w-full rounded border p-2" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} /></div>
          <div><label className="mb-1 block text-sm font-semibold">Notes</label><input className="w-full rounded border p-2" value={newEmployee.notes} onChange={(e) => setNewEmployee({ ...newEmployee, notes: e.target.value })} /></div>
          <div><label className="mb-1 block text-sm font-semibold">Competencies</label><MultiToggle options={ROLE_OPTIONS} selected={newEmployee.competencies} onChange={(value) => setNewEmployee({ ...newEmployee, competencies: value })} /></div>
          <div><label className="mb-1 block text-sm font-semibold">Allowed Shifts</label><MultiToggle options={SHIFT_OPTIONS} selected={newEmployee.shifts} onChange={(value) => setNewEmployee({ ...newEmployee, shifts: value })} /></div>
        </div>
        <button onClick={addEmployee} className="mt-4 rounded bg-slate-900 px-4 py-2 text-white">Add Employee</button>
      </div>

      <div className="space-y-3">
        {employees.map((emp) => (
          <div key={emp.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex gap-3"><input className="flex-1 rounded border p-2 font-semibold" value={emp.name} onChange={(e) => updateEmployee(emp.id, "name", e.target.value)} /><button onClick={() => removeEmployee(emp.id)} className="rounded bg-red-600 px-3 py-2 text-white">Remove</button></div>
            <label className="mb-1 block text-sm font-semibold">Notes</label><input className="mb-3 w-full rounded border p-2" value={emp.notes} onChange={(e) => updateEmployee(emp.id, "notes", e.target.value)} />
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="mb-1 block text-sm font-semibold">Competencies</label><MultiToggle options={ROLE_OPTIONS} selected={emp.competencies || []} onChange={(value) => updateEmployee(emp.id, "competencies", value)} /></div>
              <div><label className="mb-1 block text-sm font-semibold">Allowed Shifts</label><MultiToggle options={SHIFT_OPTIONS} selected={emp.shifts || []} onChange={(value) => updateEmployee(emp.id, "shifts", value)} /></div>
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
    setCoverageRequests((prev) => [{ id: makeId(), ...request, status: timing.valid ? "Pending Review" : "Timing Issue", timing, plan, createdAt: new Date().toISOString() }, ...prev]);
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

function TrainingPage({ employees, setEmployees }) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || "");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const selectedEmployee = employees.find((emp) => emp.id === selectedEmployeeId) || employees[0];
  const categories = ["All", ...Array.from(new Set(SOP_REGISTRY.map((sop) => sop.category)))];
  const filteredSops = categoryFilter === "All" ? SOP_REGISTRY : SOP_REGISTRY.filter((sop) => sop.category === categoryFilter);

  function updateTrainingStatus(sopId, status) {
    if (!selectedEmployee) return;
    const today = new Date().toISOString().slice(0, 10);
    setEmployees((prev) => prev.map((emp) => emp.id === selectedEmployee.id ? { ...emp, training: { ...(emp.training || {}), [sopId]: { status, lastCompleted: status === "Current" ? today : emp.training?.[sopId]?.lastCompleted || "" } } } : emp));
  }

  const summary = useMemo(() => {
    if (!selectedEmployee) return { current: 0, expiring: 0, expired: 0, notTrained: 0 };
    return SOP_REGISTRY.reduce((acc, sop) => {
      const status = getTrainingStatus(selectedEmployee, sop.id);
      if (status === "Current") acc.current += 1;
      else if (status === "Expiring Soon") acc.expiring += 1;
      else if (status === "Expired") acc.expired += 1;
      else acc.notTrained += 1;
      return acc;
    }, { current: 0, expiring: 0, expired: 0, notTrained: 0 });
  }, [selectedEmployee]);

  return (
    <div className="p-4">
      <div className="mb-4 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-bold">Training Status</h2>
        <p className="mb-4 text-sm text-slate-600">Track SOP-level training. Blocking SOPs affect scheduling. Expired or missing blocking SOPs prevent assignment.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div><label className="mb-1 block text-sm font-semibold">Employee</label><select className="w-full rounded border p-2" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}</select></div>
          <div><label className="mb-1 block text-sm font-semibold">Category</label><select className="w-full rounded border p-2" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded bg-emerald-100 px-3 py-1 text-emerald-800">Current: {summary.current}</span>
          <span className="rounded bg-amber-100 px-3 py-1 text-amber-800">Expiring Soon: {summary.expiring}</span>
          <span className="rounded bg-red-100 px-3 py-1 text-red-800">Expired: {summary.expired}</span>
          <span className="rounded bg-slate-100 px-3 py-1 text-slate-800">Not Trained: {summary.notTrained}</span>
        </div>
      </div>

      {selectedEmployee && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-lg font-bold">{selectedEmployee.name}</h3><p className="text-sm text-slate-600">{selectedEmployee.notes}</p></div>
            <a href={TRAINING_BOOKING_URL} target="_blank" rel="noreferrer" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Schedule Training Meeting</a>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border bg-slate-100 p-2 text-left">SOP</th>
                  <th className="border bg-slate-100 p-2 text-left">Category</th>
                  <th className="border bg-slate-100 p-2 text-left">Tier</th>
                  <th className="border bg-slate-100 p-2 text-left">Applies To</th>
                  <th className="border bg-slate-100 p-2 text-left">Status</th>
                  <th className="border bg-slate-100 p-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSops.map((sop) => {
                  const status = getTrainingStatus(selectedEmployee, sop.id);
                  const issue = status !== "Current" && status !== "Expiring Soon";
                  return (
                    <tr key={sop.id}>
                      <td className="border p-2"><div className="font-semibold">{sop.id}</div><div className="text-xs text-slate-600">{sop.name}</div></td>
                      <td className="border p-2">{sop.category}</td>
                      <td className="border p-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${sop.tier === "BLOCKING" ? "bg-red-100 text-red-800" : sop.tier === "ROLE_ENHANCING" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{sop.tier}</span></td>
                      <td className="border p-2 text-xs">{sop.roles.length ? sop.roles.join(", ") : "Compliance"}</td>
                      <td className="border p-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${status === "Current" ? "bg-emerald-100 text-emerald-800" : status === "Expiring Soon" ? "bg-amber-100 text-amber-800" : status === "Expired" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>{status}</span></td>
                      <td className="border p-2">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => updateTrainingStatus(sop.id, "Current")} className="rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white">Mark Current</button>
                          <button onClick={() => updateTrainingStatus(sop.id, "Expired")} className="rounded bg-red-700 px-2 py-1 text-xs font-semibold text-white">Mark Expired</button>
                          {issue && <a href={TRAINING_BOOKING_URL} target="_blank" rel="noreferrer" className="rounded border px-2 py-1 text-xs font-semibold text-blue-700 underline">Schedule</a>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ComplianceDashboard({ employees, assignments }) {
  const employeeMap = useMemo(() => getEmployeeMap(employees), [employees]);
  const assignmentIssues = [];

  DAYS.forEach((day) => {
    SHIFTS.forEach((shift) => {
      ROLES.forEach((role) => {
        const employeeId = assignments?.[day]?.[shift.id]?.[role.id];
        if (!employeeId) return;
        const employee = employeeMap[employeeId];
        const check = canWorkRole(employee, role.id, shift.id);
        if (!check.valid) assignmentIssues.push({ day, shift: shift.id, role: role.label, employee: employee?.name || "Unknown", reasons: check.reasons });
      });
    });
  });

  const trainingIssues = employees.flatMap((employee) => SOP_REGISTRY.map((sop) => ({ employee, sop, status: getTrainingStatus(employee, sop.id) })).filter((item) => item.status === "Expired" || item.status === "Not Trained"));
  const expiringSoon = employees.flatMap((employee) => SOP_REGISTRY.map((sop) => ({ employee, sop, status: getTrainingStatus(employee, sop.id) })).filter((item) => item.status === "Expiring Soon"));

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-3">
      <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="text-sm font-semibold text-slate-500">Non-Compliant Assignments</div><div className="mt-2 text-3xl font-bold text-red-700">{assignmentIssues.length}</div></div>
      <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="text-sm font-semibold text-slate-500">Expired / Missing Training Items</div><div className="mt-2 text-3xl font-bold text-amber-700">{trainingIssues.length}</div></div>
      <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="text-sm font-semibold text-slate-500">Expiring Soon</div><div className="mt-2 text-3xl font-bold text-slate-700">{expiringSoon.length}</div></div>

      <div className="rounded-xl border bg-white p-4 shadow-sm lg:col-span-3">
        <h2 className="mb-3 text-lg font-bold">Assignment Issues</h2>
        {assignmentIssues.length === 0 ? <div className="text-sm text-slate-500">No non-compliant assignments found.</div> : (
          <div className="space-y-2">{assignmentIssues.map((issue, index) => <div key={index} className="rounded border border-red-200 bg-red-50 p-2 text-sm"><b>{issue.day} {issue.shift} / {issue.role} / {issue.employee}</b>: {issue.reasons.join("; ")}</div>)}</div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm lg:col-span-3">
        <h2 className="mb-3 text-lg font-bold">Training Items Requiring Attention</h2>
        {trainingIssues.length === 0 ? <div className="text-sm text-slate-500">No expired or missing training items.</div> : (
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full border-collapse text-sm"><thead><tr><th className="border bg-slate-100 p-2 text-left">Employee</th><th className="border bg-slate-100 p-2 text-left">SOP</th><th className="border bg-slate-100 p-2 text-left">Tier</th><th className="border bg-slate-100 p-2 text-left">Status</th></tr></thead><tbody>{trainingIssues.map((item, index) => <tr key={index}><td className="border p-2">{item.employee.name}</td><td className="border p-2"><b>{item.sop.id}</b> — {item.sop.name}</td><td className="border p-2">{item.sop.tier}</td><td className="border p-2">{item.status}</td></tr>)}</tbody></table>
          </div>
        )}
      </div>
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
        <p className="text-sm text-slate-600">Schedule employees by shift, role, competency, and SOP training status.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setPage("planner")} className={`rounded px-4 py-2 ${page === "planner" ? "bg-slate-900 text-white" : "border bg-white"}`}>Planner</button>
          <button onClick={() => setPage("employees")} className={`rounded px-4 py-2 ${page === "employees" ? "bg-slate-900 text-white" : "border bg-white"}`}>Employee Maintenance</button>
          <button onClick={() => setPage("training")} className={`rounded px-4 py-2 ${page === "training" ? "bg-slate-900 text-white" : "border bg-white"}`}>Training Status</button>
          <button onClick={() => setPage("coverage")} className={`rounded px-4 py-2 ${page === "coverage" ? "bg-slate-900 text-white" : "border bg-white"}`}>Coverage Requests</button>
          <button onClick={() => setPage("dashboard")} className={`rounded px-4 py-2 ${page === "dashboard" ? "bg-slate-900 text-white" : "border bg-white"}`}>Compliance Dashboard</button>
        </div>
      </header>

      {page === "planner" && <PlannerPage employees={employees} assignments={assignments} setAssignments={setAssignments} />}
      {page === "employees" && <EmployeeMaintenancePage employees={employees} setEmployees={setEmployees} />}
      {page === "training" && <TrainingPage employees={employees} setEmployees={setEmployees} />}
      {page === "coverage" && <CoverageRequestsPage employees={employees} assignments={assignments} coverageRequests={coverageRequests} setCoverageRequests={setCoverageRequests} />}
      {page === "dashboard" && <ComplianceDashboard employees={employees} assignments={assignments} />}
    </main>
  );
}
