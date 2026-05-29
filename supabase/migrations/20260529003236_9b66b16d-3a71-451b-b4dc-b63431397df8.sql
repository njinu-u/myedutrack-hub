
DROP VIEW IF EXISTS public.school_staff_directory;

CREATE OR REPLACE FUNCTION public.list_school_staff()
RETURNS TABLE (id uuid, full_name text, role app_role, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.full_name, u.role, u.avatar_url
  FROM public.app_users u
  WHERE u.school_id = public.current_school_id()
    AND u.role IN ('school_admin','teacher','counselor')
    AND u.id <> auth.uid();
$$;

REVOKE ALL ON FUNCTION public.list_school_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_school_staff() TO authenticated;
