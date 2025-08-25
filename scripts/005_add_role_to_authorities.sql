-- Add role column to authorities table
ALTER TABLE public.authorities 
ADD COLUMN IF NOT EXISTS role TEXT 
DEFAULT 'staff' 
CHECK (role IN ('admin', 'hod', 'staff'));

-- Update existing records with appropriate roles based on designation
UPDATE public.authorities 
SET role = CASE 
  WHEN designation = 'Principal' THEN 'admin'
  WHEN designation = 'HOD' THEN 'hod'
  ELSE 'staff'
END
WHERE role IS NULL;
