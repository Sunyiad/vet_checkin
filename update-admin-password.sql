-- Update the admin password to "Green@2025"
UPDATE admins
SET password = 'Green@2025'
WHERE email = 'primaveradvm@gmail.com';

-- Verify the update was successful
SELECT id, email FROM admins WHERE password = 'Green@2025';
