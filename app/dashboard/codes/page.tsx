"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { RefreshCw, Trash2 } from "lucide-react"
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
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Daily Check-in Codes</h1>
        <button onClick={goBack} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm">
          Back to Dashboard
        </button>
      </div>

      <div className="mb-8">
        <button
          onClick={generateNewCode}
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
              <RefreshCw size={16} />
              Generate New Code
            </>
          )}
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-black border border-gray-800 rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900">
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Expires</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-400">
                    No codes generated yet
                  </td>
                </tr>
              ) : (
                codes.map((code) => {
                  const isExpired = new Date(code.expires_at) < new Date()
                  const isActive = code.active && !isExpired

                  return (
                    <tr key={code.id} className="border-t border-gray-800">
                      <td className="px-4 py-3 font-mono">{code.code}</td>
                      <td className="px-4 py-3">{new Date(code.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">{new Date(code.expires_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-sm text-xs ${
                            isActive ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {isActive && (
                            <button
                              onClick={() => deactivateCode(code.id)}
                              className="p-1 bg-yellow-900 hover:bg-yellow-800 rounded-sm"
                              title="Deactivate"
                            >
                              <RefreshCw size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteCode(code.id)}
                            className="p-1 bg-red-900 hover:bg-red-800 rounded-sm"
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
  )
}
