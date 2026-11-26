import { query } from "@/lib/db";
import { requireRole, json, fail } from "@/lib/auth";
import { isValidDate } from "@/lib/slots";
import { ensureRecordsSchema } from "@/lib/records-schema";
import { parseItems } from "@/lib/prescriptions";
import { EMPTY_RECORD, type ConsultationRecord, type PrescriptionData, type RecordAppointment, type RxItem } from "@/lib/records-types";

export const dynamic = "force-dynamic";

type Appt = RecordAppointment & { student_id: number; doctor_id: number };

async function loadAppointment(id: number): Promise<Appt | undefined> {
  const rows = await query<Appt>(
    `SELECT a.id, to_char(a.appt_date,'YYYY-MM-DD') AS date, to_char(a.appt_time,'HH24:MI') AS time,
            a.mode, a.status, a.reason, a.student_id, a.doctor_id,
            s.name AS student_name, s.matric_no, s.phone AS student_phone,
            d.name AS doctor_name, d.specialization
     FROM appointments a
     JOIN users s ON s.id = a.student_id
     JOIN users d ON d.id = a.doctor_id
     WHERE a.id = $1`,
    [id]
  );
  return rows[0];
}

async function loadRecord(id: number): Promise<ConsultationRecord | null> {
  const rows = await query<Record<string, string | null>>(
    `SELECT chief_complaint, history, allergies, bp, temperature, pulse, weight, examination, diagnosis,
            treatment_plan, advice, to_char(follow_up_date,'YYYY-MM-DD') AS follow_up_date, private_notes
     FROM consultation_records WHERE appointment_id = $1`,
    [id]
  );
  const r = rows[0];
  if (!r) return null;
  const rec = { ...EMPTY_RECORD };
  for (const k of Object.keys(EMPTY_RECORD) as Array<keyof ConsultationRecord>) {
    if (k === "follow_up_date") rec.follow_up_date = r.follow_up_date ?? null;
    else rec[k] = r[k] ?? "";
  }
  return rec;
}

async function loadRx(id: number): Promise<PrescriptionData | null> {
  const rows = await query<{ rx_no: string; items: unknown; instructions: string | null; sent_at: string | null; updated_at: string }>(
    "SELECT rx_no, items, instructions, sent_at::text AS sent_at, updated_at::text AS updated_at FROM prescriptions WHERE appointment_id = $1",
    [id]
  );
  const r = rows[0];
  if (!r) return null;
  return { rx_no: r.rx_no, items: parseItems(r.items), instructions: r.instructions ?? "", sent_at: r.sent_at, updated_at: r.updated_at };
}

async function guard(params: Promise<{ appointmentId: string }>) {
  const { user, error } = await requireRole("doctor");
  if (error) return { error };
  const id = Number((await params).appointmentId);
  if (!Number.isInteger(id)) return { error: fail("Appointment not found", 404) };
  await ensureRecordsSchema();
  const appt = await loadAppointment(id);
  if (!appt || appt.doctor_id !== user!.id) return { error: fail("Appointment not found", 404) };
  return { user: user!, appt, id };
}

