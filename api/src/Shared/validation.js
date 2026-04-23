import { z } from "zod";

export const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().optional(),
  competencies: z.array(z.string()),
  shifts: z.array(z.string())
});

export const scheduleSchema = z.object({
  weekKey: z.string(),
  assignments: z.any()
});