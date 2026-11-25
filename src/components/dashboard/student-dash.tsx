"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  CalendarX2,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { api, formatDatePlain, formatTime, initials, relativeDay, todayISO, type Appointment, type Doctor, type SessionUser } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, StatCard } from "./stat-card";
import { Messages } from "./messages";
import { SlotPicker } from "./slot-picker";
import { ProfilePanel } from "./profile-panel";
import { cn } from "@/lib/utils";

export type StudentSection = "overview" | "book" | "appointments" | "messages" | "profile";
export const STUDENT_SECTIONS = [
  { key: "overview" as const, label: "Overview", icon: LayoutIcon },
  { key: "book" as const, label: "Book appointment", icon: CalendarPlus },
  { key: "appointments" as const, label: "My appointments", icon: CalendarDays },
  { key: "messages" as const, label: "Messages", icon: MessageSquareText },
  { key: "profile" as const, label: "Profile", icon: UserRound },
];
function LayoutIcon({ className }: { className?: string }) {
  return <Sparkles className={className} />;
}

export function StudentDash({
  user,
  section,
  setSection,
}: {
  user: SessionUser;
  section: StudentSection;
  setSection: (s: StudentSection) => void;
}) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    api<{ contacts: Array<{ unread: number }> }>("/api/messages/contacts").then((r) => {
      if (r.ok) setUnread(r.data.contacts.reduce((n, c) => n + c.unread, 0));
    });
  }, [section]);

  switch (section) {
    case "overview":
      return <StudentOverview user={user} setSection={setSection} unread={unread} />;
    case "book":
      return <Book onBooked={() => setSection("appointments")} />;
    case "appointments":
      return <Mine />;
    case "messages":
      return (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">Private, one-to-one conversations with clinic doctors.</p>
          <Messages />
        </div>
      );
    case "profile":
      return <ProfilePanel user={user} />;
  }
}

/* ------------------------------ Overview ------------------------------ */
function StudentOverview({ user, setSection, unread }: { user: SessionUser; setSection: (s: StudentSection) => void; unread: number }) {
  const [items, setItems] = useState<Appointment[] | null>(null);

  useEffect(() => {
    api<{ appointments: Appointment[] }>("/api/appointments").then((r) => r.ok && setItems(r.data.appointments));
  }, []);

  const today = todayISO();
  const booked = useMemo(() => (items ?? []).filter((a) => a.status === "booked"), [items]);
  const next = useMemo(
    () => booked.filter((a) => a.date > today || (a.date === today && a.time >= "00:00")).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0],
    [booked, today]
  );
  const loading = items === null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{user.name.split(" ")[0]} {user.name.split(" ").slice(1).join(" ")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.matric_no ? `${user.matric_no} · ` : ""}Bayero University Kano
        </p>
        {next ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {relativeDay(next.date)}, {formatDatePlain(next.date)} at {formatTime(next.time)}
              </p>
              <p className="text-sm text-muted-foreground">with {next.doctor_name}</p>
            </div>
            <Badge className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400" variant="secondary">
              Booked
            </Badge>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed bg-card/60 p-4 text-sm text-muted-foreground">
            You have no upcoming appointment. Booking takes about two minutes.
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarDays} label="Upcoming appointments" value={booked.length} loading={loading} />
        <StatCard icon={CheckCircle2} label="Completed visits" value={(items ?? []).filter((a) => a.status === "completed").length} loading={loading} tone="primary" />
        <StatCard icon={MessageSquareText} label="Unread messages" value={unread} loading={false} tone={unread > 0 ? "amber" : "neutral"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => setSection("book")}
          className="group flex items-start gap-4 rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <CalendarPlus className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">Book an appointment</p>
            <p className="mt-0.5 text-sm text-muted-foreground">See live availability and reserve a slot that fits your timetable.</p>
          </div>
        </button>
        <button
          onClick={() => setSection("messages")}
          className="group flex items-start gap-4 rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <MessageSquareText className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">Message a doctor{unread > 0 && <Badge className="ml-2 rounded-full bg-primary text-primary-foreground">{unread} new</Badge>}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Ask a question before your visit — conversations are private.</p>
          </div>
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Health tip:</span> this platform is for booking and messaging
          only. For anything urgent, walk straight into the clinic — no appointment needed.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------ Booking ------------------------------ */
