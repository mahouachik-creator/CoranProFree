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
- `artifacts/quran-pro-audio/context/AudioContext.tsx` — shared ayah-level playback, favorites, playlists, and local state.
- `artifacts/quran-pro-audio/services/audio/` — playback contracts and persistent audio downloads.
- `artifacts/quran-pro-audio/data/quran.ts` plus `data/quran-part-*.ts` — complete 114-surah Arabic text catalog.
- `artifacts/quran-pro-audio/constants/colors.ts` — dark Quran Pro Audio theme tokens.

## Architecture decisions

- The app uses Expo Audio playlists with one EveryAyah MP3 per verse so playback and transcript highlighting cover the full surah.
- Favorites, playlists, playback preferences, and download manifests persist with AsyncStorage; audio files live in the app's document storage.
- The mobile experience uses a single shared audio context so the mini-player, full player, and transcript remain synchronized.

## Product

- Browse all 114 surahs and all 6,236 ayahs.
- Play full surahs continuously, with ayah-level transcript synchronization, speed, repeat, and sleep controls.
- Save favorites and custom playlists; download, pause, resume, and remove complete surah audio for offline playback.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- EveryAyah recitations are separate MP3s per ayah; keep the padded surah/ayah URL pattern and build the complete queue instead of playing only ayah 1.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
