import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { Resend } from "resend"
import { AdminResetPasswordEmail } from "@/lib/email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if admin exists
    const { data: admin, error: adminError } = await supabase.from("admins").select("id").eq("email", email).single()

    if (adminError || !admin) {
      // Don't reveal if the email exists or not for security
      return NextResponse.json({ success: true })
    }

    // Generate a unique token
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token valid for 24 hours

    // Store the token in the database
    const { error: tokenError } = await supabase.from("admin_reset_tokens").insert({
      admin_id: admin.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

    if (tokenError) {
      console.error("Error creating reset token:", tokenError)
      return NextResponse.json({ error: "Failed to create reset token" }, { status: 500 })
    }

    // Send the reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password?token=${token}`

    await resend.emails.send({
      from: "Vet Check-in <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your Admin Password",
      react: AdminResetPasswordEmail({ resetUrl }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in forgot password:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
