-- Create storage bucket for visitor photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('visitor-photos', 'visitor-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Updated storage policies to allow public access since no authentication is required
-- Create storage policy to allow public access to visitor photos
CREATE POLICY "Allow public access to visitor photos" ON storage.objects
FOR SELECT USING (bucket_id = 'visitor-photos');

-- Create storage policy to allow public uploads (no authentication required)
CREATE POLICY "Allow public uploads to visitor photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'visitor-photos');

-- Create storage policy to allow public updates
CREATE POLICY "Allow public updates to visitor photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'visitor-photos');

-- Create storage policy to allow public deletes
CREATE POLICY "Allow public deletes from visitor photos" ON storage.objects
FOR DELETE USING (bucket_id = 'visitor-photos');
