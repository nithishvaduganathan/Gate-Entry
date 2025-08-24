"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Phone, User, FileText } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Visitor {
  id: string
  name: string
  phone: string
  purpose: string
  entry_time: string
  exit_time: string | null
  status: string
  authority_permission_granted: boolean
  authorities?: {
    name: string
    designation: string
  }
}

export default function VisitorListPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchVisitors()
  }, [])

  const fetchVisitors = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("visitors")
      .select(`
        id,
        name,
        phone,
        purpose,
        entry_time,
        exit_time,
        status,
        authority_permission_granted,
        authorities (
          name,
          designation
        )
      `)
      .order("entry_time", { ascending: false })
      .limit(20)

    if (data) {
      setVisitors(data)
    }
    setIsLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "exited":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center">Loading visitors...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Link href="/visitor-entry">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Visitor List</h1>
            <p className="text-sm text-gray-600">Recent visitor entries</p>
          </div>
        </div>

        {/* Visitors List */}
        <div className="space-y-4">
          {visitors.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">No visitors registered yet</CardContent>
            </Card>
          ) : (
            visitors.map((visitor) => (
              <Card key={visitor.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <CardTitle className="text-base">{visitor.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(visitor.status)}>{visitor.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{visitor.phone}</span>
                  </div>

                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4 mt-0.5" />
                    <span>{visitor.purpose}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Entry: {formatTime(visitor.entry_time)}</span>
                  </div>

                  {visitor.exit_time && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Exit: {formatTime(visitor.exit_time)}</span>
                    </div>
                  )}

                  {visitor.authorities && (
                    <div className="text-sm text-blue-600">
                      Authority: {visitor.authorities.name} ({visitor.authorities.designation})
                    </div>
                  )}

                  {visitor.authority_permission_granted && (
                    <Badge className="bg-green-100 text-green-800">Permission Granted</Badge>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6">
          <Button onClick={fetchVisitors} variant="outline" className="w-full bg-transparent">
            Refresh List
          </Button>
        </div>
      </div>
    </div>
  )
}
