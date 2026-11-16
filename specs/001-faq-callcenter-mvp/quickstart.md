# Quickstart & Validation: Self-Service FAQ MVP

## Prerequisites

Node.js 22+, npm 10+. No database needed (file store in `.data/`).

## Run

```bash
npm install
npm run dev            # http://localhost:3000
```

Admin demo: `admin@bgs.local` / `Admin#2026`.

## Verify

| Command | Expected |
|---|---|
| `npm run lint` / `npm run typecheck` | 0 errors |
| `npm test` | all unit + integration pass |
| `npm run test:coverage` | ≥ 80% global, ≥ 90% `src/domain`, `src/services` |
| `npx playwright install chromium && npm run test:e2e` | all E2E pass (desktop + 360 px) |
| `npm run build` | succeeds; first-load JS per route ≤ 200 KB gz |

## Manual scenarios

1. Signed out: home shows 3 basic steps → type `ออเทน` → expand → numbered steps + level.
2. Press "ยังไม่ได้" → form prefilled → fill → "สร้างข้อความ" → "คัดลอกข้อความ".
3. `/admin` → sign in → edit a built-in topic → home shows new title → "คืนค่าเดิม".
4. Hide a topic → disappears from home → "แสดง".
5. Add a topic containing `<b>x</b>` → home shows literal text.
6. `DATA_BACKEND=failing npm run dev` → home shows built-in topics + notice; form works.
