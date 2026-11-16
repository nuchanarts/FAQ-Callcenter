# ศูนย์ช่วยเหลือ ระบบคลาวด์กลาง — Self-Service FAQ

A Thai, mobile-friendly self-service help center for รพ.สต. staff. Viewers search topics,
follow numbered steps, and — if the problem remains — generate the Call Center's
standard problem-report message with complete information from the first message.

Project principles: [`.specify/memory/constitution.md`](.specify/memory/constitution.md) ·
Spec, plan and tasks: [`specs/001-faq-callcenter-mvp/`](specs/001-faq-callcenter-mvp/)

## Quick start

Requires Node.js 22+ and npm 10+. No database is needed locally.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Who                    | How                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Viewer (รพ.สต. staff)  | No sign-in. Open `/`.                                                               |
| Admin (demo, dev only) | `/admin` → `admin@bgs.local` / `Admin#2026` (or `editor@bgs.local` / `Editor#2026`) |

Local edits are saved to `.data/db.json` (git-ignored). Delete it to reset.

## What it does

- **Home** — "3 ขั้นก่อนแจ้งปัญหา", Thai search (colloquial keywords like "ออเทน"),
  8 fixed categories with counts, expandable topics with level badges
  (ทำเองได้ / ทำเองได้บางส่วน / ต้องแจ้งทีม), clip/manual links, and "ยังไม่ได้ — แจ้งทีม".
- **Report** (`/report`) — builds the team's standard message, copy in one click,
  optionally remembers reporter details **in this browser only**. Nothing is sent to a server.
- **Admin** (`/admin`) — edit any topic (built-ins are stored as overrides), add topics,
  hide/show, restore originals, delete custom topics after two confirmations.
  Saving publishes immediately.
- **Guide** (`/guide`) — how to use, keyboard shortcuts, admin section for signed-in admins.
- **Works without a database** — if the store is down, built-in topics and the report
  form keep working, with a small notice.

## Scripts

| Command                                                   | What                                                       |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                                             | Dev server                                                 |
| `npm run build` / `npm start`                             | Production build / server                                  |
| `npm run lint` · `npm run typecheck`                      | ESLint · TypeScript (strict)                               |
| `npm test`                                                | Unit + integration tests (Vitest)                          |
| `npm run test:coverage`                                   | With coverage thresholds (80% global, 90% domain/services) |
| `npx playwright install chromium` then `npm run test:e2e` | Build + E2E (desktop, 360 px phone, no-database server)    |

A pre-commit hook (simple-git-hooks + lint-staged) runs ESLint, Prettier, related tests,
and the type checker on every commit.

## Architecture

```
src/app/          thin pages, route handlers (/api/topics, /api/health), server actions
src/services/     use cases: topic-service (viewer + admin), auth-service
src/domain/       pure rules: categories, levels, topic schema, merge, search, content format,
                  report message, permissions, errors
src/repositories/ TopicRepository + adapters: file (dev), memory (tests/E2E), failing, supabase
src/content/      built-in topics (read-only originals)
src/components/   ui/ (shared primitives) and features/ (home, topic, report, admin, guide)
src/i18n/th.ts    every user-facing string
```

- Business rules live only in `src/domain` and `src/services` (Constitution XIV).
- Topic solutions use a small format (`1.` steps, `-` bullets, `>` notes, `**bold**`,
  `` `menu path` ``, `[text](https://…)`) parsed to React elements — never raw HTML.
- Every admin action re-checks the session on the server; `src/proxy.ts` only redirects.

## Configuration

See [`.env.example`](.env.example).

| Variable                                                | Default           | Notes                                              |
| ------------------------------------------------------- | ----------------- | -------------------------------------------------- |
| `DATA_BACKEND`                                          | `file`            | `file` · `memory` · `failing` · `supabase`         |
| `SESSION_SECRET`                                        | dev value         | **Required in production**, ≥ 32 random characters |
| `ALLOW_DEMO_ADMINS`                                     | off in production | Seeds the demo admins (E2E only)                   |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | —                 | Required for `supabase`                            |

## Production (Supabase)

1. Apply [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   (tables `topics`, `admin_users`, Row Level Security on).
2. Create admins: `npm run hash-password -- "<a long password>"` prints an scrypt hash;
   insert it with the admin's email (lower-case), display name and role (`owner`/`editor`)
   into `admin_users`.
3. Set `DATA_BACKEND=supabase`, the Supabase variables and `SESSION_SECRET`, then
   `npm run build && npm start`.

## Content review (required before production)

The built-in topics in `src/content/base-topics.ts` are **draft seed content** written from
the constitution's high-case areas. The Call Center team must review every topic against
the monthly case report (Constitution II) — or edit them in `/admin` after go-live.
Never put patient data, tokens or passwords in content (Constitution V).
