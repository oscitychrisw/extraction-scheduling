import { DAYS, SHIFTS, SLOT_CODES } from "./constants.js";

export function buildEmptyAssignments() {
  const assignments = {};
  for (const day of DAYS) {
    assignments[day] = {};
    for (const shift of SHIFTS) {
      assignments[day][shift] = {};
      for (const slot of SLOT_CODES) {
        assignments[day][shift][slot] = null;
      }
    }
  }
  return assignments;
}

export function normalizeAssignments(rawAssignments) {
  const base = buildEmptyAssignments();
  if (!rawAssignments || typeof rawAssignments !== "object") {
    return base;
  }

  for (const day of DAYS) {
    for (const shift of SHIFTS) {
      for (const slot of SLOT_CODES) {
        const value = rawAssignments?.[day]?.[shift]?.[slot] ?? null;
        base[day][shift][slot] = value;
      }
    }
  }

  return base;
}
