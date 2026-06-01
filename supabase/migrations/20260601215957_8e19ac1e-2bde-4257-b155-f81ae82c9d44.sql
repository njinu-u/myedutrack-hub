
-- 1. security_events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  actor_user_id uuid,
  actor_email text,
  school_id uuid,
  target_user_id uuid,
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_actor ON public.security_events(actor_user_id);

GRANT SELECT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only super_admin (website owner) can read security events
CREATE POLICY "super_admin reads security events"
ON public.security_events FOR SELECT
TO authenticated
USING (public.has_role('super_admin'::app_role));

-- 2. Owner-bypass policies so the website owner can audit across schools
CREATE POLICY "super_admin reads all schools"
ON public.schools FOR SELECT
TO authenticated
USING (public.has_role('super_admin'::app_role));

CREATE POLICY "super_admin reads all app_users"
ON public.app_users FOR SELECT
TO authenticated
USING (public.has_role('super_admin'::app_role));

-- 3. log_security_event helper (SECURITY DEFINER so server fns can call w/o policy)
CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type text,
  _severity text,
  _message text,
  _details jsonb DEFAULT '{}'::jsonb,
  _target_user_id uuid DEFAULT NULL,
  _school_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  _actor uuid;
  _actor_email text;
  _school uuid;
BEGIN
  _actor := auth.uid();
  IF _actor IS NOT NULL THEN
    SELECT email, school_id INTO _actor_email, _school
      FROM public.app_users WHERE id = _actor;
  END IF;
  INSERT INTO public.security_events (
    event_type, severity, actor_user_id, actor_email,
    school_id, target_user_id, message, details
  ) VALUES (
    _event_type,
    COALESCE(_severity, 'info'),
    _actor,
    _actor_email,
    COALESCE(_school_id, _school),
    _target_user_id,
    _message,
    COALESCE(_details, '{}'::jsonb)
  )
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_security_event(text,text,text,jsonb,uuid,uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.log_security_event(text,text,text,jsonb,uuid,uuid) TO authenticated, service_role;

-- 4. Trigger: log every role change on app_users (privilege escalation audit)
CREATE OR REPLACE FUNCTION public.audit_app_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO public.security_events (
      event_type, severity, actor_user_id, target_user_id, school_id, message, details
    ) VALUES (
      'role_change',
      CASE WHEN NEW.role IN ('school_admin','super_admin') THEN 'high' ELSE 'medium' END,
      auth.uid(),
      NEW.id,
      NEW.school_id,
      format('Role changed from %s to %s', OLD.role, NEW.role),
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role, 'email', NEW.email)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_app_user_role_change ON public.app_users;
CREATE TRIGGER trg_audit_app_user_role_change
AFTER UPDATE OF role ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.audit_app_user_role_change();

-- 5. Auto-promote gamingtom148@gmail.com to super_admin (website owner)
CREATE OR REPLACE FUNCTION public.enforce_website_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'gamingtom148@gmail.com' THEN
    IF NEW.role IS DISTINCT FROM 'super_admin'::app_role THEN
      NEW.role := 'super_admin'::app_role;
      INSERT INTO public.security_events (
        event_type, severity, target_user_id, message, details
      ) VALUES (
        'owner_promotion', 'high', NEW.id,
        'Website owner account auto-promoted to super_admin',
        jsonb_build_object('email', NEW.email)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_website_owner_ins ON public.app_users;
CREATE TRIGGER trg_enforce_website_owner_ins
BEFORE INSERT ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.enforce_website_owner();

DROP TRIGGER IF EXISTS trg_enforce_website_owner_upd ON public.app_users;
CREATE TRIGGER trg_enforce_website_owner_upd
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.enforce_website_owner();

-- 6. Backfill any existing row for the owner email
UPDATE public.app_users
SET role = 'super_admin'::app_role
WHERE lower(email) = 'gamingtom148@gmail.com'
  AND role IS DISTINCT FROM 'super_admin'::app_role;
