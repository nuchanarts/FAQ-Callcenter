# Interface Contracts: BGS FAQ Callcenter MVP

## 1. HTTP route handlers

### `GET /api/search?q=<text>&category=<id>`

- Auth: any signed-in user (401 `{ error: "unauthorized" }` otherwise).
- `q`: optional, normalized and trimmed to 200 chars. `category`: optional id.
- 200 → `{ results: Array<{ id, question, answer, language, categoryId, categoryName, tags, updatedAt, matchedFields, snippet }>, total }`
  (max 50 results). Only `status = "published"` FAQs. Empty `q` → all published
  FAQs in the category, most recently updated first.

### `GET /api/health` → 200 `{ ok: true, backend: "file" | "memory" | "supabase" }`

## 2. Server Actions (form/mutation entry points)

All return `ActionResult<T> = { ok: true, data: T } | { ok: false, error: { code, message, fieldErrors? } }`.
Error codes: `validation`, `unauthorized`, `forbidden`, `not_found`, `conflict`,
`category_in_use`, `duplicate`, `unexpected`.

| Action | Role | Input | Output |
|---|---|---|---|
| `signInAction` | public | `{ email, password, next? }` | redirect to `next` or `/` |
| `signOutAction` | any | — | redirect `/login` |
| `createFaqAction` | admin | `FaqInput` | `Faq` (draft) |
| `updateFaqAction` | admin | `FaqInput & { id, expectedVersion }` | `Faq` |
| `setFaqStatusAction` | admin | `{ id, status, expectedVersion }` | `Faq` |
| `deleteFaqAction` | admin | `{ id }` | `{ id }` |
| `createCategoryAction` | admin | `{ name }` | `Category` |
| `renameCategoryAction` | admin | `{ id, name }` | `Category` |
| `deleteCategoryAction` | admin | `{ id }` | `{ id }` |
| `setLocaleAction` | public | `{ locale: "th" \| "en" }` | sets cookie |

## 3. Repository interfaces (`src/repositories/types.ts`)

```ts
interface FaqRepository {
  list(filter?: { status?: FaqStatus; categoryId?: string }): Promise<Faq[]>;
  get(id: string): Promise<Faq | null>;
  insert(faq: Faq): Promise<Faq>;
  update(faq: Faq, expectedVersion: number): Promise<Faq>; // ConflictError on mismatch
  delete(id: string): Promise<void>;
  countByCategory(categoryId: string): Promise<number>;
}
interface CategoryRepository {
  list(): Promise<Category[]>;
  get(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>; // case-insensitive
  insert(c: Category): Promise<Category>;
  update(c: Category): Promise<Category>;
  delete(id: string): Promise<void>;
}
interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
}
```

Every adapter (`memory`, `file`, `supabase`) MUST pass the shared contract suite
`tests/integration/repositories.contract.ts`.

## 4. UI routes

| Path | Role | Purpose |
|---|---|---|
| `/login` | public | sign in |
| `/` | agent, admin | search & copy (US1) |
| `/guide` | agent, admin | How to use (US4) |
| `/admin` | admin | FAQ list (US2) |
| `/admin/faqs/new`, `/admin/faqs/[id]` | admin | FAQ form |
| `/admin/categories` | admin | categories |

## 5. Keyboard shortcuts (search screen)

| Key | Action |
|---|---|
| `/` | focus search |
| `↑` `↓` | move selection |
| `Enter` | open selected |
| `c` | copy open answer (when focus is not in a text field) |
| `Esc` | clear search / close dialog |
| `?` | shortcut help |
