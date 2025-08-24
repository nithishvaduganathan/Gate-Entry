import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: busEntries, error } = await supabase
      .from("bus_entries")
      .select("*")
      .order("entry_time", { ascending: false })

    if (error) {
      console.error("Error fetching bus entries:", error)
      return NextResponse.json({ error: "Failed to fetch bus entries" }, { status: 500 })
    }

    return NextResponse.json(busEntries || [])
  } catch (error) {
    console.error("Error in bus entries API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
