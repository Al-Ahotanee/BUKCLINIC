import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SiteNavbar } from "@/components/site/navbar";
import { SiteFooter } from "@/components/site/footer";
import { Landing } from "@/components/site/landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUser().catch(() => null);
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar />
      <main className="flex-1">
        <Landing />
      </main>
      <SiteFooter />
    </div>
  );
}
