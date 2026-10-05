import { describe, expect, it } from "vitest";
import {
  assertRole,
  AuthError,
  hashPassword,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from "@/lib/protection/authCore";

describe("authentication", () => {
  it("hashes and verifies a password round-trip", async () => {
    const hash = await hashPassword("correct-password-123");
    expect(hash).not.toBe("correct-password-123");
    expect(await verifyPassword("correct-password-123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-password-123");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("signs and verifies a session token round-trip", async () => {
    const token = await signSessionToken({ userId: "user_1", role: "CUSTOMER" });
    const payload = await verifySessionToken(token);
    expect(payload).toEqual({ userId: "user_1", role: "CUSTOMER" });
  });

  it("rejects a tampered/invalid token", async () => {
    const token = await signSessionToken({ userId: "user_1", role: "CUSTOMER" });
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifySessionToken(tampered)).toBeNull();
    expect(await verifySessionToken("not-a-jwt-at-all")).toBeNull();
  });
});

describe("authorization", () => {
  it("allows access when the role matches", () => {
    expect(() => assertRole("ADMIN", "ADMIN")).not.toThrow();
  });

  it("denies access when the role does not match, with a 403 AuthError", () => {
    try {
      assertRole("CUSTOMER", "ADMIN");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).status).toBe(403);
    }
  });

  it("denies access when no role is present (unauthenticated)", () => {
    expect(() => assertRole(undefined, "ADMIN")).toThrow(AuthError);
  });
});