// Doctor: the consultation record and prescription for one of their appointments.
export async function GET(_req: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const g = await guard(params);
  if (g.error) return g.error;
  const { student_id: _s, doctor_id: _d, ...appointment } = g.appt!;
  void _s;
  void _d;
  return json({ appointment, record: await loadRecord(g.id!), prescription: await loadRx(g.id!) });
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Doctor: save the record and prescription. `send` releases the prescription to the student; `complete` closes the visit.
export async function PUT(req: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const g = await guard(params);
  if (g.error) return g.error;
  const { user, appt, id } = g as { user: NonNullable<typeof g.user>; appt: Appt; id: number };
  if (appt.status === "cancelled") return fail("This appointment was cancelled", 409);

  const b = (await req.json().catch(() => ({}))) as {
    record?: Partial<Record<keyof ConsultationRecord, unknown>>;
    prescription?: { items?: unknown; instructions?: unknown };
    send?: boolean;
    complete?: boolean;
  };
  const r = b.record ?? {};
  const followUp = typeof r.follow_up_date === "string" && r.follow_up_date ? r.follow_up_date : null;
  if (followUp && !isValidDate(followUp)) return fail("Choose a valid follow-up date");

  const items: RxItem[] = (Array.isArray(b.prescription?.items) ? (b.prescription!.items as unknown[]) : [])
    .slice(0, 20)
    .map((x) => {
      const o = (x ?? {}) as Record<string, unknown>;
      return { drug: text(o.drug, 120), dosage: text(o.dosage, 80), frequency: text(o.frequency, 80), duration: text(o.duration, 80), instructions: text(o.instructions, 200) };
    })
    .filter((i) => i.drug);
  const rxInstructions = text(b.prescription?.instructions, 1000);
  const diagnosis = text(r.diagnosis, 1000);

  if (b.send) {
    if (!diagnosis) return fail("Add a diagnosis before sending the prescription");
    if (items.length === 0) return fail("Add at least one medicine before sending the prescription");
  }

  await query(
    `INSERT INTO consultation_records
       (appointment_id, doctor_id, student_id, chief_complaint, history, allergies, bp, temperature, pulse, weight,
        examination, diagnosis, treatment_plan, advice, follow_up_date, private_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     ON CONFLICT (appointment_id) DO UPDATE SET
       chief_complaint = EXCLUDED.chief_complaint, history = EXCLUDED.history, allergies = EXCLUDED.allergies,
       bp = EXCLUDED.bp, temperature = EXCLUDED.temperature, pulse = EXCLUDED.pulse, weight = EXCLUDED.weight,
       examination = EXCLUDED.examination, diagnosis = EXCLUDED.diagnosis, treatment_plan = EXCLUDED.treatment_plan,
       advice = EXCLUDED.advice, follow_up_date = EXCLUDED.follow_up_date, private_notes = EXCLUDED.private_notes,
       updated_at = NOW()`,
    [
      id, user.id, appt.student_id,
      text(r.chief_complaint, 2000), text(r.history, 3000), text(r.allergies, 500),
      text(r.bp, 40), text(r.temperature, 40), text(r.pulse, 40), text(r.weight, 40),
      text(r.examination, 3000), diagnosis, text(r.treatment_plan, 3000), text(r.advice, 2000),
      followUp, text(r.private_notes, 3000),
    ]
  );

  const existing = await loadRx(id);
  let justSent = false;
  if (items.length > 0 || rxInstructions || existing) {
    const yymm = new Date().toISOString().slice(2, 4) + new Date().toISOString().slice(5, 7);
    const rxNo = existing?.rx_no ?? `RX-${yymm}-${String(id).padStart(5, "0")}`;
    await query(
      `INSERT INTO prescriptions (appointment_id, rx_no, items, instructions)
       VALUES ($1,$2,$3::jsonb,$4)
       ON CONFLICT (appointment_id) DO UPDATE SET items = EXCLUDED.items, instructions = EXCLUDED.instructions, updated_at = NOW()`,
      [id, rxNo, JSON.stringify(items), rxInstructions]
    );
    if (b.send && !existing?.sent_at) {
      await query("UPDATE prescriptions SET sent_at = NOW() WHERE appointment_id = $1", [id]);
      justSent = true;
      await query("INSERT INTO messages (sender_id, receiver_id, body) VALUES ($1,$2,$3)", [
        user.id,
        appt.student_id,
        `Your prescription (${rxNo}) from the consultation on ${appt.date} is ready. Open "Prescriptions" in your portal to view, print or save it.`,
      ]);
    }
  }

  if (b.complete && appt.status === "booked") {
    await query("UPDATE appointments SET status = 'completed' WHERE id = $1 AND status = 'booked'", [id]);
  }

  return json({ ok: true, justSent, record: await loadRecord(id), prescription: await loadRx(id) });
}
