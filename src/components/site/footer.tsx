import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-card/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Digital appointment booking and secure messaging for the Bayero University Kano student community.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Platform</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#services" className="hover:text-foreground">Services</a></li>
            <li><a href="#how-it-works" className="hover:text-foreground">How it works</a></li>
            <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
            <li><Link href="/register" className="hover:text-foreground">Student sign up</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Clinic</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Bayero University Kano, Kano State, Nigeria</li>
            <li>Monday – Friday, 9:00 AM – 4:00 PM</li>
            <li>Emergencies: walk in directly — no booking needed</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 py-4">
        <p className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Bayero University Clinic. For booking and messaging only — not a substitute for
          medical examination.
        </p>
      </div>
    </footer>
  );
}
