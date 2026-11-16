# Research: Self-Service FAQ MVP (revised for constitution v2.0.0)

All Technical Context unknowns are resolved below. Versions checked against the npm
registry on 2026-11-16.

## R1. Web framework

- **Decision**: Next.js 16 (App Router, React 19, TypeScript `strict`), Turbopack dev.
- **Rationale**: User-requested direction; Server Components keep the bundle small
  (Constitution IV), Server Actions give thin, typed mutation entry points (VII).
  Next 16 uses `proxy.ts` (formerly `middleware.ts`) for request interception, and
  `cookies()` / `params` are async.
- **Alternatives**: Vite SPA + separate API (more moving parts, two deployables).

## R2. Data access & running without external services

- **Decision**: A `FaqRepository` / `CategoryRepository` / `UserRepository` interface
  with three adapters chosen by `DATA_BACKEND`:
  - `file` (default for `npm run dev`): JSON file under `.data/` seeded on first run —
    the app runs with zero external setup and admin edits persist across restarts.
  - `memory`: used by unit/integration tests and E2E (fresh, deterministic state).
  - `supabase`: production adapter using `@supabase/supabase-js` 2.x and SQL migrations
    in `supabase/migrations/` with Row Level Security.
- **Rationale**: Docker is not running on the dev machine, so local Supabase is not
  available; the interface keeps business logic adapter-independent (VII) and testable.
  One shared contract test suite runs against every adapter, proving they behave the same.
- **Alternatives**: SQLite (native build on Windows, extra dependency); Supabase only
  (blocks local development and tests without credentials).

## R3. Search & ranking

- **Decision**: Pure `searchTopics()` in `src/domain/search.ts`, run in the browser over
  the visible topic list (≤ 200 topics) so typing never waits on the network. NFC,
  lower-case, collapse whitespace, cap 200 chars; substring match per term (Thai has no
  spaces); all terms must match; score title 3 / keywords 2 / solution 1; ties keep
  curated `order`.
- **Rationale**: One ranking rule (XIV); instant results (XI); works even if the API is
  slow.
- **Alternatives**: Server-side search per keystroke (network latency on 4G).

## R4. Authentication & sessions

- **Decision**: Viewers never sign in. Admins only: local provider with `crypto.scrypt`
  hashes and an HS256 `jose` session cookie (httpOnly, sameSite=lax, secure in prod, 8 h).
  `proxy.ts` redirects signed-out `/admin*` requests; every admin action re-checks via
  `requireAdmin()`. Production can swap to Supabase Auth behind the same interface.

## R5. Validation

- **Decision**: `zod` 4.x schemas in `src/domain/` shared by client forms and server
  actions.
- **Rationale**: Constitution VII — validation defined once.

## R6. UI system

- **Decision**: Tailwind CSS 4 with design tokens as CSS variables in
  `src/app/globals.css`; shadcn-style shared primitives in `src/components/ui/`
  (Button, Input, Textarea, Select, Badge, Card, Dialog, Kbd, Toast, EmptyState,
  ErrorState, Skeleton). Font: IBM Plex Sans Thai (Thai + Latin, highly legible) via
  `next/font/google`. Calm hospital palette (teal primary, warm neutrals), dark mode.
- **Rationale**: Constitution III/VI — one token source, one component library.
- **Alternatives**: Full shadcn CLI install (pulls Radix for every primitive; we only
  need a dialog, which is built on the native `<dialog>` element).

## R7. UI language

- **Decision**: Thai only (Principle IV). All strings in `src/i18n/th.ts`, accessed via a
  typed `t` object — no inline literals (X).

## R8. Testing

- **Decision**: Vitest 5 (unit + integration, `node` and `jsdom` environments,
  `@testing-library/react`), coverage via `@vitest/coverage-v8` with thresholds
  80% global / 90% `src/domain` + `src/services`. Playwright 1.65 for E2E, running the
  production build with `DATA_BACKEND=memory`; axe accessibility checks with
  `@axe-core/playwright`.
- **Rationale**: Constitution II; fast, deterministic tests.

## R9. Concurrency (FR-017)

- **Decision**: Optimistic concurrency — every FAQ has an integer `version`; update
  requires `expectedVersion`; mismatch → `ConflictError`.
- **Rationale**: Simple, works identically in every adapter.

## R10. Built-in content & no-database fallback

- **Decision**: Built-in topics are a typed module `src/content/base-topics.ts` shipped in
  the bundle. The store only holds overrides/hidden flags/custom topics. `getPublicTopics()`
  catches store errors and returns built-in topics with `degraded: true` (FR-019).
- **Rationale**: Principle VI (originals never deleted, restore always possible) and VII
  (works without DB) fall out of the design for free.

## R11. Safe content rendering

- **Decision**: Small parser `parseContent()` → AST → React elements. No HTML strings and
  no `dangerouslySetInnerHTML`; React escapes text. Links rendered only for `https://`,
  with `rel="noopener noreferrer"` and `target="_blank"`.
- **Rationale**: Principle V; a markdown library would bring HTML passthrough to disable.

## R12. Attachments (clarified 2026-11-16)

- **Decision**: MVP stores attachments as https links only (YouTube Unlisted, Google
  Drive, PDF URLs), validated by `isHttpsUrl()`. No file storage.
- **Rationale**: Constitution VII already routes long clips to YouTube/Drive; avoids
  storage, size checks and file-delete flows in v1.
- **Alternatives**: Direct upload ≤ 20 MB to Supabase Storage (deferred to v2).

## R13. Admin accounts per environment

- **Decision**: Demo admins (`admin@bgs.local`, `editor@bgs.local`) are seeded only when
  `NODE_ENV !== "production"` or `ALLOW_DEMO_ADMINS=true` (used by E2E). Production
  admins come from Supabase Auth + `admin_profiles`. `SESSION_SECRET` ≥ 32 chars is
  mandatory in production.
- **Rationale**: Constitution V/VI — no default credentials in production.
