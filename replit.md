# Quran Pro Audio

Quran Pro Audio is a mobile listening experience for Quran recitations, ayah-level learning, and offline-ready playback.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/quran-pro-audio/app/` — Expo Router screens for home, library, reciters, and the full player.
- `artifacts/quran-pro-audio/context/AudioContext.tsx` — shared playback state and local persistence.
- `artifacts/quran-pro-audio/services/audio/` — platform-neutral contracts for playback, ayah synchronization, and downloads.
- `artifacts/quran-pro-audio/data/quran.ts` — initial surah, ayah, and reciter catalog.
- `artifacts/quran-pro-audio/constants/colors.ts` — dark Quran Pro Audio theme tokens.

## Architecture decisions

- The first build is frontend-first and persists playback preferences with AsyncStorage; no server or database is required for the listening loop.
- Audio playback is isolated behind platform-neutral services so AVAudioSession/ExoPlayer adapters can be added without changing screen components.
- The mobile experience uses a single shared audio context so the mini-player, full player, and transcript remain synchronized.

## Product

- Browse featured and popular surahs.
- Open a full player with seek, skip, speed, repeat, sleep timer, waveform, and live transcript states.
- Manage reciters and an offline library surface.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
