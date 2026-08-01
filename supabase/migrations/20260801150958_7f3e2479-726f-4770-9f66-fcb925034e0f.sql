-- Catalogue browsing
CREATE INDEX IF NOT EXISTS idx_products_active_created ON public.products (created_at DESC) WHERE is_active AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id) WHERE is_active AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products (seller_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price) WHERE is_active AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_rating ON public.products (rating DESC) WHERE is_active AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (is_featured) WHERE is_featured AND is_active AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products (is_best_seller) WHERE is_best_seller AND is_active AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_new ON public.products (is_new_arrival) WHERE is_new_arrival AND is_active AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON public.products USING gin (search_vector);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images (product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants (product_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories (parent_id, sort_order) WHERE deleted_at IS NULL;

-- Orders and fulfilment
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_partner ON public.orders (delivery_partner_id, created_at DESC) WHERE delivery_partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON public.order_items (seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_partner ON public.delivery_assignments (partner_user_id, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements (product_id, created_at DESC);

-- Customer surfaces
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON public.wishlist_items (user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON public.reviews (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_wallet_txns_user ON public.wallet_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_harvest_updates_seller ON public.harvest_updates (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_seller ON public.payouts (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sellers_owner ON public.sellers (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions (user_id, coupon_id);