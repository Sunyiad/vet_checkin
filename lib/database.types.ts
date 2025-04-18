export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          password: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          password: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          password?: string
          email?: string
          created_at?: string
        }
      }
      appointments: {
        Row: {
          created_at: string
          updated_at: string
          pet_id: string
          id: string
          notes: string | null
          cancelled_reason: string | null
          status: string
          doctor: string | null
          owner_name: string
          pet_name: string
          appointment_date: string
          doctor_id: string | null
          clinic_id: string
          scheduled_date: string | null
          completed_date: string | null
          cancelled_date: string | null
        }
        Insert: {
          created_at?: string
          updated_at?: string
          pet_id: string
          id?: string
          notes?: string | null
          cancelled_reason?: string | null
          status?: string
          doctor?: string | null
          owner_name: string
          pet_name: string
          appointment_date: string
          doctor_id?: string | null
          clinic_id: string
          scheduled_date?: string | null
          completed_date?: string | null
          cancelled_date?: string | null
        }
        Update: {
          created_at?: string
          updated_at?: string
          pet_id?: string
          id?: string
          notes?: string | null
          cancelled_reason?: string | null
          status?: string
          doctor?: string | null
          owner_name?: string
          pet_name?: string
          appointment_date?: string
          doctor_id?: string | null
          clinic_id?: string
          scheduled_date?: string | null
          completed_date?: string | null
          cancelled_date?: string | null
        }
      }
      clinic_signup_codes: {
        Row: {
          code: string
          id: string
          created_at: string
          expires_at: string | null
          used: boolean
          clinic_name: string
          clinic_email: string
          created_by: string
        }
        Insert: {
          code: string
          id?: string
          created_at?: string
          expires_at?: string | null
          used?: boolean
          clinic_name: string
          clinic_email: string
          created_by: string
        }
        Update: {
          code?: string
          id?: string
          created_at?: string
          expires_at?: string | null
          used?: boolean
          clinic_name?: string
          clinic_email?: string
          created_by?: string
        }
      }
      clinics: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          email?: string
          created_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          name: string
          clinic_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          clinic_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          clinic_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      pets: {
        Row: {
          id: string
          name: string
          species: string
          breed: string | null
          owner_name: string
          owner_email: string | null
          owner_phone: string | null
          clinic_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          species: string
          breed?: string | null
          owner_name: string
          owner_email?: string | null
          owner_phone?: string | null
          clinic_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          species?: string
          breed?: string | null
          owner_name?: string
          owner_email?: string | null
          owner_phone?: string | null
          clinic_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
}
