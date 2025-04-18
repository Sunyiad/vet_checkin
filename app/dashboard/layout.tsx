import type React from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth check
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

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <aside className="w-64 bg-gray-100 p-4">
          <nav className="space-y-2">
            <h2 className="text-xl font-bold mb-4">Vet Clinic Dashboard</h2>
            <a href="/dashboard" className="block p-2 hover:bg-gray-200 rounded">
              Overview
            </a>
            <a href="/dashboard/appointments" className="block p-2 hover:bg-gray-200 rounded">
              Appointments
            </a>
            <a href="/dashboard/pets" className="block p-2 hover:bg-gray-200 rounded">
              Pets
            </a>
            <a href="/dashboard/doctors" className="block p-2 hover:bg-gray-200 rounded">
              Doctors
            </a>
            <a href="/dashboard/profile" className="block p-2 hover:bg-gray-200 rounded">
              Clinic Profile
            </a>
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </AuthProvider>
  )
}
