# รูปอาการ + สถิติการใช้งาน Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แนบรูปอาการ 1 รูปต่อหัวข้อ (เห็นรูปย่อในผลค้นหา) และนับยอดดู/ยอดแจ้ง/การเข้าเว็บ แสดงยอดดู + ยอดนิยมให้ผู้ใช้ และหน้าสถิติให้เจ้าหน้าที่

**Architecture:** `symptomImage` เป็นฟิลด์ใหม่ใน `TopicContent` (nullable, default null) จึงผ่าน flow บันทึก/draft/override เดิมทั้งหมด ตัวนับเป็น `StatsRepository` ตัวใหม่ใน `Repositories` (ตัวนับรายวัน key = day+kind+topicId) มีครบทุก backend, `/api/log` เดิมเป็นทางเข้าเดียวของการนับ, `statsService` อ่าน/แคช และไม่เคย throw ไปถึงหน้าเว็บ

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, zod, Vitest + Testing Library, Supabase, Google Apps Script, Vercel Blob

**Spec:** `docs/superpowers/specs/2026-11-18-symptom-image-and-usage-stats-design.md`

## Global Constraints

- ข้อความผู้ใช้ทุกคำอยู่ใน `src/i18n/th.ts` (คอมโพเนนต์ห้ามเขียนข้อความตรง)
- รูปอาการ: 1 รูป, url ต้อง https (`isHttpsUrl`), caption ไม่บังคับ ≤ 80 ตัวอักษร, อัปโหลดผ่าน `/api/upload` เดิม (PNG/JPG/WebP/GIF ≤ 5 MB, `IMAGE_TYPES`/`IMAGE_MAX_BYTES` ใน `src/lib/images.ts`)
- ผู้ใช้ทั่วไปเห็น: "ดู N ครั้ง" เมื่อ N ≥ 5; ป้าย "ยอดนิยม" บน 5 อันดับแรก (ต้อง ≥ 5); แถบ "ปัญหาที่พบบ่อย" 3 อันดับแรก เฉพาะตอนไม่ค้นหาและไม่เลือกหมวด; **ไม่แสดงยอดแจ้งปัญหา**
- `day` = วันที่เวลาไทย (Asia/Bangkok) รูปแบบ `YYYY-MM-DD`; visit ใช้ `topicId = ""`
- การนับ/อ่านสถิติล้ม → หน้าเว็บและการแจ้งปัญหาทำงานปกติ (ไม่ throw, ไม่ 5xx จาก `/api/log`)
- ตัวนับไม่มีข้อมูลส่วนบุคคล
- อ่านยอดสาธารณะแคช 60 วินาทีต่อ instance
- ก่อนเขียนโค้ด Next.js อ่าน guide ใน `node_modules/next/dist/docs/` ตาม AGENTS.md

## Review Focus

1. หัวข้อเก่า/ข้อมูลใน `db.json`, Supabase, Sheet ที่ไม่มี `symptomImage` → โหลดได้ แสดงปกติ (Task 1 test `defaults symptomImage to null`)
2. หัวข้อที่ถูกลบหรือซ่อนแต่ยังมียอดในตัวนับ → ไม่โผล่ในยอดนิยม/แถบพบบ่อยของผู้ใช้; หน้าเจ้าหน้าที่แสดง "(หัวข้อถูกลบ)" (Task 7, Task 8 tests)
3. backend ตัวนับล่ม (`failing`) → `/api/log` ยังตอบ 202 และหน้าแรกยัง render (Task 6 test `stats failure never breaks logging`, Task 7 test)
4. `topicId` ใน report ที่ไม่มีอยู่จริง/ถูกปลอม → นับเป็นยอดแจ้งแบบไม่มีหัวข้อ ไม่ทำให้ report ถูกปฏิเสธ (Task 6 test)
5. กางหัวข้อเดิมซ้ำในการเข้าหน้าเดียว (accordion หรือจอกว้าง) → นับครั้งเดียว (Task 6 test)

---

### Task 1: Schema รูปอาการ

**Files:**

- Modify: `src/domain/topic.ts` (schema + `TOPIC_LIMITS.symptomCaption = 80`)
- Modify: `tests/integration/repositories.contract.ts` (`makeStored` เพิ่ม `symptomImage: null`) และ fixture อื่นที่ typecheck แจ้ง
- Test: `tests/unit/domain/topic-schema.test.ts`

**Interfaces:**

- Produces: `export type SymptomImage = { url: string; caption: string }`; `TopicContent.symptomImage: SymptomImage | null` (input optional)

- [ ] **Step 1: Write failing tests** ใน `topic-schema.test.ts`:
  - `defaults symptomImage to null` — parse content ที่ไม่มีฟิลด์ → `symptomImage === null`
  - `accepts an https symptom image with empty caption` → `{ url: "https://x.public.blob.vercel-storage.com/a.png", caption: "" }` ผ่าน
  - `rejects a non-https symptom image` → `http://…` มี fieldError ที่ path `symptomImage.url`
  - `rejects a caption over 80 chars`
- [ ] **Step 2:** `npx vitest run tests/unit/domain/topic-schema.test.ts` → FAIL
- [ ] **Step 3:** เพิ่ม `symptomImage: z.object({ url: requiredText(TOPIC_LIMITS.url).refine(isHttpsUrl, v.https), caption: z.string().trim().max(80, v.tooLong(80)).default("") }).nullable().default(null)` ใน `topicContentSchema`; แก้ `BASE_TOPICS`/fixtures ให้ typecheck ผ่าน (ไม่ต้องใส่ฟิลด์ใน base — ใช้ input type)
- [ ] **Step 4:** `npx vitest run` + `npm run typecheck` → PASS
- [ ] **Step 5: Commit** `feat(topic): symptomImage field (one https image, optional caption)`

### Task 2: ช่องแนบรูปอาการในฟอร์มเจ้าหน้าที่

**Files:**

- Create: `src/lib/upload-image.ts` — ย้าย logic อัปโหลดจาก `attachments-editor.tsx` (`upload(...)` จาก `@vercel/blob/client`, ตรวจชนิด/ขนาด)
- Create: `src/components/features/admin/symptom-image-editor.tsx`
- Modify: `src/components/features/admin/attachments-editor.tsx` (ใช้ helper ใหม่), `src/components/features/admin/topic-form.tsx`, `src/i18n/th.ts` (`th.admin.form.symptomImage*`)
- Test: `tests/unit/components/admin.test.tsx`

**Interfaces:**

- Consumes: `SymptomImage` (Task 1)
- Produces: `uploadImage(file: File): Promise<{ url: string } | { error: string }>`; `<SymptomImageEditor value={SymptomImage|null} onChange={(v)=>void} imagesEnabled={boolean} error?: string />`

- [ ] **Step 1: Write failing tests** ใน `admin.test.tsx`:
  - `shows the symptom image upload button under the question field when images are enabled` (ปุ่มชื่อ `th.admin.form.symptomImageUpload`)
  - `shows a disabled hint when images are not enabled`
  - `with an image: shows the thumbnail, a caption input and a remove button; remove calls onChange(null)`
  - `TopicForm submits symptomImage in content` (mock `saveTopicAction`, ตรวจ argument มี `symptomImage`)
  - `preview shows the symptom image` (img ที่มี src ตรง)
- [ ] **Step 2:** run → FAIL
- [ ] **Step 3:** สร้าง helper + editor, วาง `<SymptomImageEditor>` ต่อจาก `<Field label={f.title}>` ใน `topic-form.tsx`, state `symptomImage` เริ่มจาก `start?.symptomImage ?? null`, ห่อด้วย `edit(...)` เพื่อ dirty flag; พรีวิวแสดงด้วย `<SymptomImage>` จาก Task 3 (ถ้า Task 3 ยังไม่มา ใช้ img ชั่วคราวแล้วเปลี่ยนใน Task 3)
- [ ] **Step 4:** run + typecheck + `npm run lint` → PASS
- [ ] **Step 5: Commit** `feat(admin): attach one symptom image under the question field`

