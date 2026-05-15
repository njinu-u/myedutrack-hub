## Phase 1 Scope

Real backend foundation. **No** real-time subscriptions, **no** Paddle, **no** super-admin yet — those land in Phase 2 / 3.

### 1. Enable Lovable Cloud
Spin up Supabase backend.

### 2. Database schema (multi-tenant from day one)
- `schools` — id, name, admin_email, country, student_count, plan (`free_trial`|`school`|`district`), status (`trial`|`active`|`expired`|`cancelled`), trial_expires_at, paddle_customer_id, paddle_transaction_id, activated_at
- `app_users` — id (= auth.users.id), school_id (FK), email, role (`super_admin`|`school_admin`|`teacher`|`counselor`|`parent`|`student`), full_name, linked_student_id
- `students` — id, school_id, full_name, grade, class_id, photo_url
- `grades`, `attendance`, `mood_checkins`, `counselor_flags`, `messages` (+ `language_code`), `appointments`, `notifications`, `observations` (+ `tags text[]`, `ai_suggestions text`)
- `school_invitations` — code, school_id, role, expires_at (for teachers/students/parents joining)

RLS on every table. `has_role()` SECURITY DEFINER + `current_school_id()` helpers. All policies scope by `school_id` of the requesting user.

### 3. Auth & role routing
- New `/signup` page → School Admin only. Creates `schools` row with `plan: free_trial`, `trial_expires_at: now() + 90 days`. Teachers/students/parents NEVER signup directly — they use invitation codes from their admin.
- `/login` → email+password. After login, query `app_users.role` → redirect to `/admin` (school_admin), `/teacher`, `/counselor`, `/parent`, `/student`.
- `_authenticated` layout route guard. Wrong-portal access redirects to correct one.
- Trial-expired check: if school status is `expired`, only school_admin can access; everyone else sees a friendly "subscription expired, contact your administrator" page.
- `/demo` keeps the existing local-mock role-switcher untouched (per your answer).

### 4. Replace mock data in REAL portals only
Each portal page detects: demo mode (localStorage role flag, no auth) → keep current mock data. Authenticated mode → query Supabase, show skeletons while loading, empty states ("No grades yet", "No messages yet") when empty.

### 5. Fix clickable affordances
Audit timetable, "auto generate", "live view", and similar buttons across all portals. Wire them to either real handlers (open modal, toast confirmation) or at minimum a working modal stub. No inert buttons.

### 6. Teacher Observations module
Replace the current placeholder `/teacher/observations`:
- Form: select student, subject, note (textarea), tags (multi-select chips: Academic, Social, Behavioral, Emotional, Physical, Language)
- Save → insert into `observations` table
- AI next-step suggestions: server function calls Lovable AI Gateway (`google/gemini-2.5-flash`) with the student's recent grades + observations + mood, returns 2–3 actionable next steps. Stored in `ai_suggestions` column.
- Timeline view per student.

### 7. Service worker (full PWA)
- `vite-plugin-pwa` with `registerType: autoUpdate`
- `devOptions.enabled: false`
- Iframe + preview-host guard in `src/start.tsx` so SW never registers in Lovable preview
- `NetworkFirst` for HTML, `CacheFirst` for static assets
- Kill-switch SW left at `/sw.js` for safety
- Warn user: offline only works on the published site, not preview.

### Deferred to Phase 2 (separate prompt)
- Real-time subscriptions (grades, attendance, mood, messages, appointments, notifications) + notification bell with live unread count
- Real-time messaging UI wiring
- Appointment confirm/decline flow

### Deferred to Phase 3 (separate prompt)
- Paddle billing (live keys, checkout overlay, webhook, onboarding page)
- Pricing section rebuild on landing page
- Super-admin dashboard at `/superadmin`

### Technical notes
- All Supabase access via `createServerFn` + `requireSupabaseAuth` middleware (TanStack Start pattern). No direct browser queries for protected data.
- AI calls via `LOVABLE_API_KEY` (auto-provisioned with Cloud).
- Demo route paths and the existing `useAuth`/local role context stay intact for `/demo`.

### What stays untouched
Visual design, colors, fonts, layouts, animations, AI Co-pilot banner, "Switch role" button, all existing portal sub-page UIs.

---

Approve and I'll start with enabling Lovable Cloud + schema migration.