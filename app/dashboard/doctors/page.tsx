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
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Manage Doctors</h1>
        <button onClick={goBack} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm">
          Back to Dashboard
        </button>
      </div>

      <div className="mb-8">
        {isAddingDoctor ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newDoctorName}
              onChange={(e) => setNewDoctorName(e.target.value)}
              placeholder="Enter doctor name"
              className="px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
              autoFocus
            />
            <button onClick={addDoctor} className="p-2 bg-green-900 hover:bg-green-800 rounded-sm" title="Save">
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setIsAddingDoctor(false)
                setNewDoctorName("")
              }}
              className="p-2 bg-red-900 hover:bg-red-800 rounded-sm"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingDoctor(true)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm flex items-center gap-2"
          >
            <PlusIcon size={16} />
            Add New Doctor
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-black border border-gray-800 rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-400">
                    No doctors added yet
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.id} className="border-t border-gray-800">
                    <td className="px-4 py-3">
                      {editingDoctor?.id === doctor.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingDoctor.name}
                            onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                            className="px-3 py-1 bg-transparent border border-gray-700 rounded-sm text-white"
                            autoFocus
                          />
                          <button
                            onClick={updateDoctor}
                            className="p-1 bg-green-900 hover:bg-green-800 rounded-sm"
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingDoctor(null)}
                            className="p-1 bg-red-900 hover:bg-red-800 rounded-sm"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        doctor.name
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-sm text-xs ${
                          doctor.active ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"
                        }`}
                      >
                        {doctor.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {editingDoctor?.id !== doctor.id && (
                          <>
                            <button
                              onClick={() => setEditingDoctor({ id: doctor.id, name: doctor.name })}
                              className="p-1 bg-blue-900 hover:bg-blue-800 rounded-sm"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => toggleDoctorStatus(doctor.id, doctor.active)}
                              className={`p-1 rounded-sm ${
                                doctor.active ? "bg-yellow-900 hover:bg-yellow-800" : "bg-green-900 hover:bg-green-800"
                              }`}
                              title={doctor.active ? "Deactivate" : "Activate"}
                            >
                              {doctor.active ? <X size={16} /> : <Check size={16} />}
                            </button>
                            <button
                              onClick={() => deleteDoctor(doctor.id)}
                              className="p-1 bg-red-900 hover:bg-red-800 rounded-sm"
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
  )
}
