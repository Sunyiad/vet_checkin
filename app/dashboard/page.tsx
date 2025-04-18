"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { RefreshCw, UserPlus, FileText, Trash2, RotateCcw } from "lucide-react"
import Link from "next/link"
import { generateRandomCode } from "@/lib/utils"

// Update the Pet interface to include the new fields
interface Pet {
  id: string
  owner_name: string
  pet_name: string
  species: string
  is_sick: boolean
  sick_appointment: boolean
  general_info: string | null
  coughing: boolean
  sneezing: boolean
  vomiting: boolean
  diarrhea: boolean
  created_at: string
  status: string
  doctor_id: string | null
  doctor: {
    name: string
  } | null
  cancelled: boolean
  cancelled_doctor: string | null
  cancelled_at: string | null
}

interface Doctor {
  id: string
  name: string
  active: boolean
}

interface Code {
  id: string
  code: string
  created_at: string
  expires_at: string
  active: boolean
}

interface ClinicData {
  id: string
  email: string
  name?: string
  [key: string]: any
}

// Define a type for the view filter
type ViewFilter = "active" | "cancelled" | "deleted"

export default function Dashboard() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [checkedInPets, setCheckedInPets] = useState<Record<string, boolean>>({})
  const [currentCode, setCurrentCode] = useState<Code | null>(null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const router = useRouter()
  // Replace separate filters with a single view filter
  const [viewFilter, setViewFilter] = useState<ViewFilter>("active")
  // Add states for doctor filtering
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [clinicData, setClinicData] = useState<ClinicData | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})
  const [debugMessage, setDebugMessage] = useState<string | null>(null)

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
        console.error("Invalid clinic data:", clinic)
        router.push("/login")
        return
      }

      setClinicData(clinic)
      setInitialized(true)
    } catch (error) {
      console.error("Error parsing clinic data:", error)
      router.push("/login")
    }
  }, [router])

  // Second useEffect to fetch data once clinicData is available
  useEffect(() => {
    if (initialized && clinicData && clinicData.id) {
      fetchDoctors()
      fetchPets()
      fetchCurrentCode()
    }
  }, [initialized, clinicData])

  const fetchDoctors = async () => {
    if (!clinicData || !clinicData.id) {
      console.error("Cannot fetch doctors: No clinic ID available")
      return
    }

    try {
      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("clinic_id", clinicData.id)
        .eq("active", true)
        .order("name", { ascending: true })

      if (error) {
        console.error("Error fetching doctors:", error)
        return
      }

      setDoctors(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  // Update the fetchPets function to use the new viewFilter
  const fetchPets = async () => {
    if (!clinicData || !clinicData.id) {
      console.error("Cannot fetch pets: No clinic ID available")
      return
    }

    try {
      const supabase = createClientSupabaseClient()

      // Build the query
      let query = supabase
        .from("pets")
        .select(`
          *,
          doctor:doctor_id (
            name
          )
        `)
        .eq("clinic_id", clinicData.id)
        .order("created_at", { ascending: false })

      // Filter based on the viewFilter
      switch (viewFilter) {
        case "deleted":
          query = query.eq("status", "deleted")
          break
        case "cancelled":
          query = query.or(`status.eq.cancelled,cancelled.eq.true`)
          break
        case "active":
        default:
          query = query.eq("status", "active").eq("cancelled", false)
          break
      }

      // Add doctor filter if selected
      if (selectedDoctorId) {
        query = query.eq("doctor_id", selectedDoctorId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching pets:", error)
        return
      }

      console.log(`Fetched ${data?.length || 0} pets with filter: ${viewFilter}`)
      setPets(data || [])

      // Initialize checked in status
      const initialCheckedInStatus: Record<string, boolean> = {}
      data?.forEach((pet) => {
        initialCheckedInStatus[pet.id] = false
      })
      setCheckedInPets(initialCheckedInStatus)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentCode = async () => {
    if (!clinicData || !clinicData.id) {
      console.error("Cannot fetch current code: No clinic ID available")
      return
    }

    try {
      const supabase = createClientSupabaseClient()

      // Get the current active code
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("codes")
        .select("*")
        .eq("clinic_id", clinicData.id)
        .eq("active", true)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Error fetching code:", error)
        return
      }

      if (data && data.length > 0) {
        setCurrentCode(data[0])
      } else {
        setCurrentCode(null)
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const generateNewCode = async () => {
    if (!clinicData || !clinicData.id) {
      console.error("Cannot generate code: No clinic ID available")
      return
    }

    try {
      setGeneratingCode(true)
      const supabase = createClientSupabaseClient()

      // Deactivate any existing active codes
      await supabase.from("codes").update({ active: false }).eq("clinic_id", clinicData.id).eq("active", true)

      // Generate a new code
      const code = generateRandomCode()

      // Calculate expiration time (8 hours from now)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000)

      // Insert the new code
      const { data, error } = await supabase
        .from("codes")
        .insert({
          code,
          clinic_id: clinicData.id,
          expires_at: expiresAt.toISOString(),
          active: true,
        })
        .select()

      if (error) {
        console.error("Error generating code:", error)
        return
      }

      // Fetch the updated code
      fetchCurrentCode()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("clinic")
    router.push("/")
  }

  const handleToggleCheckIn = (petId: string) => {
    setCheckedInPets((prev) => ({
      ...prev,
      [petId]: !prev[petId],
    }))
  }

  // Simplified delete function with better debugging
  const handleSoftDeletePet = async (petId: string) => {
    try {
      setDebugMessage(null)
      setIsDeleting((prev) => ({ ...prev, [petId]: true }))

      console.log(`Attempting to delete pet with ID: ${petId}`)
      const supabase = createClientSupabaseClient()

      // Simple direct update to status="deleted"
      const { error } = await supabase.from("pets").update({ status: "deleted" }).eq("id", petId)

      if (error) {
        console.error("Error soft deleting pet:", error)
        setDebugMessage(`Error deleting: ${error.message}`)
        return
      }

      console.log(`Successfully deleted pet with ID: ${petId}`)

      // Remove the pet from the current list to give immediate feedback
      setPets((currentPets) => currentPets.filter((pet) => pet.id !== petId))

      // Refresh the pet list after a short delay
      setTimeout(() => {
        fetchPets()
      }, 500)
    } catch (error) {
      console.error("Error:", error)
      setDebugMessage(`Unexpected error: ${error}`)
    } finally {
      setIsDeleting((prev) => ({ ...prev, [petId]: false }))
    }
  }

  // Add a function to restore deleted pets
  const handleRestorePet = async (petId: string) => {
    try {
      setDebugMessage(null)
      const supabase = createClientSupabaseClient()

      // Get the current pet data
      const { data: petData, error: fetchError } = await supabase.from("pets").select("*").eq("id", petId).single()

      if (fetchError) {
        console.error("Error fetching pet data:", fetchError)
        setDebugMessage(`Error fetching pet data: ${fetchError.message}`)
        return
      }

      // Determine the status to restore to (active or cancelled)
      const restoredStatus = petData.cancelled ? "cancelled" : "active"

      const { error } = await supabase.from("pets").update({ status: restoredStatus }).eq("id", petId)

      if (error) {
        console.error("Error restoring pet:", error)
        setDebugMessage(`Error restoring pet: ${error.message}`)
        return
      }

      console.log(`Successfully restored pet with ID: ${petId}`)

      // Remove the pet from the current list to give immediate feedback
      setPets((currentPets) => currentPets.filter((pet) => pet.id !== petId))

      // Refresh the pet list after a short delay
      setTimeout(() => {
        fetchPets()
      }, 500)
    } catch (error) {
      console.error("Error:", error)
      setDebugMessage(`Unexpected error: ${error}`)
    }
  }

  // Add a function to handle doctor filter change
  const handleDoctorFilterChange = (doctorId: string | null) => {
    setSelectedDoctorId(doctorId)
  }

  // Add useEffect to refetch pets when filters change
  useEffect(() => {
    if (initialized && clinicData && clinicData.id) {
      fetchPets()
    }
  }, [viewFilter, selectedDoctorId, initialized, clinicData])

  if (!initialized || !clinicData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
          <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        {/* Header section with code and navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          {/* Daily Check-in Code Card */}
          <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-5 shadow-lg w-full md:w-auto min-w-[280px]">
            <h2 className="text-lg font-semibold mb-3 text-white">Daily Check-in Code</h2>
            {currentCode ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <p className="text-3xl font-bold text-blue-400 tracking-wider font-mono">{currentCode.code}</p>
                  <div className="ml-2 px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full border border-green-700/50">
                    Active
                  </div>
                </div>
                <p className="text-xs text-gray-400">Expires: {new Date(currentCode.expires_at).toLocaleString()}</p>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-400 mb-4">
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <p>No active code</p>
              </div>
            )}
            <button
              onClick={generateNewCode}
              disabled={generatingCode}
              className="mt-4 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
            >
              {generatingCode ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Generate New Code
                </>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Link
              href="/dashboard/codes"
              className="px-4 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md border border-gray-700/50 w-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z" />
                <path d="M6 9.01V9" />
                <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" />
              </svg>
              Manage Codes
            </Link>
            <Link
              href="/dashboard/doctors"
              className="px-4 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md border border-gray-700/50 w-full"
            >
              <UserPlus size={18} />
              Manage Doctors
            </Link>
            <Link
              href="/dashboard/profile"
              className="px-4 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md border border-gray-700/50 w-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Clinic Profile
            </Link>
          </div>

          {/* Clinic Info */}
          <div className="ml-auto text-right">
            <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl p-4 shadow-md">
              <p className="text-sm mb-1 text-gray-300">Logged in as</p>
              <p className="font-medium text-white mb-3">
                {clinicData?.name ? clinicData.name : clinicData?.email ? clinicData.email : "Clinic Account"}
              </p>
              <button
                onClick={handleLogout}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center gap-1.5 ml-auto"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Debug message */}
        {debugMessage && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400 mt-0.5"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <p className="text-red-300">{debugMessage}</p>
          </div>
        )}

        {/* Filter controls */}
        <div className="mb-6 flex flex-wrap items-center gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-800/50">
          {/* View filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300">View:</label>
            <div className="flex rounded-md overflow-hidden border border-gray-700 shadow-md">
              <button
                onClick={() => setViewFilter("active")}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  viewFilter === "active"
                    ? "bg-green-600 text-white"
                    : "bg-gray-800/80 hover:bg-gray-700/80 text-gray-300"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setViewFilter("cancelled")}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  viewFilter === "cancelled"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800/80 hover:bg-gray-700/80 text-gray-300"
                }`}
              >
                Cancelled
              </button>
              <button
                onClick={() => setViewFilter("deleted")}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  viewFilter === "deleted"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800/80 hover:bg-gray-700/80 text-gray-300"
                }`}
              >
                Deleted
              </button>
            </div>
          </div>

          {/* Doctor filter dropdown */}
          <div className="flex items-center gap-3 ml-auto">
            <label htmlFor="doctorFilter" className="text-sm font-medium text-gray-300">
              Doctor:
            </label>
            <div className="relative">
              <select
                id="doctorFilter"
                value={selectedDoctorId || ""}
                onChange={(e) => handleDoctorFilterChange(e.target.value || null)}
                className="pl-4 pr-10 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
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
                  className="text-gray-400"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Pets Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/80 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Owner Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Pet Name</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Doctor</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Sick Appointment</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">General Info</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Details</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Check In</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mb-2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" x2="12" y1="8" y2="12" />
                            <line x1="12" x2="12.01" y1="16" y2="16" />
                          </svg>
                          <p>No pets found with the current filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pets.map((pet) => (
                      <tr key={pet.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-white">{pet.owner_name}</td>
                        <td className="px-4 py-3 text-white">{pet.pet_name}</td>
                        <td className="px-4 py-3 text-white">{pet.doctor?.name || pet.cancelled_doctor || "-"}</td>
                        <td className="px-4 py-3">
                          {pet.cancelled || pet.status === "cancelled" ? (
                            <span className="px-2 py-1 bg-red-900/50 text-red-300 rounded-md text-xs font-medium border border-red-700/30">
                              Cancelled
                            </span>
                          ) : pet.status === "deleted" ? (
                            <span className="px-2 py-1 bg-gray-800/50 text-gray-300 rounded-md text-xs font-medium border border-gray-700/30">
                              Deleted
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded-md text-xs font-medium border border-green-700/30">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {pet.cancelled || pet.status === "cancelled" || pet.status === "deleted" ? (
                            <span className="text-gray-500">-</span>
                          ) : pet.is_sick ? (
                            <span className="text-red-400">Sick</span>
                          ) : (
                            <span className="text-green-400">Healthy</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-300 max-w-[200px] truncate">
                          {pet.general_info || <span className="text-gray-500">-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/pets/${pet.id}`}
                            className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg inline-flex items-center justify-center transition-colors"
                          >
                            <FileText size={16} className="text-blue-400" />
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleCheckIn(pet.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                              checkedInPets[pet.id]
                                ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                                : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                            }`}
                            disabled={pet.cancelled || pet.status === "cancelled" || pet.status === "deleted"}
                          >
                            {checkedInPets[pet.id] ? "Checked In" : "Check In"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {viewFilter === "deleted" ? (
                            <button
                              onClick={() => handleRestorePet(pet.id)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 shadow-md"
                            >
                              <RotateCcw size={16} />
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSoftDeletePet(pet.id)}
                              disabled={isDeleting[pet.id]}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 shadow-md"
                              data-pet-id={pet.id}
                            >
                              {isDeleting[pet.id] ? (
                                <>
                                  <RefreshCw size={16} className="animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 size={16} />
                                  Delete
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
