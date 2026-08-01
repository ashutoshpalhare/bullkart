import { describe, expect, it } from "vitest";
import { cartTotals, couponDiscount, DELIVERY_FEE } from "@/lib/cart";
import type { CartLine, CouponRow } from "@/types/db";

function line(price: number, mrp: number, quantity: number): CartLine {
  return { id: `${price}-${quantity}`, quantity, product: { price, mrp } } as unknown as CartLine;
}

const coupon = (over: Partial<CouponRow>): CouponRow =>
  ({
    discount_type: "percent",
    discount_value: 10,
    min_order: 0,
    max_discount: null,
    ...over,
  }) as CouponRow;

describe("cartTotals", () => {
  it("sums line items, savings and item count", () => {
    const totals = cartTotals([line(200, 250, 2), line(100, 100, 1)]);
    expect(totals.subtotal).toBe(500);
    expect(totals.mrpTotal).toBe(600);
    expect(totals.savings).toBe(100);
    expect(totals.itemCount).toBe(3);
  });

  it("charges delivery below the free threshold and waives it above", () => {
    expect(cartTotals([line(500, 500, 1)]).deliveryFee).toBe(DELIVERY_FEE);
    expect(cartTotals([line(1200, 1200, 1)]).deliveryFee).toBe(0);
  });

  it("treats an empty cart as free delivery", () => {
    expect(cartTotals([])).toMatchObject({ subtotal: 0, deliveryFee: 0, itemCount: 0 });
  });
});

describe("couponDiscount", () => {
  it("returns zero without a coupon or below the minimum order", () => {
    expect(couponDiscount(null, 1000)).toBe(0);
    expect(couponDiscount(coupon({ min_order: 999 }), 500)).toBe(0);
  });

  it("applies percentage discounts and respects the cap", () => {
    expect(couponDiscount(coupon({ discount_value: 20 }), 1000)).toBe(200);
    expect(couponDiscount(coupon({ discount_value: 20, max_discount: 150 }), 1000)).toBe(150);
  });

  it("never discounts more than the subtotal", () => {
    expect(couponDiscount(coupon({ discount_type: "flat", discount_value: 5000 }), 400)).toBe(400);
  });
});
