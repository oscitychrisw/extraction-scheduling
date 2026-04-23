import { getSupabaseAdmin } from "./supabaseAdmin";
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
      employee.competencies.map((competency) => ({
        employee_id: employee.id,
        competency_name: competency
      }))
    );
    if (error) throw error;
  }

  if ((employee.shifts || []).length) {
    const { error } = await supabase.from("employee_shift_availability").insert(
      employee.shifts.map((shift) => ({
        employee_id: employee.id,
        shift_code: shift
      }))
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

  const { error: weekError } = await supabase.from("schedule_weeks").upsert({ week_key: weekKey, status: "Draft" });
  if (weekError) throw weekError;

  const { error: deleteError } = await supabase.from("schedule_assignments").delete().eq("week_key", weekKey);
  if (deleteError) throw deleteError;

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
}
