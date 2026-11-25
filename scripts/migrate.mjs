// Creates tables and seeds the admin (and optional demo doctors).
// Run: npm run migrate   (needs .env.local with DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD)
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Create .env.local first.");
  process.exit(1);
}
const sql = neon(url);

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
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
  )`,
  `CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_minutes INT NOT NULL DEFAULT 20 CHECK (slot_minutes BETWEEN 5 AND 120),
    CHECK (end_time > start_time)
  )`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appt_date DATE NOT NULL,
    appt_time TIME NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','completed','cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  // Prevents double-booking the same doctor slot (race-condition safe)
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_slot
     ON appointments (doctor_id, appt_date, appt_time) WHERE status = 'booked'`,
  `CREATE INDEX IF NOT EXISTS idx_appt_student ON appointments (student_id, appt_date)`,
  `CREATE INDEX IF NOT EXISTS idx_appt_doctor ON appointments (doctor_id, appt_date)`,
  `CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS idx_msg_pair ON messages (sender_id, receiver_id, created_at)`,
];

for (const s of statements) {
  await sql.query(s);
}
console.log("Tables ready.");

const adminEmail = (process.env.ADMIN_EMAIL || "admin@buk.edu.ng").toLowerCase();
const adminPass = process.env.ADMIN_PASSWORD || "ChangeMe123!";
const existing = await sql.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
if (existing.length === 0) {
  const hash = await bcrypt.hash(adminPass, 10);
  await sql.query(
    "INSERT INTO users (role, name, email, password_hash) VALUES ('admin', 'Clinic Administrator', $1, $2)",
    [adminEmail, hash]
  );
  console.log(`Admin created: ${adminEmail}`);
} else {
  console.log("Admin already exists, skipped.");
}

if (process.env.SEED_DEMO === "true") {
  const demo = [
    ["Dr. Aisha Bello", "dr.bello@buk.edu.ng", "General Practitioner"],
    ["Dr. Musa Danladi", "dr.danladi@buk.edu.ng", "Family Medicine"],
  ];
  const hash = await bcrypt.hash("Doctor123!", 10);
  for (const [name, email, spec] of demo) {
    const r = await sql.query("SELECT id FROM users WHERE email = $1", [email]);
    if (r.length) continue;
    const ins = await sql.query(
      "INSERT INTO users (role, name, email, password_hash, specialization) VALUES ('doctor', $1, $2, $3, $4) RETURNING id",
      [name, email, hash, spec]
    );
    const id = ins[0].id;
    // Monday to Friday, 09:00-13:00, 20-minute slots
    for (let wd = 1; wd <= 5; wd++) {
      await sql.query(
        "INSERT INTO schedules (doctor_id, weekday, start_time, end_time, slot_minutes) VALUES ($1, $2, '09:00', '13:00', 20)",
        [id, wd]
      );
    }
    console.log(`Demo doctor created: ${email}`);
  }
}
console.log("Done.");
