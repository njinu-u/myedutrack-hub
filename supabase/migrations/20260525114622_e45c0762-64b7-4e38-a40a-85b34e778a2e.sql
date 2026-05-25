ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_until date,
  ADD COLUMN IF NOT EXISTS paypal_order_id text,
  ADD COLUMN IF NOT EXISTS pilot_start_date timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS admin_user_id uuid;

UPDATE public.schools s
SET pilot_start_date = s.created_at
WHERE s.pilot_start_date IS DISTINCT FROM s.created_at;

UPDATE public.schools s
SET admin_user_id = u.id
FROM public.app_users u
WHERE u.school_id = s.id
  AND u.role = 'school_admin'
  AND s.admin_user_id IS NULL;