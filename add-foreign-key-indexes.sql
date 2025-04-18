-- Create indexes for all unindexed foreign keys

-- Appointments table indexes
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments (clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_pet_id ON public.appointments (pet_id);

-- Codes table index
CREATE INDEX IF NOT EXISTS idx_codes_clinic_id ON public.codes (clinic_id);

-- Doctors table index
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON public.doctors (clinic_id);

-- Password reset tokens table index
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_clinic_id ON public.password_reset_tokens (clinic_id);

-- Pets table indexes
CREATE INDEX IF NOT EXISTS idx_pets_clinic_id ON public.pets (clinic_id);
CREATE INDEX IF NOT EXISTS idx_pets_doctor_id ON public.pets (doctor_id);

-- Confirm indexes were created
COMMENT ON INDEX public.idx_appointments_clinic_id IS 'Index for foreign key appointments_clinic_id_fkey';
COMMENT ON INDEX public.idx_appointments_doctor_id IS 'Index for foreign key appointments_doctor_id_fkey';
COMMENT ON INDEX public.idx_appointments_pet_id IS 'Index for foreign key appointments_pet_id_fkey';
COMMENT ON INDEX public.idx_codes_clinic_id IS 'Index for foreign key codes_clinic_id_fkey';
COMMENT ON INDEX public.idx_doctors_clinic_id IS 'Index for foreign key doctors_clinic_id_fkey';
COMMENT ON INDEX public.idx_password_reset_tokens_clinic_id IS 'Index for foreign key password_reset_tokens_clinic_id_fkey';
COMMENT ON INDEX public.idx_pets_clinic_id IS 'Index for foreign key pets_clinic_id_fkey';
COMMENT ON INDEX public.idx_pets_doctor_id IS 'Index for foreign key pets_doctor_id_fkey';
