import type { CartLine, CouponRow } from "@/types/db";

export const FREE_DELIVERY_THRESHOLD = 999;
export const DELIVERY_FEE = 49;
export const EXPRESS_FEE = 99;

export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce(
    (sum, l) => sum + Number(l.product?.price ?? 0) * l.quantity,
    0,
  );
  const mrpTotal = lines.reduce((sum, l) => sum + Number(l.product?.mrp ?? 0) * l.quantity, 0);
  const savings = Math.max(0, mrpTotal - subtotal);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE;
  return { subtotal, mrpTotal, savings, deliveryFee, itemCount: lines.reduce((n, l) => n + l.quantity, 0) };
}

export function couponDiscount(coupon: CouponRow | null, subtotal: number): number {
  if (!coupon) return 0;
  if (subtotal < Number(coupon.min_order)) return 0;
  const raw =
    coupon.discount_type === "percent"
      ? (subtotal * Number(coupon.discount_value)) / 100
      : Number(coupon.discount_value);
  const capped = coupon.max_discount ? Math.min(raw, Number(coupon.max_discount)) : raw;
  return Math.min(Math.round(capped), subtotal);
}
