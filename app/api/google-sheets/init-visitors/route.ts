import { type NextRequest, NextResponse } from "next/server"

// Initialize visitors Google Sheet with headers
export async function POST(request: NextRequest) {
  try {
    const SHEET_ID = process.env.NEXT_PUBLIC_VISITORS_SHEET_ID
    const API_KEY = process.env.GOOGLE_SHEETS_API_KEY

    if (!SHEET_ID || !API_KEY) {
      return NextResponse.json({ error: "Google Sheets configuration missing" }, { status: 500 })
    }

    // Headers for visitors sheet
    const headers = [
      "Entry Time",
      "Visitor Name",
      "Phone Number",
      "Purpose",
      "Authority",
      "Status",
      "Exit Time",
      "Photo URL",
      "Notes",
    ]

    // Google Sheets API URL for updating data
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Visitors!A1:I1?valueInputOption=RAW&key=${API_KEY}`

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
    console.error("Error initializing visitors sheet:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
