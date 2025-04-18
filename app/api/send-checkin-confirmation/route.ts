import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ownerEmail, ownerName, petName, appointmentTime, doctorName } = body

    if (!ownerEmail || !petName) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // Change to your verified domain in production
      to: ownerEmail,
      subject: `Check-in Confirmation for ${petName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Check-in Confirmation</h1>
          <p>Hello ${ownerName},</p>
          <p>Thank you for checking in ${petName} at our clinic.</p>
          ${appointmentTime ? `<p>Your appointment is scheduled for: <strong>${appointmentTime}</strong></p>` : ""}
          ${doctorName ? `<p>You'll be seeing: <strong>Dr. ${doctorName}</strong></p>` : ""}
          <p>If you need to cancel or reschedule, please call our office.</p>
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
      message: "Check-in confirmation email sent",
      id: data?.id,
    })
  } catch (error) {
    console.error("Error sending check-in confirmation:", error)
    return NextResponse.json(
      {
        error: "Failed to send confirmation email",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
