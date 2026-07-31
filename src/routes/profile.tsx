import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { LogIn, LogOut, MapPin, Trash2, User as UserIcon } from "lucide-react";
import { Section, SectionHeader } from "@/components/commerce/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListSkeleton } from "@/components/commerce/skeletons";
import { EmptyState } from "@/components/commerce/states";
import { useAuth } from "@/hooks/use-auth";
import {
  useAddAddress,
  useAddresses,
  useDeleteAddress,
  useProfile,
  useUpdateProfile,
} from "@/features/orders/hooks";
import type { ShippingAddress } from "@/types/db";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — BullKart" },
      { name: "description", content: "Manage your BullKart profile, saved addresses and account security." },
      { property: "og:title", content: "Your Profile — BullKart" },
      { property: "og:description", content: "Manage your BullKart account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const addressSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(4, "Enter your street address").max(160),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.string().trim().min(2, "Enter your state").max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
});

const emptyAddress: ShippingAddress & { is_default: boolean } = {
  label: "Home",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  is_default: false,
};

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading, signOut, updatePassword } = useAuth();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const addresses = useAddresses();
  const addAddress = useAddAddress();
  const deleteAddress = useDeleteAddress();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState(emptyAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.full_name ?? "");
      setPhone(profile.data.phone ?? "");
    }
  }, [profile.data]);

  if (!user && !loading) {
    return (
      <Section>
        <SectionHeader eyebrow="Account" title="Your profile" />
        <EmptyState
          icon={<LogIn className="size-7" />}
          title="Sign in to manage your profile"
          description="Update your details, saved addresses and password."
          action={{ label: "Sign in", to: "/auth" }}
        />
      </Section>
    );
  }

  const saveAddress = () => {
    const result = addressSchema.safeParse(form);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    addAddress.mutate(form, { onSuccess: () => setForm(emptyAddress) });
  };

  return (
    <Section>
      <SectionHeader eyebrow="Account" title="Your profile" />

      <Tabs defaultValue="details">
        <TabsList className="rounded-full">
          <TabsTrigger value="details" className="rounded-full">
            Details
          </TabsTrigger>
          <TabsTrigger value="addresses" className="rounded-full">
            Addresses
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-full">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="max-w-lg rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-leaf text-leaf-foreground">
                <UserIcon className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{fullName || "BullKart shopper"}</p>
                <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Separator className="my-5" />
            <div className="grid gap-4">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  maxLength={80}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Mobile number</Label>
                <Input
                  id="phone"
                  value={phone}
                  maxLength={10}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <Button
              className="mt-5 rounded-full"
              disabled={updateProfile.isPending}
              onClick={() => updateProfile.mutate({ full_name: fullName, phone })}
            >
              Save changes
            </Button>
            <Separator className="my-5" />
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/orders">Your orders</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/wishlist">Wishlist</Link>
              </Button>
              <Button
                variant="ghost"
                className="rounded-full text-destructive"
                onClick={async () => {
                  await signOut();
                  void navigate({ to: "/", replace: true });
                }}
              >
                <LogOut className="size-4" /> Sign out
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              {addresses.isLoading ? (
                <ListSkeleton rows={2} />
              ) : (addresses.data ?? []).length === 0 ? (
                <EmptyState
                  icon={<MapPin className="size-7" />}
                  title="No saved addresses"
                  description="Add one so checkout takes seconds."
                />
              ) : (
                <ul className="space-y-3">
                  {(addresses.data ?? []).map((a) => (
                    <li key={a.id} className="rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {a.label}
                            {a.is_default && (
                              <Badge variant="secondary" className="ml-2">
                                Default
                              </Badge>
                            )}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {a.full_name}, {a.line1}
                            {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                          </p>
                          <p className="text-muted-foreground">{a.phone}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          aria-label="Delete address"
                          onClick={() => deleteAddress.mutate(a.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <p className="font-semibold">Add a new address</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["label", "Label", ""],
                    ["full_name", "Full name", ""],
                    ["phone", "Mobile number", ""],
                    ["pincode", "PIN code", ""],
                    ["line1", "Address line 1", "sm:col-span-2"],
                    ["line2", "Address line 2 (optional)", "sm:col-span-2"],
                    ["city", "City", ""],
                    ["state", "State", ""],
                  ] as const
                ).map(([key, label, cls]) => (
                  <div key={key} className={cls}>
                    <Label htmlFor={`addr-${key}`}>{label}</Label>
                    <Input
                      id={`addr-${key}`}
                      value={(form[key] as string) ?? ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      aria-invalid={Boolean(errors[key])}
                      className="mt-1.5"
                    />
                    {errors[key] && <p className="mt-1 text-xs text-destructive">{errors[key]}</p>}
                  </div>
                ))}
              </div>
              <label className="mt-4 flex items-center gap-3 text-sm">
                <Checkbox
                  checked={form.is_default}
                  onCheckedChange={(v) => setForm({ ...form, is_default: Boolean(v) })}
                />
                Set as default address
              </label>
              <Button className="mt-5 rounded-full" disabled={addAddress.isPending} onClick={saveAddress}>
                Save address
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="max-w-lg rounded-3xl border border-border bg-card p-6 shadow-soft">
            <p className="font-semibold">Change password</p>
            <div className="mt-4">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                minLength={8}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">Use at least 8 characters.</p>
            </div>
            <Button
              className="mt-5 rounded-full"
              disabled={password.length < 8}
              onClick={async () => {
                const { error } = await updatePassword(password);
                if (!error) setPassword("");
              }}
            >
              Update password
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Section>
  );
}
