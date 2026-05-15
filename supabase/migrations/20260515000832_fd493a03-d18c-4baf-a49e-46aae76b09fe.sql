
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('super_admin','school_admin','teacher','counselor','parent','student');
CREATE TYPE public.school_plan AS ENUM ('free_trial','school','district');
CREATE TYPE public.school_status AS ENUM ('trial','active','expired','cancelled');
CREATE TYPE public.attendance_status AS ENUM ('present','absent','late');
CREATE TYPE public.flag_severity AS ENUM ('low','medium','high');
CREATE TYPE public.appointment_status AS ENUM ('pending','confirmed','declined');

-- ============= CORE TABLES =============
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  admin_email text NOT NULL,
  country text,
  student_count integer DEFAULT 0,
  plan public.school_plan NOT NULL DEFAULT 'free_trial',
  status public.school_status NOT NULL DEFAULT 'trial',
  trial_expires_at timestamptz,
  paddle_customer_id text,
  paddle_transaction_id text,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  grade text,
  class_id text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.app_users (
  id uuid PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role public.app_role NOT NULL DEFAULT 'school_admin',
  linked_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  score integer NOT NULL,
  max_score integer NOT NULL DEFAULT 100,
  term text,
  entered_by uuid REFERENCES public.app_users(id),
  entered_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status public.attendance_status NOT NULL,
  recorded_by uuid REFERENCES public.app_users(id),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.mood_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mood integer NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.counselor_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  flagged_by uuid REFERENCES public.app_users(id),
  reason text NOT NULL,
  severity public.flag_severity NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  subject text,
  body text NOT NULL,
  language_code text DEFAULT 'en',
  sent_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  parent_user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  teacher_user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  notes text,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  scheduled_at timestamptz
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE TABLE public.observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  subject text,
  note text NOT NULL,
  tags text[] DEFAULT '{}',
  ai_suggestions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.school_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  email text,
  linked_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============= HELPER FUNCTIONS (SECURITY DEFINER) =============
CREATE OR REPLACE FUNCTION public.current_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.app_users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.app_users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_linked_student_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT linked_student_id FROM public.app_users WHERE id = auth.uid()
$$;

-- ============= ENABLE RLS =============
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_invitations ENABLE ROW LEVEL SECURITY;

-- ============= POLICIES =============
-- schools: members read own, admins update own
CREATE POLICY "members read own school" ON public.schools FOR SELECT TO authenticated
  USING (id = public.current_school_id());
CREATE POLICY "school_admin updates own school" ON public.schools FOR UPDATE TO authenticated
  USING (id = public.current_school_id() AND public.has_role('school_admin'));

-- app_users: read self + same school; insert self (via trigger or explicit)
CREATE POLICY "read users in same school" ON public.app_users FOR SELECT TO authenticated
  USING (id = auth.uid() OR school_id = public.current_school_id());
CREATE POLICY "user updates self" ON public.app_users FOR UPDATE TO authenticated
  USING (id = auth.uid());
CREATE POLICY "school_admin manages users" ON public.app_users FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.has_role('school_admin'))
  WITH CHECK (school_id = public.current_school_id() AND public.has_role('school_admin'));

-- students: same school read; admins/teachers/counselors manage
CREATE POLICY "school members read students" ON public.students FOR SELECT TO authenticated
  USING (
    school_id = public.current_school_id() AND (
      public.current_user_role() IN ('school_admin','teacher','counselor')
      OR id = public.current_linked_student_id()
    )
  );
CREATE POLICY "staff write students" ON public.students FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.current_user_role() IN ('school_admin','teacher'))
  WITH CHECK (school_id = public.current_school_id() AND public.current_user_role() IN ('school_admin','teacher'));

-- generic helper: per-school per-student visibility
-- grades
CREATE POLICY "grades read" ON public.grades FOR SELECT TO authenticated USING (
  school_id = public.current_school_id() AND (
    public.current_user_role() IN ('school_admin','teacher','counselor')
    OR student_id = public.current_linked_student_id()
  )
);
CREATE POLICY "grades write by staff" ON public.grades FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.current_user_role() IN ('school_admin','teacher'))
  WITH CHECK (school_id = public.current_school_id() AND public.current_user_role() IN ('school_admin','teacher'));

