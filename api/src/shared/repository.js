// Basic stub repository – replace with full DB logic later
export async function listEmployees() {
  return [];
}

export async function getSchedule(weekKey) {
  return {};
}

export async function saveSchedule(weekKey, assignments) {
  return assignments;
}

export async function upsertEmployee(emp) {
  return emp;
}

export async function softDeleteEmployee(id) {
  return;
}