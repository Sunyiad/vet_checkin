import { NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize the Resend client
// Vercel automatically injects the RESEND_API_KEY environment variable
// when you add the Resend integration
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  try {
    // Get the recipient email from query params
    const url = new URL(request.url)
    const email = url.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    // Send a test email using Resend
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // Use this for testing, change to your verified domain later
      to: email,
      subject: "Test Email from Vet Checkin App",
      text: "This is a test email to verify that email integration is working correctly.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Test Email</h1>
          <p>This is a test email to verify that email integration is working correctly.</p>
          <p>If you're seeing this, your email integration is set up properly!</p>
        </div>
      `,
    })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      id: data?.id,
    })
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      {
        error: "Failed to send test email",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
