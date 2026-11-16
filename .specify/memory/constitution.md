<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0
Bump rationale: Initial ratification of the project constitution (MAJOR baseline).

Principles added:
  I.    Code Quality (NON-NEGOTIABLE)
  II.   Test-Driven Development (NON-NEGOTIABLE)
  III.  User Experience Consistency
  IV.   Performance Requirements
  V.    Commit Discipline
  VI.   Reuse First (Shared Components & Functions)
  VII.  Centralized Business Logic
  VIII. Skill-Assisted Development

Sections added:
  - Quality Gates
  - Development Workflow
  - Governance

Sections removed: none

Templates requiring updates:
  ⚠ .specify/templates/plan-template.md   — not present yet (Spec Kit not initialized);
     when added, its "Constitution Check" gate MUST list Principles I–VIII.
  ⚠ .specify/templates/spec-template.md   — not present yet; when added, ensure
     user stories carry testable acceptance criteria (Principle II) and UX/perf
     requirements (Principles III–IV).
  ⚠ .specify/templates/tasks-template.md  — not present yet; when added, test tasks
     MUST precede implementation tasks and each task MUST end with a commit (Principle V).

Deferred TODOs: none
-->

# BGS FAQ Callcenter Constitution

The BGS FAQ Callcenter application helps hospital call-center staff find accurate,
consistent answers quickly while a caller is on the line. Wrong, slow, or inconsistent
answers have direct patient-facing consequences. Every principle below exists to
protect correctness, speed, and consistency of that experience.

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

- Code MUST pass the project's linter, formatter, and type checker with zero errors
  before it is committed. Warnings MUST NOT be suppressed without an inline
  justification comment.
- Strict typing MUST be enabled (e.g., TypeScript `strict: true`). Use of `any` (or the
  language equivalent) is prohibited except at untyped external boundaries, where the
  value MUST be validated and narrowed immediately.
- Functions SHOULD do one thing, stay under ~40 lines, and have at most 3 levels of
  nesting. Files over ~300 lines MUST be split by responsibility.
- Names MUST describe intent (domain language from the call-center/FAQ domain), not
  implementation. No magic numbers or strings — use named constants.
- Errors MUST NOT be swallowed silently. Every caught error is either handled with a
  user-meaningful outcome or re-thrown/logged with context.
- Dead code, commented-out code, and unused dependencies MUST be removed, not left
  behind.

**Rationale**: A call-center tool is maintained for years by changing staff; readable,
typed, lint-clean code is the cheapest defense against regressions.

### II. Test-Driven Development (NON-NEGOTIABLE)

- The Red → Green → Refactor cycle is mandatory for all features and bug fixes:
  1. Write a failing test that expresses the requirement or reproduces the bug.
  2. Run it and confirm it fails for the expected reason.
  3. Write the minimum code to make it pass.
  4. Refactor with all tests green.
- No production code may be written without a failing test that demands it.
- Every bug fix MUST include a regression test that failed before the fix.
- Test layers:
  - **Unit tests** for all centralized business logic (Principle VII) — target ≥ 90%
    line and branch coverage for the domain/service layer.
  - **Integration/contract tests** for every API endpoint, data-access function, and
    external integration.
  - **End-to-end tests** for each primary user journey (e.g., search FAQ → open answer
    → copy/read answer to caller; admin create/edit/publish FAQ).
- Overall project coverage MUST NOT drop below 80%; a change that lowers coverage MUST
  be justified in the commit message.
- Tests MUST be deterministic, isolated, and fast (unit suite < 30 s). Flaky tests are
  treated as bugs and fixed or quarantined within one working day.

**Rationale**: Callers receive answers derived from this system; tests written first
are the only reliable proof that the answer logic is correct.

### III. User Experience Consistency

- All UI MUST be built from the shared design system / component library
  (Principle VI). One-off styling of buttons, inputs, dialogs, tables, or typography is
  prohibited.
- Visual tokens (colors, spacing, typography, radii, shadows) MUST come from a single
  centralized theme/token source. Hard-coded values in components are prohibited.
- Interaction patterns MUST be uniform across the app: the same action (search, copy
  answer, save, delete, confirm) looks and behaves the same everywhere, including
  keyboard shortcuts.
- Every data view MUST define consistent **loading**, **empty**, **error**, and
  **success** states using shared components.
- All user-facing text MUST come from a centralized strings/i18n source (supporting
  Thai and English) — no inline literal UI copy.
- Accessibility MUST meet WCAG 2.1 AA: full keyboard operability (call-center agents
  work keyboard-first), visible focus, sufficient contrast, and semantic labels.
- Destructive actions MUST require confirmation; user input MUST never be lost on
  validation error.

**Rationale**: Agents switch rapidly between screens under time pressure; consistency
reduces cognitive load and error rate.

### IV. Performance Requirements

The following budgets are mandatory and MUST be verified before a feature is marked
done:

| Metric | Budget |
|---|---|
| FAQ search results (server, p95) | ≤ 300 ms |
| Any read API endpoint (p95) | ≤ 500 ms |
| Any write API endpoint (p95) | ≤ 1 s |
| Largest Contentful Paint (agent workstation) | ≤ 2.5 s |
| Interaction to Next Paint | ≤ 200 ms |
| Cumulative Layout Shift | ≤ 0.1 |
| Initial JS bundle (gzipped) per route | ≤ 200 KB |

- Database queries MUST be indexed for their access patterns; N+1 queries are
  prohibited. Lists MUST be paginated or virtualized.
- Search input MUST be debounced, and repeated reads SHOULD be cached with explicit
  invalidation on content change.
- A change that regresses any budget MUST NOT be merged without a documented,
  approved exception and a follow-up task.

