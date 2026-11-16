# Implementation Plan: Self-Service FAQ MVP

**Branch**: `001-faq-callcenter-mvp` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-faq-callcenter-mvp/spec.md` (revised for constitution v2.0.0)

## Summary

A Thai, mobile-friendly self-service help center: viewers (no login) see the 3 basic
steps, search/filter topics across 8 fixed categories, expand topics with safely rendered
steps, and generate the team's standard problem-report message. Admins sign in to edit
built-in topics as reversible overrides, add/hide/restore/delete topics. Built-in content
ships in code, so the app works even when the store is down. See [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 6.0 (`strict`, `noUncheckedIndexedAccess`), Node.js 22+

**Primary Dependencies**: Next.js 16.4 (App Router), React 19, Tailwind CSS 4, zod 4,
jose 6, lucide-react; @supabase/supabase-js 2 (production adapter)

**Storage**: Built-in topics in code + `TopicRepository` (file `.data/db.json` default,
memory for tests, failing for no-DB tests, Supabase for production)

**Testing**: Vitest 5 + Testing Library + coverage-v8; Playwright 1.65 + @axe-core/playwright

**Target Platform**: Browsers on รพ.สต. PCs and phones (≥ 360 px)

**Project Type**: Web application (single Next.js project)

**Performance Goals**: search update ≤ 300 ms (client-side), LCP ≤ 2.5 s, INP ≤ 200 ms,
first-load JS ≤ 200 KB gz/route

**Constraints**: Works without DB/login for viewers; no patient data; reporter data
browser-only; https-only links; escaped content

**Scale/Scope**: ≤ 200 topics, ≤ 10 admins, 7 screens

## Constitution Check

| # | Principle | Compliance | Status |
|---|---|---|---|
| I | Self-Service First | 3-step banner on top of home; level badge required by schema; "ยังไม่ได้" → prefilled form | ✅ |
| II | Evidence-Based | Seed topics cover the 6 high-case areas; README flags them for Call Center review | ✅ |
| III | ข้อมูลครบ | `formatReportMessage()` + zod `reportSchema` (required fields, 5-digit unit code); exact-template unit test | ✅ |
| IV | ภาษาไทย | Thai-only strings; keywords field for colloquial terms; content format supports numbered steps + menu paths | ✅ |
| V | ความปลอดภัย | AST renderer, no raw HTML; https-only validation; reporter data in localStorage only; no patient fields anywhere | ✅ |
| VI | สิทธิ์ | Viewer read-only; admin via server-checked session; base topics override/hide/restore only; custom delete double-confirm | ✅ |
| VII | เรียบง่าย | 360 px E2E project; built-in fallback when store fails; links instead of uploads | ✅ |
| VIII | Code Quality | strict TS, ESLint, Prettier, typecheck script | ✅ |
| IX | TDD | tests first per task; coverage thresholds; E2E covers the full release checklist | ✅ |
| X | UX | tokens + `components/ui`; shared states; `src/i18n/th.ts` | ✅ |
| XI | Performance | client-side search; Server Components; bundle check in final gate | ✅ |
| XII | Commits | feature branch; commit per task; simple-git-hooks + lint-staged | ✅ |
| XIII | Reuse | shared TopicForm, ConfirmDialog, CopyButton, ContentRenderer reused by viewer & admin preview | ✅ |
| XIV | Central logic | `src/domain` + `src/services`; actions/routes thin | ✅ |
| XV | Skills | TDD, frontend-design, web-design-guidelines, Playwright, code-review | ✅ |

No violations. Post-design re-check: ✅.

## Project Structure

```text
src/
├── app/
│   ├── layout.tsx, globals.css
│   ├── page.tsx                      # home (US1, US4)
│   ├── report/page.tsx               # report form (US2)
│   ├── guide/page.tsx                # วิธีใช้งาน (US5)
│   ├── login/page.tsx
│   ├── admin/page.tsx, admin/topics/new/page.tsx, admin/topics/[id]/page.tsx  (US3)
│   ├── api/topics/route.ts, api/health/route.ts
│   └── actions/{auth,topic}-actions.ts
├── content/base-topics.ts            # built-in topics (read-only)
├── domain/                           # categories, levels, topic schema, topics (merge), search,
│                                     # content-format, report, permissions, errors
├── services/                         # topic-service, auth-service
├── repositories/                     # types, memory, file, failing, supabase, factory
├── auth/                             # password, session, current-admin
├── i18n/th.ts
├── components/ui/                    # Button, Input, Textarea, Select, Badge, Card, Dialog,
│                                     # ConfirmDialog, Toast, EmptyState, Notice, Field, Kbd
├── components/features/{home,topic,report,admin,layout,guide}/
├── hooks/                            # use-debounce, use-clipboard, use-local-storage, use-hotkey
└── lib/                              # config, cn, action-result
src/proxy.ts
supabase/migrations/0001_init.sql
tests/unit, tests/integration
e2e/
```

**Structure Decision**: single Next.js project; layering `app → services → domain +
repositories`; `domain` has no imports from other layers.

## Complexity Tracking

_No constitution violations._
