# Implementation Plan: BGS FAQ Callcenter MVP

**Branch**: `001-faq-callcenter-mvp` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-faq-callcenter-mvp/spec.md`

## Summary

A keyboard-first web app where hospital call-center agents search bilingual FAQs and
copy answers in one keystroke, and admins manage FAQs and categories. Built with
Next.js 16 App Router. All business rules (validation, ranking, permissions, state
transitions, conflict detection) live in a framework-free domain + service layer;
storage is behind repository interfaces with file (local), memory (tests), and
Supabase (production) adapters. See [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`), Node.js 22+

**Primary Dependencies**: Next.js 16.4, React 19, Tailwind CSS 4, zod 4, jose 6,
@supabase/supabase-js 2 (production adapter), lucide-react (icons)

**Storage**: Repository interfaces → JSON file (`.data/db.json`, dev default),
in-memory (tests/E2E), Supabase Postgres with RLS (production)

**Testing**: Vitest 5 + Testing Library (unit, integration, contract), Playwright 1.65
+ axe-core (E2E, a11y)

**Target Platform**: Desktop browsers (Chrome/Edge latest) ≥ 1024 px; usable to 375 px

**Project Type**: Web application (single Next.js project, server + client)

**Performance Goals**: Search p95 ≤ 300 ms server, ≤ 0.5 s perceived (SC-002); LCP ≤
2.5 s; INP ≤ 200 ms; ≤ 200 KB gz JS per route

**Constraints**: Must run locally with no external services; Thai substring search;
WCAG 2.1 AA; no secrets in repo

**Scale/Scope**: ≤ 1,000 FAQs, ≤ 100 concurrent staff, 7 screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | How this plan complies | Status |
|---|---|---|---|
| I | Code Quality | TS strict, ESLint (next config) + Prettier, `typecheck` script; typed errors in `src/domain/errors.ts`; no `any` | ✅ |
| II | TDD | Tests written before code for every task; unit (domain/services ≥ 90%), integration (route handlers, actions, repository contract suite across adapters), E2E for every user story; coverage thresholds enforced in `vitest.config.ts` | ✅ |
| III | UX Consistency | Tokens in `globals.css`; all screens use `src/components/ui/*`; shared Loading/Empty/Error states; all copy in `src/i18n`; keyboard shortcuts in one registry; axe checks in E2E | ✅ |
| IV | Performance | Ranking in-process on ≤ 1,000 docs; debounced search (150 ms); Server Components by default; perf budget test for `rankFaqs` (1,000 docs < 20 ms) | ✅ |
| V | Commit Discipline | Feature branch; Conventional Commit after each task; `.gitignore` covers `.env*`, `.data/` | ✅ |
| VI | Reuse First | Shared UI primitives + `ActionResult` + `requireRole` + `useHotkeys` used everywhere; no duplicated forms (create/edit share `FaqForm`) | ✅ |
| VII | Centralized Business Logic | `src/domain` (pure rules) + `src/services` (orchestration); route handlers/actions only parse → call service → map result; zod schemas shared client/server | ✅ |
| VIII | Skill-Assisted | superpowers TDD/debugging/verification, frontend-design + web-design-guidelines for UI, vercel-react-best-practices, Playwright for E2E, code-review before merge | ✅ |

No violations → Complexity Tracking empty.

**Post-design re-check (after Phase 1)**: data-model, contracts and quickstart keep
all rules in domain/services and expose only thin entry points. ✅ Pass.

## Project Structure

### Documentation (this feature)

```text
specs/001-faq-callcenter-mvp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/interfaces.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx, globals.css          # tokens, fonts, providers
│   ├── login/page.tsx
│   ├── (app)/layout.tsx                 # header/nav, session guard
│   ├── (app)/page.tsx                   # search (US1)
│   ├── (app)/guide/page.tsx             # How to use (US4)
│   ├── (app)/admin/...                  # FAQ list/form, categories (US2)
│   ├── api/search/route.ts, api/health/route.ts
│   └── actions/                         # thin Server Actions
├── domain/                              # pure: types, schemas, search, permissions, errors
├── services/                            # faq-service, category-service, auth-service
├── repositories/                        # types, memory/, file/, supabase/, seed, factory
├── auth/                                # session (jose), password (scrypt), current user
├── i18n/                                # messages/th.ts, en.ts, server + client helpers
├── components/
│   ├── ui/                              # shared primitives (Button, Input, Dialog, …)
│   └── features/{search,admin,layout,guide}/
├── hooks/                               # useHotkeys, useDebounce, useClipboard
└── lib/                                 # config, cn, action-result
proxy.ts                                 # optimistic auth redirect (Next 16)
supabase/migrations/0001_init.sql
tests/
├── unit/                                # domain, services, hooks, components
└── integration/                         # repository contract, route handlers, actions
e2e/                                     # Playwright specs per user story
```

**Structure Decision**: Single Next.js project. Layering rule: `app` → `services` →
`domain` + `repositories`; `domain` imports nothing from the other layers.

## Complexity Tracking

_No constitution violations._
