
CREATE TABLE public.timetable_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  day text NOT NULL,
  period text NOT NULL,
  class_label text NOT NULL,
  subject text,
  teacher_user_id uuid,
  room text,
  unassigned_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX timetable_slots_school_idx ON public.timetable_slots(school_id);
CREATE UNIQUE INDEX timetable_slots_uniq ON public.timetable_slots(school_id, day, period, class_label);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_slots TO authenticated;
GRANT ALL ON public.timetable_slots TO service_role;

ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school members read timetable"
  ON public.timetable_slots FOR SELECT TO authenticated
  USING (school_id = public.current_school_id());

CREATE POLICY "school_admin manages timetable"
  ON public.timetable_slots FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.has_role('school_admin'::app_role))
  WITH CHECK (school_id = public.current_school_id() AND public.has_role('school_admin'::app_role));

CREATE TRIGGER timetable_slots_touch
  BEFORE UPDATE ON public.timetable_slots
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
