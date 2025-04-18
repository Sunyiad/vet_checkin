import { NextResponse } from "next/server"
import { sendEmail } from "@vercel/email"

export async function GET(request: Request) {
  try {
    // Get the recipient email from query params
    const url = new URL(request.url)
    const email = url.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    // Send a test email
    await sendEmail({
      to: email,
      from: "noreply@yourdomain.com", // Replace with your verified domain
      subject: "Test Email from Vet Checkin App",
      text: "This is a test email to verify that Vercel Email integration is working correctly.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Test Email</h1>
          <p>This is a test email to verify that Vercel Email integration is working correctly.</p>
          <p>If you're seeing this, your Vercel Email integration is set up properly!</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
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
