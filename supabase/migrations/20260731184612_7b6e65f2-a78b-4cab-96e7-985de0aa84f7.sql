-- ============ SETTINGS HELPER ============
CREATE OR REPLACE FUNCTION public.commerce_settings()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT value FROM public.settings WHERE key = 'commerce'),
    '{"tax_rate":0.05,"delivery_fee":49,"express_fee":99,"free_delivery_threshold":999}'::jsonb);
$$;
REVOKE EXECUTE ON FUNCTION public.commerce_settings() FROM PUBLIC, anon, authenticated;

-- ============ COUPON VALIDATION ============
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _subtotal numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons%ROWTYPE; uid uuid := auth.uid(); used int; raw numeric; disc numeric;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('valid', false, 'message', 'Please sign in to use a coupon.'); END IF;
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(trim(_code)) LIMIT 1;
  IF NOT FOUND OR NOT c.is_active THEN RETURN jsonb_build_object('valid', false, 'message', 'This coupon code is not valid.'); END IF;
  IF c.valid_from > now() THEN RETURN jsonb_build_object('valid', false, 'message', 'This coupon is not active yet.'); END IF;
  IF c.valid_to IS NOT NULL AND c.valid_to < now() THEN RETURN jsonb_build_object('valid', false, 'message', 'This coupon has expired.'); END IF;
  IF _subtotal < c.min_order THEN
    RETURN jsonb_build_object('valid', false, 'message', format('Add items worth ₹%s more to use this coupon.', ceil(c.min_order - _subtotal)));
  END IF;
  IF c.usage_limit IS NOT NULL AND c.used_count >= c.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'message', 'This coupon has been fully claimed.');
  END IF;
  SELECT count(*) INTO used FROM public.coupon_redemptions r WHERE r.coupon_id = c.id AND r.user_id = uid;
  IF used >= c.per_user_limit THEN RETURN jsonb_build_object('valid', false, 'message', 'You have already used this coupon.'); END IF;
  IF c.first_order_only AND EXISTS (SELECT 1 FROM public.orders o WHERE o.user_id = uid AND o.status <> 'cancelled') THEN
    RETURN jsonb_build_object('valid', false, 'message', 'This coupon is only for your first order.');
  END IF;
  raw := CASE WHEN c.discount_type = 'percent' THEN _subtotal * c.discount_value / 100 ELSE c.discount_value END;
  IF c.max_discount IS NOT NULL THEN raw := least(raw, c.max_discount); END IF;
  disc := least(round(raw), _subtotal);
  RETURN jsonb_build_object('valid', true, 'coupon_id', c.id, 'code', c.code, 'discount', disc, 'description', c.description);
END $$;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;

