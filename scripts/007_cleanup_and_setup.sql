
-- Cleanup and setup script
-- This will clean up any existing triggers and recreate everything properly

-- First, drop any existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.setup_default_admin() CASCADE;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('admin', 'authority', 'user')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role_id UUID REFERENCES public.user_roles(id),
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert roles
INSERT INTO public.user_roles (name, description) VALUES 
  ('admin', 'Full system access - can manage users and view all data'),
  ('authority', 'Can view analytics and approve requests'),
  ('user', 'Can view analytics and make entries');

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access to user_roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Allow read access to user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert for user_profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for user_profiles" ON public.user_profiles FOR UPDATE USING (true);

-- Create the new trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    admin_role_id UUID;
    default_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM public.user_roles WHERE name = 'admin';
    SELECT id INTO default_role_id FROM public.user_roles WHERE name = 'user';
    
    -- Insert user profile
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
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Create the default admin user in auth.users if it doesn't exist
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'manojbharathi@sincet.ac.in';
    
    IF admin_user_id IS NULL THEN
        -- Create the admin user
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'manojbharathi@sincet.ac.in',
            crypt('sincetadmin', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"System Administrator"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
    ELSE
        -- Update existing admin user password
        UPDATE auth.users 
        SET 
            encrypted_password = crypt('sincetadmin', gen_salt('bf')),
            updated_at = NOW()
        WHERE email = 'manojbharathi@sincet.ac.in';
        
        -- Update or create the admin profile
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
            admin_user_id,
            'manojbharathi@sincet.ac.in',
            'System Administrator',
            (SELECT id FROM public.user_roles WHERE name = 'admin'),
            'Administration',
            true,
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            role_id = (SELECT id FROM public.user_roles WHERE name = 'admin'),
            full_name = 'System Administrator',
            department = 'Administration',
            is_active = true,
            updated_at = NOW();
    END IF;
END $$;
