import type { Instrumentation } from "next";
import { logOperationalEvent } from "@/src/observability/server";

export const onRequestError: Instrumentation.onRequestError = (error, request) => {
  const digest = error && typeof error === "object" && "digest" in error ? error.digest : undefined;
  logOperationalEvent({ event: "server_error", level: "error", code: "UNHANDLED_SERVER_ERROR", route: request.path, digest });
};
