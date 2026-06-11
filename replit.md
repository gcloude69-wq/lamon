# Lampira

Lampira adalah marketplace wisata Lampung all-in-one — turis mudah menemukan destinasi, vendor mudah promosi, dengan sistem komisi transparan.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/lampira run dev` — run the frontend (port 18092)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, Framer Motion, Recharts, next-themes, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema: users, listings, bookings, reviews
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/lampira/src/` — React frontend

## Architecture decisions

- Simple base64 token auth (no external auth service needed for MVP)
- Commission rates are hardcoded per category (transport 12%, accommodation 10%, restaurant 5%, tour 15%, event 10%, guide 10%, souvenir 5%)
- All prices in IDR (Indonesian Rupiah)
- Vendor trust score stored on user record (defaults 100)
- i18n handled client-side with a simple key-value map (no external i18n library)

## Product

Lampira has two sides:
- **Tourist side**: Homepage, listings browsing/filtering, listing detail + booking, booking history, multi-language UI (10 languages), dark/light mode
- **Vendor side**: Dashboard with analytics, listing management (CRUD), booking management (accept/reject), earnings breakdown with commission details

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen`
- Auth token is base64-encoded `userId:email:role` — simple but sufficient for dev
- Do not change `info.title` in openapi.yaml — it controls generated filenames

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
