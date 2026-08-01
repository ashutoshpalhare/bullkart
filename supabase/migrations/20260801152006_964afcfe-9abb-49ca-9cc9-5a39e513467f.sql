-- 1. Private finance details for sellers
CREATE TABLE public.seller_finance (
  seller_id uuid PRIMARY KEY REFERENCES public.sellers(id) ON DELETE CASCADE,
  gst_number text,
  payout_account text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_finance TO authenticated;
GRANT ALL ON public.seller_finance TO service_role;

ALTER TABLE public.seller_finance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller finance owner read" ON public.seller_finance
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.owns_seller(auth.uid(), seller_id));

CREATE POLICY "seller finance owner write" ON public.seller_finance
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.owns_seller(auth.uid(), seller_id));

CREATE POLICY "seller finance owner update" ON public.seller_finance
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.owns_seller(auth.uid(), seller_id))
  WITH CHECK (public.is_admin(auth.uid()) OR public.owns_seller(auth.uid(), seller_id));

CREATE POLICY "seller finance admin delete" ON public.seller_finance
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER seller_finance_updated_at
  BEFORE UPDATE ON public.seller_finance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Migrate existing values, then drop the publicly readable columns
INSERT INTO public.seller_finance (seller_id, gst_number, payout_account)
SELECT id, gst_number, payout_account FROM public.sellers
WHERE gst_number IS NOT NULL OR payout_account IS NOT NULL
ON CONFLICT (seller_id) DO NOTHING;

ALTER TABLE public.sellers DROP COLUMN gst_number, DROP COLUMN payout_account;

-- 3. Scope seller media uploads to folders the uploader actually owns
DROP POLICY IF EXISTS "bullkart seller write media" ON storage.objects;

CREATE POLICY "bullkart seller write media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('product-images', 'seller-media')
    AND (
      public.is_admin(auth.uid())
      OR public.owns_seller(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
    )
  );

DROP POLICY IF EXISTS "bullkart seller update media" ON storage.objects;

CREATE POLICY "bullkart seller update media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('product-images', 'seller-media')
    AND (
      public.is_admin(auth.uid())
      OR public.owns_seller(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
    )
  );

DROP POLICY IF EXISTS "bullkart seller delete media" ON storage.objects;

CREATE POLICY "bullkart seller delete media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('product-images', 'seller-media')
    AND (
      public.is_admin(auth.uid())
      OR public.owns_seller(auth.uid(), NULLIF((storage.foldername(name))[1], '')::uuid)
    )
  );