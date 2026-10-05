import { describe, expect, it } from "vitest";
import {
  incidentSchema,
  loginSchema,
  practiceStatementSchema,
  preLiveAuditSchema,
  signupSchema,
} from "@/lib/protection/validation";

describe("input validation", () => {
  it("rejects signup with a short password", () => {
    const result = signupSchema.safeParse({ email: "a@b.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects signup with an invalid email", () => {
    const result = signupSchema.safeParse({ email: "not-an-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid signup payload", () => {
    const result = signupSchema.safeParse({ email: "a@b.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("rejects login with an empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a pre-LIVE audit missing required fields", () => {
    const result = preLiveAuditSchema.safeParse({
      liveTitle: "",
      product: "Bag",
      market: "Vietnam",
      plannedDurationMins: 30,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive planned duration", () => {
    const result = preLiveAuditSchema.safeParse({
      tiktokUsername: "@acme",
      liveTitle: "Sale",
      product: "Bag",
      market: "Vietnam",
      plannedDurationMins: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty practice statement", () => {
    expect(practiceStatementSchema.safeParse({ statement: "" }).success).toBe(false);
  });

  it("rejects an incident with an invalid type", () => {
    const result = incidentSchema.safeParse({ type: "NOT_A_TYPE", description: "x" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid incident payload", () => {
    const result = incidentSchema.safeParse({ type: "WARNING", description: "Got a warning." });
    expect(result.success).toBe(true);
  });
});
