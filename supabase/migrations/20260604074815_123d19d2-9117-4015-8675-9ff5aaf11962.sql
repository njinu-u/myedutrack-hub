
CREATE OR REPLACE FUNCTION public.can_send_message(_sender uuid, _recipient uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_users sender
    JOIN public.app_users recipient ON recipient.id = _recipient
    WHERE sender.id = _sender
      AND sender.id <> recipient.id
      AND sender.school_id IS NOT NULL
      AND recipient.school_id = sender.school_id
      AND (
        sender.role IN ('school_admin','teacher','counselor')
        OR (sender.role = 'parent' AND recipient.role IN ('school_admin','teacher','counselor'))
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "messages insert same school allowed roles" ON public.messages;

CREATE POLICY "messages insert same school allowed roles"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  school_id = public.current_school_id()
  AND from_user_id = auth.uid()
  AND public.can_send_message(auth.uid(), to_user_id)
);
