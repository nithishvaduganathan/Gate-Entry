"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Bus, Shield, Clock, TrendingUp, Calendar, FileText } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import ProtectedLayout from "@/components/protected-layout"

interface DashboardStats {
  totalVisitors: number
  activeVisitors: number
  totalBuses: number
  activeBuses: number
  pendingApprovals: number
  totalAuthorities: number
  todayVisitors: number
  todayBuses: number
}

interface RecentActivity {
  id: string
  type: "visitor" | "bus"
  name: string
  action: string
  time: string
  status?: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVisitors: 0,
    activeVisitors: 0,
    totalBuses: 0,
    activeBuses: 0,
    pendingApprovals: 0,
    totalAuthorities: 0,
    todayVisitors: 0,
    todayBuses: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const supabase = createClient()

    try {
      // Get today's date range
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      // Fetch visitor statistics
      const [
        { count: totalVisitors },
        { count: activeVisitors },
        { count: pendingApprovals },
        { count: todayVisitors },
      ] = await Promise.all([
        supabase.from("visitors").select("*", { count: "exact", head: true }),
        supabase.from("visitors").select("*", { count: "exact", head: true }).is("exit_time", null),
        supabase.from("visitors").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase
          .from("visitors")
          .select("*", { count: "exact", head: true })
          .gte("entry_time", startOfDay.toISOString())
          .lt("entry_time", endOfDay.toISOString()),
      ])

      // Fetch bus statistics
      const [{ count: totalBuses }, { count: activeBuses }, { count: todayBuses }] = await Promise.all([
        supabase.from("bus_entries").select("*", { count: "exact", head: true }),
        supabase.from("bus_entries").select("*", { count: "exact", head: true }).eq("status", "entered"),
        supabase
          .from("bus_entries")
          .select("*", { count: "exact", head: true })
          .gte("entry_time", startOfDay.toISOString())
          .lt("entry_time", endOfDay.toISOString()),
      ])

      // Fetch authority count
      const { count: totalAuthorities } = await supabase
        .from("authorities")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)

      setStats({
        totalVisitors: totalVisitors || 0,
        activeVisitors: activeVisitors || 0,
        totalBuses: totalBuses || 0,
        activeBuses: activeBuses || 0,
        pendingApprovals: pendingApprovals || 0,
        totalAuthorities: totalAuthorities || 0,
        todayVisitors: todayVisitors || 0,
        todayBuses: todayBuses || 0,
      })

      // Fetch recent activity
      const { data: recentVisitors } = await supabase
        .from("visitors")
        .select("id, name, entry_time, exit_time, status")
        .order("entry_time", { ascending: false })
        .limit(5)

      const { data: recentBuses } = await supabase
        .from("bus_entries")
        .select("id, bus_number, entry_time, exit_time, status")
        .order("entry_time", { ascending: false })
        .limit(5)

      // Combine and format recent activity
      const activity: RecentActivity[] = []

      if (recentVisitors) {
        recentVisitors.forEach((visitor) => {
          activity.push({
            id: visitor.id,
            type: "visitor",
            name: visitor.name,
            action: visitor.exit_time ? "exited" : "entered",
            time: visitor.exit_time || visitor.entry_time,
            status: visitor.status,
          })
        })
      }

      if (recentBuses) {
        recentBuses.forEach((bus) => {
          activity.push({
            id: bus.id,
            type: "bus",
            name: bus.bus_number,
            action: bus.exit_time ? "exited" : "entered",
            time: bus.exit_time || bus.entry_time,
            status: bus.status,
          })
        })
      }

      // Sort by time and take top 10
      activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setRecentActivity(activity.slice(0, 10))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getActivityIcon = (type: string) => {
    return type === "visitor" ? <Users className="w-4 h-4" /> : <Bus className="w-4 h-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "entered":
        return "bg-blue-100 text-blue-800"
      case "exited":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <ProtectedLayout requiredPermissions={['view_analytics']}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-4">
          <div className="max-w-md mx-auto pt-8">
            <div className="text-center">Loading dashboard...</div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout requiredPermissions={['view_analytics']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6 pt-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Gate entry system overview</p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchDashboardData}>
              <TrendingUp className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Today's Summary */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Today's Activity
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.todayVisitors}</div>
                  <div className="text-sm text-gray-600">Visitors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.todayBuses}</div>
                  <div className="text-sm text-gray-600">Vehicles</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-lg font-bold">{stats.activeVisitors}</div>
                    <div className="text-xs text-gray-600">Active Visitors</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Bus className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-lg font-bold">{stats.activeBuses}</div>
                    <div className="text-xs text-gray-600">Vehicles On Campus</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-lg font-bold">{stats.pendingApprovals}</div>
                    <div className="text-xs text-gray-600">Pending Approvals</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-lg font-bold">{stats.totalAuthorities}</div>
                    <div className="text-xs text-gray-600">Active Authorities</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest entries and exits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No recent activity</div>
                ) : (
                  recentActivity.map((activity) => (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50"
                    >
                      <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{activity.name}</div>
                        <div className="text-xs text-gray-600">
                          {activity.action} • {formatTime(activity.time)}
                        </div>
                      </div>
                      {activity.status && (
                        <Badge className={getStatusColor(activity.status)} size="sm">
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/visitor-entry">
                  <Button
                    variant="outline"
                    className="w-full h-12 flex flex-col items-center justify-center space-y-1 bg-transparent"
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-xs">New Visitor</span>
                  </Button>
                </Link>

                <Link href="/vehicle-entry">
                  <Button
                    variant="outline"
                    className="w-full h-12 flex flex-col items-center justify-center space-y-1 bg-transparent"
                  >
                    <Bus className="w-4 h-4" />
                    <span className="text-xs">New Vehicle</span>
                  </Button>
                </Link>

                <Link href="/authority-approvals">
                  <Button
                    variant="outline"
                    className="w-full h-12 flex flex-col items-center justify-center space-y-1 bg-transparent"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Approvals</span>
                  </Button>
                </Link>

                <Link href="/reports">
                  <Button
                    variant="outline"
                    className="w-full h-12 flex flex-col items-center justify-center space-y-1 bg-transparent"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">Reports</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Google Sheets</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Updated</span>
                  <span className="text-sm text-gray-600">
                    {new Date().toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}