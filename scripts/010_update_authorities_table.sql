-- Drop the role column from the authorities table
ALTER TABLE public.authorities DROP COLUMN IF EXISTS role;