"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  Bus,
  UserCheck,
  ClipboardList,
  BarChart3,
  Shield,
  LogOut,
  Settings,
  UserPlus, // Added for consistency in changes
  UserMinus // Added for consistency in changes
} from "lucide-react"
import { useUserAuth } from "@/hooks/useUserAuth"
import ProtectedWrapper from "@/components/protected-wrapper"

export default function HomePage() {
  const { user, logout } = useUserAuth()

  return (
    <ProtectedWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gate Entry System</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {user?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Menu */}
          <div className="space-y-4">
            {/* Visitor Management - Hidden for authorities */}
            {user?.role !== 'authority' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                    Visitor Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/visitor-entry">
                      <Button variant="outline" className="w-full h-12 flex flex-col items-center justify-center space-y-1">
                        <UserPlus className="w-4 h-4" />
                        <span className="text-xs">New Visitor</span>
                      </Button>
                    </Link>
                    <Link href="/visitor-exit">
                      <Button variant="outline" className="w-full h-12 flex flex-col items-center justify-center space-y-1">
                        <UserMinus className="w-4 h-4" />
                        <span className="text-xs">Visitor Exit</span>
                      </Button>
                    </Link>
                  </div>
                  <Link href="/visitor-list">
                    <Button variant="outline" className="w-full">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      View All Visitors
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Management - Hidden for authorities */}
            {user?.role !== 'authority' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Bus className="w-5 h-5 mr-2 text-green-600" />
                    Vehicle Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/vehicle-entry">
                      <Button variant="outline" className="w-full h-12 flex flex-col items-center justify-center space-y-1">
                        <Bus className="w-4 h-4" />
                        <span className="text-xs">Vehicle Entry</span>
                      </Button>
                    </Link>
                    <Link href="/vehicle-exit">
                      <Button variant="outline" className="w-full h-12 flex flex-col items-center justify-center space-y-1">
                        <Bus className="w-4 h-4" />
                        <span className="text-xs">Vehicle Exit</span>
                      </Button>
                    </Link>
                  </div>
                  <Link href="/vehicle-list">
                    <Button variant="outline" className="w-full">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      View All Vehicles
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Authority Features */}
            {(user?.role === 'authority' || user?.role === 'admin') && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-orange-600" />
                    Authority Panel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/authority-approvals">
                    <Button variant="outline" className="w-full">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Pending Approvals
                    </Button>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/authorities">
                      <Button variant="outline" className="w-full">
                        <Users className="w-4 h-4 mr-2" />
                        Manage Authorities
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reports & Analytics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                  Reports & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full h-12 flex flex-col items-center justify-center space-y-1">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-xs">Dashboard</span>
                    </Button>
                  </Link>
                  <Link href="/reports">
                    <Button variant="outline" className="w-full h-12 flex flex-col items-center justify-center space-y-1">
                      <ClipboardList className="w-4 h-4" />
                      <span className="text-xs">Reports</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedWrapper>
  )
}