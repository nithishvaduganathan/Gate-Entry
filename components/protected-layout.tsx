
"use client"

import { useAuth } from "@/hooks/useAuth"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Users, 
  LogOut, 
  Bus, 
  UserCheck, 
  BarChart3, 
  Settings,
  Bell,
  CheckSquare
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ProtectedLayoutProps {
  children: React.ReactNode
  requiredPermissions?: string[]
}

export default function ProtectedLayout({ children, requiredPermissions = [] }: ProtectedLayoutProps) {
  const { user, loading, hasPermission, signOut } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (!user) {
    return null
  }

  if (!user.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Your account is inactive. Please contact an administrator.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user has required permissions
  const hasRequiredPermissions = requiredPermissions.every(permission => 
    hasPermission(permission)
  )

  if (!hasRequiredPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
            <Link href="/">
              <Button className="mt-4">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'authority': return 'bg-blue-100 text-blue-800'
      case 'user': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-xl font-bold text-gray-900">SINCET Gate Entry</h1>
              </Link>
              <Badge className={getRoleColor(user.role_name)}>
                {user.role_name.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.full_name || user.email}</span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {/* Analytics - All roles */}
          {hasPermission('view_analytics') && (
            <Link href="/dashboard">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm">Analytics</span>
              </Button>
            </Link>
          )}

          {/* Entry creation - User role only */}
          {hasPermission('create_entries') && (
            <>
              <Link href="/visitor-entry">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
                  <UserCheck className="w-5 h-5" />
                  <span className="text-sm">Visitor Entry</span>
                </Button>
              </Link>
              <Link href="/vehicle-entry">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
                  <Bus className="w-5 h-5" />
                  <span className="text-sm">Vehicle Entry</span>
                </Button>
              </Link>
            </>
          )}

          {/* Approvals - Authority and Admin */}
          {hasPermission('approve_requests') && (
            <Link href="/authority-approvals">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
                <CheckSquare className="w-5 h-5" />
                <span className="text-sm">Approvals</span>
              </Button>
            </Link>
          )}

          {/* User Management - Admin only */}
          {hasPermission('create_users') && (
            <>
              <Link href="/user-management">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Users</span>
                </Button>
              </Link>
              <Link href="/authorities">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Authorities</span>
                </Button>
              </Link>
            </>
          )}

          {/* Notifications - User role */}
          {hasPermission('manage_notifications') && (
            <Link href="/notifications">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
                <Bell className="w-5 h-5" />
                <span className="text-sm">Notifications</span>
              </Button>
            </Link>
          )}

          {/* Entries list - All roles */}
          <Link href="/entries">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
              <Settings className="w-5 h-5" />
              <span className="text-sm">Entries</span>
            </Button>
          </Link>
        </div>

        {children}
      </div>
    </div>
  )
}
