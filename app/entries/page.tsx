"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Clock, LogOut, Phone, FileText } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import SimpleLayout from "@/components/protected-layout"

interface CheckedInVisitor {
  id: string
  name: string
  phone: string
  purpose: string
  entry_time: string
  status: string
  photo_url: string | null
  notes: string | null
  authorities?: {
    name: string
    designation: string
  }
}

export default function EntriesPage() {
  const [checkedInVisitors, setCheckedInVisitors] = useState<CheckedInVisitor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  useEffect(() => {
    fetchCheckedInVisitors()
  }, [])

  const fetchCheckedInVisitors = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("visitors")
      .select(`
        id,
        name,
        phone,
        purpose,
        entry_time,
        status,
        photo_url,
        notes,
        authorities (
          name,
          designation
        )
      `)
      .eq("status", "approved")
      .is("exit_time", null)
      .order("entry_time", { ascending: false })

    if (data) {
      setCheckedInVisitors(data)
    }
    setIsLoading(false)
  }

  const handleCheckout = async (visitorId: string) => {
    setCheckingOut(visitorId)
    const supabase = createClient()

    const { error } = await supabase
      .from("visitors")
      .update({
        exit_time: new Date().toISOString(),
        status: "exited",
      })
      .eq("id", visitorId)

    if (!error) {
      setCheckedInVisitors(checkedInVisitors.filter((v) => v.id !== visitorId))
      alert("Visitor checked out successfully!")
    } else {
      alert("Error checking out visitor. Please try again.")
    }
    setCheckingOut(null)
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDuration = (entryTime: string) => {
    const entry = new Date(entryTime)
    const now = new Date()
    const diffMs = now.getTime() - entry.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  if (isLoading) {
    return (
      <SimpleLayout title="All Entries" description="View all visitor and vehicle entries">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-md mx-auto pt-8">
            <div className="text-center">Loading entries...</div>
          </div>
        </div>
      </SimpleLayout>
    )
  }

  return (
    <SimpleLayout title="All Entries" description="View all visitor and vehicle entries">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6 pt-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Entries</h1>
              <p className="text-sm text-gray-600">Currently checked-in visitors</p>
            </div>
          </div>

          {/* Stats */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{checkedInVisitors.length}</div>
                <div className="text-sm text-gray-600">Visitors Inside</div>
              </div>
            </CardContent>
          </Card>

          {/* Checked-in Visitors */}
          <div className="space-y-4">
            {checkedInVisitors.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No visitors currently checked in
                </CardContent>
              </Card>
            ) : (
              checkedInVisitors.map((visitor) => (
                <Card key={visitor.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {visitor.photo_url ? (
                          <img
                            src={visitor.photo_url}
                            alt={visitor.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{visitor.name}</CardTitle>
                          <div className="text-sm text-gray-600">
                            Inside for {getDuration(visitor.entry_time)}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Inside
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{visitor.phone}</span>
                      </div>

                      <div className="flex items-start space-x-2">
                        <FileText className="w-4 h-4 mt-0.5" />
                        <span>{visitor.purpose}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Entry: {formatTime(visitor.entry_time)}</span>
                      </div>

                      {visitor.authorities && (
                        <div className="text-blue-600">
                          Approved by: {visitor.authorities.name} ({visitor.authorities.designation})
                        </div>
                      )}

                      {visitor.notes && (
                        <div className="bg-gray-50 p-2 rounded text-sm">
                          <strong>Notes:</strong> {visitor.notes}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleCheckout(visitor.id)}
                      disabled={checkingOut === visitor.id}
                      className="w-full flex items-center justify-center space-x-2"
                      variant="destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{checkingOut === visitor.id ? "Checking Out..." : "Check Out"}</span>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Current Time */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Current Time: {new Date().toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SimpleLayout>
  )
}