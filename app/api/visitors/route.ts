import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: visitors, error } = await supabase
      .from("visitors")
      .select(`
        *,
        authorities (
          name,
          role,
          department
        )
      `)
      .order("entry_time", { ascending: false })

    if (error) {
      console.error("Error fetching visitors:", error)
      return NextResponse.json({ error: "Failed to fetch visitors" }, { status: 500 })
    }

    const formattedVisitors =
      visitors?.map((visitor) => ({
        ...visitor,
        authority_name: visitor.authorities?.name || null,
      })) || []

    return NextResponse.json(formattedVisitors)
  } catch (error) {
    console.error("Error in visitors API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
