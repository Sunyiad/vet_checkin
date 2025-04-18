"use client"

import { useState, useEffect } from "react"
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

  // Optimize the fetchDoctors function
  const fetchDoctors = async () => {
    if (!clinicData || !clinicData.id) {
      console.error("Cannot fetch doctors: No clinic ID available")
      return
    }

    try {
      const supabase = createClientSupabaseClient()

      // Select only the fields we need
      const { data, error } = await supabase
        .from("doctors")
        .select("id, name")
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

  // Optimize the fetchPets function to be more efficient
  const fetchPets = async () => {
    if (!clinicData || !clinicData.id) {
      console.error("Cannot fetch pets: No clinic ID available")
      return
    }

    try {
      setLoading(true)
      const supabase = createClientSupabaseClient()

      // Select only the fields we need
      const selectQuery = `
      id, 
      owner_name, 
      pet_name, 
      species, 
      is_sick, 
      status, 
      cancelled, 
      general_info,
      doctor_id,
      cancelled_doctor,
      cancelled_at,
      doctor:doctor_id (name)
    `

      // Build the query with proper filters
      let query = supabase
        .from("pets")
        .select(selectQuery)
        .eq("clinic_id", clinicData.id)
        .order("created_at", { ascending: false })

      // Filter based on the viewFilter
      switch (viewFilter) {
        case "deleted":
          query = query.eq("status", "deleted")
          break
        case "cancelled":
          // More efficient OR condition
          query = query.in("status", ["cancelled"]).or(`cancelled.eq.true`)
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

      // Limit the number of results to improve performance
      query = query.limit(100)

      const { data, error } = await query

      if (error) {
        console.error("Error fetching pets:", error)
        return
      }

      setPets(data || [])

      // Initialize checked in status more efficiently
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

  // Optimize the fetchCurrentCode function
  const fetchCurrentCode = async () => {
    if (!clinicData || !clinicData.id) {
      console.error("Cannot fetch current code: No clinic ID available")
      return
    }

    try {
      const supabase = createClientSupabaseClient()
      const now = new Date().toISOString()

      // Select only the fields we need
      const { data, error } = await supabase
        .from("codes")
        .select("id, code, expires_at")
        .eq("clinic_id", clinicData.id)
        .eq("active", true)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching code:", error)
        setCurrentCode(null)
        return
      }

      setCurrentCode(data || null)
    } catch (error) {
      console.error("Error:", error)
      setCurrentCode(null)
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
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-start mb-8">
        <div className="bg-black border border-gray-800 p-4 rounded-sm">
          <h2 className="text-lg font-semibold mb-2">Daily Check-in Code</h2>
          {currentCode ? (
            <div className="space-y-2">
              <p className="text-2xl font-bold">{currentCode.code}</p>
              <p className="text-xs text-gray-400">Expires: {new Date(currentCode.expires_at).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-gray-400">No active code</p>
          )}
          <button
            onClick={generateNewCode}
            disabled={generatingCode}
            className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm flex items-center gap-2"
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

        <div className="flex flex-col items-center gap-2">
          <Link
            href="/dashboard/codes"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm w-full text-center"
          >
            Manage Codes
          </Link>
          <Link
            href="/dashboard/doctors"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm w-full text-center flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            Manage Doctors
          </Link>
          <Link
            href="/dashboard/profile"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm w-full text-center"
          >
            Clinic Profile
          </Link>
        </div>

        <div className="text-right">
          <p className="text-sm mb-2">
            {clinicData?.name ? clinicData.name : clinicData?.email ? clinicData.email : "Logged in"}
          </p>
          <button onClick={handleLogout} className="text-sm hover:underline">
            logout
          </button>
        </div>
      </div>

      {/* Debug message */}
      {debugMessage && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-sm">
          <p className="text-red-200">{debugMessage}</p>
        </div>
      )}

      {/* Simplified filter controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* View filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">View:</label>
          <div className="flex rounded-md overflow-hidden border border-gray-700">
            <button
              onClick={() => setViewFilter("active")}
              className={`px-4 py-2 ${
                viewFilter === "active" ? "bg-green-600 text-white" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setViewFilter("cancelled")}
              className={`px-4 py-2 ${
                viewFilter === "cancelled" ? "bg-red-600 text-white" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              Cancelled
            </button>
            <button
              onClick={() => setViewFilter("deleted")}
              className={`px-4 py-2 ${
                viewFilter === "deleted" ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              Deleted
            </button>
          </div>
        </div>

        {/* Doctor filter dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="doctorFilter" className="text-sm font-medium">
            Doctor:
          </label>
          <select
            id="doctorFilter"
            value={selectedDoctorId || ""}
            onChange={(e) => handleDoctorFilterChange(e.target.value || null)}
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-sm text-white"
            style={{ color: "white", backgroundColor: "#1a1a1a" }}
          >
            <option value="">All Doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex">
          <div className="flex-1">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-4">owner name</th>
                  <th className="pb-4">pet name</th>
                  <th className="pb-4">doctor</th>
                  <th className="pb-4">status</th>
                  <th className="pb-4">sick appointment</th>
                  <th className="pb-4">general info</th>
                  <th className="pb-4">details</th>
                  <th className="pb-4"></th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody>
                {pets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-4 text-center text-gray-400">
                      No pets found
                    </td>
                  </tr>
                ) : (
                  pets.map((pet) => (
                    <tr key={pet.id} className="border-t border-gray-800">
                      <td className="py-4">{pet.owner_name}</td>
                      <td className="py-4">{pet.pet_name}</td>
                      <td className="py-4">{pet.doctor?.name || pet.cancelled_doctor || "-"}</td>
                      <td className="py-4">
                        {pet.cancelled || pet.status === "cancelled" ? (
                          <span className="px-2 py-1 bg-red-900 text-red-100 rounded-sm text-xs">Cancelled</span>
                        ) : pet.status === "deleted" ? (
                          <span className="px-2 py-1 bg-gray-900 text-gray-100 rounded-sm text-xs">Deleted</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-900 text-green-100 rounded-sm text-xs">Active</span>
                        )}
                      </td>
                      <td className="py-4">
                        {pet.cancelled || pet.status === "cancelled" || pet.status === "deleted" ? (
                          <span className="text-gray-400">-</span>
                        ) : pet.is_sick ? (
                          "sick"
                        ) : (
                          "healthy"
                        )}
                      </td>
                      <td className="py-4">{pet.general_info || "-"}</td>
                      <td className="py-4">
                        <Link
                          href={`/dashboard/pets/${pet.id}`}
                          className="p-2 border border-gray-600 rounded-sm hover:bg-gray-800 inline-flex items-center"
                        >
                          <FileText size={16} />
                        </Link>
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleToggleCheckIn(pet.id)}
                          className={`px-4 py-2 rounded-sm ${
                            checkedInPets[pet.id]
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-gray-800 hover:bg-gray-700 text-white"
                          }`}
                          disabled={pet.cancelled || pet.status === "cancelled" || pet.status === "deleted"}
                        >
                          {checkedInPets[pet.id] ? "checked in" : "check in"}
                        </button>
                      </td>
                      <td className="py-4">
                        {viewFilter === "deleted" ? (
                          <button
                            onClick={() => handleRestorePet(pet.id)}
                            className="px-4 py-2 bg-green-900 hover:bg-green-800 rounded-sm flex items-center gap-2"
                          >
                            <RotateCcw size={16} />
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSoftDeletePet(pet.id)}
                            disabled={isDeleting[pet.id]}
                            className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded-sm flex items-center gap-2"
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
  )
}
