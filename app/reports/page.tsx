"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Filter, BarChart3, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { exportVisitorsToCSV, exportBusesToCSV } from "@/lib/csv-export"

interface ReportData {
  visitors: any[]
  buses: any[]
  summary: {
    totalVisitors: number
    totalBuses: number
    approvedVisitors: number
    rejectedVisitors: number
    pendingVisitors: number
  }
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    reportType: "all",
    status: "all",
  })

  useEffect(() => {
    // Set default date range (last 7 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    setFilters((prev) => ({
      ...prev,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    }))
  }, [])

  const generateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert("Please select both start and end dates")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      const startDateTime = new Date(filters.startDate + "T00:00:00").toISOString()
      const endDateTime = new Date(filters.endDate + "T23:59:59").toISOString()

      // Fetch visitors data
      let visitorsQuery = supabase
        .from("visitors")
        .select(`
          *,
          authorities (
            name,
            designation
          )
        `)
        .gte("entry_time", startDateTime)
        .lte("entry_time", endDateTime)
        .order("entry_time", { ascending: false })

      if (filters.status !== "all") {
        visitorsQuery = visitorsQuery.eq("status", filters.status)
      }

      // Fetch buses data
      let busesQuery = supabase
        .from("bus_entries")
        .select("*")
        .gte("entry_time", startDateTime)
        .lte("entry_time", endDateTime)
        .order("entry_time", { ascending: false })

      if (filters.status !== "all" && filters.status !== "pending") {
        busesQuery = busesQuery.eq("status", filters.status === "approved" ? "entered" : filters.status)
      }

      const [visitorsResult, busesResult] = await Promise.all([visitorsQuery, busesQuery])

      const visitors = visitorsResult.data || []
      const buses = busesResult.data || []

      // Calculate summary
      const summary = {
        totalVisitors: visitors.length,
        totalBuses: buses.length,
        approvedVisitors: visitors.filter((v) => v.status === "approved").length,
        rejectedVisitors: visitors.filter((v) => v.status === "rejected").length,
        pendingVisitors: visitors.filter((v) => v.status === "pending").length,
      }

      setReportData({
        visitors: filters.reportType === "buses" ? [] : visitors,
        buses: filters.reportType === "visitors" ? [] : buses,
        summary,
      })
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Error generating report. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    let csvContent = ""

    if (filters.reportType === "all" || filters.reportType === "visitors") {
      csvContent += "VISITORS REPORT\n"
      csvContent += "Entry Time,Name,Phone,Purpose,Authority,Status,Exit Time,Notes\n"

      reportData.visitors.forEach((visitor) => {
        const row = [
          new Date(visitor.entry_time).toLocaleString("en-IN"),
          visitor.name,
          visitor.phone,
          visitor.purpose,
          visitor.authorities ? `${visitor.authorities.name} (${visitor.authorities.designation})` : "Not Assigned",
          visitor.status,
          visitor.exit_time ? new Date(visitor.exit_time).toLocaleString("en-IN") : "",
          visitor.notes || "",
        ]
          .map((field) => `"${field}"`)
          .join(",")

        csvContent += row + "\n"
      })

      csvContent += "\n"
    }

    if (filters.reportType === "all" || filters.reportType === "buses") {
      csvContent += "BUS ENTRIES REPORT\n"
      csvContent += "Entry Time,Bus Number,Driver Name,Driver Phone,Route,Passenger Count,Status,Exit Time,Notes\n"

      reportData.buses.forEach((bus) => {
        const row = [
          new Date(bus.entry_time).toLocaleString("en-IN"),
          bus.bus_number,
          bus.driver_name || "",
          bus.driver_phone || "",
          bus.route || "",
          bus.passenger_count || "",
          bus.status,
          bus.exit_time ? new Date(bus.exit_time).toLocaleString("en-IN") : "",
          bus.notes || "",
        ]
          .map((field) => `"${field}"`)
          .join(",")

        csvContent += row + "\n"
      })
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `gate-entry-report-${filters.startDate}-to-${filters.endDate}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportVisitors = async () => {
    setIsExporting(true)
    try {
      await exportVisitorsToCSV()
    } catch (error) {
      console.error("Error exporting visitors:", error)
      alert("Error exporting visitors data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportBuses = async () => {
    setIsExporting(true)
    try {
      await exportBusesToCSV()
    } catch (error) {
      console.error("Error exporting buses:", error)
      alert("Error exporting buses data. Please try again.")
    } finally {
      setIsExporting(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-600">Generate and export reports</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Quick Export
            </CardTitle>
            <CardDescription>Export all data to CSV files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleExportVisitors}
              disabled={isExporting}
              variant="outline"
              className="w-full bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export All Visitors"}
            </Button>
            <Button
              onClick={handleExportBuses}
              disabled={isExporting}
              variant="outline"
              className="w-full bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export All Buses"}
            </Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Report Filters
            </CardTitle>
            <CardDescription>Configure report parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select
                value={filters.reportType}
                onValueChange={(value) => setFilters({ ...filters, reportType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entries</SelectItem>
                  <SelectItem value="visitors">Visitors Only</SelectItem>
                  <SelectItem value="buses">Buses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Filter</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="entered">Entered</SelectItem>
                  <SelectItem value="exited">Exited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateReport} disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              {isLoading ? "Generating..." : "Generate Report"}
            </Button>
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportData && (
          <>
            {/* Summary */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Report Summary</CardTitle>
                <CardDescription>
                  {filters.startDate} to {filters.endDate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{reportData.summary.totalVisitors}</div>
                    <div className="text-sm text-gray-600">Total Visitors</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{reportData.summary.totalBuses}</div>
                    <div className="text-sm text-gray-600">Total Buses</div>
                  </div>
                </div>

                {reportData.summary.totalVisitors > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <div className="font-semibold text-green-600">{reportData.summary.approvedVisitors}</div>
                        <div className="text-gray-600">Approved</div>
                      </div>
                      <div>
                        <div className="font-semibold text-yellow-600">{reportData.summary.pendingVisitors}</div>
                        <div className="text-gray-600">Pending</div>
                      </div>
                      <div>
                        <div className="font-semibold text-red-600">{reportData.summary.rejectedVisitors}</div>
                        <div className="text-gray-600">Rejected</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Button */}
            <div className="mb-6">
              <Button onClick={exportToCSV} variant="outline" className="w-full bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export Filtered Report to CSV
              </Button>
            </div>

            {/* Recent Entries Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Entries Preview</CardTitle>
                <CardDescription>Latest 5 entries from report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...reportData.visitors, ...reportData.buses]
                    .sort((a, b) => new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime())
                    .slice(0, 5)
                    .map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{entry.name || entry.bus_number}</div>
                          <div className="text-xs text-gray-600">{formatTime(entry.entry_time)}</div>
                        </div>
                        <div className="text-xs text-gray-500">{entry.name ? "Visitor" : "Bus"}</div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
