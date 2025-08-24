// Google Sheets API integration for gate entry data export

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

// Google Sheets configuration
const GOOGLE_SHEETS_CONFIG = {
  VISITORS_SHEET_ID: process.env.NEXT_PUBLIC_VISITORS_SHEET_ID || "",
  BUS_ENTRIES_SHEET_ID: process.env.NEXT_PUBLIC_BUS_ENTRIES_SHEET_ID || "",
  API_KEY: process.env.GOOGLE_SHEETS_API_KEY || "",
}

// Helper function to format date for Google Sheets
const formatDateForSheets = (date: Date | string): string => {
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

// Export visitor data to Google Sheets
export const exportVisitorToSheets = async (visitorData: VisitorData): Promise<boolean> => {
  try {
    // Prepare data row for Google Sheets
    const row = [
      formatDateForSheets(visitorData.entryTime),
      visitorData.name,
      visitorData.phone,
      visitorData.purpose,
      visitorData.authorityName || "Not Assigned",
      visitorData.status,
      visitorData.exitTime ? formatDateForSheets(visitorData.exitTime) : "",
      visitorData.photoUrl || "",
      visitorData.notes || "",
    ]

    // Use Google Sheets API to append data
    const response = await fetch("/api/google-sheets/visitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ row }),
    })

    if (!response.ok) {
      throw new Error("Failed to export to Google Sheets")
    }

    return true
  } catch (error) {
    console.error("Error exporting visitor to Google Sheets:", error)
    return false
  }
}

// Export bus entry data to Google Sheets
export const exportBusToSheets = async (busData: BusData): Promise<boolean> => {
  try {
    // Prepare data row for Google Sheets
    const row = [
      formatDateForSheets(busData.entryTime),
      busData.busNumber,
      busData.driverName || "",
      busData.driverPhone || "",
      busData.route || "",
      busData.passengerCount?.toString() || "",
      busData.status,
      busData.exitTime ? formatDateForSheets(busData.exitTime) : "",
      busData.notes || "",
    ]

    // Use Google Sheets API to append data
    const response = await fetch("/api/google-sheets/buses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ row }),
    })

    if (!response.ok) {
      throw new Error("Failed to export to Google Sheets")
    }

    return true
  } catch (error) {
    console.error("Error exporting bus to Google Sheets:", error)
    return false
  }
}

// Initialize Google Sheets with headers
export const initializeGoogleSheets = async (): Promise<void> => {
  try {
    // Initialize visitors sheet
    await fetch("/api/google-sheets/init-visitors", {
      method: "POST",
    })

    // Initialize bus entries sheet
    await fetch("/api/google-sheets/init-buses", {
      method: "POST",
    })
  } catch (error) {
    console.error("Error initializing Google Sheets:", error)
  }
}