### Task 3: แสดงรูปอาการฝั่งผู้ใช้

**Files:**

- Create: `src/components/features/topic/symptom-image.tsx`
- Modify: `src/components/features/topic/topic-card.tsx`, `src/components/features/topic/topic-detail.tsx`, `src/components/features/admin/topic-form.tsx` preview (ถ้ายังใช้ img ชั่วคราว), `src/i18n/th.ts` (`th.topic.symptomHeading = "หน้าจอที่พบ"`)
- Test: `tests/unit/components/home.test.tsx`, `tests/unit/components/topic-images.test.tsx`

**Interfaces:**

- Produces: `<SymptomThumb image={SymptomImage} />` (64×48, `object-cover`, `alt=""`, `loading="lazy"`); `<SymptomImage image={SymptomImage} title={string} />` (หัวข้อ "หน้าจอที่พบ", `max-h-80 object-contain`, ลิงก์เปิดแท็บใหม่ `rel="noopener noreferrer"`, alt = caption || title)

- [ ] **Step 1: Write failing tests:**
  - `topic card shows a thumbnail when the topic has a symptom image` / `no thumbnail without one`
  - `topic detail shows "หน้าจอที่พบ" before the solution` (ลำดับ DOM: heading รูปมาก่อนข้อความวิธีแก้)
  - `symptom image alt falls back to the topic title when caption is empty`
- [ ] **Step 2:** run → FAIL
- [ ] **Step 3:** ใส่ `SymptomThumb` ซ้ายของ `<span className="flex-1">` ใน `TopicCard`; ใส่ `SymptomImage` เป็นบล็อกแรกใน `TopicDetail` (ใช้ทั้ง accordion และ AnswerPane)
- [ ] **Step 4:** run + typecheck → PASS; เปิด http://localhost:3000 แนบรูปจริงหนึ่งหัวข้อแล้วดูทั้งจอกว้างและ 390px
- [ ] **Step 5: Commit** `feat(topic): symptom thumbnail in the list, full image above the solution`

### Task 4: StatsRepository (domain + memory/file/failing)

**Files:**

- Create: `src/domain/usage.ts`
- Modify: `src/repositories/types.ts`, `memory.ts`, `file.ts` (คีย์ `usage` ใน `FileShape`), `failing.ts`
- Create: `tests/integration/stats.contract.ts`; Modify: `tests/integration/repositories.memory.test.ts`, `repositories.file.test.ts`, `repositories.failing.test.ts`
- Test: `tests/unit/domain/usage.test.ts`

**Interfaces:**

- Produces (in `src/domain/usage.ts`):
  - `export const USAGE_KINDS = ["view", "report", "visit"] as const; export type UsageKind`
  - `export interface UsageEvent { kind: UsageKind; topicId: string; day: string }`
  - `export interface UsageCount extends UsageEvent { count: number }`
  - `export function bangkokDay(date: Date): string` (Intl `en-CA` + `timeZone: "Asia/Bangkok"`)
  - `export function sinceDay(range: "7d" | "30d" | "all", today: string): string | null` (7d = วันนี้ + ย้อน 6 วัน)
- Produces (in `types.ts`): `interface StatsRepository { increment(e: UsageEvent): Promise<void>; list(sinceDay: string | null): Promise<UsageCount[]> }`; `Repositories.stats: StatsRepository`

- [ ] **Step 1: Write failing tests:**
  - `usage.test.ts`: `bangkokDay(new Date("2026-11-17T18:30:00Z")) === "2026-11-18"`; `sinceDay("7d","2026-11-18") === "2026-11-12"`; `sinceDay("all", …) === null`
  - `stats.contract.ts` (`statsRepositoryContract(name, create)`): increment สองครั้ง key เดียว → count 2; key ต่างกันแยกแถว; `list("2026-11-18")` ไม่รวมวันก่อนหน้า; `list(null)` รวมทั้งหมด
  - failing: `increment` และ `list` reject
