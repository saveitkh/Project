import { NextResponse } from "next/server";
import { AuthError } from "./authCore";
import { ZodError } from "zod";

/** Converts a caught error into a consistent JSON error response. */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid input.", details: err.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 }
    );
  }
  if (err instanceof Error) {
    // Never leak internal error details to the client in production.
    const message =
      process.env.NODE_ENV === "production" ? "Internal server error." : err.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ error: "Unknown error." }, { status: 500 });
}
