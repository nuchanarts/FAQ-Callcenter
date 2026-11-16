# Interface Contracts: Self-Service FAQ MVP

## 1. HTTP

- `GET /api/topics` (public) → 200 `{ topics: EffectiveTopic[] (visible only), degraded: boolean }`.
  Store failure → built-in topics merged with the last successfully read overrides/hidden
  flags (so admin-hidden topics stay hidden), with `degraded: true` (never 5xx).
- Home also accepts `/?q=<text>&category=<id>` and keeps both in sync with the URL so a
  search can be shared as a link.
- `GET /api/health` → `{ ok: true, backend }`.

Search and filtering run client-side over the visible topic list using the shared
`searchTopics()` domain function (≤ 200 topics).

## 2. Server Actions

`ActionResult<T> = { ok: true, data: T } | { ok: false, error: { code, message, fieldErrors? } }`
Codes: `validation`, `unauthorized`, `forbidden`, `not_found`, `conflict`,
`not_deletable`, `unexpected`.

| Action | Auth | Input | Result |
|---|---|---|---|
| `signInAction` | public | `{ email, password, next? }` | redirect |
| `signOutAction` | admin | — | redirect `/` |
| `saveTopicAction` | admin | `{ id, expectedVersion, content }` | EffectiveTopic |
| `createTopicAction` | admin | `{ content }` | EffectiveTopic |
| `setTopicHiddenAction` | admin | `{ id, hidden, expectedVersion }` | EffectiveTopic |
| `restoreTopicAction` | admin | `{ id, expectedVersion }` | EffectiveTopic |
| `deleteTopicAction` | admin | `{ id, expectedVersion }` (custom only; stale version → `conflict`) | `{ id }` |

## 3. Repository (`src/repositories/types.ts`)

```ts
interface TopicRepository {
  list(): Promise<StoredTopic[]>;
  get(id: string): Promise<StoredTopic | null>;
  upsert(t: StoredTopic, expectedVersion: number | null): Promise<StoredTopic>; // null = must not exist; ConflictError otherwise
  delete(id: string): Promise<void>;
}
interface AdminUserRepository { findByEmail(email: string): Promise<AdminUserRecord | null>; }
```

Adapters `memory`, `file`, `supabase`, plus `failing` (test/E2E: throws on every call,
`DATA_BACKEND=failing`) — all but `failing` pass `tests/integration/repositories.contract.ts`.

## 4. UI routes

| Path | Who | Purpose |
|---|---|---|
| `/` | everyone | 3 basic steps, search, categories, topics (US1) |
| `/report?topic=<id>` | everyone | report form (US2) |
| `/guide` | everyone | วิธีใช้งาน (US5) |
| `/login` | public | admin sign-in |
| `/admin` | admin | topic list (US3) |
| `/admin/topics/new`, `/admin/topics/[id]` | admin | topic form |

## 5. Keyboard

`/` focus search · `Esc` clear search · `Enter`/`Space` on a card toggles it.
