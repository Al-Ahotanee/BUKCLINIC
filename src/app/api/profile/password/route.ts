import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { requireRole, json, fail } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Change password: { current_password, new_password }
export async function POST(req: Request) {
  const { user, error } = await requireRole();
  if (error) return error;

  const b = (await req.json().catch(() => ({}))) as { current_password?: string; new_password?: string };
  const current = b.current_password || "";
  const next = b.new_password || "";
  if (!current) return fail("Enter your current password");
  if (next.length < 8) return fail("New password must be at least 8 characters");
  if (next === current) return fail("New password must be different from the current one");

  const rows = await query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [user!.id]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(current, u.password_hash))) {
    return fail("Current password is incorrect", 403);
  }

  const hash = await bcrypt.hash(next, 10);
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, user!.id]);
  return json({ ok: true });
}
