"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

      // Use the API route instead of direct Supabase client
      const response = await fetch("/api/admin/fetch-clinics")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error fetching clinics:", errorData)
        return
      }

      const data = await response.json()
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
      const response = await fetch(`/api/admin/clinic-stats?clinicId=${clinicId}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error fetching clinic stats:", errorData)
        return
      }

      const stats = await response.json()

      setClinicStats((prev) => ({
        ...prev,
        [clinicId]: {
          totalPets: stats.totalPets || 0,
          activePets: stats.activePets || 0,
          doctorsCount: stats.doctorsCount || 0,
          activeDoctors: stats.activeDoctors || 0,
          petsToday: stats.petsToday || 0,
        },
      }))
    } catch (error) {
      console.error("Error fetching clinic stats:", error)
    }
  }

  // Updated handleGenerateCode function to use the API route
  const handleGenerateCode = async () => {
    if (!newClinicName.trim() || !newClinicEmail.trim()) {
      setCodeError("Clinic name and email are required")
      return
    }

    try {
      setGeneratingCode(true)
      setCodeError("")

      // Get admin email from localStorage
      const admin = JSON.parse(localStorage.getItem("admin") || "{}")
      const adminEmail = admin.email || "admin"

      // Use the API route instead of direct Supabase client
      const response = await fetch("/api/admin/generate-signup-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clinicName: newClinicName,
          clinicEmail: newClinicEmail,
          adminEmail,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setCodeError(errorData.error || "Failed to generate code")
        return
      }

      const data = await response.json()
      setGeneratedCode(data.code)

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
      // Use the API route for updating clinic
      const response = await fetch(`/api/admin/update-clinic/${editingClinic.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error updating clinic:", errorData)
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
      // Use the API route for deleting clinic
      const response = await fetch(`/api/admin/delete-clinic/${clinicId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error deleting clinic:", errorData)
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
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm">
          Logout
        </button>
      </div>

      <div className="mb-6">
        <div className="flex border-b border-gray-700">
          <button
            className={`px-4 py-2 ${activeTab === "clinics" ? "border-b-2 border-white font-medium" : "text-gray-400"}`}
            onClick={() => setActiveTab("clinics")}
          >
            Clinic Stats
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "add" ? "border-b-2 border-white font-medium" : "text-gray-400"}`}
            onClick={() => setActiveTab("add")}
          >
            Add New Clinic
          </button>
        </div>
      </div>

      {activeTab === "clinics" ? (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl">Clinics</h2>
            <button
              onClick={fetchClinics}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="bg-black border border-gray-800 rounded-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900">
                    <th className="px-4 py-2 text-left">Clinic Name</th>
                    <th className="px-4 py-2 text-left">Stats</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clinics.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-gray-400">
                        No clinics found
                      </td>
                    </tr>
                  ) : (
                    clinics.map((clinic) => (
                      <tr key={clinic.id} className="border-t border-gray-800">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{getClinicDisplayName(clinic)}</div>
                            <div className="text-sm text-gray-400">{clinic.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {clinicStats[clinic.id] ? (
                            <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                              <div>
                                Total Pets: <span className="font-medium">{clinicStats[clinic.id].totalPets}</span>
                              </div>
                              <div>
                                Active Pets: <span className="font-medium">{clinicStats[clinic.id].activePets}</span>
                              </div>
                              <div>
                                Doctors: <span className="font-medium">{clinicStats[clinic.id].doctorsCount}</span>
                              </div>
                              <div>
                                Today: <span className="font-medium">{clinicStats[clinic.id].petsToday}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">Loading stats...</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowDetailsFor(clinic.id)}
                              className="p-1 bg-gray-800 hover:bg-gray-700 rounded-sm"
                              title="View Details"
                            >
                              <Info size={16} />
                            </button>
                            <button
                              onClick={() => handleEditClinic(clinic)}
                              className="p-1 bg-blue-900 hover:bg-blue-800 rounded-sm"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClinic(clinic.id)}
                              className="p-1 bg-red-900 hover:bg-red-800 rounded-sm"
                              title="Delete"
                            >
                              <Trash2 size={16} />
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

          {/* Clinic Details Modal */}
          {showDetailsFor && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-sm max-w-2xl w-full">
                {clinics.find((c) => c.id === showDetailsFor) && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-medium">
                        {getClinicDisplayName(clinics.find((c) => c.id === showDetailsFor)!)}
                      </h3>
                      <button
                        onClick={() => setShowDetailsFor(null)}
                        className="p-1 bg-gray-800 hover:bg-gray-700 rounded-sm"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Clinic Name</p>
                          <p>{clinics.find((c) => c.id === showDetailsFor)?.name || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Email</p>
                          <p>{clinics.find((c) => c.id === showDetailsFor)?.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Contact Person</p>
                          <p>{clinics.find((c) => c.id === showDetailsFor)?.contact_person || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Phone</p>
                          <p>{clinics.find((c) => c.id === showDetailsFor)?.phone || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Address</p>
                          <p>{clinics.find((c) => c.id === showDetailsFor)?.address || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">City</p>
                          <p>{clinics.find((c) => c.id === showDetailsFor)?.city || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">State</p>
                          <p>{clinics.find((c) => c.id === showDetailsFor)?.state || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Zip Code</p>
                          <p>{clinics.find((c) => c.id === showDetailsFor)?.zip || "Not provided"}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Statistics</h4>
                        {clinicStats[showDetailsFor] && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-400">Total Pets</p>
                              <p>{clinicStats[showDetailsFor].totalPets}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Active Pets</p>
                              <p>{clinicStats[showDetailsFor].activePets}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Total Doctors</p>
                              <p>{clinicStats[showDetailsFor].doctorsCount}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Active Doctors</p>
                              <p>{clinicStats[showDetailsFor].activeDoctors}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Pets Today</p>
                              <p>{clinicStats[showDetailsFor].petsToday}</p>
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
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-sm max-w-2xl w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-medium">Edit Clinic</h3>
                  <button
                    onClick={() => setEditingClinic(null)}
                    className="p-1 bg-gray-800 hover:bg-gray-700 rounded-sm"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm">
                        Clinic Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contact_person" className="block text-sm">
                        Contact Person
                      </label>
                      <input
                        id="contact_person"
                        type="text"
                        value={editForm.contact_person}
                        onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                        className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="block text-sm">
                        Phone
                      </label>
                      <input
                        id="phone"
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="address" className="block text-sm">
                        Address
                      </label>
                      <input
                        id="address"
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="city" className="block text-sm">
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="state" className="block text-sm">
                        State
                      </label>
                      <input
                        id="state"
                        type="text"
                        value={editForm.state}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                        className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="zip" className="block text-sm">
                        Zip Code
                      </label>
                      <input
                        id="zip"
                        type="text"
                        value={editForm.zip}
                        onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                        className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <button
                      onClick={() => setEditingClinic(null)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveClinic}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-sm flex items-center gap-2"
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
      ) : (
        <div>
          <h2 className="text-xl mb-4">Add New Clinic</h2>

          {generatedCode ? (
            <div className="bg-gray-900 p-6 rounded-sm max-w-md">
              <h3 className="text-lg font-medium mb-4">Signup Code Generated</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Clinic Name</p>
                <p className="font-medium">{newClinicName}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Clinic Email</p>
                <p className="font-medium">{newClinicEmail}</p>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-1">Signup Code (valid for 24 hours)</p>
                <p className="text-2xl font-bold">{generatedCode}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Signup Link</p>
                <div className="bg-black p-2 rounded-sm break-all">
                  <code className="text-xs">{`${window.location.origin}/signup?code=${generatedCode}`}</code>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setGeneratedCode(null)
                    setNewClinicName("")
                    setNewClinicEmail("")
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm"
                >
                  Create Another
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 p-6 rounded-sm max-w-md">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="clinicName" className="block text-sm">
                    Clinic Name
                  </label>
                  <input
                    id="clinicName"
                    type="text"
                    value={newClinicName}
                    onChange={(e) => setNewClinicName(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="clinicEmail" className="block text-sm">
                    Clinic Email
                  </label>
                  <input
                    id="clinicEmail"
                    type="email"
                    value={newClinicEmail}
                    onChange={(e) => setNewClinicEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-sm text-white"
                    required
                  />
                </div>

                {codeError && <div className="text-red-500 text-sm">{codeError}</div>}

                <div className="flex justify-end">
                  <button
                    onClick={handleGenerateCode}
                    disabled={generatingCode}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm flex items-center gap-2"
                  >
                    {generatingCode ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
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
    </div>
  )
}
