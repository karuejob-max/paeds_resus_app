import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { readSafeNextPathFromSearch } from "@/lib/authRedirect";

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nextPath = useMemo(() => {
    return readSafeNextPathFromSearch(search, "/home");
  }, [search]);

  const loginMutation = trpc.auth.loginWithPassword.useMutation({
    onSuccess: () => {
      // Reset role context on fresh sign-in so landing follows server-side userType.
      localStorage.removeItem("userRole");
      window.dispatchEvent(new CustomEvent("userRoleChanged", { detail: null }));
      setLocation(nextPath);
    },
    onError: (e) => {
      if (/Failed to fetch|NetworkError|Load failed/i.test(e.message)) {
        setError("Could not reach the server. Refresh and try again.");
        return;
      }
      // Surface Zod / server validation errors clearly instead of silently failing
      if (/Invalid email|invalid_format|BAD_REQUEST/i.test(e.message)) {
        setError("Please enter a valid email address and password.");
        return;
      }
      setError(e.message || "Sign-in failed. Please check your credentials and try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Read directly from DOM refs to capture browser-autofilled values that
    // may not have triggered React onChange events (a known browser behaviour).
    const resolvedEmail = emailRef.current?.value ?? email;
    const resolvedPassword = passwordRef.current?.value ?? password;

    if (!resolvedEmail || !resolvedPassword) {
      setError("Please enter your email and password.");
      return;
    }

    loginMutation.mutate({ email: resolvedEmail, password: resolvedPassword });
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    setLocation(nextPath);
  }, [isAuthenticated, loading, nextPath, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your email and password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Sign in form">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                ref={emailRef}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/forgot-password" className="text-primary underline">
                Forgot password?
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
