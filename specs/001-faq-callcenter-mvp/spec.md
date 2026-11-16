# Feature Specification: BGS FAQ Callcenter MVP

**Feature Branch**: `001-faq-callcenter-mvp`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "BGS FAQ Callcenter MVP: A web app for hospital call-center agents to quickly search FAQs (Thai and English) while on a call and copy the answer with one click. Admins can create, edit, categorize, publish/unpublish FAQs. Login with two roles: agent (search/read/copy) and admin (manage FAQs). Includes a friendly, beautiful, keyboard-first UI and a built-in "How to use" guide page. Must have unit, integration, and E2E tests. Tech direction: Next.js + Supabase."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent finds and copies an answer during a call (Priority: P1)

A call-center agent is on the phone with a patient or relative who asks a question
(e.g., "What time does the outpatient clinic open?" / "คลินิกผู้ป่วยนอกเปิดกี่โมง").
The agent types a few words in Thai or English, sees matching FAQs right away,
opens the best match, and copies the answer with one click or one keystroke so
they can read it out or paste it into a chat/ticket.

**Why this priority**: This is the core value of the product. Without fast search
and copy, the app has no reason to exist.

**Independent Test**: Sign in as an agent, type "parking" or "จอดรถ", open the top
result, press the copy action, and check the clipboard holds the exact answer text.

**Acceptance Scenarios**:

1. **Given** published FAQs exist, **When** the agent types a Thai or English keyword
   that appears in a question, answer, or tag, **Then** matching published FAQs are
   listed, most relevant first, with the matched words highlighted.
2. **Given** a result list is shown, **When** the agent uses the arrow keys and presses
   Enter, **Then** the selected FAQ's full answer is shown without leaving the search
   screen.
3. **Given** an FAQ answer is shown, **When** the agent clicks "Copy" or presses the
   copy shortcut, **Then** the answer text is on the clipboard and a short "Copied"
   confirmation appears.
4. **Given** the agent opens the search screen, **When** they press `/` from anywhere,
   **Then** focus moves to the search box.
5. **Given** the agent selects a category filter, **When** results are listed, **Then**
   only FAQs in that category are shown.
6. **Given** an FAQ is unpublished, **When** an agent searches, **Then** it never
   appears in results.
7. **Given** no FAQ matches, **When** the agent searches, **Then** a friendly empty
   state suggests trying other words or clearing the category filter.

---

### User Story 2 - Admin manages FAQ content (Priority: P2)

An admin (content owner or supervisor) creates new FAQs, edits wording, assigns a
category and tags, and publishes or unpublishes FAQs so agents always see current,
approved answers.

**Why this priority**: Content must be maintainable for the tool to stay accurate,
but agents can get value from seeded content before admin screens exist.

**Independent Test**: Sign in as an admin, create an FAQ in the "Appointments"
category, publish it, sign in as an agent, and find it via search; then unpublish
it and confirm it disappears from agent search.

**Acceptance Scenarios**:

1. **Given** an admin is signed in, **When** they fill in question, answer, language,
   category, and optional tags and save, **Then** the FAQ is stored as a draft
   (unpublished) and appears in the admin list.
2. **Given** a draft FAQ, **When** the admin publishes it, **Then** it becomes
   searchable by agents straight away.
3. **Given** a published FAQ, **When** the admin edits and saves it, **Then** agents
   see the updated text on their next search, and the "last updated" time and editor
   are recorded.
4. **Given** a published FAQ, **When** the admin unpublishes it, **Then** agents can no
   longer find it.
5. **Given** a required field is empty or too long, **When** the admin saves, **Then**
   the form shows a clear message next to the field and keeps everything typed.
6. **Given** an admin deletes an FAQ, **When** they confirm the dialog, **Then** the
   FAQ is removed; cancelling leaves it unchanged.
7. **Given** an admin is on the categories screen, **When** they add or rename a
   category, **Then** it is available in the FAQ form and agent filter. A category that
   still has FAQs cannot be deleted.

---

### User Story 3 - Secure sign-in with role-based access (Priority: P3)

Staff sign in with their own account. Agents can only search, read, and copy.
Admins can do everything agents can, plus manage content.

