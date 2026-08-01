import { useState, type ReactNode } from "react";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/dashboard/form-field";
import { useMyStore, type SellerRow } from "@/features/roles/hooks";
import { useStoreCrud } from "@/features/seller/hooks";
import { useAuth } from "@/hooks/use-auth";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const COPY = {
  vendor: {
    title: "Set up your store",
    body: "Tell customers who you are. You can add products the moment your store exists.",
    placeholder: "Green Harvest Organics",
  },
  farmer: {
    title: "Set up your farm",
    body: "Create your farm profile to list produce and publish harvest updates.",
    placeholder: "Anand Family Farm",
  },
} as const;

/**
 * Renders the workspace once the signed-in user owns a store of this type,
 * otherwise offers a one-step onboarding form.
 */
export function StoreGate({
  type,
  children,
}: {
  type: "vendor" | "farmer";
  children: (store: SellerRow) => ReactNode;
}) {
  const { user } = useAuth();
  const store = useMyStore(type);
  const crud = useStoreCrud();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [story, setStory] = useState("");

  if (store.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (store.data) return <>{children(store.data)}</>;

  const copy = COPY[type];

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="p-6 sm:p-8">
        <span className="grid size-11 place-items-center rounded-xl bg-leaf text-leaf-foreground">
          <Store className="size-5" />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold">{copy.title}</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{copy.body}</p>

        <form
          className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!user || !name.trim()) return;
            crud.create.mutate(
              {
                owner_id: user.id,
                name: name.trim(),
                slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
                type,
                location: location.trim() || null,
                story: story.trim() || null,
                emoji: type === "farmer" ? "🌾" : "🛍️",
              },
              { onSuccess: () => store.refetch() },
            );
          }}
        >
          <FormField label={type === "farmer" ? "Farm name" : "Store name"}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={copy.placeholder} required />
          </FormField>
          <FormField label="Location">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nashik, Maharashtra" />
          </FormField>
          <FormField label="Short story" className="sm:col-span-2">
            <Textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={3}
              placeholder="What makes your produce special?"
            />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" className="rounded-full" disabled={crud.create.isPending}>
              {crud.create.isPending ? "Creating…" : "Create workspace"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
