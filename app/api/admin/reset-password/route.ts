import { type NextRequest, NextResponse } from "next/server"

// Access the in-memory token store (in a real app, this would be a database)
declare global {
  var resetTokens: Record<string, { email: string; expires: Date }> | undefined
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    // Check if token exists and is valid
    const tokenData = global.resetTokens?.[token]

    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    // Check if token is expired
    if (new Date() > tokenData.expires) {
      // Remove expired token
      delete global.resetTokens[token]
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    // In a real app, we would update the admin's password in the database
    // For this demo, we'll just pretend we did

    // Remove the used token
    delete global.resetTokens[token]

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
