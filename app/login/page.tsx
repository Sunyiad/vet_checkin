"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientSupabaseClient } from "@/lib/supabase"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [forgotPassword, setForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetLink, setResetLink] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClientSupabaseClient()

      // In a real app, you'd use Supabase Auth
      // For this demo, we'll just query the clinics table
      const { data, error } = await supabase
        .from("clinics")
        .select()
        .eq("email", email)
        .eq("password", password)
        .single()

      if (error || !data) {
        setError("Invalid email or password")
        return
      }

      // Store clinic info in localStorage (in a real app, use Supabase Auth session)
      localStorage.setItem("clinic", JSON.stringify(data))

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      setError("An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setResetLink(null)

    try {
      const supabase = createClientSupabaseClient()

      // Check if the email exists
      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .select("id")
        .eq("email", email)
        .single()

      if (clinicError || !clinicData) {
        setError("Email not found")
        return
      }

      // Generate a random token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // Set expiration to 24 hours from now
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Insert the token into the password_reset_tokens table
      const { error: insertError } = await supabase.from("password_reset_tokens").insert({
        clinic_id: clinicData.id,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

      if (insertError) {
        console.error("Error creating reset token:", insertError)
        setError("Failed to create password reset token")
        return
      }

      // In a real app, you would send an email with the reset link
      // For this demo, we'll display the link directly in the UI
      const resetUrl = `${window.location.origin}/reset-password?token=${token}`
      setResetLink(resetUrl)
      setResetEmailSent(true)
    } catch (err) {
      console.error("Password reset error:", err)
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/")
  }

  const handleAdminLogin = () => {
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Clinic Login</h1>
          <button onClick={handleAdminLogin} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-sm">
            Admin Login
          </button>
        </div>

        {forgotPassword ? (
          resetEmailSent ? (
            <div className="space-y-6">
              <div className="bg-green-900/30 border border-green-700 p-4 rounded-sm">
                <p className="mb-2">Password reset link has been created.</p>
                {resetLink && (
                  <div className="mt-4">
                    <p className="text-sm mb-2">Since this is a demo, here's your reset link:</p>
                    <div className="bg-black/30 p-2 rounded-sm break-all text-xs">
                      <a href={resetLink} className="text-blue-400 hover:underline">
                        {resetLink}
                      </a>
                    </div>
                    <p className="text-xs mt-2 text-gray-400">
                      (In a real application, this would be sent to your email)
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setForgotPassword(false)
                  setResetEmailSent(false)
                  setResetLink(null)
                  setEmail("")
                }}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                  required
                />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setForgotPassword(false)}
                  className="px-4 py-2 bg-transparent hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm">
                Clinic Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="password" className="block text-sm">
                  Clinic Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                required
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex justify-between items-center">
              <Link href="/signup" className="text-sm text-gray-400 hover:text-white">
                New clinic? Sign up
              </Link>
              <div className="flex space-x-4">
                <button type="button" onClick={handleCancel} className="px-4 py-2 bg-transparent hover:underline">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm"
                >
                  {isLoading ? "Logging in..." : "Login"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
