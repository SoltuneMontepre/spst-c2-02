import { ZodError } from "zod";
import { ApiError } from "@/lib/api";
import type { ServerOutbound } from "./ws-protocol";

export function dispatchError(err: unknown): ServerOutbound {
  if (err instanceof ZodError) {
    return { op: "error", code: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ" };
  }
  if (err instanceof ApiError) {
    return { op: "error", code: err.code, message: err.message };
  }
  console.error("WS dispatch error:", err);
  return { op: "error", code: "INTERNAL_ERROR" };
}