-- ============ PLACE ORDER ============
CREATE OR REPLACE FUNCTION public.place_order(
  _address jsonb,
  _payment_method text DEFAULT 'cod',
  _delivery_option text DEFAULT 'standard',
  _coupon text DEFAULT NULL,
  _use_wallet numeric DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  cfg jsonb := public.commerce_settings();
  subtotal numeric := 0; tax numeric := 0; delivery numeric := 0; discount numeric := 0;
  wallet_amt numeric := 0; total numeric := 0;
  coupon_res jsonb; coupon_id uuid;
  new_order public.orders%ROWTYPE;
  rec record; wal public.wallets%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please sign in to place an order.'; END IF;
  IF _payment_method NOT IN ('cod','razorpay','wallet') THEN RAISE EXCEPTION 'Unsupported payment method.'; END IF;
  IF _delivery_option NOT IN ('standard','express') THEN RAISE EXCEPTION 'Unsupported delivery option.'; END IF;
  IF _address IS NULL OR coalesce(_address->>'pincode','') = '' OR coalesce(_address->>'full_name','') = '' THEN
    RAISE EXCEPTION 'A complete delivery address is required.';
  END IF;

  -- lock and validate cart against live product rows
  FOR rec IN
    SELECT ci.product_id, ci.quantity, p.name, p.slug, p.emoji, p.unit, p.price, p.stock_qty, p.seller_id, p.tax_rate, p.is_active
    FROM public.cart_items ci JOIN public.products p ON p.id = ci.product_id
    WHERE ci.user_id = uid FOR UPDATE OF p
  LOOP
    IF NOT rec.is_active THEN RAISE EXCEPTION '% is no longer available.', rec.name; END IF;
    IF rec.quantity < 1 OR rec.quantity > 50 THEN RAISE EXCEPTION 'Invalid quantity for %.', rec.name; END IF;
    IF rec.stock_qty < rec.quantity THEN RAISE EXCEPTION 'Only % left of %.', rec.stock_qty, rec.name; END IF;
    subtotal := subtotal + rec.price * rec.quantity;
    tax := tax + rec.price * rec.quantity * COALESCE(NULLIF(rec.tax_rate,0), (cfg->>'tax_rate')::numeric);
  END LOOP;

  IF subtotal = 0 THEN RAISE EXCEPTION 'Your cart is empty.'; END IF;

  delivery := CASE WHEN subtotal >= (cfg->>'free_delivery_threshold')::numeric THEN 0 ELSE (cfg->>'delivery_fee')::numeric END;
  IF _delivery_option = 'express' THEN delivery := delivery + (cfg->>'express_fee')::numeric; END IF;

  IF _coupon IS NOT NULL AND length(trim(_coupon)) > 0 THEN
    coupon_res := public.validate_coupon(_coupon, subtotal);
    IF NOT (coupon_res->>'valid')::boolean THEN RAISE EXCEPTION '%', coupon_res->>'message'; END IF;
    discount := (coupon_res->>'discount')::numeric;
    coupon_id := (coupon_res->>'coupon_id')::uuid;
  END IF;

  tax := round(tax);
  total := greatest(0, round(subtotal + tax + delivery - discount));

  IF _use_wallet > 0 THEN
    SELECT * INTO wal FROM public.wallets WHERE user_id = uid FOR UPDATE;
    IF FOUND THEN wallet_amt := least(round(_use_wallet), wal.balance, total); END IF;
  END IF;
  total := total - wallet_amt;

  INSERT INTO public.orders (user_id, subtotal, tax, discount, delivery_fee, wallet_used, total,
    coupon_code, payment_method, payment_status, delivery_option, shipping_address, status)
  VALUES (uid, subtotal, tax, discount, delivery, wallet_amt, total,
    CASE WHEN coupon_id IS NULL THEN NULL ELSE coupon_res->>'code' END,
    _payment_method,
    CASE WHEN _payment_method = 'wallet' AND total = 0 THEN 'paid'::payment_status ELSE 'pending'::payment_status END,
    _delivery_option, _address, 'placed')
  RETURNING * INTO new_order;

  UPDATE public.orders SET invoice_number = 'INV-' || to_char(now(),'YYYY') || '-' || upper(substr(replace(new_order.id::text,'-',''),1,8))
  WHERE id = new_order.id RETURNING * INTO new_order;

  INSERT INTO public.order_items (order_id, product_id, product_name, product_slug, emoji, unit, price, quantity, seller_id, tax)
  SELECT new_order.id, p.id, p.name, p.slug, p.emoji, p.unit, p.price, ci.quantity, p.seller_id,
         round(p.price * ci.quantity * COALESCE(NULLIF(p.tax_rate,0), (cfg->>'tax_rate')::numeric))
  FROM public.cart_items ci JOIN public.products p ON p.id = ci.product_id WHERE ci.user_id = uid;

  UPDATE public.products p SET stock_qty = p.stock_qty - ci.quantity
  FROM public.cart_items ci WHERE ci.product_id = p.id AND ci.user_id = uid;

  INSERT INTO public.inventory_movements (product_id, order_id, change, reason, created_by)
  SELECT ci.product_id, new_order.id, -ci.quantity, 'order', uid FROM public.cart_items ci WHERE ci.user_id = uid;

  INSERT INTO public.payments (order_id, user_id, provider, method, status, amount)
  VALUES (new_order.id, uid,
    CASE WHEN _payment_method = 'razorpay' THEN 'razorpay' ELSE 'internal' END,
    _payment_method, new_order.payment_status, total);

  IF wallet_amt > 0 THEN
    UPDATE public.wallets SET balance = balance - wallet_amt WHERE user_id = uid RETURNING * INTO wal;
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, balance_after, order_id, description)
    VALUES (wal.id, uid, 'debit', wallet_amt, wal.balance, new_order.id, 'Paid for ' || new_order.order_number);
  END IF;

  IF coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_redemptions (coupon_id, user_id, order_id, amount)
    VALUES (coupon_id, uid, new_order.id, discount);
    UPDATE public.coupons SET used_count = used_count + 1 WHERE id = coupon_id;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (uid, 'order', 'Order placed 🌿',
    'We received ' || new_order.order_number || '. We''ll keep you posted.', '/orders');

  DELETE FROM public.cart_items WHERE user_id = uid;

  RETURN to_jsonb(new_order);
