<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 2.0.0
Bump rationale: MAJOR — product principles from the Call Center team's constitution
(c:\Users\MS-10\Desktop\constitution.md) were adopted as Principles I–VII. The
engineering principles of v1.0.0 were kept and renumbered VIII–XV; v1 Principle III
(Thai/English i18n) was redefined as Thai-first.

Principles:
  I.    Self-Service First (new, from Desktop constitution)
  II.   Evidence-Based Content (new)
  III.  ข้อมูลครบตั้งแต่ข้อความแรก (new)
  IV.   ภาษาไทยที่เจ้าหน้าที่หน้างานเข้าใจ (new)
  V.    ความปลอดภัยและความเป็นส่วนตัว (new)
  VI.   สิทธิ์การแก้ไขชัดเจน (new)
  VII.  เรียบง่าย ใช้ได้บนทุกอุปกรณ์ (new)
  VIII. Code Quality            (was I)
  IX.   Test-Driven Development (was II)
  X.    UX Consistency          (was III; i18n → Thai-first centralized strings)
  XI.   Performance             (was IV)
  XII.  Commit Discipline       (was V)
  XIII. Reuse First             (was VI)
  XIV.  Centralized Business Logic (was VII)
  XV.   Skill-Assisted Development (was VIII)

Sections added: Mission & metrics, Content Standards, Content Workflow.

