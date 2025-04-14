import { createServerSupabaseClient } from "./supabase"

// ==================== CLINIC OPERATIONS ====================

export async function getClinicById(id: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("clinics").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching clinic:", error)
    return null
  }

  return data
}

export async function getClinicByEmail(email: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("clinics").select("*").eq("email", email).single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" error
    console.error("Error fetching clinic by email:", error)
    return null
  }

  return data || null
}

// Update the createClinic function to only include email and password
export async function createClinic(clinicData: {
  email: string
  password: string
}) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("clinics").insert(clinicData).select().single()

  if (error) {
    console.error("Error creating clinic:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// Update the updateClinic function to only include email and password
export async function updateClinic(
  id: string,
  clinicData: Partial<{
    email: string
    password: string
  }>,
) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("clinics").update(clinicData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating clinic:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function deleteClinic(id: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from("clinics").delete().eq("id", id)

  if (error) {
    console.error("Error deleting clinic:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Update the getAllClinics function to sort by email instead of name
export async function getAllClinics() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("clinics").select("*").order("email", { ascending: true })

  if (error) {
    console.error("Error fetching all clinics:", error)
    return []
  }

  return data || []
}

// ==================== PET OPERATIONS ====================

export async function getPetById(id: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("pets")
    .select(`
      *,
      doctor:doctor_id (
        name
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching pet:", error)
    return null
  }

  return data
}

export async function getPetsByClinicId(clinicId: string, status = "active", doctorId?: string) {
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from("pets")
    .select(`
      *,
      doctor:doctor_id (
        name
      )
    `)
    .eq("clinic_id", clinicId)
    .eq("status", status)
    .order("created_at", { ascending: false })

  if (doctorId) {
    query = query.eq("doctor_id", doctorId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching pets by clinic:", error)
    return []
  }

  return data || []
}

export async function createPet(petData: any) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("pets").insert(petData).select().single()

  if (error) {
    console.error("Error creating pet:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updatePet(id: string, petData: any) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("pets").update(petData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating pet:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function softDeletePet(id: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from("pets").update({ status: "deleted" }).eq("id", id)

  if (error) {
    console.error("Error soft deleting pet:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function restorePet(id: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from("pets").update({ status: "active" }).eq("id", id)

  if (error) {
    console.error("Error restoring pet:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ==================== DOCTOR OPERATIONS ====================

export async function getDoctorById(id: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("doctors").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching doctor:", error)
    return null
  }

  return data
}

export async function getDoctorsByClinicId(clinicId: string, activeOnly = true) {
  const supabase = createServerSupabaseClient()

  let query = supabase.from("doctors").select("*").eq("clinic_id", clinicId).order("name", { ascending: true })

  if (activeOnly) {
    query = query.eq("active", true)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching doctors by clinic:", error)
    return []
  }

  return data || []
}

export async function createDoctor(doctorData: {
  name: string
  clinic_id: string
  active?: boolean
}) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("doctors").insert(doctorData).select().single()

  if (error) {
    console.error("Error creating doctor:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateDoctor(
  id: string,
  doctorData: Partial<{
    name: string
    active: boolean
  }>,
) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("doctors").update(doctorData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating doctor:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function deleteDoctor(id: string) {
  const supabase = createServerSupabaseClient()

  // First check if this doctor has any pets assigned
  const { data, error: checkError } = await supabase.from("pets").select("id").eq("doctor_id", id).limit(1)

  if (checkError) {
    console.error("Error checking doctor's pets:", checkError)
    return { success: false, error: checkError.message }
  }

  if (data && data.length > 0) {
    // Doctor has pets assigned, just deactivate instead of deleting
    const { error } = await supabase.from("doctors").update({ active: false }).eq("id", id)

    if (error) {
      console.error("Error deactivating doctor:", error)
      return { success: false, error: error.message }
    }

    return { success: true, deactivated: true }
  } else {
    // No pets assigned, safe to delete
    const { error } = await supabase.from("doctors").delete().eq("id", id)

    if (error) {
      console.error("Error deleting doctor:", error)
      return { success: false, error: error.message }
    }

    return { success: true, deactivated: false }
  }
}

// ==================== CODE OPERATIONS ====================

export async function getActiveCodeByClinicId(clinicId: string) {
  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("codes")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("active", true)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" error
    console.error("Error fetching active code:", error)
    return null
  }

  return data || null
}

export async function getCodesByClinicId(clinicId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("codes")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching codes by clinic:", error)
    return []
  }

  return data || []
}

export async function verifyCode(code: string) {
  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("codes")
    .select("*")
    .eq("code", code)
    .eq("active", true)
    .gt("expires_at", now)
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" error
    console.error("Error verifying code:", error)
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: "Invalid or expired code" }
  }

  return { success: true, data }
}

export async function createCode(codeData: {
  code: string
  clinic_id: string
  expires_at: string
  active: boolean
}) {
  const supabase = createServerSupabaseClient()

  // Deactivate any existing active codes for this clinic
  await supabase.from("codes").update({ active: false }).eq("clinic_id", codeData.clinic_id).eq("active", true)

  // Create the new code
  const { data, error } = await supabase.from("codes").insert(codeData).select().single()

  if (error) {
    console.error("Error creating code:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function deactivateCode(codeId: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from("codes").update({ active: false }).eq("id", codeId)

  if (error) {
    console.error("Error deactivating code:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteCode(codeId: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from("codes").delete().eq("id", codeId)

  if (error) {
    console.error("Error deleting code:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ==================== PASSWORD RESET OPERATIONS ====================

export async function createPasswordResetToken(clinicId: string) {
  const supabase = createServerSupabaseClient()

  // Generate a random token
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  // Set expiration to 24 hours from now
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  const { data, error } = await supabase
    .from("password_reset_tokens")
    .insert({
      clinic_id: clinicId,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating password reset token:", error)
    return { success: false, error: error.message }
  }

  return { success: true, token }
}

export async function verifyPasswordResetToken(token: string) {
  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("*, clinic:clinic_id(*)")
    .eq("token", token)
    .eq("used", false)
    .gt("expires_at", now)
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" error
    console.error("Error verifying password reset token:", error)
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: "Invalid or expired token" }
  }

  return { success: true, data }
}

export async function markPasswordResetTokenAsUsed(token: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from("password_reset_tokens").update({ used: true }).eq("token", token)

  if (error) {
    console.error("Error marking password reset token as used:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ==================== CLINIC SIGNUP CODE OPERATIONS ====================

export async function createClinicSignupCode(codeData: {
  clinic_name: string
  clinic_email: string
  created_by: string
}) {
  const supabase = createServerSupabaseClient()

  // Generate a random code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Set expiration to 24 hours from now
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  const { data, error } = await supabase
    .from("clinic_signup_codes")
    .insert({
      code,
      clinic_name: codeData.clinic_name,
      clinic_email: codeData.clinic_email,
      expires_at: expiresAt.toISOString(),
      created_by: codeData.created_by,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating clinic signup code:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function verifyClinicSignupCode(code: string, clinicName: string, clinicEmail: string) {
  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("clinic_signup_codes")
    .select("*")
    .eq("code", code)
    .eq("used", false)
    .gt("expires_at", now)
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" error
    console.error("Error verifying clinic signup code:", error)
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: "Invalid or expired code" }
  }

  // Verify clinic name and email match
  if (
    data.clinic_name.toLowerCase() !== clinicName.toLowerCase() ||
    data.clinic_email.toLowerCase() !== clinicEmail.toLowerCase()
  ) {
    return { success: false, error: "Clinic name or email does not match the code" }
  }

  return { success: true, data }
}

export async function markClinicSignupCodeAsUsed(code: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from("clinic_signup_codes").update({ used: true }).eq("code", code)

  if (error) {
    console.error("Error marking clinic signup code as used:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ==================== ADMIN OPERATIONS ====================

export async function verifyAdminCredentials(email: string, password: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("admins").select("*").eq("email", email).single()

  if (error) {
    console.error("Error verifying admin credentials:", error)
    return { success: false, error: "Invalid email or password" }
  }

  // In a real app, you'd use bcrypt to compare the password
  // For this demo, we'll just check if the passwords match
  if (data.password !== password) {
    return { success: false, error: "Invalid email or password" }
  }

  return { success: true, data: { id: data.id, email: data.email } }
}

// ==================== ANALYTICS OPERATIONS ====================

export async function getClinicStats(clinicId: string) {
  const supabase = createServerSupabaseClient()

  // Get total pets count
  const { count: totalPets, error: petsError } = await supabase
    .from("pets")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId)

  if (petsError) {
    console.error("Error getting total pets count:", petsError)
    return { success: false, error: petsError.message }
  }

  // Get active pets count
  const { count: activePets, error: activePetsError } = await supabase
    .from("pets")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("status", "active")

  if (activePetsError) {
    console.error("Error getting active pets count:", activePetsError)
    return { success: false, error: activePetsError.message }
  }

  // Get doctors count
  const { count: doctorsCount, error: doctorsError } = await supabase
    .from("doctors")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId)

  if (doctorsError) {
    console.error("Error getting doctors count:", doctorsError)
    return { success: false, error: doctorsError.message }
  }

  // Get active doctors count
  const { count: activeDoctors, error: activeDoctorsError } = await supabase
    .from("doctors")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("active", true)

  if (activeDoctorsError) {
    console.error("Error getting active doctors count:", activeDoctorsError)
    return { success: false, error: activeDoctorsError.message }
  }

  // Get pets checked in today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: petsToday, error: petsTodayError } = await supabase
    .from("pets")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .gte("created_at", today.toISOString())

  if (petsTodayError) {
    console.error("Error getting pets checked in today:", petsTodayError)
    return { success: false, error: petsTodayError.message }
  }

  return {
    success: true,
    data: {
      totalPets,
      activePets,
      doctorsCount,
      activeDoctors,
      petsToday,
    },
  }
}