-- attendance
CREATE POLICY "attendance read" ON public.attendance FOR SELECT TO authenticated USING (
  school_id = public.current_school_id() AND (
    public.current_user_role() IN ('school_admin','teacher','counselor')
    OR student_id = public.current_linked_student_id()
  )
);
CREATE POLICY "attendance write by staff" ON public.attendance FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.current_user_role() IN ('school_admin','teacher'))
  WITH CHECK (school_id = public.current_school_id() AND public.current_user_role() IN ('school_admin','teacher'));

-- mood_checkins: student creates own; counselor/admin reads
CREATE POLICY "mood read" ON public.mood_checkins FOR SELECT TO authenticated USING (
  school_id = public.current_school_id() AND (
    public.current_user_role() IN ('school_admin','counselor')
    OR student_id = public.current_linked_student_id()
  )
);
CREATE POLICY "mood insert by self" ON public.mood_checkins FOR INSERT TO authenticated
  WITH CHECK (school_id = public.current_school_id() AND student_id = public.current_linked_student_id());

-- counselor_flags
CREATE POLICY "flags read by staff" ON public.counselor_flags FOR SELECT TO authenticated USING (
  school_id = public.current_school_id() AND public.current_user_role() IN ('school_admin','teacher','counselor')
);
CREATE POLICY "flags write by counselor" ON public.counselor_flags FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.current_user_role() IN ('school_admin','counselor'))
  WITH CHECK (school_id = public.current_school_id() AND public.current_user_role() IN ('school_admin','counselor'));

-- messages
CREATE POLICY "messages read" ON public.messages FOR SELECT TO authenticated USING (
  school_id = public.current_school_id() AND (from_user_id = auth.uid() OR to_user_id = auth.uid())
);
CREATE POLICY "messages insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (school_id = public.current_school_id() AND from_user_id = auth.uid());
CREATE POLICY "messages update read_at" ON public.messages FOR UPDATE TO authenticated
  USING (to_user_id = auth.uid());

-- appointments
CREATE POLICY "appointments read" ON public.appointments FOR SELECT TO authenticated USING (
  school_id = public.current_school_id() AND (
    parent_user_id = auth.uid() OR teacher_user_id = auth.uid() OR public.has_role('school_admin')
  )
);
CREATE POLICY "appointments parent insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (school_id = public.current_school_id() AND parent_user_id = auth.uid());
CREATE POLICY "appointments teacher update" ON public.appointments FOR UPDATE TO authenticated
  USING (school_id = public.current_school_id() AND (teacher_user_id = auth.uid() OR public.has_role('school_admin')));

-- notifications
CREATE POLICY "notifications read own" ON public.notifications FOR SELECT TO authenticated
  USING (to_user_id = auth.uid());
CREATE POLICY "notifications update own" ON public.notifications FOR UPDATE TO authenticated
  USING (to_user_id = auth.uid());
CREATE POLICY "notifications insert in school" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (school_id = public.current_school_id());

-- observations
CREATE POLICY "observations read" ON public.observations FOR SELECT TO authenticated USING (
  school_id = public.current_school_id() AND (
    public.current_user_role() IN ('school_admin','teacher','counselor')
    OR student_id = public.current_linked_student_id()
  )
);
CREATE POLICY "observations write by teacher" ON public.observations FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.current_user_role() IN ('school_admin','teacher','counselor'))
  WITH CHECK (school_id = public.current_school_id() AND teacher_id = auth.uid());

-- school_invitations: admin manages
CREATE POLICY "invitations admin all" ON public.school_invitations FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.has_role('school_admin'))
  WITH CHECK (school_id = public.current_school_id() AND public.has_role('school_admin'));

-- ============= INDEXES =============
CREATE INDEX idx_app_users_school ON public.app_users(school_id);
CREATE INDEX idx_students_school ON public.students(school_id);
CREATE INDEX idx_grades_student ON public.grades(student_id);
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX idx_mood_student ON public.mood_checkins(student_id, checked_at DESC);
CREATE INDEX idx_messages_to ON public.messages(to_user_id, sent_at DESC);
CREATE INDEX idx_notifications_to ON public.notifications(to_user_id, created_at DESC);
CREATE INDEX idx_observations_student ON public.observations(student_id, created_at DESC);