Templates requiring updates:
  ✅ .specify/templates/*.md — generic; gates derived from this file at plan time.
  ⚠ specs/001-faq-callcenter-mvp/{spec,plan,tasks}.md — MUST be regenerated for v2
     (previous version assumed login-only call-center agents and TH/EN UI).

Deferred TODOs: none
-->

# Constitution: ศูนย์ช่วยเหลือ ระบบคลาวด์กลาง (Self-Service FAQ App)

> เอกสารหลักการของโปรเจกต์ ใช้เป็นกรอบตัดสินใจสำหรับทุกการพัฒนา การแก้ไขเนื้อหา และการเพิ่มฟีเจอร์
> ทั้งทีมพัฒนา ทีม Call Center และ AI Agent ที่ช่วยพัฒนาต้องยึดถือเอกสารนี้

---

## พันธกิจ (Mission)

ลดภาระทีม Call Center ด้วยการให้เจ้าหน้าที่ รพ.สต. **แก้ปัญหาที่พบบ่อยได้ด้วยตัวเอง** และเมื่อจำเป็นต้องแจ้งทีม ต้อง**แจ้งด้วยข้อมูลที่ครบตั้งแต่ข้อความแรก** เพื่อให้แก้ไขหรือรีโมทได้ทันที

### ตัวชี้วัดความสำเร็จ

| ตัวชี้วัด | ค่าตั้งต้น (มี.ค.–พ.ย. 2569) | เป้าหมาย |
|---|---|---|
| จำนวนเคสต่อเดือน ใน 6 ปัญหาหลัก | 46% ของเคสทั้งหมด | ลดลง 30% ภายใน 6 เดือน |
| เคสที่ข้อมูลไม่ครบ / ติดต่อกลับไม่ได้ | ~940 เคส (≈4.6%) | ต่ำกว่า 1% |
| เคสที่แก้ได้ด้วย 3 ขั้นพื้นฐาน | ~2,000 เคส (≈10%) | ลูกค้าแก้เองได้ ไม่ต้องแจ้งเข้ามา |

---

## Part A — หลักการด้านผลิตภัณฑ์ (Product Principles)

### I. Self-Service First: แก้เองได้ก่อนแจ้ง

- ทุกหัวข้อปัญหาต้องบอก**ขั้นตอนที่ทำได้จริง**ก่อนเสมอ ไม่ใช่แค่ "ติดต่อทีมงาน"
- ทุกหัวข้อต้องมีป้ายระดับที่ตรงกับความจริง: `ทำเองได้` / `ทำเองได้บางส่วน` / `ต้องแจ้งทีม`
- ถ้าทำตามแล้วไม่หาย ต้องมีทางไปต่อทันที (ปุ่ม "ยังไม่ได้" → แบบฟอร์มแจ้งปัญหา พร้อมกรอกหัวข้อให้)
- "3 ขั้นก่อนแจ้งปัญหา" (ล้างแคช / ตรวจ EHP Agent / เข้าผ่าน SSO) ต้องอยู่ตำแหน่งที่เห็นได้ทันที

### II. Evidence-Based Content: เนื้อหามาจากเคสจริง

- หัวข้อ ลำดับความสำคัญ และวิธีแก้ ต้องอ้างอิงจาก**รายงานเคส Call Center** ไม่ใช่การคาดเดา
- หมวดที่มีเคสมากต้องได้รับการดูแลเนื้อหาก่อน (Authen, เข้าระบบ, สติกเกอร์ยา, ตรวจสิทธิ, คีย์ยา, ส่งออกข้อมูล)
- ทบทวนการจัดกลุ่มปัญหาจากรายงานเคส**ทุกเดือน** และปรับหัวข้อตามข้อมูลล่าสุด
- ตัวเลขสถิติที่แสดงต้องระบุช่วงเวลาและแหล่งที่มา

### III. ข้อมูลครบตั้งแต่ข้อความแรก

- แบบฟอร์มแจ้งปัญหาต้องสร้างข้อความตาม**รูปแบบมาตรฐานของทีม**เท่านั้น:
  ```
  ชื่อ - สกุล ผู้แจ้ง:
  ตำแหน่งงาน :
  รหัสหน่วยงาน 5 หลัก :
  ชื่อหน่วยงาน :
  เบอร์ติดต่อ :
  อีเมล :
  เลข AnyDesk :
  รายละเอียดปัญหา :
  ```
- ช่องบังคับ: ชื่อ, ตำแหน่ง, รหัสหน่วยงาน (ตัวเลข 5 หลัก), ชื่อหน่วยงาน, เบอร์ติดต่อ, รายละเอียดปัญหา
- การเปลี่ยนรูปแบบข้อความต้องได้รับความเห็นชอบจากหัวหน้าทีม Call Center ก่อน

### IV. ภาษาไทยที่เจ้าหน้าที่หน้างานเข้าใจ

- เขียนเป็นภาษาไทยที่ใช้จริงในหน้างาน ใช้คำที่ผู้ใช้พิมพ์ค้นหา (เช่น "ออเทน", "ปริ้นสติ๊กเกอร์") เป็นคำค้นเพิ่มเติม
- ขั้นตอนต้องเป็น**ลำดับเลข ทีละการกระทำ** ระบุเส้นทางเมนูแบบ `Setting › Organization › ผู้ใช้งาน`
- หลีกเลี่ยงศัพท์เทคนิคฝั่งระบบ (ชื่อตาราง, SQL, ชื่อฟิลด์) ในเนื้อหาที่ลูกค้าเห็น
- หนึ่งหัวข้อ = หนึ่งอาการ ชื่อหัวข้อขึ้นต้นด้วย**อาการที่ผู้ใช้เห็น** ไม่ใช่ชื่อสาเหตุ

### V. ความปลอดภัยและความเป็นส่วนตัว

- **ห้าม**เก็บหรือแสดงข้อมูลผู้ป่วย (ชื่อ, HN, เลขบัตรประชาชน) ในแอป ในคลิป หรือในภาพหน้าจอคู่มือ ภาพที่ใช้ต้องปิดบังข้อมูลส่วนบุคคลก่อนอัปโหลด
- **ห้าม**ใส่ Token, รหัสผ่าน, Provider ID หรือค่าลับใด ๆ ในเนื้อหา
- ข้อมูลผู้แจ้งที่ "จำไว้ในเครื่อง" เก็บเฉพาะในเบราว์เซอร์ของผู้ใช้เท่านั้น ไม่ส่งขึ้นเซิร์ฟเวอร์
- เนื้อหาที่ Admin กรอกต้องถูก escape ก่อนแสดงผลเสมอ ห้ามแสดงเป็น HTML ดิบ
- ลิงก์ภายนอกต้องเป็น `https://` เท่านั้น

### VI. สิทธิ์การแก้ไขชัดเจน

- **ลูกค้า (Viewer):** ดู ค้นหา และสร้างข้อความแจ้งปัญหาได้ แก้ไขเนื้อหาไม่ได้
- **Admin (Owner / Editor):** แก้ไขทุกหัวข้อ เพิ่มหัวข้อใหม่ แนบคลิป/คู่มือ ซ่อนหรือคืนค่าเดิมได้
- หัวข้อต้นฉบับ**ไม่ถูกลบ** ทำได้เพียงแก้ไข (override) ซ่อน หรือคืนค่าเดิม เพื่อย้อนกลับได้เสมอ
- การลบที่ย้อนกลับไม่ได้ (ลบไฟล์, ลบหัวข้อที่เพิ่มเอง) ต้องกดยืนยันสองครั้ง

### VII. เรียบง่าย ใช้ได้บนทุกอุปกรณ์

- ต้องใช้งานได้บนคอมพิวเตอร์ของ รพ.สต. และมือถือ (หน้าจอกว้าง ≥ 360px)
- เนื้อหาหลัก (FAQ + แบบฟอร์ม) ต้อง**ใช้ได้แม้ไม่มีฐานข้อมูล** เช่น ผู้ใช้ไม่ได้ล็อกอิน หรือเชื่อมต่อฐานข้อมูลไม่ได้
- ไฟล์แนบไม่เกิน 20 MB คลิปที่ยาวกว่านั้นให้ใช้ลิงก์ YouTube (Unlisted) หรือ Google Drive
- ไม่เพิ่มฟีเจอร์ที่ไม่ช่วยลดจำนวนเคสหรือลดเวลาแก้ปัญหา

---

## Part B — หลักการด้านวิศวกรรม (Engineering Principles)

### VIII. Code Quality (NON-NEGOTIABLE)

- Code MUST pass linter, formatter, and type checker with zero errors before commit;
  suppressed warnings need an inline justification.
- TypeScript `strict` MUST be on; `any` is prohibited except at validated external
  boundaries.
- Functions SHOULD stay under ~40 lines and 3 nesting levels; files over ~300 lines MUST
  be split by responsibility. No magic numbers/strings — use named constants.
- Errors MUST NOT be swallowed; each is handled with a user-meaningful outcome or logged
  with context. Dead and commented-out code MUST be removed.

### IX. Test-Driven Development (NON-NEGOTIABLE)

- Red → Green → Refactor is mandatory: write a failing test, confirm it fails, write the
  minimum code, refactor while green. Every bug fix includes a regression test.
- Layers: **unit** (domain/services ≥ 90% coverage), **integration** (route handlers,
  server actions, repository contract suite), **E2E** for every primary journey.
- E2E MUST cover the release checklist: ค้นหา, เปิด-ปิดหัวข้อ, สร้างข้อความแจ้งปัญหา,
  แก้ไขในโหมด Admin, แสดงผลบนมือถือ, ใช้งานแบบไม่มีฐานข้อมูล/ไม่ล็อกอิน, และ escape
  อักขระพิเศษ/แท็ก HTML.
- Overall coverage MUST stay ≥ 80%; tests MUST be deterministic and fast (unit < 30 s).

### X. User Experience Consistency

- All UI MUST use the shared component library and centralized design tokens; one-off
  styling of shared patterns is prohibited.
- The same action looks and behaves the same everywhere; every data view has shared
  loading / empty / error / success states.
- All UI text MUST come from the centralized Thai strings module — no inline literals.
- WCAG 2.1 AA: keyboard operable, visible focus, sufficient contrast, semantic labels.
  User input MUST never be lost on validation error.

### XI. Performance Requirements

| Metric | Budget |
|---|---|
| Search results update after typing (p95) | ≤ 300 ms |
| Read API / page server time (p95) | ≤ 500 ms |
| Largest Contentful Paint (รพ.สต. PC / mid-range phone, 4G) | ≤ 2.5 s |
| Interaction to Next Paint | ≤ 200 ms |
| Cumulative Layout Shift | ≤ 0.1 |
| First-load JS per route (gzipped) | ≤ 200 KB |

Lists over 50 items MUST paginate or virtualize; no N+1 queries. A regression MUST NOT
merge without an approved exception.

### XII. Commit Discipline

- Commit after every completed TDD cycle or task; never leave working state uncommitted.
- Commits are atomic, build, pass tests, and follow Conventional Commits.
- Work on feature branches; merge to `main` only after Quality Gates pass.
- Secrets, `.env*`, and any patient data MUST never be committed.
- Pre-commit hooks MUST run lint, format, type check, and related tests; `--no-verify`
  is prohibited.

### XIII. Reuse First (Shared Components & Functions)

- Search for an existing component/hook/utility before writing a new one.
- Anything used in 2+ places MUST be extracted into a shared, tested module.
- Shared UI components are presentational and MUST NOT embed business rules.

### XIV. Centralized Business Logic

- All rules (topic merge/override/hide/restore, search ranking, report-message format and
  validation, permissions, link and attachment rules) MUST live in the domain/service
  layer — one authoritative implementation per rule.
- Pages, route handlers, and server actions MUST be thin: parse → call service → render.
- Validation schemas are defined once and shared between client and server.
- Storage goes through repository interfaces; the domain layer has no framework
  dependencies.

### XV. Skill-Assisted Development

Use the matching Claude Code skills/agents rather than working ad hoc:
`superpowers:brainstorming` + Spec Kit for design; `superpowers:test-driven-development`
for implementation; `superpowers:systematic-debugging` for failures;
`frontend-design`, `web-design-guidelines`, `vercel-react-best-practices` for UI;
Playwright for E2E; `superpowers:verification-before-completion` before claiming done;
`code-review` / `simplify` / `security-review` before merge. Check library APIs against
current docs, not memory. The constitution wins over any skill guidance.

---

## มาตรฐานเนื้อหา (Content Standards)

### โครงสร้างหัวข้อปัญหา

| ส่วน | ข้อกำหนด |
|---|---|
| คำถาม / อาการ | สิ่งที่ผู้ใช้เห็นบนหน้าจอ เช่น "ขอ Authen Code ไม่ได้ / อ่านบัตรไม่ได้" |
| หมวด | เลือกจาก 8 หมวดหลักเท่านั้น |
| ระดับ | ทำเองได้ / ทำเองได้บางส่วน / ต้องแจ้งทีม |
| คำค้นเพิ่มเติม | คำพ้อง คำสะกดผิดที่พบบ่อย ภาษาอังกฤษ |
| วิธีแก้ | ขั้นตอนลำดับเลข + กล่อง `>` "ถ้ายังไม่ได้" บอกว่าต้องเตรียมอะไรก่อนแจ้งทีม |
| คลิป / คู่มือ | ไม่บังคับ แต่ควรมีสำหรับ 10 ปัญหาที่พบบ่อยที่สุด |

### หมวดหลัก

1. เข้าสู่ระบบ / EHP Agent
2. ตรวจสอบสิทธิ / Authen Code
3. ส่งเคลม / ส่งออกข้อมูล
4. การพิมพ์ / เครื่องพิมพ์
5. ยา / คลังเวชภัณฑ์
6. บันทึกการให้บริการ
7. การเงิน / ค่าบริการ
8. ทะเบียนผู้ป่วย / แบบฟอร์ม

การเพิ่มหรือเปลี่ยนหมวดหลักต้องแก้ไขเอกสารนี้ (ดู Governance)

### รูปแบบการเขียนคำตอบ

```
1. ขั้นตอน            → ลำดับขั้น
- ข้อ                  → หัวข้อย่อย
> ข้อความ             → กล่องหมายเหตุ
**ตัวหนา**             → เน้น
`Setting › เมนู`       → เส้นทางเมนู
[ข้อความ](https://...) → ลิงก์
```

### มาตรฐานคลิปและคู่มือ

- คลิปยาว **1–3 นาที** ต่อหนึ่งปัญหา แสดงหน้าจอจริงตั้งแต่ต้นจนแก้ได้
- ชื่อคลิปขึ้นต้นด้วยสิ่งที่ทำ เช่น "วิธีติดตั้ง secureagent 1.1.3"
- PDF คู่มือระบุวันที่และเวอร์ชันของระบบที่ใช้อ้างอิง
- ตรวจว่าไม่มีข้อมูลผู้ป่วยหรือค่าลับในภาพก่อนอัปโหลดทุกครั้ง

---

## กระบวนการทำงาน (Workflow)

### การอัปเดตเนื้อหา

1. **ทุกสัปดาห์:** Admin ตรวจเคสใหม่ ถ้าพบปัญหาเดิมซ้ำ ≥ 5 เคส และยังไม่มีในแอป ให้เพิ่มหัวข้อ
2. **เมื่อระบบเปลี่ยน:** (เมนูย้าย, เวอร์ชันใหม่, นโยบาย สปสช. เปลี่ยน) แก้หัวข้อที่เกี่ยวข้องภายใน 2 วันทำการ
3. **ทุกเดือน:** ทบทวนสถิติเคสตามหมวด เทียบกับเดือนก่อน และปรับลำดับความสำคัญของเนื้อหา
4. **หลังแก้ไขผ่าน Admin:** เผยแพร่เนื้อหาเข้าหน้าหลัก เพื่อให้ผู้ใช้ที่ไม่ได้ล็อกอินเห็นด้วย

### การพัฒนาฟีเจอร์

1. ทุกฟีเจอร์ใหม่ต้องตอบได้ว่า **"ลดเคสหรือลดเวลาแก้ปัญหาอย่างไร"**
2. Spec Kit flow: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`, on a feature branch, TDD per task, commit per task.
3. ทดสอบก่อนเผยแพร่: ค้นหา, เปิด-ปิดหัวข้อ, สร้างข้อความแจ้งปัญหา, แก้ไขในโหมด Admin, แสดงผลบนมือถือ
4. ทดสอบกรณีไม่มีฐานข้อมูล (ผู้ใช้ไม่ได้ล็อกอิน) ว่ายังใช้ FAQ และแบบฟอร์มได้
5. ทดสอบว่าเนื้อหาที่มีอักขระพิเศษหรือแท็ก HTML ถูก escape ถูกต้อง

### Quality Gates (ก่อน merge เข้า `main`)

1. Lint, format, type check — 0 errors
2. Unit + integration + E2E ผ่านทั้งหมด, coverage ตาม IX
3. Performance budgets ตาม XI
4. Accessibility check (axe) สำหรับงาน UI
5. Code review ยืนยันตามหลักการ I–XV
6. Security review สำหรับงานที่แตะ auth, สิทธิ์, หรือข้อมูลที่ผู้ใช้กรอก

### ข้อจำกัดที่ทราบ

- คลิป YouTube เล่นภายในหน้าไม่ได้ แสดงเป็นปุ่มเปิดลิงก์
- ปุ่ม 👍/👎 ยังไม่บันทึกผล (แผนในอนาคต)

---

## การกำกับดูแล (Governance)

- เอกสารนี้มีลำดับความสำคัญ**สูงกว่า**แนวปฏิบัติอื่นของโปรเจกต์ ถ้าขัดกัน ให้ยึดเอกสารนี้
- การแก้ไขเอกสารต้องระบุเหตุผล ได้รับความเห็นชอบจากหัวหน้าทีม Call Center และปรับเลขเวอร์ชัน:
  - **MAJOR** เปลี่ยนหรือยกเลิกหลักการหลัก หรือรูปแบบข้อความแจ้งปัญหา
  - **MINOR** เพิ่มหลักการ หมวด หรือมาตรฐานใหม่
  - **PATCH** แก้ถ้อยคำ ตัวเลข หรือรายละเอียดที่ไม่เปลี่ยนความหมาย
- ทุกการตรวจรับงาน (review) ต้องตรวจว่าเป็นไปตามหลักการ I–XV
- ทบทวนเอกสารทั้งฉบับอย่างน้อย**ทุก 6 เดือน**

**Version**: 2.0.0 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-16