**Rationale**: Every second an agent waits is a second a patient waits on the phone.

### V. Commit Discipline

- Commit early and often: every completed TDD cycle (test + passing implementation),
  refactor, or task MUST be committed before starting the next one. Never leave a
  working state uncommitted.
- Each commit MUST be atomic (one logical change), build successfully, and pass the
  test suite.
- Commit messages MUST follow Conventional Commits
  (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`, `perf:`), describing *why*
  as well as *what*.
- Work MUST happen on a feature branch, never directly on `main`. Merge to `main` only
  after all Quality Gates pass.
- Secrets, credentials, `.env` files, and patient or personal data MUST never be
  committed. `.gitignore` MUST cover them from the first commit.
- Pre-commit hooks MUST run lint, format, type check, and affected tests. Hooks MUST
  NOT be bypassed (`--no-verify` is prohibited).

**Rationale**: Small, frequent, verified commits make every mistake easy to find,
review, and revert.

### VI. Reuse First (Shared Components & Functions)

- Before writing any new component, hook, utility, or service, developers MUST search
  the codebase for an existing one and extend it if it fits.
- Any UI pattern or logic used in 2 or more places MUST be extracted into a shared,
  documented, tested module (rule of two — do not copy-paste a third time).
- Shared code lives in clearly designated locations (e.g., `components/ui`,
  `lib/` or `shared/`, `hooks/`) with a single public entry point per module.
- Shared components MUST be presentational and configurable via props; they MUST NOT
  embed business rules (see Principle VII).
- Each shared module MUST have its own tests and a short usage example (doc comment or
  story).

**Rationale**: Reuse keeps the UI consistent (Principle III) and means a fix in one
place fixes it everywhere.

### VII. Centralized Business Logic

- All business rules (FAQ categorization, visibility/publishing rules, answer
  versioning, search ranking, permissions/roles, validation, audit rules) MUST live in
  a dedicated domain/service layer — one authoritative implementation per rule.
- UI components, route handlers, and API controllers MUST be thin: they parse input,
  call the domain/service layer, and render/return the result. They MUST NOT contain
  business decisions.
- Validation schemas MUST be defined once and shared between client and server.
- Data access MUST go through a repository/data-access layer; the domain layer MUST
  NOT depend on UI or framework specifics, so it can be unit-tested in isolation.
- Configuration and constants governing business behavior MUST be centralized, not
  scattered across files.

**Rationale**: When a hospital policy changes, it must change in exactly one place and
be covered by exactly one set of tests.

### VIII. Skill-Assisted Development

Developers (human or AI) MUST use the available Claude Code skills and agents that fit
the task, instead of working ad hoc:

| Activity | Skill / Agent |
|---|---|
| New feature or behavior design | `superpowers:brainstorming`, then Spec Kit (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`) |
| Writing an implementation plan | `superpowers:writing-plans` |
| Implementing any feature or fix | `superpowers:test-driven-development` |
| Any bug or failing test | `superpowers:systematic-debugging` |
| UI work | `frontend-design:frontend-design`, `vercel:shadcn`, `vercel:react-best-practices` |
| Framework specifics | `vercel:nextjs`, `supabase:supabase`, `supabase:supabase-postgres-best-practices` (as applicable to the chosen stack) |
| Before claiming done | `superpowers:verification-before-completion` |
| Before merge | `superpowers:requesting-code-review` / `code-review`, `simplify`, `security-review` |
| Committing | `commit-commands:commit` |

- Library and framework APIs MUST be checked against current documentation (e.g.,
  Context7 or official docs) rather than memory.
- If a skill's guidance conflicts with this constitution, the constitution wins.

**Rationale**: Skills encode proven workflows; using them consistently raises the
quality floor and keeps the process repeatable.

## Quality Gates

A change may be merged to `main` only when ALL of the following pass:

1. Lint, format, and type check — zero errors.
2. All unit, integration, and E2E tests pass; coverage thresholds (Principle II) met.
3. Performance budgets (Principle IV) verified for affected routes/endpoints.
4. Accessibility check (automated axe scan + keyboard walkthrough) for UI changes.
5. Code review completed, confirming compliance with Principles I–VIII — especially
   no duplicated logic (VI) and no business logic outside the domain layer (VII).
6. Security review for changes touching auth, permissions, data access, or
   user-supplied input.

## Development Workflow

1. **Specify** — capture the feature with `/speckit.specify`; clarify ambiguity with
   `/speckit.clarify`.
2. **Plan** — `/speckit.plan`; the plan's Constitution Check MUST pass (or list
   justified exceptions in Complexity Tracking).
3. **Tasks** — `/speckit.tasks`; test tasks precede implementation tasks.
4. **Implement** — on a feature branch, per task: failing test → commit → implement →
   green → refactor → commit.
5. **Verify** — run the full suite, budgets, and accessibility checks; collect
   evidence before claiming completion.
6. **Review & Merge** — code review against this constitution, then merge.

## Governance

- This constitution supersedes all other practices, conventions, and tool guidance in
  this project. Where any document conflicts with it, the constitution prevails.
- Amendments require: a written proposal stating the change and rationale, approval by
  the project owner, a version bump, an updated Sync Impact Report, and propagation to
  dependent templates and docs in the same commit.
- Versioning follows semantic versioning:
  - **MAJOR** — removal or backward-incompatible redefinition of a principle.
  - **MINOR** — a new principle or section, or materially expanded guidance.
  - **PATCH** — clarifications, wording, or typo fixes with no semantic change.
- Every plan and code review MUST verify compliance. Any deviation MUST be documented
  with justification and the simpler alternative that was rejected.
- Compliance is reviewed at least once per release milestone.

**Version**: 1.0.0 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-16
