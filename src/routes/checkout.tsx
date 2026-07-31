import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CheckCircle2, LogIn, ShoppingCart, Tag } from "lucide-react";
import { toast } from "sonner";
import { Section, SectionHeader } from "@/components/commerce/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/commerce/skeletons";
import { EmptyState } from "@/components/commerce/states";
import { formatPrice, estimatedDelivery } from "@/lib/format";
import { EXPRESS_FEE, cartTotals, couponDiscount } from "@/lib/cart";
import { couponsQuery } from "@/features/catalog/queries";
import { useCart } from "@/features/cart/hooks";
import { useAddresses, usePlaceOrder } from "@/features/orders/hooks";
import { useAuth } from "@/hooks/use-auth";
import type { CouponRow, ShippingAddress } from "@/types/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — BullKart" },
      { name: "description", content: "Confirm your delivery address, apply coupons and place your organic order." },
      { property: "og:title", content: "Secure Checkout — BullKart" },
      { property: "og:description", content: "Place your organic order on BullKart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

const addressSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(4, "Enter your street address").max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.string().trim().min(2, "Enter your state").max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
});

type Step = "address" | "delivery" | "payment" | "review";
const steps: { key: Step; label: string }[] = [
  { key: "address", label: "Address" },
  { key: "delivery", label: "Delivery" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
];

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const cart = useCart();
  const addresses = useAddresses();
  const coupons = useQuery(couponsQuery());
  const placeOrder = usePlaceOrder();

  const [step, setStep] = useState<Step>("address");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [form, setForm] = useState<ShippingAddress>({
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deliveryOption, setDeliveryOption] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [applied, setApplied] = useState<CouponRow | null>(null);
  const [placed, setPlaced] = useState<{ order_number: string } | null>(null);

  const lines = (cart.data ?? []).filter((l) => l.product);
  const totals = cartTotals(lines);
  const expressFee = deliveryOption === "express" ? EXPRESS_FEE : 0;
  const discount = couponDiscount(applied, totals.subtotal);
  const deliveryFee = totals.deliveryFee + expressFee;
  const total = Math.max(0, totals.subtotal - discount + deliveryFee);

  const savedAddress = useMemo(
    () => (addresses.data ?? []).find((a) => a.id === selectedAddressId) ?? null,
    [addresses.data, selectedAddressId],
  );

  const shipping: ShippingAddress = savedAddress
    ? {
        full_name: savedAddress.full_name,
        phone: savedAddress.phone,
        line1: savedAddress.line1,
        line2: savedAddress.line2,
        city: savedAddress.city,
        state: savedAddress.state,
        pincode: savedAddress.pincode,
        label: savedAddress.label,
      }
    : form;

  if (placed) {
    return (
      <Section>
        <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-leaf text-leaf-foreground">
            <CheckCircle2 className="size-8" />
          </span>
          <h1 className="mt-5 text-2xl">Order confirmed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Order <span className="font-semibold text-foreground">{placed.order_number}</span> is on its way.
            Expected delivery by {estimatedDelivery(deliveryOption === "express" ? 1 : 3)}.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full">
              <Link to="/orders">Track order</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/categories">Keep shopping</Link>
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  if (!user && !loading) {
    return (
      <Section>
        <SectionHeader eyebrow="Almost there" title="Checkout" />
        <EmptyState
          icon={<LogIn className="size-7" />}
          title="Sign in to checkout"
          description="You need an account to place an order and track deliveries."
          action={{ label: "Sign in", to: "/auth" }}
        />
      </Section>
    );
  }

  if (cart.isLoading || loading) {
    return (
      <Section>
        <ListSkeleton rows={4} />
      </Section>
    );
  }

  if (lines.length === 0) {
    return (
      <Section>
        <SectionHeader eyebrow="Almost there" title="Checkout" />
        <EmptyState
          icon={<ShoppingCart className="size-7" />}
          title="Your cart is empty"
          description="Add products before heading to checkout."
          action={{ label: "Start shopping", to: "/categories" }}
        />
      </Section>
    );
  }

  const validateAddress = () => {
    if (savedAddress) return true;
    const result = addressSchema.safeParse(form);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return false;
    }
    setErrors({});
    return true;
  };

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    const match = (coupons.data ?? []).find((c) => c.code.toUpperCase() === code);
    if (!match) {
      toast.error("That coupon code isn't valid.");
      return;
    }
    if (totals.subtotal < Number(match.min_order)) {
      toast.error(`Add ${formatPrice(Number(match.min_order) - totals.subtotal)} more to use ${match.code}.`);
      return;
    }
    setApplied(match);
    toast.success(`${match.code} applied`);
  };

  const submit = () => {
    placeOrder.mutate(
      {
        items: lines.map((l) => ({
          product_id: l.product!.id,
          product_name: l.product!.name,
          product_slug: l.product!.slug,
          emoji: l.product!.emoji,
          unit: l.product!.unit,
          price: Number(l.product!.price),
          quantity: l.quantity,
        })),
        subtotal: totals.subtotal,
        discount,
        delivery_fee: deliveryFee,
        total,
        coupon_code: applied?.code ?? null,
        payment_method: paymentMethod,
        delivery_option: deliveryOption,
        shipping_address: shipping,
      },
      {
        onSuccess: (order) => setPlaced({ order_number: order.order_number }),
      },
    );
  };

  return (
    <Section>
      <SectionHeader eyebrow="Almost there" title="Checkout" />

      <ol className="mb-8 flex flex-wrap gap-2">
        {steps.map((s, i) => {
          const activeIndex = steps.findIndex((x) => x.key === step);
          const done = i < activeIndex;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => (i <= activeIndex ? setStep(s.key) : undefined)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold",
                  step === s.key
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-leaf text-leaf-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}. {s.label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          {step === "address" && (
            <div>
              <h2 className="text-lg">Delivery address</h2>

              {(addresses.data ?? []).length > 0 && (
                <RadioGroup
                  value={selectedAddressId}
                  onValueChange={setSelectedAddressId}
                  className="mt-4 grid gap-3"
                >
                  {(addresses.data ?? []).map((a) => (
                    <label
                      key={a.id}
                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 text-sm has-[:checked]:border-primary"
                    >
                      <RadioGroupItem value={a.id} className="mt-0.5" />
                      <span>
                        <span className="font-semibold">{a.full_name}</span>
                        {a.is_default && (
                          <Badge variant="secondary" className="ml-2">
                            Default
                          </Badge>
                        )}
                        <span className="block text-muted-foreground">
                          {a.line1}, {a.city}, {a.state} {a.pincode} · {a.phone}
                        </span>
                      </span>
                    </label>
                  ))}
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-sm has-[:checked]:border-primary">
                    <RadioGroupItem value="" />
                    Use a new address
                  </label>
                </RadioGroup>
              )}

              {!savedAddress && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["full_name", "Full name", "sm:col-span-1"],
                      ["phone", "Mobile number", "sm:col-span-1"],
                      ["line1", "Address line 1", "sm:col-span-2"],
                      ["line2", "Address line 2 (optional)", "sm:col-span-2"],
                      ["city", "City", ""],
                      ["state", "State", ""],
                      ["pincode", "PIN code", ""],
                    ] as const
                  ).map(([key, label, cls]) => (
                    <div key={key} className={cls}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={(form[key] as string) ?? ""}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        aria-invalid={Boolean(errors[key])}
                        className="mt-1.5"
                      />
                      {errors[key] && <p className="mt-1 text-xs text-destructive">{errors[key]}</p>}
                    </div>
                  ))}
                </div>
              )}

              <Button
                className="mt-6 rounded-full"
                onClick={() => {
                  if (validateAddress()) setStep("delivery");
                }}
              >
                Continue to delivery
              </Button>
            </div>
          )}

          {step === "delivery" && (
            <div>
              <h2 className="text-lg">Delivery speed</h2>
              <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption} className="mt-4 grid gap-3">
                {[
                  { value: "standard", title: "Standard", copy: `Arrives ${estimatedDelivery(3)}`, fee: 0 },
                  { value: "express", title: "Express", copy: `Arrives ${estimatedDelivery(1)}`, fee: EXPRESS_FEE },
                ].map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border p-4 text-sm has-[:checked]:border-primary"
                  >
                    <span className="flex items-center gap-3">
                      <RadioGroupItem value={o.value} />
                      <span>
                        <span className="font-semibold">{o.title}</span>
                        <span className="block text-muted-foreground">{o.copy}</span>
                      </span>
                    </span>
                    <span className="font-semibold">{o.fee === 0 ? "Free" : formatPrice(o.fee)}</span>
                  </label>
                ))}
              </RadioGroup>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="rounded-full" onClick={() => setStep("address")}>
                  Back
                </Button>
                <Button className="rounded-full" onClick={() => setStep("payment")}>
                  Continue to payment
                </Button>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div>
              <h2 className="text-lg">Payment method</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-4 grid gap-3">
                {[
                  { value: "cod", title: "Cash on delivery", copy: "Pay the delivery partner in cash" },
                  { value: "upi", title: "UPI", copy: "Simulated payment for this demo" },
                  { value: "card", title: "Card", copy: "Simulated payment for this demo" },
                ].map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border p-4 text-sm has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value={o.value} />
                    <span>
                      <span className="font-semibold">{o.title}</span>
                      <span className="block text-muted-foreground">{o.copy}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="rounded-full" onClick={() => setStep("delivery")}>
                  Back
                </Button>
                <Button className="rounded-full" onClick={() => setStep("review")}>
                  Review order
                </Button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div>
              <h2 className="text-lg">Review & place order</h2>
              <div className="mt-4 rounded-2xl border border-border p-4 text-sm">
                <p className="font-semibold">{shipping.full_name}</p>
                <p className="text-muted-foreground">
                  {shipping.line1}
                  {shipping.line2 ? `, ${shipping.line2}` : ""}, {shipping.city}, {shipping.state}{" "}
                  {shipping.pincode} · {shipping.phone}
                </p>
              </div>
              <ul className="mt-4 space-y-3">
                {lines.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 text-sm">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-cream text-2xl" aria-hidden>
                      {l.product!.emoji ?? "🌿"}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {l.product!.name} × {l.quantity}
                    </span>
                    <span className="font-semibold">{formatPrice(Number(l.product!.price) * l.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="rounded-full" onClick={() => setStep("payment")}>
                  Back
                </Button>
                <Button className="rounded-full" disabled={placeOrder.isPending} onClick={submit}>
                  {placeOrder.isPending ? "Placing order…" : `Place order · ${formatPrice(total)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <p className="font-semibold">Order summary</p>

            <div className="mt-4 flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code"
                aria-label="Coupon code"
                className="h-10 rounded-full"
              />
              <Button variant="outline" className="h-10 rounded-full" onClick={applyCoupon}>
                Apply
              </Button>
            </div>
            {applied && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                <Tag className="size-3.5" /> {applied.code} — {applied.description}
              </p>
            )}

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(totals.subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <dt>Coupon discount</dt>
                  <dd>-{formatPrice(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-semibold">{formatPrice(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </Section>
  );
}
