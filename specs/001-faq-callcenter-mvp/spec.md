# Feature Specification: ศูนย์ช่วยเหลือ ระบบคลาวด์กลาง — Self-Service FAQ MVP

**Feature Branch**: `001-faq-callcenter-mvp`

**Created**: 2026-11-16 · **Revised**: 2026-11-16 (aligned to constitution v2.0.0)

**Status**: Draft

**Input**: User description: "BGS FAQ Callcenter MVP … friendly, beautiful UI and a
built-in 'How to use' guide … unit, integration, and E2E tests. Tech direction: Next.js +
Supabase." — refined by the Call Center team's constitution (self-service FAQ for
รพ.สต. staff, standard problem-report message, 8 categories, admin overrides).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - เจ้าหน้าที่ รพ.สต. ค้นหาและแก้ปัญหาเอง (Priority: P1)

A รพ.สต. staff member hits a problem in the central cloud system (e.g., "ขอ Authen Code
ไม่ได้"). Without signing in, they open the help center, immediately see the
"3 ขั้นก่อนแจ้งปัญหา" (clear cache / check EHP Agent / sign in via SSO), type what they
see on screen (including common misspellings such as "ออเทน"), open the matching topic,
and follow the numbered steps.

**Why this priority**: Self-service is the mission (Principle I); it reduces case volume.

**Independent Test**: Open the home page signed out, type "ออเทน", expand the top
result, and see numbered steps, a level badge, and a "ถ้ายังไม่ได้" note.

**Acceptance Scenarios**:

1. **Given** the home page, **When** it loads, **Then** the 3 basic steps are visible
   above the topic list without scrolling on a 360 px wide screen.
2. **Given** topics exist, **When** the user types a word found in a topic's title,
   keywords, or solution, **Then** matching visible topics are listed, title matches first.
3. **Given** a topic has the extra keyword "ออเทน", **When** the user searches "ออเทน",
   **Then** that topic is found even though the title says "Authen".
4. **Given** the topic list, **When** the user picks one of the 8 categories, **Then** only
   topics in that category are shown, with a count per category.
5. **Given** a topic card, **When** the user taps it, **Then** it expands to show the
   formatted solution (numbered steps, bullets, note boxes, bold, menu paths, https
   links, clip/manual buttons); tapping again collapses it.
6. **Given** each topic, **Then** it shows exactly one level badge: ทำเองได้ /
   ทำเองได้บางส่วน / ต้องแจ้งทีม.
7. **Given** no topic matches, **Then** a friendly empty state offers to clear the search
   or go to the report form.

---

### User Story 2 - แจ้งปัญหาด้วยข้อมูลครบตั้งแต่ข้อความแรก (Priority: P2)

When the steps don't solve it, the user presses "ยังไม่ได้" on the topic. A report form
opens with the topic already filled into the problem details. They fill in their details
(optionally remembered on this device), and the app produces the team's standard message
to copy into the Call Center channel.

**Why this priority**: Incomplete reports (~4.6% of cases) cause call-backs; this fixes it
(Principle III).

**Independent Test**: Press "ยังไม่ได้" on a topic, fill required fields, press
"สร้างข้อความ", and the copied text matches the standard template exactly.

**Acceptance Scenarios**:

1. **Given** an expanded topic, **When** the user presses "ยังไม่ได้", **Then** the
   report form opens with "รายละเอียดปัญหา" starting with "[หัวข้อ] <topic title>".
2. **Given** the form, **When** a required field (ชื่อ-สกุล, ตำแหน่ง, รหัสหน่วยงาน,
   ชื่อหน่วยงาน, เบอร์ติดต่อ, รายละเอียดปัญหา) is empty or the unit code is not exactly
   5 digits, **Then** the field shows a clear Thai message and nothing typed is lost.
3. **Given** valid input, **When** the user presses "สร้างข้อความ", **Then** a preview of
   the standard message is shown and "คัดลอกข้อความ" copies it, with a "คัดลอกแล้ว" toast.
4. **Given** "จำข้อมูลผู้แจ้งไว้ในเครื่องนี้" is ticked, **When** the user returns later,
   **Then** reporter fields (not problem details) are pre-filled from this browser only;
   unticking clears the saved data.
5. **Given** the report form, **Then** it is reachable directly from the header without a
   topic, and works without signing in.

---

### User Story 3 - Admin แก้ไขเนื้อหาโดยย้อนกลับได้เสมอ (Priority: P3)

A Call Center admin signs in, edits a built-in topic (stored as an override), adds new
topics, attaches clip/manual links, hides topics, and restores a built-in topic to its
original wording. Custom topics can be deleted only after confirming twice.

**Why this priority**: Content must follow real case data (Principle II) and stay
reversible (Principle VI).

**Independent Test**: As admin, edit a built-in topic's title, confirm viewers see the
new title, press "คืนค่าเดิม", and confirm the original title returns.

**Acceptance Scenarios**:

1. **Given** a signed-out user, **When** they open `/admin`, **Then** they are sent to
   sign in; viewers never see edit controls.
2. **Given** an admin edits a built-in topic and saves, **Then** viewers see the edited
   version, and the topic is marked "แก้ไขแล้ว" in admin with editor and time.
3. **Given** an edited built-in topic, **When** the admin presses "คืนค่าเดิม" and
   confirms, **Then** the original content returns.
4. **Given** any topic, **When** the admin hides it, **Then** viewers no longer see it;
   "แสดง" brings it back.
5. **Given** an admin creates a new topic with title, category (one of 8), level, keywords,
   solution, and optional https links, **Then** it appears for viewers.
6. **Given** a custom topic, **When** the admin deletes it, **Then** two confirmations are
   required; built-in topics have no delete action.
7. **Given** an attachment URL not starting with `https://`, **Then** saving is refused
   with a message.
8. **Given** solution text containing `<script>` or other HTML, **Then** viewers see it
   as plain text — never executed or rendered as HTML.
9. **Given** two admins edit the same topic, **Then** the later stale save is refused with
   "มีคนแก้ไขหัวข้อนี้ไปแล้ว กรุณาโหลดใหม่".

---

### User Story 4 - ใช้ได้แม้ไม่มีฐานข้อมูล (Priority: P4)

If the content store is unreachable, viewers still see the built-in topics and can use
the report form.

**Why this priority**: Principle VII — the help center must work when other things fail.

**Independent Test**: Start the app with the store forced to fail; home page shows
built-in topics, a small notice, and the report form works.

**Acceptance Scenarios**:

1. **Given** the store fails, **When** a viewer opens the home page, **Then** built-in
   topics are listed with a notice "กำลังแสดงเนื้อหาพื้นฐาน".
2. **Given** the store fails, **Then** the report form still generates and copies the
   message.

---

### User Story 5 - หน้าวิธีใช้งาน (Priority: P5)

A first-time user opens "วิธีใช้งาน" and learns how to search, read levels, use the 3
basic steps, report a problem, and (for admins) how to edit content.

**Independent Test**: Open "วิธีใช้งาน" from the header; the guide shows the viewer
section; signed-in admins also see the admin section.

**Acceptance Scenarios**:

1. **Given** any user, **When** they open "วิธีใช้งาน", **Then** step-by-step cards
   explain search, level badges, the 3 basic steps, and the report form.
2. **Given** a signed-in admin, **Then** an admin section explains edit / hide / restore /
   delete.

---

### Edge Cases

- Search with only spaces/symbols → show all visible topics.
- Search over 200 characters → trimmed.
- Thai has no word spaces → substring matching; case-insensitive for English terms.
- Clipboard blocked → message shown and the text selected for manual copy.
- localStorage unavailable (private mode) → "remember me" quietly disabled; form works.
- Unit code with spaces/dashes ("12 345") → digits extracted; must total exactly 5.
- Phone accepts digits, spaces, dashes, `+`; 9–15 digits.
- Optional email, if given, must be valid; optional AnyDesk ID, if given, 9–10 digits
  (spaces allowed).
- Admin session expires → next admin action redirects to sign-in.
- A built-in topic changes in a new release while an override exists → the override is
  still shown (admin can restore to see the new original).

## Requirements *(mandatory)*

### Functional Requirements

**Viewer (no sign-in)**

- **FR-001**: The home page MUST show the 3 basic steps (ล้างแคช / ตรวจ EHP Agent /
  เข้าผ่าน SSO) prominently at the top.
- **FR-002**: Users MUST be able to search visible topics by title, extra keywords, and
  solution text; ranking: title > keywords > solution; ties keep curated order.
- **FR-003**: Users MUST be able to filter by one of the 8 fixed categories (constitution
  list), with a per-category count.
- **FR-004**: Each topic MUST show its category and exactly one level badge.
- **FR-005**: Topics MUST expand/collapse to show the solution rendered from the content
  format (numbered steps, bullets, `>` notes, `**bold**`, `` `menu path` ``,
  `[text](https://…)`), never as raw HTML.
- **FR-006**: Topics MAY have attachments (clip / manual / link), each an https URL with a
  label; shown as buttons opening in a new tab.
- **FR-007**: Each expanded topic MUST offer "ยังไม่ได้" leading to the report form
  prefilled with the topic.

**Report form**

- **FR-008**: The form MUST collect: ชื่อ-สกุล (required, ≤ 100), ตำแหน่งงาน (required,
  ≤ 100), รหัสหน่วยงาน (required, exactly 5 digits), ชื่อหน่วยงาน (required, ≤ 150),
  เบอร์ติดต่อ (required, 9–15 digits), อีเมล (optional, valid), เลข AnyDesk (optional,
  9–10 digits), รายละเอียดปัญหา (required, ≤ 2,000).
- **FR-009**: The generated message MUST follow the standard template exactly (line
  labels and order from Principle III); optional empty fields show "-".
- **FR-010**: Users MUST be able to copy the message in one action with confirmation.
- **FR-011**: "Remember on this device" MUST store reporter fields only in the browser and
  never send them to the server; the form itself MUST NOT submit data to the server.

**Admin**

- **FR-012**: Admin pages and actions MUST require sign-in; every action re-checks the
  role on the server.
- **FR-013**: Admins MUST be able to edit any topic; edits to built-in topics are stored
  as overrides and never alter the built-in source.
- **FR-014**: Admins MUST be able to hide/show any topic and restore a built-in topic to
  its original content (confirmation required).
- **FR-015**: Admins MUST be able to create custom topics and delete them only after two
  confirmations; built-in topics cannot be deleted.
- **FR-016**: Topic validation: title required ≤ 150; category one of 8; level one of 3;
  keywords ≤ 20 items, each ≤ 40; solution required ≤ 5,000; attachments ≤ 10, label
  ≤ 80, URL must start with `https://`.
- **FR-017**: Saves MUST be refused when the topic changed since it was loaded.
- **FR-018**: The admin list MUST show every topic with status (ต้นฉบับ / แก้ไขแล้ว /
  เพิ่มเอง, ซ่อน), category, level, last editor and time; filterable by category and
  status and searchable.

**Resilience, guide, UX**

- **FR-019**: If the content store fails, viewers MUST still get built-in topics and the
  report form, with a small notice.
- **FR-020**: A "วิธีใช้งาน" page MUST explain viewer use; an admin section is shown to
  signed-in admins.
- **FR-021**: The UI MUST be Thai, work from 360 px wide to desktop, be keyboard operable
  (`/` focuses search), and meet WCAG 2.1 AA.
- **FR-022**: Every data view MUST have consistent loading, empty, error, and success
  states.

### Key Entities

- **Category**: one of 8 fixed categories (id, Thai name, icon, order). Changing them
  requires a constitution amendment.
- **Topic**: title (symptom), category, level, keywords, solution (content format),
  attachments, origin (built-in / custom), hidden flag, version, updated time/by.
- **Topic override**: stored edits for a built-in topic; removing it restores the original.
- **Attachment**: kind (clip / manual / link), label, https URL.
- **Report message**: reporter fields + problem details → standard text (never stored on
  the server).
- **Admin user**: email, display name, role (owner / editor — same permissions in MVP).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user finds the right topic for a known problem in under 30 seconds on
  first use.
- **SC-002**: Search results update within 0.3 s of typing for 95% of keystrokes with 200
  topics.
- **SC-003**: 100% of report messages generated by the app contain all required fields
  in the standard format (enforced by validation + tests).
- **SC-004**: An admin can edit and publish a topic change in under 2 minutes.
- **SC-005**: 0 admin actions succeed without an admin session (automated tests).
- **SC-006**: Home page and report form remain usable with the store down (automated
  test).
- **SC-007**: All release checks (search, expand/collapse, report message, admin edit,
  mobile 360 px, no-DB mode, HTML escaping) pass as automated E2E tests.

## Assumptions

- Viewers are รพ.สต. staff on PCs or phones; no viewer accounts.
- Built-in topics ship with the app as draft seed content written from the constitution's
  high-case areas; the Call Center team MUST review and correct them against case reports
  before production (Principle II).
- Admin edits are live as soon as they are saved (saving = publishing to the main page).
- MVP attachments are https links (YouTube Unlisted, Google Drive, PDF URLs); direct file
  upload (≤ 20 MB) is a later feature.
- 👍/👎 feedback and statistics display are out of scope (constitution "known limitations").
- Admin accounts are provisioned by the system owner; no self sign-up.
