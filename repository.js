export function json(status, jsonBody) {
  return {
    status,
    jsonBody,
  };
}

export function errorResponse(error, status = 500) {
  return json(status, {
    error: error?.message || "Unknown server error",
  });
}
