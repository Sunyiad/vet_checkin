import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Use the service role to bypass RLS policies
    const supabase = createRouteHandlerClient(
      {
        cookies,
      },
      {
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    )

    // Fetch all clinics
    const { data, error } = await supabase.from("clinics").select("*").order("email", { ascending: true })

    if (error) {
      console.error("Error fetching clinics:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
