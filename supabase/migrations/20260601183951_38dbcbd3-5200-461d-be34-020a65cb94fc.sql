
-- 1) Remove sensitive tables from Realtime publication (until channel-level auth is configured)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'counselor_flags'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.counselor_flags';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mood_checkins'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.mood_checkins';
  END IF;
END $$;

-- 2) Tighten notifications SELECT to include school_id scope
DROP POLICY IF EXISTS "notifications read own" ON public.notifications;
CREATE POLICY "notifications read own"
ON public.notifications
FOR SELECT
TO authenticated
USING (to_user_id = auth.uid() AND school_id = public.current_school_id());
