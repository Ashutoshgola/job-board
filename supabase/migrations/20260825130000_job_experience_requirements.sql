ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS experience_min_months integer,
  ADD COLUMN IF NOT EXISTS experience_max_months integer,
  ADD COLUMN IF NOT EXISTS required_experience text NOT NULL DEFAULT 'Experience not specified';
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS fresher_accepted boolean NOT NULL DEFAULT false;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_user_source_url_unique;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_user_platform_source_url_unique
  UNIQUE (user_id, platform, source_url);
