-- ============================================================
-- 004: Add invitations table & interview guidelines
-- ============================================================

-- =====================
-- 1. invitations table
-- =====================

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  email text NOT NULL,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  candidate_id uuid REFERENCES candidates(id),
  status text NOT NULL CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX idx_invitations_email ON invitations(email);

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_org_select" ON invitations FOR SELECT
  USING (public.is_org_member(organization_id));
CREATE POLICY "invitations_org_insert" ON invitations FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "invitations_org_update" ON invitations FOR UPDATE
  USING (public.is_org_member(organization_id));
CREATE POLICY "invitations_org_delete" ON invitations FOR DELETE
  USING (public.is_org_member(organization_id));

-- =====================
-- 2. interview_guidelines
-- =====================

-- Organization-level default guidelines
ALTER TABLE organizations ADD COLUMN interview_guidelines text;

-- Question-set-level override (NULL = use org default)
ALTER TABLE question_sets ADD COLUMN interview_guidelines text;
