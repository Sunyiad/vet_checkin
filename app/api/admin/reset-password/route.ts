import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    // Validate inputs
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    // Check if token exists in memory
    const tokenData = global.adminResetTokens?.[token]
    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    // Check if token is expired
    if (new Date() > tokenData.expires) {
      delete global.adminResetTokens[token]
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    const email = tokenData.email

    // In a real app, we would update the password in the database
    // For this demo, we'll just pretend it worked
    console.log(`Password reset for ${email} successful`)

    // Remove the used token
    delete global.adminResetTokens[token]

    // Return success response
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
