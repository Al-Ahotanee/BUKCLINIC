-- BUK Clinic Appointment System: schema + seed
-- Paste into the Neon SQL Editor and click Run. Safe to re-run (idempotent).
-- BEFORE RUNNING: change the admin email/password in section 3.

-- 1. Extension (bcrypt hashing, compatible with the app's bcryptjs login)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tables
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
  weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),   -- 0=Sunday ... 6=Saturday
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

-- Prevents two active bookings for the same doctor slot
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_slot
  ON appointments (doctor_id, appt_date, appt_time) WHERE status = 'booked';
CREATE INDEX IF NOT EXISTS idx_appt_student ON appointments (student_id, appt_date);
CREATE INDEX IF NOT EXISTS idx_appt_doctor ON appointments (doctor_id, appt_date);

-- Online consultation (Jitsi): 'in_person' | 'online' plus an unguessable room name
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

-- 3. Seed: admin account  (CHANGE THE EMAIL AND PASSWORD BELOW)
INSERT INTO users (role, name, email, password_hash)
VALUES ('admin', 'Clinic Administrator', 'admin@buk.edu.ng', crypt('ChangeMe123!', gen_salt('bf', 10)))
ON CONFLICT (email) DO NOTHING;

-- 4. Seed: demo doctors (password: Doctor123!). Delete this section if you don't want demo data.
INSERT INTO users (role, name, email, password_hash, specialization) VALUES
  ('doctor', 'Dr. Aisha Bello',  'dr.bello@buk.edu.ng',   crypt('Doctor123!', gen_salt('bf', 10)), 'General Practitioner'),
  ('doctor', 'Dr. Musa Danladi', 'dr.danladi@buk.edu.ng', crypt('Doctor123!', gen_salt('bf', 10)), 'Family Medicine')
ON CONFLICT (email) DO NOTHING;

-- Mon-Fri 09:00-13:00, 20-minute slots, for the demo doctors (only added if they have no schedule yet)
INSERT INTO schedules (doctor_id, weekday, start_time, end_time, slot_minutes)
SELECT u.id, d.wd, '09:00', '13:00', 20
FROM users u
CROSS JOIN generate_series(1, 5) AS d(wd)
WHERE u.email IN ('dr.bello@buk.edu.ng', 'dr.danladi@buk.edu.ng')
  AND NOT EXISTS (SELECT 1 FROM schedules s WHERE s.doctor_id = u.id);

-- 5. Check
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Consultation records and prescriptions (also created automatically on first use)
CREATE TABLE IF NOT EXISTS consultation_records (
  id SERIAL PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chief_complaint TEXT, history TEXT, allergies TEXT,
  bp TEXT, temperature TEXT, pulse TEXT, weight TEXT,
  examination TEXT, diagnosis TEXT, treatment_plan TEXT, advice TEXT,
  follow_up_date DATE, private_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  rx_no TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  instructions TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
