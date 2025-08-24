-- Seed data for authorities table
-- This script adds sample authority data for testing

INSERT INTO public.authorities (name, designation, department, phone, email) VALUES
('Dr. Rajesh Kumar', 'Principal', 'Administration', '+91-9876543210', 'principal@college.edu'),
('Prof. Priya Sharma', 'HOD', 'Computer Science', '+91-9876543211', 'hod.cs@college.edu'),
('Dr. Amit Patel', 'HOD', 'Electronics', '+91-9876543212', 'hod.ece@college.edu'),
('Ms. Sunita Verma', 'HOD', 'Mechanical', '+91-9876543213', 'hod.mech@college.edu'),
('Mr. Ravi Singh', 'Staff', 'Security', '+91-9876543214', 'security@college.edu'),
('Ms. Kavita Joshi', 'Staff', 'Administration', '+91-9876543215', 'admin@college.edu'),
('Prof. Deepak Gupta', 'HOD', 'Civil Engineering', '+91-9876543216', 'hod.civil@college.edu'),
('Dr. Meera Nair', 'HOD', 'Electrical', '+91-9876543217', 'hod.eee@college.edu')
ON CONFLICT DO NOTHING;
