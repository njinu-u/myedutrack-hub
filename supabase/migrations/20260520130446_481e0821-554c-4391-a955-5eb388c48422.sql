
ALTER TABLE public.school_invitations
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS token uuid NOT NULL DEFAULT gen_random_uuid();

UPDATE public.school_invitations
SET status = CASE WHEN used_at IS NOT NULL THEN 'accepted' ELSE 'pending' END
WHERE status IS NULL OR status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS school_invitations_token_key ON public.school_invitations(token);
CREATE INDEX IF NOT EXISTS school_invitations_status_idx ON public.school_invitations(school_id, status);
