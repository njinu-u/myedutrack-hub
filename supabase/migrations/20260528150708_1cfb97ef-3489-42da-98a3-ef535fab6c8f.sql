CREATE OR REPLACE FUNCTION public.can_send_message(_to_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_users sender
    JOIN public.app_users recipient ON recipient.id = _to_user_id
    WHERE sender.id = auth.uid()
      AND sender.school_id IS NOT NULL
      AND recipient.school_id = sender.school_id
      AND sender.id <> recipient.id
      AND (
        sender.role IN ('school_admin'::app_role, 'teacher'::app_role, 'counselor'::app_role)
        OR (
          sender.role = 'parent'::app_role
          AND recipient.role IN ('school_admin'::app_role, 'teacher'::app_role, 'counselor'::app_role)
        )
      )
  )
$$;

DROP POLICY IF EXISTS "parents read staff contacts" ON public.app_users;
CREATE POLICY "parents read staff contacts"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  school_id = public.current_school_id()
  AND public.current_user_role() = 'parent'::app_role
  AND role IN ('school_admin'::app_role, 'teacher'::app_role, 'counselor'::app_role)
);

DROP POLICY IF EXISTS "messages insert" ON public.messages;
DROP POLICY IF EXISTS "messages insert same school allowed roles" ON public.messages;
CREATE POLICY "messages insert same school allowed roles"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  school_id = public.current_school_id()
  AND from_user_id = auth.uid()
  AND public.can_send_message(to_user_id)
);

DROP POLICY IF EXISTS "messages read" ON public.messages;
DROP POLICY IF EXISTS "messages read own school thread" ON public.messages;
CREATE POLICY "messages read own school thread"
ON public.messages
FOR SELECT
TO authenticated
USING (
  school_id = public.current_school_id()
  AND (from_user_id = auth.uid() OR to_user_id = auth.uid())
);

DROP POLICY IF EXISTS "messages update read_at" ON public.messages;
DROP POLICY IF EXISTS "messages update own read receipt" ON public.messages;
CREATE POLICY "messages update own read receipt"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  school_id = public.current_school_id()
  AND to_user_id = auth.uid()
)
WITH CHECK (
  school_id = public.current_school_id()
  AND to_user_id = auth.uid()
);

REVOKE UPDATE ON public.messages FROM authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;