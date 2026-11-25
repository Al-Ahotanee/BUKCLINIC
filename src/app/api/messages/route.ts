import { query } from "@/lib/db";
import { requireRole, json, fail } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Students may only message doctors; doctors may only message students.
async function allowedPeer(user: { id: number; role: string }, peerId: number) {
  const wantRole = user.role === "student" ? "doctor" : "student";
  const r = await query("SELECT id FROM users WHERE id = $1 AND role = $2 AND active = TRUE", [peerId, wantRole]);
  return r.length > 0;
}

// GET /api/messages?with=<userId>  -> conversation (and marks incoming as read)
export async function GET(req: Request) {
  const { user, error } = await requireRole("student", "doctor");
  if (error) return error;

  const peer = Number(new URL(req.url).searchParams.get("with"));
  if (!peer || !(await allowedPeer(user!, peer))) return fail("Invalid contact", 400);

  await query("UPDATE messages SET read_at = NOW() WHERE sender_id = $1 AND receiver_id = $2 AND read_at IS NULL", [
    peer,
    user!.id,
  ]);
  const rows = await query<{
    id: number;
    sender_id: number;
    receiver_id: number;
    body: string;
    created_at: string;
  }>(
    `SELECT id, sender_id, receiver_id, body, created_at
     FROM messages
     WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at ASC LIMIT 500`,
    [user!.id, peer]
  );
  return json({ messages: rows, me: user!.id });
}

// POST { to, body }
export async function POST(req: Request) {
  const { user, error } = await requireRole("student", "doctor");
  if (error) return error;

  const b = (await req.json().catch(() => ({}))) as { to?: number; body?: string };
  const to = Number(b.to);
  const body = (b.body || "").trim();
  if (!to || !(await allowedPeer(user!, to))) return fail("Invalid recipient");
  if (!body) return fail("Message cannot be empty");
  if (body.length > 2000) return fail("Message is too long (max 2000 characters)");

  await query("INSERT INTO messages (sender_id, receiver_id, body) VALUES ($1, $2, $3)", [user!.id, to, body]);
  return json({ ok: true }, 201);
}
