-- Revoke EXECUTE from anon and PUBLIC on SECURITY DEFINER helpers.
-- Authenticated and service_role keep access (needed by RLS policies and server fns).
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
      AND p.proname IN (
        'current_school_id',
        'current_user_role',
        'current_linked_student_id',
        'has_role',
        'log_security_event',
        'list_school_staff',
        'audit_app_user_role_change',
        'enforce_website_owner'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon;',
                   fn.nspname, fn.proname, fn.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role;',
                   fn.nspname, fn.proname, fn.args);
  END LOOP;
END
$$;