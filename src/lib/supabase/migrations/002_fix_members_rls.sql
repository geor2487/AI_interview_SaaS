-- Fix members RLS: allow users to read their own member record
-- This prevents the circular dependency where is_org_member needs to read members
-- but the members policy itself requires is_org_member to pass.

DROP POLICY IF EXISTS "members_select" ON members;
CREATE POLICY "members_select" ON members FOR SELECT
  USING (user_id = auth.uid() OR public.is_org_member(organization_id));

DROP POLICY IF EXISTS "members_insert" ON members;
CREATE POLICY "members_insert" ON members FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_org_member(organization_id));

DROP POLICY IF EXISTS "members_update" ON members;
CREATE POLICY "members_update" ON members FOR UPDATE
  USING (user_id = auth.uid() OR public.is_org_member(organization_id));
