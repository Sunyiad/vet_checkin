"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClientSupabaseClient } from "@/lib/supabase"

export default function Signup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeParam = searchParams.get("code") || ""

  const [step, setStep] = useState(1)
  const [code, setCode] = useState(codeParam)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Clinic details
  const [clinicName, setClinicName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [phone, setPhone] = useState("")

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setError("")

    try {
      const supabase = createClientSupabaseClient()

      // Check if the code exists and is valid
      const { data, error } = await supabase
        .from("clinic_signup_codes")
        .select("*")
        .eq("code", code)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (error || !data) {
        setError("Invalid or expired code")
        return
      }

      // Code is valid, pre-fill clinic name and email
      setClinicName(data.clinic_name)
      setEmail(data.clinic_email)

      // Check if a clinic with this email already exists
      const { data: existingClinic, error: existingError } = await supabase
        .from("clinics")
        .select("id")
        .eq("email", data.clinic_email)
        .limit(1)

      if (existingClinic && existingClinic.length > 0) {
        setError("A clinic with this email already exists")
        return
      }

      // Move to step 2
      setStep(2)
    } catch (err) {
      console.error("Code verification error:", err)
      setError("An error occurred")
    } finally {
      setIsVerifying(false)
    }
  }

  // Update the handleSignup function to include all clinic fields in the database
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsSubmitting(false)
      return
    }

    try {
      const supabase = createClientSupabaseClient()

      // Verify the code again with clinic name and email
      const { data: codeData, error: codeError } = await supabase
        .from("clinic_signup_codes")
        .select("*")
        .eq("code", code)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (codeError || !codeData) {
        setError("Invalid or expired code")
        return
      }

      // Verify clinic name and email match
      if (
        codeData.clinic_name.toLowerCase() !== clinicName.toLowerCase() ||
        codeData.clinic_email.toLowerCase() !== email.toLowerCase()
      ) {
        setError("Clinic name or email does not match the code")
        return
      }

      // Double-check if clinic already exists
      const { data: existingClinic, error: existingError } = await supabase
        .from("clinics")
        .select("id")
        .eq("email", email)
        .limit(1)

      if (existingClinic && existingClinic.length > 0) {
        setError("A clinic with this email already exists")
        return
      }

      // Create the clinic with all fields
      const { data: clinic, error } = await supabase
        .from("clinics")
        .insert({
          email,
          password, // In a real app, you'd hash this password
          name: clinicName,
          contact_person: contactPerson,
          address,
          city,
          state,
          zip,
          phone,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating clinic:", error)
        setError("Failed to create clinic")
        return
      }

      // Mark the code as used
      await supabase.from("clinic_signup_codes").update({ used: true }).eq("code", code)

      // Store clinic info in localStorage
      localStorage.setItem("clinic", JSON.stringify(clinic))

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error("Signup error:", err)
      setError("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Clinic Signup</h1>

        {step === 1 ? (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="code" className="block text-sm">
                Enter your signup code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                placeholder="Enter code"
                required
              />
              <p className="text-sm text-gray-400">This code was provided by the system administrator</p>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex justify-between items-center">
              <Link href="/login" className="text-sm text-gray-400 hover:text-white">
                Already have an account? Login
              </Link>
              <div className="flex space-x-4">
                <Link href="/" className="px-4 py-2 bg-transparent hover:underline">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm"
                >
                  {isVerifying ? "Verifying..." : "Continue"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="clinicName" className="block text-sm">
                  Clinic Name
                </label>
                <input
                  id="clinicName"
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                  required
                  readOnly
                />
                <p className="text-xs text-gray-400">This must match the name provided by the administrator</p>
              </div>

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
                  readOnly
                />
                <p className="text-xs text-gray-400">This must match the email provided by the administrator</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="contactPerson" className="block text-sm">
                  Contact Person Full Name
                </label>
                <input
                  id="contactPerson"
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="block text-sm">
                  Street Address
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="city" className="block text-sm">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="state" className="block text-sm">
                    State/Province
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="zip" className="block text-sm">
                  Zip Code
                </label>
                <input
                  id="zip"
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm">
                  Password
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
                  Confirm Password
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
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex justify-end space-x-4">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-2 bg-transparent hover:underline">
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm"
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
