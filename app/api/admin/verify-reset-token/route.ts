import { type NextRequest, NextResponse } from "next/server"

// Access the in-memory token store (in a real app, this would be a database)
// This is just for demo purposes
declare global {
  var resetTokens: Record<string, { email: string; expires: Date }> | undefined
}

// Initialize if not exists
if (!global.resetTokens) {
  global.resetTokens = {}
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
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

    return NextResponse.json({ success: true, email: tokenData.email })
  } catch (error) {
    console.error("Verify reset token error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
