"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function NewAppointmentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    pet_id: "",
    pet_name: "",
    owner_name: "",
    appointment_date: "",
    appointment_time: "",
    doctor_id: "",
    notes: "",
  })

  const [pets, setPets] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedPet, setSelectedPet] = useState<any>(null)

  // Fetch pets and doctors on component mount
  useState(() => {
    const fetchData = async () => {
      // Fetch pets
      const { data: petsData } = await supabase.from("pets").select("*").order("name")

      if (petsData) {
        setPets(petsData)
      }

      // Fetch doctors
      const { data: doctorsData } = await supabase.from("doctors").select("*").order("name")

      if (doctorsData) {
        setDoctors(doctorsData)
      }
    }

    fetchData()
  }, [])

  // Handle pet selection
  const handlePetChange = async (petId: string) => {
    if (!petId) {
      setSelectedPet(null)
      setFormData({
        ...formData,
        pet_id: "",
        pet_name: "",
        owner_name: "",
      })
      return
    }

    const { data: pet } = await supabase.from("pets").select("*").eq("id", petId).single()

    if (pet) {
      setSelectedPet(pet)
      setFormData({
        ...formData,
        pet_id: pet.id,
        pet_name: pet.name,
        owner_name: pet.owner_name,
      })
    }
  }

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (name === "pet_id") {
      handlePetChange(value)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Combine date and time
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`).toISOString()

      // Get clinic_id from the selected pet
      const clinic_id = selectedPet?.clinic_id

      if (!clinic_id) {
        throw new Error("Clinic ID not found")
      }

      // Create new appointment
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          pet_id: formData.pet_id,
          pet_name: formData.pet_name,
          owner_name: formData.owner_name,
          appointment_date: appointmentDateTime,
          doctor_id: formData.doctor_id || null,
          notes: formData.notes || null,
          status: "scheduled",
          clinic_id,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Appointment created successfully",
      })

      // Redirect to appointments page
      router.push("/dashboard/appointments")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Appointment</h1>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pet_id" className="block text-sm font-medium mb-1">
                  Select Pet
                </label>
                <select
                  id="pet_id"
                  name="pet_id"
                  value={formData.pet_id}
                  onChange={handleChange}
                  required
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="">Select a pet</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species}) - Owner: {pet.owner_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="doctor_id" className="block text-sm font-medium mb-1">
                  Select Doctor
                </label>
                <select
                  id="doctor_id"
                  name="doctor_id"
                  value={formData.doctor_id}
                  onChange={handleChange}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="appointment_date" className="block text-sm font-medium mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  id="appointment_date"
                  name="appointment_date"
                  value={formData.appointment_date}
                  onChange={handleChange}
                  required
                  className="border rounded-md px-3 py-2 w-full"
                />
              </div>

              <div>
                <label htmlFor="appointment_time" className="block text-sm font-medium mb-1">
                  Appointment Time
                </label>
                <input
                  type="time"
                  id="appointment_time"
                  name="appointment_time"
                  value={formData.appointment_time}
                  onChange={handleChange}
                  required
                  className="border rounded-md px-3 py-2 w-full"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="border rounded-md px-3 py-2 w-full"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Appointment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
