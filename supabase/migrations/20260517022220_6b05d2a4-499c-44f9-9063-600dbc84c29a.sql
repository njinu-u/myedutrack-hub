ALTER TABLE public.grades REPLICA IDENTITY FULL;
ALTER TABLE public.attendance REPLICA IDENTITY FULL;
ALTER TABLE public.mood_checkins REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.counselor_flags REPLICA IDENTITY FULL;
ALTER TABLE public.observations REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.grades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.counselor_flags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.observations;