- [ ] **Step 2:** run → FAIL
- [ ] **Step 3:** implement; file backend เขียนใน `serialized(...)` เดิม
- [ ] **Step 4:** run + typecheck → PASS
- [ ] **Step 5: Commit** `feat(stats): daily usage counters repository (memory, file, failing)`

### Task 5: StatsRepository สำหรับ Supabase และ Google Sheet

**Files:**

- Create: `supabase/migrations/0006_usage.sql`
- Modify: `src/repositories/supabase.ts`, `src/repositories/sheets.ts`, `scripts/google-sheet-webhook.gs`, `README.md`
- Test: `tests/unit/repositories/sheets.test.ts`, `tests/integration/repositories.supabase.test.ts` (ใช้ contract จาก Task 4; ข้ามเมื่อไม่มี env ตามแบบเดิม)

**Interfaces:**

- Consumes: `StatsRepository`, `UsageEvent`, `UsageCount` (Task 4)
- Produces: SQL `public.usage_daily(day date, kind text check (kind in ('view','report','visit')), topic_id text not null default '', count integer not null default 0, primary key (day, kind, topic_id))`, RLS on, revoke anon/authenticated; `function public.increment_usage(p_day date, p_kind text, p_topic_id text) returns void` (`insert … on conflict … do update set count = usage_daily.count + 1`); Apps Script actions `usage.increment` `{ day, kind, topicId }` และ `usage.list` `{ sinceDay }` บนแท็บ `usage_daily` headers `["day","kind","topic_id","count"]`

- [ ] **Step 1: Write failing tests** ใน `sheets.test.ts`: `stats.increment calls usage.increment with day/kind/topicId`; `stats.list maps rows to UsageCount with numeric count` (mock fetch ตามแบบ test เดิม)
- [ ] **Step 2:** run → FAIL
- [ ] **Step 3:** implement adapters (supabase ใช้ `db.rpc("increment_usage", …)` และ `.from("usage_daily").select().gte("day", since)`), script actions (หาแถวด้วย `findRow` แบบ composite แล้ว `writeRow`), README ส่วน "Google Sheet as the database" และ "Production (Supabase)" ระบุ migration 0006 และการ deploy script ใหม่
- [ ] **Step 4:** run + typecheck → PASS
- [ ] **Step 5: Commit** `feat(stats): usage counters on Supabase and Google Sheet backends`

### Task 6: บันทึกการใช้งาน (service + `/api/log` + ฝั่ง browser)

**Files:**

- Create: `src/services/stats-service.ts`; Modify: `src/services/index.ts` (`statsService()`)
- Modify: `src/app/api/log/route.ts`, `src/lib/log-event.ts`, `src/components/features/topic/topic-card.tsx` (นับเมื่อกาง accordion), `src/components/features/report/message-preview.tsx` + `report-form.tsx` + `src/app/report/page.tsx` (ส่ง `topicId`)
- Create: `src/components/features/layout/visit-tracker.tsx`; Modify: `src/app/layout.tsx`
- Modify: `src/services/sheet-log.ts` caller: แถว report เพิ่มคอลัมน์ชื่อหัวข้อท้ายสุด + header ใน `scripts/google-sheet-webhook.gs`
- Test: `tests/unit/services/stats-service.test.ts`, `tests/integration/api-log.test.ts`, `tests/unit/components/home.test.tsx`, `tests/unit/components/report-form.test.tsx`

**Interfaces:**

- Consumes: `StatsRepository`, `bangkokDay`, `sinceDay` (Task 4)
- Produces:
  - `createStatsService(deps: { stats: StatsRepository; now: () => Date })` คืน `{ record(kind: UsageKind, topicId?: string): Promise<void>; getViewCounts(): Promise<Record<string, number>>; getAdminStats(range: "7d"|"30d"|"all"): Promise<AdminStats> }`
  - `interface AdminStats { visits: number; views: number; reports: number; byTopic: Record<string, { views: number; reports: number }>; degraded: boolean }` (`reports` รวม report ที่ topicId = "")
  - `LogEvent` เพิ่ม `{ kind: "visit" }` และ report มี `topicId?: string`
