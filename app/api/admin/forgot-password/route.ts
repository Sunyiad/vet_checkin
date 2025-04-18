import { type NextRequest, NextResponse } from "next/server"

// In a real app, we would use a database to store reset tokens
// For this demo, we'll use a simple in-memory store
const resetTokens: Record<string, { email: string; expires: Date }> = {}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // In a real app, we would verify that the email exists in the database
    // For this demo, we'll accept any email that matches our hardcoded admin
    if (email !== "primaveradvm@gmail.com") {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    // Generate a token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Set expiration to 1 hour from now
    const expires = new Date()
    expires.setHours(expires.getHours() + 1)

    // Store the token
    resetTokens[token] = { email, expires }

    // In a real app, we would send an email with the reset link
    // For this demo, we'll just return the token

    return NextResponse.json({ success: true, token })
  } catch (error) {
    console.error("Admin forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
