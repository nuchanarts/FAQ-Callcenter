# Data Model: BGS FAQ Callcenter MVP

Authoritative types and zod schemas live in `src/domain/`. This document is the
design reference.

## Category

| Field | Type | Rules |
|---|---|---|
| id | string (uuid) | generated |
| name | string | required, trimmed, 1–60 chars, unique case-insensitive |
| sortOrder | integer | ≥ 0, default = count of categories |
| createdAt / updatedAt | ISO timestamp | set by service |

Delete is allowed only when no FAQ references the category (`CategoryInUseError`).

## FAQ

| Field | Type | Rules |
|---|---|---|
| id | string (uuid) | generated |
| question | string | required, trimmed, 1–300 chars |
| answer | string | required, trimmed, 1–5,000 chars |
| language | `"th" \| "en"` | required |
| categoryId | string | required, must reference an existing Category |
| tags | string[] | 0–10 items, each trimmed, 1–30 chars, de-duplicated case-insensitive |
| status | `"draft" \| "published"` | new FAQs start `draft` |
| version | integer | starts at 1, +1 on every update / status change |
| createdAt / updatedAt | ISO timestamp | set by service |
| updatedBy | string | display name of last editor |

### State transitions

```
          create            publish
  (none) ───────▶ draft ─────────────▶ published
                    ▲                       │
                    └────── unpublish ──────┘
  delete is allowed from either state (admin + confirmation)
```

Updates require `expectedVersion === version`, otherwise `ConflictError`.

## User

| Field | Type | Rules |
|---|---|---|
| id | string | generated |
| email | string | unique, lower-cased |
| displayName | string | 1–80 chars |
| role | `"agent" \| "admin"` | required |
| passwordHash | string | scrypt `salt:hash` (local provider only; never leaves repositories) |

## Session (cookie, not stored)

`{ userId, email, displayName, role, exp }` — signed HS256, 8 h expiry.

## Search result (derived)

`{ faq, score, matchedFields: ("question"|"tags"|"answer")[], snippet }` — produced by
`rankFaqs()` in `src/domain/search.ts`.

## Seed data

`src/repositories/seed.ts`: 6 categories (Appointments/นัดหมาย, Billing & Insurance,
Visiting hours, Parking & Directions, Services & Clinics, General) and ~20 bilingual
FAQs, plus demo users:

| Email | Password | Role |
|---|---|---|
| agent@bgs.local | Agent#2026 | agent |
| admin@bgs.local | Admin#2026 | admin |

## Supabase mapping (production)

Tables `categories`, `faqs`, `profiles(id → auth.users, display_name, role)`.
RLS: authenticated users `select` published FAQs and all categories; users with
`profiles.role = 'admin'` have full access. See `supabase/migrations/0001_init.sql`.
