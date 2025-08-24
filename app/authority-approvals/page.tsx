"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, User, FileText, Check, X, Phone } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface PendingVisitor {
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

export default function AuthorityApprovalsPage() {
  const [pendingVisitors, setPendingVisitors] = useState<PendingVisitor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingVisitors()
  }, [])

  const fetchPendingVisitors = async () => {
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
      .eq("status", "pending")
      .order("entry_time", { ascending: false })

    if (data) {
      setPendingVisitors(data)
    }
    setIsLoading(false)
  }

  const handleApproval = async (visitorId: string, approved: boolean) => {
    setProcessingId(visitorId)
    const supabase = createClient()

    const { error } = await supabase
      .from("visitors")
      .update({
        status: approved ? "approved" : "rejected",
        authority_permission_granted: approved,
        permission_granted_at: approved ? new Date().toISOString() : null,
      })
      .eq("id", visitorId)

    if (!error) {
      await supabase.from("notifications").update({ is_read: true }).eq("visitor_id", visitorId)

      setPendingVisitors(pendingVisitors.filter((v) => v.id !== visitorId))
      alert(`Visitor ${approved ? "approved" : "rejected"} successfully!`)
    } else {
      alert("Error processing approval. Please try again.")
    }
    setProcessingId(null)
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center">Loading pending approvals...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Link href="/authorities">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="text-sm text-gray-600">Visitor permission requests</p>
          </div>
          <Link href="/notifications">
            <Button variant="outline" size="sm" className="bg-transparent">
              Notifications
            </Button>
          </Link>
        </div>

        {/* Pending Visitors List */}
        <div className="space-y-4">
          {pendingVisitors.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <div className="space-y-2">
                  <p>No pending approvals</p>
                  <Link href="/notifications">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      Check Notifications
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingVisitors.map((visitor) => (
              <Card key={visitor.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <CardTitle className="text-base">{visitor.name}</CardTitle>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visitor.photo_url && (
                    <div className="flex justify-center">
                      <img
                        src={visitor.photo_url || "/placeholder.svg"}
                        alt="Visitor"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    </div>
                  )}

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

                  {visitor.authorities && (
                    <div className="text-sm text-blue-600">
                      Assigned to: {visitor.authorities.name} ({visitor.authorities.designation})
                    </div>
                  )}

                  {visitor.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Notes:</strong> {visitor.notes}
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => handleApproval(visitor.id, true)}
                      disabled={processingId === visitor.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {processingId === visitor.id ? "Processing..." : "Approve"}
                    </Button>

                    <Button
                      onClick={() => handleApproval(visitor.id, false)}
                      disabled={processingId === visitor.id}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {processingId === visitor.id ? "Processing..." : "Reject"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6">
          <Button onClick={fetchPendingVisitors} variant="outline" className="w-full bg-transparent">
            Refresh List
          </Button>
        </div>
      </div>
    </div>
  )
}
