import { destroySession, json } from "@/lib/auth";

export async function POST() {
  destroySession();
  return json({ ok: true });
}
