"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Clock, User, LogOut } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Visitor {
  id: string
  name: string
  phone: string
  purpose: string
  entry_time: string
  status: string
}

export default function VisitorExitPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExiting, setIsExiting] = useState<string | null>(null)

  const searchVisitors = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("visitors")
      .select("id, name, phone, purpose, entry_time, status")
      .or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      .is("exit_time", null)
      .in("status", ["pending", "approved"])
      .order("entry_time", { ascending: false })

    if (data) {
      setVisitors(data)
    }
    setIsLoading(false)
  }

  const handleExit = async (visitorId: string) => {
    setIsExiting(visitorId)
    const supabase = createClient()

    const { error } = await supabase
      .from("visitors")
      .update({
        exit_time: new Date().toISOString(),
        status: "exited",
      })
      .eq("id", visitorId)

    if (!error) {
      setVisitors(visitors.filter((v) => v.id !== visitorId))
      alert("Visitor exit recorded successfully!")
    } else {
      alert("Error recording exit. Please try again.")
    }
    setIsExiting(null)
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
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
            <h1 className="text-xl font-bold text-gray-900">Visitor Exit</h1>
            <p className="text-sm text-gray-600">Record visitor departure</p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search Visitor
            </CardTitle>
            <CardDescription>Search by name or phone number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Name or Phone Number</Label>
              <Input
                id="search"
                type="text"
                placeholder="Enter name or phone number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchVisitors()}
              />
            </div>
            <Button onClick={searchVisitors} className="w-full" disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? "Searching..." : "Search Visitors"}
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        <div className="space-y-4">
          {visitors.length === 0 && searchQuery && !isLoading && (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">No active visitors found</CardContent>
            </Card>
          )}

          {visitors.map((visitor) => (
            <Card key={visitor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <CardTitle className="text-base">{visitor.name}</CardTitle>
                  </div>
                  <Badge
                    className={
                      visitor.status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {visitor.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Phone:</strong> {visitor.phone}
                  </p>
                  <p>
                    <strong>Purpose:</strong> {visitor.purpose}
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Entry: {formatTime(visitor.entry_time)}</span>
                </div>

                <Button
                  onClick={() => handleExit(visitor.id)}
                  disabled={isExiting === visitor.id}
                  className="w-full flex items-center justify-center space-x-2"
                  variant="destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isExiting === visitor.id ? "Recording Exit..." : "Record Exit"}</span>
                </Button>
              </CardContent>
            </Card>
          ))}
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
  )
}
