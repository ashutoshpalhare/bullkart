DROP POLICY IF EXISTS "bullkart read media" ON storage.objects;
CREATE POLICY "bullkart read media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('product-images','seller-media','avatars','review-images'));

DROP POLICY IF EXISTS "bullkart seller write media" ON storage.objects;
CREATE POLICY "bullkart seller write media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('product-images','seller-media')
    AND (public.is_admin(auth.uid())
      OR EXISTS (SELECT 1 FROM public.sellers s WHERE s.owner_id = auth.uid())));

DROP POLICY IF EXISTS "bullkart seller update media" ON storage.objects;
CREATE POLICY "bullkart seller update media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('product-images','seller-media') AND (public.is_admin(auth.uid()) OR owner = auth.uid()))
  WITH CHECK (bucket_id IN ('product-images','seller-media') AND (public.is_admin(auth.uid()) OR owner = auth.uid()));

DROP POLICY IF EXISTS "bullkart seller delete media" ON storage.objects;
CREATE POLICY "bullkart seller delete media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('product-images','seller-media') AND (public.is_admin(auth.uid()) OR owner = auth.uid()));

DROP POLICY IF EXISTS "bullkart own folder write" ON storage.objects;
CREATE POLICY "bullkart own folder write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars','review-images') AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "bullkart own folder update" ON storage.objects;
CREATE POLICY "bullkart own folder update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars','review-images') AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id IN ('avatars','review-images') AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "bullkart own folder delete" ON storage.objects;
CREATE POLICY "bullkart own folder delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars','review-images') AND (storage.foldername(name))[1] = auth.uid()::text);