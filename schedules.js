import { z } from "zod";
import { DAYS, SHIFTS, SLOT_CODES } from "./constants.js";

export const employeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  notes: z.string().optional().default(""),
  competencies: z.array(z.string()).default([]),
  shifts: z.array(z.enum(SHIFTS)).default([]),
});

const assignmentsShape = Object.fromEntries(
  DAYS.map((day) => [
    day,
    z.object(
      Object.fromEntries(
        SHIFTS.map((shift) => [
          shift,
          z.object(
            Object.fromEntries(SLOT_CODES.map((slot) => [slot, z.string().uuid().nullable()])),
          ),
        ]),
      ),
    ),
  ]),
);

export const scheduleSchema = z.object({
  weekKey: z.string().min(1),
  assignments: z.object(assignmentsShape),
});
