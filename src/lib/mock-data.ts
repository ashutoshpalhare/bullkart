import type { Category, Product } from "@/types/catalog";

export const categories: Category[] = [
  { id: "c1", slug: "grocery", name: "Grocery", tagline: "Staples & pantry", emoji: "🌾", productCount: 428 },
  { id: "c2", slug: "fruits-vegetables", name: "Fruits & Vegetables", tagline: "Farm fresh daily", emoji: "🥬", productCount: 312 },
  { id: "c3", slug: "dairy", name: "Dairy", tagline: "A2 milk & ghee", emoji: "🥛", productCount: 96 },
  { id: "c4", slug: "honey", name: "Honey", tagline: "Raw & unprocessed", emoji: "🍯", productCount: 41 },
  { id: "c5", slug: "spices", name: "Spices", tagline: "Stone ground", emoji: "🌶️", productCount: 134 },
  { id: "c6", slug: "ayurveda", name: "Ayurvedic Products", tagline: "Classical formulations", emoji: "🪔", productCount: 187 },
  { id: "c7", slug: "natural-health", name: "Natural Health", tagline: "Wellness essentials", emoji: "🌿", productCount: 122 },
  { id: "c8", slug: "personal-care", name: "Organic Personal Care", tagline: "Skin & hair", emoji: "🧴", productCount: 205 },
  { id: "c9", slug: "clothing", name: "Organic Clothing", tagline: "Khadi & cotton", emoji: "👕", productCount: 158 },
  { id: "c10", slug: "furniture", name: "Wooden & Bamboo Furniture", tagline: "Handcrafted", emoji: "🪑", productCount: 64 },
  { id: "c11", slug: "home-decor", name: "Home Decor", tagline: "Artisan made", emoji: "🕯️", productCount: 176 },
  { id: "c12", slug: "gardening", name: "Gardening", tagline: "Seeds & compost", emoji: "🌱", productCount: 93 },
  { id: "c13", slug: "cow-products", name: "Cow Products", tagline: "Panchagavya range", emoji: "🐄", productCount: 38 },
  { id: "c14", slug: "eco-friendly", name: "Eco-Friendly", tagline: "Zero waste living", emoji: "♻️", productCount: 149 },
];

