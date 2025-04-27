"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { RefreshCw, Trash2, ArrowLeft, Plus, Clock, Calendar } from "lucide-react"
import { generateRandomCode } from "@/lib/utils"

interface Code {
  id: string
  code: string
  created_at: string
  expires_at: string
  active: boolean
}

export default function CodesPage() {
  const [codes, setCodes] = useState<Code[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingCode, setGeneratingCode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const clinic = localStorage.getItem("clinic")
    if (!clinic) {
      router.push("/login")
      return
    }

    fetchCodes()
  }, [router])

  const fetchCodes = async () => {
    try {
      const supabase = createClientSupabaseClient()
      const clinicData = localStorage.getItem("clinic")

      if (!clinicData) {
        return
      }

      const clinic = JSON.parse(clinicData)

      const { data, error } = await supabase
        .from("codes")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching codes:", error)
        return
      }

      setCodes(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateNewCode = async () => {
    try {
      setGeneratingCode(true)
      const supabase = createClientSupabaseClient()
      const clinicData = localStorage.getItem("clinic")

      if (!clinicData) {
        return
      }

      const clinic = JSON.parse(clinicData)

      // Deactivate any existing active codes
      await supabase.from("codes").update({ active: false }).eq("clinic_id", clinic.id).eq("active", true)

      // Generate a new code
      const code = generateRandomCode()

      // Calculate expiration time (8 hours from now)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000)

      // Insert the new code
      const { error } = await supabase.from("codes").insert({
        code,
        clinic_id: clinic.id,
        expires_at: expiresAt.toISOString(),
        active: true,
      })

      if (error) {
        console.error("Error generating code:", error)
        return
      }

      // Refresh the codes list
      fetchCodes()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setGeneratingCode(false)
    }
  }

  const deactivateCode = async (codeId: string) => {
    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase.from("codes").update({ active: false }).eq("id", codeId)

      if (error) {
        console.error("Error deactivating code:", error)
        return
      }

      // Refresh the codes list
      fetchCodes()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const deleteCode = async (codeId: string) => {
    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase.from("codes").delete().eq("id", codeId)

      if (error) {
        console.error("Error deleting code:", error)
        return
      }

      // Refresh the codes list
      fetchCodes()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const goBack = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Daily Check-in Codes
          </h1>
          <button
            onClick={goBack}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-md transition-all flex items-center gap-2 border border-gray-700 shadow-md hover:shadow-lg"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>

        <div className="mb-8">
          <button
            onClick={generateNewCode}
            disabled={generatingCode}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md transition-all flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70"
          >
            {generatingCode ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus size={18} />
                Generate New Code
              </>
            )}
          </button>
        </div>

        <div className="bg-black/40 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden shadow-xl">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw size={32} className="animate-spin text-blue-400" />
                <p className="text-gray-400">Loading codes...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-900 to-gray-800 text-gray-300">
                    <th className="px-6 py-4 text-left font-medium">Code</th>
                    <th className="px-6 py-4 text-left font-medium">Created</th>
                    <th className="px-6 py-4 text-left font-medium">Expires</th>
                    <th className="px-6 py-4 text-left font-medium">Status</th>
                    <th className="px-6 py-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Calendar size={32} className="text-gray-500" />
                          <p className="text-gray-400">No codes generated yet</p>
                          <p className="text-gray-500 text-sm">Generate a new code to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    codes.map((code) => {
                      const isExpired = new Date(code.expires_at) < new Date()
                      const isActive = code.active && !isExpired

                      return (
                        <tr key={code.id} className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-mono text-lg font-semibold text-blue-400">{code.code}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar size={14} className="text-gray-500" />
                              <span>{new Date(code.created_at).toLocaleDateString()}</span>
                              <span className="text-gray-500 text-sm">
                                {new Date(code.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Clock size={14} className="text-gray-500" />
                              <span>{new Date(code.expires_at).toLocaleDateString()}</span>
                              <span className="text-gray-500 text-sm">
                                {new Date(code.expires_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isActive
                                  ? "bg-green-900/30 text-green-400 border border-green-700"
                                  : "bg-red-900/30 text-red-400 border border-red-700"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              {isActive && (
                                <button
                                  onClick={() => deactivateCode(code.id)}
                                  className="p-2 bg-amber-900/30 hover:bg-amber-800/50 text-amber-400 rounded-md transition-colors border border-amber-800/50"
                                  title="Deactivate"
                                >
                                  <RefreshCw size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => deleteCode(code.id)}
                                className="p-2 bg-red-900/30 hover:bg-red-800/50 text-red-400 rounded-md transition-colors border border-red-800/50"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
