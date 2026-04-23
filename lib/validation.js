import { z } from "zod";

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
});
