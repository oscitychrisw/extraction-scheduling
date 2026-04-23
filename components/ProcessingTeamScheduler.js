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

const ROLE_OPTIONS = [
  "Crystallization",
  "Solvent Recovery",
  "Matrix Washing",
  "Shift Supervisor",
];

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

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmployee(name, competencies, shifts, notes) {
  return { id: makeId(), name, competencies, shifts, notes };
}

const seedEmployees = [
  createEmployee(
    "Drew",
    ["Shift Supervisor", "Crystallization", "Solvent Recovery", "Matrix Washing"],
    ["AM"],
    "Shift supervisor, trained in all areas, AM shift supervisor"
  ),
  createEmployee(
    "Jim",
    ["Crystallization", "Solvent Recovery", "Matrix Washing", "Shift Supervisor"],
    ["AM"],
    "Trained in all areas, AM shift only"
  ),
  createEmployee("Tiawan", ["Solvent Recovery"], ["AM"], "Solvent recovery, AM shift only"),
  createEmployee("Mark", ["Solvent Recovery"], ["PM"], "Solvent recovery, PM shift only"),
  createEmployee(
    "Michael",
    ["Crystallization", "Solvent Recovery", "Matrix Washing", "Shift Supervisor"],
    ["Overnight"],
    "Trained in all areas, overnight shift only"
  ),
  createEmployee(
    "Tyler",
    ["Crystallization", "Solvent Recovery", "Matrix Washing", "Shift Supervisor"],
    ["PM"],
    "Trained in all areas, potential PM shift supervisor"
  ),
  createEmployee(
    "Adam",
    ["Solvent Recovery", "Shift Supervisor"],
    ["Overnight"],
    "Solvent recovery, potential overnight shift supervisor"
  ),
  createEmployee(
    "Andrew",
    ["Solvent Recovery", "Matrix Washing"],
    ["AM"],
    "Solvent recovery and matrix washing, AM shift only"
  ),
  ...Array.from({ length: 7 }, (_, index) =>
    createEmployee(
      `NewHire${index + 1}`,
      ["Crystallization", "Solvent Recovery", "Matrix Washing"],
      ["AM", "PM", "Overnight"],
      "Trained in all production areas except shift supervisor"
    )
  ),
];

function buildEmptyAssignments() {
  const assignments = {};
  for (const day of DAYS) {
    assignments[day] = {};
    for (const shift of SHIFTS) {
      assignments[day][shift.id] = {};
      for (const slot of SLOT_TEMPLATE) {
        assignments[day][shift.id][slot.id] = null;
      }
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
      if (assignments[day][shift.id][slot.id] === employeeId) {
        matches.push({ shiftId: shift.id, slotId: slot.id });
      }
    }
  }
  return matches;
}

function isSameAssignmentCell(assignment, shiftId, slotId) {
  return assignment.shiftId === shiftId && assignment.slotId === slotId;
}

function wouldCreateDuplicateInShift(assignments, day, shiftId, slotId, employeeId) {
  return SLOT_TEMPLATE.some(
    (slot) => slot.id !== slotId && assignments[day][shiftId][slot.id] === employeeId
  );
}

