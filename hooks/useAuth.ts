
"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { UserProfile, UserRole } from "@/lib/auth"

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial session
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    getUser()

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        department,
        is_active,
        user_roles(name)
      `)
      .eq('id', userId)
      .single()

    if (data) {
      setUser({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role_name: data.user_roles?.name as UserRole || 'user',
        department: data.department,
        is_active: data.is_active
      })
    }
    setLoading(false)
  }

  const hasPermission = (action: string): boolean => {
    if (!user) return false
    
    const permissions = {
      admin: [
        'view_all',
        'create_users',
        'create_authorities',
        'create_entries',
        'approve_requests',
        'view_analytics'
      ],
      authority: [
        'view_analytics',
        'approve_requests'
      ],
      user: [
        'view_analytics',
        'create_entries',
        'manage_notifications'
      ]
    }

    return permissions[user.role_name]?.includes(action) || false
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  return {
    user,
    loading,
    hasPermission,
    signOut
  }
}
