
-- Remove the broad parents policy on app_users so parents cannot select email/phone directly
DROP POLICY IF EXISTS "parents read staff directory rows" ON public.app_users;

-- Replace the view with a security-definer view scoped by caller's school
DROP VIEW IF EXISTS public.school_staff_directory;

CREATE VIEW public.school_staff_directory
WITH (security_invoker = false) AS
SELECT u.id, u.full_name, u.role, u.school_id, u.avatar_url
FROM public.app_users u
WHERE u.role IN ('school_admin','teacher','counselor')
  AND u.school_id = public.current_school_id();

GRANT SELECT ON public.school_staff_directory TO authenticated;
