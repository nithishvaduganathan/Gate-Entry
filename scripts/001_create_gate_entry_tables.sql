-- Gate Entry Application Database Schema
-- This script creates all necessary tables for the college gate entry system

-- Create authorities table for HOD, Principal, Staff permissions
CREATE TABLE IF NOT EXISTS public.authorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  designation TEXT NOT NULL CHECK (designation IN ('HOD', 'Principal', 'Staff')),
  department TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visitors table for unknown person entries
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL,
  photo_url TEXT,
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exit_time TIMESTAMP WITH TIME ZONE,
  authority_id UUID REFERENCES public.authorities(id),
  authority_permission_granted BOOLEAN DEFAULT false,
  permission_granted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'exited')),
  created_by TEXT, -- gatekeeper name or ID
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bus_entries table for college bus tracking
CREATE TABLE IF NOT EXISTS public.bus_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number TEXT NOT NULL,
  driver_name TEXT,
  driver_phone TEXT,
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exit_time TIMESTAMP WITH TIME ZONE,
  route TEXT,
  passenger_count INTEGER,
  status TEXT DEFAULT 'entered' CHECK (status IN ('entered', 'exited')),
  created_by TEXT, -- gatekeeper name or ID
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authorities table
CREATE POLICY "Allow read access to authorities" ON public.authorities FOR SELECT USING (true);
CREATE POLICY "Allow insert for authorities" ON public.authorities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authorities" ON public.authorities FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authorities" ON public.authorities FOR DELETE USING (true);

-- Create RLS policies for visitors table
CREATE POLICY "Allow read access to visitors" ON public.visitors FOR SELECT USING (true);
CREATE POLICY "Allow insert for visitors" ON public.visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for visitors" ON public.visitors FOR UPDATE USING (true);
CREATE POLICY "Allow delete for visitors" ON public.visitors FOR DELETE USING (true);

-- Create RLS policies for bus_entries table
CREATE POLICY "Allow read access to bus_entries" ON public.bus_entries FOR SELECT USING (true);
CREATE POLICY "Allow insert for bus_entries" ON public.bus_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for bus_entries" ON public.bus_entries FOR UPDATE USING (true);
CREATE POLICY "Allow delete for bus_entries" ON public.bus_entries FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitors_entry_time ON public.visitors(entry_time);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON public.visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_authority_id ON public.visitors(authority_id);
CREATE INDEX IF NOT EXISTS idx_bus_entries_entry_time ON public.bus_entries(entry_time);
CREATE INDEX IF NOT EXISTS idx_bus_entries_bus_number ON public.bus_entries(bus_number);
CREATE INDEX IF NOT EXISTS idx_bus_entries_status ON public.bus_entries(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at column
CREATE TRIGGER update_authorities_updated_at BEFORE UPDATE ON public.authorities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visitors_updated_at BEFORE UPDATE ON public.visitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bus_entries_updated_at BEFORE UPDATE ON public.bus_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
