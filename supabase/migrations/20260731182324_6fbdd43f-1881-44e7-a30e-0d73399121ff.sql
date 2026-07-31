
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('customer','vendor','farmer','delivery','admin');
CREATE TYPE public.seller_type AS ENUM ('farmer','vendor','brand');
CREATE TYPE public.order_status AS ENUM ('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','returned');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed','refunded');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
          NEW.email,
          NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  emoji TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (is_active);

-- SELLERS
CREATE TABLE public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type public.seller_type NOT NULL DEFAULT 'vendor',
  location TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  emoji TEXT,
  story TEXT,
  years_active INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sellers TO anon, authenticated;
GRANT ALL ON public.sellers TO service_role;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sellers public read" ON public.sellers FOR SELECT TO anon, authenticated USING (true);

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL,
  mrp NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT '1 unit',
  emoji TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  badges TEXT[] NOT NULL DEFAULT '{}',
  certifications TEXT[] NOT NULL DEFAULT '{}',
  ingredients TEXT,
  nutrition JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_organic_certified BOOLEAN NOT NULL DEFAULT true,
  stock_qty INT NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_best_seller BOOLEAN NOT NULL DEFAULT false,
  is_new_arrival BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (is_active);
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_seller_idx ON public.products(seller_id);

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  author_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reviews own insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews own update" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews own delete" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX reviews_product_idx ON public.reviews(product_id);

-- keep product rating in sync
CREATE OR REPLACE FUNCTION public.refresh_product_rating() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid UUID;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products p SET
    rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric,1) FROM public.reviews r WHERE r.product_id = pid), 0),
    review_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.product_id = pid)
  WHERE p.id = pid;
  RETURN NULL;
END; $$;
CREATE TRIGGER reviews_rating_sync AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

-- ADDRESSES
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CART
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON public.cart_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- WISHLIST
CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist" ON public.wishlist_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- COUPONS
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC(10,2) NOT NULL,
  min_order NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons public read" ON public.coupons FOR SELECT TO anon, authenticated USING (is_active);

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE DEFAULT ('BK' || to_char(now(),'YYMMDD') || lpad((floor(random()*100000))::text, 5, '0')),
  status public.order_status NOT NULL DEFAULT 'placed',
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  payment_ref TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  delivery_option TEXT NOT NULL DEFAULT 'standard',
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  cancel_reason TEXT,
  return_reason TEXT,
  return_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own orders update" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_slug TEXT,
  emoji TEXT,
  unit TEXT,
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "own order items insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- SEED: categories
INSERT INTO public.categories (slug, name, tagline, emoji, sort_order) VALUES
('grocery','Grocery','Staples & pantry','🌾',1),
('fruits-vegetables','Fruits & Vegetables','Farm fresh daily','🥬',2),
('dairy','Dairy','A2 milk & ghee','🥛',3),
('honey','Honey','Raw & unprocessed','🍯',4),
('spices','Spices','Stone ground','🌶️',5),
('ayurveda','Ayurvedic Products','Classical formulations','🪔',6),
('natural-health','Natural Health','Wellness essentials','🌿',7),
('personal-care','Organic Personal Care','Skin & hair','🧴',8),
('clothing','Organic Clothing','Khadi & cotton','👕',9),
('furniture','Wooden & Bamboo Furniture','Handcrafted','🪑',10),
('home-decor','Home Decor','Artisan made','🕯️',11),
('gardening','Gardening','Seeds & compost','🌱',12),
('cow-products','Cow Products','Panchagavya range','🐄',13),
('eco-friendly','Eco-Friendly','Zero waste living','♻️',14);

-- SEED: subcategories
INSERT INTO public.categories (slug, name, tagline, emoji, sort_order, parent_id)
SELECT v.slug, v.name, v.tagline, v.emoji, v.ord, c.id
FROM (VALUES
 ('millets','Millets','Ancient grains','🌾',1,'grocery'),
 ('pulses','Pulses & Dals','Unpolished','🫘',2,'grocery'),
 ('oils','Cold Pressed Oils','Wood pressed','🫒',3,'grocery'),
 ('ghee','Ghee','Bilona churned','🧈',1,'dairy'),
 ('milk','Milk & Paneer','Fresh daily','🥛',2,'dairy'),
 ('whole-spices','Whole Spices','Sun dried','🌶️',1,'spices'),
 ('churna','Churna & Powders','Classical','🪔',1,'ayurveda'),
 ('skin','Skin Care','Botanical','🧴',1,'personal-care'),
 ('hair','Hair Care','Herbal','💆',2,'personal-care')
) AS v(slug,name,tagline,emoji,ord,parent)
JOIN public.categories c ON c.slug = v.parent;

