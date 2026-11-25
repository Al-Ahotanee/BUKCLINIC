import { query } from "@/lib/db";
import { requireRole, json, fail } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Any role may update their own phone number: { phone }
export async function PATCH(req: Request) {
  const { user, error } = await requireRole();
  if (error) return error;

  const b = (await req.json().catch(() => ({}))) as { phone?: string };
  const phone = (b.phone || "").trim();
  if (phone && !/^[\d+\-\s()]{6,20}$/.test(phone)) {
    return fail("Enter a valid phone number");
  }
  await query("UPDATE users SET phone = $1 WHERE id = $2", [phone || null, user!.id]);
  return json({ ok: true, phone: phone || null });
}
