"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function AdminResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isVerifying, setIsVerifying] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link")
      setIsVerifying(false)
      return
    }

    // In a real app, you would verify the token with your backend
    // For this demo, we'll simulate token verification
    setTimeout(() => {
      // Simulate a valid token for demo purposes
      setAdminEmail("primaveradvm@gmail.com")
      setIsVerifying(false)
    }, 1000)
  }, [token])

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
      // In a real app, you would send the new password to your backend
      // For this demo, we'll simulate a successful password reset
      setTimeout(() => {
        setSuccess(true)
        setIsResetting(false)
      }, 1000)
    } catch (err) {
      console.error("Password reset error:", err)
      setError("An error occurred")
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Reset Admin Password</h1>

        {isVerifying ? (
          <p>Verifying reset link...</p>
        ) : error && !adminEmail ? (
          <div className="space-y-6">
            <div className="bg-red-900/30 border border-red-700 p-4 rounded-sm">
              <p>{error}</p>
            </div>
            <Link href="/admin/login" className="block text-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm">
              Back to Login
            </Link>
          </div>
        ) : success ? (
          <div className="space-y-6">
            <div className="bg-green-900/30 border border-green-700 p-4 rounded-sm">
              <p>Your password has been successfully reset.</p>
            </div>
            <Link href="/admin/login" className="block text-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="bg-gray-900/50 p-4 rounded-sm mb-4">
              <p>
                Resetting password for <span className="font-medium">{adminEmail}</span>
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
              <Link href="/admin/login" className="px-4 py-2 bg-transparent hover:underline">
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