-- SEED: sellers
INSERT INTO public.sellers (slug, name, type, location, verified, emoji, story, years_active) VALUES
('vrindavan-gaushala','Vrindavan Gaushala','farmer','Mathura, UP',true,'🐄','A 200-cow Gir gaushala practising free grazing and traditional bilona churning.',18),
('nilgiri-honey','Nilgiri Honey Collective','farmer','Nilgiris, TN',true,'🐝','Tribal beekeepers wild-harvesting cliff and forest honey across the Nilgiris.',23),
('krishna-delta','Krishna Delta Farms','farmer','Guntur, AP',true,'🌾','Single-origin paddy grown on the Krishna delta without synthetic inputs.',14),
('kerala-kalpa','Kerala Kalpa Naturals','vendor','Thrissur, KL',true,'🥥','Wooden ghani chekku oils pressed in small batches.',9),
('jaintia-hills','Jaintia Hills Growers','farmer','Meghalaya',true,'🌿','Growers of the legendary high-curcumin Lakadong turmeric.',11),
('veda-roots','Veda Roots','brand','Jaipur, RJ',true,'🪔','Classical ayurvedic formulations made to GMP standards.',7),
('sattva-botanics','Sattva Botanics','brand','Pune, MH',true,'🧴','Cold-infused botanical skincare, free of sulphates and parabens.',6),
('charkha-weaves','Charkha Weaves','vendor','Bhuj, GJ',true,'👕','Artisan clusters handspinning and weaving khadi in Kutch.',12),
('tripura-bamboo','Tripura Bamboo Works','vendor','Agartala, TR',true,'🪑','Kiln-treated bamboo furniture finished with natural beeswax.',8),
('green-earth-agro','Green Earth Agro','vendor','Nashik, MH',true,'🌱','Vermicompost and bio-inputs for home and terrace gardens.',10),
('gomata-naturals','Gomata Naturals','farmer','Ujjain, MP',true,'🕯️','Panchagavya products made from indigenous desi cow derivatives.',15),
('tamra-living','Tamra Living','brand','Moradabad, UP',true,'🍶','Seamless pure copper and brass ware from Moradabad artisans.',20);

-- SEED: products
INSERT INTO public.products (slug,name,description,category_id,seller_id,price,mrp,unit,emoji,badges,certifications,ingredients,nutrition,stock_qty,rating,review_count,is_featured,is_best_seller,is_new_arrival)
SELECT v.slug, v.name, v.description, c.id, s.id, v.price, v.mrp, v.unit, v.emoji,
       v.badges::text[], v.certs::text[], v.ingredients, v.nutrition::jsonb, v.stock, v.rating, v.reviews, v.feat, v.best, v.new
