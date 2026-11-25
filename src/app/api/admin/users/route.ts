import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { requireRole, json, fail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireRole("admin");
  if (error) return error;
  const users = await query(
    "SELECT id, role, name, email, matric_no, phone, specialization, active, created_at FROM users ORDER BY role, name"
  );
  return json({ users });
}

// Admin creates a doctor account: { name, email, password, specialization }
export async function POST(req: Request) {
  const { error } = await requireRole("admin");
  if (error) return error;

  const b = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
    specialization?: string;
  };
  const name = (b.name || "").trim();
  const email = (b.email || "").trim().toLowerCase();
  const password = b.password || "";
  const spec = (b.specialization || "").trim();
  if (name.length < 2) return fail("Enter the doctor's name");
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Enter a valid email");
  if (password.length < 8) return fail("Password must be at least 8 characters");

  const dup = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (dup.length) return fail("Email already in use", 409);

  const hash = await bcrypt.hash(password, 10);
  const rows = await query<{ id: number }>(
    "INSERT INTO users (role, name, email, password_hash, specialization) VALUES ('doctor', $1, $2, $3, $4) RETURNING id",
    [name, email, hash, spec || null]
  );
  return json({ ok: true, id: rows[0].id }, 201);
}

// Activate / deactivate: { id, active }
export async function PATCH(req: Request) {
  const { user, error } = await requireRole("admin");
  if (error) return error;
  const b = (await req.json().catch(() => ({}))) as { id?: number; active?: boolean };
  const id = Number(b.id);
  if (!id) return fail("id required");
  if (id === user!.id) return fail("You cannot deactivate your own account");
  await query("UPDATE users SET active = $1 WHERE id = $2", [!!b.active, id]);
  return json({ ok: true });
}
