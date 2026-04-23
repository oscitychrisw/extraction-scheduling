import { app } from "@azure/functions";

app.http("bootstrap", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "bootstrap",
  handler: async () => {
    return { jsonBody: { message: "Bootstrap endpoint working" } };
  }
});