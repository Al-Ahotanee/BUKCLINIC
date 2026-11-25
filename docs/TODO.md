# BUK Clinic — Work Plan (update after every batch)

Legend: [x] done · [ ] pending · [~] in progress

## Batch 0 — Planning
- [x] Clone repo, audit stack (Next.js 16, Tailwind 4, shadcn, Neon/PGlite)
- [x] Identify BUK brand: official colour = Turquoise Blue (BUK Communication Policy §5.14)
- [x] TODO.md + HANDOVER.md + asset fetch script

## Batch 1 — BUK theme
- [ ] globals.css: replace Clinical Emerald tokens with BUK Turquoise Blue (light + dark)
- [ ] Logo component: real BUK crest (local /brand/buk-logo.png → remote → SVG fallback)
- [ ] layout.tsx themeColor/metadata, public/icon.svg recoloured

## Batch 2 — BUK imagery and pages
- [ ] Landing hero + sections with BUK campus images
- [ ] Navbar, footer, login/register auth shell use crest + imagery

## Batch 3 — Database for consultations
- [ ] appointments.mode ('in_person' | 'online'), appointments.room, started_at, ended_at
- [ ] Update scripts/migrate.mjs, scripts/neon-setup.sql, src/lib/db.ts (PGlite) + demo seed

## Batch 4 — Jitsi video consultation
- [ ] src/components/consultation/jitsi-room.tsx (Jitsi IFrame API, meet.jit.si)
- [ ] API: GET /api/consultations/[id] (auth + room name), POST join/end
- [ ] Booking flow: student chooses In-person or Online
- [ ] Doctor + student dashboards: "Join video call" button, call page /dashboard/call/[id]

## Batch 5 — Chat + polish
- [ ] Messages: "Start video call" button inside thread
- [ ] Dashboard UI polish with BUK theme (app-shell, stat cards, charts)
- [ ] README update, final HANDOVER update
