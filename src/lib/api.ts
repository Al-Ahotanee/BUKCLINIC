// Client-side fetch helper: returns { ok, data, error }
export async function api<T = Record<string, unknown>>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ ok: boolean; data: T; error: string; status: number }> {
  try {
    const res = await fetch(path, {
      method: options.method || "GET",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, error: (data as { error?: string }).error || "Something went wrong", data: data as T };
    }
    return { ok: true, data: data as T, error: "", status: res.status };
  } catch {
    return { ok: false, status: 0, error: "Network error. Check your connection.", data: {} as T };
  }
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function todayISO(): string {
  // Date string in Africa/Lagos
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// "2025-11-25" -> "Tue, 25 Nov 2025"
export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

// "2025-11-25" -> "25 Nov 2025" (no weekday — combine with relativeDay which already names the weekday)
export function formatDatePlain(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(d);
}

// "2025-11-25" -> "25 Nov"
export function formatDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" }).format(d);
}

// "14:30" -> "2:30 PM"
export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function relativeDay(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Today";
  if (iso === addDaysISO(today, 1)) return "Tomorrow";
  if (iso === addDaysISO(today, -1)) return "Yesterday";
  const weekday = new Date(iso + "T00:00:00Z").getUTCDay();
  return DAY_NAMES[weekday];
}

export interface Appointment {
  id: number;
  date: string;
  time: string;
  reason: string | null;
  status: "booked" | "completed" | "cancelled";
  student_id?: number;
  doctor_id?: number;
  student_name?: string;
  matric_no?: string | null;
  doctor_name?: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string | null;
  availability: Array<{ day: string; weekday: number; start: string; end: string; slot_minutes: number }>;
}

export interface Contact {
  id: number;
  name: string;
  detail: string | null;
  unread: number;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  body: string;
  created_at: string;
}

export interface SessionUser {
  id: number;
  role: "student" | "doctor" | "admin";
  name: string;
  email: string;
  matric_no: string | null;
  phone: string | null;
  specialization: string | null;
  active: boolean;
}

export function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
