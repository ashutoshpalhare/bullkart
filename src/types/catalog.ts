export type UserRole = "customer" | "vendor" | "farmer" | "delivery" | "admin";

export type SellerType = "farmer" | "vendor" | "brand";

export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  emoji: string;
  productCount: number;
}

export interface Seller {
  id: string;
  name: string;
  type: SellerType;
  location: string;
  verified: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  price: number;
  mrp: number;
  unit: string;
  rating: number;
  reviewCount: number;
  seller: Seller;
  badges: string[];
  inStock: boolean;
  description: string;
  emoji: string;
}
