import Link from "next/link";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUser().catch(() => null);
  if (user) redirect("/dashboard");

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span className="brand">Bayero University Clinic</span>
        </div>
      </div>
      <div className="container hero">
        <h1>Book your clinic appointment online</h1>
        <p>
          Skip the queue. See which doctors are available, pick a time that fits around your lectures,
          and message your doctor through the platform.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link className="btn" href="/register">Student sign up</Link>
          <Link className="btn secondary" href="/login">Log in</Link>
        </div>
        <p className="notice">
          This system is for booking and messaging only. It does not replace physical examination.
          In an emergency, go directly to the clinic.
        </p>
      </div>
    </>
  );
}
