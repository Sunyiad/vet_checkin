import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
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

    // Return success response
    return NextResponse.json({ success: true, email: tokenData.email })
  } catch (error) {
    console.error("Verify reset token error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
