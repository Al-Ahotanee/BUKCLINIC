import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { createSession, json, fail } from "@/lib/auth";

// Public self-registration is for STUDENTS only. Doctors are created by the admin.
export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const name = (b.name || "").trim();
  const email = (b.email || "").trim().toLowerCase();
  const password = b.password || "";
  const matric = (b.matric_no || "").trim();
  const phone = (b.phone || "").trim();

  if (name.length < 2) return fail("Enter your full name");
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Enter a valid email");
  if (password.length < 8) return fail("Password must be at least 8 characters");
  if (!matric) return fail("Matric / registration number is required");

  const dup = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (dup.length) return fail("An account with this email already exists", 409);

  const hash = await bcrypt.hash(password, 10);
  const rows = await query(
    "INSERT INTO users (role, name, email, password_hash, matric_no, phone) VALUES ('student', $1, $2, $3, $4, $5) RETURNING id, role",
    [name, email, hash, matric, phone || null]
  );
  await createSession(rows[0]);
  return json({ ok: true });
}
