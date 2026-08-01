
-- 1. Profiles: suspension + admin management
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

DROP POLICY IF EXISTS "profiles admin update" ON public.profiles;
CREATE POLICY "profiles admin update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 2. Review moderation
DROP POLICY IF EXISTS "reviews admin moderate" ON public.reviews;
CREATE POLICY "reviews admin moderate" ON public.reviews
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "reviews admin update" ON public.reviews;
CREATE POLICY "reviews admin update" ON public.reviews
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 3. Store-level coupons
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "coupons seller manage" ON public.coupons;
CREATE POLICY "coupons seller manage" ON public.coupons
  FOR ALL TO authenticated
  USING (seller_id IS NOT NULL AND public.owns_seller(auth.uid(), seller_id))
  WITH CHECK (seller_id IS NOT NULL AND public.owns_seller(auth.uid(), seller_id));

-- 4. Delivery OTP
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_otp text;

-- 5. Admins can create delivery assignments
DROP POLICY IF EXISTS "assignments admin insert" ON public.delivery_assignments;
CREATE POLICY "assignments admin insert" ON public.delivery_assignments
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- 6. Harvest updates
CREATE TABLE IF NOT EXISTS public.harvest_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text,
  image_url text,
  stage text NOT NULL DEFAULT 'harvest',
  harvest_date date,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.harvest_updates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.harvest_updates TO authenticated;
GRANT ALL ON public.harvest_updates TO service_role;
ALTER TABLE public.harvest_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "harvest public read" ON public.harvest_updates;
CREATE POLICY "harvest public read" ON public.harvest_updates
  FOR SELECT TO anon, authenticated USING (is_published);
DROP POLICY IF EXISTS "harvest owner manage" ON public.harvest_updates;
CREATE POLICY "harvest owner manage" ON public.harvest_updates
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.owns_seller(auth.uid(), seller_id))
  WITH CHECK (public.is_admin(auth.uid()) OR public.owns_seller(auth.uid(), seller_id));

DROP TRIGGER IF EXISTS harvest_updates_set_updated_at ON public.harvest_updates;
CREATE TRIGGER harvest_updates_set_updated_at BEFORE UPDATE ON public.harvest_updates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS harvest_updates_seller_idx ON public.harvest_updates(seller_id, created_at DESC);

-- 7. Payouts
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  commission numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  period_start date,
  period_end date,
  reference text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payouts owner read" ON public.payouts;
CREATE POLICY "payouts owner read" ON public.payouts
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.owns_seller(auth.uid(), seller_id));
DROP POLICY IF EXISTS "payouts admin manage" ON public.payouts;
CREATE POLICY "payouts admin manage" ON public.payouts
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS payouts_set_updated_at ON public.payouts;
CREATE TRIGGER payouts_set_updated_at BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS payouts_seller_idx ON public.payouts(seller_id, created_at DESC);

-- 8. Broadcast notifications (admin only)
CREATE OR REPLACE FUNCTION public.broadcast_notification(
  _title text, _body text DEFAULT NULL, _link text DEFAULT NULL,
  _audience text DEFAULT 'all', _type public.notification_type DEFAULT 'system')
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); n integer;
BEGIN
  IF uid IS NULL OR NOT public.is_admin(uid) THEN RAISE EXCEPTION 'Only admins can send announcements.'; END IF;
  IF coalesce(trim(_title),'') = '' THEN RAISE EXCEPTION 'A title is required.'; END IF;
  IF _audience NOT IN ('all','customer','vendor','farmer','delivery','admin') THEN
    RAISE EXCEPTION 'Unknown audience.'; END IF;

  WITH targets AS (
    SELECT DISTINCT ur.user_id FROM public.user_roles ur
    WHERE _audience = 'all' OR ur.role = _audience::public.app_role
  ), ins AS (
    INSERT INTO public.notifications (user_id, type, title, body, link)
    SELECT t.user_id, _type, left(_title, 160), left(coalesce(_body,''), 800), _link FROM targets t
    RETURNING 1
  ) SELECT count(*) INTO n FROM ins;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.broadcast_notification(text,text,text,text,public.notification_type) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.broadcast_notification(text,text,text,text,public.notification_type) TO authenticated;

-- 9. Assign a delivery partner (admin)
CREATE OR REPLACE FUNCTION public.assign_delivery_partner(_order_id uuid, _partner_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); o public.orders%ROWTYPE; otp text;
BEGIN
  IF uid IS NULL OR NOT public.is_admin(uid) THEN RAISE EXCEPTION 'Only admins can assign deliveries.'; END IF;
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.delivery_partners dp WHERE dp.user_id = _partner_user_id) THEN
    RAISE EXCEPTION 'That delivery partner does not exist.'; END IF;

  otp := coalesce(o.delivery_otp, lpad((floor(random()*1000000))::int::text, 6, '0'));

  UPDATE public.orders SET delivery_partner_id = _partner_user_id, delivery_otp = otp,
    status = CASE WHEN status IN ('placed','confirmed') THEN 'packed'::order_status ELSE status END
  WHERE id = _order_id RETURNING * INTO o;

  INSERT INTO public.delivery_assignments (order_id, partner_user_id, status)
  VALUES (_order_id, _partner_user_id, 'assigned');

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (_partner_user_id, 'delivery', 'New delivery assigned',
          'Order ' || o.order_number || ' is ready for pickup.', '/delivery');

  RETURN to_jsonb(o);
