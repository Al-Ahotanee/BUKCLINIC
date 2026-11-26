"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquareText,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { api, formatDate, formatDatePlain, formatTime, initials, relativeDay, todayISO, type Appointment, type SessionUser } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, StatCard } from "./stat-card";
import { Messages } from "./messages";
import { StatusBadge } from "./student-dash";
import { JoinCallButton, ModeBadge } from "@/components/consultation/join-call-button";
import { RecordSheet } from "@/components/consultation/record-sheet";
import { cn } from "@/lib/utils";

export type DoctorSection = "overview" | "appointments" | "messages";
export const DOCTOR_SECTIONS = [
  { key: "overview" as const, label: "Overview", icon: Sparkles },
  { key: "appointments" as const, label: "Appointments", icon: CalendarDays },
  { key: "messages" as const, label: "Messages", icon: MessageSquareText },
];

export function DoctorDash({
  user,
  section,
  setSection,
}: {
  user: SessionUser;
  section: DoctorSection;
  setSection: (s: DoctorSection) => void;
}) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    api<{ contacts: Array<{ unread: number }> }>("/api/messages/contacts").then((r) => {
      if (r.ok) setUnread(r.data.contacts.reduce((n, c) => n + c.unread, 0));
    });
  }, [section]);

  if (section === "overview") return <DoctorOverview user={user} setSection={setSection} />;
  if (section === "appointments") return <DocAppts />;
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">Conversations with your students. Replies are private and one-to-one.</p>
      <Messages />
    </div>
  );
}

