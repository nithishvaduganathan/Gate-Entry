"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, User, Clock, CheckCircle, XCircle, Eye } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Notification {
  id: string
  visitor_id: string
  authority_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  visitor: {
    name: string
    phone: string
    purpose: string
    photo_url: string | null
    status: string
  }
  authority: {
    name: string
    designation: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        visitor:visitors(name, phone, purpose, photo_url, status),
        authority:authorities(name, designation)
      `)
      .order("created_at", { ascending: false })

    if (data) {
      setNotifications(data)
    }
    setIsLoading(false)
  }

  const markAsRead = async (notificationId: string) => {
    const supabase = createClient()
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    fetchNotifications()
  }

  const handleVisitorAction = async (visitorId: string, action: "approved" | "rejected", notificationId: string) => {
    setProcessingId(notificationId)

    try {
      const supabase = createClient()

      // Update visitor status
      const { error } = await supabase.from("visitors").update({ status: action }).eq("id", visitorId)

      if (error) throw error

      // Mark notification as read
      await markAsRead(notificationId)

      alert(`Visitor request ${action} successfully!`)
      fetchNotifications()
    } catch (error) {
      console.error("Error updating visitor:", error)
      alert("Error processing request. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center">Loading notifications...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-600">Visitor requests and updates</p>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {notifications.filter((n) => !n.is_read).length} unread
          </Badge>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No notifications yet</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card key={notification.id} className={`${!notification.is_read ? "ring-2 ring-purple-200" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {notification.title}
                        {!notification.is_read && (
                          <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800 text-xs">
                            New
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(notification.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Visitor Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      {notification.visitor.photo_url && (
                        <img
                          src={notification.visitor.photo_url || "/placeholder.svg"}
                          alt="Visitor"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{notification.visitor.name}</h4>
                        <p className="text-sm text-gray-600">{notification.visitor.phone}</p>
                        <p className="text-sm text-gray-700 mt-1">{notification.visitor.purpose}</p>
                        <Badge
                          variant={
                            notification.visitor.status === "approved"
                              ? "default"
                              : notification.visitor.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="mt-2"
                        >
                          {notification.visitor.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-gray-700">{notification.message}</p>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    {notification.visitor.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleVisitorAction(notification.visitor_id, "approved", notification.id)}
                          disabled={processingId === notification.id}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleVisitorAction(notification.visitor_id, "rejected", notification.id)}
                          disabled={processingId === notification.id}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <div className="flex-1 text-center text-sm text-gray-600">
                        Request {notification.visitor.status}
                      </div>
                    )}

                    {!notification.is_read && (
                      <Button size="sm" variant="outline" onClick={() => markAsRead(notification.id)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link href="/authority-approvals">
            <Button variant="outline" className="w-full bg-transparent">
              All Approvals
            </Button>
          </Link>
          <Link href="/visitor-list">
            <Button variant="outline" className="w-full bg-transparent">
              View Visitors
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
