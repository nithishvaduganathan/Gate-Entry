"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Clock, Bus, LogOut, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface BusEntry {
  id: string
  bus_number: string
  driver_name: string | null
  route: string | null
  passenger_count: number | null
  entry_time: string
  status: string
}

export default function BusExitPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [buses, setBuses] = useState<BusEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExiting, setIsExiting] = useState<string | null>(null)

  const searchBuses = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("bus_entries")
      .select("id, bus_number, driver_name, route, passenger_count, entry_time, status")
      .ilike("bus_number", `%${searchQuery}%`)
      .eq("status", "entered")
      .is("exit_time", null)
      .order("entry_time", { ascending: false })

    if (data) {
      setBuses(data)
    }
    setIsLoading(false)
  }

  const handleExit = async (busId: string) => {
    setIsExiting(busId)
    const supabase = createClient()

    const { error } = await supabase
      .from("bus_entries")
      .update({
        exit_time: new Date().toISOString(),
        status: "exited",
      })
      .eq("id", busId)

    if (!error) {
      setBuses(buses.filter((b) => b.id !== busId))
      alert("Bus exit recorded successfully!")
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
            <h1 className="text-xl font-bold text-gray-900">Bus Exit</h1>
            <p className="text-sm text-gray-600">Record bus departure</p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search Bus
            </CardTitle>
            <CardDescription>Search by bus number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Bus Number</Label>
              <Input
                id="search"
                type="text"
                placeholder="Enter bus number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && searchBuses()}
              />
            </div>
            <Button
              onClick={searchBuses}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? "Searching..." : "Search Buses"}
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        <div className="space-y-4">
          {buses.length === 0 && searchQuery && !isLoading && (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">No buses found on campus</CardContent>
            </Card>
          )}

          {buses.map((bus) => (
            <Card key={bus.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Bus className="w-4 h-4 text-gray-500" />
                    <CardTitle className="text-base font-bold">{bus.bus_number}</CardTitle>
                  </div>
                  <Badge className="bg-green-100 text-green-800">On Campus</Badge>
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
                  <div className="text-sm text-gray-600">
                    <strong>Driver:</strong> {bus.driver_name}
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Entry: {formatTime(bus.entry_time)}</span>
                </div>

                <Button
                  onClick={() => handleExit(bus.id)}
                  disabled={isExiting === bus.id}
                  className="w-full flex items-center justify-center space-x-2"
                  variant="destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isExiting === bus.id ? "Recording Exit..." : "Record Exit"}</span>
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
