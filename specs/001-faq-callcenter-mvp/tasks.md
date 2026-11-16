---
description: "Task list for Self-Service FAQ MVP (constitution v2.0.0)"
---

# Tasks: Self-Service FAQ MVP

**Input**: `/specs/001-faq-callcenter-mvp/` — plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: MANDATORY (Constitution IX). Test tasks come first and must fail before the
implementation that follows. Commit after every task (XII).

## Phase 1: Setup

- [X] T001 Create project files: `package.json` (scripts dev/build/start/lint/typecheck/test/test:coverage/test:e2e), `tsconfig.json` (strict, `@/*`), `next.config.ts`, `postcss.config.mjs`, `.env.example`, `.gitignore` += `.data/`
- [X] T002 [P] ESLint (`eslint.config.mjs`) + Prettier (`.prettierrc`)
- [X] T003 [P] Vitest `vitest.config.ts` (jsdom, `@/` alias, coverage thresholds 80% global, 90% `src/domain/**` + `src/services/**`) + `tests/setup.ts`
- [X] T004 [P] Playwright `playwright.config.ts` (projects desktop-chromium + mobile 360×740; webServers `next start` on 3100 `DATA_BACKEND=memory` and 3101 `DATA_BACKEND=failing`, both with `ALLOW_DEMO_ADMINS=true`)
- [X] T005 Pre-commit hooks: `simple-git-hooks` + `lint-staged` (eslint --fix, prettier, typecheck, `vitest related --run`)

## Phase 2: Foundational

- [X] T006 [P] Tests `tests/unit/domain/errors.test.ts`; implement `src/domain/errors.ts` (ValidationError, NotFoundError, ConflictError, ForbiddenError, UnauthorizedError, NotDeletableError, `toActionError`) + `src/lib/action-result.ts`
- [X] T007 [P] Tests `tests/unit/domain/topic-schema.test.ts`; implement `src/domain/categories.ts` (8 fixed), `src/domain/levels.ts`, `src/domain/topic.ts` zod schema — title "required, trimmed, 1–150"; keywords "≤ 20 items, each trimmed 1–40, de-duplicated case-insensitive"; solution "required 1–5,000"; attachments "≤ 10, label 1–80, url starts with https://"
- [X] T008 [P] Tests `tests/unit/domain/permissions.test.ts`; implement `src/domain/permissions.ts`
- [X] T009 Define `src/repositories/types.ts`; contract suite `tests/integration/repositories.contract.ts` (upsert create / conflict on stale version / null expectedVersion on existing → conflict / delete / list)
- [X] T010 [P] Implement `src/repositories/memory.ts`, `src/repositories/file.ts` (atomic write `.data/db.json`), `src/repositories/failing.ts`; runners `tests/integration/repositories.memory.test.ts`, `repositories.file.test.ts`
- [X] T011 [P] Tests `tests/unit/auth/password.test.ts`, `tests/unit/auth/session.test.ts`; implement `src/auth/password.ts` (scrypt, `scrypt$salt$key`, timing-safe) and `src/auth/session.ts` (jose HS256, 8 h, cookie `bgs_admin_session`, rejects unknown roles)
- [X] T012 Tests `tests/unit/config.test.ts`, `tests/unit/repositories-factory.test.ts`; implement `src/lib/config.ts` (DATA_BACKEND file|memory|failing|supabase, SESSION_SECRET ≥ 32 chars required in production, demo admins only when not production or `ALLOW_DEMO_ADMINS=true` — research R13), repository factory `src/repositories/index.ts`, demo admins `src/repositories/seed-admins.ts`
- [X] T013 [P] Thai strings `src/i18n/th.ts`; design tokens `src/app/globals.css`; root layout `src/app/layout.tsx` (IBM Plex Sans Thai)
- [X] T014 [P] Shared UI `src/components/ui/*` with tests `tests/unit/components/ui.test.tsx`
- [X] T015 [P] Hooks `src/hooks/use-debounce.ts`, `use-clipboard.ts` (blocked → `"blocked"` result), `use-local-storage.ts` (unavailable → no-op), `use-hotkey.ts` + tests `tests/unit/hooks/*.test.ts(x)`

## Phase 3: US1 — ค้นหาและแก้ปัญหาเอง (P1) 🎯 MVP

