
-- 1. app_users: restrict email visibility. Replace overly-broad SELECT policy.
DROP POLICY IF EXISTS "read users in same school" ON public.app_users;

CREATE POLICY "read own row"
ON public.app_users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "staff read users in same school"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  school_id = public.current_school_id()
  AND public.current_user_role() = ANY (ARRAY['school_admin'::app_role, 'teacher'::app_role, 'counselor'::app_role])
);

-- 2. app_users: prevent privilege escalation via self-update. Add WITH CHECK.
DROP POLICY IF EXISTS "user updates self" ON public.app_users;

CREATE POLICY "user updates self"
ON public.app_users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = public.current_user_role()
  AND school_id IS NOT DISTINCT FROM public.current_school_id()
  AND linked_student_id IS NOT DISTINCT FROM public.current_linked_student_id()
);

-- 3. notifications: only staff roles can insert notifications targeted at others.
DROP POLICY IF EXISTS "notifications insert in school" ON public.notifications;

CREATE POLICY "staff insert notifications in school"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  school_id = public.current_school_id()
  AND public.current_user_role() = ANY (ARRAY['school_admin'::app_role, 'teacher'::app_role, 'counselor'::app_role])
);
