
-- Setup default admin user
-- This script creates the default admin user with email manojbharathi@sincet.ac.in

-- First, check if user already exists and delete if present
DELETE FROM auth.users WHERE email = 'manojbharathi@sincet.ac.in';

-- Insert the admin user into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'manojbharathi@sincet.ac.in',
  crypt('sincetadmin', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"System Administrator"}',
  false,
  'authenticated',
  'authenticated'
);

-- Get the user ID for the admin user
DO $$
DECLARE
    admin_user_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'manojbharathi@sincet.ac.in';
    
    -- Get the admin role ID
    SELECT id INTO admin_role_id FROM public.user_roles WHERE name = 'admin';
    
    -- Insert into user_profiles with admin role
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        role_id,
        department,
        is_active
    ) VALUES (
        admin_user_id,
        'manojbharathi@sincet.ac.in',
        'System Administrator',
        admin_role_id,
        'Administration',
        true
    ) ON CONFLICT (id) DO UPDATE SET
        role_id = admin_role_id,
        full_name = 'System Administrator',
        department = 'Administration',
        is_active = true;
END $$;
