-- ============ ENUMS ============
DO $$ BEGIN CREATE TYPE public.notification_type AS ENUM ('order','promo','system','payout','delivery'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.txn_type AS ENUM ('credit','debit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.delivery_status AS ENUM ('assigned','picked_up','in_transit','delivered','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'admin');
$$;

-- ============ EXISTING TABLE UPGRADES ============
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS gst_number text,
  ADD COLUMN IF NOT EXISTS payout_account text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE OR REPLACE FUNCTION public.owns_seller(_uid uuid, _seller uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = _seller AND s.owner_id = _uid);
$$;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS tax_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS valid_from timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS valid_to timestamptz,
  ADD COLUMN IF NOT EXISTS usage_limit integer,
  ADD COLUMN IF NOT EXISTS per_user_limit integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS used_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_order_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tax numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_used numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_partner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variant_id uuid,
  ADD COLUMN IF NOT EXISTS tax numeric NOT NULL DEFAULT 0;

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS variant_id uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============ NEW TABLES ============
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  unit text NOT NULL DEFAULT '1 unit',
  price numeric NOT NULL CHECK (price >= 0),
  mrp numeric NOT NULL CHECK (mrp >= 0),
  stock_qty integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  change integer NOT NULL,
  reason text NOT NULL DEFAULT 'manual',
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'razorpay',
  method text NOT NULL DEFAULT 'cod',
  status payment_status NOT NULL DEFAULT 'pending',
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  provider_order_id text,
  provider_payment_id text,
  provider_signature text,
  error_code text,
  error_message text,
  refunded_amount numeric NOT NULL DEFAULT 0,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending',
  reason text,
  provider_refund_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link text,
  placement text NOT NULL DEFAULT 'home_hero',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body text,
  cover_url text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT ON public.blogs TO anon, authenticated;
GRANT ALL ON public.blogs TO service_role;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  vehicle_type text,
  vehicle_number text,
  service_pincodes text[] NOT NULL DEFAULT '{}',
  is_available boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  rating numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.delivery_partners TO authenticated;
GRANT ALL ON public.delivery_partners TO service_role;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  partner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status delivery_status NOT NULL DEFAULT 'assigned',
  notes text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, partner_user_id)
);
GRANT SELECT, UPDATE ON public.delivery_assignments TO authenticated;
GRANT ALL ON public.delivery_assignments TO service_role;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type txn_type NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  balance_after numeric NOT NULL DEFAULT 0,
  reference text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  reward_amount numeric NOT NULL DEFAULT 0,
  is_redeemed boolean NOT NULL DEFAULT false,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============
DROP POLICY IF EXISTS "product images public read" ON public.product_images;
CREATE POLICY "product images public read" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "product images seller manage" ON public.product_images;
CREATE POLICY "product images seller manage" ON public.product_images FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.owns_seller(auth.uid(), p.seller_id)))
  WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.owns_seller(auth.uid(), p.seller_id)));

DROP POLICY IF EXISTS "variants public read" ON public.product_variants;
CREATE POLICY "variants public read" ON public.product_variants FOR SELECT TO anon, authenticated USING (is_active AND deleted_at IS NULL);
DROP POLICY IF EXISTS "variants seller manage" ON public.product_variants;
CREATE POLICY "variants seller manage" ON public.product_variants FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.owns_seller(auth.uid(), p.seller_id)))
  WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.owns_seller(auth.uid(), p.seller_id)));

DROP POLICY IF EXISTS "products seller manage" ON public.products;
CREATE POLICY "products seller manage" ON public.products FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.owns_seller(auth.uid(), seller_id))
  WITH CHECK (public.is_admin(auth.uid()) OR public.owns_seller(auth.uid(), seller_id));

DROP POLICY IF EXISTS "categories admin manage" ON public.categories;
CREATE POLICY "categories admin manage" ON public.categories FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "sellers owner manage" ON public.sellers;
CREATE POLICY "sellers owner manage" ON public.sellers FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR owner_id = auth.uid())
  WITH CHECK (public.is_admin(auth.uid()) OR owner_id = auth.uid());

DROP POLICY IF EXISTS "coupons admin manage" ON public.coupons;
CREATE POLICY "coupons admin manage" ON public.coupons FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "inventory seller access" ON public.inventory_movements;
CREATE POLICY "inventory seller access" ON public.inventory_movements FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.owns_seller(auth.uid(), p.seller_id)));
DROP POLICY IF EXISTS "inventory seller insert" ON public.inventory_movements;
CREATE POLICY "inventory seller insert" ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.owns_seller(auth.uid(), p.seller_id)));

