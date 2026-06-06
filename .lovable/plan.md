# Implementation Plan

This is a large, cross-cutting set of changes. Below is the proposed scope, broken into five workstreams. Please review and approve (or trim) before I build.

---

## 1. Universal File Import + Column Mapping

**Goal:** Replace the CSV-only importer with a generic importer used everywhere (students today; later: users, grades, timetables, etc.).

- New shared component `src/components/universal-importer.tsx` with three steps:
  1. **Upload** — accepts `.csv, .xlsx, .xls, .json, .txt, .tsv` (any structured file). Parses via:
     - `papaparse` for CSV/TSV/TXT
     - `xlsx` (SheetJS) for XLSX/XLS — new dep
     - `JSON.parse` for JSON arrays
  2. **Map columns** — list detected source columns, each with a dropdown to map to a known system field (e.g. for students: `full_name`, `grade`, `class_id`, `photo_url`). Unmapped columns are kept as custom fields.
  3. **Preview & confirm** — render first 5 rows using the mapping; show count and "Confirm import".
- Custom fields stored as JSONB. Requires a migration adding `custom_fields jsonb default '{}'::jsonb` to `students` (and we'll add the same to other targets as we wire them).
- Replace the existing CSV dialog in `admin.students.tsx` with the new component. Wire `bulkCreateStudents` server fn to accept `custom_fields`.

**Note:** I'll ship the students flow end-to-end now, plus the reusable component. Other import surfaces (users/grades/timetables) get switched to the same component in a follow-up so this PR stays reviewable.

---

## 2. Admin — Custom Grade / Class / Subject Taxonomy

**Goal:** Admin defines the vocabulary used across the whole school.

- New table `school_taxonomy` (one row per school):
  - `grades text[]` — e.g. `['Grade 1','Grade 2',...]`
  - `class_style text` — `alphabet | colors | numbers | custom`
  - `class_sections jsonb` — per-grade section labels (auto-generated from style or custom-entered)
  - `subjects text[]`
- RLS: any school member can read; only `school_admin` can write.
- New page `src/routes/admin.taxonomy.tsx` (linked from Settings) with three sections (grades / classes / subjects), each with add/edit/remove.
- On first admin login: if `school_taxonomy` row is missing, redirect to `/admin/taxonomy` with an onboarding banner.
- Shared hook `useSchoolTaxonomy()` returning `{ grades, classes, subjects }`. Teacher/counselor/student dropdowns and labels read from this instead of hardcoded values.

---

## 3. Teacher — "My Classes & Subjects"

- New table `teacher_assignments (user_id, class_label, subject)` with unique constraint and RLS (teacher manages own rows; admin can read).
- Setup step on `/teacher` if no rows exist → redirect to `/teacher/setup`.
- Also editable from `/profile`.
- Filter teacher dashboard / attendance / gradebook queries to the teacher's selected classes & subjects.

## 4. Counselor — "My Assigned Classes"

- Same pattern: `counselor_assignments (user_id, class_label)`.
- Setup step on `/counselor` first visit; editable from profile.
- Counselor's student roster and session log filtered to assigned classes.

---

## 5. Self-Service Account Deletion

- Server fn `deleteOwnAccount` in `src/lib/account.functions.ts`:
  - Uses `supabaseAdmin` (in handler) to delete the auth user after verifying `auth.uid()`.
  - Cascades: deletes `app_users`, `teacher_assignments`, `counselor_assignments`, `mood_checkins` for that user, etc. (FK ON DELETE CASCADE where possible; explicit deletes otherwise).
- "Delete account" section added to `src/routes/profile.tsx` for all roles, with confirmation modal.
- Admin already has user management — extend `admin.staff.tsx` / users panel with the same delete action (admin-side server fn `deleteUserAsAdmin`, restricted to same school + `school_admin` role).
- After self-deletion: sign out + redirect to `/`.

---

## Technical Summary

**New deps:** `xlsx`
**New tables:** `school_taxonomy`, `teacher_assignments`, `counselor_assignments`
**Migrations:** add `custom_fields jsonb` to `students`; create the three new tables with grants + RLS; add `ON DELETE CASCADE` where missing for user-owned rows.
**New files:** `universal-importer.tsx`, `admin.taxonomy.tsx`, `teacher.setup.tsx`, `counselor.setup.tsx`, `account.functions.ts`, `taxonomy.functions.ts`, `assignments.functions.ts`, `use-school-taxonomy.ts`
**Edited:** `admin.students.tsx`, `admin.tsx` (nav), `teacher.tsx`, `counselor.tsx`, `profile.tsx`, `students.functions.ts`, `admin.staff.tsx`

---

## Questions before I build

1. **Scope of "everywhere import exists":** Today only students has an import flow. Want me to also add importers for **staff/users** and **grades** in this PR, or just wire the reusable component and migrate students now (others later)?
2. **Custom fields display:** Should imported custom fields be **visible in the student detail page** (extra section), or just stored quietly for export/reporting?
3. **Account deletion hard vs soft:** Hard delete (row gone, unrecoverable) or soft delete (mark `deleted_at`, hide from UI, purge after 30 days)?

Reply with answers (or "go ahead with defaults: students-only for now, custom fields shown on detail page, hard delete") and I'll implement.
