-- Add email column to visitors table
ALTER TABLE public.visitors 
ADD COLUMN IF NOT EXISTS email TEXT;
