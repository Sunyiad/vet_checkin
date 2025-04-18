"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { RefreshCw, Users, Stethoscope, Calendar, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface Stats {
  totalPets: number
  activePets: number
  totalAppointments: number
  activeAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  totalDoctors: number
  activeDoctors: number
}

interface DailyStats {
  date: string
  count: number
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats>({
    totalPets: 0,
    activePets: 0,
    totalAppointments: 0,
    activeAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalDoctors: 0,
    activeDoctors: 0,
  })
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [clinicId, setClinicId] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const clinicStr = localStorage.getItem("clinic")
    if (!clinicStr) {
      router.push("/login")
      return
    }

    try {
      const clinic = JSON.parse(clinicStr)
      if (!clinic || !clinic.id) {
        router.push("/login")
        return
      }

      setClinicId(clinic.id)
      fetchStats(clinic.id)
      fetchDailyStats(clinic.id)
    } catch (error) {
      console.error("Error parsing clinic data:", error)
      router.push("/login")
    }
  }, [router])

  const fetchStats = async (clinicId: string) => {
    try {
      setLoading(true)
      const supabase = createClientSupabaseClient()

      // Get pets stats
      const { count: totalPets } = await supabase
        .from("pets")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId)

      const { count: activePets } = await supabase
        .from("pets")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .eq("status", "active")
        .eq("cancelled", false)

      // Get appointments stats
      const { data: appointments } = await supabase.from("appointments").select("status").eq("clinic_id", clinicId)

      const totalAppointments = appointments?.length || 0
      const activeAppointments = appointments?.filter((a) => a.status === "active").length || 0
      const completedAppointments = appointments?.filter((a) => a.status === "completed").length || 0
      const cancelledAppointments = appointments?.filter((a) => a.status === "cancelled").length || 0

      // Get doctors stats
      const { count: totalDoctors } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId)

      const { count: activeDoctors } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .eq("active", true)

      setStats({
        totalPets: totalPets || 0,
        activePets: activePets || 0,
        totalAppointments,
        activeAppointments,
        completedAppointments,
        cancelledAppointments,
        totalDoctors: totalDoctors || 0,
        activeDoctors: activeDoctors || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyStats = async (clinicId: string) => {
    try {
      const supabase = createClientSupabaseClient()

      // Get appointments for the last 7 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 6) // Last 7 days including today

      const { data: appointments } = await supabase
        .from("appointments")
        .select("appointment_date")
        .eq("clinic_id", clinicId)
        .gte("appointment_date", startDate.toISOString())
        .lte("appointment_date", endDate.toISOString())

      // Group by date
      const dailyCounts: Record<string, number> = {}

      // Initialize all days with 0
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split("T")[0]
        dailyCounts[dateStr] = 0
      }

      // Count appointments per day
      appointments?.forEach((appointment) => {
        const dateStr = new Date(appointment.appointment_date).toISOString().split("T")[0]
        if (dailyCounts[dateStr] !== undefined) {
          dailyCounts[dateStr]++
        }
      })

      // Convert to array for display
      const dailyStats = Object.entries(dailyCounts)
        .map(([date, count]) => ({
          date,
          count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setDailyStats(dailyStats)
    } catch (error) {
      console.error("Error fetching daily stats:", error)
    }
  }

  const refreshStats = () => {
    if (clinicId) {
      fetchStats(clinicId)
      fetchDailyStats(clinicId)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  const goBack = () => {
    router.push("/dashboard")
  }

  // Calculate the maximum count for scaling the chart
  const maxCount = Math.max(...dailyStats.map((day) => day.count), 1)

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Clinic Statistics</h1>
        <div className="flex gap-2">
          <button
            onClick={refreshStats}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={goBack} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm">
            Back to Dashboard
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw size={24} className="animate-spin" />
          <span className="ml-2">Loading statistics...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 p-4 rounded-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-400">Total Pets</h3>
                <Users size={20} className="text-gray-400" />
              </div>
              <div className="text-2xl font-bold">{stats.totalPets}</div>
              <div className="text-sm text-gray-400 mt-1">Active: {stats.activePets}</div>
            </div>

            <div className="bg-gray-900 p-4 rounded-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-400">Doctors</h3>
                <Stethoscope size={20} className="text-gray-400" />
              </div>
              <div className="text-2xl font-bold">{stats.totalDoctors}</div>
              <div className="text-sm text-gray-400 mt-1">Active: {stats.activeDoctors}</div>
            </div>

            <div className="bg-gray-900 p-4 rounded-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-400">Appointments</h3>
                <Calendar size={20} className="text-gray-400" />
              </div>
              <div className="text-2xl font-bold">{stats.totalAppointments}</div>
              <div className="flex gap-4 text-sm mt-1">
                <span className="text-green-400">Active: {stats.activeAppointments}</span>
                <span className="text-blue-400">Completed: {stats.completedAppointments}</span>
                <span className="text-red-400">Cancelled: {stats.cancelledAppointments}</span>
              </div>
            </div>

            <div className="bg-gray-900 p-4 rounded-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-400">Appointment Status</h3>
                <div className="flex gap-1">
                  <CheckCircle size={16} className="text-green-400" />
                  <XCircle size={16} className="text-red-400" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 bg-green-600 rounded-full"
                  style={{
                    width: `${stats.totalAppointments ? (stats.activeAppointments / stats.totalAppointments) * 100 : 0}%`,
                  }}
                ></div>
                <div
                  className="h-2 bg-blue-600 rounded-full"
                  style={{
                    width: `${stats.totalAppointments ? (stats.completedAppointments / stats.totalAppointments) * 100 : 0}%`,
                  }}
                ></div>
                <div
                  className="h-2 bg-red-600 rounded-full"
                  style={{
                    width: `${stats.totalAppointments ? (stats.cancelledAppointments / stats.totalAppointments) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-green-400">
                  {stats.totalAppointments ? Math.round((stats.activeAppointments / stats.totalAppointments) * 100) : 0}
                  % Active
                </span>
                <span className="text-blue-400">
                  {stats.totalAppointments
                    ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
                    : 0}
                  % Completed
                </span>
                <span className="text-red-400">
                  {stats.totalAppointments
                    ? Math.round((stats.cancelledAppointments / stats.totalAppointments) * 100)
                    : 0}
                  % Cancelled
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-sm mb-8">
            <h3 className="text-lg font-medium mb-4">Appointments - Last 7 Days</h3>
            <div className="flex items-end h-40 gap-2">
              {dailyStats.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div className="text-xs text-gray-400 mb-1">{day.count}</div>
                  <div
                    className="w-full bg-blue-600 rounded-t-sm"
                    style={{ height: `${(day.count / maxCount) * 100}%` }}
                  ></div>
                  <div className="text-xs mt-2">{formatDate(day.date)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <Link href="/dashboard/appointments" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-sm">
              View All Appointments
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
