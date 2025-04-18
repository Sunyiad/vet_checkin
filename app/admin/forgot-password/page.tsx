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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setSuccess(true)

      // For demo purposes, we'll show the reset link directly
      // In a real app, this would be sent via email
      setResetLink(`${window.location.origin}/admin/reset-password?token=${data.token}`)
    } catch (err: any) {
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

            {error && <div className="text-red-500 text-sm">{error}</div>}

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
              Password reset link has been generated.
            </div>

            <div className="bg-gray-800 p-4 rounded">
              <p className="mb-2 text-sm">For demo purposes, use this reset link:</p>
              <div className="bg-gray-900 p-2 rounded text-xs break-all">
                <a href={resetLink} className="text-blue-400 hover:underline">
                  {resetLink}
                </a>
              </div>
              <p className="mt-2 text-sm text-gray-400">In a real app, this would be sent to your email.</p>
            </div>

            <div className="flex justify-between">
              <Link href="/admin/login" className="text-blue-400 hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
