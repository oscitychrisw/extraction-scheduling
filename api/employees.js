import { employeeSchema } from "../lib/validation";
import { upsertEmployee, softDeleteEmployee } from "../lib/repository";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const employee = employeeSchema.parse(req.body);
      const saved = await upsertEmployee(employee);
      return res.status(200).json(saved);
    }

    if (req.method === "PUT") {
      const employee = employeeSchema.parse(req.body);
      const saved = await upsertEmployee(employee);
      return res.status(200).json(saved);
    }

    if (req.method === "DELETE") {
      const employeeId = req.query.id;
      await softDeleteEmployee(employeeId);
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
