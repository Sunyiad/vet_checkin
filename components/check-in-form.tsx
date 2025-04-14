"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"

interface Doctor {
  id: string
  name: string
}

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
  doctor_id?: string
  diet_info?: string
  prevention_type?: string
  discuss_risks?: boolean
  recent_vet_clinic?: string
  recent_vet_reason?: string
  records_permission?: boolean
  medication_details?: string
  supplement_details?: string
  cancelled?: boolean
  cancelled_doctor?: string
  cancelled_at?: string
}

interface CheckInFormProps {
  pet?: Pet
  onClose: () => void
}

export default function CheckInForm({ pet, onClose }: CheckInFormProps) {
  const [ownerName, setOwnerName] = useState("")
  const [petName, setPetName] = useState("")
  const [species, setSpecies] = useState("dog")
  const [isSick, setIsSick] = useState(false)
  const [generalInfo, setGeneralInfo] = useState("")
  const [symptoms, setSymptoms] = useState({
    coughing: false,
    sneezing: false,
    vomiting: false,
    diarrhea: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)

  // New form fields
  const [dietInfo, setDietInfo] = useState("")
  const [preventionType, setPreventionType] = useState<string | null>(null)
  const [discussRisks, setDiscussRisks] = useState<boolean | null>(null)
  const [recentVetVisit, setRecentVetVisit] = useState<boolean | null>(null)
  const [recentVetClinic, setRecentVetClinic] = useState("")
  const [recentVetReason, setRecentVetReason] = useState("")
  const [recordsPermission, setRecordsPermission] = useState<boolean | null>(null)
  const [medicationDetails, setMedicationDetails] = useState("")
  const [supplementDetails, setSupplementDetails] = useState("")
  const [appointmentConfirmation, setAppointmentConfirmation] = useState<boolean | null>(true) // Default to true for admin form
  const [cancelled, setCancelled] = useState(false)

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors()
  }, [])

  // Pre-fill form if pet is provided
  useEffect(() => {
    if (pet) {
      setOwnerName(pet.owner_name)
      setPetName(pet.pet_name)
      setSpecies(pet.species)
      setIsSick(pet.is_sick)
      setGeneralInfo(pet.general_info || "")
      setSymptoms({
        coughing: pet.coughing,
        sneezing: pet.sneezing,
        vomiting: pet.vomiting,
        diarrhea: pet.diarrhea,
      })
      if (pet.doctor_id) {
        setSelectedDoctorId(pet.doctor_id)
      }

      // Set new fields if they exist
      if (pet.diet_info) setDietInfo(pet.diet_info)
      if (pet.prevention_type) setPreventionType(pet.prevention_type)
      if (pet.discuss_risks !== undefined) setDiscussRisks(pet.discuss_risks)
      if (pet.recent_vet_clinic) {
        setRecentVetVisit(true)
        setRecentVetClinic(pet.recent_vet_clinic)
      }
      if (pet.recent_vet_reason) setRecentVetReason(pet.recent_vet_reason)
      if (pet.records_permission !== undefined) setRecordsPermission(pet.records_permission)
      if (pet.medication_details) setMedicationDetails(pet.medication_details)
      if (pet.supplement_details) setSupplementDetails(pet.supplement_details)
      if (pet.cancelled) {
        setCancelled(pet.cancelled)
        setAppointmentConfirmation(false)
      }
    }
  }, [pet])

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
        .select("id, name")
        .eq("clinic_id", clinic.id)
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

  // Handle appointment confirmation change
  const handleAppointmentConfirmation = (confirmed: boolean) => {
    setAppointmentConfirmation(confirmed)
    if (!confirmed) {
      setCancelled(true)
    } else {
      setCancelled(false)
    }
  }

  // Update the handleSubmit function to include the new fields
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClientSupabaseClient()

      // Get the clinic ID from localStorage
      const clinicData = localStorage.getItem("clinic")
      if (!clinicData) {
        console.error("No clinic data found")
        return
      }

      const clinic = JSON.parse(clinicData)

      // Get the selected doctor's name for reference
      const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId)
      const doctorName = selectedDoctor ? selectedDoctor.name : null

      if (pet) {
        // Update existing pet
        const { error } = await supabase
          .from("pets")
          .update({
            owner_name: ownerName,
            pet_name: petName,
            species,
            is_sick: isSick,
            sick_appointment: isSick,
            general_info: generalInfo,
            coughing: symptoms.coughing,
            sneezing: symptoms.sneezing,
            vomiting: symptoms.vomiting,
            diarrhea: symptoms.diarrhea,
            doctor_id: selectedDoctorId,
            // New fields
            diet_info: dietInfo,
            prevention_type: preventionType,
            discuss_risks: discussRisks,
            recent_vet_clinic: recentVetVisit ? recentVetClinic : null,
            recent_vet_reason: recentVetVisit ? recentVetReason : null,
            records_permission: recentVetVisit ? recordsPermission : null,
            medication_details: medicationDetails,
            supplement_details: supplementDetails,
            cancelled: cancelled,
            cancelled_doctor: cancelled && doctorName ? doctorName : null,
            cancelled_at: cancelled ? new Date().toISOString() : null,
            // Don't update status here to preserve existing status
          })
          .eq("id", pet.id)

        if (error) {
          console.error("Error updating pet:", error)
          return
        }
      } else {
        // Insert new pet
        const { error } = await supabase.from("pets").insert({
          owner_name: ownerName,
          pet_name: petName,
          species,
          is_sick: isSick,
          sick_appointment: isSick,
          general_info: generalInfo,
          coughing: symptoms.coughing,
          sneezing: symptoms.sneezing,
          vomiting: symptoms.vomiting,
          diarrhea: symptoms.diarrhea,
          clinic_id: clinic.id,
          status: "active", // Set status to active for new pets
          doctor_id: selectedDoctorId,
          // New fields
          diet_info: dietInfo,
          prevention_type: preventionType,
          discuss_risks: discussRisks,
          recent_vet_clinic: recentVetVisit ? recentVetClinic : null,
          recent_vet_reason: recentVetVisit ? recentVetReason : null,
          records_permission: recentVetVisit ? recordsPermission : null,
          medication_details: medicationDetails,
          supplement_details: supplementDetails,
          cancelled: cancelled,
          cancelled_doctor: cancelled && doctorName ? doctorName : null,
          cancelled_at: cancelled ? new Date().toISOString() : null,
        })

        if (error) {
          console.error("Error submitting form:", error)
          return
        }
      }

      onClose()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSymptomsChange = (symptom: keyof typeof symptoms) => {
    setSymptoms((prev) => ({
      ...prev,
      [symptom]: !prev[symptom],
    }))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{pet ? `Check in ${pet.pet_name}` : "New Check-in"}</h2>
        <button onClick={onClose} className="text-sm hover:underline">
          Back to dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="ownerName" className="block text-sm">
            first and last name:
          </label>
          <input
            id="ownerName"
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="petName" className="block text-sm">
            pet's name:
          </label>
          <input
            id="petName"
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm">species</label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setSpecies("dog")}
              className={`px-4 py-2 rounded-sm ${
                species === "dog" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
              }`}
            >
              dog
            </button>
            <button
              type="button"
              onClick={() => setSpecies("cat")}
              className={`px-4 py-2 rounded-sm ${
                species === "cat" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
              }`}
            >
              cat
            </button>
          </div>
        </div>

        {/* Doctor selection dropdown */}
        <div className="space-y-2">
          <label htmlFor="doctor" className="block text-sm">
            doctor:
          </label>
          <select
            id="doctor"
            value={selectedDoctorId || ""}
            onChange={(e) => setSelectedDoctorId(e.target.value || null)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-sm text-white"
            style={{ color: "white", backgroundColor: "#1a1a1a" }}
          >
            <option value="">Select a doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>

        {/* Appointment Confirmation Section - MOVED HERE after doctor selection */}
        <div className="space-y-2 border border-gray-700 p-4 rounded-sm">
          <label className="block text-sm font-medium">Is this appointment confirmed?</label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handleAppointmentConfirmation(true)}
              className={`px-4 py-2 rounded-sm ${
                appointmentConfirmation === true ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleAppointmentConfirmation(false)}
              className={`px-4 py-2 rounded-sm ${
                appointmentConfirmation === false ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300"
              }`}
            >
              No (Cancelled)
            </button>
          </div>
        </div>

        {/* Show cancellation message if appointment is cancelled */}
        {appointmentConfirmation === false ? (
          <div className="bg-red-900/30 border border-red-700 p-4 rounded-sm">
            <p>This appointment has been marked as cancelled.</p>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Diet Information */}
            <div className="space-y-2">
              <label htmlFor="dietInfo" className="block text-sm">
                What type of diet does {petName || "the pet"} eat and how much?
              </label>
              <input
                id="dietInfo"
                type="text"
                value={dietInfo}
                onChange={(e) => setDietInfo(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
              />
            </div>

            {/* Flea/Tick & Heartworm Prevention */}
            <div className="space-y-2">
              <label className="block text-sm">Is {petName || "the pet"} on flea/tick or heartworm prevention?</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreventionType("both")}
                  className={`px-4 py-2 rounded-sm ${
                    preventionType === "both" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  Yes: flea/tick and heartworm
                </button>
                <button
                  type="button"
                  onClick={() => setPreventionType("flea")}
                  className={`px-4 py-2 rounded-sm ${
                    preventionType === "flea" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  Yes: flea only
                </button>
                <button
                  type="button"
                  onClick={() => setPreventionType("heartworm")}
                  className={`px-4 py-2 rounded-sm ${
                    preventionType === "heartworm" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  Yes: heartworm only
                </button>
                <button
                  type="button"
                  onClick={() => setPreventionType("not_sure")}
                  className={`px-4 py-2 rounded-sm ${
                    preventionType === "not_sure" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  Not sure
                </button>
                <button
                  type="button"
                  onClick={() => setPreventionType("no")}
                  className={`px-4 py-2 rounded-sm ${
                    preventionType === "no" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Conditional question for prevention risks */}
            {(preventionType === "not_sure" || preventionType === "no") && (
              <div className="space-y-2 ml-4 border-l-2 border-gray-700 pl-4">
                <label className="block text-sm">
                  Are they interested in discussing the risks of flea/ticks/and heartworm at the appointment?
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setDiscussRisks(true)}
                    className={`px-4 py-2 rounded-sm ${
                      discussRisks === true ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscussRisks(false)}
                    className={`px-4 py-2 rounded-sm ${
                      discussRisks === false ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* Recent Vet Visit */}
            <div className="space-y-2">
              <label className="block text-sm">Has {petName || "the pet"} been to another vet recently?</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setRecentVetVisit(true)}
                  className={`px-4 py-2 rounded-sm ${
                    recentVetVisit === true ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setRecentVetVisit(false)}
                  className={`px-4 py-2 rounded-sm ${
                    recentVetVisit === false ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Conditional questions for recent vet visit */}
            {recentVetVisit === true && (
              <div className="space-y-4 ml-4 border-l-2 border-gray-700 pl-4">
                <div className="space-y-2">
                  <label htmlFor="recentVetClinic" className="block text-sm">
                    What clinic was that?
                  </label>
                  <input
                    id="recentVetClinic"
                    type="text"
                    value={recentVetClinic}
                    onChange={(e) => setRecentVetClinic(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="recentVetReason" className="block text-sm">
                    What was the reason for that visit?
                  </label>
                  <input
                    id="recentVetReason"
                    type="text"
                    value={recentVetReason}
                    onChange={(e) => setRecentVetReason(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm">Do we have permission to request records from that clinic?</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setRecordsPermission(true)}
                      className={`px-4 py-2 rounded-sm ${
                        recordsPermission === true ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordsPermission(false)}
                      className={`px-4 py-2 rounded-sm ${
                        recordsPermission === false ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Medication Details */}
            <div className="space-y-2">
              <label htmlFor="medicationDetails" className="block text-sm">
                What type of medication is {petName || "the pet"} on? Please list the dosage, frequency, and last time
                that medication was given. (Do not include supplements)
              </label>
              <textarea
                id="medicationDetails"
                value={medicationDetails}
                onChange={(e) => setMedicationDetails(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white min-h-[100px]"
              />
            </div>

            {/* Supplement Details */}
            <div className="space-y-2">
              <label htmlFor="supplementDetails" className="block text-sm">
                Please list all supplements that {petName || "the pet"} is receiving. Please list amount and frequency.
              </label>
              <textarea
                id="supplementDetails"
                value={supplementDetails}
                onChange={(e) => setSupplementDetails(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm">is {petName || "the pet"} sick today?</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSick(true)}
                  className={`px-4 py-2 rounded-sm ${isSick ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}
                >
                  yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsSick(false)}
                  className={`px-4 py-2 rounded-sm ${!isSick ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}
                >
                  no
                </button>
              </div>
            </div>

            {isSick && (
              <>
                <div className="space-y-2">
                  <label htmlFor="generalInfo" className="block text-sm">
                    In a few sentences, what is wrong with {petName || "the pet"}?
                  </label>
                  <input
                    id="generalInfo"
                    type="text"
                    value={generalInfo}
                    onChange={(e) => setGeneralInfo(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm">Is {petName || "the pet"} experiencing any of the following?</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSymptomsChange("coughing")}
                      className={`px-4 py-2 rounded-sm ${
                        symptoms.coughing ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      coughing
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSymptomsChange("sneezing")}
                      className={`px-4 py-2 rounded-sm ${
                        symptoms.sneezing ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      sneezing
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSymptomsChange("diarrhea")}
                      className={`px-4 py-2 rounded-sm ${
                        symptoms.diarrhea ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      diarrhea
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSymptomsChange("vomiting")}
                      className={`px-4 py-2 rounded-sm ${
                        symptoms.vomiting ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      vomiting
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm"
            >
              {isSubmitting ? "Submitting..." : "submit"}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
