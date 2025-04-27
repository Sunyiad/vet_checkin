"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { RefreshCw, Edit, Trash2, Plus, Info, X, Check } from "lucide-react"

interface Clinic {
  id: string
  email: string
  password: string
  name?: string
  contact_person?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  created_at: string
}

interface ClinicStats {
  totalPets: number
  activePets: number
  doctorsCount: number
  activeDoctors: number
  petsToday: number
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("clinics")
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [clinicStats, setClinicStats] = useState<Record<string, ClinicStats>>({})
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)
  const [showDetailsFor, setShowDetailsFor] = useState<string | null>(null)

  // New clinic code generation
  const [newClinicName, setNewClinicName] = useState("")
  const [newClinicEmail, setNewClinicEmail] = useState("")
  const [generatingCode, setGeneratingCode] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [codeError, setCodeError] = useState("")

  // Edit clinic form fields
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    contact_person: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  })

  const router = useRouter()

  useEffect(() => {
    // Check if admin is logged in
    const admin = localStorage.getItem("admin")
    if (!admin) {
      router.push("/admin/login")
      return
    }

    fetchClinics()
  }, [router])

  const fetchClinics = async () => {
    try {
      setLoading(true)
      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase.from("clinics").select("*").order("email", { ascending: true })

      if (error) {
        console.error("Error fetching clinics:", error)
        return
      }

      setClinics(data || [])

      // Fetch stats for each clinic
      const statsPromises = data?.map((clinic) => fetchClinicStats(clinic.id)) || []
      await Promise.all(statsPromises)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClinicStats = async (clinicId: string) => {
    try {
      const supabase = createClientSupabaseClient()

      // Get total pets count
      const { count: totalPets } = await supabase
        .from("pets")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId)

      // Get active pets count
      const { count: activePets } = await supabase
        .from("pets")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .eq("status", "active")

      // Get doctors count
      const { count: doctorsCount } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId)

      // Get active doctors count
      const { count: activeDoctors } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .eq("active", true)

      // Get pets checked in today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: petsToday } = await supabase
        .from("pets")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .gte("created_at", today.toISOString())

      setClinicStats((prev) => ({
        ...prev,
        [clinicId]: {
          totalPets: totalPets || 0,
          activePets: activePets || 0,
          doctorsCount: doctorsCount || 0,
          activeDoctors: activeDoctors || 0,
          petsToday: petsToday || 0,
        },
      }))
    } catch (error) {
      console.error("Error fetching clinic stats:", error)
    }
  }

  const handleGenerateCode = async () => {
    if (!newClinicName.trim() || !newClinicEmail.trim()) {
      setCodeError("Clinic name and email are required")
      return
    }

    try {
      setGeneratingCode(true)
      setCodeError("")
      const supabase = createClientSupabaseClient()

      // Check if clinic already exists
      const { data: existingClinic } = await supabase.from("clinics").select("id").eq("email", newClinicEmail).limit(1)

      if (existingClinic && existingClinic.length > 0) {
        setCodeError("A clinic with this email already exists")
        return
      }

      // Generate a random code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()

      // Set expiration to 24 hours from now
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Get admin email
      const admin = JSON.parse(localStorage.getItem("admin") || "{}")

      // Insert the code
      const { error } = await supabase.from("clinic_signup_codes").insert({
        code,
        clinic_name: newClinicName,
        clinic_email: newClinicEmail,
        expires_at: expiresAt.toISOString(),
        created_by: admin.email || "admin",
      })

      if (error) {
        console.error("Error generating code:", error)
        setCodeError("Failed to generate code")
        return
      }

      setGeneratedCode(code)

      // In a real app, you would send an email to the clinic with the signup link
      // For this demo, we'll just display the code
    } catch (error) {
      console.error("Error:", error)
      setCodeError("An error occurred")
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleEditClinic = (clinic: Clinic) => {
    setEditingClinic(clinic)
    setEditForm({
      name: clinic.name || "",
      email: clinic.email || "",
      contact_person: clinic.contact_person || "",
      address: clinic.address || "",
      city: clinic.city || "",
      state: clinic.state || "",
      zip: clinic.zip || "",
      phone: clinic.phone || "",
    })
  }

  const handleSaveClinic = async () => {
    if (!editingClinic) return

    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase
        .from("clinics")
        .update({
          email: editForm.email,
          name: editForm.name,
          contact_person: editForm.contact_person,
          address: editForm.address,
          city: editForm.city,
          state: editForm.state,
          zip: editForm.zip,
          phone: editForm.phone,
        })
        .eq("id", editingClinic.id)

      if (error) {
        console.error("Error updating clinic:", error)
        return
      }

      setEditingClinic(null)
      fetchClinics()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleDeleteClinic = async (clinicId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this clinic? This action cannot be undone. All related data (codes, pets, doctors, etc.) will also be deleted.",
      )
    ) {
      return
    }

    try {
      const supabase = createClientSupabaseClient()

      // First, delete all related records in the codes table
      const { error: codesError } = await supabase.from("codes").delete().eq("clinic_id", clinicId)

      if (codesError) {
        console.error("Error deleting related codes:", codesError)
        return
      }

      // Delete related records in the clinic_signup_codes table
      const { error: signupCodesError } = await supabase
        .from("clinic_signup_codes")
        .delete()
        .eq("clinic_email", clinics.find((c) => c.id === clinicId)?.email || "")

      if (signupCodesError) {
        console.error("Error deleting related signup codes:", signupCodesError)
        // Continue anyway as this might not exist
      }

      // Delete related records in the doctors table
      const { error: doctorsError } = await supabase.from("doctors").delete().eq("clinic_id", clinicId)

      if (doctorsError) {
        console.error("Error deleting related doctors:", doctorsError)
        return
      }

      // Delete related records in the pets table
      const { error: petsError } = await supabase.from("pets").delete().eq("clinic_id", clinicId)

      if (petsError) {
        console.error("Error deleting related pets:", petsError)
        return
      }

      // Finally, delete the clinic
      const { error } = await supabase.from("clinics").delete().eq("id", clinicId)

      if (error) {
        console.error("Error deleting clinic:", error)
        return
      }

      fetchClinics()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin")
    router.push("/admin/login")
  }

  // Helper function to get clinic display name
  const getClinicDisplayName = (clinic: Clinic) => {
    return clinic.name || clinic.email || "Unnamed Clinic"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Admin Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 
          rounded-md text-white shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>

      <div className="mb-6">
        <div className="flex border-b border-gray-700 mb-4">
          <button
            className={`px-6 py-3 ${
              activeTab === "clinics"
                ? "border-b-2 border-blue-500 font-medium text-white"
                : "text-gray-400 hover:text-gray-300"
            } transition-all duration-300`}
            onClick={() => setActiveTab("clinics")}
          >
            Clinic Stats
          </button>
          <button
            className={`px-6 py-3 ${
              activeTab === "add"
                ? "border-b-2 border-blue-500 font-medium text-white"
                : "text-gray-400 hover:text-gray-300"
            } transition-all duration-300`}
            onClick={() => setActiveTab("add")}
          >
            Add New Clinic
          </button>
        </div>
      </div>

      {activeTab === "clinics" ? (
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-gray-800/50 shadow-xl overflow-hidden">
          <div className="p-4 flex justify-between items-center border-b border-gray-800/50">
            <h2 className="text-xl font-semibold text-white">Clinics</h2>
            <button
              onClick={fetchClinics}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 
              rounded-md text-white shadow-md transition-all duration-300 flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-200">
                    <th className="px-6 py-3 text-left font-medium">Clinic Name</th>
                    <th className="px-6 py-3 text-left font-medium">Stats</th>
                    <th className="px-6 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clinics.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 mb-2 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          <p>No clinics found</p>
                          <button
                            onClick={() => setActiveTab("add")}
                            className="mt-3 text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Plus size={16} />
                            Add your first clinic
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    clinics.map((clinic) => (
                      <tr
                        key={clinic.id}
                        className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-white">{getClinicDisplayName(clinic)}</div>
                            <div className="text-sm text-gray-400">{clinic.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {clinicStats[clinic.id] ? (
                            <div className="text-sm grid grid-cols-2 gap-x-6 gap-y-1">
                              <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-blue-500/30 border border-blue-500 mr-2"></span>
                                Total Pets:{" "}
                                <span className="font-medium text-white ml-1">{clinicStats[clinic.id].totalPets}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500 mr-2"></span>
                                Active Pets:{" "}
                                <span className="font-medium text-white ml-1">{clinicStats[clinic.id].activePets}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-purple-500/30 border border-purple-500 mr-2"></span>
                                Doctors:{" "}
                                <span className="font-medium text-white ml-1">
                                  {clinicStats[clinic.id].doctorsCount}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500 mr-2"></span>
                                Today:{" "}
                                <span className="font-medium text-white ml-1">{clinicStats[clinic.id].petsToday}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center text-sm text-gray-400">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                              Loading stats...
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowDetailsFor(clinic.id)}
                              className="p-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 
                              rounded-md transition-all duration-300 shadow-sm"
                              title="View Details"
                            >
                              <Info size={16} className="text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleEditClinic(clinic)}
                              className="p-2 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 
                              rounded-md transition-all duration-300 shadow-sm"
                              title="Edit"
                            >
                              <Edit size={16} className="text-blue-300" />
                            </button>
                            <button
                              onClick={() => handleDeleteClinic(clinic.id)}
                              className="p-2 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 
                              rounded-md transition-all duration-300 shadow-sm"
                              title="Delete"
                            >
                              <Trash2 size={16} className="text-red-300" />
                            </button>
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
      ) : (
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-gray-800/50 shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-white">Add New Clinic</h2>

          {generatedCode ? (
            <div className="bg-gray-800/70 p-6 rounded-lg border border-gray-700/50 shadow-lg max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500">
                  <Check size={24} className="text-green-400" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-4 text-center text-white">Signup Code Generated</h3>
              <div className="space-y-4">
                <div className="bg-gray-900/70 rounded-md p-3 border border-gray-700/50">
                  <p className="text-sm text-gray-400 mb-1">Clinic Name</p>
                  <p className="font-medium text-white">{newClinicName}</p>
                </div>
                <div className="bg-gray-900/70 rounded-md p-3 border border-gray-700/50">
                  <p className="text-sm text-gray-400 mb-1">Clinic Email</p>
                  <p className="font-medium text-white">{newClinicEmail}</p>
                </div>
                <div className="bg-gray-900/70 rounded-md p-3 border border-gray-700/50">
                  <p className="text-sm text-gray-400 mb-1">Signup Code (valid for 24 hours)</p>
                  <p className="text-2xl font-bold text-center py-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    {generatedCode}
                  </p>
                </div>
                <div className="bg-gray-900/70 rounded-md p-3 border border-gray-700/50">
                  <p className="text-sm text-gray-400 mb-2">Signup Link</p>
                  <div className="bg-black p-3 rounded-md break-all">
                    <code className="text-xs text-blue-300">{`${window.location.origin}/signup?code=${generatedCode}`}</code>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => {
                    setGeneratedCode(null)
                    setNewClinicName("")
                    setNewClinicEmail("")
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 
                  rounded-md text-white shadow-lg transition-all duration-300"
                >
                  Create Another
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/70 p-6 rounded-lg border border-gray-700/50 shadow-lg max-w-md mx-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="clinicName" className="block text-sm font-medium text-gray-300">
                    Clinic Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
                        <path d="M12 11h4" />
                        <path d="M12 7h4" />
                        <path d="M12 15h4" />
                        <rect x="3" y="17" width="18" height="4" rx="1" />
                      </svg>
                    </div>
                    <input
                      id="clinicName"
                      type="text"
                      value={newClinicName}
                      onChange={(e) => setNewClinicName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-gray-900/70 border border-gray-700 rounded-md text-white 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter clinic name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="clinicEmail" className="block text-sm font-medium text-gray-300">
                    Clinic Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <input
                      id="clinicEmail"
                      type="email"
                      value={newClinicEmail}
                      onChange={(e) => setNewClinicEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-gray-900/70 border border-gray-700 rounded-md text-white 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter clinic email"
                      required
                    />
                  </div>
                </div>

                {codeError && (
                  <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-md text-sm flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {codeError}
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleGenerateCode}
                    disabled={generatingCode}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 
                    rounded-md text-white shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                  >
                    {generatingCode ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Generate Signup Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clinic Details Modal */}
      {showDetailsFor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-6 rounded-lg border border-gray-700/50 shadow-2xl max-w-2xl w-full">
            {clinics.find((c) => c.id === showDetailsFor) && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-medium text-white">
                    {getClinicDisplayName(clinics.find((c) => c.id === showDetailsFor)!)}
                  </h3>
                  <button
                    onClick={() => setShowDetailsFor(null)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-800/70 p-4 rounded-md border border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-1">Clinic Name</p>
                      <p className="text-white">
                        {clinics.find((c) => c.id === showDetailsFor)?.name || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gray-800/70 p-4 rounded-md border border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-1">Email</p>
                      <p className="text-white">{clinics.find((c) => c.id === showDetailsFor)?.email}</p>
                    </div>
                    <div className="bg-gray-800/70 p-4 rounded-md border border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-1">Contact Person</p>
                      <p className="text-white">
                        {clinics.find((c) => c.id === showDetailsFor)?.contact_person || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gray-800/70 p-4 rounded-md border border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-1">Phone</p>
                      <p className="text-white">
                        {clinics.find((c) => c.id === showDetailsFor)?.phone || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gray-800/70 p-4 rounded-md border border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-1">Address</p>
                      <p className="text-white">
                        {clinics.find((c) => c.id === showDetailsFor)?.address || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gray-800/70 p-4 rounded-md border border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-1">City</p>
                      <p className="text-white">
                        {clinics.find((c) => c.id === showDetailsFor)?.city || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gray-800/70 p-4 rounded-md border border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-1">State</p>
                      <p className="text-white">
                        {clinics.find((c) => c.id === showDetailsFor)?.state || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gray-800/70 p-4 rounded-md border border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-1">Zip Code</p>
                      <p className="text-white">
                        {clinics.find((c) => c.id === showDetailsFor)?.zip || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium mb-4 text-white">Statistics</h4>
                    {clinicStats[showDetailsFor] && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-900/30 p-4 rounded-md border border-blue-700/50 flex flex-col items-center">
                          <span className="text-2xl font-bold text-white">{clinicStats[showDetailsFor].totalPets}</span>
                          <p className="text-sm text-blue-300">Total Pets</p>
                        </div>
                        <div className="bg-green-900/30 p-4 rounded-md border border-green-700/50 flex flex-col items-center">
                          <span className="text-2xl font-bold text-white">
                            {clinicStats[showDetailsFor].activePets}
                          </span>
                          <p className="text-sm text-green-300">Active Pets</p>
                        </div>
                        <div className="bg-purple-900/30 p-4 rounded-md border border-purple-700/50 flex flex-col items-center">
                          <span className="text-2xl font-bold text-white">
                            {clinicStats[showDetailsFor].doctorsCount}
                          </span>
                          <p className="text-sm text-purple-300">Total Doctors</p>
                        </div>
                        <div className="bg-indigo-900/30 p-4 rounded-md border border-indigo-700/50 flex flex-col items-center">
                          <span className="text-2xl font-bold text-white">
                            {clinicStats[showDetailsFor].activeDoctors}
                          </span>
                          <p className="text-sm text-indigo-300">Active Doctors</p>
                        </div>
                        <div className="bg-amber-900/30 p-4 rounded-md border border-amber-700/50 flex flex-col items-center">
                          <span className="text-2xl font-bold text-white">{clinicStats[showDetailsFor].petsToday}</span>
                          <p className="text-sm text-amber-300">Pets Today</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Clinic Modal */}
      {editingClinic && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-6 rounded-lg border border-gray-700/50 shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-white">Edit Clinic</h3>
              <button
                onClick={() => setEditingClinic(null)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                    Clinic Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/70 border border-gray-700 rounded-md text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/70 border border-gray-700 rounded-md text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact_person" className="block text-sm font-medium text-gray-300">
                    Contact Person
                  </label>
                  <input
                    id="contact_person"
                    type="text"
                    value={editForm.contact_person}
                    onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/70 border border-gray-700 rounded-md text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/70 border border-gray-700 rounded-md text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-300">
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/70 border border-gray-700 rounded-md text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-300">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/70 border border-gray-700 rounded-md text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="state" className="block text-sm font-medium text-gray-300">
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/70 border border-gray-700 rounded-md text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="zip" className="block text-sm font-medium text-gray-300">
                    Zip Code
                  </label>
                  <input
                    id="zip"
                    type="text"
                    value={editForm.zip}
                    onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/70 border border-gray-700 rounded-md text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingClinic(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClinic}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600
                  rounded-md text-white shadow-md transition-all duration-300 flex items-center gap-2"
                >
                  <Check size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