- Behaviour: `record` จับ error แล้ว `console.error("[stats]", …)`; `getViewCounts` แคช 60 s (ใช้ `now()`), error → `{}`; `getAdminStats` error → ค่าศูนย์ + `degraded: true`

- [ ] **Step 1: Write failing tests:**
  - stats-service: `record increments with today's Bangkok day`; `getViewCounts sums views across days and caches for 60 s` (เรียก list ครั้งเดียวภายใน 60 s, ครั้งที่สองหลังเลื่อน now 61 s); `getViewCounts returns {} when the repository fails`; `getAdminStats("7d") passes sinceDay and sums visits/views/reports`
  - api-log: `view increments the counter for that topic`; `visit increments visit with empty topicId and needs no sheet`; `report with a real topicId counts for that topic and adds the topic title column to the sheet row`; `report with an unknown topicId still logs (202) and counts as report without topic`; `stats failure never breaks logging` (`DATA_BACKEND=failing` → 202)
  - home/topic-card: `expanding a card in accordion mode logs one view; expanding again in the same visit does not` (mock `navigator.sendBeacon`)
  - report-form: `copying a report from /report?topic=X sends topicId X`
- [ ] **Step 2:** run → FAIL
- [ ] **Step 3:** implement; `/api/log` เรียก `statsService().record(...)` หลังผ่าน validation และไม่ await จนบล็อก error (await ได้ แต่ `record` ไม่ throw); schema `visit` = `z.object({ kind: z.literal("visit") })`; `VisitTracker` เป็น client component ใช้ `usePathname`, ข้าม `/admin*` และ `/login*`, `sessionStorage` key `bgs-visit-logged` ใน try/catch
- [ ] **Step 4:** run ทั้งหมด + typecheck → PASS
- [ ] **Step 5: Commit** `feat(stats): count topic views, reports per topic and visits; count accordion views too`

### Task 7: ยอดดูและยอดนิยมฝั่งผู้ใช้

**Files:**

- Create: `src/domain/popularity.ts`, `src/components/features/home/popular-strip.tsx`
- Modify: `src/app/page.tsx` (ดึง `statsService().getViewCounts()` ใน `Promise.all`), `src/components/features/home/home-screen.tsx`, `src/components/features/topic/topic-card.tsx` (`TopicMeta`), `src/i18n/th.ts` (`th.stats.views(n)`, `th.stats.popular`, `th.stats.frequentTitle = "ปัญหาที่พบบ่อย"`)
- Test: `tests/unit/domain/popularity.test.ts`, `tests/unit/components/home.test.tsx`

**Interfaces:**

- Consumes: `getViewCounts()` (Task 6)
- Produces: `export const VIEW_COUNT_MIN = 5; export function rankPopular(topics: EffectiveTopic[], counts: Record<string, number>, limit: number): EffectiveTopic[]` (เฉพาะหัวข้อใน `topics` ที่ count ≥ 5, เรียงมาก→น้อย, เท่ากันเรียงตามลำดับเดิม); `HomeScreen` prop ใหม่ `viewCounts: Record<string, number>`; `TopicCard`/`TopicMeta` prop `views?: number`, `popular?: boolean`

- [ ] **Step 1: Write failing tests:**
  - popularity: ตัดหัวข้อ < 5; ตัดหัวข้อที่ไม่อยู่ใน `topics` (ถูกลบ/ซ่อน); limit ถูกต้อง; tie คงลำดับเดิม
  - home: `shows "ดู 128 ครั้ง" for a topic with 128 views and nothing for 4 views`; `marks the top 5 as ยอดนิยม`; `shows the ปัญหาที่พบบ่อย strip with 3 topics when not searching`; `hides the strip while searching or filtering a category`; `hides the strip when no topic has 5 views`; `clicking a strip item selects/opens that topic and logs a view`; `never shows report counts`
