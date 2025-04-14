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

export default function Dashboard() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [checkedInPets, setCheckedInPets] = useState<Record<string, boolean>>({})
  const [currentCode, setCurrentCode] = useState<Code | null>(null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const router = useRouter()
  const [showDeleted, setShowDeleted] = useState(false)
  // Add states for doctor filtering
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [clinicData, setClinicData] = useState<ClinicData | null>(null)
  const [initialized, setInitialized] = useState(false)

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

  // Update the fetchPets function to include doctor filtering
  const fetchPets = async () => {
    if (!clinicData || !clinicData.id) {
      console.error("Cannot fetch pets: No clinic ID available")
      return
    }

    try {
      const supabase = createClientSupabaseClient()

      // Filter by status based on showDeleted state
      const status = showDeleted ? "deleted" : "active"

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
        .eq("status", status)
        .order("created_at", { ascending: false })

      // Add doctor filter if selected
      if (selectedDoctorId) {
        query = query.eq("doctor_id", selectedDoctorId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching pets:", error)
        return
      }

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

  // Replace the handleDeletePet function with a soft delete function
  const handleSoftDeletePet = async (petId: string) => {
    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase.from("pets").update({ status: "deleted" }).eq("id", petId)

      if (error) {
        console.error("Error soft deleting pet:", error)
        return
      }

      // Refresh the pet list
      fetchPets()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  // Add a function to restore deleted pets
  const handleRestorePet = async (petId: string) => {
    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase.from("pets").update({ status: "active" }).eq("id", petId)

      if (error) {
        console.error("Error restoring pet:", error)
        return
      }

      // Refresh the pet list
      fetchPets()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  // Add a function to toggle between showing active and deleted pets
  const toggleShowDeleted = () => {
    setShowDeleted((prev) => !prev)
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
  }, [showDeleted, selectedDoctorId, initialized, clinicData])

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
          <button
            onClick={toggleShowDeleted}
            className={`px-4 py-2 rounded-sm w-full ${
              showDeleted ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {showDeleted ? "Show Active Pets" : "Show Deleted Pets"}
          </button>
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

      {/* Doctor filter dropdown */}
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="doctorFilter" className="text-sm">
          Filter by Doctor:
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
                        {pet.cancelled ? (
                          <span className="px-2 py-1 bg-red-900 text-red-100 rounded-sm text-xs">Cancelled</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-900 text-green-100 rounded-sm text-xs">Active</span>
                        )}
                      </td>
                      <td className="py-4">
                        {pet.cancelled ? <span className="text-gray-400">-</span> : pet.is_sick ? "sick" : "healthy"}
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
                          disabled={pet.cancelled}
                        >
                          {checkedInPets[pet.id] ? "checked in" : "check in"}
                        </button>
                      </td>
                      <td className="py-4">
                        {showDeleted ? (
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
                            className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded-sm flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Delete
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
