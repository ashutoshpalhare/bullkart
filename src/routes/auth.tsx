import { useState } from "react";
import { canonical } from "@/lib/seo";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Leaf } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to BullKart" },
      {
        name: "description",
        content: "Sign in or create your BullKart account to shop certified organic products across India.",
      },
      { property: "og:title", content: "Sign in to BullKart" },
      { property: "og:description", content: "Sign in or create your BullKart account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [canonical("/auth")],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const validate = (withName = false) => {
    const e = emailSchema.safeParse(email);
    if (!e.success) return e.error.issues[0]!.message;
    const p = passwordSchema.safeParse(password);
    if (!p.success) return p.error.issues[0]!.message;
    if (withName && fullName.trim().length < 2) return "Enter your full name";
    return null;
  };

  const handleSignIn = async () => {
    const msg = validate();
    if (msg) return setError(msg);
    setError(null);
    setBusy(true);
    const { error: err } = await signIn(email.trim(), password);
    setBusy(false);
    if (err) return setError(err);
    toast.success("Welcome back!");
    void navigate({ to: "/" });
  };

  const handleSignUp = async () => {
    const msg = validate(true);
    if (msg) return setError(msg);
    setError(null);
    setBusy(true);
    const { error: err, needsConfirmation } = await signUp(email.trim(), password, fullName.trim());
    setBusy(false);
    if (err) return setError(err);
    if (needsConfirmation) {
      setConfirmSent(true);
      return;
    }
    toast.success("Account created");
    void navigate({ to: "/" });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-14 sm:px-6">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <Leaf className="size-6" />
      </span>
      <h1 className="mt-5 text-center text-3xl">Welcome to BullKart</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        One account for shopping, selling and delivering organic.
      </p>

      {confirmSent ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
          <p className="font-semibold">Check your email</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click it
            to activate your account, then sign in.
          </p>
          <Button variant="outline" className="mt-5 rounded-full" onClick={() => setConfirmSent(false)}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="signin" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 rounded-full">
            <TabsTrigger value="signin" className="rounded-full">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-full">
              Create account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-6 space-y-4">
            <div>
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="w-full rounded-full" disabled={busy} onClick={handleSignIn}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={async () => {
                const e = emailSchema.safeParse(email);
                if (!e.success) return setError("Enter your email first, then tap reset.");
                const { error: err } = await resetPassword(email.trim());
                if (err) return setError(err);
                toast.success("Password reset link sent");
              }}
            >
              Forgot your password?
            </button>
          </TabsContent>

          <TabsContent value="signup" className="mt-6 space-y-4">
            <div>
              <Label htmlFor="signup-name">Full name</Label>
              <Input
                id="signup-name"
                value={fullName}
                maxLength={80}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="w-full rounded-full" disabled={busy} onClick={handleSignUp}>
              {busy ? "Creating account…" : "Create account"}
            </Button>
          </TabsContent>
        </Tabs>
      )}

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <Button
        variant="outline"
        className="w-full rounded-full"
        onClick={async () => {
          const { error: err } = await signInWithGoogle();
          if (err) setError(err);
        }}
      >
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing you agree to BullKart's terms.{" "}
        <Link to="/" className="underline-offset-4 hover:underline">
          Back home
        </Link>
      </p>
    </div>
  );
}
