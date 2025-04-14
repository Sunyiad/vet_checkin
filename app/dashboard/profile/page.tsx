"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { ArrowLeft, Save } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="flex items-center justify-center h-full">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-6">
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-red-500 mb-4">Profile not found</p>
          <button onClick={goBack} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button onClick={goBack} className="flex items-center gap-2 text-gray-300 hover:text-white">
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold">Clinic Profile</h1>
        </div>

        {success && (
          <div className="bg-green-900/30 border border-green-700 p-4 rounded-sm mb-6">
            <p>Profile updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 p-4 rounded-sm mb-6">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-black border border-gray-800 p-6 rounded-sm">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm">
              Email (cannot be changed)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-sm text-white opacity-70"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm">
              Clinic Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={profile.name || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contact_person" className="block text-sm">
              Contact Person
            </label>
            <input
              id="contact_person"
              name="contact_person"
              type="text"
              value={profile.contact_person || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={profile.phone || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm">
              Street Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={profile.address || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="city" className="block text-sm">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={profile.city || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="state" className="block text-sm">
                State/Province
              </label>
              <input
                id="state"
                name="state"
                type="text"
                value={profile.state || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="zip" className="block text-sm">
                Zip Code
              </label>
              <input
                id="zip"
                name="zip"
                type="text"
                value={profile.zip || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm flex items-center gap-2"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Save size={16} />
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
