import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all tokens from the database
    const { data: dbTokens, error } = await supabase
      .from("admin_reset_tokens")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tokens:", error)
      return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 })
    }

    // Get in-memory tokens
    const memoryTokens = global.adminResetTokens || {}

    const memoryTokensList = Object.keys(memoryTokens).map((token) => {
      const { email, expires } = memoryTokens[token]
      return {
        token: token.substring(0, 3) + "..." + token.substring(token.length - 3),
        email,
        expires,
        storage: "memory",
      }
    })

    // Format database tokens for safe display
    const dbTokensList = dbTokens.map((token) => ({
      id: token.id,
      token: token.token.substring(0, 3) + "..." + token.token.substring(token.token.length - 3),
      email: token.email,
      expires_at: token.expires_at,
      used: token.used,
      created_at: token.created_at,
      storage: "database",
    }))

    return NextResponse.json({
      dbTokens: dbTokensList,
      memoryTokens: memoryTokensList,
      dbTokenCount: dbTokensList.length,
      memoryTokenCount: memoryTokensList.length,
    })
  } catch (error) {
    console.error("List tokens error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear all expired or used tokens
    const supabase = createServerSupabaseClient()

    // Delete expired tokens
    const now = new Date().toISOString()
    const { error } = await supabase.from("admin_reset_tokens").delete().or(`expires_at.lt.${now},used.eq.true`)

    if (error) {
      console.error("Error clearing tokens:", error)
      return NextResponse.json({ error: "Failed to clear tokens" }, { status: 500 })
    }

    // Clear expired in-memory tokens
    const memoryTokens = global.adminResetTokens || {}
    const now2 = new Date()

    Object.keys(memoryTokens).forEach((token) => {
      if (now2 > memoryTokens[token].expires) {
        delete memoryTokens[token]
      }
    })

    return NextResponse.json({ success: true, message: "Expired and used tokens cleared" })
  } catch (error) {
    console.error("Clear tokens error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
