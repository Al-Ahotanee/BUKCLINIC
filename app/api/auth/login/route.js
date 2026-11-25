import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { createSession, json, fail } from "@/lib/auth";

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const email = (b.email || "").trim().toLowerCase();
  const password = b.password || "";
  if (!email || !password) return fail("Email and password are required");

  const rows = await query(
    "SELECT id, role, password_hash, active FROM users WHERE email = $1",
    [email]
  );
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password, u.password_hash))) {
    return fail("Invalid email or password", 401);
  }
  if (!u.active) return fail("This account has been deactivated", 403);

  await createSession(u);
  return json({ ok: true, role: u.role });
}
