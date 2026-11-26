import { requireRole, json, fail } from "@/lib/auth";
import { ensureRecordsSchema } from "@/lib/records-schema";
import { loadPrescription } from "@/lib/prescriptions";

export const dynamic = "force-dynamic";

// Student: own prescription, only once sent. Doctor: prescriptions they wrote (including drafts).
export async function GET(_req: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const { user, error } = await requireRole("student", "doctor");
  if (error) return error;
  const { appointmentId } = await params;
  const id = Number(appointmentId);
  if (!Number.isInteger(id)) return fail("Prescription not found", 404);
  await ensureRecordsSchema();
  const found = await loadPrescription(id);
  if (!found) return fail("Prescription not found", 404);
  const { doc, student_id, doctor_id } = found;
  const allowed = user!.role === "doctor" ? doctor_id === user!.id : student_id === user!.id && !doc.draft;
  if (!allowed) return fail("Prescription not found", 404);
  return json({ prescription: doc });
}
