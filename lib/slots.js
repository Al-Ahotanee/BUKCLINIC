import { query } from "./db";

const TZ = "Africa/Lagos";

export function isValidDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d + "T00:00:00Z"));
}

export function isValidTime(t) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

// Current date (YYYY-MM-DD) and time (HH:MM) in Kano/Lagos time
export function nowLagos() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const g = (t) => parts.find((p) => p.type === t).value;
  const hour = g("hour") === "24" ? "00" : g("hour");
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${hour}:${g("minute")}` };
}

function toMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(min) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

// All free slots (array of "HH:MM") for a doctor on a date.
export async function freeSlots(doctorId, date) {
  const weekday = new Date(date + "T00:00:00Z").getUTCDay();
  const sched = await query(
    "SELECT to_char(start_time,'HH24:MI') AS s, to_char(end_time,'HH24:MI') AS e, slot_minutes FROM schedules WHERE doctor_id = $1 AND weekday = $2",
    [doctorId, weekday]
  );
  if (!sched.length) return [];
  const booked = await query(
    "SELECT to_char(appt_time,'HH24:MI') AS t FROM appointments WHERE doctor_id = $1 AND appt_date = $2 AND status = 'booked'",
    [doctorId, date]
  );
  const taken = new Set(booked.map((b) => b.t));
  const now = nowLagos();
  const all = new Set();
  for (const b of sched) {
    for (let m = toMin(b.s); m + b.slot_minutes <= toMin(b.e); m += b.slot_minutes) {
      all.add(toHHMM(m));
    }
  }
  return [...all]
    .sort()
    .filter((t) => !taken.has(t))
    .filter((t) => date > now.date || (date === now.date && t > now.time));
}
