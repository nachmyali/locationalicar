-- Storage policies for car-images bucket
CREATE POLICY "car_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-images');

CREATE POLICY "car_images_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'car-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );
