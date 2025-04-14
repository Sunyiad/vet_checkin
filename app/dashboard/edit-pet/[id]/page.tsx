"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import CheckInForm from "@/components/check-in-form"
import { ArrowLeft } from "lucide-react"

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
  doctor_id: string | null
  diet_info: string | null
  prevention_type: string | null
  discuss_risks: boolean | null
  recent_vet_clinic: string | null
  recent_vet_reason: string | null
  records_permission: boolean | null
  medication_details: string | null
  supplement_details: string | null
  cancelled: boolean
}

export default function EditPetPage() {
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string

  useEffect(() => {
    // Check if user is logged in
    const clinic = localStorage.getItem("clinic")
    if (!clinic) {
      router.push("/login")
      return
    }

    fetchPet()
  }, [router, petId])

  const fetchPet = async () => {
    try {
      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase.from("pets").select("*").eq("id", petId).single()

      if (error) {
        console.error("Error fetching pet:", error)
        return
      }

      setPet(data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    router.push(`/dashboard/pets/${petId}`)
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="flex items-center justify-center h-full">
          <p>Loading pet details...</p>
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="min-h-screen p-6">
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-red-500 mb-4">Pet not found</p>
          <button onClick={handleBackToDashboard} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-gray-300 hover:text-white">
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
        <CheckInForm pet={pet} onClose={handleClose} />
      </div>
    </div>
  )
}
