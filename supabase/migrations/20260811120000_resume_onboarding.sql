-- Extend profiles with parsed/editable fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS professional_summary text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Resumes metadata
CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resumes_user_id_idx ON public.resumes(user_id);

-- Profile skills
CREATE TABLE IF NOT EXISTS public.profile_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_skills_user_id_idx ON public.profile_skills(user_id);

-- Work experiences
CREATE TABLE IF NOT EXISTS public.work_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  title text NOT NULL,
  start_date text,
  end_date text,
  is_current boolean NOT NULL DEFAULT false,
  responsibilities text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_experiences_user_id_idx ON public.work_experiences(user_id);

-- Education entries
CREATE TABLE IF NOT EXISTS public.education_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution text NOT NULL,
  degree text,
  field_of_study text,
  start_date text,
  end_date text,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS education_entries_user_id_idx ON public.education_entries(user_id);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  url text,
  technologies text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);

-- Certifications
CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuer text,
  issue_date text,
  url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS certifications_user_id_idx ON public.certifications(user_id);

-- Additional profile links
CREATE TABLE IF NOT EXISTS public.profile_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_links_user_id_idx ON public.profile_links(user_id);

-- Enable RLS on all new tables
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_links ENABLE ROW LEVEL SECURITY;

-- RLS policies: users manage own rows
CREATE POLICY "Users can view own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON public.resumes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own skills" ON public.profile_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.profile_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON public.profile_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON public.profile_skills FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own work experiences" ON public.work_experiences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work experiences" ON public.work_experiences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work experiences" ON public.work_experiences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own work experiences" ON public.work_experiences FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own education" ON public.education_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own education" ON public.education_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own education" ON public.education_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own education" ON public.education_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own certifications" ON public.certifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own certifications" ON public.certifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own certifications" ON public.certifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own certifications" ON public.certifications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile links" ON public.profile_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile links" ON public.profile_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile links" ON public.profile_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile links" ON public.profile_links FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS policies
CREATE POLICY "Users can upload own resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own resumes"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
