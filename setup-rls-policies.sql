-- Enable RLS on all tables (already done, but included for completeness)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_signup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Create policies for clinics table
CREATE POLICY "Clinics are viewable by authenticated users who belong to the clinic" 
ON public.clinics FOR SELECT 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users
    WHERE auth.jwt() ->> 'clinic_id' = id::text
  )
);

-- Create policies for appointments table
CREATE POLICY "Appointments are viewable by authenticated users who belong to the clinic" 
ON public.appointments FOR SELECT 
TO authenticated 
USING (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
);

CREATE POLICY "Appointments are insertable by authenticated users who belong to the clinic" 
ON public.appointments FOR INSERT 
TO authenticated 
WITH CHECK (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
);

CREATE POLICY "Appointments are updatable by authenticated users who belong to the clinic" 
ON public.appointments FOR UPDATE 
TO authenticated 
USING (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
)
WITH CHECK (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
);

-- Create policies for pets table
CREATE POLICY "Pets are viewable by authenticated users who belong to the clinic" 
ON public.pets FOR SELECT 
TO authenticated 
USING (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
);

CREATE POLICY "Pets are insertable by authenticated users who belong to the clinic" 
ON public.pets FOR INSERT 
TO authenticated 
WITH CHECK (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
);

CREATE POLICY "Pets are updatable by authenticated users who belong to the clinic" 
ON public.pets FOR UPDATE 
TO authenticated 
USING (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
)
WITH CHECK (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
);

-- Create policies for doctors table
CREATE POLICY "Doctors are viewable by authenticated users who belong to the clinic" 
ON public.doctors FOR SELECT 
TO authenticated 
USING (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
);

CREATE POLICY "Doctors are insertable by authenticated users who belong to the clinic" 
ON public.doctors FOR INSERT 
TO authenticated 
WITH CHECK (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
);

CREATE POLICY "Doctors are updatable by authenticated users who belong to the clinic" 
ON public.doctors FOR UPDATE 
TO authenticated 
USING (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
)
WITH CHECK (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
);

-- Create policies for codes table
CREATE POLICY "Codes are viewable by authenticated users who belong to the clinic" 
ON public.codes FOR SELECT 
TO authenticated 
USING (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
);

CREATE POLICY "Codes are insertable by authenticated users who belong to the clinic" 
ON public.codes FOR INSERT 
TO authenticated 
WITH CHECK (
  clinic_id::text = (auth.jwt() ->> 'clinic_id')
);

-- Create policies for admins table (only accessible by service role)
CREATE POLICY "Admins are only accessible by service role" 
ON public.admins FOR ALL 
TO authenticated 
USING (false);

-- Create policies for password_reset_tokens table
CREATE POLICY "Password reset tokens are only accessible by service role" 
ON public.password_reset_tokens FOR ALL 
TO authenticated 
USING (false);

-- Create policies for clinic_signup_codes table
CREATE POLICY "Clinic signup codes are only accessible by service role" 
ON public.clinic_signup_codes FOR ALL 
TO authenticated 
USING (false);
