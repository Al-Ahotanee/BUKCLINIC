import bcrypt from "bcryptjs";
import type { PGlite } from "@electric-sql/pglite";

/**
 * Schema + demo data for the embedded preview database.
 *
 * The schema mirrors scripts/neon-setup.sql (and scripts/migrate.mjs) exactly,
 * so behaviour in preview matches a production Neon deployment.
 * Seeding runs only once — when the users table is empty.
 */

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student','doctor','admin')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  matric_no TEXT,
  phone TEXT,
  specialization TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes INT NOT NULL DEFAULT 20 CHECK (slot_minutes BETWEEN 5 AND 120),
  CHECK (end_time > start_time)
);
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appt_date DATE NOT NULL,
  appt_time TIME NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_slot
  ON appointments (doctor_id, appt_date, appt_time) WHERE status = 'booked';
CREATE INDEX IF NOT EXISTS idx_appt_student ON appointments (student_id, appt_date);
CREATE INDEX IF NOT EXISTS idx_appt_doctor ON appointments (doctor_id, appt_date);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'in_person';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS room TEXT;
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_msg_pair ON messages (sender_id, receiver_id, created_at);
`;

function lagosNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = g("hour") === "24" ? "00" : g("hour");
  return {
    date: `${g("year")}-${g("month")}-${g("day")}`,
    minutes: Number(hour) * 60 + Number(g("minute")),
  };
}

function addDays(date: string, days: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Picks a realistic "booked" slot for the demo: later today when the morning
// clinic is still ahead, otherwise tomorrow at 09:00.
function upcomingSlot() {
  const now = lagosNow();
  // Mon-Fri 09:00-13:00 schedule, 20-minute slots (09:00 ... 12:40)
  const day = new Date(now.date + "T00:00:00Z").getUTCDay();
  if (day >= 1 && day <= 5 && now.minutes < 12 * 60 + 40) {
    const slot = Math.ceil((now.minutes + 90) / 20) * 20; // ~1.5h from now, snapped to 20 min
    if (slot >= 9 * 60 && slot <= 12 * 60 + 40) {
      return { date: now.date, time: `${String(Math.floor(slot / 60)).padStart(2, "0")}:${String(slot % 60).padStart(2, "0")}` };
    }
  }
  return { date: addDays(now.date, 1), time: "09:00" };
}

function pastDate(daysAgo: number) {
  return addDays(lagosNow().date, -daysAgo);
}

export async function seedDemoData(pg: PGlite) {
  const existing = await pg.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users");
  if (Number(existing.rows[0]?.count ?? 0) > 0) return;

  const adminHash = await bcrypt.hash("Admin123!", 10);
  const doctorHash = await bcrypt.hash("Doctor123!", 10);
  const studentHash = await bcrypt.hash("Student123!", 10);

  // Admin
  await pg.query(
    "INSERT INTO users (role, name, email, password_hash) VALUES ('admin', 'Clinic Administrator', 'admin@buk.edu.ng', $1)",
    [adminHash]
  );

  // Doctors
  const doctors = [
    ["Dr. Aisha Bello", "dr.bello@buk.edu.ng", "General Practitioner"],
    ["Dr. Musa Danladi", "dr.danladi@buk.edu.ng", "Family Medicine"],
    ["Dr. Fatima Yusuf", "dr.yusuf@buk.edu.ng", "Pediatrics"],
  ];
  const doctorIds: number[] = [];
  for (const [name, email, spec] of doctors) {
    const r = await pg.query<{ id: number }>(
      "INSERT INTO users (role, name, email, password_hash, specialization) VALUES ('doctor', $1, $2, $3, $4) RETURNING id",
      [name, email, doctorHash, spec]
    );
    doctorIds.push(r.rows[0].id);
  }

  // Weekly schedules
  // Bello: Mon-Fri 09:00-13:00 (20 min) — mirrors the production demo seed
  for (let wd = 1; wd <= 5; wd++) {
    await pg.query(
      "INSERT INTO schedules (doctor_id, weekday, start_time, end_time, slot_minutes) VALUES ($1, $2, '09:00', '13:00', 20)",
      [doctorIds[0], wd]
    );
  }
  // Danladi: Mon-Fri 09:00-13:00 plus Tue/Thu 14:00-16:00 (30 min)
  for (let wd = 1; wd <= 5; wd++) {
    await pg.query(
      "INSERT INTO schedules (doctor_id, weekday, start_time, end_time, slot_minutes) VALUES ($1, $2, '09:00', '13:00', 20)",
      [doctorIds[1], wd]
    );
  }
  for (const wd of [2, 4]) {
    await pg.query(
      "INSERT INTO schedules (doctor_id, weekday, start_time, end_time, slot_minutes) VALUES ($1, $2, '14:00', '16:00', 30)",
      [doctorIds[1], wd]
    );
  }
  // Yusuf: Mon/Wed/Fri 09:00-12:00 (15 min)
  for (const wd of [1, 3, 5]) {
    await pg.query(
      "INSERT INTO schedules (doctor_id, weekday, start_time, end_time, slot_minutes) VALUES ($1, $2, '09:00', '12:00', 15)",
      [doctorIds[2], wd]
    );
  }

  // Students
  const students = [
    ["Musa Ibrahim", "musa.ibrahim@student.buk.edu.ng", "UG22/PHY/1001", "08031234501"],
    ["Zainab Ado", "zainab.ado@student.buk.edu.ng", "UG21/CHE/0934", "08031234502"],
    ["Emeka Obi", "emeka.obi@student.buk.edu.ng", "UG23/BIO/1145", null],
  ];
  const studentIds: number[] = [];
  for (const [name, email, matric, phone] of students) {
    const r = await pg.query<{ id: number }>(
      "INSERT INTO users (role, name, email, password_hash, matric_no, phone) VALUES ('student', $1, $2, $3, $4, $5) RETURNING id",
      [name, email, studentHash, matric, phone]
    );
    studentIds.push(r.rows[0].id);
  }

  // Appointments: history + upcoming, so every dashboard has real data
  const next = upcomingSlot();
  const appts: Array<[number, number, string, string, string | null, string]> = [
    // Musa's history
    [studentIds[0], doctorIds[0], pastDate(9), "09:20", "Persistent cough and chest discomfort", "completed"],
    [studentIds[0], doctorIds[1], pastDate(4), "10:00", "Follow-up on cough medication", "completed"],
    [studentIds[0], doctorIds[1], pastDate(2), "11:00", "Dental pain", "cancelled"],
    // Musa's upcoming booking
    [studentIds[0], doctorIds[0], next.date, next.time, "Recurring headaches after evening lectures", "booked"],
    // Zainab upcoming
    [studentIds[1], doctorIds[0], addDays(lagosNow().date, 1), "09:40", "Routine antenatal check", "booked"],
    // Emeka history
    [studentIds[2], doctorIds[2], pastDate(6), "09:00", "Sore throat and mild fever", "completed"],
  ];
  for (const [sid, did, date, time, reason, status] of appts) {
    await pg.query(
      "INSERT INTO appointments (student_id, doctor_id, appt_date, appt_time, reason, status) VALUES ($1,$2,$3,$4,$5,$6)",
      [sid, did, date, time, reason, status]
    );
  }

  // A short message thread between Musa and Dr. Bello
  const now = new Date();
  const hAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
  await pg.query(
    "INSERT INTO messages (sender_id, receiver_id, body, created_at, read_at) VALUES ($1,$2,$3,$4,$5)",
    [studentIds[0], doctorIds[0], "Good afternoon Doctor. I have been having headaches after evening lectures this week. Should I come in?", hAgo(26), hAgo(25)]
  );
  await pg.query(
    "INSERT INTO messages (sender_id, receiver_id, body, created_at) VALUES ($1,$2,$3,$4)",
    [doctorIds[0], studentIds[0], "Good afternoon Musa. Yes, please book a consultation and mention the headaches. In the meantime, stay hydrated and reduce screen time at night.", hAgo(25)]
  );
  await pg.query(
    "INSERT INTO messages (sender_id, receiver_id, body, created_at) VALUES ($1,$2,$3,$4)",
    [studentIds[0], doctorIds[0], "Thank you Doctor. I just booked an appointment.", hAgo(2)]
  );
}
