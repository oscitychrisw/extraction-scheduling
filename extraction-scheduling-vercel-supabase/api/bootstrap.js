import { listEmployees, getSchedule } from "../lib/repository";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
}