**Why this priority**: Needed before real production use, but stories 1–2 can be
shown and tested with seeded accounts first.

**Independent Test**: Try to open the admin screen as an agent (blocked), as a
signed-out visitor (sent to sign-in), and as an admin (allowed).

**Acceptance Scenarios**:

1. **Given** a signed-out visitor, **When** they open any app page, **Then** they are
   sent to the sign-in page, and after signing in they return to where they were going.
2. **Given** wrong credentials, **When** a user signs in, **Then** a generic
   "email or password is incorrect" message is shown (no hint which part was wrong).
3. **Given** a signed-in agent, **When** they open an admin page or call an admin
   action, **Then** access is refused and nothing changes.
4. **Given** a signed-in user, **When** they sign out, **Then** their session ends and
   protected pages are no longer reachable.

---

### User Story 4 - Built-in "How to use" guide (Priority: P4)

A new agent or admin opens the "How to use" page and learns, in Thai and English,
how to search, filter, copy answers, use keyboard shortcuts, and (for admins) how to
manage FAQs.

**Why this priority**: Improves onboarding and lowers training effort, but the app
is usable without it.

**Independent Test**: Open the guide from the main navigation and press `?` on the
search screen; both show the guide / shortcut list.

**Acceptance Scenarios**:

1. **Given** any signed-in user, **When** they choose "How to use" in the navigation,
   **Then** a guide page with step-by-step sections and a keyboard shortcut table is
   shown.
2. **Given** the agent is on the search screen, **When** they press `?`, **Then** a
   shortcut help panel opens and `Esc` closes it.
3. **Given** a user is an agent, **When** they view the guide, **Then** the admin
   section is hidden; admins see it.

---

### User Story 5 - Thai / English interface (Priority: P5)

Users can switch the interface language between Thai and English. Their choice is
remembered on that device.

**Why this priority**: Staff are mostly Thai speakers; English supports
international staff. FAQ content itself is already bilingual-searchable via Story 1.

**Independent Test**: Switch to English, reload, and check that labels stay in
English.

**Acceptance Scenarios**:

1. **Given** the interface is in Thai, **When** the user switches to English, **Then**
   all navigation, labels, buttons, and messages show in English.
2. **Given** the user chose a language, **When** they return later on the same device,
   **Then** the same language is used.

---

### Edge Cases

- Search text with only spaces or symbols → treated as empty; show all published FAQs
  for the selected category (or a prompt to start typing).
- Very long search text (over 200 characters) → trimmed to 200 characters.
- Mixed Thai/English text, upper/lower case, and extra spaces → matching ignores case
  and repeated spaces.
- Thai text has no spaces between words → matching uses substring search, so partial
  Thai words still match.
- Clipboard blocked by the browser → show a message and select the answer text so the
  agent can copy it by hand.
- Two admins edit the same FAQ at once → the later save is refused with a "this FAQ
  was changed by someone else, reload to see the latest" message (no silent overwrite).
- Session expires mid-use → the next action sends the user to sign-in and back again.
- Data store unreachable → a friendly error state with a "Try again" action; nothing
  half-saved.
- Deleting a category that still has FAQs → refused with an explanation.

## Requirements *(mandatory)*

### Functional Requirements

**Search & read (agents and admins)**

- **FR-001**: System MUST let signed-in users search published FAQs by keyword across
  question, answer, and tags, in Thai and English, ignoring case and extra spaces.
- **FR-002**: System MUST rank results so matches in the question come before matches
  in tags, which come before matches in the answer; ties are broken by most recently
  updated.
- **FR-003**: System MUST let users filter results by one category.
- **FR-004**: System MUST highlight matched words in result titles and snippets.
- **FR-005**: System MUST update results as the user types, without pressing a
  search button.
- **FR-006**: System MUST show the full answer of a selected FAQ alongside the result
  list.
- **FR-007**: System MUST let users copy an answer to the clipboard with one click or
  one keyboard shortcut, and confirm the copy visually.
- **FR-008**: System MUST support keyboard-only use of the search screen: `/` to focus
  search, arrow keys to move, Enter to open, `c` to copy the open answer, `Esc` to clear,
  `?` for shortcut help.
