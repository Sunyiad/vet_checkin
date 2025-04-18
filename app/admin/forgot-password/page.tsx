"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resetLink, setResetLink] = useState("")
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // Update the handleSubmit function to handle the new response format
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)
    setDebugInfo(null)

    try {
      // Step 1: Make the request
      let response
      try {
        response = await fetch("/api/admin/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        })
      } catch (networkError) {
        throw new Error(`Network error: ${networkError.message}`)
      }

      // Step 2: Two-step approach to read the response
      // First get it as text to see what we're dealing with
      const responseText = await response.text()

      // Add the raw response to debug info
      setDebugInfo(`Status: ${response.status}, Raw response: ${responseText}`)

      // Try to parse as JSON only if it looks like JSON
      let data
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (jsonError) {
        // If it's not valid JSON, create a better error message
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 50)}...`)
      }

      // Check for error in the response
      if (!response.ok) {
        const errorMessage = data?.error || `Server error: ${response.status} ${response.statusText}`
        throw new Error(errorMessage)
      }

      // Success path
      setSuccess(true)
      // No longer need to set resetLink since we're sending an email
    } catch (err) {
      console.error("Password reset request error:", err)
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center mb-6">
          <Link href="/admin/login" className="mr-4">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Admin Password Reset</h1>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded">
                <p>{error}</p>
                {debugInfo && (
                  <div className="mt-2 text-xs overflow-auto max-h-32 bg-black/30 p-2 rounded">
                    <pre>{debugInfo}</pre>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-2 rounded">
              <p>Password reset link has been sent to your email.</p>
              <p className="mt-2 text-sm">
                Please check your inbox and follow the instructions to reset your password.
              </p>
            </div>

            <div className="flex justify-between">
              <Link href="/admin/login" className="text-blue-400 hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* Debug section */}
        <div className="mt-8 border-t border-gray-700 pt-4">
          <details>
            <summary className="text-sm text-gray-400 cursor-pointer">Debug Information</summary>
            <div className="mt-2 p-2 bg-black/30 rounded text-xs">
              <p>Email: {email || "Not set"}</p>
              <p>Loading: {isLoading ? "Yes" : "No"}</p>
              <p>Success: {success ? "Yes" : "No"}</p>
              <p>Error: {error || "None"}</p>
              <p>Reset Link: {resetLink || "None"}</p>
              {debugInfo && (
                <div className="mt-2 overflow-auto max-h-40">
                  <pre>{debugInfo}</pre>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
