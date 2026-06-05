CREATE POLICY "parents notify staff via message" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  school_id = public.current_school_id()
  AND type = 'message'
  AND public.can_send_message(auth.uid(), to_user_id)
);