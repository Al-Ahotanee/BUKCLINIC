import { query } from "@/lib/db";
import { requireRole, json } from "@/lib/auth";
import { ensureRecordsSchema } from "@/lib/records-schema";
import { parseItems } from "@/lib/prescriptions";

export const dynamic = "force-dynamic";

// Student: prescriptions the doctor has sent. Doctor: prescriptions they have issued (sent or draft).
export async function GET() {
  const { user, error } = await requireRole("student", "doctor");
  if (error) return error;
  await ensureRecordsSchema();
  const isStudent = user!.role === "student";
  const rows = await query<{
    appointment_id: number;
    rx_no: string;
    items: unknown;
    sent_at: string | null;
    updated_at: string;
    date: string;
    doctor_name: string;
    patient_name: string;
    diagnosis: string | null;
  }>(
    `SELECT p.appointment_id, p.rx_no, p.items, p.sent_at::text AS sent_at, p.updated_at::text AS updated_at,
            to_char(a.appt_date,'YYYY-MM-DD') AS date, d.name AS doctor_name, s.name AS patient_name, r.diagnosis
     FROM prescriptions p
     JOIN appointments a ON a.id = p.appointment_id
     JOIN users s ON s.id = a.student_id
     JOIN users d ON d.id = a.doctor_id
     LEFT JOIN consultation_records r ON r.appointment_id = p.appointment_id
     WHERE ${isStudent ? "a.student_id = $1 AND p.sent_at IS NOT NULL" : "a.doctor_id = $1"}
     ORDER BY a.appt_date DESC, p.id DESC`,
    [user!.id]
  );
  return json({
    prescriptions: rows.map((r) => ({
      appointment_id: r.appointment_id,
      rx_no: r.rx_no,
      date: r.date,
      doctor_name: r.doctor_name,
      patient_name: r.patient_name,
      diagnosis: r.diagnosis ?? "",
      item_count: parseItems(r.items).length,
      sent_at: r.sent_at,
      draft: !r.sent_at,
    })),
  });
}
