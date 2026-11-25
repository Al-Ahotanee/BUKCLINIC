# BUK Clinic Appointment Booking System

Web-based patient appointment booking and messaging system for the Bayero University Clinic
(student / doctor / administrator roles).

**Stack:** Next.js 14 (App Router) · Neon Postgres (`@neondatabase/serverless`, HTTP driver) · JWT cookie auth (`jose`) · bcryptjs. Deploys to Vercel with zero extra config.

## Features
- **Students:** register, log in, view doctors and weekly availability, book / reschedule / cancel, message doctors.
- **Doctors:** view upcoming/today/all appointments, mark completed or cancel, reply to students.
- **Admin:** create doctor accounts, activate/deactivate users, manage doctor weekly schedules, see all appointments and stats.
- Double-booking is prevented in the database (partial unique index) and checked in the API.
- Slot times use Africa/Lagos time, past slots are hidden.
- Messaging uses polling (8s), which works on Vercel serverless.

## 1. Create the Neon database
1. Go to https://neon.tech, create a project, copy the **pooled** connection string.

## 2. Run locally
```bash
npm install
cp .env.example .env.local     # fill DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run migrate                # creates tables, the admin, and (optionally) 2 demo doctors
npm run dev                    # http://localhost:3000
```
Generate a secret with `openssl rand -base64 32`.

Default demo logins (if `SEED_DEMO=true`): `dr.bello@buk.edu.ng` / `Doctor123!`. Admin uses the values you set in `.env.local`.

## 3. Deploy to Vercel
1. Push this folder to a GitHub repo (or run `npx vercel`).
2. In Vercel: **Add New Project** → import the repo (framework auto-detected as Next.js).
3. Add Environment Variables: `DATABASE_URL`, `JWT_SECRET`.
4. Deploy. (Run `npm run migrate` once from your machine against the same `DATABASE_URL`; it is not needed on every deploy.)

## Project layout
```
app/api/...        REST endpoints (auth, doctors, appointments, messages, admin)
app/dashboard      role-based dashboard
components/        StudentDash, DoctorDash, AdminDash, Messages, SlotPicker
lib/               db (Neon), auth (JWT/cookies/role guard), slots (availability logic)
scripts/migrate.mjs  schema + seed
```

## Database tables
`users` (role: student|doctor|admin) · `schedules` (doctor weekly blocks) · `appointments` (booked|completed|cancelled) · `messages`.

## Notes / limitations
Booking and messaging only; not for emergencies and not a medical records system (matches the project scope).
Before going live: change the admin password, use a strong `JWT_SECRET`, and consider adding rate limiting on login.
