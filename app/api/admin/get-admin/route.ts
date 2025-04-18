import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Use the service role to bypass RLS policies
    const serviceRoleSupabase = createRouteHandlerClient(
      {
        cookies,
      },
      {
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    )

    // Get the admin email from the query params
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Fetch the admin using the service role client
    const { data: admin, error } = await serviceRoleSupabase.from("admins").select("*").eq("email", email).single()

    if (error) {
      console.error("Error fetching admin:", error)
      return NextResponse.json({ error: "Failed to fetch admin" }, { status: 500 })
    }

    return NextResponse.json(admin)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
