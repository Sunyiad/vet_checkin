"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AdminResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get("token")

  useEffect(() => {
    if (!token) {
      setError("Invalid reset token")
      setIsVerifying(false)
      return
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/admin/verify-reset-token?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Invalid or expired token")
        }

        setIsValidToken(true)
      } catch (err: any) {
        console.error("Token verification error:", err)
        setError(err.message || "Invalid or expired token")
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/admin/login")
      }, 3000)
    } catch (err: any) {
      console.error("Password reset error:", err)
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-4"></div>
          <p>Verifying reset token...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center mb-6">
          <Link href="/admin/login" className="mr-4">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Reset Admin Password</h1>
        </div>

        {!isValidToken ? (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded">
            <p>{error || "Invalid or expired reset token"}</p>
            <div className="mt-4">
              <Link href="/admin/forgot-password" className="text-blue-400 hover:underline">
                Request a new password reset
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-2 rounded">
            <p>Password has been reset successfully!</p>
            <p className="mt-2 text-sm">Redirecting to login page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                minLength={6}
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
                minLength={6}
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
