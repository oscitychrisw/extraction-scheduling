import { app } from "@azure/functions";

app.http("schedules", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "schedules/{weekKey}",
  handler: async (req) => {
    return { jsonBody: { week: req.params.weekKey } };
  }
});