import { query } from "@/lib/db";
import { requireRole, json } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Student: all active doctors. Doctor: students they share an appointment or message with.
// Each contact includes the unread count of messages sent to the current user.
export async function GET() {
  const { user, error } = await requireRole("student", "doctor");
  if (error) return error;

  let contacts;
  if (user!.role === "student") {
    contacts = await query(
      `SELECT u.id, u.name, u.specialization AS detail,
        (SELECT COUNT(*)::int FROM messages m WHERE m.sender_id = u.id AND m.receiver_id = $1 AND m.read_at IS NULL) AS unread
       FROM users u WHERE u.role = 'doctor' AND u.active = TRUE ORDER BY u.name`,
      [user!.id]
    );
  } else {
    contacts = await query(
      `SELECT u.id, u.name, u.matric_no AS detail,
        (SELECT COUNT(*)::int FROM messages m WHERE m.sender_id = u.id AND m.receiver_id = $1 AND m.read_at IS NULL) AS unread
       FROM users u
       WHERE u.role = 'student' AND u.active = TRUE AND (
         EXISTS (SELECT 1 FROM appointments a WHERE a.student_id = u.id AND a.doctor_id = $1)
         OR EXISTS (SELECT 1 FROM messages m WHERE (m.sender_id = u.id AND m.receiver_id = $1))
       ) ORDER BY u.name`,
      [user!.id]
    );
  }
  return json({ contacts });
}
