# Research: BGS FAQ Callcenter MVP

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

- **Decision**: Ranking and highlighting are pure domain functions
  (`src/domain/search.ts`). Adapters return published FAQs (optionally category-
  filtered); the domain ranks them. Normalization: NFC, lower-case, collapse
  whitespace, trim to 200 chars. Matching: substring per search term (works for Thai,
  which has no word spaces). Score: question match 3, tag match 2, answer match 1 per
  term; every term must match somewhere (AND); ties → most recent `updatedAt`.
- **Rationale**: One authoritative ranking rule (VII) whatever the store; 1,000 FAQs ×
  substring scan is well under 10 ms, inside the 300 ms p95 budget (IV).
- **Alternatives**: Postgres full-text search (no Thai dictionary; would split ranking
  logic between SQL and TS); external search service (overkill for 1,000 docs).

## R4. Authentication & sessions

- **Decision**: `AuthProvider` interface. Local provider: passwords hashed with Node
  `crypto.scrypt` (salted, constant-time compare), session = HS256 JWT signed with
  `jose` 6.x in an `httpOnly`, `sameSite=lax`, `secure` (prod) cookie, 8-hour expiry.
  Supabase provider: Supabase Auth with role in `profiles` table.
  `proxy.ts` does an optimistic redirect for signed-out users; every Server Action and
  route handler re-checks the session and role through `requireRole()` (FR-019).
- **Rationale**: No extra auth service needed locally; server-side checks are the
  real gate, the proxy is only UX.
- **Alternatives**: NextAuth/Auth.js (heavier, adds config surface for 2 demo users).

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

## R7. Internationalisation

- **Decision**: Typed message dictionaries `src/i18n/messages/{th,en}.ts`; locale in a
  `locale` cookie (default `th`); `getT()` on the server, `useT()` on the client.
- **Rationale**: Two locales, no routing changes needed; type-checked keys catch
  missing strings at build time.
- **Alternatives**: next-intl (fine, but more setup than two flat dictionaries need).

## R8. Testing

- **Decision**: Vitest 5 (unit + integration, `node` and `jsdom` environments,
  `@testing-library/react`), coverage via `@vitest/coverage-v8` with thresholds
  80% global / 90% `src/domain` + `src/services`. Playwright 1.65 for E2E, running the
  production build with `DATA_BACKEND=memory`; axe accessibility checks with
  `@axe-core/playwright`.
- **Rationale**: Constitution II; fast, deterministic tests.

## R9. Concurrency (FR-014)

- **Decision**: Optimistic concurrency — every FAQ has an integer `version`; update
  requires `expectedVersion`; mismatch → `ConflictError`.
- **Rationale**: Simple, works identically in every adapter.
