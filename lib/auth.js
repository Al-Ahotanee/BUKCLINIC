import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { query } from "./db";

const COOKIE = "buk_session";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function createSession(user) {
  const token = await new SignJWT({ uid: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function destroySession() {
  cookies().set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// Returns the current user row (without password) or null.
export async function getUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const rows = await query(
      "SELECT id, role, name, email, matric_no, phone, specialization, active FROM users WHERE id = $1",
      [payload.uid]
    );
    const u = rows[0];
    if (!u || !u.active) return null;
    return u;
  } catch {
    return null;
  }
}

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Usage: const { user, error } = await requireRole("student");
export async function requireRole(...roles) {
  const user = await getUser();
  if (!user) return { error: fail("Not logged in", 401) };
  if (roles.length && !roles.includes(user.role)) return { error: fail("Forbidden", 403) };
  return { user };
}
