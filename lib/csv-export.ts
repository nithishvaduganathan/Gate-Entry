interface VisitorData {
  name: string
  phone: string
  purpose: string
  entryTime: string
  exitTime?: string
  authorityName?: string
  status: string
  photoUrl?: string
  notes?: string
}

interface BusData {
  busNumber: string
  driverName?: string
  driverPhone?: string
  route?: string
  passengerCount?: number
  entryTime: string
  exitTime?: string
  status: string
  notes?: string
}

// Helper function to format date for CSV
const formatDateForCSV = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// Convert array of objects to CSV string
const arrayToCSV = (data: any[], headers: string[]): string => {
  const csvRows = []

  // Add headers
  csvRows.push(headers.join(","))

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header] || ""
      // Escape commas and quotes in CSV
      return `"${String(value).replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(","))
  }

  return csvRows.join("\n")
}

// Export visitors data as CSV
export const exportVisitorsToCSV = async (): Promise<void> => {
  try {
    const response = await fetch("/api/visitors")
    const visitors = await response.json()

    const headers = ["Entry Time", "Name", "Phone", "Purpose", "Authority", "Status", "Exit Time", "Photo URL", "Notes"]

    const csvData = visitors.map((visitor: any) => ({
      "Entry Time": formatDateForCSV(visitor.entry_time),
      Name: visitor.name,
      Phone: visitor.phone,
      Purpose: visitor.purpose,
      Authority: visitor.authority_name || "Not Assigned",
      Status: visitor.status,
      "Exit Time": visitor.exit_time ? formatDateForCSV(visitor.exit_time) : "",
      "Photo URL": visitor.photo_url || "",
      Notes: visitor.notes || "",
    }))

    const csv = arrayToCSV(csvData, headers)

    // Download CSV file
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `visitors_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error exporting visitors to CSV:", error)
    throw error
  }
}

// Export bus entries data as CSV
export const exportBusesToCSV = async (): Promise<void> => {
  try {
    const response = await fetch("/api/vehicle-entries")
    const buses = await response.json()

    const headers = [
      "Entry Time",
      "Vehicle Number",
      "Driver Name",
      "Driver Phone",
      "Route",
      "Passenger Count",
      "Status",
      "Exit Time",
      "Notes",
    ]

    const csvData = buses.map((bus: any) => ({
      "Entry Time": formatDateForCSV(bus.entry_time),
      "Vehicle Number": bus.bus_number,
      "Driver Name": bus.driver_name || "",
      "Driver Phone": bus.driver_phone || "",
      Route: bus.route || "",
      "Passenger Count": bus.passenger_count?.toString() || "",
      Status: bus.status,
      "Exit Time": bus.exit_time ? formatDateForCSV(bus.exit_time) : "",
      Notes: bus.notes || "",
    }))

    const csv = arrayToCSV(csvData, headers)

    // Download CSV file
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vehicle_entries_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error exporting vehicles to CSV:", error)
    throw error
  }
}

// Simple webhook function for real-time Google Sheets integration (optional)
export const sendToWebhook = async (data: any, type: "visitor" | "bus"): Promise<boolean> => {
  try {
    // This can be used with services like Zapier, Make.com, or IFTTT
    const webhookUrl =
      type === "visitor" ? process.env.NEXT_PUBLIC_VISITOR_WEBHOOK_URL : process.env.NEXT_PUBLIC_BUS_WEBHOOK_URL

    if (!webhookUrl) {
      console.log("No webhook URL configured, skipping webhook")
      return false
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    return response.ok
  } catch (error) {
    console.error("Error sending to webhook:", error)
    return false
  }
}