- [ ] T016 [P] [US1] Tests `tests/unit/domain/content-format.test.ts` (ordered/bullet/note/bold/code/link, non-https link → text, `<script>` stays text); implement `src/domain/content-format.ts`
- [ ] T017 [P] [US1] Tests `tests/unit/domain/search.test.ts` (normalize, Thai substring, keyword "ออเทน", AND terms, title>keywords>solution, ties by order, 200 topics < 10 ms); implement `src/domain/search.ts`
- [ ] T018 [P] [US1] Tests `tests/unit/domain/topics.test.ts` (merge base+stored → original/edited/custom, hidden filtering, ordering); implement `src/domain/topics.ts`
- [ ] T019 [US1] Built-in content `src/content/base-topics.ts` (≥ 2 topics per category, valid per schema — test `tests/unit/content/base-topics.test.ts`)
- [ ] T020 [US1] Tests `tests/unit/services/topic-service.public.test.ts`; implement `getPublicTopics()` in `src/services/topic-service.ts`
- [ ] T021 [US1] Integration test `tests/integration/api-topics.test.ts`; implement `src/app/api/topics/route.ts`, `src/app/api/health/route.ts`
- [ ] T022 [US1] Component tests `tests/unit/components/home.test.tsx`; implement `src/components/features/topic/content-renderer.tsx`, `level-badge.tsx`, `topic-card.tsx`, `src/components/features/home/{basic-steps,search-box,category-tabs,topic-list,home-screen}.tsx`, page `src/app/page.tsx`, header `src/components/features/layout/site-header.tsx`
- [ ] T023 [US1] E2E `e2e/viewer-search.spec.ts` (3 steps visible, search ออเทน, category filter + counts, expand/collapse, empty state, axe)

## Phase 4: US2 — แจ้งปัญหา (P2)

- [ ] T024 [P] [US2] Tests `tests/unit/domain/report.test.ts` (each required field, unit code 5 digits incl. "12 345", phone 9–15 digits, optional email/AnyDesk, exact template output, "-" for empty optional); implement `src/domain/report.ts`
- [ ] T025 [US2] Component tests `tests/unit/components/report-form.test.tsx` (prefill from topic, field errors keep input, remember-me saves without details, copy); implement `src/components/features/report/{report-form,message-preview}.tsx`, page `src/app/report/page.tsx`, shared `src/components/ui/copy-button.tsx`
- [ ] T026 [US2] E2E `e2e/report.spec.ts` ("ยังไม่ได้" → prefilled, validation, generate + copy exact text, remember-me across reload)

## Phase 5: US3 — Admin (P3)

- [ ] T027 [P] [US3] Tests `tests/unit/services/auth-service.test.ts`; implement `src/services/auth-service.ts`, `src/auth/current-admin.ts` (`getAdmin`, `requireAdmin`)
- [ ] T028 [P] [US3] Tests `tests/unit/services/topic-service.admin.test.ts` (save override on base, save custom, conflict, hide/show, restore base only, delete custom only → NotDeletableError for base, all require admin, list for admin with statuses); implement admin functions in `src/services/topic-service.ts`
- [ ] T029 [US3] Integration tests `tests/integration/topic-actions.test.ts` (unauthorized without session, validation fieldErrors, conflict code); implement `src/app/actions/topic-actions.ts`, `src/app/actions/auth-actions.ts` (safe `next`)
- [ ] T030 [US3] `proxy.ts` (redirect `/admin*` → `/login?next=`); `src/app/login/page.tsx` + `src/components/features/admin/login-form.tsx`
- [ ] T031 [US3] Admin UI `src/components/features/admin/{topic-table,topic-form,attachments-editor,confirm-actions}.tsx` (attachments are https links only — research R12) (filters by category/status + search, live preview using ContentRenderer, conflict message, double-confirm delete); pages `src/app/admin/page.tsx`, `src/app/admin/topics/new/page.tsx`, `src/app/admin/topics/[id]/page.tsx`
- [ ] T032 [US3] E2E `e2e/admin.spec.ts` (redirect to login, edit base → viewer sees → restore, hide/show, create custom with `<b>x</b>` → shown escaped, non-https rejected, delete custom needs two confirms)

## Phase 6: US4 — ไม่มีฐานข้อมูล (P4)

- [ ] T033 [US4] Notice `src/components/features/home/degraded-notice.tsx`; E2E `e2e/no-database.spec.ts` against a second webServer with `DATA_BACKEND=failing` (port 3101)

## Phase 7: US5 — วิธีใช้งาน (P5)

- [ ] T034 [US5] `src/app/guide/page.tsx` + `src/components/features/guide/guide-steps.tsx` (admin section only when signed in); E2E `e2e/guide.spec.ts`

## Phase 8: Polish

- [ ] T035 [P] Supabase adapter `src/repositories/supabase.ts` + `supabase/migrations/0001_init.sql` (RLS)
- [ ] T036 [P] `README.md` (run, test, admin demo, architecture, content review note, production)
- [ ] T037 Full gate: lint, typecheck, coverage, build (first-load JS ≤ 200 KB gz), E2E; fix failures
- [ ] T038 Code review vs constitution I–XV + web-design-guidelines; apply fixes

## Dependencies

Setup → Foundational → US1 → (US2, US3 in either order) → US4 (needs US1 home) → US5 → Polish.

## Parallel examples

Phase 2: T006/T007/T008/T011 together. US1: T016/T017/T018 together. US3: T027/T028.

## Progress

- 2026-11-16: Phase 1 complete (T001–T005); Phase 2 T006–T010 complete (52 tests green). Next: T011.

## Strategy

MVP = Phases 1–3. Each later phase ends with its E2E green and a commit.