END $$;
REVOKE EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, numeric) TO authenticated;

-- ============ CANCEL ORDER ============
CREATE OR REPLACE FUNCTION public.cancel_order(_order_id uuid, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); o public.orders%ROWTYPE; wal public.wallets%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please sign in.'; END IF;
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found.'; END IF;
  IF o.user_id <> uid AND NOT public.is_admin(uid) THEN RAISE EXCEPTION 'You cannot cancel this order.'; END IF;
  IF o.status IN ('shipped','out_for_delivery','delivered','cancelled','returned') THEN
    RAISE EXCEPTION 'This order can no longer be cancelled.';
  END IF;

  UPDATE public.products p SET stock_qty = p.stock_qty + oi.quantity
  FROM public.order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id;

  INSERT INTO public.inventory_movements (product_id, order_id, change, reason, created_by)
  SELECT oi.product_id, o.id, oi.quantity, 'cancellation', uid
  FROM public.order_items oi WHERE oi.order_id = o.id AND oi.product_id IS NOT NULL;

  IF o.wallet_used > 0 THEN
    UPDATE public.wallets SET balance = balance + o.wallet_used WHERE user_id = o.user_id RETURNING * INTO wal;
    INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, balance_after, order_id, description)
    VALUES (wal.id, o.user_id, 'credit', o.wallet_used, wal.balance, o.id, 'Refund for ' || o.order_number);
  END IF;

  UPDATE public.orders SET status = 'cancelled', cancel_reason = COALESCE(_reason, 'Cancelled by customer'),
    payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded'::payment_status ELSE payment_status END
  WHERE id = o.id RETURNING * INTO o;

  RETURN to_jsonb(o);
END $$;
REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid, text) TO authenticated;

-- ============ STOCK ADJUSTMENT ============
CREATE OR REPLACE FUNCTION public.adjust_stock(_product_id uuid, _change integer, _note text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); sid uuid; newqty integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please sign in.'; END IF;
  SELECT seller_id INTO sid FROM public.products WHERE id = _product_id;
  IF sid IS NULL AND NOT public.is_admin(uid) THEN RAISE EXCEPTION 'Product not found.'; END IF;
  IF NOT (public.is_admin(uid) OR public.owns_seller(uid, sid)) THEN RAISE EXCEPTION 'You cannot manage this product.'; END IF;
  UPDATE public.products SET stock_qty = greatest(0, stock_qty + _change) WHERE id = _product_id RETURNING stock_qty INTO newqty;
  INSERT INTO public.inventory_movements (product_id, change, reason, note, created_by)
  VALUES (_product_id, _change, 'manual', _note, uid);
  RETURN newqty;
END $$;
REVOKE EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text) TO authenticated;

-- ============ ORDER STATUS NOTIFICATIONS ============
CREATE OR REPLACE FUNCTION public.notify_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'order',
      'Order ' || NEW.order_number || ' is ' || replace(NEW.status::text, '_', ' '),
      'Tap to see the latest on your order.', '/orders');
    IF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN NEW.delivered_at := now(); END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_order_status() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_orders_notify ON public.orders;
CREATE TRIGGER trg_orders_notify BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_status();

-- ============ VERIFIED REVIEW FLAG ============
CREATE OR REPLACE FUNCTION public.mark_verified_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.is_verified := EXISTS (
    SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
    WHERE o.user_id = NEW.user_id AND oi.product_id = NEW.product_id AND o.status = 'delivered');
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.mark_verified_review() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_reviews_verified ON public.reviews;
CREATE TRIGGER trg_reviews_verified BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.mark_verified_review();

-- ============ SEARCH RPC ============
CREATE OR REPLACE FUNCTION public.search_products(_q text, _limit integer DEFAULT 20)
RETURNS SETOF public.products LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT * FROM public.products
  WHERE is_active AND deleted_at IS NULL
    AND (_q IS NULL OR _q = '' OR search_vector @@ plainto_tsquery('simple', _q) OR name ILIKE '%' || _q || '%')
  ORDER BY ts_rank(search_vector, plainto_tsquery('simple', coalesce(_q,''))) DESC, rating DESC
  LIMIT least(coalesce(_limit, 20), 100);
$$;
GRANT EXECUTE ON FUNCTION public.search_products(text, integer) TO anon, authenticated;