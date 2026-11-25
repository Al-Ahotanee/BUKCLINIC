import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { query } from "./db";

const COOKIE = "buk_session";

export interface SessionUser {
  id: number;
  role: "student" | "doctor" | "admin";
  name: string;
  email: string;
  matric_no: string | null;
  phone: string | null;
  specialization: string | null;
  active: boolean;
}

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) {
    // Production deployments must provide JWT_SECRET. Local preview falls back
    // to a development-only key so the demo database can be explored.
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is not set");
    }
    return new TextEncoder().encode("buk-clinic-dev-secret-do-not-use-in-production");
  }
  return new TextEncoder().encode(s);
}

export async function createSession(user: { id: number; role: string }) {
  const token = await new SignJWT({ uid: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// Returns the current user row (without password) or null.
export async function getUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const rows = await query<{
      id: number;
      role: SessionUser["role"];
      name: string;
      email: string;
      matric_no: string | null;
      phone: string | null;
      specialization: string | null;
      active: boolean;
    }>("SELECT id, role, name, email, matric_no, phone, specialization, active FROM users WHERE id = $1", [
      payload.uid as number,
    ]);
    const u = rows[0];
    if (!u || !u.active) return null;
    return u;
  } catch {
    return null;
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Usage: const { user, error } = await requireRole("student");
export async function requireRole(...roles: Array<SessionUser["role"] | "">) {
  const user = await getUser();
  if (!user) return { error: fail("Not logged in", 401), user: null };
  if (roles.length && !roles.includes(user.role)) return { error: fail("Forbidden", 403), user: null };
  return { user, error: null };
}
