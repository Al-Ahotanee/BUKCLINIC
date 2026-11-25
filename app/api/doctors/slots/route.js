import { requireRole, json, fail } from "@/lib/auth";
import { freeSlots, isValidDate, nowLagos } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = await requireRole();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const doctorId = Number(searchParams.get("doctorId"));
  const date = searchParams.get("date") || "";
  if (!doctorId) return fail("doctorId is required");
  if (!isValidDate(date)) return fail("date must be YYYY-MM-DD");
  if (date < nowLagos().date) return json({ slots: [] });

  return json({ slots: await freeSlots(doctorId, date) });
}
