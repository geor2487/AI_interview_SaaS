"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Member, Organization } from "@/types/index"

interface AuthContext {
  user: User | null
  member: (Member & { organizations: Organization }) | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContext>({
  user: null,
  member: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [member, setMember] = useState<
    (Member & { organizations: Organization }) | null
  >(null)
  const [loading, setLoading] = useState(true)

  const fetchMember = useCallback(async (userId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("members")
      .select("*, organizations(*)")
      .eq("user_id", userId)
      .single<Member & { organizations: Organization }>()

    if (!error && data) {
      setMember(data)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        await fetchMember(session.user.id)
      }
      setLoading(false)
    }

    init()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchMember(session.user.id)
      } else {
        setUser(null)
        setMember(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchMember])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setMember(null)
    router.push("/login")
  }, [router])

  return (
    <AuthContext.Provider value={{ user, member, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