export const products: Product[] = [
  {
    id: "p1", slug: "a2-desi-cow-ghee", name: "A2 Desi Cow Bilona Ghee", categorySlug: "dairy",
    price: 1249, mrp: 1599, unit: "500 ml", rating: 4.8, reviewCount: 2140, emoji: "🧈",
    seller: { id: "s1", name: "Vrindavan Gaushala", type: "farmer", location: "Mathura, UP", verified: true },
    badges: ["Hand churned", "Grass fed"], inStock: true,
    description: "Slow-churned from A2 curd of free-grazing Gir cows using the traditional bilona method.",
  },
  {
    id: "p2", slug: "raw-forest-honey", name: "Raw Wild Forest Honey", categorySlug: "honey",
    price: 649, mrp: 799, unit: "500 g", rating: 4.7, reviewCount: 1382, emoji: "🍯",
    seller: { id: "s2", name: "Nilgiri Honey Collective", type: "farmer", location: "Nilgiris, TN", verified: true },
    badges: ["Unheated", "NMR tested"], inStock: true,
    description: "Wild-harvested by tribal beekeepers, never heated or filtered so pollen stays intact.",
  },
  {
    id: "p3", slug: "sonamasuri-rice", name: "Organic Sona Masuri Rice", categorySlug: "grocery",
    price: 389, mrp: 460, unit: "5 kg", rating: 4.6, reviewCount: 904, emoji: "🍚",
    seller: { id: "s3", name: "Krishna Delta Farms", type: "farmer", location: "Guntur, AP", verified: true },
    badges: ["Jaivik Bharat"], inStock: true,
    description: "Single-origin paddy grown without synthetic fertilisers, aged 12 months for aroma.",
  },
  {
    id: "p4", slug: "cold-pressed-coconut-oil", name: "Cold Pressed Coconut Oil", categorySlug: "grocery",
    price: 429, mrp: 520, unit: "1 L", rating: 4.5, reviewCount: 611, emoji: "🥥",
    seller: { id: "s4", name: "Kerala Kalpa Naturals", type: "vendor", location: "Thrissur, KL", verified: true },
    badges: ["Wood pressed"], inStock: true,
    description: "Chekku-pressed in wooden ghani at low temperature to retain nutrients and aroma.",
  },
  {
    id: "p5", slug: "himalayan-turmeric", name: "Lakadong Turmeric Powder", categorySlug: "spices",
    price: 299, mrp: 380, unit: "250 g", rating: 4.9, reviewCount: 1750, emoji: "🟡",
    seller: { id: "s5", name: "Jaintia Hills Growers", type: "farmer", location: "Meghalaya", verified: true },
    badges: ["7% curcumin"], inStock: true,
    description: "High-curcumin Lakadong turmeric, sun-dried and stone-ground in small batches.",
  },
  {
    id: "p6", slug: "ashwagandha-capsules", name: "Ashwagandha Root Capsules", categorySlug: "ayurveda",
    price: 549, mrp: 699, unit: "60 caps", rating: 4.4, reviewCount: 486, emoji: "🪔",
    seller: { id: "s6", name: "Veda Roots", type: "brand", location: "Jaipur, RJ", verified: true },
    badges: ["KSM-66"], inStock: true,
    description: "Full-spectrum root extract standardised for withanolides, no fillers or binders.",
  },
  {
    id: "p7", slug: "neem-tulsi-facewash", name: "Neem & Tulsi Face Wash", categorySlug: "personal-care",
    price: 349, mrp: 449, unit: "150 ml", rating: 4.3, reviewCount: 322, emoji: "🧴",
    seller: { id: "s7", name: "Sattva Botanics", type: "brand", location: "Pune, MH", verified: true },
    badges: ["Sulphate free"], inStock: true,
    description: "Gentle daily cleanser with cold-infused neem and tulsi for clear, balanced skin.",
  },
  {
    id: "p8", slug: "khadi-cotton-kurta", name: "Handwoven Khadi Cotton Kurta", categorySlug: "clothing",
    price: 1899, mrp: 2499, unit: "1 piece", rating: 4.6, reviewCount: 214, emoji: "👕",
    seller: { id: "s8", name: "Charkha Weaves", type: "vendor", location: "Bhuj, GJ", verified: true },
    badges: ["Handloom", "Azo free dye"], inStock: true,
    description: "Breathable handspun khadi woven by artisan clusters, naturally dyed in small lots.",
  },
  {
    id: "p9", slug: "bamboo-study-table", name: "Bamboo Study Table", categorySlug: "furniture",
    price: 7499, mrp: 9999, unit: "1 unit", rating: 4.5, reviewCount: 87, emoji: "🪑",
    seller: { id: "s9", name: "Tripura Bamboo Works", type: "vendor", location: "Agartala, TR", verified: true },
    badges: ["FSC bamboo"], inStock: true,
    description: "Kiln-treated bamboo with a natural beeswax finish, assembled by hand in Tripura.",
  },
  {
    id: "p10", slug: "vermicompost", name: "Organic Vermicompost", categorySlug: "gardening",
    price: 249, mrp: 299, unit: "5 kg", rating: 4.4, reviewCount: 530, emoji: "🌱",
    seller: { id: "s10", name: "Green Earth Agro", type: "vendor", location: "Nashik, MH", verified: true },
    badges: ["Odour free"], inStock: true,
    description: "Nutrient-dense worm castings that improve soil structure for terrace and pot gardens.",
  },
  {
    id: "p11", slug: "panchagavya-dhoop", name: "Panchagavya Dhoop Sticks", categorySlug: "cow-products",
    price: 199, mrp: 260, unit: "40 sticks", rating: 4.2, reviewCount: 168, emoji: "🕯️",
    seller: { id: "s11", name: "Gomata Naturals", type: "farmer", location: "Ujjain, MP", verified: true },
    badges: ["Charcoal free"], inStock: false,
    description: "Traditional dhoop made from desi cow dung, ghee and herbs — no bamboo, no charcoal.",
  },
  {
    id: "p12", slug: "steel-copper-bottle", name: "Copper Water Bottle", categorySlug: "eco-friendly",
    price: 899, mrp: 1200, unit: "950 ml", rating: 4.5, reviewCount: 401, emoji: "🍶",
    seller: { id: "s12", name: "Tamra Living", type: "brand", location: "Moradabad, UP", verified: true },
    badges: ["Plastic free"], inStock: true,
    description: "Seamless pure copper bottle, lacquer-free inside so the water stays in contact with copper.",
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const productsByCategory = (slug: string) => products.filter((p) => p.categorySlug === slug);

export const featuredFarmers = [
  { id: "f1", name: "Vrindavan Gaushala", crop: "A2 Dairy", location: "Mathura, Uttar Pradesh", years: 18, emoji: "🐄" },
  { id: "f2", name: "Jaintia Hills Growers", crop: "Lakadong Turmeric", location: "Meghalaya", years: 11, emoji: "🌾" },
  { id: "f3", name: "Nilgiri Honey Collective", crop: "Wild Forest Honey", location: "Nilgiris, Tamil Nadu", years: 23, emoji: "🐝" },
];
