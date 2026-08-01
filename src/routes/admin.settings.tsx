import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SectionCard } from "@/components/dashboard/dashboard-layout";
import { FormField } from "@/components/dashboard/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAllSettings, useSaveSetting } from "@/features/admin/hooks";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

type Commerce = {
  tax_rate: string;
  delivery_fee: string;
  express_fee: string;
  free_delivery_threshold: string;
};

const DEFAULTS: Commerce = {
  tax_rate: "0.05",
  delivery_fee: "49",
  express_fee: "99",
  free_delivery_threshold: "999",
};

function AdminSettings() {
  const settings = useAllSettings();
  const save = useSaveSetting();
  const [commerce, setCommerce] = useState<Commerce>(DEFAULTS);
  const [raw, setRaw] = useState<Record<string, string>>({});

  useEffect(() => {
    const row = (settings.data ?? []).find((s) => s.key === "commerce");
    if (row) {
      const value = row.value as Record<string, number>;
      setCommerce({
        tax_rate: String(value['tax_rate'] ?? DEFAULTS.tax_rate),
        delivery_fee: String(value['delivery_fee'] ?? DEFAULTS.delivery_fee),
        express_fee: String(value['express_fee'] ?? DEFAULTS.express_fee),
        free_delivery_threshold: String(value['free_delivery_threshold'] ?? DEFAULTS.free_delivery_threshold),
      });
    }
    const others: Record<string, string> = {};
    (settings.data ?? [])
      .filter((s) => s.key !== "commerce")
      .forEach((s) => {
        others[s.key] = JSON.stringify(s.value, null, 2);
      });
    setRaw(others);
  }, [settings.data]);

  return (
    <div className="space-y-8">
      <SectionCard title="Commerce" description="Applied by the checkout engine on every order.">
        {settings.isLoading ? (
          <Skeleton className="h-56 w-full rounded-2xl" />
        ) : (
          <Card className="rounded-2xl border-border shadow-soft">
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              <FormField label="Tax rate" hint="Fraction, e.g. 0.05 for 5% GST">
                <Input
                  value={commerce.tax_rate}
                  onChange={(e) => setCommerce((c) => ({ ...c, tax_rate: e.target.value }))}
                />
              </FormField>
              <FormField label="Delivery fee (₹)">
                <Input
                  type="number"
                  value={commerce.delivery_fee}
                  onChange={(e) => setCommerce((c) => ({ ...c, delivery_fee: e.target.value }))}
                />
              </FormField>
              <FormField label="Express surcharge (₹)">
                <Input
                  type="number"
                  value={commerce.express_fee}
                  onChange={(e) => setCommerce((c) => ({ ...c, express_fee: e.target.value }))}
                />
              </FormField>
              <FormField label="Free delivery above (₹)">
                <Input
                  type="number"
                  value={commerce.free_delivery_threshold}
                  onChange={(e) => setCommerce((c) => ({ ...c, free_delivery_threshold: e.target.value }))}
                />
              </FormField>
              <div className="sm:col-span-2">
                <Button
                  className="rounded-full"
                  disabled={save.isPending}
                  onClick={() =>
                    save.mutate({
                      key: "commerce",
                      value: {
                        tax_rate: Number(commerce.tax_rate) || 0,
                        delivery_fee: Number(commerce.delivery_fee) || 0,
                        express_fee: Number(commerce.express_fee) || 0,
                        free_delivery_threshold: Number(commerce.free_delivery_threshold) || 0,
                      },
                      description: "Checkout pricing rules",
                      isPublic: true,
                    })
                  }
                >
                  {save.isPending ? "Saving…" : "Save commerce settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </SectionCard>

      <SectionCard title="Other settings" description="Raw JSON for storefront copy, support details and feature flags.">
        <div className="grid gap-4">
          {Object.entries(raw).map(([key, value]) => (
            <Card key={key} className="rounded-2xl border-border shadow-soft">
              <CardContent className="space-y-3 p-6">
                <FormField label={key}>
                  <Textarea
                    rows={6}
                    className="font-mono text-xs"
                    value={value}
                    onChange={(e) => setRaw((r) => ({ ...r, [key]: e.target.value }))}
                  />
                </FormField>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    try {
                      save.mutate({ key, value: JSON.parse(value) as Record<string, unknown> });
                    } catch {
                      save.reset();
                    }
                  }}
                >
                  Save {key}
                </Button>
              </CardContent>
            </Card>
          ))}
          {Object.keys(raw).length === 0 && !settings.isLoading && (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No extra settings defined.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
