"use client"

import { useAuth } from "@/components/providers/auth-provider"

export function useOrganization() {
  const { member, loading } = useAuth()

  return {
    orgId: member?.organization_id ?? null,
    organization: member?.organizations ?? null,
    loading,
  }
}
