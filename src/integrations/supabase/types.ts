export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          line1: string
          line2: string | null
          phone: string
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          line1: string
          line2?: string | null
          phone: string
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          line1?: string
          line2?: string | null
          phone?: string
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          placement: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author_id: string | null
          body: string | null
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          emoji: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          amount: number
          coupon_id: string
          created_at: string
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          coupon_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          coupon_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          first_order_only: boolean
          id: string
          is_active: boolean
          max_discount: number | null
          min_order: number
          per_user_limit: number
          seller_id: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          first_order_only?: boolean
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order?: number
          per_user_limit?: number
          seller_id?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          first_order_only?: boolean
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order?: number
          per_user_limit?: number
          seller_id?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          order_id: string
          partner_user_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          partner_user_id: string
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          partner_user_id?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_partners: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_available: boolean
          is_verified: boolean
          phone: string
          rating: number
          service_pincodes: string[]
          updated_at: string
          user_id: string
          vehicle_number: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_available?: boolean
          is_verified?: boolean
          phone: string
          rating?: number
          service_pincodes?: string[]
          updated_at?: string
          user_id: string
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_available?: boolean
          is_verified?: boolean
          phone?: string
          rating?: number
          service_pincodes?: string[]
          updated_at?: string
          user_id?: string
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      harvest_updates: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          harvest_date: string | null
          id: string
          image_url: string | null
          is_published: boolean
          product_id: string | null
          seller_id: string
          stage: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          harvest_date?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          product_id?: string | null
          seller_id: string
          stage?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          harvest_date?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          product_id?: string | null
          seller_id?: string
          stage?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "harvest_updates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_updates_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          change: number
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          order_id: string | null
          product_id: string
          reason: string
          variant_id: string | null
        }
        Insert: {
          change: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          product_id: string
          reason?: string
          variant_id?: string | null
        }
        Update: {
          change?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          product_id?: string
          reason?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          emoji: string | null
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          product_slug: string | null
          quantity: number
          seller_id: string | null
          tax: number
          unit: string | null
          variant_id: string | null
        }
        Insert: {
          emoji?: string | null
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          product_slug?: string | null
          quantity?: number
          seller_id?: string | null
          tax?: number
          unit?: string | null
          variant_id?: string | null
        }
        Update: {
          emoji?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          product_slug?: string | null
          quantity?: number
          seller_id?: string | null
          tax?: number
          unit?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_reason: string | null
          coupon_code: string | null
          created_at: string
          delivered_at: string | null
          delivery_fee: number
          delivery_option: string
          delivery_otp: string | null
          delivery_partner_id: string | null
          discount: number
          id: string
          invoice_number: string | null
          order_number: string
          payment_method: string
          payment_ref: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          return_reason: string | null
          return_requested_at: string | null
          shipping_address: Json
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string
          wallet_used: number
        }
        Insert: {
          cancel_reason?: string | null
          coupon_code?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_fee?: number
          delivery_option?: string
          delivery_otp?: string | null
          delivery_partner_id?: string | null
          discount?: number
          id?: string
          invoice_number?: string | null
          order_number?: string
          payment_method?: string
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          return_reason?: string | null
          return_requested_at?: string | null
          shipping_address?: Json
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id: string
          wallet_used?: number
        }
        Update: {
          cancel_reason?: string | null
          coupon_code?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_fee?: number
          delivery_option?: string
          delivery_otp?: string | null
          delivery_partner_id?: string | null
          discount?: number
          id?: string
          invoice_number?: string | null
          order_number?: string
          payment_method?: string
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          return_reason?: string | null
          return_requested_at?: string | null
          shipping_address?: Json
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string
          wallet_used?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          error_code: string | null
          error_message: string | null
          id: string
          method: string
          order_id: string
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          provider_signature: string | null
          raw: Json
          refunded_amount: number
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          method?: string
          order_id: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_signature?: string | null
          raw?: Json
          refunded_amount?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          method?: string
          order_id?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_signature?: string | null
          raw?: Json
          refunded_amount?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          commission: number
          created_at: string
          id: string
          note: string | null
          period_end: string | null
          period_start: string | null
          reference: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          commission?: number
          created_at?: string
          id?: string
          note?: string | null
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          commission?: number
          created_at?: string
          id?: string
          note?: string | null
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          mrp: number
          name: string
          price: number
          product_id: string
          sku: string | null
          stock_qty: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          mrp: number
          name: string
          price: number
          product_id: string
          sku?: string | null
          stock_qty?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          mrp?: number
          name?: string
          price?: number
          product_id?: string
          sku?: string | null
          stock_qty?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badges: string[]
          category_id: string | null
          certifications: string[]
          created_at: string
          deleted_at: string | null
          description: string | null
          emoji: string | null
          id: string
          images: string[]
          ingredients: string | null
          is_active: boolean
          is_best_seller: boolean
          is_featured: boolean
          is_new_arrival: boolean
          is_organic_certified: boolean
          low_stock_threshold: number
          mrp: number
          name: string
          nutrition: Json
          price: number
          rating: number
          review_count: number
          search_vector: unknown
          seller_id: string | null
          slug: string
          stock_qty: number
          tax_rate: number
          unit: string
          updated_at: string
        }
        Insert: {
          badges?: string[]
          category_id?: string | null
          certifications?: string[]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          images?: string[]
          ingredients?: string | null
          is_active?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_organic_certified?: boolean
          low_stock_threshold?: number
          mrp: number
          name: string
          nutrition?: Json
          price: number
          rating?: number
          review_count?: number
          search_vector?: unknown
          seller_id?: string | null
          slug: string
          stock_qty?: number
          tax_rate?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          badges?: string[]
          category_id?: string | null
          certifications?: string[]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          images?: string[]
          ingredients?: string | null
          is_active?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_organic_certified?: boolean
          low_stock_threshold?: number
          mrp?: number
          name?: string
          nutrition?: Json
          price?: number
          rating?: number
          review_count?: number
          search_vector?: unknown
          seller_id?: string | null
          slug?: string
          stock_qty?: number
          tax_rate?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_suspended: boolean
          phone: string | null
          suspended_reason: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_suspended?: boolean
          phone?: string | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          phone?: string | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          is_redeemed: boolean
          redeemed_at: string | null
          referee_id: string | null
          referrer_id: string
          reward_amount: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_redeemed?: boolean
          redeemed_at?: string | null
          referee_id?: string | null
          referrer_id: string
          reward_amount?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_redeemed?: boolean
          redeemed_at?: string | null
          referee_id?: string | null
          referrer_id?: string
          reward_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_id: string
          provider_refund_id: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          payment_id: string
          provider_refund_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_id?: string
          provider_refund_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string | null
          body: string | null
          created_at: string
          id: string
          images: string[]
          is_verified: boolean
          order_id: string | null
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          created_at?: string
          id?: string
          images?: string[]
          is_verified?: boolean
          order_id?: string | null
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          body?: string | null
          created_at?: string
          id?: string
          images?: string[]
          is_verified?: boolean
          order_id?: string | null
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_finance: {
        Row: {
          created_at: string
          gst_number: string | null
          payout_account: string | null
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gst_number?: string | null
          payout_account?: string | null
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gst_number?: string | null
          payout_account?: string | null
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_finance_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          emoji: string | null
          id: string
          is_active: boolean
          location: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          slug: string
          story: string | null
          type: Database["public"]["Enums"]["seller_type"]
          updated_at: string
          verified: boolean
          years_active: number | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          slug: string
          story?: string | null
          type?: Database["public"]["Enums"]["seller_type"]
          updated_at?: string
          verified?: boolean
          years_active?: number | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          slug?: string
          story?: string | null
          type?: Database["public"]["Enums"]["seller_type"]
          updated_at?: string
          verified?: boolean
          years_active?: number | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          reference: string | null
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reference?: string | null
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reference?: string | null
          type?: Database["public"]["Enums"]["txn_type"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_stock: {
        Args: { _change: number; _note?: string; _product_id: string }
        Returns: number
      }
      admin_metrics: { Args: never; Returns: Json }
      assign_delivery_partner: {
        Args: { _order_id: string; _partner_user_id: string }
        Returns: Json
      }
      broadcast_notification: {
        Args: {
          _audience?: string
          _body?: string
          _link?: string
          _title: string
          _type?: Database["public"]["Enums"]["notification_type"]
        }
        Returns: number
      }
      cancel_order: {
        Args: { _order_id: string; _reason?: string }
        Returns: Json
      }
      commerce_settings: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _uid: string }; Returns: boolean }
      owns_seller: { Args: { _seller: string; _uid: string }; Returns: boolean }
      place_order: {
        Args: {
          _address: Json
          _coupon?: string
          _delivery_option?: string
          _payment_method?: string
          _use_wallet?: number
        }
        Returns: Json
      }
      search_products: {
        Args: { _limit?: number; _q: string }
        Returns: {
          badges: string[]
          category_id: string | null
          certifications: string[]
          created_at: string
          deleted_at: string | null
          description: string | null
          emoji: string | null
          id: string
          images: string[]
          ingredients: string | null
          is_active: boolean
          is_best_seller: boolean
          is_featured: boolean
          is_new_arrival: boolean
          is_organic_certified: boolean
          low_stock_threshold: number
          mrp: number
          name: string
          nutrition: Json
          price: number
          rating: number
          review_count: number
          search_vector: unknown
          seller_id: string | null
          slug: string
          stock_qty: number
          tax_rate: number
          unit: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      set_order_status: {
        Args: {
          _note?: string
          _order_id: string
          _status: Database["public"]["Enums"]["order_status"]
        }
        Returns: Json
      }
      validate_coupon: {
        Args: { _code: string; _subtotal: number }
        Returns: Json
      }
      verify_delivery_otp: {
        Args: { _order_id: string; _otp: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "customer" | "vendor" | "farmer" | "delivery" | "admin"
      delivery_status:
        | "assigned"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "failed"
      notification_type: "order" | "promo" | "system" | "payout" | "delivery"
      order_status:
        | "placed"
        | "confirmed"
        | "packed"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
        | "returned"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      seller_type: "farmer" | "vendor" | "brand"
      txn_type: "credit" | "debit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "vendor", "farmer", "delivery", "admin"],
      delivery_status: [
        "assigned",
        "picked_up",
        "in_transit",
        "delivered",
        "failed",
      ],
      notification_type: ["order", "promo", "system", "payout", "delivery"],
      order_status: [
        "placed",
        "confirmed",
        "packed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
      seller_type: ["farmer", "vendor", "brand"],
      txn_type: ["credit", "debit"],
    },
  },
} as const
