import { query } from "./db";
import type { PrescriptionDoc, RxItem } from "./records-types";

type Row = {
  appointment_id: number;
  rx_no: string;
  items: RxItem[] | string;
  instructions: string | null;
  sent_at: string | null;
  updated_at: string;
  student_id: number;
  doctor_id: number;
  consultation_date: string;
  patient_name: string;
  matric_no: string | null;
  doctor_name: string;
  specialization: string | null;
  allergies: string | null;
  diagnosis: string | null;
  advice: string | null;
  follow_up_date: string | null;
}

// Postgres text timestamps ("2026-11-26 09:46:36.5+00") are not valid ISO in every browser (Safari); normalise.
export function isoTs(v: string): string {
  return v.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00");
}

export function parseItems(v: unknown): RxItem[] {
  let arr: unknown = v;
  if (typeof v === "string") {
    try {
      arr = JSON.parse(v);
    } catch {
      arr = [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    return {
      drug: String(o.drug ?? ""),
      dosage: String(o.dosage ?? ""),
      frequency: String(o.frequency ?? ""),
      duration: String(o.duration ?? ""),
      instructions: String(o.instructions ?? ""),
    };
  });
}

/** Loads the printable prescription for an appointment, or null if none exists. */
export async function loadPrescription(appointmentId: number): Promise<{ doc: PrescriptionDoc; student_id: number; doctor_id: number } | null> {
  const rows = await query<Row>(
    `SELECT p.appointment_id, p.rx_no, p.items, p.instructions, p.sent_at::text AS sent_at, p.updated_at::text AS updated_at,
            a.student_id, a.doctor_id, to_char(a.appt_date,'YYYY-MM-DD') AS consultation_date,
            s.name AS patient_name, s.matric_no, d.name AS doctor_name, d.specialization,
            r.allergies, r.diagnosis, r.advice, to_char(r.follow_up_date,'YYYY-MM-DD') AS follow_up_date
     FROM prescriptions p
     JOIN appointments a ON a.id = p.appointment_id
     JOIN users s ON s.id = a.student_id
     JOIN users d ON d.id = a.doctor_id
     LEFT JOIN consultation_records r ON r.appointment_id = p.appointment_id
     WHERE p.appointment_id = $1`,
    [appointmentId]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    student_id: r.student_id,
    doctor_id: r.doctor_id,
    doc: {
      appointment_id: r.appointment_id,
      rx_no: r.rx_no,
      issued_at: isoTs(r.sent_at ?? r.updated_at),
      consultation_date: r.consultation_date,
      patient_name: r.patient_name,
      matric_no: r.matric_no,
      doctor_name: r.doctor_name,
      specialization: r.specialization,
      allergies: r.allergies ?? "",
      diagnosis: r.diagnosis ?? "",
      items: parseItems(r.items),
      instructions: r.instructions ?? "",
      advice: r.advice ?? "",
      follow_up_date: r.follow_up_date,
      draft: !r.sent_at,
    },
  };
}
