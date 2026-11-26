import { query } from "@/lib/db";
import { requireRole, json, fail } from "@/lib/auth";
import { nowLagos, toMin } from "@/lib/slots";
import { buildJitsiConfig } from "@/lib/jitsi";

export const dynamic = "force-dynamic";

// Participants may enter the room from 15 minutes before the slot until 90 minutes after it starts.
const EARLY_MIN = 15;
const LATE_MIN = 90;

type Row = {
  id: number;
  status: string;
  mode: string;
  room: string | null;
  student_id: number;
  doctor_id: number;
  date: string;
  time: string;
  student_name: string;
  doctor_name: string;
  reason: string | null;
}

async function load(id: number): Promise<Row | undefined> {
  const rows = await query<Row>(
    `SELECT a.id, a.status, a.mode, a.room, a.student_id, a.doctor_id, a.reason,
            to_char(a.appt_date,'YYYY-MM-DD') AS date, to_char(a.appt_time,'HH24:MI') AS time,
            s.name AS student_name, d.name AS doctor_name
     FROM appointments a
     JOIN users s ON s.id = a.student_id
     JOIN users d ON d.id = a.doctor_id
     WHERE a.id = $1`,
    [id]
  );
  return rows[0];
}

function windowState(date: string, time: string) {
  const now = nowLagos();
  if (date > now.date) return { state: "early" as const, minutes: null as number | null };
  if (date < now.date) return { state: "ended" as const, minutes: null };
  const diff = toMin(time) - toMin(now.time); // minutes until start
  if (diff > EARLY_MIN) return { state: "early" as const, minutes: diff - EARLY_MIN };
  if (diff < -LATE_MIN) return { state: "ended" as const, minutes: null };
  return { state: "open" as const, minutes: 0 };
}

// Only the student and doctor on this appointment get the room name.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole("student", "doctor");
  if (error) return error;

  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id)) return fail("Consultation not found", 404);

  const a = await load(id);
  if (!a) return fail("Consultation not found", 404);
  const isParticipant = (user!.role === "student" && a.student_id === user!.id) || (user!.role === "doctor" && a.doctor_id === user!.id);
  if (!isParticipant) return fail("Forbidden", 403);
  if (a.mode !== "online" || !a.room) return fail("This is an in-person appointment", 409);
  if (a.status === "cancelled") return fail("This appointment was cancelled", 409);

  const w = windowState(a.date, a.time);
  const finished = a.status === "completed" || w.state === "ended";
  const base = {
    id: a.id,
    date: a.date,
    time: a.time,
    reason: a.reason,
    status: a.status,
    role: user!.role,
    me: user!.name,
    other_name: user!.role === "student" ? a.doctor_name : a.student_name,
  };
  if (finished) return json({ ...base, state: "ended", jitsi: null, opens_in_minutes: null });
  if (w.state === "early") return json({ ...base, state: "early", jitsi: null, opens_in_minutes: w.minutes });
  const jitsi = buildJitsiConfig(a.room, { id: user!.id, name: user!.name, moderator: user!.role === "doctor" });
  return json({ ...base, state: "open", jitsi, opens_in_minutes: 0 });
}

// Doctor ends the consultation: marks the appointment completed.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole("doctor");
  if (error) return error;
  const { id: raw } = await params;
  const id = Number(raw);
  const a = Number.isInteger(id) ? await load(id) : undefined;
  if (!a || a.doctor_id !== user!.id) return fail("Consultation not found", 404);
  const b = (await req.json().catch(() => ({}))) as { action?: string };
  if (b.action !== "end") return fail("Unknown action");
  if (a.status !== "booked") return fail(`Appointment is already ${a.status}`, 409);
  await query("UPDATE appointments SET status = 'completed' WHERE id = $1", [id]);
  return json({ ok: true });
}
