"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientSupabaseClient } from "@/lib/supabase"
import ImageCarousel from "@/components/image-carousel"

interface Doctor {
  id: string
  name: string
}

export default function Home() {
  const [codeInput, setCodeInput] = useState("")
  const [codeError, setCodeError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCodeVerified, setIsCodeVerified] = useState(false)
  const [clinicId, setClinicId] = useState<string | null>(null)

  // Check-in form state
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
  const [submitSuccess, setSubmitSuccess] = useState(false)
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
  const [appointmentConfirmation, setAppointmentConfirmation] = useState<boolean | null>(null)
  const [cancelled, setCancelled] = useState(false)

  // Fetch doctors when clinic ID is set
  useEffect(() => {
    if (clinicId) {
      fetchDoctors()
    }
  }, [clinicId])

  const fetchDoctors = async () => {
    try {
      const supabase = createClientSupabaseClient()

      if (!clinicId) {
        return
      }

      const { data, error } = await supabase
        .from("doctors")
        .select("id, name")
        .eq("clinic_id", clinicId)
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

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setCodeError("")

    try {
      const supabase = createClientSupabaseClient()

      // Check if the code exists and is active
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("codes")
        .select("*")
        .eq("code", codeInput)
        .eq("active", true)
        .gt("expires_at", now)
        .limit(1)

      if (error) {
        console.error("Error verifying code:", error)
        setCodeError("An error occurred while verifying the code")
        return
      }

      if (!data || data.length === 0) {
        setCodeError("Invalid or expired code")
        return
      }

      // Code is valid
      setIsCodeVerified(true)
      setClinicId(data[0].clinic_id)
    } catch (error) {
      console.error("Error:", error)
      setCodeError("An error occurred")
    } finally {
      setIsVerifying(false)
    }
  }

  // Update the handleSubmit function to include the new fields
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Store the current cancellation state to use after form submission
    const isCancelled = cancelled

    try {
      const supabase = createClientSupabaseClient()

      if (!clinicId) {
        console.error("No clinic ID found")
        return
      }

      // Get the selected doctor's name for reference
      const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId)
      const doctorName = selectedDoctor ? selectedDoctor.name : "Not specified"
      const currentTime = new Date().toISOString()

      // Create the pet data object
      const petData: any = {
        owner_name: ownerName,
        pet_name: petName,
        species,
        is_sick: isSick,
        sick_appointment: isSick,
        clinic_id: clinicId,
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
        // Set the status based on whether the appointment is cancelled
        status: isCancelled ? "cancelled" : "active",
        // Explicitly set the cancelled field
        cancelled: isCancelled,
      }

      // Only add cancelled_at and cancelled_doctor if the appointment is cancelled
      if (isCancelled) {
        petData.cancelled_at = currentTime
        petData.cancelled_doctor = doctorName
      }

      // Add cancellation info to general_info if appointment is cancelled
      if (isCancelled) {
        petData.general_info = `CANCELLED APPOINTMENT - Doctor: ${doctorName} - ${new Date().toLocaleString()}${
          generalInfo ? ` - Additional info: ${generalInfo}` : ""
        }`
      } else {
        petData.general_info = generalInfo
        petData.coughing = symptoms.coughing
        petData.sneezing = symptoms.sneezing
        petData.vomiting = symptoms.vomiting
        petData.diarrhea = symptoms.diarrhea
      }

      // Insert into pets table
      const { data: petResult, error: petError } = await supabase.from("pets").insert(petData).select()

      if (petError) {
        console.error("Error submitting form:", petError)
        return
      }

      // Also insert into appointments table for better tracking
      if (petResult && petResult.length > 0) {
        const appointmentData = {
          pet_name: petName,
          owner_name: ownerName,
          doctor: doctorName,
          doctor_id: selectedDoctorId,
          status: isCancelled ? "cancelled" : "active",
          pet_id: petResult[0].id,
          clinic_id: clinicId,
          appointment_date: currentTime,
          cancelled_date: isCancelled ? currentTime : null,
          cancelled_reason: isCancelled ? "Client cancelled" : null,
          notes: isCancelled ? `Cancelled by client on ${new Date().toLocaleString()}` : null,
        }

        const { error: appointmentError } = await supabase.from("appointments").insert(appointmentData)

        if (appointmentError) {
          console.error("Error creating appointment record:", appointmentError)
          // Continue anyway since the pet record was created successfully
        }
      }

      // Save the pet name for the success message
      const submittedPetName = petName

      // Reset form and show success message
      setSubmitSuccess(true)
      setOwnerName("")
      setPetName("")
      setSpecies("dog")
      setIsSick(false)
      setGeneralInfo("")
      setSymptoms({
        coughing: false,
        sneezing: false,
        vomiting: false,
        diarrhea: false,
      })
      setSelectedDoctorId(null)
      // Reset new fields
      setDietInfo("")
      setPreventionType(null)
      setDiscussRisks(null)
      setRecentVetVisit(null)
      setRecentVetClinic("")
      setRecentVetReason("")
      setRecordsPermission(null)
      setMedicationDetails("")
      setSupplementDetails("")
      setAppointmentConfirmation(null)

      // Important: Set the cancelled state based on the stored value
      // This ensures the correct message is shown
      setCancelled(isCancelled)

      // If the appointment was cancelled, update the pet name in the success message
      if (isCancelled) {
        setPetName(submittedPetName)
      }
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

  const resetForm = () => {
    setSubmitSuccess(false)
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

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-16 bg-gradient-to-b from-gray-900 to-black">
      <div className="absolute top-4 right-4">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-1"
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
            className="lucide lucide-log-in"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" x2="3" y1="12" y2="12" />
          </svg>
          Clinic Login
        </Link>
      </div>

      {!isCodeVerified ? (
        <>
          <div className="w-full max-w-md mb-8">
            <h1 className="text-3xl font-bold mb-2 text-center text-white">Vet Clinic Check-in</h1>
            <p className="text-center text-blue-300 text-sm">Fast and easy check-in for your pet's appointment</p>
          </div>

          {/* Full-width carousel with enhanced styling */}
          <div className="w-full max-w-4xl mx-auto mb-10 rounded-xl overflow-hidden shadow-2xl">
            <ImageCarousel
              images={[
                {
                  src: "https://images.unsplash.com/photo-1649313170565-04b38ad0c4e8",
                  alt: "A woman holding a cat in her arms",
                },
                {
                  src: "https://images.unsplash.com/photo-1687993377657-f2fb8d53079e",
                  alt: "A dog and a cat sitting on a couch",
                },
                {
                  src: "https://images.unsplash.com/photo-1450778869180-41d0601e046e",
                  alt: "A person with a dog",
                },
              ]}
            />
          </div>

          <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-800">
            <p className="mb-6 text-center text-gray-300">Please enter the check-in code provided by your clinic</p>

            <form onSubmit={verifyCode} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm font-medium text-gray-300 text-center">
                  Check-in Code
                </label>
                <div className="relative">
                  <input
                    id="code"
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter code (e.g. PET123)"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
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
                      className="text-gray-400"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
                {codeError && (
                  <div className="flex items-center gap-1.5 mt-2">
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
                      className="text-red-400"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                    <p className="text-red-400 text-sm">{codeError}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                {isVerifying ? (
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
                    Verifying...
                  </>
                ) : (
                  <>
                    Continue
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
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </>
      ) : submitSuccess ? (
        <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-800 text-center">
          <div className="mb-6">
            {cancelled ? (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/30 text-red-400 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/30 text-green-400 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            )}
            <h1 className="text-2xl font-bold mb-2">{cancelled ? "Appointment Cancelled" : "Check-in Successful!"}</h1>
            <p className="text-gray-300">
              {cancelled
                ? `Your appointment for ${petName} has been cancelled. We hope to see you soon!`
                : `Your pet ${petName} has been successfully checked in. The clinic staff will see you shortly.`}
            </p>
          </div>
          <button
            onClick={resetForm}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md ${
              cancelled ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {cancelled ? "Return to check-in" : "Check in another pet"}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-800">
          <h1 className="text-2xl font-bold mb-6 text-center">Pet Check-in Form</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300">
                First and Last Name
              </label>
              <input
                id="ownerName"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="petName" className="block text-sm font-medium text-gray-300">
                Pet's Name
              </label>
              <input
                id="petName"
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Species</label>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setSpecies("dog")}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 ${
                    species === "dog"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Dog
                </button>
                <button
                  type="button"
                  onClick={() => setSpecies("cat")}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 ${
                    species === "cat"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Cat
                </button>
              </div>
            </div>

            {/* Doctor selection dropdown */}
            <div className="space-y-2">
              <label htmlFor="doctor" className="block text-sm font-medium text-gray-300">
                Doctor
              </label>
              <div className="relative">
                <select
                  id="doctor"
                  value={selectedDoctorId || ""}
                  onChange={(e) => setSelectedDoctorId(e.target.value || null)}
                  className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select a doctor</option>
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

            {/* Appointment Confirmation Section */}
            <div className="space-y-3 border border-gray-700 p-5 rounded-lg bg-gray-800/50">
              <label className="block text-sm font-medium text-gray-200">
                Are you able to make your scheduled appointment today?
              </label>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => handleAppointmentConfirmation(true)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 ${
                    appointmentConfirmation === true
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleAppointmentConfirmation(false)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 ${
                    appointmentConfirmation === false
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Show cancellation message if appointment is cancelled */}
            {appointmentConfirmation === false && (
              <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
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
                      className="text-red-400"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" x2="12" y1="8" y2="12" />
                      <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-red-300 mb-1">Appointment Cancellation</p>
                    <p className="text-red-200 text-sm">
                      Sorry to hear you cannot make it today. Press "Confirm Cancellation" below to notify the clinic.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* The rest of the form - disabled if appointment is cancelled */}
            {appointmentConfirmation !== false && (
              <>
                {/* Diet Information */}
                <div className="space-y-2">
                  <label htmlFor="dietInfo" className="block text-sm font-medium text-gray-300">
                    What type of diet does {petName || "your pet"} eat and how much?
                  </label>
                  <input
                    id="dietInfo"
                    type="text"
                    value={dietInfo}
                    onChange={(e) => setDietInfo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Flea/Tick & Heartworm Prevention */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Is {petName || "your pet"} on flea/tick or heartworm prevention?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreventionType("both")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        preventionType === "both"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      Yes: flea/tick and heartworm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreventionType("flea")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        preventionType === "flea"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      Yes: flea only
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreventionType("heartworm")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        preventionType === "heartworm"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      Yes: heartworm only
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreventionType("not_sure")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        preventionType === "not_sure"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      Not sure
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreventionType("no")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        preventionType === "no"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Conditional question for prevention risks */}
                {(preventionType === "not_sure" || preventionType === "no") && (
                  <div className="space-y-3 ml-4 border-l-2 border-blue-700 pl-4">
                    <label className="block text-sm font-medium text-gray-300">
                      Are you interested in discussing the risks of flea/ticks/and heartworm at the appointment?
                    </label>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setDiscussRisks(true)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          discussRisks === true
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscussRisks(false)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          discussRisks === false
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}

                {/* Recent Vet Visit */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Has {petName || "your pet"} been to another vet recently?
                  </label>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setRecentVetVisit(true)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        recentVetVisit === true
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecentVetVisit(false)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        recentVetVisit === false
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Conditional questions for recent vet visit */}
                {recentVetVisit === true && (
                  <div className="space-y-4 ml-4 border-l-2 border-blue-700 pl-4">
                    <div className="space-y-2">
                      <label htmlFor="recentVetClinic" className="block text-sm font-medium text-gray-300">
                        What clinic was that?
                      </label>
                      <input
                        id="recentVetClinic"
                        type="text"
                        value={recentVetClinic}
                        onChange={(e) => setRecentVetClinic(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="recentVetReason" className="block text-sm font-medium text-gray-300">
                        What was the reason for that visit?
                      </label>
                      <input
                        id="recentVetReason"
                        type="text"
                        value={recentVetReason}
                        onChange={(e) => setRecentVetReason(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Do we have permission to request records from that clinic?
                      </label>
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => setRecordsPermission(true)}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                            recordsPermission === true
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecordsPermission(false)}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                            recordsPermission === false
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
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
                  <label htmlFor="medicationDetails" className="block text-sm font-medium text-gray-300">
                    What type of medication is {petName || "your pet"} on? Please list the dosage, frequency, and last
                    time that medication was given. (Do not include supplements)
                  </label>
                  <textarea
                    id="medicationDetails"
                    value={medicationDetails}
                    onChange={(e) => setMedicationDetails(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[100px] resize-y"
                  />
                </div>

                {/* Supplement Details */}
                <div className="space-y-2">
                  <label htmlFor="supplementDetails" className="block text-sm font-medium text-gray-300">
                    Please list all supplements that {petName || "your pet"} is receiving. Please list amount and
                    frequency.
                  </label>
                  <textarea
                    id="supplementDetails"
                    value={supplementDetails}
                    onChange={(e) => setSupplementDetails(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[100px] resize-y"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Is {petName || "your pet"} sick today?
                  </label>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsSick(true)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        isSick ? "bg-blue-600 text-white shadow-md" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSick(false)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        !isSick ? "bg-blue-600 text-white shadow-md" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {isSick && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="generalInfo" className="block text-sm font-medium text-gray-300">
                        In a few sentences, what is wrong with {petName || "your pet"}?
                      </label>
                      <input
                        id="generalInfo"
                        type="text"
                        value={generalInfo}
                        onChange={(e) => setGeneralInfo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300">
                        I'm sorry to hear that, is {petName || "your pet"} experiencing any of the following?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleSymptomsChange("coughing")}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            symptoms.coughing
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          Coughing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSymptomsChange("sneezing")}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            symptoms.sneezing
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          Sneezing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSymptomsChange("diarrhea")}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            symptoms.diarrhea
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          Diarrhea
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSymptomsChange("vomiting")}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            symptoms.vomiting
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          Vomiting
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 shadow-md flex items-center justify-center gap-2 ${
                appointmentConfirmation === false
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isSubmitting ? (
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
                  Submitting...
                </>
              ) : appointmentConfirmation === false ? (
                <>
                  Confirm Cancellation
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
                    <circle cx="12" cy="12" r="10" />
                    <path d="m15 9-6 6" />
                    <path d="m9 9 6 6" />
                  </svg>
                </>
              ) : (
                <>
                  Submit
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
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
