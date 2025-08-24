import { type NextRequest, NextResponse } from "next/server"

// Google Sheets API endpoint for bus entries
export async function POST(request: NextRequest) {
  try {
    const { row } = await request.json()

    const SHEET_ID = process.env.NEXT_PUBLIC_BUS_ENTRIES_SHEET_ID
    const API_KEY = process.env.GOOGLE_SHEETS_API_KEY

    if (!SHEET_ID || !API_KEY) {
      return NextResponse.json({ error: "Google Sheets configuration missing" }, { status: 500 })
    }

    // Google Sheets API URL for appending data
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/BusEntries!A:I:append?valueInputOption=RAW&key=${API_KEY}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [row],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Google Sheets API error:", errorData)
      return NextResponse.json({ error: "Failed to append to Google Sheets" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in buses API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
