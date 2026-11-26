# HANDOVER PROMPT (paste into another LLM agent)

You are continuing work on **Al-Ahotanee/BUKCLINIC** — the Bayero University Kano Clinic appointment
platform (Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui, Neon Postgres with an
embedded PGlite fallback, JWT cookie auth).

## Goals from the owner (SG)
1. Re-skin the UI with BUK branding: official colour **Turquoise Blue**, BUK logo and BUK images.
2. Add online consultation + chat + video calls using the **free Jitsi** API (meet.jit.si, IFrame API).
3. Push to GitHub in **small batches** so partial progress is never lost.

## Rules
- Read `docs/TODO.md` first; do the first unchecked batch; tick items as you finish; commit + push each batch.
- Never commit secrets. Ask the owner for a GitHub token if you need to push; do not store it in the repo.
- Keep `npm run build` and `npm run lint` passing before each push.

## Brand facts
- Official colour: Turquoise Blue. Logo: https://buk.edu.ng/sites/default/files/inline-images/buk-logo.png
- Hero image: https://buk.edu.ng/sites/default/files/2020-12/DJI_00302.jpg
- Run `npm run assets` on a machine with internet to download these into `public/brand/`.
- Components fall back local file → remote URL → inline SVG crest.

## Status
See the checklist in docs/TODO.md and `git log` for the latest completed batch.

## Batch 4 notes (Jitsi)
- Room name is generated at booking (appointments.room, unguessable). It is only returned by GET /api/consultations/[id] to the student/doctor on that appointment, inside the join window.
- Public meet.jit.si may require a moderator login or limit embedded use; set NEXT_PUBLIC_JITSI_DOMAIN to a self-hosted Jitsi or JaaS-compatible domain if so.
- Batch 5 done: chat "Start video call" button, polish, README. Remaining: verify on a deployed build with two accounts; optional extra polish (charts in admin dash).

## Fixes after first deploy test (Nov 26)
- Jitsi `membersOnly` error: public meet.jit.si makes the first person sign in as moderator. Added JaaS (8x8 free tier) support: `src/lib/jitsi.ts` signs an RS256 JWT server-side (doctor = moderator). Set JAAS_APP_ID, JAAS_KID, JAAS_PRIVATE_KEY in Vercel; without them it falls back to the public server with an on-screen hint.
- 404s on /brand/buk-logo.png and buk-campus.jpg: official files were never committed (sandbox cannot reach buk.edu.ng). Added local SVG logo + campus illustration (placeholders, not the official crest) and pointed `src/lib/brand.ts` at them. To use official artwork: add PNG/JPG to public/brand and edit brand.ts.
- Admin dashboard: charts retinted to BUK turquoise, new Consultation type card, Online badge in the all-appointments table.

## Real BUK assets (Nov 26)
- Real crest (public/brand/buk-logo.png, 80x80), aerial campus (buk-campus-aerial.jpg) and main building (buk-campus-building.jpg) supplied by the user are now in use; SVGs remain as fallbacks. Source images are only 474x266, so higher-resolution originals would look sharper. Favicon now uses the crest.

## Consultation records + prescriptions (Nov 26) — DONE, needs a real-browser check
- Tables consultation_records and prescriptions are created automatically on first use (src/lib/records-schema.ts); also in migrate.mjs, neon-setup.sql, demo-seed.ts.
- Doctor: Appointments > "Consultation record" opens a side sheet (Consultation, Diagnosis & plan, Prescription tabs). "Save record" keeps it private; "Save & send prescription" needs a diagnosis and at least one medicine, releases it to the student and posts an in-app message. Private notes never leave the doctor side.
- Student: sidebar "Prescriptions" lists sent prescriptions; opening one shows the formal letterhead form (src/components/consultation/prescription-sheet.tsx) with Print / Save as PDF (print CSS at the end of globals.css).
- API-tested against the embedded database (access control, validation, message). The UI itself was only type-checked and linted, not viewed in a browser.
- Ideas: doctor-side list of issued prescriptions, QR/verification code on the form, open the record sheet from the video call page.
