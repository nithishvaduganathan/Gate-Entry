
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserAuth } from "@/hooks/useUserAuth"

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserAuth } from "@/hooks/useUserAuth"

interface ProtectedWrapperProps {
  children: React.ReactNode
  allowedRoles?: string[]
  requireAuth?: boolean
}

export default function ProtectedWrapper({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}: ProtectedWrapperProps) {
  const { user, loading } = useUserAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push("/login")
        return
      }

      if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.push("/dashboard") // Redirect to dashboard if no permission
        return
      }
    }
  }, [user, loading, router, allowedRoles, requireAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
