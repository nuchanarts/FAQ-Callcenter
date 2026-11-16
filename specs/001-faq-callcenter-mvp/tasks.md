---
description: "Task list for BGS FAQ Callcenter MVP"
---

# Tasks: BGS FAQ Callcenter MVP

**Input**: Design documents from `/specs/001-faq-callcenter-mvp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/interfaces.md

**Tests**: MANDATORY (Constitution II — TDD). Within each phase, test tasks are written
first and MUST fail before the implementation task that follows them. Commit after
every task (Constitution V).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create Next.js 16 project files: `package.json` (scripts dev/build/start/lint/typecheck/test/test:coverage/test:e2e), `tsconfig.json` (`strict`, `@/*` → `src/*`), `next.config.ts`, `postcss.config.mjs`, `.env.example`, update `.gitignore` with `.data/`
- [ ] T002 [P] Configure ESLint (`eslint.config.mjs`, next core-web-vitals + typescript) and Prettier (`.prettierrc`)
- [ ] T003 [P] Configure Vitest in `vitest.config.ts` (node + jsdom projects, `@/` alias, coverage thresholds 80% global / 90% `src/domain/**` and `src/services/**`) and `tests/setup.ts`
- [ ] T004 [P] Configure Playwright in `playwright.config.ts` (chromium, `webServer` = build + start with `DATA_BACKEND=memory`, port 3100)

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T005 [P] Write tests for domain errors + `ActionResult` helpers in `tests/unit/domain/errors.test.ts`
- [ ] T006 [P] Implement `src/domain/errors.ts` (ValidationError, NotFoundError, ConflictError, ForbiddenError, UnauthorizedError, CategoryInUseError, DuplicateError, `toErrorCode`) and `src/lib/action-result.ts`
- [ ] T007 [P] Write tests for FAQ/category schemas in `tests/unit/domain/schemas.test.ts` — question "required, trimmed, 1–300 chars"; answer "required, trimmed, 1–5,000 chars"; language `"th" | "en"`; tags "0–10 items, each trimmed, 1–30 chars, de-duplicated case-insensitive"; category name "required, trimmed, 1–60 chars"
- [ ] T008 [P] Implement types + zod schemas in `src/domain/faq.ts` and `src/domain/category.ts`
- [ ] T009 [P] Write tests for permissions in `tests/unit/domain/permissions.test.ts` (agent: search/read; admin: everything)
- [ ] T010 [P] Implement `src/domain/permissions.ts` (`can(role, action)`, `assertCan`)
- [ ] T011 Define repository interfaces in `src/repositories/types.ts` per contracts §3
- [ ] T012 Write shared repository contract suite in `tests/integration/repositories.contract.ts` (+ runners for memory and file adapters) incl. optimistic `version` conflict and case-insensitive `findByName`
- [ ] T013 [P] Implement memory adapter in `src/repositories/memory/index.ts`
- [ ] T014 [P] Implement file adapter in `src/repositories/file/index.ts` (atomic write to `.data/db.json`, seeded on first run)
- [ ] T015 [P] Implement seed data in `src/repositories/seed.ts` (6 categories, ~20 TH/EN FAQs, demo users) and password hashing in `src/auth/password.ts` with tests `tests/unit/auth/password.test.ts`
- [ ] T016 Implement repository factory `src/repositories/index.ts` (`DATA_BACKEND` = file | memory | supabase) and config `src/lib/config.ts`
- [ ] T017 [P] Write tests for session sign/verify in `tests/unit/auth/session.test.ts`; implement `src/auth/session.ts` (jose HS256, 8 h)
- [ ] T018 [P] Implement i18n dictionaries `src/i18n/messages/th.ts`, `src/i18n/messages/en.ts`, helpers `src/i18n/index.ts`, test key parity in `tests/unit/i18n/messages.test.ts`
- [ ] T019 [P] Implement design tokens + base styles in `src/app/globals.css` and root layout `src/app/layout.tsx` (IBM Plex Sans Thai, dark mode)
- [ ] T020 [P] Implement shared UI primitives in `src/components/ui/` (button, input, textarea, select, badge, card, dialog, kbd, toast, empty-state, error-state, skeleton, field) with tests `tests/unit/components/ui.test.tsx`
- [ ] T021 [P] Implement hooks `src/hooks/use-hotkeys.ts`, `src/hooks/use-debounce.ts`, `src/hooks/use-clipboard.ts` with tests in `tests/unit/hooks/`

**Checkpoint**: Foundation ready.

---

## Phase 3: User Story 1 — Agent finds and copies an answer (P1) 🎯 MVP

**Independent Test**: Sign in as agent, search "จอดรถ", open top result, copy → clipboard holds answer.

- [ ] T022 [P] [US1] Write tests in `tests/unit/domain/search.test.ts`: normalization (case, spaces, NFC, 200-char cap), Thai substring match, AND across terms, score question 3 / tags 2 / answer 1, tie → newest `updatedAt`, highlight ranges, snippet, 1,000-doc perf < 20 ms
- [ ] T023 [US1] Implement `src/domain/search.ts` (`normalizeQuery`, `rankFaqs`, `highlight`, `makeSnippet`)
- [ ] T024 [P] [US1] Write tests in `tests/unit/services/faq-service.search.test.ts` (only published, category filter, max 50, empty query → newest first)
- [ ] T025 [US1] Implement `searchFaqs` in `src/services/faq-service.ts`
- [ ] T026 [P] [US1] Write integration test `tests/integration/api-search.test.ts` for `GET /api/search` (401 signed-out, results shape, unpublished never returned)
- [ ] T027 [US1] Implement `src/app/api/search/route.ts`, `src/app/api/health/route.ts`, and `src/auth/current-user.ts` (`getCurrentUser`, `requireUser`, `requireRole`)
- [ ] T028 [P] [US1] Write component tests `tests/unit/components/search.test.tsx` (typing triggers search, arrow/enter selection, `c` copies, `/` focuses, empty state)
- [ ] T029 [US1] Implement search UI in `src/components/features/search/` (search-screen, result-list, answer-panel, highlight-text, category-filter, shortcut-help) and page `src/app/(app)/page.tsx`
- [ ] T030 [US1] Write E2E `e2e/agent-search.spec.ts` (search TH + EN, keyboard flow, copy toast, category filter, empty state, axe scan)

---

## Phase 4: User Story 2 — Admin manages FAQ content (P2)

**Independent Test**: Admin creates + publishes FAQ, agent finds it; unpublish → gone.

- [ ] T031 [P] [US2] Write tests `tests/unit/services/faq-service.admin.test.ts` (create → draft v1, update bumps version + updatedBy, conflict on stale `expectedVersion`, publish/unpublish, delete, unknown category → validation, agent → ForbiddenError)
- [ ] T032 [US2] Implement `createFaq`, `updateFaq`, `setFaqStatus`, `deleteFaq`, `listFaqsForAdmin` in `src/services/faq-service.ts`
- [ ] T033 [P] [US2] Write tests `tests/unit/services/category-service.test.ts` (create, duplicate name case-insensitive, rename, delete in-use → CategoryInUseError, agent forbidden)
- [ ] T034 [US2] Implement `src/services/category-service.ts`
- [ ] T035 [P] [US2] Write integration tests `tests/integration/admin-actions.test.ts` for server actions (ActionResult shapes, forbidden for agent, field errors)
- [ ] T036 [US2] Implement thin actions `src/app/actions/faq-actions.ts` and `src/app/actions/category-actions.ts`
- [ ] T037 [US2] Implement admin UI: `src/components/features/admin/` (faq-table, faq-form shared by create/edit, status-toggle, delete-dialog, category-manager) and pages `src/app/(app)/admin/page.tsx`, `src/app/(app)/admin/faqs/new/page.tsx`, `src/app/(app)/admin/faqs/[id]/page.tsx`, `src/app/(app)/admin/categories/page.tsx`
- [ ] T038 [US2] Write E2E `e2e/admin-faq.spec.ts` (create draft → publish → agent sees → edit → unpublish → agent can't see; validation keeps input; category CRUD)

---

## Phase 5: User Story 3 — Sign-in & role-based access (P3)

**Independent Test**: agent → /admin blocked; signed-out → /login; admin allowed.

- [ ] T039 [P] [US3] Write tests `tests/unit/services/auth-service.test.ts` (valid login, wrong password and unknown email → same generic error, email case-insensitive)
- [ ] T040 [US3] Implement `src/services/auth-service.ts` and `src/app/actions/auth-actions.ts` (signIn with safe `next` redirect, signOut)
- [ ] T041 [US3] Implement `proxy.ts` (redirect signed-out to `/login?next=`), `src/app/login/page.tsx` + `src/components/features/auth/login-form.tsx`, `src/app/(app)/layout.tsx` (guard + header/nav), and forbidden page for admin routes
- [ ] T042 [US3] Write E2E `e2e/auth.spec.ts` (redirect + return, bad credentials message, agent blocked from /admin, sign-out)

---

## Phase 6: User Story 4 — How to use guide (P4)

- [ ] T043 [US4] Implement `src/app/(app)/guide/page.tsx` + `src/components/features/guide/` (step sections with illustrations, shortcut table from shared shortcut registry `src/lib/shortcuts.ts`, admin section only for admins)
- [ ] T044 [US4] Write E2E `e2e/guide.spec.ts` (nav link, `?` panel opens / `Esc` closes, admin section visibility)

---

## Phase 7: User Story 5 — Thai / English interface (P5)

- [ ] T045 [US5] Implement `src/app/actions/locale-actions.ts` + `src/components/features/layout/locale-switcher.tsx` (cookie `locale`, default `th`)
- [ ] T046 [US5] Write E2E `e2e/locale.spec.ts` (switch to EN, reload keeps EN)

---

## Phase 8: Polish & Cross-Cutting

- [ ] T047 [P] Implement Supabase adapter `src/repositories/supabase/index.ts` and migration `supabase/migrations/0001_init.sql` (tables, indexes, RLS); contract runner skipped unless `SUPABASE_TEST_URL` set
- [ ] T048 [P] Write `README.md` (run, test, demo accounts, architecture, production setup)
- [ ] T049 Run lint, typecheck, unit+integration with coverage, build, E2E; fix all failures
- [ ] T050 Code review against constitution (code-review, web-design-guidelines) and apply fixes

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → stories. US1 needs only Phase 2. US2 reuses US1's `faq-service`
  and `current-user`. US3's UI guard wraps all app pages but services enforce roles from
  US1/US2 onward. US4/US5 depend only on the app layout (US3 T041).
- Polish runs last.

## Parallel Examples

- Phase 2: T005/T007/T009 (tests) in parallel, then T006/T008/T010.
- US1: T022, T024, T026, T028 test files in parallel.
- US2: T031, T033, T035 in parallel.

## Implementation Strategy

MVP = Phases 1–3 (agent search & copy with seeded content). Then add US2 (content
management), US3 (auth hardening + UI), US4, US5, and polish — each phase ends with its
E2E spec green and a commit.