DROP POLICY IF EXISTS "payments own read" ON public.payments;
CREATE POLICY "payments own read" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "refunds own read" ON public.refunds;
CREATE POLICY "refunds own read" ON public.refunds FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "notifications own" ON public.notifications;
CREATE POLICY "notifications own" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "notifications own update" ON public.notifications;
CREATE POLICY "notifications own update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications own delete" ON public.notifications;
CREATE POLICY "notifications own delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "banners public read" ON public.banners;
CREATE POLICY "banners public read" ON public.banners FOR SELECT TO anon, authenticated
  USING (is_active AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
DROP POLICY IF EXISTS "banners admin manage" ON public.banners;
CREATE POLICY "banners admin manage" ON public.banners FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "blogs public read" ON public.blogs;
CREATE POLICY "blogs public read" ON public.blogs FOR SELECT TO anon, authenticated
  USING (is_published AND deleted_at IS NULL);
DROP POLICY IF EXISTS "blogs admin manage" ON public.blogs;
CREATE POLICY "blogs admin manage" ON public.blogs FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "settings public read" ON public.settings;
CREATE POLICY "settings public read" ON public.settings FOR SELECT TO anon, authenticated USING (is_public OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "settings admin manage" ON public.settings;
CREATE POLICY "settings admin manage" ON public.settings FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "delivery partner self" ON public.delivery_partners;
CREATE POLICY "delivery partner self" ON public.delivery_partners FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "assignments partner read" ON public.delivery_assignments;
CREATE POLICY "assignments partner read" ON public.delivery_assignments FOR SELECT TO authenticated
  USING (partner_user_id = auth.uid() OR public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
DROP POLICY IF EXISTS "assignments partner update" ON public.delivery_assignments;
CREATE POLICY "assignments partner update" ON public.delivery_assignments FOR UPDATE TO authenticated
  USING (partner_user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (partner_user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "orders staff read" ON public.orders;
CREATE POLICY "orders staff read" ON public.orders FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR delivery_partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND public.owns_seller(auth.uid(), oi.seller_id)));
DROP POLICY IF EXISTS "orders staff update" ON public.orders;
CREATE POLICY "orders staff update" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR delivery_partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND public.owns_seller(auth.uid(), oi.seller_id)))
  WITH CHECK (public.is_admin(auth.uid()) OR delivery_partner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND public.owns_seller(auth.uid(), oi.seller_id)));
DROP POLICY IF EXISTS "order items staff read" ON public.order_items;
CREATE POLICY "order items staff read" ON public.order_items FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.owns_seller(auth.uid(), seller_id)
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.delivery_partner_id = auth.uid()));

DROP POLICY IF EXISTS "wallet own read" ON public.wallets;
CREATE POLICY "wallet own read" ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "wallet txn own read" ON public.wallet_transactions;
CREATE POLICY "wallet txn own read" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "referrals own" ON public.referrals;
CREATE POLICY "referrals own" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referee_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "referrals own insert" ON public.referrals;
CREATE POLICY "referrals own insert" ON public.referrals FOR INSERT TO authenticated WITH CHECK (referrer_id = auth.uid());
DROP POLICY IF EXISTS "redemptions own read" ON public.coupon_redemptions;
CREATE POLICY "redemptions own read" ON public.coupon_redemptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles admin read" ON public.profiles;
CREATE POLICY "profiles admin read" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "roles admin manage" ON public.user_roles;
CREATE POLICY "roles admin manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ SEARCH ============
CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.badges,' '),'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'C');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_products_search ON public.products;
CREATE TRIGGER trg_products_search BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.products_search_vector_update();
UPDATE public.products SET updated_at = updated_at;

DROP TRIGGER IF EXISTS trg_reviews_rating ON public.reviews;
CREATE TRIGGER trg_reviews_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
          NEW.email,
          NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','addresses','categories','sellers','products','product_images','product_variants',
    'coupons','orders','cart_items','reviews','payments','refunds','banners','blogs','delivery_partners',
    'delivery_assignments','wallets','referrals','settings']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated ON public.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_products_trgm ON public.products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON public.products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_partner ON public.orders(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON public.order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_partner ON public.delivery_assignments(partner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_user ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON public.coupon_redemptions(user_id, coupon_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(upper(code));
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_unique ON public.wishlist_items(user_id, product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

INSERT INTO public.settings (key, value, description) VALUES
  ('commerce', '{"tax_rate":0.05,"delivery_fee":49,"express_fee":99,"free_delivery_threshold":999,"currency":"INR"}'::jsonb, 'Pricing and delivery configuration')
ON CONFLICT (key) DO NOTHING;