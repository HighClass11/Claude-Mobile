import * as React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const { user, signInWithPassword, signUp } = useAuth();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmSent, setConfirmSent] = React.useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result =
      mode === "signin"
        ? await signInWithPassword(email, password)
        : await signUp(email, password, fullName);
    setSubmitting(false);
    if (result.error) setError(result.error);
    else if (mode === "signup") setConfirmSent(true);
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">ShaneOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your personal CEO operating system</p>
        </div>

        <Card>
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle>{mode === "signin" ? "Welcome back" : "Create your account"}</CardTitle>
            <CardDescription>
              {mode === "signin" ? "Sign in to see what to do next." : "Set up ShaneOS for Cepher Wealth Group."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {confirmSent ? (
              <p className="text-sm text-muted-foreground">
                Check your email to confirm your account, then sign in.
              </p>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="fullName">Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Shane Armstrong"
                      required
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shane@cepherwealth.com"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {!confirmSent && (
          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "New to ShaneOS? Create an account" : "Already have an account? Sign in"}
          </button>
        )}
      </div>
    </div>
  );
}
