import { query } from "./db";

// Created on first use so production (Neon) works without running SQL by hand.
// The same statements live in scripts/migrate.mjs, scripts/neon-setup.sql and src/lib/demo-seed.ts.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS consultation_records (
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
  )`,
  `CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    rx_no TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    instructions TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

let ready: Promise<void> | undefined;

export function ensureRecordsSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      for (const s of STATEMENTS) await query(s);
    })().catch((e) => {
      ready = undefined;
      throw e;
    });
  }
  return ready;
}
