import { query } from "@/lib/db";
import { requireRole, json } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireRole("admin");
  if (error) return error;
  const rows = await query(
    `SELECT a.id, to_char(a.appt_date,'YYYY-MM-DD') AS date, to_char(a.appt_time,'HH24:MI') AS time,
            a.reason, a.status, a.mode, s.name AS student_name, s.matric_no, d.name AS doctor_name
     FROM appointments a
     JOIN users s ON s.id = a.student_id
     JOIN users d ON d.id = a.doctor_id
     ORDER BY a.appt_date DESC, a.appt_time DESC LIMIT 300`
  );
  const stats = await query<{
    students: number;
    doctors: number;
    booked: number;
    completed: number;
    cancelled: number;
  }>(
    `SELECT
       (SELECT COUNT(*)::int FROM users WHERE role='student') AS students,
       (SELECT COUNT(*)::int FROM users WHERE role='doctor') AS doctors,
       (SELECT COUNT(*)::int FROM appointments WHERE status='booked') AS booked,
       (SELECT COUNT(*)::int FROM appointments WHERE status='completed') AS completed,
       (SELECT COUNT(*)::int FROM appointments WHERE status='cancelled') AS cancelled`
  );
  return json({ appointments: rows, stats: stats[0] });
}