/* ------------------------------ Overview ------------------------------ */
function DoctorOverview({ user, setSection }: { user: SessionUser; setSection: (s: DoctorSection) => void }) {
  const [items, setItems] = useState<Appointment[] | null>(null);
  useEffect(() => {
    api<{ appointments: Appointment[] }>("/api/appointments").then((r) => r.ok && setItems(r.data.appointments));
  }, []);

  const today = todayISO();
  const todays = useMemo(
    () => (items ?? []).filter((a) => a.date === today && a.status === "booked").sort((a, b) => a.time.localeCompare(b.time)),
    [items, today]
  );
  const upcoming = useMemo(
    () => (items ?? []).filter((a) => a.status === "booked" && a.date > today).length,
    [items, today]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <p className="text-sm text-muted-foreground">{formatDate(today)} · Africa/Lagos</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Good day, {user.name.replace(/^Dr\.?\s+/i, "Dr. ")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {todays.length > 0
            ? `You have ${todays.length} consultation${todays.length === 1 ? "" : "s"} today.`
            : "No consultations booked for today — enjoy the calm."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Clock} label="Consultations today" value={todays.length} loading={items === null} />
        <StatCard icon={CalendarDays} label="Upcoming appointments" value={upcoming} loading={items === null} tone="neutral" />
        <StatCard
          icon={CheckCircle2}
          label="Completed all time"
          value={(items ?? []).filter((a) => a.status === "completed").length}
          loading={items === null}
          tone="primary"
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Today's schedule</h3>
          <Button variant="ghost" size="sm" onClick={() => setSection("appointments")}>
            View all <span aria-hidden="true">→</span>
          </Button>
        </div>
        {items === null ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : todays.length === 0 ? (
          <EmptyState icon={CalendarCheck2} title="Nothing booked today" desc="New bookings from students will appear here automatically." />
        ) : (
          <div className="grid gap-3">
            {todays.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
                <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground leading-tight">
                  <span className="text-[10px] font-semibold uppercase opacity-80">Slot</span>
                  <span className="text-sm font-bold">{a.time}</span>
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials(a.student_name ?? "")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.student_name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {a.matric_no}
                    {a.reason ? ` · ${a.reason}` : ""}
                  </p>
                </div>
                <ModeBadge mode={a.mode} />
                <JoinCallButton id={a.id} mode={a.mode} status={a.status} />
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Appointments ------------------------------ */
function DocAppts() {
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [filter, setFilter] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [toCancel, setToCancel] = useState<Appointment | null>(null);
  const [recordFor, setRecordFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ appointments: Appointment[] }>("/api/appointments").then((r) => r.ok && setItems(r.data.appointments));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function act(id: number, action: string, okMsg: string) {
    setBusy(true);
    const r = await api(`/api/appointments/${id}`, { method: "PATCH", body: { action } });
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(okMsg);
    load();
  }

  const today = todayISO();
  const shown = useMemo(() => {
    if (!items) return null;
    const q = query.trim().toLowerCase();
    return items
      .filter((a) => (filter === "upcoming" ? a.status === "booked" && a.date >= today : filter === "today" ? a.date === today : true))
      .filter((a) => !q || a.student_name?.toLowerCase().includes(q) || (a.matric_no ?? "").toLowerCase().includes(q) || (a.reason ?? "").toLowerCase().includes(q))
      .sort((a, b) => (filter === "all" ? 0 : (a.date + a.time).localeCompare(b.date + b.time)));
  }, [items, filter, query, today]);

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
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student, matric, reason…" className="h-10 pl-9" aria-label="Search appointments" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-10 w-[150px]" aria-label="Filter appointments">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <p className="ml-auto text-sm text-muted-foreground">{shown?.length ?? 0} shown</p>
      </div>

      {shown!.length === 0 ? (
        <EmptyState
          icon={CalendarCheck2}
          title="Nothing to show"
          desc={filter === "upcoming" ? "No upcoming bookings. Students book from your weekly schedule." : "Try a different filter."}
        />
      ) : (
        <div className="grid gap-3">
          {shown!.map((a) => (
            <div key={a.id} className={cn("rounded-xl border bg-card p-4", a.status !== "booked" && "opacity-80")}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 leading-tight">
                  <span className="text-[10px] font-semibold uppercase text-primary">{relativeDay(a.date).slice(0, 3)}</span>
                  <span className="text-sm font-bold text-primary">{a.date.slice(8)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{a.student_name}</p>
                    <span className="text-xs text-muted-foreground">{a.matric_no}</span>
                    <StatusBadge status={a.status} />
                    <ModeBadge mode={a.mode} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {relativeDay(a.date)}, {formatDatePlain(a.date)} · {formatTime(a.time)}
                  </p>
                  {a.reason && <p className="mt-1 text-sm text-muted-foreground">“{a.reason}”</p>}
                </div>
                {a.status !== "cancelled" && (
                  <div className="flex flex-wrap gap-2 sm:ml-auto">
                    <Button variant="outline" size="sm" onClick={() => setRecordFor(a.id)}>
                      <FileText className="mr-1.5 h-3.5 w-3.5" /> {a.status === "completed" ? "View record" : "Consultation record"}
                    </Button>
                    {a.status === "booked" && <JoinCallButton id={a.id} mode={a.mode} status={a.status} />}
                    {a.status === "booked" && (
                      <>
                        <Button size="sm" disabled={busy} onClick={() => act(a.id, "complete", "Marked as completed")}>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Complete
                        </Button>
                        <Button variant="destructiveOutline" size="sm" disabled={busy} onClick={() => setToCancel(a)}>
                          <CalendarX2 className="mr-1.5 h-3.5 w-3.5" /> Cancel
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RecordSheet appointmentId={recordFor} open={recordFor !== null} onOpenChange={(v) => !v && setRecordFor(null)} onSaved={load} />

      <AlertDialog open={!!toCancel} onOpenChange={(v) => !v && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {toCancel && `${toCancel.student_name}'s visit on ${formatDatePlain(toCancel.date)} at ${formatTime(toCancel.time)} will be cancelled and the student will see the updated status.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep appointment</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!toCancel) return;
                await act(toCancel.id, "cancel", "Appointment cancelled");
                setToCancel(null);
              }}
            >
              Cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-xs text-muted-foreground">
        Tip: doctors cannot reschedule — ask the student to reschedule from their dashboard, or cancel the visit.
      </p>
    </div>
  );
}
