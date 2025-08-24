
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type UserRole = 'admin' | 'authority' | 'user'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role_name: UserRole
  department: string | null
  is_active: boolean
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select(`
      id,
      email,
      full_name,
      department,
      is_active,
      user_roles(name)
    `)
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role_name: profile.user_roles?.name as UserRole || 'user',
    department: profile.department,
    is_active: profile.is_active
  }
}

export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }
  if (!user.is_active) {
    redirect('/auth/error?message=Account is inactive')
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]): Promise<UserProfile> {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role_name)) {
    redirect('/auth/error?message=Insufficient permissions')
  }
  return user
}

export function hasPermission(userRole: UserRole, action: string): boolean {
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

  return permissions[userRole]?.includes(action) || false
}
