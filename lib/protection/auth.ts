import { cookies } from "next/headers";
import { prisma } from "./prisma";
import {
  assertRole,
  AuthError,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  SessionPayload,
  signSessionToken,
  verifySessionToken,
} from "./authCore";

export { hashPassword, verifyPassword, AuthError } from "./authCore";

/** Sets the session cookie. Call from a Route Handler. */
export async function createSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Loads the current session's user + customer profile. Never selects
 * passwordHash into the returned object.
 */
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      customer: true,
    },
  });
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Authentication required.", 401);
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  assertRole(user.role, "ADMIN");
  return user;
}

export async function requireCustomer() {
  const user = await requireAuth();
  if (!user.customer) throw new AuthError("No customer profile for this account.", 403);
  return user;
}
