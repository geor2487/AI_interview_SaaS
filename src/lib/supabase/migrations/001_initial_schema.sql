-- ============================================================
-- AI Interview SaaS - Initial Schema Migration
-- ============================================================

-- =====================
-- 1. Tables
-- =====================

-- organizations
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- members
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  role text NOT NULL CHECK (role IN ('admin', 'interviewer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- candidates
CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  email text NOT NULL,
  status text NOT NULL CHECK (status IN ('invited', 'scheduled', 'interviewed', 'evaluated', 'rejected', 'accepted')) DEFAULT 'invited',
  date_of_birth date,
  gender text,
  phone text,
  location text,
  desired_position text,
  desired_salary text,
  available_from text,
  self_introduction text,
  profile_image_url text,
  profile_completion int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- question_sets
CREATE TABLE question_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- questions
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id uuid NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
  order_index int NOT NULL,
  content text NOT NULL,
  evaluation_criteria text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- interviews
CREATE TABLE interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  candidate_id uuid NOT NULL REFERENCES candidates(id),
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'evaluated')) DEFAULT 'pending',
  current_question_index int NOT NULL DEFAULT 0,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  invite_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- interview_question_sets
CREATE TABLE interview_question_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  question_set_id uuid NOT NULL REFERENCES question_sets(id),
  order_index int NOT NULL
);

-- transcripts
CREATE TABLE transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id),
  question_id uuid REFERENCES questions(id),
  speaker text NOT NULL CHECK (speaker IN ('ai', 'candidate')),
  content text NOT NULL,
  timestamp_ms int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- evaluations
CREATE TABLE evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id),
  question_id uuid REFERENCES questions(id),
  ai_score int,
  ai_comment text,
  manual_score int,
  manual_comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- recordings
CREATE TABLE recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id),
  storage_path text NOT NULL,
  duration_ms int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- candidate_careers
CREATE TABLE candidate_careers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  period_start date NOT NULL,
  period_end date,
  description text NOT NULL DEFAULT '',
  order_index int NOT NULL
);

-- candidate_educations
CREATE TABLE candidate_educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  institution text NOT NULL,
  department text NOT NULL,
  period_start date NOT NULL,
  period_end date,
  description text NOT NULL DEFAULT '',
  order_index int NOT NULL
);

-- candidate_skills
CREATE TABLE candidate_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name text NOT NULL,
  level int NOT NULL
);

-- candidate_documents
CREATE TABLE candidate_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  size_bytes int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  candidate_id uuid NOT NULL REFERENCES candidates(id),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  sender_type text NOT NULL CHECK (sender_type IN ('admin', 'interviewer', 'candidate', 'system')),
  content text NOT NULL,
  read_at timestamptz,
  parent_id uuid REFERENCES messages(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- 2. Indexes
-- =====================

CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_organization_id ON members(organization_id);
CREATE INDEX idx_candidates_organization_id ON candidates(organization_id);
CREATE INDEX idx_candidates_user_id ON candidates(user_id);
CREATE INDEX idx_interviews_organization_id ON interviews(organization_id);
CREATE INDEX idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX idx_interviews_invite_token ON interviews(invite_token);
CREATE INDEX idx_transcripts_interview_id ON transcripts(interview_id);
CREATE INDEX idx_evaluations_interview_id ON evaluations(interview_id);
CREATE INDEX idx_messages_candidate_id ON messages(candidate_id);
CREATE INDEX idx_messages_organization_id ON messages(organization_id);

-- =====================
-- 3. Row Level Security
-- =====================

-- Helper: check if user is a member of the given organization
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE members.user_id = auth.uid()
      AND members.organization_id = org_id
  );
$$;

-- Helper: check if user is a candidate (has a candidates row with matching user_id)
CREATE OR REPLACE FUNCTION public.is_candidate_self(cand_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM candidates
    WHERE candidates.id = cand_id
      AND candidates.user_id = auth.uid()
  );
$$;

-- ---- organizations ----
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (public.is_org_member(id));
CREATE POLICY "org_insert" ON organizations FOR INSERT
  WITH CHECK (true);
CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (public.is_org_member(id));
CREATE POLICY "org_delete" ON organizations FOR DELETE
  USING (public.is_org_member(id));

-- ---- members ----
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select" ON members FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "members_insert" ON members FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "members_update" ON members FOR UPDATE
  USING (public.is_org_member(organization_id));
CREATE POLICY "members_delete" ON members FOR DELETE
  USING (public.is_org_member(organization_id));

-- ---- candidates ----
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Org members can do everything
CREATE POLICY "candidates_org_select" ON candidates FOR SELECT
  USING (public.is_org_member(organization_id) OR user_id = auth.uid());
CREATE POLICY "candidates_org_insert" ON candidates FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "candidates_org_update" ON candidates FOR UPDATE
  USING (public.is_org_member(organization_id) OR user_id = auth.uid());
CREATE POLICY "candidates_org_delete" ON candidates FOR DELETE
  USING (public.is_org_member(organization_id));

