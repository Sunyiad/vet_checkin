-- 1. Check if the admins table exists and has the correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admins') THEN
        CREATE TABLE public.admins (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert the admin user if it doesn't exist
        INSERT INTO public.admins (email, password)
        VALUES ('primaveradvm@gmail.com', 'Green@$2025');
        
        RAISE NOTICE 'Created admins table and inserted default admin user';
    END IF;
END
$$;

-- 2. Check if the admin user exists and has the correct password
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.admins WHERE email = 'primaveradvm@gmail.com';
    
    IF admin_count = 0 THEN
        -- Insert the admin user if it doesn't exist
        INSERT INTO public.admins (email, password)
        VALUES ('primaveradvm@gmail.com', 'Green@$2025');
        
        RAISE NOTICE 'Inserted default admin user';
    ELSE
        -- Update the admin password to ensure it's correct
        UPDATE public.admins
        SET password = 'Green@$2025'
        WHERE email = 'primaveradvm@gmail.com';
        
        RAISE NOTICE 'Updated admin password';
    END IF;
END
$$;

-- 3. Check if the codes table exists and has the correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'codes') THEN
        CREATE TABLE public.codes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            code TEXT NOT NULL,
            clinic_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE
        );
        
        RAISE NOTICE 'Created codes table';
    END IF;
END
$$;

-- 4. Check if the RLS policies for codes table are set up correctly
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Clinics can view their own codes" ON public.codes;
    DROP POLICY IF EXISTS "Clinics can insert their own codes" ON public.codes;
    DROP POLICY IF EXISTS "Clinics can update their own codes" ON public.codes;
    DROP POLICY IF EXISTS "Clinics can delete their own codes" ON public.codes;
    
    -- Enable RLS on codes table
    ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Clinics can view their own codes" 
    ON public.codes FOR SELECT 
    USING (auth.uid() = clinic_id);
    
    CREATE POLICY "Clinics can insert their own codes" 
    ON public.codes FOR INSERT 
    WITH CHECK (auth.uid() = clinic_id);
    
    CREATE POLICY "Clinics can update their own codes" 
    ON public.codes FOR UPDATE 
    USING (auth.uid() = clinic_id);
    
    CREATE POLICY "Clinics can delete their own codes" 
    ON public.codes FOR DELETE 
    USING (auth.uid() = clinic_id);
    
    RAISE NOTICE 'Set up RLS policies for codes table';
END
$$;

-- 5. Verify the admin user exists and has the correct password
SELECT id, email, password FROM public.admins WHERE email = 'primaveradvm@gmail.com';

-- 6. Check if there are any active codes in the database
SELECT id, code, clinic_id, expires_at, active FROM public.codes WHERE active = true AND expires_at > NOW();

-- 7. Check if there are any clinics in the database
SELECT id, email, name FROM public.clinics LIMIT 5;

-- 8. Check if there are any pets in the database
SELECT COUNT(*) as pet_count FROM public.pets;

-- 9. Check if there are any doctors in the database
SELECT COUNT(*) as doctor_count FROM public.doctors;
