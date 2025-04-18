"use client"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Plus } from "lucide-react"

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: { status?: string; date?: string }
}) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  // Filter parameters
  const status = searchParams.status || "scheduled"
  const date = searchParams.date || new Date().toISOString().split("T")[0]

  // Query appointments with filters
  let query = supabase
    .from("appointments")
    .select(`
      *,
      doctors(name)
    `)
    .eq("status", status)

  // Add date filter if provided
  if (date) {
    query = query.gte("appointment_date", `${date}T00:00:00`).lte("appointment_date", `${date}T23:59:59`)
  }

  // Execute query
  const { data: appointments, error } = await query.order("appointment_date", { ascending: true })

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Link href="/dashboard/appointments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Appointments</CardTitle>
          <CardDescription>Select status and date to filter appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="border rounded-md px-3 py-2 w-full"
                onChange={(e) => {
                  const url = new URL(window.location.href)
                  url.searchParams.set("status", e.target.value)
                  window.location.href = url.toString()
                }}
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="date"
                  name="date"
                  defaultValue={date}
                  className="border rounded-md px-3 py-2 w-full"
                  onChange={(e) => {
                    const url = new URL(window.location.href)
                    url.searchParams.set("date", e.target.value)
                    window.location.href = url.toString()
                  }}
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {error && <p className="text-red-500">Error loading appointments: {error.message}</p>}

        {appointments && appointments.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No appointments found with the selected filters.</p>
            </CardContent>
          </Card>
        )}

        {appointments &&
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{appointment.pet_name}</h3>
                    <p className="text-muted-foreground">Owner: {appointment.owner_name}</p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Doctor:</span>{" "}
                      {appointment.doctors?.name || appointment.doctor || "Not assigned"}
                    </p>
                    {appointment.notes && (
                      <p className="text-sm mt-2 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Notes:</span> {appointment.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        appointment.status,
                      )}`}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                    <p className="mt-1 font-medium">{formatDate(appointment.appointment_date)}</p>
                    <div className="mt-4 space-x-2">
                      <Link href={`/dashboard/appointments/${appointment.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/appointments/${appointment.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
