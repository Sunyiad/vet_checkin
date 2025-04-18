import { NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize the Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Initialize in-memory token storage if it doesn't exist
if (typeof global.adminResetTokens === "undefined") {
  global.adminResetTokens = {}
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { email } = body

    // Basic validation
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // For demo purposes, only accept the hardcoded admin email
    if (email !== "primaveradvm@gmail.com") {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    // Generate a token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Set expiration to 24 hours from now
    const expires = new Date()
    expires.setHours(expires.getHours() + 24)

    // Store token in memory
    global.adminResetTokens[token] = {
      email,
      expires,
    }

    // Create the reset link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetLink = `${appUrl}/admin/reset-password?token=${token}`

    // Send the email using Resend
    const { data, error: emailError } = await resend.emails.send({
      from: "onboarding@resend.dev", // Use this for testing, change to your verified domain later
      to: email,
      subject: "Reset Your Admin Password",
      text: `
        Password Reset Request
        
        Hello,
        
        We received a request to reset the password for your admin account (${email}).
        
        Click the link below to reset your password:
        ${resetLink}
        
        If you didn't request a password reset, you can ignore this email. The link will expire in 24 hours.
        
        Thank you,
        Vet Clinic Check-in Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>Hello,</p>
          <p>We received a request to reset the password for your admin account (${email}).</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request a password reset, you can ignore this email. The link will expire in 24 hours.</p>
          <p>Thank you,</p>
          <p>Vet Clinic Check-in Team</p>
        </div>
      `,
    })

    if (emailError) {
      throw new Error(emailError.message)
    }

    // For development/demo purposes, still return the token
    // In production, you would remove this
    const isDevelopment = !process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL.includes("localhost")

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully",
      ...(isDevelopment ? { token, emailId: data?.id } : {}),
    })
  } catch (error) {
    console.error("Admin forgot password error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
