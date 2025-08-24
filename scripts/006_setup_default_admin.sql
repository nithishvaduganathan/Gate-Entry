
-- Setup default admin user
-- This script creates the default admin user with email manojbharathi@sincet.ac.in

-- First, ensure we have all required roles
INSERT INTO public.user_roles (name, description) VALUES 
  ('admin', 'Full system access - can manage users and view all data'),
  ('authority', 'Can view analytics and approve requests'),
  ('user', 'Can view analytics and make entries')
ON CONFLICT (name) DO NOTHING;

-- Create a function to setup the default admin profile
-- This will be triggered when the user signs up through the auth system
CREATE OR REPLACE FUNCTION public.setup_default_admin()
RETURNS void AS $$
DECLARE
    admin_role_id UUID;
BEGIN
    -- Get the admin role ID
    SELECT id INTO admin_role_id FROM public.user_roles WHERE name = 'admin';
    
    -- Update any existing profile for the admin email to have admin role
    UPDATE public.user_profiles 
    SET 
        role_id = admin_role_id,
        full_name = 'System Administrator',
        department = 'Administration',
        is_active = true,
        updated_at = NOW()
    WHERE email = 'manojbharathi@sincet.ac.in';
    
    -- If no profile exists, we'll let the trigger create it when the user first signs up
END;
$$ LANGUAGE plpgsql;

-- Run the function
SELECT public.setup_default_admin();

-- Create a trigger function that automatically assigns admin role to the default admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    admin_role_id UUID;
    default_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM public.user_roles WHERE name = 'admin';
    SELECT id INTO default_role_id FROM public.user_roles WHERE name = 'user';
    
    -- Only insert if the profile doesn't already exist
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        role_id,
        department,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        CASE 
            WHEN NEW.email = 'manojbharathi@sincet.ac.in' THEN admin_role_id
            ELSE default_role_id
        END,
        CASE 
            WHEN NEW.email = 'manojbharathi@sincet.ac.in' THEN 'Administration'
            ELSE ''
        END,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role_id = CASE 
            WHEN NEW.email = 'manojbharathi@sincet.ac.in' THEN admin_role_id
            ELSE user_profiles.role_id
        END,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', user_profiles.full_name),
        department = CASE 
            WHEN NEW.email = 'manojbharathi@sincet.ac.in' THEN 'Administration'
            ELSE user_profiles.department
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create the new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
