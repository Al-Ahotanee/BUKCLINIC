"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Clock,
  Hourglass,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, DAY_SHORT, formatDate, formatTime, initials, relativeDay, todayISO, type Appointment } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { EmptyState, StatCard } from "./stat-card";
import { ModeBadge } from "@/components/consultation/join-call-button";
import { StatusBadge } from "./student-dash";
import { cn } from "@/lib/utils";

export type AdminSection = "overview" | "users" | "schedules" | "appointments";
export const ADMIN_SECTIONS = [
  { key: "overview" as const, label: "Overview", icon: Sparkles },
  { key: "users" as const, label: "Users", icon: Users },
  { key: "schedules" as const, label: "Doctor schedules", icon: Clock },
  { key: "appointments" as const, label: "All appointments", icon: CalendarDays },
];

interface AdminStats {
  students: number;
  doctors: number;
  booked: number;
  completed: number;
  cancelled: number;
}

interface AdminUser {
  id: number;
  role: "student" | "doctor" | "admin";
  name: string;
  email: string;
  matric_no: string | null;
  phone: string | null;
  specialization: string | null;
  active: boolean;
  created_at: string;
}

export function AdminDash({ user, section }: { user: { name: string }; section: AdminSection }) {
  switch (section) {
    case "overview":
      return <AdminOverview adminName={user.name} />;
    case "users":
      return <UsersPanel />;
    case "schedules":
      return <SchedulesPanel />;
    case "appointments":
      return <AllAppts />;
  }
}

