import { query } from "@/lib/db";
import { requireRole, json, fail } from "@/lib/auth";
import { freeSlots, isValidDate, isValidTime, nowLagos } from "@/lib/slots";

export const dynamic = "force-dynamic";

// PATCH body: { action: "cancel" | "reschedule" | "complete", date?, time? }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole("student", "doctor", "admin");
  if (error) return error;

  const { id: rawId } = await params;
  const id = Number(rawId);
  const rows = await query<{ id: number; status: string; student_id: number; doctor_id: number }>(
    "SELECT * FROM appointments WHERE id = $1",
    [id]
  );
  const appt = rows[0];
  if (!appt) return fail("Appointment not found", 404);

  const owns =
    user!.role === "admin" ||
    (user!.role === "student" && appt.student_id === user!.id) ||
    (user!.role === "doctor" && appt.doctor_id === user!.id);
  if (!owns) return fail("Forbidden", 403);
  if (appt.status !== "booked") return fail(`Appointment is already ${appt.status}`, 409);

  const b = (await req.json().catch(() => ({}))) as { action?: string; date?: string; time?: string };

  if (b.action === "cancel") {
    await query("UPDATE appointments SET status = 'cancelled' WHERE id = $1", [id]);
    return json({ ok: true });
  }

  if (b.action === "complete") {
    if (user!.role === "student") return fail("Only doctors can mark an appointment completed", 403);
    await query("UPDATE appointments SET status = 'completed' WHERE id = $1", [id]);
    return json({ ok: true });
  }

  if (b.action === "reschedule") {
    if (user!.role === "doctor") return fail("Ask the student to reschedule, or cancel this appointment", 403);
    const date = b.date || "";
    const time = b.time || "";
    if (!isValidDate(date) || !isValidTime(time)) return fail("Choose a valid date and time");
    if (date < nowLagos().date) return fail("You cannot reschedule to a past date");

    const free = await freeSlots(appt.doctor_id, date);
    if (!free.includes(time)) return fail("That time slot is not available", 409);

    try {
      await query("UPDATE appointments SET appt_date = $1, appt_time = $2 WHERE id = $3", [date, time, id]);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "23505") return fail("That time slot was just taken. Pick another.", 409);
      throw e;
    }
    return json({ ok: true });
  }

  return fail("Unknown action");
}