function Book({ onBooked }: { onBooked: () => void }) {
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [pick, setPick] = useState({ date: "", time: "" });
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ doctors: Doctor[] }>("/api/doctors").then((r) => r.ok && setDoctors(r.data.doctors));
  }, []);

  const doc = doctors?.find((d) => String(d.id) === String(doctorId));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!pick.time) {
      setError("Choose a time slot");
      return;
    }
    setBusy(true);
    const r = await api<{ ok: boolean }>("/api/appointments", {
      method: "POST",
      body: { doctor_id: Number(doctorId), date: pick.date, time: pick.time, reason },
    });
    setBusy(false);
    if (r.ok) {
      toast.success("Appointment booked", {
        description: `${relativeDay(pick.date)}, ${formatDatePlain(pick.date)} at ${formatTime(pick.time)} with ${doc?.name}.`,
      });
      onBooked();
    } else {
      setError(r.error);
    }
  }

  if (doctors === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-full max-w-md" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div className="space-y-1.5">
        <Label>Doctor</Label>
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger className="h-11 max-w-md" aria-label="Choose a doctor">
            <SelectValue placeholder="Choose a doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
                {d.specialization ? ` — ${d.specialization}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {doc && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border bg-card p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initials(doc.name)}
            </span>
            <div className="text-sm">
              <p className="font-semibold">{doc.name}</p>
              <p className="text-muted-foreground">{doc.specialization || "General practice"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {doc.availability.length
                  ? `Clinic days: ${doc.availability.map((a) => `${a.day} ${a.start}–${a.end}`).join(", ")}`
                  : "No schedule set yet — this doctor cannot be booked."}
              </p>
            </div>
          </div>
        )}
      </div>

      {doctorId && doc && doc.availability.length > 0 && (
        <div className="rounded-2xl border bg-card p-5">
          <SlotPicker doctorId={Number(doctorId)} onChange={setPick} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason for visit <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="Briefly describe your concern — helps the doctor prepare"
          className="min-h-[96px]"
        />
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="h-12 px-8 text-[15px] font-semibold" disabled={busy || !doctorId || !pick.time}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {busy ? "Booking…" : "Confirm booking"}
      </Button>
    </form>
  );
}

/* ------------------------------ My appointments ------------------------------ */
function Mine() {
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [resched, setResched] = useState<Appointment | null>(null);
  const [pick, setPick] = useState({ date: "", time: "" });
  const [toCancel, setToCancel] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ appointments: Appointment[] }>("/api/appointments").then((r) => r.ok && setItems(r.data.appointments));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function act(id: number, body: Record<string, unknown>, okMsg: string) {
    setBusy(true);
    const r = await api(`/api/appointments/${id}`, { method: "PATCH", body });
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return false;
    }
    toast.success(okMsg);
    setResched(null);
    load();
    return true;
  }

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (!q) return true;
      return (
        a.doctor_name?.toLowerCase().includes(q) ||
        (a.reason ?? "").toLowerCase().includes(q) ||
        a.date.includes(q)
      );
    });
  }, [items, query, status]);

  if (items === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search doctor, reason, date…" className="h-10 pl-9" aria-label="Search appointments" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-[150px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <p className="ml-auto text-sm text-muted-foreground">{filtered?.length ?? 0} appointment{filtered?.length === 1 ? "" : "s"}</p>
      </div>

      {filtered!.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={items.length === 0 ? "No appointments yet" : "Nothing matches your search"}
          desc={items.length === 0 ? "Book your first consultation — it takes about two minutes." : "Try a different search term or status filter."}
        />
      ) : (
        <div className="grid gap-3">
          {filtered!.map((a) => (
            <div key={a.id} className={cn("rounded-xl border bg-card p-4", a.status !== "booked" && "opacity-80")}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 leading-tight">
                  <span className="text-[10px] font-semibold uppercase text-primary">{relativeDay(a.date).slice(0, 3)}</span>
                  <span className="text-sm font-bold text-primary">{a.date.slice(8)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{a.doctor_name}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {relativeDay(a.date)}, {formatDatePlain(a.date)} · {formatTime(a.time)}
                  </p>
                  {a.reason && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">“{a.reason}”</p>}
                </div>
                {a.status === "booked" && (
                  <div className="flex gap-2 sm:ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setResched(a);
                        setPick({ date: "", time: "" });
                      }}
                    >
                      <Clock className="mr-1.5 h-3.5 w-3.5" /> Reschedule
                    </Button>
                    <Button variant="destructiveOutline" size="sm" onClick={() => setToCancel(a)}>
                      <CalendarX2 className="mr-1.5 h-3.5 w-3.5" /> Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule dialog */}
      <Dialog open={!!resched} onOpenChange={(v) => !v && setResched(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reschedule with {resched?.doctor_name}</DialogTitle>
            <DialogDescription>Pick a new date and time. The old slot is released automatically.</DialogDescription>
          </DialogHeader>
          {resched && <SlotPicker doctorId={resched.doctor_id ?? 0} onChange={setPick} compact />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResched(null)}>Close</Button>
            <Button
              disabled={!pick.time || busy}
              onClick={async () => {
                if (!resched) return;
                await act(resched.id, { action: "reschedule", date: pick.date, time: pick.time }, "Appointment rescheduled");
              }}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm new time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirm */}
      <AlertDialog open={!!toCancel} onOpenChange={(v) => !v && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {toCancel && `Your visit with ${toCancel.doctor_name} on ${formatDatePlain(toCancel.date)} at ${formatTime(toCancel.time)} will be cancelled and the slot released to other students.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep appointment</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!toCancel) return;
                await act(toCancel.id, { action: "cancel" }, "Appointment cancelled");
                setToCancel(null);
              }}
            >
              Cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function StatusBadge({ status }: { status: Appointment["status"] }) {
  const map = {
    booked: { label: "Booked", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    completed: { label: "Completed", cls: "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
    cancelled: { label: "Cancelled", cls: "bg-destructive/10 text-destructive" },
  } as const;
  const m = map[status];
  return <Badge variant="secondary" className={cn("rounded-full font-semibold", m.cls)}>{m.label}</Badge>;
}

/* Profile is shared with doctors — implemented in profile-panel.tsx */
export { ProfilePanel } from "./profile-panel";
