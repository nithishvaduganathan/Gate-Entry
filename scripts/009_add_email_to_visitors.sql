
-- Add email column to visitors table
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index for email field
CREATE INDEX IF NOT EXISTS idx_visitors_email ON public.visitors(email);
