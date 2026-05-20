# Plan: School-based auth + Gmail invites + de-placeholder all portals

The full request is large (three independent feature tracks). To ship reliably, I'll do it in **three sequenced phases**. Each phase is shippable on its own.

---

## Phase 1 — School-based invitation auth (the foundation)

Everything else depends on this. Today the project already has an `invitations` flow with codes and a `/join/$code` page, but the spec asks for a parallel token-link flow (`/accept-invite?token=...`), Gmail-compose sending, and per-role admin invite forms inside the existing portal screens.

**Database**
- Add columns to `school_invitations`: `name text`, `status text default 'pending'`, `token uuid default gen_random_uuid() unique`. Keep the existing `code` for the current `/join/$code` path so we don't break anything.
- Index on `token`.

**Server functions** (in `src/lib/invitations.functions.ts`)
- Extend `createInvitation` to accept `name`, optional `student_id` (for parents), and return `{ token, invite_url }`.
- Add `lookupInvitationByToken({ token })` — public, returns role/name/school_name/email/expired/used.
- Add `redeemInvitationByToken({ token, password })` — creates auth user + `app_users` row + marks `status='accepted'`. Email comes from the invitation row (not user-entered) so the link is single-purpose.
- Add `resendInvitation({ id })` and `cancelInvitation({ id })` (admin only).

**Routes**
- New `src/routes/accept-invite.tsx` (token-based welcome → set password → redirect to correct portal).
- Keep existing `src/routes/join.$code.tsx` as-is (back-compat).
- Update `src/routes/login.tsx` to redirect to correct portal by role (already mostly there).

**Admin UI** (no visual redesign — extend existing pages)
- `admin.staff.tsx`: replace `ModulePage` with a real staff list + "Invite Teacher" / "Invite Counselor" buttons that open a modal with name/email/(subject) → calls `createInvitation` → opens Gmail compose in new tab → shows pending badge.
- `admin.students.tsx`: existing "Add Student" modal gets optional `parent_email` and `student_email` fields → on submit also creates parent/student invitations and opens Gmail compose for each.
- `admin.invitations.tsx`: extend existing page with Resend / Cancel actions, status badges, and the role-specific quick-invite forms.

**Lock down self-signup**
- `signup.tsx` stays as the admin-only signup (already is).
- No public role-based signup exists, so nothing to remove.

---

## Phase 2 — Gmail-compose sending (layered on Phase 1)

A small shared helper `src/lib/gmail-compose.ts` with:
- `buildInviteEmail(role, { name, school_name, admin_name, student_name, invite_url })` → `{ subject, body }` using the exact templates from the spec.
- `openGmailCompose({ to, subject, body })` → builds `https://mail.google.com/mail/?view=cm&fs=1&to=...&su=...&body=...` (fully URL-encoded) and `window.open(url, "_blank", "noopener")`.
- `copyInviteLink(url)` → clipboard + toast.

Wired into every "Send Invitation" / "Resend invite" button. Admin's `full_name` and `school.name` are read from the existing auth context.

---

## Phase 3 — Replace ModulePage placeholders with real features

14 placeholder pages remain. I'll convert them in priority order, using the existing Supabase schema where possible and adding tables only where strictly required. **I will not add tables/edge functions speculatively** — each conversion will reuse existing tables when the data already fits.

**Reusing existing tables (no schema changes):**
- `teacher.classes` → list of `students` grouped by `class_id`/`grade`.
- `teacher.assessments` → `grades` filtered by entered_by/term.
- `teacher.reports` → aggregate of `grades`/`attendance`/`observations` per student with CSV/PDF export.
- `counselor.students` → list of `students` with mood/flag summaries.
- `counselor.sessions` → use `appointments` rows where the counselor is `teacher_user_id` (or extend `appointments` with a `kind` column — small migration).
- `counselor.interventions` → `counselor_flags` with status filter + resolve action.
- `student.reports` → same aggregate as teacher.reports but scoped to the linked student.
- `parent.resources` → static curated resource list from a new tiny `resources` table seeded with school-agnostic links.
- `admin.attendance` → school-wide rollup of `attendance` with date range.
- `admin.assessments` → school-wide rollup of `grades`.
- `admin.communication` → school-wide message volume from `messages` + broadcast composer (insert one `messages` row per recipient).
- `admin.curriculum` → small new `curriculum_units` table (school_id, subject, unit, term, notes).
- `admin.settings` → school profile edit form (name, country) writing to `schools`.

Each converted page gets: loading state, empty state with guidance, success/error toasts, and respects the existing visual design.

---

## What I need from you

The plan is long enough that I want to **ship it in three turns**, in this order: Phase 1 → Phase 2 → Phase 3. After you approve, I'll start with Phase 1 (auth/invitations end-to-end) in this turn, then ping you to continue.

If you'd rather I prioritise differently (e.g. start with Phase 3 placeholder cleanup instead), say so and I'll re-order.