END $$;
REVOKE EXECUTE ON FUNCTION public.assign_delivery_partner(uuid,uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.assign_delivery_partner(uuid,uuid) TO authenticated;

-- 10. Staff order status updates
CREATE OR REPLACE FUNCTION public.set_order_status(_order_id uuid, _status public.order_status, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); o public.orders%ROWTYPE; allowed boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please sign in.'; END IF;
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found.'; END IF;

  allowed := public.is_admin(uid) OR o.delivery_partner_id = uid OR EXISTS (
    SELECT 1 FROM public.order_items oi WHERE oi.order_id = o.id AND public.owns_seller(uid, oi.seller_id));
  IF NOT allowed THEN RAISE EXCEPTION 'You cannot update this order.'; END IF;

  IF _status = 'delivered' AND o.delivery_otp IS NOT NULL AND NOT public.is_admin(uid) THEN
    RAISE EXCEPTION 'Verify the delivery OTP to complete this order.';
  END IF;

  UPDATE public.orders SET status = _status,
    payment_status = CASE WHEN _status = 'delivered' AND payment_method = 'cod' AND payment_status = 'pending'
                          THEN 'paid'::payment_status ELSE payment_status END,
    cancel_reason = CASE WHEN _status = 'cancelled' THEN coalesce(_note, cancel_reason) ELSE cancel_reason END
  WHERE id = _order_id RETURNING * INTO o;

  UPDATE public.delivery_assignments SET
    status = CASE _status WHEN 'shipped' THEN 'picked_up'::delivery_status
                          WHEN 'out_for_delivery' THEN 'in_transit'::delivery_status
                          WHEN 'delivered' THEN 'delivered'::delivery_status
                          ELSE status END,
    delivered_at = CASE WHEN _status = 'delivered' THEN now() ELSE delivered_at END
  WHERE order_id = _order_id;

  RETURN to_jsonb(o);
END $$;
REVOKE EXECUTE ON FUNCTION public.set_order_status(uuid,public.order_status,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid,public.order_status,text) TO authenticated;

-- 11. OTP handover
CREATE OR REPLACE FUNCTION public.verify_delivery_otp(_order_id uuid, _otp text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); o public.orders%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please sign in.'; END IF;
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found.'; END IF;
  IF o.delivery_partner_id <> uid AND NOT public.is_admin(uid) THEN
    RAISE EXCEPTION 'This delivery is not assigned to you.'; END IF;
  IF o.delivery_otp IS NULL OR trim(_otp) <> o.delivery_otp THEN
    RAISE EXCEPTION 'That OTP does not match. Please check with the customer.'; END IF;

  UPDATE public.orders SET status = 'delivered', delivered_at = now(),
    payment_status = CASE WHEN payment_method = 'cod' AND payment_status = 'pending'
                          THEN 'paid'::payment_status ELSE payment_status END
  WHERE id = _order_id RETURNING * INTO o;

  UPDATE public.delivery_assignments SET status = 'delivered', delivered_at = now()
  WHERE order_id = _order_id AND partner_user_id = o.delivery_partner_id;

  RETURN to_jsonb(o);
END $$;
REVOKE EXECUTE ON FUNCTION public.verify_delivery_otp(uuid,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.verify_delivery_otp(uuid,text) TO authenticated;

-- 12. Admin metrics summary
CREATE OR REPLACE FUNCTION public.admin_metrics()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.is_admin(uid) THEN RAISE EXCEPTION 'Admins only.'; END IF;
  RETURN jsonb_build_object(
    'revenue', (SELECT coalesce(sum(total),0) FROM public.orders WHERE status <> 'cancelled'),
    'revenue_30d', (SELECT coalesce(sum(total),0) FROM public.orders WHERE status <> 'cancelled' AND created_at > now() - interval '30 days'),
    'orders', (SELECT count(*) FROM public.orders),
    'pending_orders', (SELECT count(*) FROM public.orders WHERE status IN ('placed','confirmed','packed')),
    'customers', (SELECT count(*) FROM public.user_roles WHERE role = 'customer'),
    'vendors', (SELECT count(*) FROM public.sellers WHERE type = 'vendor' AND deleted_at IS NULL),
    'farmers', (SELECT count(*) FROM public.sellers WHERE type = 'farmer' AND deleted_at IS NULL),
    'products', (SELECT count(*) FROM public.products WHERE deleted_at IS NULL),
    'low_stock', (SELECT count(*) FROM public.products WHERE deleted_at IS NULL AND stock_qty <= low_stock_threshold),
    'pending_verification', (SELECT count(*) FROM public.sellers WHERE NOT verified AND deleted_at IS NULL),
    'reviews', (SELECT count(*) FROM public.reviews),
    'daily', (SELECT coalesce(jsonb_agg(d ORDER BY d->>'day'), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('day', to_char(date_trunc('day', created_at), 'YYYY-MM-DD'),
                                  'orders', count(*), 'revenue', coalesce(sum(total),0)) AS d
        FROM public.orders WHERE created_at > now() - interval '30 days'
        GROUP BY 1) s),
    'categories', (SELECT coalesce(jsonb_agg(c), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('name', cat.name, 'revenue', coalesce(sum(oi.price * oi.quantity),0),
                                  'units', coalesce(sum(oi.quantity),0)) AS c
        FROM public.order_items oi
        JOIN public.products p ON p.id = oi.product_id
        JOIN public.categories cat ON cat.id = p.category_id
        GROUP BY cat.name ORDER BY 1 DESC LIMIT 8) s2),
    'top_products', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('name', oi.product_name, 'units', sum(oi.quantity),
                                  'revenue', sum(oi.price * oi.quantity)) AS t
        FROM public.order_items oi GROUP BY oi.product_name
        ORDER BY sum(oi.quantity) DESC LIMIT 8) s3)
  );
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_metrics() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_metrics() TO authenticated;