-- ---- question_sets ----
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qs_select" ON question_sets FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "qs_insert" ON question_sets FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "qs_update" ON question_sets FOR UPDATE
  USING (public.is_org_member(organization_id));
CREATE POLICY "qs_delete" ON question_sets FOR DELETE
  USING (public.is_org_member(organization_id));

-- ---- questions ----
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select" ON questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM question_sets qs
    WHERE qs.id = questions.question_set_id
      AND public.is_org_member(qs.organization_id)
  ));
CREATE POLICY "questions_insert" ON questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM question_sets qs
    WHERE qs.id = questions.question_set_id
      AND public.is_org_member(qs.organization_id)
  ));
CREATE POLICY "questions_update" ON questions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM question_sets qs
    WHERE qs.id = questions.question_set_id
      AND public.is_org_member(qs.organization_id)
  ));
CREATE POLICY "questions_delete" ON questions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM question_sets qs
    WHERE qs.id = questions.question_set_id
      AND public.is_org_member(qs.organization_id)
  ));

-- ---- interviews ----
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interviews_select" ON interviews FOR SELECT
  USING (public.is_org_member(organization_id) OR public.is_candidate_self(candidate_id));
CREATE POLICY "interviews_insert" ON interviews FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "interviews_update" ON interviews FOR UPDATE
  USING (public.is_org_member(organization_id) OR public.is_candidate_self(candidate_id));
CREATE POLICY "interviews_delete" ON interviews FOR DELETE
  USING (public.is_org_member(organization_id));

-- ---- interview_question_sets ----
ALTER TABLE interview_question_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iqs_select" ON interview_question_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = interview_question_sets.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "iqs_insert" ON interview_question_sets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = interview_question_sets.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "iqs_update" ON interview_question_sets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = interview_question_sets.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "iqs_delete" ON interview_question_sets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = interview_question_sets.interview_id
      AND public.is_org_member(i.organization_id)
  ));

-- ---- transcripts ----
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transcripts_select" ON transcripts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = transcripts.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "transcripts_insert" ON transcripts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = transcripts.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "transcripts_update" ON transcripts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = transcripts.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "transcripts_delete" ON transcripts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = transcripts.interview_id
      AND public.is_org_member(i.organization_id)
  ));

-- ---- evaluations ----
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluations_select" ON evaluations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = evaluations.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "evaluations_insert" ON evaluations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = evaluations.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "evaluations_update" ON evaluations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = evaluations.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "evaluations_delete" ON evaluations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = evaluations.interview_id
      AND public.is_org_member(i.organization_id)
  ));

-- ---- recordings ----
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recordings_select" ON recordings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = recordings.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "recordings_insert" ON recordings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = recordings.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "recordings_update" ON recordings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = recordings.interview_id
      AND public.is_org_member(i.organization_id)
  ));
CREATE POLICY "recordings_delete" ON recordings FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM interviews i
    WHERE i.id = recordings.interview_id
      AND public.is_org_member(i.organization_id)
  ));

-- ---- candidate_careers ----
ALTER TABLE candidate_careers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "careers_select" ON candidate_careers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_careers.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "careers_insert" ON candidate_careers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_careers.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "careers_update" ON candidate_careers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_careers.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "careers_delete" ON candidate_careers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_careers.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));

-- ---- candidate_educations ----
ALTER TABLE candidate_educations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "educations_select" ON candidate_educations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_educations.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "educations_insert" ON candidate_educations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_educations.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "educations_update" ON candidate_educations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_educations.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "educations_delete" ON candidate_educations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_educations.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));

-- ---- candidate_skills ----
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skills_select" ON candidate_skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_skills.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "skills_insert" ON candidate_skills FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_skills.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "skills_update" ON candidate_skills FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_skills.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "skills_delete" ON candidate_skills FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_skills.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));

-- ---- candidate_documents ----
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select" ON candidate_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_documents.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "documents_insert" ON candidate_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_documents.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "documents_update" ON candidate_documents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_documents.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));
CREATE POLICY "documents_delete" ON candidate_documents FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_documents.candidate_id
      AND (public.is_org_member(c.organization_id) OR c.user_id = auth.uid())
  ));

-- ---- messages ----
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (
    public.is_org_member(organization_id)
    OR public.is_candidate_self(candidate_id)
  );
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    OR public.is_candidate_self(candidate_id)
  );
CREATE POLICY "messages_update" ON messages FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    OR public.is_candidate_self(candidate_id)
  );
CREATE POLICY "messages_delete" ON messages FOR DELETE
  USING (
    public.is_org_member(organization_id)
  );

-- =====================
-- 4. Storage Buckets
-- =====================

INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage RLS policies

-- recordings: only org members via interview
CREATE POLICY "recordings_storage_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'recordings' AND auth.uid() IS NOT NULL);
CREATE POLICY "recordings_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recordings' AND auth.uid() IS NOT NULL);

-- documents: org members and candidate themselves
CREATE POLICY "documents_storage_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "documents_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- avatars: public read, authenticated write
CREATE POLICY "avatars_storage_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
