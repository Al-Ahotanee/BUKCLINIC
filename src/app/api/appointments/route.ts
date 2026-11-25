import { query } from "@/lib/db";
import { requireRole, json, fail } from "@/lib/auth";
import { freeSlots, isValidDate, isValidTime, nowLagos } from "@/lib/slots";

export const dynamic = "force-dynamic";

const SELECT = `
  SELECT a.id, to_char(a.appt_date,'YYYY-MM-DD') AS date, to_char(a.appt_time,'HH24:MI') AS time,
         a.reason, a.status, a.mode, a.student_id, a.doctor_id,
         s.name AS student_name, s.matric_no, d.name AS doctor_name
  FROM appointments a
  JOIN users s ON s.id = a.student_id
  JOIN users d ON d.id = a.doctor_id`;

// Student: own appointments. Doctor: appointments assigned to them.
export async function GET() {
  const { user, error } = await requireRole("student", "doctor");
  if (error) return error;
  const col = user!.role === "student" ? "a.student_id" : "a.doctor_id";
  const rows = await query(`${SELECT} WHERE ${col} = $1 ORDER BY a.appt_date DESC, a.appt_time DESC`, [user!.id]);
  return json({ appointments: rows });
}

// Student books an appointment.
export async function POST(req: Request) {
  const { user, error } = await requireRole("student");
  if (error) return error;

  const b = (await req.json().catch(() => ({}))) as {
    doctor_id?: number;
    date?: string;
    time?: string;
    reason?: string;
    mode?: string;
  };
  const doctorId = Number(b.doctor_id);
  const date = b.date || "";
  const time = b.time || "";
  const reason = (b.reason || "").trim().slice(0, 500);
  const mode = b.mode === "online" ? "online" : "in_person";
  // Unguessable Jitsi room name; only the two participants can fetch it (see /api/consultations/[id]).
  const room = mode === "online" ? `bukclinic-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}` : null;

  if (!doctorId) return fail("Choose a doctor");
  if (!isValidDate(date) || !isValidTime(time)) return fail("Choose a valid date and time");
  if (date < nowLagos().date) return fail("You cannot book a date in the past");

  const doc = await query("SELECT id FROM users WHERE id = $1 AND role = 'doctor' AND active = TRUE", [doctorId]);
  if (!doc.length) return fail("Doctor not found", 404);

  const free = await freeSlots(doctorId, date);
  if (!free.includes(time)) return fail("That time slot is no longer available", 409);

  // One active appointment per student per slot-time prevents clashes
  const clash = await query(
    "SELECT id FROM appointments WHERE student_id = $1 AND appt_date = $2 AND appt_time = $3 AND status = 'booked'",
    [user!.id, date, time]
  );
  if (clash.length) return fail("You already have an appointment at that time", 409);

  try {
    const rows = await query<{ id: number }>(
      "INSERT INTO appointments (student_id, doctor_id, appt_date, appt_time, reason, mode, room) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [user!.id, doctorId, date, time, reason || null, mode, room]
    );
    return json({ ok: true, id: rows[0].id }, 201);
  } catch (e) {
    // unique index violation = someone else just took the slot
    const msg = e instanceof Error ? e.message : String(e);
    const code = (e as { code?: string }).code;
    if (msg.includes("uniq_active_slot") || code === "23505") {
      return fail("That time slot was just taken. Pick another.", 409);
    }
    throw e;
  }
}
