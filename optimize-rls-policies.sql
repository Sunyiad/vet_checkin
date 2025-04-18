-- This script optimizes RLS policies by:
-- 1. Using (SELECT auth.jwt()) instead of direct auth.jwt() calls
-- 2. Consolidating multiple permissive policies where possible

-- First, let's fix the auth.jwt() and auth.uid() calls in RLS policies
-- This is a performance optimization recommended by Supabase

-- Fix appointments table policies
DROP POLICY IF EXISTS "Appointments are viewable by authenticated users who belong to " ON public.appointments;
CREATE POLICY "Appointments are viewable by authenticated users who belong to clinic" ON public.appointments
FOR SELECT TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Appointments are insertable by authenticated users who belong t" ON public.appointments;
DROP POLICY IF EXISTS "Clinics can insert their own appointments" ON public.appointments;
CREATE POLICY "Appointments are insertable by clinic users" ON public.appointments
FOR INSERT TO authenticated WITH CHECK (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Appointments are updatable by authenticated users who belong to" ON public.appointments;
DROP POLICY IF EXISTS "Clinics can update their own appointments" ON public.appointments;
CREATE POLICY "Appointments are updatable by clinic users" ON public.appointments
FOR UPDATE TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'))
WITH CHECK (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Clinics can delete their own appointments" ON public.appointments;
CREATE POLICY "Clinics can delete their own appointments" ON public.appointments
FOR DELETE TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

-- Fix codes table policies
DROP POLICY IF EXISTS "Codes are viewable by authenticated users who belong to the cli" ON public.codes;
DROP POLICY IF EXISTS "Clinics can view their own codes" ON public.codes;
CREATE POLICY "Codes are viewable by clinic users" ON public.codes
FOR SELECT TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Codes are insertable by authenticated users who belong to the c" ON public.codes;
DROP POLICY IF EXISTS "Clinics can insert their own codes" ON public.codes;
CREATE POLICY "Codes are insertable by clinic users" ON public.codes
FOR INSERT TO authenticated WITH CHECK (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Clinics can update their own codes" ON public.codes;
CREATE POLICY "Codes are updatable by clinic users" ON public.codes
FOR UPDATE TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'))
WITH CHECK (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Clinics can delete their own codes" ON public.codes;
CREATE POLICY "Codes are deletable by clinic users" ON public.codes
FOR DELETE TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

-- Fix pets table policies
DROP POLICY IF EXISTS "Pets are viewable by authenticated users who belong to the clin" ON public.pets;
DROP POLICY IF EXISTS "Clinics can view their own pets" ON public.pets;
CREATE POLICY "Pets are viewable by clinic users" ON public.pets
FOR SELECT TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Pets are insertable by authenticated users who belong to the cl" ON public.pets;
DROP POLICY IF EXISTS "Clinics can insert their own pets" ON public.pets;
CREATE POLICY "Pets are insertable by clinic users" ON public.pets
FOR INSERT TO authenticated WITH CHECK (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Pets are updatable by authenticated users who belong to the cli" ON public.pets;
DROP POLICY IF EXISTS "Clinics can update their own pets" ON public.pets;
CREATE POLICY "Pets are updatable by clinic users" ON public.pets
FOR UPDATE TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'))
WITH CHECK (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Clinics can delete their own pets" ON public.pets;
CREATE POLICY "Pets are deletable by clinic users" ON public.pets
FOR DELETE TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

-- Fix doctors table policies
DROP POLICY IF EXISTS "Doctors are viewable by authenticated users who belong to the c" ON public.doctors;
DROP POLICY IF EXISTS "Clinics can view their own doctors" ON public.doctors;
CREATE POLICY "Doctors are viewable by clinic users" ON public.doctors
FOR SELECT TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Doctors are insertable by authenticated users who belong to the" ON public.doctors;
DROP POLICY IF EXISTS "Clinics can insert their own doctors" ON public.doctors;
CREATE POLICY "Doctors are insertable by clinic users" ON public.doctors
FOR INSERT TO authenticated WITH CHECK (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Doctors are updatable by authenticated users who belong to the " ON public.doctors;
DROP POLICY IF EXISTS "Clinics can update their own doctors" ON public.doctors;
CREATE POLICY "Doctors are updatable by clinic users" ON public.doctors
FOR UPDATE TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'))
WITH CHECK (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

DROP POLICY IF EXISTS "Clinics can delete their own doctors" ON public.doctors;
CREATE POLICY "Doctors are deletable by clinic users" ON public.doctors
FOR DELETE TO authenticated USING (clinic_id::text = (SELECT auth.jwt() ->> 'clinic_id'));

-- Fix clinics table policies
DROP POLICY IF EXISTS "Clinics are viewable by authenticated users who belong to the c" ON public.clinics;
DROP POLICY IF EXISTS "Clinics can view their own clinic" ON public.clinics;
DROP POLICY IF EXISTS "Admins can access all clinics" ON public.clinics;
CREATE POLICY "Clinics are viewable by users" ON public.clinics
FOR SELECT TO authenticated USING (
  id::text = (SELECT auth.jwt() ->> 'clinic_id') OR 
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Clinics can update their own clinic" ON public.clinics;
CREATE POLICY "Clinics can update their own clinic" ON public.clinics
FOR UPDATE TO authenticated USING (
  id::text = (SELECT auth.jwt() ->> 'clinic_id')
) WITH CHECK (
  id::text = (SELECT auth.jwt() ->> 'clinic_id')
);

DROP POLICY IF EXISTS "Admins can insert clinics" ON public.clinics;
CREATE POLICY "Admins can insert clinics" ON public.clinics
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Admins can delete clinics" ON public.clinics;
CREATE POLICY "Admins can delete clinics" ON public.clinics
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

-- Fix admins table policies
DROP POLICY IF EXISTS "Admins can view admin accounts" ON public.admins;
DROP POLICY IF EXISTS "Admins can access admin table" ON public.admins;
CREATE POLICY "Admins can view admin accounts" ON public.admins
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Admins can insert admin accounts" ON public.admins;
CREATE POLICY "Admins can insert admin accounts" ON public.admins
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Admins can update admin accounts" ON public.admins;
CREATE POLICY "Admins can update admin accounts" ON public.admins
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Admins can delete admin accounts" ON public.admins;
CREATE POLICY "Admins can delete admin accounts" ON public.admins
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

-- Fix clinic_signup_codes table policies
DROP POLICY IF EXISTS "Clinic signup codes are only accessible by service role" ON public.clinic_signup_codes;
DROP POLICY IF EXISTS "Admins can view clinic signup codes" ON public.clinic_signup_codes;
CREATE POLICY "Admins can view clinic signup codes" ON public.clinic_signup_codes
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Admins can insert clinic signup codes" ON public.clinic_signup_codes;
CREATE POLICY "Admins can insert clinic signup codes" ON public.clinic_signup_codes
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Admins can update clinic signup codes" ON public.clinic_signup_codes;
CREATE POLICY "Admins can update clinic signup codes" ON public.clinic_signup_codes
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Admins can delete clinic signup codes" ON public.clinic_signup_codes;
CREATE POLICY "Admins can delete clinic signup codes" ON public.clinic_signup_codes
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

-- Fix password_reset_tokens table policies
DROP POLICY IF EXISTS "Password reset tokens are only accessible by service role" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Admins can view password reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Admins can view password reset tokens" ON public.password_reset_tokens
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Anyone can insert password reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Anyone can insert password reset tokens" ON public.password_reset_tokens
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update password reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Admins can update password reset tokens" ON public.password_reset_tokens
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Admins can delete password reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Admins can delete password reset tokens" ON public.password_reset_tokens
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = (SELECT auth.jwt() ->> 'email'))
);

-- Fix the delete_clinic_cascade function to set search_path
CREATE OR REPLACE FUNCTION public.delete_clinic_cascade(clinic_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete appointments first (they reference pets)
  DELETE FROM appointments WHERE clinic_id = clinic_id_param;
  
  -- Delete pets (they reference doctors)
  DELETE FROM pets WHERE clinic_id = clinic_id_param;
  
  -- Delete doctors (they reference clinics)
  DELETE FROM doctors WHERE clinic_id = clinic_id_param;
  
  -- Delete codes
  DELETE FROM codes WHERE clinic_id = clinic_id_param;
  
  -- Delete clinic_signup_codes
  DELETE FROM clinic_signup_codes WHERE clinic_id = clinic_id_param;
  
  -- Delete password_reset_tokens
  DELETE FROM password_reset_tokens WHERE clinic_id = clinic_id_param;
  
  -- Finally delete the clinic itself
  DELETE FROM clinics WHERE id = clinic_id_param;
END;
$$;

-- Fix the handle_new_user function to set search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clinic_id_val uuid;
BEGIN
  -- Get the clinic_id from the user's metadata
  SELECT raw_user_meta_data->>'clinic_id' INTO clinic_id_val FROM auth.users WHERE id = NEW.id;
  
  -- Update the user's app_metadata with the clinic_id
  IF clinic_id_val IS NOT NULL THEN
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(raw_app_meta_data, '{clinic_id}', to_jsonb(clinic_id_val))
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;
