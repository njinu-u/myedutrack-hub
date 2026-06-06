
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS students_school_email_uniq
  ON public.students (school_id, lower(email))
  WHERE email IS NOT NULL AND email <> '';

CREATE UNIQUE INDEX IF NOT EXISTS students_school_external_id_uniq
  ON public.students (school_id, external_id)
  WHERE external_id IS NOT NULL AND external_id <> '';
