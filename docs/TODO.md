# BUK Clinic — Work Plan (update after every batch)

Legend: [x] done · [ ] pending · [~] in progress

## Batch 0 — Planning
- [x] Clone repo, audit stack (Next.js 16, Tailwind 4, shadcn, Neon/PGlite)
- [x] Identify BUK brand: official colour = Turquoise Blue (BUK Communication Policy §5.14)
- [x] TODO.md + HANDOVER.md + asset fetch script

## Batch 1 — BUK theme
- [x] globals.css: BUK Turquoise Blue tokens (light + dark)
- [x] Logo component: BUK crest (local → remote → SVG fallback)
- [x] layout.tsx themeColor, icon.svg recoloured

## Batch 2 — BUK imagery and pages
- [x] Landing hero + online-consultation band with BUK campus image
- [x] Auth shell uses crest + campus imagery (navbar/footer inherit new Logo)

## Batch 3 — Database for consultations
- [x] appointments.mode (in_person|online) + appointments.room (Jitsi room name)
- [x] ALTER TABLE ... ADD COLUMN IF NOT EXISTS in migrate.mjs, neon-setup.sql, demo-seed.ts; POST /api/appointments accepts mode

## Batch 4 — Jitsi video consultation
- [x] src/components/consultation/jitsi-room.tsx (Jitsi IFrame API, meet.jit.si; domain via NEXT_PUBLIC_JITSI_DOMAIN)
- [x] API: GET /api/consultations/[id] (participants only; room released 15 min before slot to 90 min after), POST {action:"end"} (doctor)
- [x] Booking flow: student chooses In-person or Online
- [x] Doctor + student dashboards: "Join video call" button + Online badge, call page /dashboard/call/[id]
- [ ] Verify on a deployed build with two real accounts (sandbox could not run `next build`: Google Fonts blocked; tsc + eslint on new files are clean)

## Batch 5 — Chat + polish
- [ ] Messages: "Start video call" button inside thread
- [ ] Dashboard UI polish with BUK theme (app-shell, stat cards, charts)
- [ ] README update, final HANDOVER update
