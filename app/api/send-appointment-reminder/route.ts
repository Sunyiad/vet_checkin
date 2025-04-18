import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ownerEmail, ownerName, petName, appointmentDate, appointmentTime, doctorName } = body

    if (!ownerEmail || !petName || !appointmentDate) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // Change to your verified domain in production
      to: ownerEmail,
      subject: `Appointment Reminder for ${petName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Appointment Reminder</h1>
          <p>Hello ${ownerName},</p>
          <p>This is a friendly reminder about your upcoming appointment for ${petName}.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
            ${appointmentTime ? `<p style="margin: 5px 0;"><strong>Time:</strong> ${appointmentTime}</p>` : ""}
            ${doctorName ? `<p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>` : ""}
          </div>
          <p>If you need to reschedule, please call our office at least 24 hours in advance.</p>
          <p>Thank you,</p>
          <p>The Vet Clinic Team</p>
        </div>
      `,
    })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      message: "Appointment reminder email sent",
      id: data?.id,
    })
  } catch (error) {
    console.error("Error sending appointment reminder:", error)
    return NextResponse.json(
      {
        error: "Failed to send reminder email",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
