# Bayero University Clinic — Appointment Platform

The official online appointment booking and secure messaging platform for the **Bayero University
Kano Clinic**. Students register with their matriculation number, see live doctor availability,
book / reschedule / cancel consultations, and message their doctor — all in one place.

## Features

**Students**
- Self-service registration (matric number required) and login
- Live availability: 14-day date picker with morning / afternoon slot grouping
- Book, reschedule, and cancel with confirmation dialogs and toast feedback
- Private one-to-one messaging with clinic doctors
- Profile: phone number + password change

**Doctors**
- Today-at-a-glance overview with stats
- Appointment management (upcoming / today / all) with search
- Mark visits complete or cancel them
- Message students who have an appointment or conversation with them

**Administrators**
- Live overview: user counts, appointment status, 7-day booking chart, completion rate
- Create doctor accounts, activate / deactivate any user
- Manage doctor weekly schedules (blocks, slot length, overlap protection)
- Browse and cancel any appointment (latest 300)

**Platform**
- Role-based dashboards (student / doctor / admin) with sidebar navigation
- Light & dark themes, fully responsive down to small phones
- Double-booking is impossible: a partial unique index in Postgres plus API-level checks
- Slot times are Africa/Lagos aware; past slots are hidden automatically
- Messaging uses 8-second polling — serverless-friendly, no WebSocket infrastructure

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript (strict)
- **Tailwind CSS 4** + shadcn/ui (New York) + Lucide icons + Framer Motion + Recharts
- **Neon Postgres** via `@neondatabase/serverless` (HTTP driver — zero-config on Vercel)
- **JWT cookie auth** (`jose`, httpOnly cookies) + bcryptjs password hashing
- **Embedded preview DB**: without `DATABASE_URL` the app boots on an in-repo Postgres
  (PGlite) pre-seeded with demo data — clone, `npm install`, `npm run dev`, done.

## Database tables

| Table | Purpose |
| --- | --- |
| `users` | student / doctor / admin accounts (role column) |
| `schedules` | doctor weekly availability blocks (weekday, start, end, slot minutes) |
| `appointments` | booked / completed / cancelled visits |
| `messages` | one-to-one student ↔ doctor messages with read receipts |

## 1 · Create the database

Create a project on [neon.tech](https://neon.tech) and copy the **pooled** connection string.
Then either:

- run `npm run migrate` (creates all tables + the admin account, optional demo doctors), **or**
- paste `scripts/neon-setup.sql` into the Neon SQL Editor (idempotent, safe to re-run).

## 2 · Configure

```bash
cp .env.example .env.local
# fill DATABASE_URL and JWT_SECRET (openssl rand -base64 32)
npm run migrate
```

## 3 · Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Without `DATABASE_URL`, the app starts an embedded demo database instead:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@buk.edu.ng` | `Admin123!` |
| Doctor | `dr.bello@buk.edu.ng` | `Doctor123!` |
| Doctor | `dr.danladi@buk.edu.ng` | `Doctor123!` |
| Doctor | `dr.yusuf@buk.edu.ng` | `Doctor123!` |
| Student | `musa.ibrahim@student.buk.edu.ng` | `Student123!` |

## 4 · Deploy to Vercel

1. Push to GitHub and import the repo in Vercel (framework auto-detected).
2. Add environment variables: `DATABASE_URL`, `JWT_SECRET`.
3. Deploy. Run `npm run migrate` once against the same `DATABASE_URL` — it is not needed per deploy.

## Project layout

```
src/app/            landing page, /login, /register, /dashboard + REST API routes
src/components/     site (landing chrome) · dashboard (shell, role dashboards) · ui (shadcn)
src/lib/            db (Neon + embedded fallback), auth (JWT/cookies/role guard), slots, api helpers
scripts/            migrate.mjs (schema + seed) · neon-setup.sql (SQL-editor alternative)
```

## Notes

- This platform handles **booking and messaging only** — it is not for emergencies and not a
  medical records system.
- Before going live: change the admin password, use a strong `JWT_SECRET`, and consider adding
  rate limiting on login.


## Online consultation (Jitsi)

Students choose **In person** or **Online** when booking. Online bookings get an unguessable room name that only the
student and doctor on that appointment can fetch (`GET /api/consultations/[id]`), available from 15 minutes before the
slot to 90 minutes after it starts. Join from **My appointments**, the dashboard overview, or the **Messages** thread
(Start video call). The call page is `/dashboard/call/[id]`.

Video uses the Jitsi IFrame API. For rooms that open instantly, create a free JaaS key at jaas.8x8.vc and set
`JAAS_APP_ID`, `JAAS_KID` and `JAAS_PRIVATE_KEY` (see `.env.example`); the doctor joins as moderator. Without them the
app uses the public `meet.jit.si` server, where the first person must sign in once. `NEXT_PUBLIC_JITSI_DOMAIN` points
at a self-hosted server instead. Text chat is the built-in Messages feature, and Jitsi also has
in-call chat.

## Consultation records and prescriptions

Doctors record each consultation (complaint, history, vitals, examination, diagnosis, plan, private notes) from
**Appointments > Consultation record**, and can write a prescription and send it to the patient. Students see sent
prescriptions under **Prescriptions** as a formal clinic form that can be printed or saved as a PDF. The tables are
created automatically on first use.
