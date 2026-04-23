import { app } from "@azure/functions";
import { listEmployees, getSchedule } from "../shared/repository.js";
import { errorResponse, json } from "../shared/http.js";

app.http("bootstrap", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "bootstrap",
  handler: async (request) => {
    try {
      const week = request.query.get("week") || "current";
      const [employees, assignments] = await Promise.all([
        listEmployees(),
        getSchedule(week),
      ]);
      return json(200, { employees, assignments });
    } catch (error) {
      return errorResponse(error);
    }
  },
});