- [ ] **Step 2:** run → FAIL
- [ ] **Step 3:** implement; แถบวางเหนือรายการใน `<section aria-labelledby="topics-title">`
- [ ] **Step 4:** run + typecheck; เปิดหน้าแรกจริง (ใส่ตัวนับทดสอบใน `.data/db.json`) ดูจอกว้างและ 390px → ถูกต้อง
- [ ] **Step 5: Commit** `feat(home): view counts, popular badge and frequent-problems strip`

### Task 8: หน้าสถิติเจ้าหน้าที่ `/admin/stats`

**Files:**

- Create: `src/app/admin/stats/page.tsx`, `src/components/features/admin/stats-table.tsx`
- Modify: `src/app/admin/page.tsx` (ปุ่ม "สถิติ" ข้าง `th.taxonomy.nav`), `src/i18n/th.ts` (`th.stats.admin.*`)
- Test: `tests/unit/components/admin.test.tsx`

**Interfaces:**

- Consumes: `getAdminStats(range)` (Task 6), `topicService().getPublicTopics()` + admin topic list สำหรับชื่อ/หมวด, `requireAdmin()` (ทุกบทบาท ไม่ต้องเช็ค `canPublish`)
- Produces: route `/admin/stats?range=7d|30d|all` (ค่าผิด/ไม่มี → `30d`)

- [ ] **Step 1: Write failing tests** สำหรับ `StatsTable`: แสดงการเข้าเว็บ/ยอดดูรวม/ยอดแจ้งรวม; แถวเรียงตามยอดดู; คอลัมน์ % = round(reports/views×100), views = 0 → "—"; topicId ที่ไม่มีในรายการหัวข้อ → "(หัวข้อถูกลบ)"; `degraded` → แสดงข้อความแจ้งว่าอ่านสถิติไม่ได้; ตัวเลือกช่วงเวลาเป็นลิงก์ 3 อัน และอันปัจจุบันมี `aria-current`
- [ ] **Step 2:** run → FAIL
- [ ] **Step 3:** implement (server page ตามแบบ `src/app/admin/taxonomy/page.tsx`)
- [ ] **Step 4:** run + typecheck + lint; เปิด `/admin/stats` จริงทั้งสามช่วง → ถูกต้อง
- [ ] **Step 5: Commit** `feat(admin): usage statistics page`

### ปิดงาน

- [ ] `npm run typecheck && npm run lint && npx vitest run` ผ่านทั้งหมด
- [ ] ลองใช้งานจริงบน dev server: แนบรูปอาการ → เห็นในผลค้นหา; เปิดหัวข้อ (จอกว้าง + มือถือ) → ยอดเพิ่ม; แจ้งปัญหาจากหัวข้อ → ยอดแจ้งในหน้าสถิติเพิ่ม

## Addendum (2026-11-18): Helpful feedback

- Task 4: `USAGE_KINDS` = `["view", "report", "visit", "helpful", "unhelpful"]`; Supabase check constraint (Task 5) รวมทั้งห้า
- Task 6: `LogEvent` เพิ่ม `{ kind: "helpful" | "unhelpful"; topicId: string }`; `/api/log` รับเฉพาะหัวข้อที่มีอยู่จริง (ไม่ส่ง Sheet log); `AdminStats.byTopic[id]` เพิ่ม `helpful`, `unhelpful`
- Task 6b (ใหม่): `src/components/features/topic/helpful-feedback.tsx` `<HelpfulFeedback topicId />` วางใน `TopicDetail` ก่อนกล่องแจ้งทีม; tests: กดใช่ → ส่ง `helpful` ครั้งเดียวและแสดงคำขอบคุณ; กดไม่ใช่ → ส่ง `unhelpful` และแสดงคำขอบคุณแบบชวนแจ้งทีม; เปิดหัวข้อเดิมซ้ำในการเข้าหน้าเดียว → ไม่แสดงปุ่มอีก
- Task 8: คอลัมน์ ช่วยได้ / ไม่ช่วย / % ช่วยได้ (ไม่มีคำตอบ → "—")