function wouldCreateMultipleAssignmentsIn24Hours(assignments, day, shiftId, slotId, employeeId) {
  return getEmployeeAssignmentsForDay(assignments, day, employeeId).some(
    (assignment) => !isSameAssignmentCell(assignment, shiftId, slotId)
  );
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
      if (duplicateIds.length) {
        warnings.push(`${day} ${shift.label}: same employee is assigned more than once in the same shift.`);
      }

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
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorPayload = await response.json();
      message = errorPayload?.message || errorPayload?.error || message;
    } catch {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }
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
    return apiRequest(`/schedules/${encodeURIComponent(weekKey)}`, { method: "GET" });
  },
  async saveSchedule(assignments, weekKey = CURRENT_WEEK_KEY) {
    return apiRequest(`/schedules/${encodeURIComponent(weekKey)}`, {
      method: "PUT",
      body: JSON.stringify({ weekKey, assignments }),
    });
  },
  async createEmployee(employee) {
    return apiRequest(`/employees`, {
      method: "POST",
      body: JSON.stringify(employee),
    });
  },
  async updateEmployee(id, employee) {
    return apiRequest(`/employees/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(employee),
    });
  },
  async deleteEmployee(id) {
    return apiRequest(`/employees/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
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
  "lib/supabaseAdmin.js": `import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase admin environment variables.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}`,
  "lib/constants.js": `export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const SHIFTS = ["AM", "PM", "Overnight"];
export const SLOT_CODES = [
  "shift_supervisor",
  "crystallization_1",
  "crystallization_2",
  "solvent_recovery",
  "matrix_washing"
];`,
  "lib/validation.js": `import { z } from "zod";

export const employeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  notes: z.string().optional().default(""),
  competencies: z.array(z.string()).default([]),
  shifts: z.array(z.string()).default([])
});

export const scheduleSchema = z.object({
  weekKey: z.string().min(1),
  assignments: z.record(z.any())
});`,
  "lib/repository.js": `import { getSupabaseAdmin } from "./supabaseAdmin";
import { DAYS, SHIFTS, SLOT_CODES } from "./constants";

export async function listEmployees() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("employees")
    .select("id,name,notes,is_active,employee_competencies(competency_name),employee_shift_availability(shift_code)")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    notes: row.notes || "",
    competencies: (row.employee_competencies || []).map((item) => item.competency_name),
    shifts: (row.employee_shift_availability || []).map((item) => item.shift_code)
  }));
}

export async function upsertEmployee(employee) {
  const supabase = getSupabaseAdmin();

  const { error: employeeError } = await supabase.from("employees").upsert({
    id: employee.id,
    name: employee.name,
    notes: employee.notes || "",
    is_active: true
  });
  if (employeeError) throw employeeError;

  await supabase.from("employee_competencies").delete().eq("employee_id", employee.id);
  await supabase.from("employee_shift_availability").delete().eq("employee_id", employee.id);

  if ((employee.competencies || []).length) {
    const { error } = await supabase.from("employee_competencies").insert(
      employee.competencies.map((competency) => ({ employee_id: employee.id, competency_name: competency }))
    );
    if (error) throw error;
  }

  if ((employee.shifts || []).length) {
    const { error } = await supabase.from("employee_shift_availability").insert(
      employee.shifts.map((shift) => ({ employee_id: employee.id, shift_code: shift }))
    );
    if (error) throw error;
  }

  return employee;
}

export async function softDeleteEmployee(employeeId) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("employees").update({ is_active: false }).eq("id", employeeId);
  if (error) throw error;
}

export async function getSchedule(weekKey) {
  const supabase = getSupabaseAdmin();
  const base = {};
  for (const day of DAYS) {
    base[day] = {};
    for (const shift of SHIFTS) {
      base[day][shift] = {};
      for (const slot of SLOT_CODES) {
        base[day][shift][slot] = null;
      }
    }
  }

  const { data, error } = await supabase
    .from("schedule_assignments")
    .select("day_name,shift_code,slot_code,employee_id")
    .eq("week_key", weekKey);

  if (error) throw error;

  for (const row of data || []) {
    if (base[row.day_name] && base[row.day_name][row.shift_code]) {
      base[row.day_name][row.shift_code][row.slot_code] = row.employee_id;
    }
  }

  return base;
}

export async function saveSchedule(weekKey, assignments, assignedBy = null) {
  const supabase = getSupabaseAdmin();

  await supabase.from("schedule_weeks").upsert({ week_key: weekKey, status: "Draft" });
  await supabase.from("schedule_assignments").delete().eq("week_key", weekKey);

  const rows = [];
  for (const day of DAYS) {
    for (const shift of SHIFTS) {
      for (const slot of SLOT_CODES) {
        rows.push({
          week_key: weekKey,
          day_name: day,
          shift_code: shift,
          slot_code: slot,
          employee_id: assignments?.[day]?.[shift]?.[slot] || null,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString()
        });
      }
    }
  }

  const { error } = await supabase.from("schedule_assignments").insert(rows);
  if (error) throw error;
  return assignments;
}`,
  "api/bootstrap.js": `import { listEmployees, getSchedule } from "../lib/repository";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const week = req.query.week || "current";
    const [employees, assignments] = await Promise.all([
      listEmployees(),
      getSchedule(week)
    ]);
    return res.status(200).json({ employees, assignments });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}`,
  "api/employees.js": `import { employeeSchema } from "../lib/validation";
import { upsertEmployee, softDeleteEmployee } from "../lib/repository";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const employee = employeeSchema.parse(req.body);
      const saved = await upsertEmployee(employee);
      return res.status(200).json(saved);
    }

    if (req.method === "DELETE") {
      const employeeId = req.query.id;
      await softDeleteEmployee(employeeId);
      return res.status(204).end();
    }

    if (req.method === "PUT") {
      const employee = employeeSchema.parse(req.body);
      const saved = await upsertEmployee(employee);
      return res.status(200).json(saved);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}`,
  "api/schedules.js": `import { scheduleSchema } from "../lib/validation";
import { getSchedule, saveSchedule } from "../lib/repository";

export default async function handler(req, res) {
  try {
    const weekKey = req.query.weekKey || "current";

    if (req.method === "GET") {
      const assignments = await getSchedule(weekKey);
      return res.status(200).json({ weekKey, assignments });
    }

    if (req.method === "PUT") {
      const payload = scheduleSchema.parse(req.body);
      const assignments = await saveSchedule(weekKey, payload.assignments, "vercel-user");
      return res.status(200).json({ weekKey, assignments });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}`,
  "supabase/schema.sql": `create table public.employees (
  id uuid primary key,
  name text not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_competencies (
  employee_id uuid not null references public.employees(id) on delete cascade,
  competency_name text not null,
  primary key (employee_id, competency_name)
);

create table public.employee_shift_availability (
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_code text not null,
  primary key (employee_id, shift_code)
);

create table public.schedule_weeks (
  week_key text primary key,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.schedule_assignments (
  week_key text not null references public.schedule_weeks(week_key) on delete cascade,
  day_name text not null,
  shift_code text not null,
  slot_code text not null,
  employee_id uuid references public.employees(id),
  assigned_by text,
  assigned_at timestamptz,
  primary key (week_key, day_name, shift_code, slot_code)
);`,
};

function CodeBlock({ title, code, icon }) {
  const Icon = icon;
  return (
    <Card className="rounded-3xl border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="max-h-[520px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
}

function BackendPage() {
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Vercel + Supabase Backend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700">
          <div className="rounded-2xl border bg-white p-4">
            This frontend can keep calling the same API paths. The change is behind the scenes: instead of Azure Functions + Azure SQL, use Vercel API routes + Supabase Postgres.
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>GET /api/bootstrap?week=current</Badge>
              <Badge>GET /api/schedules?weekKey=current</Badge>
              <Badge>PUT /api/schedules?weekKey=current</Badge>
              <Badge>POST /api/employees</Badge>
              <Badge>PUT /api/employees</Badge>
              <Badge>DELETE /api/employees?id=...</Badge>
            </div>
          </div>
          <div className="rounded-2xl border bg-emerald-50 p-4 text-emerald-900">
            Best deployment path without Azure Portal access: GitHub → Vercel import → environment variables in Vercel → Supabase project and schema.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <CodeBlock title="package.json" code={VERCEL_FILE_SNIPPETS["package.json"]} icon={FileCode2} />
        <CodeBlock title="vercel.json" code={VERCEL_FILE_SNIPPETS["vercel.json"]} icon={Rocket} />
        <CodeBlock title=".env.local.example" code={VERCEL_FILE_SNIPPETS[".env.local.example"]} icon={Cloud} />
        <CodeBlock title="lib/supabaseAdmin.js" code={VERCEL_FILE_SNIPPETS["lib/supabaseAdmin.js"]} icon={Database} />
        <CodeBlock title="lib/constants.js" code={VERCEL_FILE_SNIPPETS["lib/constants.js"]} icon={FileCode2} />
        <CodeBlock title="lib/validation.js" code={VERCEL_FILE_SNIPPETS["lib/validation.js"]} icon={FileCode2} />
        <CodeBlock title="lib/repository.js" code={VERCEL_FILE_SNIPPETS["lib/repository.js"]} icon={Database} />
        <CodeBlock title="api/bootstrap.js" code={VERCEL_FILE_SNIPPETS["api/bootstrap.js"]} icon={Server} />
        <CodeBlock title="api/employees.js" code={VERCEL_FILE_SNIPPETS["api/employees.js"]} icon={Server} />
        <CodeBlock title="api/schedules.js" code={VERCEL_FILE_SNIPPETS["api/schedules.js"]} icon={Server} />
        <CodeBlock title="supabase/schema.sql" code={VERCEL_FILE_SNIPPETS["supabase/schema.sql"]} icon={Database} />
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
      className="max-w-[260px] cursor-grab select-none rounded-xl border-2 border-slate-200 bg-white p-2 shadow-sm transition hover:border-slate-400 hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-900">{employee.name}</div>
        <div className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">Drag</div>
      </div>
      <div className="mt-1 line-clamp-2 text-[10px] text-slate-500">{employee.notes}</div>
    </div>
  );
}

function Slot({ slot, day, shiftId, assignedEmployee, onDropEmployee, onClearSlot, isValidDraggedEmployee }) {
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
      className={`min-h-[60px] rounded-md border border-dashed p-1 transition ${
        isValidDraggedEmployee === false
          ? "border-red-300 bg-red-50"
          : isValidDraggedEmployee === true
            ? "border-emerald-400 bg-emerald-50"
            : "border-slate-300 bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-medium text-slate-800">{slot.label}</div>
        </div>
        {assignedEmployee && (
          <button
            onClick={() => onClearSlot(day, shiftId, slot.id)}
            className="text-[9px] text-slate-500 hover:text-red-600"
          >
            ×
          </button>
        )}
      </div>
      <div className="mt-1">
        {assignedEmployee ? (
          <div className="rounded border bg-white px-1.5 py-1 shadow-sm">
            <div className="truncate text-[10px] font-semibold text-slate-900">{assignedEmployee.name}</div>
          </div>
        ) : (
          <div className="rounded border bg-white/70 px-1.5 py-1 text-[10px] text-slate-400">Drop</div>
        )}
      </div>
    </div>
  );
}

function MultiSelectChips({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full border px-3 py-1 text-sm transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function PlannerPage({ employees, assignments, employeeMap, draggedEmployee, setCurrentPage, setDraggedEmployeeId, handleDropEmployee, clearSlot }) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
      <div className="min-w-0">
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader><CardTitle className="text-lg">Drag Employees</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 rounded-2xl border-2 border-slate-300 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-base font-semibold text-slate-900"><Users className="h-4 w-4" /> Drag Employees</div>
              <Button variant="outline" onClick={() => setCurrentPage("employees")} className="w-full rounded-2xl"><Settings className="mr-2 h-4 w-4" />Employee Management</Button>
              <Button variant="outline" onClick={() => setCurrentPage("info")} className="w-full rounded-2xl"><ShieldAlert className="mr-2 h-4 w-4" />Shift Information</Button>
              <div className="max-h-[82vh] min-h-[760px] overflow-y-auto pr-2">
                <div className="grid justify-start gap-1.5">
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

      <div className="min-w-0">
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5" /> Weekly Shift Planner</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-white p-2">
              <div className="min-w-[1380px] border border-slate-300 bg-white">
                <div className="grid" style={{ gridTemplateColumns: `150px repeat(${DAYS.length * SHIFTS.length}, minmax(128px, 1fr))` }}>
                  <div className="sticky left-0 z-20 border-b border-r border-slate-300 bg-slate-800 px-2 py-1.5 text-[11px] font-semibold text-white">Role / Slot</div>
                  {DAYS.flatMap((day) =>
                    SHIFTS.map((shift) => (
                      <div key={`${day}-${shift.id}-header`} className="border-b border-r border-slate-300 bg-slate-800 px-2 py-1 text-white">
                        <div className="text-[11px] font-semibold leading-tight">{day}</div>
                        <div className="text-[9px] leading-tight text-slate-200">{shift.id}</div>
                        <div className="text-[9px] leading-tight text-slate-300">{shift.time}</div>
                      </div>
                    ))
                  )}
                  {SLOT_TEMPLATE.map((slot) => (
                    <React.Fragment key={slot.id}>
                      <div className="sticky left-0 z-10 flex min-h-[68px] items-center border-b border-r border-slate-300 bg-slate-50 px-2 py-1">
                        <div>
                          <div className="text-[11px] font-semibold leading-tight text-slate-900">{slot.label}</div>
                          <div className="text-[9px] leading-tight text-slate-500">{slot.role}</div>
                        </div>
                      </div>
                      {DAYS.flatMap((day) =>
                        SHIFTS.map((shift) => (
                          <div key={`${slot.id}-${day}-${shift.id}`} className="border-b border-r border-slate-300 bg-white p-0.5">
                            <Slot
                              slot={slot}
                              day={day}
                              shiftId={shift.id}
                              assignedEmployee={employeeMap[assignments[day][shift.id][slot.id]]}
                              onDropEmployee={handleDropEmployee}
                              onClearSlot={clearSlot}
                              isValidDraggedEmployee={
                                draggedEmployee
                                  ? canAssignEmployee(assignments, draggedEmployee, day, shift.id, slot.id, slot.role)
                                  : null
                              }
                            />
                          </div>
                        ))
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoPage({ warnings, availableEmployeesByShift, setCurrentPage, scheduleStatus }) {
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Shift Information & Coverage Rules</CardTitle>
            <Button variant="outline" onClick={() => setCurrentPage("scheduler")} className="rounded-2xl"><CalendarDays className="mr-2 h-4 w-4" />Back to Planner</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600"><Cloud className="h-4 w-4" /><span>{scheduleStatus}</span></div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 rounded-2xl border bg-white p-4">
              <div className="font-semibold text-slate-900">Shift Information</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {SHIFTS.map((shift) => (
                  <div key={shift.id} className="rounded-2xl border bg-slate-50 p-3">
                    <div className="font-semibold">{shift.label}</div>
                    <div className="text-sm text-slate-600">{shift.time}</div>
                    <div className="mt-2 text-xs text-slate-500">Available employees: {availableEmployeesByShift[shift.id].map((employee) => employee.name).join(", ") || "None"}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border bg-white p-4 text-sm text-slate-700">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900"><ShieldAlert className="h-5 w-5" /> Coverage Rules</div>
              <div>Each shift requires:</div>
              <div className="flex flex-wrap gap-2">
                <Badge>2 Crystallization</Badge>
                <Badge>1 Solvent Recovery</Badge>
                <Badge>1 Matrix Washing</Badge>
                <Badge>1 Shift Supervisor</Badge>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900">Invalid drops are blocked for missing competency, wrong shift availability, duplicate assignment in the same shift, and multiple assignments for one operator in the same 24-hour operating period.</div>
              <div className="rounded-2xl border bg-slate-50 p-3">
                <div className="mb-2 font-semibold">Current warnings</div>
                <ul className="max-h-64 space-y-1 overflow-auto text-sm">
                  {warnings.length ? warnings.map((warning, index) => <li key={index}>• {warning}</li>) : <li>No issues found.</li>}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeeManagementPage({ employees, newEmployee, setNewEmployee, toggleNewEmployeeValue, addEmployee, updateEmployee, toggleEmployeeValue, setCurrentPage, persistEmployeeUpdate, persistEmployeeDelete, employeeActionState }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="rounded-3xl border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Employee Management</CardTitle>
              <p className="mt-2 text-sm text-slate-600">Add employees and maintain names, notes, shifts, and competencies here.</p>
            </div>
            <Button variant="outline" onClick={() => setCurrentPage("scheduler")} className="rounded-2xl"><ArrowLeft className="mr-2 h-4 w-4" />Back to Scheduler</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 rounded-2xl border bg-white p-4">
            <CardTitle className="text-lg">Add Employee</CardTitle>
            <div className="space-y-2"><Label>Name</Label><Input value={newEmployee.name} onChange={(event) => setNewEmployee((previous) => ({ ...previous, name: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={newEmployee.notes} onChange={(event) => setNewEmployee((previous) => ({ ...previous, notes: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Allowed Shifts</Label><MultiSelectChips options={SHIFT_OPTIONS} selected={newEmployee.shifts} onToggle={(value) => toggleNewEmployeeValue("shifts", value)} /></div>
            <div className="space-y-2"><Label>Competencies</Label><MultiSelectChips options={ROLE_OPTIONS} selected={newEmployee.competencies} onToggle={(value) => toggleNewEmployeeValue("competencies", value)} /></div>
            <Button onClick={addEmployee} className="w-full rounded-2xl" disabled={employeeActionState === "saving"}>{employeeActionState === "saving" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add Employee</Button>
          </div>
          <div className="space-y-4">
            {employees.map((employee) => (
              <div key={employee.id} className="space-y-4 rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <Input value={employee.name} onChange={(event) => updateEmployee(employee.id, "name", event.target.value)} />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => persistEmployeeUpdate(employee.id)}>Save</Button>
                    <Button variant="destructive" size="sm" onClick={() => persistEmployeeDelete(employee.id)}><Trash2 className="mr-2 h-4 w-4" />Remove</Button>
                  </div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Input value={employee.notes} onChange={(event) => updateEmployee(employee.id, "notes", event.target.value)} /></div>
                <div className="space-y-2"><Label>Allowed Shifts</Label><MultiSelectChips options={SHIFT_OPTIONS} selected={employee.shifts} onToggle={(value) => toggleEmployeeValue(employee.id, "shifts", value)} /></div>
                <div className="space-y-2"><Label>Competencies</Label><MultiSelectChips options={ROLE_OPTIONS} selected={employee.competencies} onToggle={(value) => toggleEmployeeValue(employee.id, "competencies", value)} /></div>
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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[1800px] space-y-6 p-6">
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-2xl">Processing Team Scheduler</CardTitle>
                <p className="mt-2 text-sm text-slate-600">Vercel + Supabase version. Same scheduler UI, simpler deployment path.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant={currentPage === "scheduler" ? "default" : "outline"} onClick={() => setCurrentPage("scheduler")} className="rounded-2xl"><CalendarDays className="mr-2 h-4 w-4" />Scheduler</Button>
                <Button variant={currentPage === "employees" ? "default" : "outline"} onClick={() => setCurrentPage("employees")} className="rounded-2xl"><Settings className="mr-2 h-4 w-4" />Employee Management</Button>
                <Button variant={currentPage === "backend" ? "default" : "outline"} onClick={() => setCurrentPage("backend")} className="rounded-2xl"><Server className="mr-2 h-4 w-4" />Vercel Backend</Button>
                <Button onClick={saveScheduleToApi} className="rounded-2xl" disabled={isSavingSchedule || isLoading}>{isSavingSchedule ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Schedule</Button>
                <Button variant="secondary" onClick={reloadFromApi} className="rounded-2xl" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}Reload</Button>
                <Button variant="outline" onClick={resetSchedule} className="rounded-2xl">Reset Schedule</Button>
              </div>
            </div>
            {saveMessage && <div className="text-sm font-medium text-emerald-600">{saveMessage}</div>}
          </CardHeader>
        </Card>

        {currentPage === "scheduler" && <PlannerPage employees={employees} assignments={assignments} employeeMap={employeeMap} draggedEmployee={draggedEmployee} setCurrentPage={setCurrentPage} setDraggedEmployeeId={setDraggedEmployeeId} handleDropEmployee={handleDropEmployee} clearSlot={clearSlot} />}
        {currentPage === "info" && <InfoPage warnings={warnings} availableEmployeesByShift={availableEmployeesByShift} setCurrentPage={setCurrentPage} scheduleStatus={scheduleStatus} />}
        {currentPage === "employees" && <EmployeeManagementPage employees={employees} newEmployee={newEmployee} setNewEmployee={setNewEmployee} toggleNewEmployeeValue={toggleNewEmployeeValue} addEmployee={addEmployee} updateEmployee={updateEmployee} toggleEmployeeValue={toggleEmployeeValue} setCurrentPage={setCurrentPage} persistEmployeeUpdate={persistEmployeeUpdate} persistEmployeeDelete={persistEmployeeDelete} employeeActionState={employeeActionState} />}
        {currentPage === "backend" && <BackendPage />}
      </div>
    </div>
  );
}
