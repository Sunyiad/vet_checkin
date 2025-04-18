-- Fix for delete_clinic_cascade function
CREATE OR REPLACE FUNCTION public.delete_clinic_cascade(clinic_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete appointments related to the clinic's pets
    DELETE FROM appointments WHERE pet_id IN (SELECT id FROM pets WHERE clinic_id = $1);
    
    -- Delete pets related to the clinic
    DELETE FROM pets WHERE clinic_id = $1;
    
    -- Delete doctors related to the clinic
    DELETE FROM doctors WHERE clinic_id = $1;
    
    -- Delete codes related to the clinic
    DELETE FROM codes WHERE clinic_id = $1;
    
    -- Delete clinic signup codes related to the clinic
    DELETE FROM clinic_signup_codes WHERE clinic_id = $1;
    
    -- Finally delete the clinic itself
    DELETE FROM clinics WHERE id = $1;
END;
$$;

-- Fix for handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clinic_id uuid;
BEGIN
    -- Get the clinic_id from the new user's metadata
    clinic_id := (NEW.raw_user_meta_data->>'clinic_id')::uuid;
    
    -- Update the user's metadata to include the clinic_id
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('clinic_id', clinic_id)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;
