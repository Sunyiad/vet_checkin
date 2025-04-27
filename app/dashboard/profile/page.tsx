"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { ArrowLeft, Save, Building2, User, Phone, MapPin } from "lucide-react"

interface ClinicProfile {
  id: string
  email: string
  name?: string
  contact_person?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ClinicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const [initialized, setInitialized] = useState(false)
  const [clinicId, setClinicId] = useState<string | null>(null)

  // First useEffect to load clinic data from localStorage
  useEffect(() => {
    // Check if user is logged in
    const clinicStr = localStorage.getItem("clinic")
    if (!clinicStr) {
      router.push("/login")
      return
    }

    try {
      const clinic = JSON.parse(clinicStr)
      if (!clinic || !clinic.id) {
        router.push("/login")
        return
      }

      setClinicId(clinic.id)
      setInitialized(true)
    } catch (error) {
      console.error("Error parsing clinic data:", error)
      router.push("/login")
    }
  }, [router])

  // Second useEffect to fetch profile once clinicId is available
  useEffect(() => {
    if (initialized && clinicId) {
      fetchProfile(clinicId)
    }
  }, [initialized, clinicId])

  const fetchProfile = async (clinicId: string) => {
    try {
      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase.from("clinics").select("*").eq("id", clinicId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setError("")
    setSuccess(false)

    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase
        .from("clinics")
        .update({
          name: profile.name,
          contact_person: profile.contact_person,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zip: profile.zip,
          phone: profile.phone,
        })
        .eq("id", profile.id)

      if (error) {
        console.error("Error updating profile:", error)
        setError("Failed to update profile")
        return
      }

      // Update localStorage with new data
      localStorage.setItem("clinic", JSON.stringify(profile))
      setSuccess(true)

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      console.error("Error:", err)
      setError("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const goBack = () => {
    router.push("/dashboard")
  }

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-gray-700 rounded-md mb-4"></div>
          <div className="h-4 w-48 bg-gray-800 rounded-md"></div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-black to-gray-900">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-48 bg-gray-700 rounded-md mb-4"></div>
            <div className="h-4 w-64 bg-gray-800 rounded-md"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-black to-gray-900">
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-red-400 mb-4 font-medium">Profile not found</p>
          <button
            onClick={goBack}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-md text-white font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/20"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-800/80 px-4 py-2 rounded-md transition-all duration-200"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Clinic Profile
          </h1>
        </div>

        {success && (
          <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-md mb-6 flex items-center gap-3 animate-fade-in">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-green-300">Profile updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-md mb-6 flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 p-8 rounded-lg shadow-xl"
        >
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm text-gray-300 font-medium">
              Email (cannot be changed)
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                disabled
                className="w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-gray-700/50 rounded-md text-gray-400 opacity-70"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm text-gray-300 font-medium">
              Clinic Name
            </label>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                value={profile.name || ""}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 bg-transparent border border-gray-700/50 focus:border-purple-500/50 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Building2 size={16} />
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="contact_person" className="block text-sm text-gray-300 font-medium">
              Contact Person
            </label>
            <div className="relative">
              <input
                id="contact_person"
                name="contact_person"
                type="text"
                value={profile.contact_person || ""}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 bg-transparent border border-gray-700/50 focus:border-purple-500/50 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <User size={16} />
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm text-gray-300 font-medium">
              Phone Number
            </label>
            <div className="relative">
              <input
                id="phone"
                name="phone"
                type="tel"
                value={profile.phone || ""}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 bg-transparent border border-gray-700/50 focus:border-purple-500/50 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Phone size={16} />
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm text-gray-300 font-medium">
              Street Address
            </label>
            <div className="relative">
              <input
                id="address"
                name="address"
                type="text"
                value={profile.address || ""}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 bg-transparent border border-gray-700/50 focus:border-purple-500/50 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <MapPin size={16} />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="city" className="block text-sm text-gray-300 font-medium">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={profile.city || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-3 bg-transparent border border-gray-700/50 focus:border-purple-500/50 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="state" className="block text-sm text-gray-300 font-medium">
                State/Province
              </label>
              <input
                id="state"
                name="state"
                type="text"
                value={profile.state || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-3 bg-transparent border border-gray-700/50 focus:border-purple-500/50 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="zip" className="block text-sm text-gray-300 font-medium">
                Zip Code
              </label>
              <input
                id="zip"
                name="zip"
                type="text"
                value={profile.zip || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-3 bg-transparent border border-gray-700/50 focus:border-purple-500/50 rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md flex items-center gap-2 font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/20 ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
