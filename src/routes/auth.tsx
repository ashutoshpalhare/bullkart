import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to BullKart" },
      { name: "description", content: "Sign in or create your BullKart account to shop organic, sell as a farmer or vendor, or deliver orders." },
      { property: "og:title", content: "Sign in to BullKart" },
      { property: "og:description", content: "Sign in or create your BullKart account." },
    ],
  }),
  component: AuthPage,
});

const roles = ["Customer", "Vendor", "Farmer", "Delivery", "Admin"];

function AuthPage() {
  const notReady = () =>
    toast.info("Authentication activates as soon as Lovable Cloud is enabled for this project.");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-14 sm:px-6">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <Leaf className="size-6" />
      </span>
      <h1 className="mt-5 text-center text-3xl">Welcome to BullKart</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        One account for shopping, selling and delivering organic.
      </p>

      <Tabs defaultValue="signin" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 rounded-full">
          <TabsTrigger value="signin" className="rounded-full">
            Sign in
          </TabsTrigger>
          <TabsTrigger value="signup" className="rounded-full">
            Create account
          </TabsTrigger>
        </TabsList>

        {(["signin", "signup"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <form
              className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
              onSubmit={(e) => {
                e.preventDefault();
                notReady();
              }}
            >
              {tab === "signup" && (
                <div className="grid gap-2">
                  <Label htmlFor={`${tab}-name`}>Full name</Label>
                  <Input id={`${tab}-name`} placeholder="Ananya Rao" className="rounded-xl" />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor={`${tab}-email`}>Email</Label>
                <Input id={`${tab}-email`} type="email" placeholder="you@example.com" className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${tab}-password`}>Password</Label>
                <Input id={`${tab}-password`} type="password" placeholder="••••••••" className="rounded-xl" />
              </div>
              {tab === "signup" && (
                <div className="grid gap-2">
                  <Label>I am signing up as</Label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full rounded-full">
                {tab === "signin" ? "Sign in" : "Create account"}
              </Button>

              <div className="flex items-center gap-3 py-1">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>
              <Button type="button" variant="outline" className="w-full rounded-full" onClick={notReady}>
                Continue with Google
              </Button>
              <Button type="button" variant="ghost" className="w-full rounded-full" onClick={notReady}>
                Continue with phone OTP
              </Button>
            </form>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
