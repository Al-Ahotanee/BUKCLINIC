import { getUser, json, fail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return fail("Not logged in", 401);
  return json({ user });
}
