import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Only return non-sensitive information about tokens
    const tokens = global.adminResetTokens || {}

    const safeTokens = Object.keys(tokens).map((token) => {
      const { email, expires } = tokens[token]
      return {
        token: token.substring(0, 3) + "..." + token.substring(token.length - 3),
        email: email.substring(0, 3) + "..." + email.substring(email.indexOf("@")),
        expires,
        isExpired: new Date() > expires,
      }
    })

    return NextResponse.json({
      tokenCount: Object.keys(tokens).length,
      tokens: safeTokens,
    })
  } catch (error) {
    console.error("Debug tokens error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
