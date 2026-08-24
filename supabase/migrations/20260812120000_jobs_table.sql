-- Jobs fetched from external platforms via JSearch through RapidAPI
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  title text NOT NULL,
  company text,
  company_logo text,
  location text,
  salary text,
  job_type text,
  experience_level text,
  description text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  match_score numeric(5, 2) NOT NULL DEFAULT 0,
  job_url text NOT NULL,
  source_url text NOT NULL,
  applied_status boolean NOT NULL DEFAULT false,
  saved_status boolean NOT NULL DEFAULT false,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jobs_user_source_url_unique UNIQUE (user_id, source_url)
);

CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS jobs_user_fetched_at_idx ON public.jobs(user_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS jobs_user_match_score_idx ON public.jobs(user_id, match_score DESC);
CREATE INDEX IF NOT EXISTS jobs_user_saved_idx ON public.jobs(user_id, saved_status) WHERE saved_status = true;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = user_id);
