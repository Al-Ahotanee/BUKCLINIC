import { query } from "@/lib/db";
import { requireRole, json } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// List active doctors with their weekly availability (students need this to book).
export async function GET() {
  const { error } = await requireRole();
  if (error) return error;

  const doctors = await query(
    "SELECT id, name, specialization FROM users WHERE role = 'doctor' AND active = TRUE ORDER BY name"
  );
  const sched = await query(
    `SELECT doctor_id, weekday, to_char(start_time,'HH24:MI') AS start_time,
            to_char(end_time,'HH24:MI') AS end_time, slot_minutes
     FROM schedules ORDER BY weekday, start_time`
  );
  const out = doctors.map((d) => ({
    ...d,
    availability: sched
      .filter((s) => s.doctor_id === d.id)
      .map((s) => ({ day: DAYS[s.weekday], weekday: s.weekday, start: s.start_time, end: s.end_time, slot_minutes: s.slot_minutes })),
  }));
  return json({ doctors: out });
}
