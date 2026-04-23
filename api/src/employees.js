import { app } from "@azure/functions";

app.http("employees", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "employees",
  handler: async () => {
    return { jsonBody: [] };
  }
});