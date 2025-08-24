import { type NextRequest, NextResponse } from "next/server"

// Initialize bus entries Google Sheet with headers
export async function POST(request: NextRequest) {
  try {
    const SHEET_ID = process.env.NEXT_PUBLIC_BUS_ENTRIES_SHEET_ID
    const API_KEY = process.env.GOOGLE_SHEETS_API_KEY

    if (!SHEET_ID || !API_KEY) {
      return NextResponse.json({ error: "Google Sheets configuration missing" }, { status: 500 })
    }

    // Headers for bus entries sheet
    const headers = [
      "Entry Time",
      "Bus Number",
      "Driver Name",
      "Driver Phone",
      "Route",
      "Passenger Count",
      "Status",
      "Exit Time",
      "Notes",
    ]

    // Google Sheets API URL for updating data
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/BusEntries!A1:I1?valueInputOption=RAW&key=${API_KEY}`

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [headers],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Google Sheets API error:", errorData)
      return NextResponse.json({ error: "Failed to initialize Google Sheets" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error initializing bus entries sheet:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
