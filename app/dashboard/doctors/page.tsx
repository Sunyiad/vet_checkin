"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { PlusIcon, Trash2, Edit, X, Check } from "lucide-react"

interface Doctor {
  id: string
  name: string
  active: boolean
  created_at: string
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [newDoctorName, setNewDoctorName] = useState("")
  const [isAddingDoctor, setIsAddingDoctor] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<{ id: string; name: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const clinic = localStorage.getItem("clinic")
    if (!clinic) {
      router.push("/login")
      return
    }

    fetchDoctors()
  }, [router])

  const fetchDoctors = async () => {
    try {
      const supabase = createClientSupabaseClient()
      const clinicData = localStorage.getItem("clinic")

      if (!clinicData) {
        return
      }

      const clinic = JSON.parse(clinicData)

      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching doctors:", error)
        return
      }

      setDoctors(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const addDoctor = async () => {
    if (!newDoctorName.trim()) return

    try {
      const supabase = createClientSupabaseClient()
      const clinicData = localStorage.getItem("clinic")

      if (!clinicData) {
        return
      }

      const clinic = JSON.parse(clinicData)

      const { error } = await supabase.from("doctors").insert({
        name: newDoctorName.trim(),
        clinic_id: clinic.id,
        active: true,
      })

      if (error) {
        console.error("Error adding doctor:", error)
        return
      }

      setNewDoctorName("")
      setIsAddingDoctor(false)
      fetchDoctors()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const updateDoctor = async () => {
    if (!editingDoctor || !editingDoctor.name.trim()) return

    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase
        .from("doctors")
        .update({ name: editingDoctor.name.trim() })
        .eq("id", editingDoctor.id)

      if (error) {
        console.error("Error updating doctor:", error)
        return
      }

      setEditingDoctor(null)
      fetchDoctors()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const toggleDoctorStatus = async (doctorId: string, currentStatus: boolean) => {
    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase.from("doctors").update({ active: !currentStatus }).eq("id", doctorId)

      if (error) {
        console.error("Error toggling doctor status:", error)
        return
      }

      fetchDoctors()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const deleteDoctor = async (doctorId: string) => {
    try {
      const supabase = createClientSupabaseClient()

      // First check if this doctor has any pets assigned
      const { data, error: checkError } = await supabase.from("pets").select("id").eq("doctor_id", doctorId).limit(1)

      if (checkError) {
        console.error("Error checking doctor's pets:", checkError)
        return
      }

      if (data && data.length > 0) {
        // Doctor has pets assigned, just deactivate instead of deleting
        const { error } = await supabase.from("doctors").update({ active: false }).eq("id", doctorId)

        if (error) {
          console.error("Error deactivating doctor:", error)
          return
        }
      } else {
        // No pets assigned, safe to delete
        const { error } = await supabase.from("doctors").delete().eq("id", doctorId)

        if (error) {
          console.error("Error deleting doctor:", error)
          return
        }
      }

      fetchDoctors()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const goBack = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Manage Doctors
          </h1>
          <button
            onClick={goBack}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-all duration-200 flex items-center gap-2 border border-gray-700 shadow-md"
          >
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
              className="lucide lucide-arrow-left"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="mb-8">
          {isAddingDoctor ? (
            <div className="flex items-center gap-2 p-4 bg-gray-800/50 backdrop-blur-sm rounded-md border border-gray-700 shadow-lg">
              <input
                type="text"
                value={newDoctorName}
                onChange={(e) => setNewDoctorName(e.target.value)}
                placeholder="Enter doctor name"
                className="px-4 py-2 bg-gray-900/80 border border-gray-700 rounded-md text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                autoFocus
              />
              <button
                onClick={addDoctor}
                className="p-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-md transition-all duration-200 shadow-md"
                title="Save"
              >
                <Check size={20} />
              </button>
              <button
                onClick={() => {
                  setIsAddingDoctor(false)
                  setNewDoctorName("")
                }}
                className="p-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-md transition-all duration-200 shadow-md"
                title="Cancel"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingDoctor(true)}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-md transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <PlusIcon size={18} />
              Add New Doctor
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden shadow-xl">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-200">
                  <th className="px-6 py-4 text-left font-semibold">Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
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
                          className="lucide lucide-user-x"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <line x1="17" x2="22" y1="8" y2="13" />
                          <line x1="22" x2="17" y1="8" y2="13" />
                        </svg>
                        <span>No doctors added yet</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  doctors.map((doctor) => (
                    <tr key={doctor.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        {editingDoctor?.id === doctor.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingDoctor.name}
                              onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                              className="px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-md text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                              autoFocus
                            />
                            <button
                              onClick={updateDoctor}
                              className="p-1.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-md transition-all duration-200 shadow-md"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingDoctor(null)}
                              className="p-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-md transition-all duration-200 shadow-md"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="font-medium">{doctor.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            doctor.active
                              ? "bg-green-900/50 text-green-300 border border-green-700"
                              : "bg-red-900/50 text-red-300 border border-red-700"
                          }`}
                        >
                          {doctor.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          {editingDoctor?.id !== doctor.id && (
                            <>
                              <button
                                onClick={() => setEditingDoctor({ id: doctor.id, name: doctor.name })}
                                className="p-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-md transition-all duration-200 border border-blue-700/50"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => toggleDoctorStatus(doctor.id, doctor.active)}
                                className={`p-2 rounded-md transition-all duration-200 border ${
                                  doctor.active
                                    ? "bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border-amber-700/50"
                                    : "bg-green-600/30 hover:bg-green-600/50 text-green-300 border-green-700/50"
                                }`}
                                title={doctor.active ? "Deactivate" : "Activate"}
                              >
                                {doctor.active ? <X size={16} /> : <Check size={16} />}
                              </button>
                              <button
                                onClick={() => deleteDoctor(doctor.id)}
                                className="p-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-md transition-all duration-200 border border-red-700/50"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
