import { scheduleSchema } from "../lib/validation";
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
}