/* ------------------------------ Overview ------------------------------ */
function AdminOverview({ adminName }: { adminName: string }) {
  const [data, setData] = useState<{ appointments: Appointment[]; stats: AdminStats } | null>(null);

  useEffect(() => {
    api<{ appointments: Appointment[]; stats: AdminStats }>("/api/admin/appointments").then((r) => {
      if (r.ok) setData({ appointments: r.data.appointments, stats: r.data.stats });
    });
  }, []);

  const weekly = useMemo(() => {
    if (!data) return [];
    const out: Array<{ day: string; booked: number; completed: number; cancelled: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayAppts = data.appointments.filter((a) => a.date === iso);
      out.push({
        day: DAY_SHORT[d.getUTCDay()],
        booked: dayAppts.filter((a) => a.status === "booked").length,
        completed: dayAppts.filter((a) => a.status === "completed").length,
        cancelled: dayAppts.filter((a) => a.status === "cancelled").length,
      });
    }
    return out;
  }, [data]);

  const statusPie = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Booked", value: data.stats.booked, fill: "#D97706" },
      { name: "Completed", value: data.stats.completed, fill: "#0E8FAE" },
      { name: "Cancelled", value: data.stats.cancelled, fill: "#DC2626" },
    ].filter((d) => d.value > 0);
  }, [data]);

  const live = (data?.appointments ?? []).filter((a) => a.status !== "cancelled");
  const onlineCount = live.filter((a) => a.mode === "online").length;
  const onlinePct = live.length ? Math.round((onlineCount / live.length) * 100) : 0;

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const s = data.stats;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <p className="text-sm text-muted-foreground">Clinic overview · updated live</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Welcome, {adminName.replace(/^Clinic\s+/i, "")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Monitor bookings, manage accounts and keep the schedule tidy.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Registered students" value={s.students} />
        <StatCard icon={Stethoscope} label="Active doctors" value={s.doctors} tone="primary" />
        <StatCard icon={Hourglass} label="Booked (upcoming)" value={s.booked} tone="amber" />
        <StatCard icon={CheckCircle2} label="Completed visits" value={s.completed} tone="primary" />
        <StatCard icon={CalendarX2} label="Cancelled" value={s.cancelled} tone="red" />
        <StatCard
          icon={Activity}
          label="Completion rate"
          value={`${s.completed + s.cancelled === 0 ? "—" : Math.round((s.completed / (s.completed + s.cancelled)) * 100)}%`}
          tone="neutral"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Bookings, last 7 days</CardTitle>
            <CardDescription>Appointments scheduled in the last 7 days, by day and status.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.596 0.125 213 / 18%)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
                <RTooltip cursor={{ fill: "oklch(0.596 0.125 213 / 10%)" }} contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.898 0.018 213)", fontSize: 13 }} />
                <Bar dataKey="booked" name="Booked" fill="#D97706" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#0E8FAE" radius={[6, 6, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Status distribution</CardTitle>
            <CardDescription>All appointments by status.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {statusPie.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No appointments yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={2}>
                    {statusPie.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.898 0.018 213)", fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              {statusPie.map((d) => (
                <span key={d.name} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                  {d.name} · {d.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consultation type</CardTitle>
          <CardDescription>Share of non-cancelled appointments held online by video versus in person.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${onlinePct}% online`}>
            <div className="h-full bg-primary transition-all" style={{ width: `${onlinePct}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Online · {onlineCount}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /> In person · {live.length - onlineCount}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------ Users ------------------------------ */
function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ name: "", email: "", specialization: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [toToggle, setToToggle] = useState<AdminUser | null>(null);

  const load = useCallback(() => {
    api<{ users: AdminUser[] }>("/api/admin/users").then((r) => r.ok && setUsers(r.data.users));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function addDoctor(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await api("/api/admin/users", { method: "POST", body: f });
    setBusy(false);
    if (r.ok) {
      toast.success("Doctor account created", { description: `${f.name} can now log in.` });
      setF({ name: "", email: "", specialization: "", password: "" });
      setShowForm(false);
      load();
    } else {
      toast.error(r.error);
    }
  }

  async function toggle(u: AdminUser) {
    setToToggle(null);
    const r = await api("/api/admin/users", { method: "PATCH", body: { id: u.id, active: !u.active } });
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(u.active ? `${u.name} deactivated` : `${u.name} activated`);
    load();
  }

  const filtered = useMemo(() => {
    if (!users) return null;
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.matric_no ?? "").toLowerCase().includes(q);
    });
  }, [users, query, role]);

  if (users === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, matric…" className="h-10 pl-9" aria-label="Search users" />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-10 w-[140px]" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="doctor">Doctors</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Button className="ml-auto" onClick={() => setShowForm(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add doctor
        </Button>
      </div>

      {filtered!.length === 0 ? (
        <EmptyState icon={Users} title="No users found" desc="Try a different search or role filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="scroll-slim overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[34%]">Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Detail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered!.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">{initials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("rounded-full capitalize font-semibold", u.role === "doctor" ? "bg-primary/10 text-primary" : u.role === "admin" ? "bg-muted text-foreground" : "bg-secondary text-secondary-foreground")}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {u.matric_no || u.specialization || "—"}
                    </TableCell>
                    <TableCell>
                      {u.active ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          <UserRoundCheck className="h-4 w-4" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                          <UserRoundX className="h-4 w-4" /> Deactivated
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      {u.role !== "admin" && (
                        <Button
                          variant={u.active ? "destructiveOutline" : "outline"}
                          size="sm"
                          onClick={() => setToToggle(u)}
                        >
                          {u.active ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Add doctor dialog */}
      <AlertDialog open={showForm} onOpenChange={(v) => !v && setShowForm(false)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-4.5 w-4.5 text-primary" /> Create a doctor account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Share the temporary password with the doctor privately — they can change it from their profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={addDoctor} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-name">Full name</Label>
              <Input id="d-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Dr. Fatima Yusuf" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-email">Email</Label>
              <Input id="d-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="dr.yusuf@buk.edu.ng" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-spec">Specialization</Label>
              <Input id="d-spec" value={f.specialization} onChange={(e) => setF({ ...f, specialization: e.target.value })} placeholder="General Practitioner" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-pass">Temporary password (min 8)</Label>
              <Input id="d-pass" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} minLength={8} required />
            </div>
            <AlertDialogFooter className="pt-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create doctor
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate confirm */}
      <AlertDialog open={!!toToggle} onOpenChange={(v) => !v && setToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-destructive" />
              {toToggle?.active ? "Deactivate" : "Activate"} {toToggle?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toToggle?.active
                ? "This user will no longer be able to log in. Their existing records are kept."
                : "This user will be able to log in again with their existing password."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              className={toToggle?.active ? "bg-destructive text-white hover:bg-destructive/90" : ""}
              onClick={() => toToggle && toggle(toToggle)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------ Schedules ------------------------------ */
interface ScheduleRow {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}

function SchedulesPanel() {
  const [doctors, setDoctors] = useState<Array<{ id: number; name: string }>>([]);
  const [doctorId, setDoctorId] = useState("");
  const [rowsById, setRowsById] = useState<Record<string, ScheduleRow[]>>({});
  const [f, setF] = useState({ weekday: "1", start_time: "09:00", end_time: "13:00", slot_minutes: "20" });
  const [busy, setBusy] = useState(false);
  const rows = doctorId ? rowsById[doctorId] ?? null : [];

  useEffect(() => {
    api<{ doctors: Array<{ id: number; name: string }> }>("/api/doctors").then((r) => r.ok && setDoctors(r.data.doctors));
  }, []);

  const load = useCallback((id: string) => {
    api<{ schedules: ScheduleRow[] }>(`/api/admin/schedules?doctorId=${id}`).then((r) => {
      if (r.ok) setRowsById((prev) => ({ ...prev, [id]: r.data.schedules }));
    });
  }, []);
  useEffect(() => {
    if (doctorId && rowsById[doctorId] === undefined) load(doctorId);
  }, [doctorId, rowsById, load]);

  function invalidate(id: string) {
    setRowsById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await api("/api/admin/schedules", {
      method: "POST",
      body: { doctor_id: Number(doctorId), weekday: Number(f.weekday), start_time: f.start_time, end_time: f.end_time, slot_minutes: Number(f.slot_minutes) },
    });
    setBusy(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Availability added");
    invalidate(doctorId);
    load(doctorId);
  }

  async function remove(id: number) {
    const r = await api(`/api/admin/schedules?id=${id}`, { method: "DELETE" });
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Block removed");
    invalidate(doctorId);
    load(doctorId);
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="space-y-1.5">
        <Label>Doctor</Label>
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger className="h-11" aria-label="Choose a doctor">
            <SelectValue placeholder="Choose a doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {doctorId && rows === null && <Skeleton className="h-48 rounded-xl" />}

      {doctorId && rows !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly availability</CardTitle>
            <CardDescription>
              {rows.length === 0
                ? "No schedule yet — students cannot book this doctor until you add a block."
                : "Students can book any open slot inside these blocks. Slots never overlap."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <EmptyState icon={Clock} title="No availability set" desc="Add a weekly block below to open booking for this doctor." />
            ) : (
              <div className="grid gap-2">
                {rows.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg border px-3.5 py-2.5">
                    <Badge variant="secondary" className="w-14 justify-center rounded-md bg-primary/10 font-semibold text-primary">
                      {DAY_SHORT[s.weekday]}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatTime(s.start_time)} – {formatTime(s.end_time)}
                    </span>
                    <span className="text-xs text-muted-foreground">{s.slot_minutes} min slots</span>
                    <Button variant="destructiveOutline" size="sm" className="ml-auto" onClick={() => remove(s.id)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={add} className="mt-6 space-y-4 border-t pt-5">
              <h3 className="text-sm font-semibold">Add availability</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="s-day">Day</Label>
                  <Select value={f.weekday} onValueChange={(v) => setF({ ...f, weekday: v })}>
                    <SelectTrigger id="s-day" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d, i) => (
                        <SelectItem key={d} value={String(i)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-from">From</Label>
                  <Input id="s-from" type="time" value={f.start_time} onChange={(e) => setF({ ...f, start_time: e.target.value })} className="h-10" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-to">To</Label>
                  <Input id="s-to" type="time" value={f.end_time} onChange={(e) => setF({ ...f, end_time: e.target.value })} className="h-10" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-slot">Slot (minutes)</Label>
                  <Input id="s-slot" type="number" min={5} max={120} value={f.slot_minutes} onChange={(e) => setF({ ...f, slot_minutes: e.target.value })} className="h-10" />
                </div>
              </div>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-1.5 h-4 w-4" /> Add block
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------ All appointments ------------------------------ */
function AllAppts() {
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [toCancel, setToCancel] = useState<Appointment | null>(null);

  const load = useCallback(() => {
    api<{ appointments: Appointment[] }>("/api/admin/appointments").then((r) => r.ok && setItems(r.data.appointments));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function cancel(id: number) {
    setToCancel(null);
    const r = await api(`/api/appointments/${id}`, { method: "PATCH", body: { action: "cancel" } });
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Appointment cancelled");
    load();
  }

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (!q) return true;
      return (
        a.student_name?.toLowerCase().includes(q) ||
        a.doctor_name?.toLowerCase().includes(q) ||
        (a.matric_no ?? "").toLowerCase().includes(q) ||
        a.date.includes(q)
      );
    });
  }, [items, query, status]);

  if (items === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student, doctor, date…" className="h-10 pl-9" aria-label="Search appointments" />
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
        <p className="ml-auto text-sm text-muted-foreground">{filtered?.length ?? 0} shown (latest 300)</p>
      </div>

      {filtered!.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No appointments found" desc="Try a different search or filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="scroll-slim overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>When</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden md:table-cell">Doctor</TableHead>
                  <TableHead className="hidden lg:table-cell">Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered!.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <p className="font-medium">{formatDate(a.date)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(a.time)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{a.student_name}</p>
                      <p className="text-xs text-muted-foreground">{a.matric_no}</p>
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">{a.doctor_name}</TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-sm text-muted-foreground lg:table-cell">
                      {a.reason || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={a.status} />
                        <ModeBadge mode={a.mode} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      {a.status === "booked" && (
                        <Button variant="destructiveOutline" size="sm" onClick={() => setToCancel(a)}>
                          <CalendarX2 className="mr-1.5 h-3.5 w-3.5" /> Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <AlertDialog open={!!toCancel} onOpenChange={(v) => !v && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {toCancel && `${toCancel.student_name}'s visit with ${toCancel.doctor_name} on ${formatDate(toCancel.date)} at ${formatTime(toCancel.time)} will be cancelled.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => toCancel && cancel(toCancel.id)}
            >
              Cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
