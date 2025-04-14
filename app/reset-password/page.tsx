"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClientSupabaseClient } from "@/lib/supabase"

export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isVerifying, setIsVerifying] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  // Update the clinicName state to use email instead
  const [clinicEmail, setClinicEmail] = useState("")

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link")
      setIsVerifying(false)
      return
    }

    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      const supabase = createClientSupabaseClient()

      // Verify the token
      const { data, error } = await supabase
        .from("password_reset_tokens")
        .select("*, clinic:clinic_id(*)")
        .eq("token", token)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (error || !data) {
        setError("Invalid or expired reset link")
        return
      }

      // Update the verifyToken function to set clinic email
      // Set clinic email for display
      setClinicEmail(data.clinic.email)
    } catch (err) {
      console.error("Token verification error:", err)
      setError("An error occurred")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsResetting(true)
    setError("")

    try {
      const supabase = createClientSupabaseClient()

      // Verify the token again
      const { data, error } = await supabase
        .from("password_reset_tokens")
        .select("clinic_id")
        .eq("token", token)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (error || !data) {
        setError("Invalid or expired reset link")
        return
      }

      // Update the clinic's password
      const { error: updateError } = await supabase
        .from("clinics")
        .update({ password }) // In a real app, you'd hash this password
        .eq("id", data.clinic_id)

      if (updateError) {
        console.error("Error updating password:", updateError)
        setError("Failed to update password")
        return
      }

      // Mark the token as used
      await supabase.from("password_reset_tokens").update({ used: true }).eq("token", token)

      setSuccess(true)
    } catch (err) {
      console.error("Password reset error:", err)
      setError("An error occurred")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>

        {isVerifying ? (
          <p>Verifying reset link...</p>
        ) : error && !clinicEmail ? (
          <div className="space-y-6">
            <div className="bg-red-900/30 border border-red-700 p-4 rounded-sm">
              <p>{error}</p>
            </div>
            <Link href="/login" className="block text-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm">
              Back to Login
            </Link>
          </div>
        ) : success ? (
          <div className="space-y-6">
            <div className="bg-green-900/30 border border-green-700 p-4 rounded-sm">
              <p>Your password has been successfully reset.</p>
            </div>
            <Link href="/login" className="block text-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* Update the display to show email instead of name */}
            <div className="bg-gray-900/50 p-4 rounded-sm mb-4">
              <p>
                Resetting password for <span className="font-medium">{clinicEmail}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                required
                minLength={8}
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex justify-end space-x-4">
              <Link href="/login" className="px-4 py-2 bg-transparent hover:underline">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isResetting}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm"
              >
                {isResetting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
