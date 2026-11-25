"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  Brain,
  CalendarCheck2,
  ClipboardList,
    HeartPulse,
  MessageSquareText,
  ShieldCheck,
  Siren,
  Stethoscope,
  UserRoundPlus,
  Video,
  Zap,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { BrandImage } from "./brand-image";
import { LogoMark } from "./logo";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
      <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
        {eyebrow}
      </Badge>
      <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 text-pretty text-muted-foreground">{sub}</p>
    </motion.div>
  );
}

/** CSS-built preview of the booking experience — no stock imagery needed. */
function HeroMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
      className="relative mx-auto w-full max-w-md"
    >
      <div className="rounded-2xl border bg-card p-5 shadow-2xl shadow-primary/15">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Book an appointment</span>
          <Badge className="gap-1 rounded-full bg-emerald-600/10 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live availability
          </Badge>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border/70 bg-background p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            AB
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Dr. Aisha Bello</p>
            <p className="text-xs text-muted-foreground">General Practitioner · Mon–Fri</p>
          </div>
          <ShieldCheck className="ml-auto h-4 w-4 shrink-0 text-primary" />
        </div>
        <p className="mt-4 text-xs font-medium text-muted-foreground">Pick a date</p>
        <div className="mt-1.5 grid grid-cols-4 gap-2">
          {["Mon 24", "Tue 25", "Wed 26", "Thu 27"].map((d, i) => (
            <div
              key={d}
              className={
                "rounded-lg border py-2 text-center text-xs font-medium " +
                (i === 1
                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "border-border bg-background text-muted-foreground")
              }
            >
              {d}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-medium text-muted-foreground">Pick a time</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {["9:00 AM", "9:40 AM", "10:20 AM", "11:40 AM"].map((t, i) => (
            <span
              key={t}
              className={
                "rounded-md border px-2.5 py-1.5 text-xs font-medium " +
                (i === 1 ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")
              }
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground">
          <span className="text-sm font-semibold">Confirm booking</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 24, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute -right-3 -top-5 hidden items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 shadow-xl sm:flex"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
          <CalendarCheck2 className="h-4 w-4 text-primary" />
        </span>
        <div>
          <p className="text-xs font-semibold">Appointment booked</p>
          <p className="text-[11px] text-muted-foreground">Tue 25 · 9:40 AM · Dr. Bello</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 shadow-xl sm:flex"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
          <MessageSquareText className="h-4 w-4 text-primary" />
        </span>
        <div>
          <p className="text-xs font-semibold">New message from your doctor</p>
          <p className="text-[11px] text-muted-foreground">“Get well soon. Rest and hydrate.”</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const STATS = [
  { icon: Zap, value: "Under 2 min", label: "to book an appointment" },
  { icon: CalendarCheck2, value: "24 / 7", label: "online booking, on your schedule" },
  { icon: ShieldCheck, value: "Private", label: "secure accounts, only your doctors see your visits" },
  { icon: Video, value: "Video", label: "consult your doctor online, from anywhere" },
];

const SERVICES = [
  { icon: Stethoscope, title: "General Consultation", desc: "Everyday illnesses, aches, fevers and referrals — see a general practitioner without leaving campus." },
  { icon: Baby, title: "Maternal & Child Health", desc: "Antenatal and postnatal check-ins with clinicians who understand student life." },
  { icon: Video, title: "Online Video Consultation", desc: "Choose an online visit and meet your doctor on a secure video call — with chat built in. No travel needed." },
  { icon: HeartPulse, title: "Chronic Care Follow-up", desc: "Managing a long-term condition? Keep regular check-ups on schedule with reminders in-app." },
  { icon: Brain, title: "Health & Wellbeing", desc: "Confidential consultations for sleep, stress, and everyday health questions." },
  { icon: Siren, title: "Emergency & First Aid", desc: "Emergencies never need an appointment — walk straight into the clinic during opening hours." },
];

const STEPS = [
  {
    icon: UserRoundPlus,
    title: "Create your student account",
    desc: "Sign up with your matriculation number in under a minute. Your account is private to you and the clinic.",
  },
  {
    icon: ClipboardList,
    title: "Pick a doctor and a time",
    desc: "See real availability for every doctor, choose a slot that fits around lectures, and add a short reason for the visit.",
  },
  {
    icon: MessageSquareText,
    title: "Show up — or message first",
    desc: "Reschedule or cancel any time. Have a question before your visit? Message your doctor directly on the platform.",
  },
];

const FAQS = [
  {
    q: "Who can use this platform?",
    a: "All Bayero University Kano students. Create an account with your matriculation number, and you can book, reschedule, or cancel appointments with clinic doctors. Doctors and administrators sign in with accounts created by the clinic.",
  },
  {
    q: "Is this platform for emergencies?",
    a: "No. If it is an emergency, go directly to the clinic — do not book online. The platform is for planning ahead: routine consultations, follow-ups and questions for your doctor.",
  },
  {
    q: "How far in advance can I book?",
    a: "You can book any open slot on a doctor's weekly schedule. Past slots are hidden automatically, and the calendar shows live availability synced to the clinic's Africa/Lagos time.",
  },
  {
    q: "Can I reschedule or cancel?",
    a: "Yes. Open 'My appointments', choose the visit, and pick a new time — or cancel it so another student can take the slot.",
  },
  {
    q: "Who can see my messages?",
    a: "Only you and the doctor you are messaging. Conversations are one-to-one and cannot be read by other students.",
  },
  {
    q: "Does booking guarantee a physical examination?",
    a: "Booking reserves a doctor's time. Like any clinic visit, diagnosis happens in person — the platform only handles scheduling and communication.",
  },
];

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ---------------- Hero ---------------- */}
      <section className="bg-grid relative overflow-hidden">
        <BrandImage
          sources={[BRAND.heroLocal, BRAND.heroRemote]}
          alt=""
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover opacity-[0.08] dark:opacity-[0.12]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:pb-28 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Badge variant="outline" className="mb-5 gap-2 rounded-full border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <LogoMark className="h-4 w-4" />
              Official platform · Bayero University Kano
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Quality healthcare, <span className="text-gradient">booked between lectures.</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
              Skip the queue at the clinic. See which doctors are available today, reserve a time that fits your
              timetable, then meet your doctor in person or on a secure video call — all from your phone.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base font-semibold shadow-lg shadow-primary/25">
                <Link href="/register">
                  Student sign up <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base font-semibold">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Free for all BUK students", "Live doctor availability", "Online video consultation"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
          <HeroMock />
        </div>
      </section>

      {/* ---------------- Stats strip ---------------- */}
      <section className="border-y border-border/70 bg-card/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div key={s.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-lg font-bold leading-tight">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- Services ---------------- */}
      <section id="services" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Services"
            title="Care for every part of student life"
            sub="The clinic supports the everyday health of the BUK community — book the right consultation and get seen by a clinician."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: (i % 3) * 0.08 }}
                className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <s.icon className="h-5.5 w-5.5 text-primary transition-colors group-hover:text-primary-foreground" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Online consultation band ---------------- */}
      <section className="border-y border-border/70 bg-card/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border shadow-xl shadow-primary/10">
            <BrandImage
              sources={[BRAND.heroLocal, BRAND.heroRemote]}
              alt="Bayero University Kano campus"
              className="aspect-[4/3] w-full object-cover"
              fallback={<div className="aspect-[4/3] w-full bg-gradient-to-br from-primary to-primary/60" />}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
              <p className="text-sm font-semibold">Bayero University, Kano</p>
              <p className="text-xs text-white/80">{BRAND.motto}</p>
            </div>
          </div>
          <div>
            <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              New · Online consultation
            </Badge>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">See your doctor without leaving your room</h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Pick <strong>Online</strong> when you book. At appointment time, join a private video room with your doctor — with
              built-in chat, screen sharing and a waiting lobby. Powered by Jitsi, free and secure.
            </p>
            <Button asChild size="lg" className="mt-6 h-12 px-6 text-base font-semibold">
              <Link href="/register">
                Book an online consultation <Video className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-border/70 bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps between you and a doctor"
            sub="No forms to print, no queue to join. The whole journey happens on your phone."
          />
          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div className="absolute inset-x-16 top-8 hidden h-px border-t border-dashed border-primary/30 md:block" aria-hidden="true" />
            {STEPS.map((s, i) => (
              <motion.div key={s.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.12 }} className="relative text-center md:text-left">
                <div className="flex justify-center md:justify-start">
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                    <s.icon className="h-7 w-7" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-card text-xs font-bold">
                      {i + 1}
                    </span>
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Emergency banner ---------------- */}
      <section className="py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <Siren className="h-5.5 w-5.5 text-destructive" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">Having a medical emergency?</p>
              <p className="text-sm text-muted-foreground">
                Do not wait for an online appointment. Walk straight into the clinic during opening hours, or contact
                the nearest emergency service immediately.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Questions students ask" sub="Everything you need to know before your first online booking." />
          <motion.div {...fadeUp} className="mt-10">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`q${i}`}>
                  <AccordionTrigger className="text-left text-[15px] font-semibold">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Your health slot is waiting</h2>
              <p className="mx-auto mt-3 max-w-xl text-pretty text-primary-foreground/85">
                Create your free student account today and book your first consultation in about two minutes.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" variant="secondary" className="h-12 px-7 text-base font-semibold">
                  <Link href="/register">Create student account</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 border-primary-foreground/40 bg-transparent px-7 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
