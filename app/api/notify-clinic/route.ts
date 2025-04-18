import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createServerSupabaseClient } from "@/lib/supabase"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { petId, clinicId } = body

    if (!petId || !clinicId) {
      return NextResponse.json({ error: "Pet ID and Clinic ID are required" }, { status: 400 })
    }

    // Get pet details
    const supabase = createServerSupabaseClient()
    const { data: pet, error: petError } = await supabase
      .from("pets")
      .select(`
        *,
        doctor:doctor_id (name)
      `)
      .eq("id", petId)
      .single()

    if (petError || !pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    // Get clinic details
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("email, name")
      .eq("id", clinicId)
      .single()

    if (clinicError || !clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
    }

    // Format symptoms
    const symptoms = []
    if (pet.coughing) symptoms.push("Coughing")
    if (pet.sneezing) symptoms.push("Sneezing")
    if (pet.vomiting) symptoms.push("Vomiting")
    if (pet.diarrhea) symptoms.push("Diarrhea")

    const symptomsText = symptoms.length > 0 ? symptoms.join(", ") : "None reported"

    // Send notification email to clinic
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // Change to your verified domain in production
      to: clinic.email,
      subject: `New Check-in: ${pet.pet_name} (${pet.is_sick ? "SICK" : "Healthy"})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">New Pet Check-in</h1>
          <p>A new pet has checked in at your clinic.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">Pet Information</h2>
            <p><strong>Pet Name:</strong> ${pet.pet_name}</p>
            <p><strong>Owner:</strong> ${pet.owner_name}</p>
            <p><strong>Species:</strong> ${pet.species}</p>
            <p><strong>Doctor:</strong> ${pet.doctor?.name || "Not assigned"}</p>
            <p><strong>Health Status:</strong> ${pet.is_sick ? "SICK" : "Healthy"}</p>
            ${
              pet.is_sick
                ? `
              <div style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
                <p><strong>Symptoms:</strong> ${symptomsText}</p>
                <p><strong>General Info:</strong> ${pet.general_info || "None provided"}</p>
              </div>
            `
                : ""
            }
          </div>
          
          <p>Please check the dashboard for complete details.</p>
        </div>
      `,
    })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      message: "Clinic notification email sent",
      id: data?.id,
    })
  } catch (error) {
    console.error("Error sending clinic notification:", error)
    return NextResponse.json(
      {
        error: "Failed to send notification email",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
