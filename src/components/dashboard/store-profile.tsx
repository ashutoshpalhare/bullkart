import { useEffect, useState } from "react";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/dashboard/form-field";
import { SectionCard } from "@/components/dashboard/dashboard-layout";
import { useStoreCrud } from "@/features/seller/hooks";
import { useSaveSellerFinance, useSellerFinance } from "@/features/seller/finance";
import type { SellerRow } from "@/features/roles/hooks";

/** Editable brand / farm profile shared by the vendor and farmer workspaces. */
export function StoreProfile({ store, kind }: { store: SellerRow; kind: "vendor" | "farmer" }) {
  const crud = useStoreCrud();
  // GST / payout live in the private seller_finance table, not the public seller row.
  const finance = useSellerFinance(store.id);
  const saveFinance = useSaveSellerFinance();
  const [form, setForm] = useState({
    name: store.name,
    location: store.location ?? "",
    emoji: store.emoji ?? "",
    story: store.story ?? "",
    years_active: store.years_active?.toString() ?? "",
    logo_url: store.logo_url ?? "",
    cover_url: store.cover_url ?? "",
    gst_number: "",
    payout_account: "",
    is_active: store.is_active,
  });

  useEffect(() => {
    if (!finance.data) return;
    setForm((prev) => ({
      ...prev,
      gst_number: finance.data?.gst_number ?? "",
      payout_account: finance.data?.payout_account ?? "",
    }));
  }, [finance.data]);

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SectionCard
      title={kind === "farmer" ? "Farm profile" : "Store profile"}
      description="This is what customers see on your listings and profile page."
    >
      <Card className="rounded-2xl shadow-soft">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            {store.verified ? (
              <Badge className="rounded-full bg-leaf text-leaf-foreground">
                <BadgeCheck className="mr-1 size-3.5" /> Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full">
                <ShieldAlert className="mr-1 size-3.5" /> Pending verification
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">/{store.slug}</span>
          </div>

          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              saveFinance.mutate({
                seller_id: store.id,
                gst_number: form.gst_number,
                payout_account: form.payout_account,
              });
              crud.update.mutate({
                id: store.id,
                values: {
                  name: form.name.trim(),
                  location: form.location.trim() || null,
                  emoji: form.emoji.trim() || null,
                  story: form.story.trim() || null,
                  years_active: form.years_active ? Number(form.years_active) : null,
                  logo_url: form.logo_url.trim() || null,
                  cover_url: form.cover_url.trim() || null,
                  is_active: form.is_active,
                },
              });
            }}
          >
            <FormField label={kind === "farmer" ? "Farm name" : "Store name"}>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </FormField>
            <FormField label="Location">
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
            </FormField>
            <FormField label="Emoji">
              <Input value={form.emoji} onChange={(e) => set("emoji", e.target.value)} maxLength={4} />
            </FormField>
            <FormField label="Years active">
              <Input
                type="number"
                min={0}
                value={form.years_active}
                onChange={(e) => set("years_active", e.target.value)}
              />
            </FormField>
            <FormField label={kind === "farmer" ? "Farm story" : "Brand story"} className="sm:col-span-2">
              <Textarea value={form.story} onChange={(e) => set("story", e.target.value)} rows={4} />
            </FormField>
            <FormField label="Logo URL">
              <Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} />
            </FormField>
            <FormField label="Cover URL">
              <Input value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} />
            </FormField>
            <FormField label="GST number" hint="Private — visible only to you and BullKart admins.">
              <Input value={form.gst_number} onChange={(e) => set("gst_number", e.target.value)} />
            </FormField>
            <FormField label="Payout account" hint="Private — visible only to you and BullKart admins.">
              <Input value={form.payout_account} onChange={(e) => set("payout_account", e.target.value)} />
            </FormField>

            <div className="flex items-center justify-between rounded-xl border border-border p-3 sm:col-span-2">
              <div>
                <p className="text-sm font-medium">Storefront live</p>
                <p className="text-xs text-muted-foreground">
                  Turn this off to hide your listings while you restock.
                </p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" className="rounded-full" disabled={crud.update.isPending || saveFinance.isPending}>
                {crud.update.isPending ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </SectionCard>
  );
}
