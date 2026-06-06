
-- 1. Custom fields on students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. School taxonomy
CREATE TABLE IF NOT EXISTS public.school_taxonomy (
  school_id uuid PRIMARY KEY,
  grades text[] NOT NULL DEFAULT ARRAY[]::text[],
  class_style text NOT NULL DEFAULT 'alphabet',
  class_sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  subjects text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_taxonomy TO authenticated;
GRANT ALL ON public.school_taxonomy TO service_role;

ALTER TABLE public.school_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school members read taxonomy"
  ON public.school_taxonomy FOR SELECT TO authenticated
  USING (school_id = public.current_school_id());

CREATE POLICY "school_admin writes taxonomy"
  ON public.school_taxonomy FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.has_role('school_admin'::app_role))
  WITH CHECK (school_id = public.current_school_id() AND public.has_role('school_admin'::app_role));

-- 3. Teacher assignments
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  school_id uuid NOT NULL,
  class_label text NOT NULL,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_label, subject)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher manages own assignments"
  ON public.teacher_assignments FOR ALL TO authenticated
  USING (user_id = auth.uid() AND school_id = public.current_school_id())
  WITH CHECK (user_id = auth.uid() AND school_id = public.current_school_id());

CREATE POLICY "admin reads teacher assignments"
  ON public.teacher_assignments FOR SELECT TO authenticated
  USING (school_id = public.current_school_id() AND public.has_role('school_admin'::app_role));

CREATE POLICY "admin removes teacher assignments"
  ON public.teacher_assignments FOR DELETE TO authenticated
  USING (school_id = public.current_school_id() AND public.has_role('school_admin'::app_role));

-- 4. Counselor assignments
CREATE TABLE IF NOT EXISTS public.counselor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  school_id uuid NOT NULL,
  class_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_label)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.counselor_assignments TO authenticated;
GRANT ALL ON public.counselor_assignments TO service_role;

ALTER TABLE public.counselor_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "counselor manages own assignments"
  ON public.counselor_assignments FOR ALL TO authenticated
  USING (user_id = auth.uid() AND school_id = public.current_school_id())
  WITH CHECK (user_id = auth.uid() AND school_id = public.current_school_id());

CREATE POLICY "admin reads counselor assignments"
  ON public.counselor_assignments FOR SELECT TO authenticated
  USING (school_id = public.current_school_id() AND public.has_role('school_admin'::app_role));

CREATE POLICY "admin removes counselor assignments"
  ON public.counselor_assignments FOR DELETE TO authenticated
  USING (school_id = public.current_school_id() AND public.has_role('school_admin'::app_role));

-- updated_at trigger for taxonomy
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_school_taxonomy_touch ON public.school_taxonomy;
CREATE TRIGGER trg_school_taxonomy_touch BEFORE UPDATE ON public.school_taxonomy
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
