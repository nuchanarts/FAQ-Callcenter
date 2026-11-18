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

| Variable                                                | Default           | Notes                                                                             |
| ------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------- |
| `DATA_BACKEND`                                          | `file` (dev only) | **Required in production**: `file` · `memory` · `failing` · `supabase` · `sheets` |
| `SESSION_SECRET`                                        | dev value         | **Required in production**, ≥ 32 random characters; example values are rejected   |
| `ALLOW_DEMO_ADMINS`                                     | off in production | Seeds the demo admins (E2E only)                                                  |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | —                 | Required for `supabase`                                                           |
| `SHEET_WEBHOOK_URL`, `SHEET_WEBHOOK_SECRET`             | — (logging off)   | Google Sheet log of reports + topic views, see below                              |
| `MANUALS_SHEET_ID`                                      | — (built-in copy) | Google Sheet with the "คู่มือ" page content, see below                               |

## Manual library ("คู่มือ & วิดีโอ" page)

Content is edited in a Google Sheet (tabs `news`, `datacheck`, `onepage`, `videos`, `links`;
the `วิธีแก้ไข` tab explains every column in Thai). The site reads it through Google's CSV
endpoint, so the Sheet must be shared **"Anyone with the link: Viewer"**; changes appear within
~5 minutes (in-memory cache). Set `MANUALS_SHEET_ID` to the Sheet id. If the Sheet is unset,
private or down, each tab falls back to the built-in copy in `src/content/base-manuals.ts`.
Rules: `show` blank = visible, `ไม่`/`no` = hidden; links must be `https://`; don't rename tabs
or header cells.

## Staff sign-in (Google only)

Staff sign in with **Sign in with Google**. The server verifies Google's ID token (signature,
audience = `GOOGLE_CLIENT_ID`, verified email) and allows only Gmail addresses an owner added
and kept active at `/admin/users`; everyone else is refused. No passwords are stored. Email +
password login exists only for local development and E2E (`ALLOW_DEMO_ADMINS`).

## Unit registry (report form auto-fill)

Typing a 5-digit unit code on the report page fills "ชื่อหน่วยงาน" from the MOPH health-office
registry via `/api/units/[code]` (server-side, ~41k units in `src/content/health-offices.json.gz`).
To refresh it from a newer `health_office.xlsx`:
`python scripts/build-health-offices.py <health_office.xlsx>`, then commit the regenerated file.

## Roles and FAQ approval

| Role             | Can do                                                                       |
| ---------------- | ---------------------------------------------------------------------------- |
| owner (ผู้ดูแลระบบ) | everything + manage accounts and roles at `/admin/users`                     |
| approver (ผู้อนุมัติ) | edit and publish immediately, approve / reject drafts, hide, restore, delete |
| author (ผู้เขียน)   | write or edit as a draft; viewers see nothing until an approver approves     |

The legacy role `editor` is treated as `approver`. Owners cannot demote or disable themselves,
and at least one active owner must remain.

## Google Sheet as the database (`DATA_BACKEND=sheets`)

FAQ topics (tab `faq_topics`) and admin accounts (tab `admin_users`) live in the same Google
Sheet as the logs, read and written only through the Apps Script with the shared secret, so the
Sheet must be shared **Restricted**. Reads are cached per server instance (topics 20 s, admins
60 s). Create the first owner with
`npm run create-owner -- <gmail> "<name>"`, then add others in the app.
Never edit `admin_users` by hand. Usage counters (views, reports, helpful votes, visits —
shown on the home page and at `/admin/stats`) go to tab `usage_daily`; **after updating to a
version with statistics, paste the new script and deploy a new version** (Deploy → Manage
deployments → Edit → Version "New version"), otherwise counting fails silently.

## Google Sheet log (reports + topic views)

When a caller copies a finished report (or opens LINE), the report is appended to the
`reports` tab; each topic a viewer opens on the home page is appended to the `views` tab
(once per topic per visit). Count views with a pivot table on the `หัวข้อ` column.

1. Open the Sheet → Extensions → Apps Script, paste
   [`scripts/google-sheet-webhook.gs`](scripts/google-sheet-webhook.gs).
2. Project Settings → Script properties → `SECRET` = a long random string.
3. Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
4. Set `SHEET_WEBHOOK_URL` (the web app URL) and `SHEET_WEBHOOK_SECRET` (same string), restart.

The browser only talks to `/api/log`; the secret stays on the server. Logging is
best-effort: if the Sheet is down or unconfigured the app keeps working.

## Production (Supabase)

1. Apply every file in [`supabase/migrations/`](supabase/migrations/) in order
   (`0001_init.sql` … `0006_usage.sql`: tables `topics`, `admin_users`, `app_settings`,
   `usage_daily` + function `increment_usage`, Row Level Security on).
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
