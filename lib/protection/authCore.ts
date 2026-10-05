import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "protection_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a real random secret in your environment."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type Role = "ADMIN" | "CUSTOMER";

export interface SessionPayload {
  userId: string;
  role: Role;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER") return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Pure authorization check, used by requireAdmin/requireCustomer. */
export function assertRole(actualRole: Role | undefined, requiredRole: Role): void {
  if (actualRole !== requiredRole) {
    throw new AuthError(`${requiredRole} access required.`, 403);
  }
}
