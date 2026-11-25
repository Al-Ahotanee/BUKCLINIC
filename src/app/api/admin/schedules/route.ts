import { query } from "@/lib/db";
import { requireRole, json, fail } from "@/lib/auth";
import { isValidTime } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { error } = await requireRole("admin");
  if (error) return error;
  const doctorId = Number(new URL(req.url).searchParams.get("doctorId"));
  if (!doctorId) return fail("doctorId required");
  const rows = await query(
    `SELECT id, weekday, to_char(start_time,'HH24:MI') AS start_time, to_char(end_time,'HH24:MI') AS end_time, slot_minutes
     FROM schedules WHERE doctor_id = $1 ORDER BY weekday, start_time`,
    [doctorId]
  );
  return json({ schedules: rows });
}

// { doctor_id, weekday (0=Sun..6=Sat), start_time, end_time, slot_minutes }
export async function POST(req: Request) {
  const { error } = await requireRole("admin");
  if (error) return error;
  const b = (await req.json().catch(() => ({}))) as {
    doctor_id?: number;
    weekday?: number;
    start_time?: string;
    end_time?: string;
    slot_minutes?: number;
  };
  const doctorId = Number(b.doctor_id);
  const weekday = Number(b.weekday);
  const slot = Number(b.slot_minutes) || 20;

  if (!doctorId) return fail("Choose a doctor");
  if (!(weekday >= 0 && weekday <= 6)) return fail("Invalid weekday");
  if (!isValidTime(b.start_time || "") || !isValidTime(b.end_time || "")) return fail("Enter valid start and end times");
  if ((b.end_time || "") <= (b.start_time || "")) return fail("End time must be after start time");
  if (slot < 5 || slot > 120) return fail("Slot length must be 5-120 minutes");

  const doc = await query("SELECT id FROM users WHERE id = $1 AND role = 'doctor'", [doctorId]);
  if (!doc.length) return fail("Doctor not found", 404);

  // Reject overlapping blocks on the same day
  const overlap = await query(
    "SELECT id FROM schedules WHERE doctor_id = $1 AND weekday = $2 AND start_time < $4::time AND end_time > $3::time",
    [doctorId, weekday, b.start_time, b.end_time]
  );
  if (overlap.length) return fail("This overlaps an existing block on that day", 409);

  await query("INSERT INTO schedules (doctor_id, weekday, start_time, end_time, slot_minutes) VALUES ($1,$2,$3,$4,$5)", [
    doctorId,
    weekday,
    b.start_time,
    b.end_time,
    slot,
  ]);
  return json({ ok: true }, 201);
}

export async function DELETE(req: Request) {
  const { error } = await requireRole("admin");
  if (error) return error;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("id required");
  await query("DELETE FROM schedules WHERE id = $1", [id]);
  return json({ ok: true });
}
