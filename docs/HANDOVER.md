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
- Next: Batch 5 (chat "Start video call" button in messages.tsx, dashboard polish, README).
