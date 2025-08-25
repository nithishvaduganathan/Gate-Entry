-- Seed data for authorities table
-- This script adds sample authority data for testing

INSERT INTO public.authorities (name, designation, department, phone, email, role, is_active) VALUES
('Dr. Rajesh Kumar', 'Principal', 'Administration', '+91-9876543210', 'principal@college.edu', 'admin', true),
('Prof. Priya Sharma', 'HOD', 'Computer Science', '+91-9876543211', 'hod.cs@college.edu', 'hod', true),
('Dr. Amit Patel', 'HOD', 'Electronics', '+91-9876543212', 'hod.ece@college.edu', 'hod', true),
('Ms. Sunita Verma', 'HOD', 'Mechanical', '+91-9876543213', 'hod.mech@college.edu', 'hod', true),
('Mr. Ravi Singh', 'Staff', 'Security', '+91-9876543214', 'security@college.edu', 'staff', true),
('Ms. Kavita Joshi', 'Staff', 'Administration', '+91-9876543215', 'admin@college.edu', 'staff', true),
('Prof. Deepak Gupta', 'HOD', 'Civil Engineering', '+91-9876543216', 'hod.civil@college.edu', 'hod', true),
('Dr. Meera Nair', 'HOD', 'Electrical', '+91-9876543217', 'hod.eee@college.edu', 'hod', true)
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, 
    designation = EXCLUDED.designation, 
    department = EXCLUDED.department, 
    phone = EXCLUDED.phone, 
    role = EXCLUDED.role, 
    is_active = EXCLUDED.is_active;
