"use client";

import Link from "next/link";
import { Video, Stethoscope, Siren } from "lucide-react";
import { Logo, LogoMark } from "@/components/site/logo";
import { BrandImage } from "@/components/site/brand-image";
import { BRAND } from "@/lib/brand";
import { ThemeToggle } from "@/components/site/theme-toggle";

const POINTS = [
  { icon: Stethoscope, text: "See real doctor availability and book a slot in minutes" },
  { icon: Video, text: "Online video consultation and private chat with your doctor" },
  { icon: Siren, text: "Emergencies are always handled in person — booking is for planning ahead" },
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <aside className="bg-grid relative hidden w-[46%] flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <BrandImage
          sources={[BRAND.heroLocal, BRAND.heroRemote]}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity"
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-foreground/10 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10 blur-2xl" aria-hidden="true" />
        <Link href="/" className="relative inline-flex items-center gap-2.5" aria-label="Back to home">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg">
            <LogoMark className="h-full w-auto" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold tracking-tight">Bayero University Clinic</span>
            <span className="text-[11px] font-medium text-primary-foreground/75">Bayero University Kano</span>
          </span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-balance text-3xl font-bold leading-snug tracking-tight">
            The clinic, reimagined for the way students live.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                  <p.icon className="h-4 w-4" />
                </span>
                <span className="text-sm leading-relaxed text-primary-foreground/90">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/70">Booking and messaging only — not for emergencies.</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link href="/" className="lg:invisible" aria-label="Back to home">
            <Logo compact />
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-6">
          <div className="w-full max-w-[440px]">
            <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mb-6 mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
