import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Eye, EyeOff, Stethoscope, Heart, Building2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { buildLoginUrl, readSafeNextPathFromSearch } from "@/lib/authRedirect";

type UserType = "individual" | "parent" | "institutional";

const ROLE_OPTIONS: {
  value: UserType;
  icon: React.ReactNode;
  title: string;
  description: string;
}[] = [
  {
    value: "individual",
    icon: <Stethoscope className="h-5 w-5 text-primary shrink-0" />,
    title: "Healthcare Provider",
    description: "Access Fellowship, AHA certification, ResusGPS, and Care Signal",
  },
  {
    value: "parent",
    icon: <Heart className="h-5 w-5 text-rose-400 shrink-0" />,
    title: "Parent / Caregiver",
    description: "Learn pediatric emergency response and first aid for your family",
  },
  {
    value: "institutional",
    icon: <Building2 className="h-5 w-5 text-amber-400 shrink-0" />,
    title: "Institution / Hospital",
    description: "Manage staff training, track facility performance, and institutional subscriptions",
  },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<UserType>("individual");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const nextPath = useMemo(() => {
    return readSafeNextPathFromSearch(search, "/home");
  }, [search]);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      localStorage.removeItem("userRole");
      window.dispatchEvent(new CustomEvent("userRoleChanged", { detail: null }));
      setLocation(buildLoginUrl(nextPath));
    },
    onError: (e) => {
      if (/Failed to fetch|NetworkError|Load failed/i.test(e.message)) {
        setError("Could not reach the server. Refresh and try again.");
        return;
      }
      setError(e.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    registerMutation.mutate({ email, password, name: name || undefined, userType });
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
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Choose your role to get the right tools from day one</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Role selection — icon cards */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">I am a</Label>
              <div className="grid gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUserType(opt.value)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors w-full
                      ${userType === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                      }`}
                  >
                    <span className="mt-0.5">{opt.icon}</span>
                    <div>
                      <p className={`text-sm font-medium ${userType === opt.value ? "text-primary" : "text-foreground"}`}>
                        {opt.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                    {/* Checkmark indicator */}
                    <span className={`ml-auto mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0
                      ${userType === opt.value ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                      {userType === opt.value && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
