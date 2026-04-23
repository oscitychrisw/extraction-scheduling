import { app } from "@azure/functions";
import { getSchedule, saveSchedule } from "../shared/repository.js";
import { scheduleSchema } from "../shared/validation.js";

app.http("getSchedule", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "schedules/{weekKey}",
  handler: async (request) => {
    const weekKey = request.params.weekKey || "current";
    const assignments = await getSchedule(weekKey);
    return { jsonBody: { weekKey, assignments } };
  }
});

app.http("saveSchedule", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "schedules/{weekKey}",
  handler: async (request) => {
    const payload = scheduleSchema.parse(await request.json());
    const weekKey = request.params.weekKey || payload.weekKey;
    const assignments = await saveSchedule(weekKey, payload.assignments, "system");
    return { jsonBody: { weekKey, assignments } };
  }
});
