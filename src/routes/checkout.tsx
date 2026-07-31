import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Section } from "@/components/commerce/section";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout | BullKart" },
      { name: "description", content: "Confirm your delivery address and pay securely for your organic order." },
      { property: "og:title", content: "Secure Checkout | BullKart" },
      { property: "og:description", content: "Confirm delivery and pay securely on BullKart." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return (
    <Section>
      <h1 className="text-3xl">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Order flow ready — payments activate once Cloud & Razorpay are connected.");
          }}
        >
          <fieldset className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <legend className="px-2 font-display text-lg font-semibold">Delivery address</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Full name", "name", "Ananya Rao"],
                ["Phone", "phone", "+91 98xxx xxxxx"],
                ["Address line", "line1", "Flat 402, Green Meadows"],
                ["Landmark", "line2", "Near Cubbon Park"],
                ["City", "city", "Bengaluru"],
                ["Pincode", "pincode", "560001"],
              ].map(([label, id, ph]) => (
                <div key={id as string} className="grid gap-2">
                  <Label htmlFor={id as string}>{label}</Label>
                  <Input id={id as string} name={id as string} placeholder={ph as string} className="rounded-xl" />
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <legend className="px-2 font-display text-lg font-semibold">Payment method</legend>
            <RadioGroup defaultValue="razorpay" className="gap-3">
              {[
                ["razorpay", "UPI / Cards / Netbanking (Razorpay)"],
                ["cod", "Cash on delivery"],
                ["wallet", "BullKart wallet (coming soon)"],
              ].map(([v, label]) => (
                <div key={v as string} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <RadioGroupItem value={v as string} id={v as string} />
                  <Label htmlFor={v as string} className="font-normal">
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>

          <Button type="submit" size="lg" className="w-full rounded-full lg:w-auto lg:px-10">
            Place order
          </Button>
        </form>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Items (3)</dt>
              <dd>₹2,287</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>Free</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Taxes</dt>
              <dd>Included</dd>
            </div>
          </dl>
          <Separator className="my-4" />
          <div className="flex justify-between font-display text-lg font-semibold">
            <span>Payable</span>
            <span>₹2,287</span>
          </div>
        </aside>
      </div>
    </Section>
  );
}
