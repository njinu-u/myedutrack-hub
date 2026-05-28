DROP POLICY IF EXISTS "messages insert same school allowed roles" ON public.messages;
CREATE POLICY "messages insert same school allowed roles"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  school_id = public.current_school_id()
  AND from_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.app_users sender
    JOIN public.app_users recipient ON recipient.id = messages.to_user_id
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
);

DROP FUNCTION IF EXISTS public.can_send_message(uuid);
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;