import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { clinicId } = await request.json()

    if (!clinicId) {
      return NextResponse.json({ success: false, error: "Clinic ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get the clinic email for deleting signup codes
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("email")
      .eq("id", clinicId)
      .single()

    if (clinicError) {
      return NextResponse.json({ success: false, error: "Clinic not found" }, { status: 404 })
    }

    // Execute a transaction to delete all related data
    const { error: transactionError } = await supabase.rpc("delete_clinic_cascade", {
      clinic_id_param: clinicId,
      clinic_email_param: clinic.email,
    })

    if (transactionError) {
      console.error("Transaction error:", transactionError)
      return NextResponse.json({ success: false, error: transactionError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting clinic:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
