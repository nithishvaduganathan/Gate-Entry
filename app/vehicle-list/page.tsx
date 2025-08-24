"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, User, Bus, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface BusEntry {
  id: string
  bus_number: string
  driver_name: string | null
  driver_phone: string | null
  route: string | null
  passenger_count: number | null
  entry_time: string
  exit_time: string | null
  status: string
  notes: string | null
}

export default function BusListPage() {
  const [buses, setBuses] = useState<BusEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "entered" | "exited">("entered")

  useEffect(() => {
    fetchBuses()
  }, [filter])

  const fetchBuses = async () => {
    const supabase = createClient()
    let query = supabase.from("bus_entries").select("*").order("entry_time", { ascending: false }).limit(50)

    if (filter !== "all") {
      query = query.eq("status", filter)
    }

    const { data, error } = await query

    if (data) {
      setBuses(data)
    }
    setIsLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "entered":
        return "bg-green-100 text-green-800"
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center">Loading buses...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Link href="/bus-entry">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bus List</h1>
            <p className="text-sm text-gray-600">College bus entries</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={filter === "entered" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("entered")}
            className={filter === "entered" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            On Campus
          </Button>
          <Button variant={filter === "exited" ? "default" : "outline"} size="sm" onClick={() => setFilter("exited")}>
            Exited
          </Button>
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All
          </Button>
        </div>

        {/* Bus List */}
        <div className="space-y-4">
          {buses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                {filter === "entered" ? "No buses currently on campus" : "No bus entries found"}
              </CardContent>
            </Card>
          ) : (
            buses.map((bus) => (
              <Card key={bus.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Bus className="w-4 h-4 text-gray-500" />
                      <CardTitle className="text-base font-bold">{bus.bus_number}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(bus.status)}>
                      {bus.status === "entered" ? "On Campus" : "Exited"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bus.route && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{bus.route}</span>
                    </div>
                  )}

                  {bus.passenger_count !== null && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{bus.passenger_count} passengers</span>
                    </div>
                  )}

                  {bus.driver_name && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{bus.driver_name}</span>
                      {bus.driver_phone && <span>({bus.driver_phone})</span>}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Entry: {formatTime(bus.entry_time)}</span>
                  </div>

                  {bus.exit_time && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Exit: {formatTime(bus.exit_time)}</span>
                    </div>
                  )}

                  {bus.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Notes:</strong> {bus.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6">
          <Button onClick={fetchBuses} variant="outline" className="w-full bg-transparent">
            Refresh List
          </Button>
        </div>
      </div>
    </div>
  )
}
