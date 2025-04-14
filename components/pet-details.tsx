"use client"

import { useState, useRef } from "react"
import { Check } from "lucide-react"

interface PetDetailsProps {
  pet: {
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
    status: string
    doctor?: {
      name: string
    } | null
    diet_info?: string | null
    prevention_type?: string | null
    discuss_risks?: boolean | null
    recent_vet_clinic?: string | null
    recent_vet_reason?: string | null
    records_permission?: boolean | null
    medication_details?: string | null
    supplement_details?: string | null
    cancelled?: boolean
    cancelled_doctor?: string | null
    cancelled_at?: string | null
  }
}

export default function PetDetails({ pet }: PetDetailsProps) {
  const [copySuccess, setCopySuccess] = useState(false)
  const detailsRef = useRef<HTMLDivElement>(null)

  // Format prevention type for display
  const getPreventionTypeText = () => {
    if (!pet.prevention_type) return "None reported"

    switch (pet.prevention_type) {
      case "both":
        return "Flea/tick and heartworm"
      case "flea":
        return "Flea only"
      case "heartworm":
        return "Heartworm only"
      case "not_sure":
        return "Not sure"
      case "no":
        return "None"
      default:
        return pet.prevention_type
    }
  }

  // Generate symptoms list
  const getSymptomsList = () => {
    const symptoms = []
    if (pet.coughing) symptoms.push("Coughing")
    if (pet.sneezing) symptoms.push("Sneezing")
    if (pet.vomiting) symptoms.push("Vomiting")
    if (pet.diarrhea) symptoms.push("Diarrhea")

    return symptoms.length > 0 ? symptoms.join(", ") : "None reported"
  }

  // Generate formatted text for copying
  const getFormattedDetailsText = () => {
    const lines = [
      "HEALTH STATUS",
      `Sick Appointment: ${pet.sick_appointment ? "Yes" : "No"}`,
      `General Info: ${pet.general_info || "None reported"}`,
      `Symptoms: ${getSymptomsList()}`,
      "",
      "DIET & PREVENTION",
      `Diet Information: ${pet.diet_info || "None reported"}`,
      `Prevention Type: ${getPreventionTypeText()}`,
    ]

    // Add conditional prevention risks
    if (pet.prevention_type === "not_sure" || pet.prevention_type === "no") {
      lines.push(
        `Discuss Prevention Risks: ${pet.discuss_risks === true ? "Yes" : pet.discuss_risks === false ? "No" : "Not specified"}`,
      )
    }

    lines.push("")
    lines.push("RECENT VET VISIT")

    if (pet.recent_vet_clinic) {
      lines.push(`Recent Vet Clinic: ${pet.recent_vet_clinic}`)
      lines.push(`Reason for Visit: ${pet.recent_vet_reason || "Not specified"}`)
      lines.push(
        `Records Permission: ${pet.records_permission === true ? "Yes" : pet.records_permission === false ? "No" : "Not specified"}`,
      )
    } else {
      lines.push("No recent vet visits reported")
    }

    lines.push("")
    lines.push("MEDICATIONS")
    lines.push(pet.medication_details ? pet.medication_details : "None reported")

    lines.push("")
    lines.push("SUPPLEMENTS")
    lines.push(pet.supplement_details ? pet.supplement_details : "None reported")

    // Add cancellation information if applicable
    if (pet.cancelled) {
      lines.push("")
      lines.push("APPOINTMENT STATUS")
      lines.push("Status: Cancelled")
      if (pet.cancelled_doctor) {
        lines.push(`Doctor: ${pet.cancelled_doctor}`)
      }
      if (pet.cancelled_at) {
        lines.push(`Cancelled at: ${new Date(pet.cancelled_at).toLocaleString()}`)
      }
    }

    return lines.join("\n")
  }

  // Handle copy to clipboard
  const handleCopyDetails = () => {
    const textToCopy = getFormattedDetailsText()

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
      })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Pet Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Basic Information */}
        <div className="bg-gray-900 p-4 rounded-sm h-fit">
          <h3 className="text-lg font-medium mb-3">Basic Information</h3>
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Owner Name:</span> {pet.owner_name}
            </p>
            <p>
              <span className="font-semibold">Pet Name:</span> {pet.pet_name}
            </p>
            <p>
              <span className="font-semibold">Species:</span> {pet.species}
            </p>
            <p>
              <span className="font-semibold">Doctor:</span> {pet.doctor?.name || pet.cancelled_doctor || "-"}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              <span
                className={`px-2 py-1 rounded-sm text-xs ${
                  pet.status === "active" ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"
                }`}
              >
                {pet.status}
              </span>
            </p>
            {pet.cancelled && (
              <p>
                <span className="font-semibold">Appointment:</span>{" "}
                <span className="px-2 py-1 rounded-sm text-xs bg-red-900 text-red-100">Cancelled</span>
                {pet.cancelled_at && (
                  <span className="text-xs ml-2">
                    on {new Date(pet.cancelled_at).toLocaleDateString()} at{" "}
                    {new Date(pet.cancelled_at).toLocaleTimeString()}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Box 2: All Other Details */}
        <div className="bg-gray-900 p-4 rounded-sm relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Medical Details</h3>
            <button
              onClick={handleCopyDetails}
              className={`px-3 py-1 text-sm rounded-sm flex items-center gap-1 ${
                copySuccess ? "bg-green-700 text-white" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {copySuccess ? (
                <>
                  <Check size={14} /> Copied
                </>
              ) : (
                "Copy Details"
              )}
            </button>
          </div>

          <div ref={detailsRef} className="space-y-4 text-sm">
            {/* Health Status */}
            <div>
              <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-1 mb-2">HEALTH STATUS</h4>
              <div className="space-y-1 pl-1">
                <p>
                  <span className="text-gray-400">Sick Appointment:</span> {pet.sick_appointment ? "Yes" : "No"}
                </p>
                <p>
                  <span className="text-gray-400">General Info:</span> {pet.general_info || "None reported"}
                </p>
                <p>
                  <span className="text-gray-400">Symptoms:</span> {getSymptomsList()}
                </p>
              </div>
            </div>

            {/* Diet & Prevention */}
            <div>
              <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-1 mb-2">DIET & PREVENTION</h4>
              <div className="space-y-1 pl-1">
                <p>
                  <span className="text-gray-400">Diet Information:</span> {pet.diet_info || "None reported"}
                </p>
                <p>
                  <span className="text-gray-400">Prevention Type:</span> {getPreventionTypeText()}
                </p>
                {(pet.prevention_type === "not_sure" || pet.prevention_type === "no") && (
                  <p>
                    <span className="text-gray-400">Discuss Prevention Risks:</span>{" "}
                    {pet.discuss_risks === true ? "Yes" : pet.discuss_risks === false ? "No" : "Not specified"}
                  </p>
                )}
              </div>
            </div>

            {/* Recent Vet Visit */}
            <div>
              <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-1 mb-2">RECENT VET VISIT</h4>
              <div className="space-y-1 pl-1">
                {pet.recent_vet_clinic ? (
                  <>
                    <p>
                      <span className="text-gray-400">Recent Vet Clinic:</span> {pet.recent_vet_clinic}
                    </p>
                    <p>
                      <span className="text-gray-400">Reason for Visit:</span>{" "}
                      {pet.recent_vet_reason || "Not specified"}
                    </p>
                    <p>
                      <span className="text-gray-400">Records Permission:</span>{" "}
                      {pet.records_permission === true
                        ? "Yes"
                        : pet.records_permission === false
                          ? "No"
                          : "Not specified"}
                    </p>
                  </>
                ) : (
                  <p>No recent vet visits reported</p>
                )}
              </div>
            </div>

            {/* Medications */}
            <div>
              <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-1 mb-2">MEDICATIONS</h4>
              <div className="bg-black/30 p-2 rounded-sm">
                {pet.medication_details ? (
                  <p className="whitespace-pre-line">{pet.medication_details}</p>
                ) : (
                  <p className="text-gray-400">None reported</p>
                )}
              </div>
            </div>

            {/* Supplements */}
            <div>
              <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-1 mb-2">SUPPLEMENTS</h4>
              <div className="bg-black/30 p-2 rounded-sm">
                {pet.supplement_details ? (
                  <p className="whitespace-pre-line">{pet.supplement_details}</p>
                ) : (
                  <p className="text-gray-400">None reported</p>
                )}
              </div>
            </div>

            {/* Cancellation Information */}
            {pet.cancelled && (
              <div>
                <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-1 mb-2">CANCELLATION DETAILS</h4>
                <div className="space-y-1 pl-1">
                  <p>
                    <span className="text-gray-400">Status:</span>{" "}
                    <span className="text-red-400">Appointment Cancelled</span>
                  </p>
                  {pet.cancelled_doctor && (
                    <p>
                      <span className="text-gray-400">Doctor:</span> {pet.cancelled_doctor}
                    </p>
                  )}
                  {pet.cancelled_at && (
                    <p>
                      <span className="text-gray-400">Cancelled at:</span> {new Date(pet.cancelled_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