FROM (VALUES
('a2-desi-cow-ghee','A2 Desi Cow Bilona Ghee','Slow-churned from A2 curd of free-grazing Gir cows using the traditional bilona method.','dairy','vrindavan-gaushala',1249,1599,'500 ml','🧈','{"Hand churned","Grass fed"}','{"Jaivik Bharat","FSSAI"}','100% A2 Gir cow milk','{"Energy":"900 kcal","Total Fat":"100 g","Saturated Fat":"62 g","Protein":"0 g","Carbohydrate":"0 g"}',40,4.8,2140,true,true,false),
('raw-forest-honey','Raw Wild Forest Honey','Wild-harvested by tribal beekeepers, never heated or filtered so pollen stays intact.','honey','nilgiri-honey',649,799,'500 g','🍯','{"Unheated","NMR tested"}','{"India Organic","NMR Tested"}','Raw multifloral forest honey','{"Energy":"304 kcal","Sugars":"82 g","Protein":"0.3 g"}',85,4.7,1382,true,true,false),
('sonamasuri-rice','Organic Sona Masuri Rice','Single-origin paddy grown without synthetic fertilisers, aged 12 months for aroma.','grocery','krishna-delta',389,460,'5 kg','🍚','{"Jaivik Bharat"}','{"Jaivik Bharat"}','Organic sona masuri paddy rice','{"Energy":"345 kcal","Carbohydrate":"78 g","Protein":"7 g","Fibre":"1.4 g"}',120,4.6,904,true,false,false),
('cold-pressed-coconut-oil','Cold Pressed Coconut Oil','Chekku-pressed in wooden ghani at low temperature to retain nutrients and aroma.','grocery','kerala-kalpa',429,520,'1 L','🥥','{"Wood pressed"}','{"FSSAI"}','100% organic coconut kernel','{"Energy":"900 kcal","Total Fat":"100 g","MCT":"62 g"}',64,4.5,611,false,true,false),
('himalayan-turmeric','Lakadong Turmeric Powder','High-curcumin Lakadong turmeric, sun-dried and stone-ground in small batches.','spices','jaintia-hills',299,380,'250 g','🟡','{"7% curcumin"}','{"India Organic"}','Lakadong turmeric rhizome','{"Energy":"312 kcal","Curcumin":"7%","Fibre":"21 g"}',150,4.9,1750,true,true,false),
('ashwagandha-capsules','Ashwagandha Root Capsules','Full-spectrum root extract standardised for withanolides, no fillers or binders.','ayurveda','veda-roots',549,699,'60 caps','🪔','{"KSM-66"}','{"GMP","AYUSH"}','Withania somnifera root extract, veg capsule shell','{"Serving":"1 capsule","Extract":"500 mg","Withanolides":"5%"}',90,4.4,486,false,false,true),
('neem-tulsi-facewash','Neem & Tulsi Face Wash','Gentle daily cleanser with cold-infused neem and tulsi for clear, balanced skin.','personal-care','sattva-botanics',349,449,'150 ml','🧴','{"Sulphate free"}','{"Cruelty Free"}','Aloe juice, neem extract, tulsi extract, coco glucoside','{}',70,4.3,322,false,false,true),
('khadi-cotton-kurta','Handwoven Khadi Cotton Kurta','Breathable handspun khadi woven by artisan clusters, naturally dyed in small lots.','clothing','charkha-weaves',1899,2499,'1 piece','👕','{"Handloom","Azo free dye"}','{"Khadi Mark","GOTS"}','100% handspun cotton khadi','{}',25,4.6,214,true,false,false),
('bamboo-study-table','Bamboo Study Table','Kiln-treated bamboo with a natural beeswax finish, assembled by hand in Tripura.','furniture','tripura-bamboo',7499,9999,'1 unit','🪑','{"FSC bamboo"}','{"FSC"}','Treated bamboo, beeswax finish','{}',8,4.5,87,false,false,false),
('vermicompost','Organic Vermicompost','Nutrient-dense worm castings that improve soil structure for terrace and pot gardens.','gardening','green-earth-agro',249,299,'5 kg','🌱','{"Odour free"}','{"Organic Input"}','Earthworm castings, cow dung compost','{}',200,4.4,530,false,false,false),
('panchagavya-dhoop','Panchagavya Dhoop Sticks','Traditional dhoop made from desi cow dung, ghee and herbs — no bamboo, no charcoal.','cow-products','gomata-naturals',199,260,'40 sticks','🕯️','{"Charcoal free"}','{"Handmade"}','Desi cow dung, ghee, guggul, loban','{}',0,4.2,168,false,false,false),
('steel-copper-bottle','Copper Water Bottle','Seamless pure copper bottle, lacquer-free inside so the water stays in contact with copper.','eco-friendly','tamra-living',899,1200,'950 ml','🍶','{"Plastic free"}','{"Handmade"}','99.7% pure copper','{}',60,4.5,401,true,true,false),
('foxtail-millet','Organic Foxtail Millet','Unpolished foxtail millet, a low-GI everyday rice substitute.','grocery','krishna-delta',179,220,'1 kg','🌾','{"Unpolished"}','{"Jaivik Bharat"}','Organic foxtail millet','{"Energy":"351 kcal","Protein":"12 g","Fibre":"8 g"}',180,4.5,342,false,false,true),
('kala-chana','Organic Kala Chana','Sun-dried black chickpeas from rainfed Maharashtra farms.','grocery','green-earth-agro',149,185,'1 kg','🫘','{"Rainfed"}','{"India Organic"}','Organic black chickpea','{"Energy":"364 kcal","Protein":"19 g","Fibre":"17 g"}',140,4.3,201,false,false,false),
('mustard-oil','Kachi Ghani Mustard Oil','Cold-pressed mustard oil with its full pungency and natural sediment.','grocery','kerala-kalpa',329,399,'1 L','🫒','{"Kachi ghani"}','{"FSSAI"}','Organic mustard seed','{"Energy":"900 kcal","Total Fat":"100 g"}',75,4.4,289,false,false,false),
('a2-paneer','Fresh A2 Cow Paneer','Set fresh each morning from A2 milk, no acid regulators.','dairy','vrindavan-gaushala',329,399,'400 g','🧀','{"Fresh daily"}','{"FSSAI"}','A2 cow milk, lemon juice','{"Energy":"265 kcal","Protein":"18 g","Fat":"20 g"}',30,4.6,412,false,true,true),
('buffalo-ghee','Traditional Buffalo Ghee','Rich, granular buffalo ghee churned the slow way.','dairy','gomata-naturals',999,1250,'500 ml','🧈','{"Granular"}','{"FSSAI"}','Buffalo milk butter','{"Energy":"900 kcal","Total Fat":"100 g"}',35,4.4,176,false,false,false),
('jamun-honey','Raw Jamun Blossom Honey','Monofloral jamun honey with a dark, malty finish.','honey','nilgiri-honey',749,899,'500 g','🍯','{"Monofloral"}','{"NMR Tested"}','Raw jamun blossom honey','{"Energy":"304 kcal","Sugars":"80 g"}',45,4.6,233,false,false,true),
('black-pepper','Malabar Black Peppercorns','Vine-ripened Tellicherry peppercorns, sun-dried whole.','spices','kerala-kalpa',389,470,'250 g','🌶️','{"Tellicherry"}','{"India Organic"}','Organic black peppercorn','{"Energy":"251 kcal","Piperine":"4%"}',95,4.7,388,false,true,false),
('cinnamon-sticks','Ceylon Cinnamon Quills','True cinnamon quills with a delicate sweetness.','spices','jaintia-hills',269,340,'100 g','🌿','{"True cinnamon"}','{"India Organic"}','Cinnamomum verum bark','{}',110,4.5,157,false,false,false),
('triphala-churna','Triphala Churna','Classical three-fruit blend, stone ground and sieved fine.','ayurveda','veda-roots',249,320,'200 g','🪔','{"Classical"}','{"AYUSH","GMP"}','Amla, haritaki, bibhitaki','{"Serving":"3 g"}',130,4.5,604,false,true,false),
('chyawanprash','Handmade Chyawanprash','Slow-cooked in iron kadhai with 42 herbs and A2 ghee.','ayurveda','veda-roots',699,899,'500 g','🍯','{"42 herbs"}','{"AYUSH"}','Amla, ghee, honey, 40 classical herbs','{"Energy":"320 kcal","Sugars":"52 g"}',55,4.7,821,true,false,false),
('moringa-powder','Moringa Leaf Powder','Shade-dried moringa leaves milled fine for smoothies and dals.','natural-health','green-earth-agro',329,420,'250 g','🌿','{"Shade dried"}','{"India Organic"}','Moringa oleifera leaf','{"Energy":"205 kcal","Protein":"27 g","Iron":"28 mg"}',88,4.4,266,false,false,true),
('wheatgrass-tablets','Wheatgrass Tablets','Cold-processed wheatgrass compressed without excipients.','natural-health','veda-roots',399,499,'120 tabs','💊','{"No excipients"}','{"GMP"}','Wheatgrass juice powder','{"Serving":"2 tablets"}',72,4.2,141,false,false,false),
('bhringraj-hair-oil','Bhringraj Hair Oil','Herb-infused sesame oil cooked the traditional taila paka way.','personal-care','sattva-botanics',449,570,'200 ml','💆','{"Cold infused"}','{"Cruelty Free"}','Sesame oil, bhringraj, amla, curry leaf','{}',96,4.6,517,false,true,false),
('multani-mitti-soap','Multani Mitti Cold Process Soap','Hand-cut, cured 6 weeks with clay and essential oils.','personal-care','sattva-botanics',199,249,'100 g','🧼','{"Cold process"}','{"Handmade"}','Coconut oil, multani mitti, essential oils','{}',210,4.3,198,false,false,true),
('organic-cotton-tshirt','Organic Cotton T-Shirt','GOTS-certified cotton jersey in undyed natural shades.','clothing','charkha-weaves',999,1399,'1 piece','👕','{"GOTS"}','{"GOTS"}','100% organic cotton','{}',80,4.4,163,false,false,false),
('teak-coffee-table','Reclaimed Teak Coffee Table','Built from salvaged teak beams with a natural oil finish.','furniture','tripura-bamboo',12999,16999,'1 unit','🪵','{"Reclaimed wood"}','{"Handmade"}','Reclaimed teak, natural oil','{}',5,4.6,42,true,false,false),
('terracotta-planters','Terracotta Planter Set','Wheel-thrown terracotta planters with drainage saucers.','home-decor','green-earth-agro',799,999,'Set of 3','🪴','{"Handthrown"}','{"Handmade"}','Natural terracotta clay','{}',65,4.3,119,false,false,true),
('bamboo-toothbrush','Bamboo Toothbrush Pack','Biodegradable bamboo handles with BPA-free soft bristles.','eco-friendly','tamra-living',249,349,'Pack of 4','🎋','{"Biodegradable"}','{"Plastic Free"}','Moso bamboo, BPA-free bristles','{}',300,4.2,275,false,false,false)
) AS v(slug,name,description,cat,sel,price,mrp,unit,emoji,badges,certs,ingredients,nutrition,stock,rating,reviews,feat,best,new)
JOIN public.categories c ON c.slug = v.cat
JOIN public.sellers s ON s.slug = v.sel;

-- SEED: coupons
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order, max_discount) VALUES
('ORGANIC10','10% off your order','percent',10,499,300),
('FARMFRESH','₹150 off orders above ₹999','flat',150,999,NULL),
('NEW20','20% off for first-time shoppers','percent',20,299,500),
('FREESHIP','Free delivery on any order','flat',49,0,NULL);
