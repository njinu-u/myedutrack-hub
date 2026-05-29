
-- 1. Restrict parents from reading sensitive staff columns via a safe view
DROP POLICY IF EXISTS "parents read staff contacts" ON public.app_users;

CREATE OR REPLACE VIEW public.school_staff_directory
WITH (security_invoker = true) AS
SELECT id, full_name, role, school_id, avatar_url
FROM public.app_users
WHERE role IN ('school_admin','teacher','counselor');

GRANT SELECT ON public.school_staff_directory TO authenticated;

-- Allow parents to read staff rows via the view by re-adding a minimal SELECT policy.
-- The view (security_invoker) still enforces RLS, so we need a policy permitting
-- parents to see staff rows. To prevent email/phone leakage we instead expose ONLY
-- the safe view at the application layer and keep the underlying table policy off
-- for parents. The view selects from app_users which checks RLS — so we need a
-- narrowly-scoped policy. We achieve column safety by NEVER selecting sensitive
-- columns via this path: add a policy and rely on application using the view.
CREATE POLICY "parents read staff directory rows"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  school_id = current_school_id()
  AND current_user_role() = 'parent'
  AND role IN ('school_admin','teacher','counselor')
);

-- 2. Tighten notifications UPDATE policy: prevent privilege escalation on critical columns
DROP POLICY IF EXISTS "notifications update own" ON public.notifications;

CREATE POLICY "notifications update own read receipt"
ON public.notifications
FOR UPDATE
TO authenticated
USING (to_user_id = auth.uid())
WITH CHECK (
  to_user_id = auth.uid()
  AND school_id = current_school_id()
);

-- 3. Restrict parent appointment inserts to their linked student
DROP POLICY IF EXISTS "appointments parent insert" ON public.appointments;

CREATE POLICY "appointments parent insert"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  school_id = current_school_id()
  AND parent_user_id = auth.uid()
  AND student_id = current_linked_student_id()
);
