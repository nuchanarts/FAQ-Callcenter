# Quickstart & Validation: BGS FAQ Callcenter MVP

## Prerequisites

- Node.js 22+ and npm 10+
- No database needed for local use (file-backed store in `.data/`).

## Run

```bash
npm install
cp .env.example .env.local   # optional; sensible defaults are built in
npm run dev                  # http://localhost:3000
```

Demo accounts: `agent@bgs.local` / `Agent#2026`, `admin@bgs.local` / `Admin#2026`.

## Verify

| Command | Expected |
|---|---|
| `npm run lint` | 0 errors |
| `npm run typecheck` | 0 errors |
| `npm test` | all unit + integration tests pass |
| `npm run test:coverage` | ≥ 80% global, ≥ 90% `src/domain` & `src/services` |
| `npx playwright install chromium && npm run test:e2e` | all E2E specs pass |
| `npm run build` | production build succeeds |

## Manual scenarios

1. **US1**: sign in as agent → press `/` → type `จอดรถ` → `↓` `Enter` → press `c` →
   "Copied" toast; paste shows the answer.
2. **US2**: sign in as admin → Admin → New FAQ → save (draft) → Publish → sign in as
   agent → search finds it → admin unpublishes → agent no longer finds it.
3. **US3**: as agent open `/admin` → "no permission" page; sign out → `/` redirects to
   `/login`.
4. **US4**: open "How to use"; press `?` on search screen → shortcut panel.
5. **US5**: switch EN/TH in the header → reload → language kept.

## Production (Supabase)

Apply `supabase/migrations/*.sql`, then set `DATA_BACKEND=supabase`,
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SESSION_SECRET`
(see `.env.example`).