- **FR-009**: System MUST never show unpublished FAQs to agents.

**Content management (admins only)**

- **FR-010**: Admins MUST be able to create an FAQ with: question (required, max 300
  characters), answer (required, max 5,000 characters), language (Thai or English),
  category (required), and up to 10 tags (each max 30 characters).
- **FR-011**: New FAQs MUST start as unpublished drafts.
- **FR-012**: Admins MUST be able to edit, publish, unpublish, and delete FAQs; delete
  requires confirmation.
- **FR-013**: System MUST record created time, last updated time, and last editor for
  each FAQ.
- **FR-014**: System MUST refuse a save that would overwrite a newer version of the
  same FAQ (conflict detection).
- **FR-015**: Admins MUST be able to create and rename categories (name required, max
  60 characters, unique, case-insensitive) and delete only empty categories.
- **FR-016**: Admins MUST see a list of all FAQs (published and drafts) with status,
  category, and last updated, filterable by status and category and searchable by text.

**Access control**

- **FR-017**: System MUST require sign-in with email and password for every page except
  the sign-in page.
- **FR-018**: System MUST support two roles: agent (search/read/copy) and admin (all
  agent abilities plus content management).
- **FR-019**: System MUST enforce role checks on the server for every admin action,
  not only by hiding buttons.
- **FR-020**: System MUST show a generic message on failed sign-in and allow sign-out.

**Guide, language & UX**

- **FR-021**: System MUST provide a "How to use" page with agent and admin sections and
  a keyboard shortcut table; the admin section is visible to admins only.
- **FR-022**: System MUST provide Thai and English interface text and remember the
  user's choice on that device; Thai is the default.
- **FR-023**: System MUST show consistent loading, empty, error, and success states on
  every data view.
- **FR-024**: System MUST be usable by keyboard alone and meet WCAG 2.1 AA contrast and
  focus visibility.
- **FR-025**: System MUST work on desktop browsers at widths from 1024 px up, and remain
  usable (single column) down to 375 px.

### Key Entities

- **FAQ**: A question and its approved answer. Attributes: question, answer, language
  (th/en), category, tags, status (draft/published), created time, updated time,
  last editor, version (for conflict detection).
- **Category**: A named group of FAQs (e.g., Appointments, Billing, Parking, Visiting
  hours). Attributes: name, display order. One category has many FAQs; each FAQ has
  exactly one category.
- **User**: A staff member who can sign in. Attributes: email, display name, role
  (agent/admin).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An agent can go from an empty search screen to an answer copied to the
  clipboard in under 10 seconds for a known question, using the keyboard only.
- **SC-002**: Search results appear within 0.5 seconds of the agent stopping typing for
  95% of searches with a library of 1,000 FAQs.
- **SC-003**: 90% of first-time agents complete the "find and copy an answer" task
  without help after reading the "How to use" page.
- **SC-004**: An admin can create and publish a new FAQ in under 2 minutes.
- **SC-005**: 0 unpublished FAQs are ever visible to agents (verified by automated
  tests).
- **SC-006**: 100% of admin actions attempted by agents are refused (verified by
  automated tests).
- **SC-007**: Every primary journey (agent search & copy, admin create/publish/edit/
  unpublish, sign-in/out, guide) is covered by an automated end-to-end test that passes.

## Assumptions

- Users are internal hospital staff on desktop workstations with modern browsers
  (latest Chrome/Edge) and a stable network.
- Staff accounts are created by an administrator; self sign-up and password reset by
  email are out of scope for the MVP (accounts are seeded/managed by the system owner).
- FAQ content is general information (opening hours, directions, billing process,
  appointment procedures). No patient-specific or medical record data is stored, so no
  patient-data compliance scope applies to the MVP.
- Each FAQ is written in one language; a bilingual answer is stored as two FAQs (one
  per language). Search covers both languages at once.
- The expected library size is up to ~1,000 FAQs and up to ~100 concurrent staff.
- The MVP ships with seeded demo content and demo accounts (one agent, one admin) so it
  can be run and evaluated immediately; production deployment uses the hospital's
  managed data and auth service.
- Analytics on search usage, answer ratings, and version history beyond "last updated"
  are out of scope for the MVP.
