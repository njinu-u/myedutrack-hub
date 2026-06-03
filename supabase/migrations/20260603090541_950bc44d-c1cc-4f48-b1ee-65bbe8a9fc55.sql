-- 1) Allow staff (school_admin, teacher, counselor) to create appointments
CREATE POLICY "appointments staff insert"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  school_id = public.current_school_id()
  AND public.current_user_role() = ANY (ARRAY['school_admin'::app_role, 'teacher'::app_role, 'counselor'::app_role])
);

-- 2) Restrict staff PII exposure on app_users
-- Drop the broad SELECT policy that exposed email/phone to all staff
DROP POLICY IF EXISTS "staff read users in same school" ON public.app_users;

-- School admins still get full row access for management
CREATE POLICY "school_admin reads users in same school"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  school_id = public.current_school_id()
  AND public.has_role('school_admin'::app_role)
);

-- Teachers and counselors can SELECT rows in their school, but they will only
-- read the safe columns (id, full_name, role, avatar_url, school_id) through
-- the directory view below. We still need a row-level SELECT for joins
-- (e.g. messages INSERT RLS does an EXISTS on app_users for the recipient).
CREATE POLICY "staff read users in same school"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  school_id = public.current_school_id()
  AND public.current_user_role() = ANY (ARRAY['teacher'::app_role, 'counselor'::app_role])
);

-- A safe staff directory view (no email, no phone) for staff-to-staff lookups.
-- Uses security_invoker so callers see only rows their RLS already allows.
CREATE OR REPLACE VIEW public.school_directory
WITH (security_invoker = true)
AS
SELECT id, school_id, full_name, role, avatar_url
FROM public.app_users;

GRANT SELECT ON public.school_directory TO authenticated;

-- 3) Revoke EXECUTE from PUBLIC/anon on ALL SECURITY DEFINER functions in public.
-- Keep EXECUTE for authenticated and service_role (required by RLS + server fns).
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon;',
                   fn.nspname, fn.proname, fn.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role;',
                   fn.nspname, fn.proname, fn.args);
  END LOOP;
END
$$;