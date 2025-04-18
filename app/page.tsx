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
  const [email, setEmail] = useState("")

  // Fetch doctors when clinic ID is set
  useEffect(() => {
    if (clinicId) {
      fetchDoctors()
    }
  }, [clinicId])

  // Optimize the fetchDoctors function
  const fetchDoctors = async () => {
    try {
      const supabase = createClientSupabaseClient()

      if (!clinicId) {
        return
      }

      // Select only the fields we need
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

  // Optimize the verifyCode function
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
        .select("clinic_id")
        .eq("code", codeInput)
        .eq("active", true)
        .gt("expires_at", now)
        .limit(1)
        .single()

      if (error) {
        console.error("Error verifying code:", error)
        setCodeError("Invalid or expired code")
        return
      }

      // Code is valid
      setIsCodeVerified(true)
      setClinicId(data.clinic_id)
    } catch (error) {
      console.error("Error:", error)
      setCodeError("Invalid or expired code")
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

      // Send notification to the clinic
      if (petResult && petResult.length > 0 && clinicId) {
        try {
          await fetch("/api/notify-clinic", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              petId: petResult[0].id,
              clinicId,
            }),
          })
        } catch (notifyError) {
          console.error("Error notifying clinic:", notifyError)
          // Continue with the flow even if notification fails
        }
      }

      // Send confirmation email if we have an email address
      if (email) {
        try {
          const emailResponse = await fetch("/api/send-checkin-confirmation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ownerEmail: email,
              ownerName,
              petName,
              doctorName: selectedDoctor ? selectedDoctor.name : null,
            }),
          })

          if (!emailResponse.ok) {
            console.error("Failed to send confirmation email")
          }
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError)
          // Continue with the flow even if email fails
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
      setEmail("")

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
    <div className="min-h-screen flex flex-col items-center p-4 pt-16">
      <div className="absolute top-4 right-4">
        <Link href="/login" className="px-4 py-2 text-sm bg-transparent hover:underline">
          clinic login
        </Link>
      </div>

      {!isCodeVerified ? (
        <>
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Vet Clinic Check-in</h1>
          </div>

          {/* Full-width carousel */}
          <div className="w-full max-w-4xl mx-auto mb-8">
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

          <div className="w-full max-w-md">
            <p className="mb-6 text-center text-gray-400">Please enter the check-in code provided by your clinic</p>

            <form onSubmit={verifyCode} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm text-center">
                  Check-in Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                  placeholder="Enter code (e.g. PET123)"
                  required
                />
                {codeError && <p className="text-red-500 text-sm">{codeError}</p>}
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm"
              >
                {isVerifying ? "Verifying..." : "Continue"}
              </button>
            </form>
          </div>
        </>
      ) : submitSuccess ? (
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">{cancelled ? "Appointment Cancelled" : "Check-in Successful!"}</h1>
          <p className="mb-6 text-gray-400">
            {cancelled
              ? `Your appointment for ${petName} has been cancelled. We hope to see you soon!`
              : `Your pet ${petName} has been successfully checked in. The clinic staff will see you shortly.`}
          </p>
          <button onClick={resetForm} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm">
            {cancelled ? "Return to check-in" : "Check in another pet"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <h1 className="text-2xl font-bold mb-4">Pet Check-in Form</h1>

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
            <label htmlFor="email" className="block text-sm">
              email (optional):
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
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
            <label className="block text-sm font-medium">Are you able to make your scheduled appointment today?</label>
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
                No
              </button>
            </div>
          </div>

          {/* Show cancellation message if appointment is cancelled */}
          {appointmentConfirmation === false && (
            <div className="bg-red-900/30 border border-red-700 p-4 rounded-sm mb-4">
              <p className="font-medium text-red-200 mb-2">Appointment Cancellation</p>
              <p>Sorry to hear you cannot make it today. Press "Confirm Cancellation" below to notify the clinic.</p>
            </div>
          )}

          {/* The rest of the form - disabled if appointment is cancelled */}
          {appointmentConfirmation !== false && (
            <>
              {/* Diet Information */}
              <div className="space-y-2">
                <label htmlFor="dietInfo" className="block text-sm">
                  What type of diet does {petName || "your pet"} eat and how much?
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
                <label className="block text-sm">
                  Is {petName || "your pet"} on flea/tick or heartworm prevention?
                </label>
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
                    Are you interested in discussing the risks of flea/ticks/and heartworm at the appointment?
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
                <label className="block text-sm">Has {petName || "your pet"} been to another vet recently?</label>
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
                  What type of medication is {petName || "your pet"} on? Please list the dosage, frequency, and last
                  time that medication was given. (Do not include supplements)
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
                  Please list all supplements that {petName || "your pet"} is receiving. Please list amount and
                  frequency.
                </label>
                <textarea
                  id="supplementDetails"
                  value={supplementDetails}
                  onChange={(e) => setSupplementDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm">
                  Email address:
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm">is {petName || "your pet"} sick today?</label>
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
                      In a few sentences, what is wrong with {petName || "your pet"}?
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
                    <label className="block text-sm">
                      I'm sorry to hear that, is {petName || "your pet"} experiencing any of the following?
                    </label>
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
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 ${
              appointmentConfirmation === false ? "bg-red-800 hover:bg-red-700" : "bg-gray-800 hover:bg-gray-700"
            } text-white rounded-sm`}
          >
            {isSubmitting ? "Submitting..." : appointmentConfirmation === false ? "Confirm Cancellation" : "Submit"}
          </button>
        </form>
      )}
    </div>
  )
}
