# Data Model: Self-Service FAQ MVP

Authoritative types and zod schemas live in `src/domain/`.

## Category (constant, `src/domain/categories.ts`)

| id | name (TH) |
|---|---|
| `login` | เข้าสู่ระบบ / EHP Agent |
| `authen` | ตรวจสอบสิทธิ / Authen Code |
| `claim` | ส่งเคลม / ส่งออกข้อมูล |
| `print` | การพิมพ์ / เครื่องพิมพ์ |
| `drug` | ยา / คลังเวชภัณฑ์ |
| `service` | บันทึกการให้บริการ |
| `finance` | การเงิน / ค่าบริการ |
| `registry` | ทะเบียนผู้ป่วย / แบบฟอร์ม |

## Level

`self` = ทำเองได้ · `partial` = ทำเองได้บางส่วน · `team` = ต้องแจ้งทีม

## TopicContent

| Field | Rules |
|---|---|
| title | required, trimmed, 1–150 chars |
| categoryId | one of the 8 ids |
| level | `self` \| `partial` \| `team` |
| keywords | ≤ 20 items, each trimmed 1–40 chars, de-duplicated case-insensitive |
| solution | required, trimmed, 1–5,000 chars (content format, see below) |
| attachments | ≤ 10 × `{ kind: clip\|manual\|link, label 1–80, url starts with https:// }` |

## Built-in topic (`src/content/base-topics.ts`, read-only)

`{ id: "b-…", order, ...TopicContent }`

## StoredTopic (repository)

| Field | Rules |
|---|---|
| id | built-in id (override) or `c-<uuid>` (custom) |
| origin | `base` \| `custom` |
| content | TopicContent \| null (null = no override, base only) |
| hidden | boolean |
| version | integer ≥ 1, +1 per change |
| updatedAt, updatedBy | set by service |

## EffectiveTopic (derived, `mergeTopics()` in `src/domain/topics.ts`)

`{ id, origin, status: "original" | "edited" | "custom", hidden, order, version, updatedAt?, updatedBy?, ...TopicContent }`

Rules:
- base without stored record → `original`, visible.
- base with `content` → `edited`; with `content: null` but `hidden` → `original` hidden.
- restore = set `content: null` (keeps hidden flag).
- custom → `custom`; deletable (base never).
- Viewer list = effective topics where `!hidden`, sorted by `order` (custom after base).

## Report (never stored server-side)

| Field | Rules |
|---|---|
| fullName | required ≤ 100 |
| position | required ≤ 100 |
| unitCode | required, digits only after removing spaces/dashes, exactly 5 |
| unitName | required ≤ 150 |
| phone | required, 9–15 digits (spaces, dashes, `+` allowed) |
| email | optional, valid email |
| anydesk | optional, 9–10 digits (spaces allowed) |
| details | required ≤ 2,000 |

`formatReportMessage()` output (exact order/labels, empty optional → `-`):

```
ชื่อ - สกุล ผู้แจ้ง: <fullName>
ตำแหน่งงาน : <position>
รหัสหน่วยงาน 5 หลัก : <unitCode>
ชื่อหน่วยงาน : <unitName>
เบอร์ติดต่อ : <phone>
อีเมล : <email|->
เลข AnyDesk : <anydesk|->
รายละเอียดปัญหา : <details>
```

Browser-only key `bgs-faq.reporter` (localStorage) stores reporter fields except
`details`.

## Content format (`src/domain/content-format.ts`)

Parsed to an AST rendered as React elements (escaping guaranteed, no `dangerouslySetInnerHTML`):
`1. ` ordered item · `- ` bullet · `> ` note box · `**bold**` · `` `menu path` `` ·
`[text](https://…)` (non-https → plain text).

## Admin user

`{ id, email (unique, lower-case), displayName, role: owner|editor, passwordHash }`.
Demo: `admin@bgs.local` / `Admin#2026` (owner), `editor@bgs.local` / `Editor#2026`.

## Supabase mapping

`topics(id text pk, origin, content jsonb null, hidden, version, updated_at, updated_by)`,
`admin_profiles(id → auth.users, display_name, role)`. RLS: `anon`/`authenticated` select
on `topics`; writes only for admins. Built-in content stays in code.
