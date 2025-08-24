"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Bus, Clock, User, FileText } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { sendToWebhook } from "@/lib/csv-export"
import SimpleLayout from "@/components/protected-layout"

export default function BusEntryPage() {
  const [formData, setFormData] = useState({
    busNumber: "",
    driverName: "",
    driverPhone: "",
    route: "",
    passengerCount: "",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("bus_entries")
        .insert({
          bus_number: formData.busNumber,
          driver_name: formData.driverName || null,
          driver_phone: formData.driverPhone || null,
          route: formData.route || null,
          passenger_count: formData.passengerCount ? Number.parseInt(formData.passengerCount) : null,
          notes: formData.notes || null,
          created_by: "Gatekeeper", // This would be dynamic in real app
          status: "entered",
        })
        .select()
        .single()

      if (error) throw error

      const webhookSuccess = await sendToWebhook(
        {
          busNumber: formData.busNumber,
          driverName: formData.driverName || undefined,
          driverPhone: formData.driverPhone || undefined,
          route: formData.route || undefined,
          passengerCount: formData.passengerCount ? Number.parseInt(formData.passengerCount) : undefined,
          entryTime: new Date().toISOString(),
          status: "entered",
          notes: formData.notes || undefined,
        },
        "bus",
      )

      // Reset form
      setFormData({
        busNumber: "",
        driverName: "",
        driverPhone: "",
        route: "",
        passengerCount: "",
        notes: "",
      })

      if (webhookSuccess) {
        alert("Bus entry registered successfully and sent to external system!")
      } else {
        alert("Bus entry registered successfully! (External system integration not configured)")
      }
    } catch (error) {
      console.error("Error registering bus entry:", error)
      alert("Error registering bus entry. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SimpleLayout title="Vehicle Entry" description="Register new vehicles" showBackButton={true}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6 pt-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bus Entry</h1>
              <p className="text-sm text-gray-600">Register college bus entry</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bus Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Bus className="w-4 h-4 mr-2" />
                  Bus Information
                </CardTitle>
                <CardDescription>Enter bus details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="busNumber">Bus Number *</Label>
                  <Input
                    id="busNumber"
                    type="text"
                    placeholder="e.g., KA-01-AB-1234"
                    value={formData.busNumber}
                    onChange={(e) => setFormData({ ...formData, busNumber: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="route">Route</Label>
                  <Input
                    id="route"
                    type="text"
                    placeholder="e.g., City Center - College"
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passengerCount">Passenger Count</Label>
                  <Input
                    id="passengerCount"
                    type="number"
                    placeholder="Number of passengers"
                    min="0"
                    max="100"
                    value={formData.passengerCount}
                    onChange={(e) => setFormData({ ...formData, passengerCount: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Driver Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Driver Information
                </CardTitle>
                <CardDescription>Optional driver details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="driverName">Driver Name</Label>
                  <Input
                    id="driverName"
                    type="text"
                    placeholder="Enter driver's name"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driverPhone">Driver Phone</Label>
                  <Input
                    id="driverPhone"
                    type="tel"
                    placeholder="+91-XXXXXXXXXX"
                    value={formData.driverPhone}
                    onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Entry Time Display */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Entry Time: {new Date().toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
              disabled={isLoading || !formData.busNumber}
            >
              {isLoading ? "Registering..." : "Register Bus Entry"}
            </Button>
          </form>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Link href="/bus-list">
              <Button variant="outline" className="w-full bg-transparent">
                View Buses
              </Button>
            </Link>
            <Link href="/bus-exit">
              <Button variant="outline" className="w-full bg-transparent">
                Exit Bus
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </SimpleLayout>
  )
}