
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Plus,
  Save,
  Users,
  CalendarDays,
  ShieldAlert,
  Settings,
  ArrowLeft,
  RefreshCcw,
  Loader2,
  Cloud,
  Database,
  Server,
  FileCode2,
  Rocket,
} from "lucide-react";

const ROLE_OPTIONS = ["Crystallization", "Solvent Recovery", "Matrix Washing", "Shift Supervisor"];
const SHIFT_OPTIONS = ["AM", "PM", "Overnight"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const API_BASE = "/api";
const CURRENT_WEEK_KEY = "current";

const SHIFTS = [
  { id: "AM", label: "AM Shift", time: "5:45 AM – 2:15 PM" },
  { id: "PM", label: "PM Shift", time: "1:45 PM – 10:15 PM" },
  { id: "Overnight", label: "Overnight Shift", time: "9:45 PM – 6:15 AM" },
];

const SLOT_TEMPLATE = [
  { id: "shift_supervisor", role: "Shift Supervisor", label: "Shift Supervisor" },
  { id: "crystallization_1", role: "Crystallization", label: "Crystallization 1" },
  { id: "crystallization_2", role: "Crystallization", label: "Crystallization 2" },
  { id: "solvent_recovery", role: "Solvent Recovery", label: "Solvent Recovery" },
  { id: "matrix_washing", role: "Matrix Washing", label: "Matrix Washing" },
];

function sectionCardStyle() {
  return {
    background: "white",
    borderRadius: 24,
    boxShadow: "0 10px 20px rgba(15,23,42,.08)",
    padding: 20,
    border: "1px solid #e2e8f0",
  };
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmployee(name, competencies, shifts, notes) {
  return { id: makeId(), name, competencies, shifts, notes };
}

const seedEmployees = [
  createEmployee("Drew", ["Shift Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"], ["AM"], "Shift supervisor, trained in all areas, AM shift supervisor"),
  createEmployee("Jim", ["Crystallization", "Solvent Recovery", "Matrix Washing", "Shift Supervisor"], ["AM"], "Trained in all areas, AM shift only"),
  createEmployee("Tiawan", ["Solvent Recovery"], ["AM"], "Solvent recovery, AM shift only"),
  createEmployee("Mark", ["Solvent Recovery"], ["PM"], "Solvent recovery, PM shift only"),
  createEmployee("Michael", ["Crystallization", "Solvent Recovery", "Matrix Washing", "Shift Supervisor"], ["Overnight"], "Trained in all areas, overnight shift only"),
  createEmployee("Tyler", ["Crystallization", "Solvent Recovery", "Matrix Washing", "Shift Supervisor"], ["PM"], "Trained in all areas, potential PM shift supervisor"),
  createEmployee("Adam", ["Solvent Recovery", "Shift Supervisor"], ["Overnight"], "Solvent recovery, potential overnight shift supervisor"),
  createEmployee("Andrew", ["Solvent Recovery", "Matrix Washing"], ["AM"], "Solvent recovery and matrix washing, AM shift only"),
  ...Array.from({ length: 7 }, (_, index) =>
    createEmployee(`NewHire${index + 1}`, ["Crystallization", "Solvent Recovery", "Matrix Washing"], ["AM", "PM", "Overnight"], "Trained in all production areas except shift supervisor")
  ),
];

function buildEmptyAssignments() {
  const assignments = {};
  for (const day of DAYS) {
    assignments[day] = {};
    for (const shift of SHIFTS) {
      assignments[day][shift.id] = {};
      for (const slot of SLOT_TEMPLATE) assignments[day][shift.id][slot.id] = null;
    }
  }
  return assignments;
}

function buildInitialAssignments(employees) {
  const byName = Object.fromEntries(employees.map((employee) => [employee.name, employee.id]));
  const assignments = buildEmptyAssignments();
  for (const day of DAYS) {
    assignments[day].AM.shift_supervisor = byName.Drew || null;
    assignments[day].AM.crystallization_1 = byName.Jim || null;
    assignments[day].AM.solvent_recovery = byName.Tiawan || null;
    assignments[day].AM.matrix_washing = byName.Andrew || null;
    assignments[day].PM.crystallization_1 = byName.Tyler || null;
    assignments[day].PM.solvent_recovery = byName.Mark || null;
    assignments[day].Overnight.crystallization_1 = byName.Michael || null;
    assignments[day].Overnight.solvent_recovery = byName.Adam || null;
  }
  return assignments;
}

function normalizeEmployee(raw) {
  return {
    id: raw?.id || makeId(),
    name: raw?.name || "",
    notes: raw?.notes || "",
    competencies: Array.isArray(raw?.competencies) ? raw.competencies : [],
    shifts: Array.isArray(raw?.shifts) ? raw.shifts : [],
  };
}

function normalizeEmployees(rawEmployees) {
  if (!Array.isArray(rawEmployees)) return [];
  return rawEmployees.map(normalizeEmployee);
}

function normalizeAssignments(rawAssignments) {
  const base = buildEmptyAssignments();
  if (!rawAssignments || typeof rawAssignments !== "object") return base;
  for (const day of DAYS) {
    for (const shift of SHIFTS) {
      for (const slot of SLOT_TEMPLATE) {
        base[day][shift.id][slot.id] = rawAssignments?.[day]?.[shift.id]?.[slot.id] ?? null;
      }
    }
  }
  return base;
}

function employeeByIdMap(employees) {
  return Object.fromEntries(employees.map((employee) => [employee.id, employee]));
}

function canFillSlot(employee, shiftId, role) {
  return Boolean(employee && employee.shifts.includes(shiftId) && employee.competencies.includes(role));
}

function getEmployeeAssignmentsForDay(assignments, day, employeeId) {
  const matches = [];
  for (const shift of SHIFTS) {
    for (const slot of SLOT_TEMPLATE) {
      if (assignments[day][shift.id][slot.id] === employeeId) matches.push({ shiftId: shift.id, slotId: slot.id });
    }
  }
  return matches;
}

function isSameAssignmentCell(assignment, shiftId, slotId) {
  return assignment.shiftId === shiftId && assignment.slotId === slotId;
}

function wouldCreateDuplicateInShift(assignments, day, shiftId, slotId, employeeId) {
  return SLOT_TEMPLATE.some((slot) => slot.id !== slotId && assignments[day][shiftId][slot.id] === employeeId);
}

function wouldCreateMultipleAssignmentsIn24Hours(assignments, day, shiftId, slotId, employeeId) {
  return getEmployeeAssignmentsForDay(assignments, day, employeeId).some((assignment) => !isSameAssignmentCell(assignment, shiftId, slotId));
}

function canAssignEmployee(assignments, employee, day, shiftId, slotId, role) {
  if (!canFillSlot(employee, shiftId, role)) return false;
  if (wouldCreateDuplicateInShift(assignments, day, shiftId, slotId, employee.id)) return false;
  if (wouldCreateMultipleAssignmentsIn24Hours(assignments, day, shiftId, slotId, employee.id)) return false;
  return true;
}

function getAssignmentWarnings(assignments, employees) {
  const map = employeeByIdMap(employees);
  const warnings = [];

  for (const day of DAYS) {
    for (const shift of SHIFTS) {
      const shiftAssignments = assignments[day][shift.id];
      const usedIds = Object.values(shiftAssignments).filter(Boolean);
      const duplicateIds = usedIds.filter((id, index) => usedIds.indexOf(id) !== index);
      if (duplicateIds.length) warnings.push(`${day} ${shift.label}: same employee is assigned more than once in the same shift.`);

      for (const slot of SLOT_TEMPLATE) {
        const assignedId = shiftAssignments[slot.id];
        if (!assignedId) {
          warnings.push(`${day} ${shift.label}: ${slot.label} is unfilled.`);
          continue;
        }
        const employee = map[assignedId];
        if (!employee) {
          warnings.push(`${day} ${shift.label}: ${slot.label} has an unknown employee assigned.`);
          continue;
        }
        if (!canFillSlot(employee, shift.id, slot.role)) {
          warnings.push(`${day} ${shift.label}: ${employee.name} is not qualified or not available for ${slot.label}.`);
        }
      }
    }

    const dailyAssignments = [];
    for (const shift of SHIFTS) {
      for (const slot of SLOT_TEMPLATE) {
        const assignedId = assignments[day][shift.id][slot.id];
        if (assignedId) dailyAssignments.push(assignedId);
      }
    }

    const multipleInDay = [...new Set(dailyAssignments.filter((id, index) => dailyAssignments.indexOf(id) !== index))];
    for (const employeeId of multipleInDay) {
      const employee = map[employeeId];
      warnings.push(`${day}: ${employee?.name || "An employee"} is assigned more than once within the same 24-hour operating period.`);
    }
  }

  return warnings;
}

function runSchedulerSanityChecks() {
  const employees = [
    createEmployee("Tester A", ["Crystallization"], ["AM"], ""),
    createEmployee("Tester B", ["Shift Supervisor"], ["AM"], ""),
    createEmployee("Tester C", ["Crystallization"], ["AM", "PM"], ""),
    createEmployee("Tester D", ["Crystallization"], ["AM", "PM", "Overnight"], ""),
  ];
  const assignments = buildEmptyAssignments();
  if (!canFillSlot(employees[0], "AM", "Crystallization")) throw new Error("Sanity check failed: valid competency/shift rejected.");
  if (canFillSlot(employees[0], "PM", "Crystallization")) throw new Error("Sanity check failed: wrong shift accepted.");
  if (canFillSlot(employees[0], "AM", "Shift Supervisor")) throw new Error("Sanity check failed: wrong competency accepted.");
  assignments.Monday.AM.crystallization_1 = employees[2].id;
  if (canAssignEmployee(assignments, employees[2], "Monday", "AM", "crystallization_2", "Crystallization")) throw new Error("Sanity check failed: duplicate same-shift assignment allowed.");
  if (canAssignEmployee(assignments, employees[2], "Monday", "PM", "crystallization_1", "Crystallization")) throw new Error("Sanity check failed: duplicate same-day assignment allowed.");
  if (!canAssignEmployee(assignments, employees[3], "Monday", "PM", "crystallization_1", "Crystallization")) throw new Error("Sanity check failed: valid different employee same day rejected.");
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorPayload = await response.json();
      message = errorPayload?.message || errorPayload?.error || message;
    } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

const api = {
  async getBootstrap() {
    return apiRequest(`/bootstrap?week=${CURRENT_WEEK_KEY}`, { method: "GET" });
  },
  async getSchedule(weekKey = CURRENT_WEEK_KEY) {
    return apiRequest(`/schedules?weekKey=${encodeURIComponent(weekKey)}`, { method: "GET" });
  },
  async saveSchedule(assignments, weekKey = CURRENT_WEEK_KEY) {
    return apiRequest(`/schedules?weekKey=${encodeURIComponent(weekKey)}`, {
      method: "PUT",
      body: JSON.stringify({ weekKey, assignments }),
    });
  },
  async createEmployee(employee) {
    return apiRequest(`/employees`, { method: "POST", body: JSON.stringify(employee) });
  },
  async updateEmployee(id, employee) {
    return apiRequest(`/employees?id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(employee) });
  },
  async deleteEmployee(id) {
    return apiRequest(`/employees?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};

const VERCEL_FILE_SNIPPETS = {
  "package.json": `{
  "name": "extraction-scheduling",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.1",
    "lucide-react": "^0.511.0",
    "next": "^15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^3.24.1"
  }
}`,
  "vercel.json": `{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 10
    }
  }
}`,
  ".env.local.example": `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key`,
};

function CodeBlock({ title, code, icon }) {
  const Icon = icon;
  return (
    <Card style={sectionCardStyle()}>
      <CardHeader>
        <CardTitle style={{ fontSize: 18, fontWeight: 700, display: "flex", gap: 8, alignItems: "center" }}>
          <Icon size={18} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre style={{ maxHeight: 520, overflow: "auto", borderRadius: 16, background: "#020617", color: "#e2e8f0", padding: 16, fontSize: 12 }}>
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
}

function BackendPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <Card style={sectionCardStyle()}>
        <CardHeader><CardTitle style={{ fontSize: 22, fontWeight: 700 }}>Vercel + Supabase Backend</CardTitle></CardHeader>
        <CardContent style={{ display: "grid", gap: 16, fontSize: 14 }}>
          <div style={{ ...sectionCardStyle(), boxShadow: "none", borderRadius: 16 }}>
            This frontend calls Vercel API routes and stores data in Supabase Postgres.
          </div>
        </CardContent>
      </Card>
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <CodeBlock title="package.json" code={VERCEL_FILE_SNIPPETS["package.json"]} icon={FileCode2} />
        <CodeBlock title="vercel.json" code={VERCEL_FILE_SNIPPETS["vercel.json"]} icon={Rocket} />
        <CodeBlock title=".env.local.example" code={VERCEL_FILE_SNIPPETS[".env.local.example"]} icon={Cloud} />
      </div>
    </div>
  );
}

function EmployeeCard({ employee, onDragStart, onDragEnd }) {
  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, employee.id)}
      onDragEnd={onDragEnd}
      style={{
        maxWidth: 280,
        cursor: "grab",
        userSelect: "none",
        borderRadius: 16,
        border: "2px solid #e2e8f0",
        background: "white",
        padding: 10,
        boxShadow: "0 3px 8px rgba(15,23,42,.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{employee.name}</div>
        <div style={{ borderRadius: 999, background: "#0f172a", color: "white", padding: "2px 6px", fontSize: 9, fontWeight: 700 }}>Drag</div>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: "#64748b" }}>{employee.notes}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
        {employee.shifts.map((shift) => <Badge key={shift} variant="secondary">{shift}</Badge>)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
        {employee.competencies.map((competency) => <Badge key={competency}>{competency}</Badge>)}
      </div>
    </div>
  );
}

function Slot({ slot, day, shiftId, assignedEmployee, onDropEmployee, onClearSlot, isValidDraggedEmployee }) {
  const bg = isValidDraggedEmployee === false ? "#fef2f2" : isValidDraggedEmployee === true ? "#ecfdf5" : "#f8fafc";
  const border = isValidDraggedEmployee === false ? "#fca5a5" : isValidDraggedEmployee === true ? "#34d399" : "#cbd5e1";

  return (
    <div
      onDragOver={(event) => {
        if (isValidDraggedEmployee) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const employeeId = event.dataTransfer.getData("text/plain");
        if (employeeId) onDropEmployee(day, shiftId, slot.id, employeeId);
      }}
      style={{ minHeight: 112, borderRadius: 16, border: `1px dashed ${border}`, background: bg, padding: 12 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{slot.label}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Requires: {slot.role}</div>
        </div>
        {assignedEmployee && <button onClick={() => onClearSlot(day, shiftId, slot.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}>Clear</button>}
      </div>
      <div style={{ marginTop: 12 }}>
        {assignedEmployee ? (
          <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", background: "white", padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{assignedEmployee.name}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {assignedEmployee.shifts.map((shift) => <Badge key={shift} variant="secondary">{shift}</Badge>)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {assignedEmployee.competencies.map((competency) => <Badge key={competency}>{competency}</Badge>)}
            </div>
          </div>
        ) : (
          <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", background: "rgba(255,255,255,.7)", padding: 16, color: "#94a3b8", fontSize: 14 }}>
            Drag an employee here
          </div>
        )}
      </div>
    </div>
  );
}

function MultiSelectChips({ options, selected, onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            style={{
              borderRadius: 999,
              border: active ? "1px solid #0f172a" : "1px solid #cbd5e1",
              background: active ? "#0f172a" : "white",
              color: active ? "white" : "#334155",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function SchedulerPage({ employees, assignments, employeeMap, draggedEmployee, warnings, availableEmployeesByShift, setCurrentPage, setDraggedEmployeeId, handleDropEmployee, clearSlot, scheduleStatus }) {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <Card style={sectionCardStyle()}>
        <CardHeader><CardTitle style={{ fontSize: 20, fontWeight: 700 }}>Shift Information & Coverage Rules</CardTitle></CardHeader>
        <CardContent>
          <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center", color: "#475569", fontSize: 14 }}><Cloud size={16} /><span>{scheduleStatus}</span></div>
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0,1.1fr) minmax(0,.9fr)" }}>
            <div style={{ ...sectionCardStyle(), boxShadow: "none", borderRadius: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Shift Information</div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                {SHIFTS.map((shift) => (
                  <div key={shift.id} style={{ borderRadius: 16, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 12 }}>
                    <div style={{ fontWeight: 700 }}>{shift.label}</div>
                    <div style={{ fontSize: 14, color: "#475569" }}>{shift.time}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                      Available employees: {availableEmployeesByShift[shift.id].map((employee) => employee.name).join(", ") || "None"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...sectionCardStyle(), boxShadow: "none", borderRadius: 16, fontSize: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 18 }}><ShieldAlert size={18} /> Coverage Rules</div>
              <div style={{ marginTop: 12 }}>Each shift requires:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                <Badge>2 Crystallization</Badge><Badge>1 Solvent Recovery</Badge><Badge>1 Matrix Washing</Badge><Badge>1 Shift Supervisor</Badge>
              </div>
              <div style={{ marginTop: 12, borderRadius: 16, border: "1px solid #fde68a", background: "#fffbeb", padding: 12, color: "#92400e" }}>
                Invalid drops are blocked for missing competency, wrong shift availability, duplicate assignment in the same shift, and multiple assignments for one operator in the same 24-hour operating period.
              </div>
              <div style={{ marginTop: 12, borderRadius: 16, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 12 }}>
                <div style={{ marginBottom: 8, fontWeight: 700 }}>Current warnings</div>
                <ul style={{ maxHeight: 192, overflow: "auto", paddingLeft: 18, margin: 0 }}>
                  {warnings.length ? warnings.map((warning, index) => <li key={index} style={{ marginBottom: 4 }}>{warning}</li>) : <li>No issues found.</li>}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "340px minmax(0,1fr)", alignItems: "start" }}>
        <div>
          <Card style={sectionCardStyle()}>
            <CardHeader><CardTitle style={{ fontSize: 20, fontWeight: 700 }}>Drag Employees</CardTitle></CardHeader>
            <CardContent>
              <div style={{ borderRadius: 16, border: "2px solid #cbd5e1", background: "#f8fafc", padding: 16 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 18, fontWeight: 700 }}><Users size={18} /> Drag Employees From Here</div>
                <p style={{ fontSize: 14, color: "#475569" }}>Click and drag an employee card from this list into an open scheduler slot on the right.</p>
                <Button variant="outline" onClick={() => setCurrentPage("employees")} style={{ width: "100%", justifyContent: "center" }}>
                  <Settings size={16} />Go to Employee Management
                </Button>
                <div style={{ maxHeight: "82vh", minHeight: 760, overflowY: "auto", paddingRight: 8, marginTop: 12 }}>
                  <div style={{ display: "grid", gap: 8, justifyContent: "start" }}>
                    {employees.map((employee) => (
                      <EmployeeCard
                        key={employee.id}
                        employee={employee}
                        onDragStart={(event, id) => {
                          setDraggedEmployeeId(id);
                          event.dataTransfer.setData("text/plain", id);
                        }}
                        onDragEnd={() => setDraggedEmployeeId(null)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card style={sectionCardStyle()}>
            <CardHeader><CardTitle style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 20, fontWeight: 700 }}><CalendarDays size={18} /> Weekly Shift Planner</CardTitle></CardHeader>
            <CardContent>
              <div style={{ overflowX: "auto", borderRadius: 16, border: "1px solid #e2e8f0", background: "#f8fafc", padding: 12 }}>
                <div style={{ minWidth: 1800, borderRadius: 16, border: "1px solid #e2e8f0", background: "white" }}>
                  <div style={{ display: "grid", gridTemplateColumns: `220px repeat(${DAYS.length * SHIFTS.length}, minmax(180px, 1fr))` }}>
                    <div style={{ borderBottom: "1px solid #cbd5e1", borderRight: "1px solid #cbd5e1", background: "#0f172a", padding: 16, color: "white", fontWeight: 700 }}>Role / Slot</div>
                    {DAYS.flatMap((day) => SHIFTS.map((shift) => (
                      <div key={`${day}-${shift.id}-header`} style={{ borderBottom: "1px solid #cbd5e1", borderRight: "1px solid #cbd5e1", background: "#0f172a", padding: 12, color: "white" }}>
                        <div style={{ fontWeight: 700 }}>{day}</div>
                        <div style={{ fontSize: 12, color: "#cbd5e1" }}>{shift.label}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{shift.time}</div>
                      </div>
                    )))}
                    {SLOT_TEMPLATE.map((slot) => (
                      <React.Fragment key={slot.id}>
                        <div style={{ minHeight: 150, display: "flex", alignItems: "center", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0", background: "#f8fafc", padding: 16 }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{slot.label}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>Requires: {slot.role}</div>
                          </div>
                        </div>
                        {DAYS.flatMap((day) => SHIFTS.map((shift) => (
                          <div key={`${slot.id}-${day}-${shift.id}`} style={{ borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0", background: "white", padding: 8 }}>
                            <Slot
                              slot={slot}
                              day={day}
                              shiftId={shift.id}
                              assignedEmployee={employeeMap[assignments[day][shift.id][slot.id]]}
                              onDropEmployee={handleDropEmployee}
                              onClearSlot={clearSlot}
                              isValidDraggedEmployee={draggedEmployee ? canAssignEmployee(assignments, draggedEmployee, day, shift.id, slot.id, slot.role) : null}
                            />
                          </div>
                        )))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmployeeManagementPage({ employees, newEmployee, setNewEmployee, toggleNewEmployeeValue, addEmployee, updateEmployee, toggleEmployeeValue, setCurrentPage, persistEmployeeUpdate, persistEmployeeDelete, employeeActionState }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 24 }}>
      <Card style={sectionCardStyle()}>
        <CardHeader>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <CardTitle style={{ fontSize: 20, fontWeight: 700 }}>Employee Management</CardTitle>
              <p style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>Add employees and maintain names, notes, shifts, and competencies here.</p>
            </div>
            <Button variant="outline" onClick={() => setCurrentPage("scheduler")}><ArrowLeft size={16} />Back to Scheduler</Button>
          </div>
        </CardHeader>
        <CardContent style={{ display: "grid", gap: 24 }}>
          <div style={{ ...sectionCardStyle(), boxShadow: "none", borderRadius: 16 }}>
            <CardTitle style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Add Employee</CardTitle>
            <div style={{ display: "grid", gap: 12 }}>
              <div><Label>Name</Label><Input value={newEmployee.name} onChange={(event) => setNewEmployee((previous) => ({ ...previous, name: event.target.value }))} /></div>
              <div><Label>Notes</Label><Input value={newEmployee.notes} onChange={(event) => setNewEmployee((previous) => ({ ...previous, notes: event.target.value }))} /></div>
              <div><Label>Allowed Shifts</Label><MultiSelectChips options={SHIFT_OPTIONS} selected={newEmployee.shifts} onToggle={(value) => toggleNewEmployeeValue("shifts", value)} /></div>
              <div><Label>Competencies</Label><MultiSelectChips options={ROLE_OPTIONS} selected={newEmployee.competencies} onToggle={(value) => toggleNewEmployeeValue("competencies", value)} /></div>
              <Button onClick={addEmployee} disabled={employeeActionState === "saving"} style={{ justifyContent: "center" }}>
                {employeeActionState === "saving" ? <Loader2 size={16} /> : <Plus size={16} />}Add Employee
              </Button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {employees.map((employee) => (
              <div key={employee.id} style={{ ...sectionCardStyle(), boxShadow: "none", borderRadius: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <Input value={employee.name} onChange={(event) => updateEmployee(employee.id, "name", event.target.value)} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="outline" size="sm" onClick={() => persistEmployeeUpdate(employee.id)}>Save</Button>
                    <Button variant="destructive" size="sm" onClick={() => persistEmployeeDelete(employee.id)}><Trash2 size={14} />Remove</Button>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                  <div><Label>Notes</Label><Input value={employee.notes} onChange={(event) => updateEmployee(employee.id, "notes", event.target.value)} /></div>
                  <div><Label>Allowed Shifts</Label><MultiSelectChips options={SHIFT_OPTIONS} selected={employee.shifts} onToggle={(value) => toggleEmployeeValue(employee.id, "shifts", value)} /></div>
                  <div><Label>Competencies</Label><MultiSelectChips options={ROLE_OPTIONS} selected={employee.competencies} onToggle={(value) => toggleEmployeeValue(employee.id, "competencies", value)} /></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProcessingTeamScheduler() {
  const [currentPage, setCurrentPage] = useState("scheduler");
  const [employees, setEmployees] = useState(seedEmployees);
  const [assignments, setAssignments] = useState(() => buildInitialAssignments(seedEmployees));
  const [draggedEmployeeId, setDraggedEmployeeId] = useState(null);
  const [newEmployee, setNewEmployee] = useState({ name: "", competencies: [], shifts: [], notes: "" });
  const [saveMessage, setSaveMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [employeeActionState, setEmployeeActionState] = useState("idle");
  const [scheduleStatus, setScheduleStatus] = useState("Connected to Vercel API");
  const saveTimeoutRef = useRef(null);

  const employeeMap = useMemo(() => employeeByIdMap(employees), [employees]);
  const warnings = useMemo(() => getAssignmentWarnings(assignments, employees), [assignments, employees]);
  const draggedEmployee = useMemo(() => (draggedEmployeeId ? employeeMap[draggedEmployeeId] : null), [draggedEmployeeId, employeeMap]);
  const availableEmployeesByShift = useMemo(() => SHIFTS.reduce((accumulator, shift) => {
    accumulator[shift.id] = employees.filter((employee) => employee.shifts.includes(shift.id));
    return accumulator;
  }, {}), [employees]);

  useEffect(() => {
    runSchedulerSanityChecks();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadBootstrap() {
      setIsLoading(true);
      try {
        const payload = await api.getBootstrap();
        if (!isMounted) return;
        const nextEmployees = normalizeEmployees(payload?.employees);
        const employeesToUse = nextEmployees.length ? nextEmployees : seedEmployees;
        setEmployees(employeesToUse);
        const nextAssignments = normalizeAssignments(payload?.assignments);
        const hasAnyAssignments = DAYS.some((day) => SHIFTS.some((shift) => SLOT_TEMPLATE.some((slot) => nextAssignments[day][shift.id][slot.id])));
        setAssignments(hasAnyAssignments ? nextAssignments : buildInitialAssignments(employeesToUse));
        setScheduleStatus("Live data loaded from Vercel API");
      } catch (error) {
        if (!isMounted) return;
        setEmployees(seedEmployees);
        setAssignments(buildInitialAssignments(seedEmployees));
        setScheduleStatus(`API unavailable. Using seed data. ${error.message}`);
        flashSaveMessage(`API unavailable. Using seed data. ${error.message}`);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadBootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  function flashSaveMessage(message) {
    setSaveMessage(message);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveMessage(""), 3000);
  }

  function handleDropEmployee(day, shiftId, slotId, employeeId) {
    const employee = employeeMap[employeeId];
    const slot = SLOT_TEMPLATE.find((item) => item.id === slotId);
    if (!employee || !slot) return;
    if (!canAssignEmployee(assignments, employee, day, shiftId, slotId, slot.role)) return;
    setAssignments((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        [shiftId]: {
          ...previous[day][shiftId],
          [slotId]: employeeId,
        },
      },
    }));
    setDraggedEmployeeId(null);
  }

  function clearSlot(day, shiftId, slotId) {
    setAssignments((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        [shiftId]: {
          ...previous[day][shiftId],
          [slotId]: null,
        },
      },
    }));
  }

  function toggleNewEmployeeValue(field, value) {
    setNewEmployee((previous) => ({
      ...previous,
      [field]: previous[field].includes(value) ? previous[field].filter((item) => item !== value) : [...previous[field], value],
    }));
  }

  async function addEmployee() {
    if (!newEmployee.name.trim()) return;
    const draftEmployee = normalizeEmployee({ ...newEmployee, name: newEmployee.name.trim(), notes: newEmployee.notes.trim() });
    setEmployeeActionState("saving");
    try {
      const savedEmployee = await api.createEmployee(draftEmployee);
      setEmployees((previous) => [...previous, normalizeEmployee(savedEmployee)]);
      setNewEmployee({ name: "", competencies: [], shifts: [], notes: "" });
      flashSaveMessage("Employee saved to Vercel API.");
    } catch (error) {
      flashSaveMessage(`Failed to save employee. ${error.message}`);
    } finally {
      setEmployeeActionState("idle");
    }
  }

  function updateEmployee(id, field, value) {
    setEmployees((previous) => previous.map((employee) => (employee.id === id ? { ...employee, [field]: value } : employee)));
  }

  function toggleEmployeeValue(id, field, value) {
    setEmployees((previous) => previous.map((employee) => {
      if (employee.id !== id) return employee;
      const current = employee[field] || [];
      return {
        ...employee,
        [field]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      };
    }));
  }

  async function persistEmployeeUpdate(id) {
    const employee = employees.find((item) => item.id === id);
    if (!employee) return;
    setEmployeeActionState("saving");
    try {
      const savedEmployee = await api.updateEmployee(id, employee);
      setEmployees((previous) => previous.map((item) => (item.id === id ? normalizeEmployee(savedEmployee) : item)));
      flashSaveMessage("Employee updated in Vercel API.");
    } catch (error) {
      flashSaveMessage(`Failed to update employee. ${error.message}`);
    } finally {
      setEmployeeActionState("idle");
    }
  }

  async function persistEmployeeDelete(id) {
    setEmployeeActionState("saving");
    try {
      await api.deleteEmployee(id);
      setEmployees((previous) => previous.filter((employee) => employee.id !== id));
      setAssignments((previous) => {
        const next = JSON.parse(JSON.stringify(previous));
        for (const day of DAYS) {
          for (const shift of SHIFTS) {
            for (const slot of SLOT_TEMPLATE) {
              if (next[day][shift.id][slot.id] === id) next[day][shift.id][slot.id] = null;
            }
          }
        }
        return next;
      });
      flashSaveMessage("Employee deleted from Vercel API.");
    } catch (error) {
      flashSaveMessage(`Failed to delete employee. ${error.message}`);
    } finally {
      setEmployeeActionState("idle");
    }
  }

  async function saveScheduleToApi() {
    setIsSavingSchedule(true);
    try {
      await api.saveSchedule(assignments, CURRENT_WEEK_KEY);
      flashSaveMessage("Schedule saved to Vercel API.");
    } catch (error) {
      flashSaveMessage(`Failed to save schedule. ${error.message}`);
    } finally {
      setIsSavingSchedule(false);
    }
  }

  async function reloadFromApi() {
    setIsLoading(true);
    try {
      const [bootstrapPayload, schedulePayload] = await Promise.all([api.getBootstrap(), api.getSchedule(CURRENT_WEEK_KEY)]);
      const nextEmployees = normalizeEmployees(bootstrapPayload?.employees);
      const employeesToUse = nextEmployees.length ? nextEmployees : seedEmployees;
      setEmployees(employeesToUse);
      setAssignments(normalizeAssignments(schedulePayload?.assignments || bootstrapPayload?.assignments));
      setScheduleStatus("Live data loaded from Vercel API");
      flashSaveMessage("Data reloaded from Vercel API.");
    } catch (error) {
      flashSaveMessage(`Failed to reload data. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function resetSchedule() {
    setAssignments(buildInitialAssignments(employees));
    flashSaveMessage("Schedule reset locally. Save to publish to Vercel API.");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", color: "#0f172a" }}>
      <div style={{ maxWidth: 1800, margin: "0 auto", padding: 24, display: "grid", gap: 24 }}>
        <Card style={sectionCardStyle()}>
          <CardHeader>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <CardTitle style={{ fontSize: 28, fontWeight: 700 }}>Processing Team Scheduler</CardTitle>
                <p style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>Vercel + Supabase version. Same scheduler UI, simpler deployment path.</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Button variant={currentPage === "scheduler" ? "default" : "outline"} onClick={() => setCurrentPage("scheduler")}><CalendarDays size={16} />Scheduler</Button>
                <Button variant={currentPage === "employees" ? "default" : "outline"} onClick={() => setCurrentPage("employees")}><Settings size={16} />Employee Management</Button>
                <Button variant={currentPage === "backend" ? "default" : "outline"} onClick={() => setCurrentPage("backend")}><Server size={16} />Vercel Backend</Button>
                <Button onClick={saveScheduleToApi} disabled={isSavingSchedule || isLoading}>{isSavingSchedule ? <Loader2 size={16} /> : <Save size={16} />}Save Schedule</Button>
                <Button variant="secondary" onClick={reloadFromApi} disabled={isLoading}>{isLoading ? <Loader2 size={16} /> : <RefreshCcw size={16} />}Reload</Button>
                <Button variant="outline" onClick={resetSchedule}>Reset Schedule</Button>
              </div>
            </div>
            {saveMessage && <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: "#059669" }}>{saveMessage}</div>}
          </CardHeader>
        </Card>

        {currentPage === "scheduler" && <SchedulerPage employees={employees} assignments={assignments} employeeMap={employeeMap} draggedEmployee={draggedEmployee} warnings={warnings} availableEmployeesByShift={availableEmployeesByShift} setCurrentPage={setCurrentPage} setDraggedEmployeeId={setDraggedEmployeeId} handleDropEmployee={handleDropEmployee} clearSlot={clearSlot} scheduleStatus={scheduleStatus} />}
        {currentPage === "employees" && <EmployeeManagementPage employees={employees} newEmployee={newEmployee} setNewEmployee={setNewEmployee} toggleNewEmployeeValue={toggleNewEmployeeValue} addEmployee={addEmployee} updateEmployee={updateEmployee} toggleEmployeeValue={toggleEmployeeValue} setCurrentPage={setCurrentPage} persistEmployeeUpdate={persistEmployeeUpdate} persistEmployeeDelete={persistEmployeeDelete} employeeActionState={employeeActionState} />}
        {currentPage === "backend" && <BackendPage />}
      </div>
    </div>
  );
}
