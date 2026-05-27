import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { LegalExternalLink } from "@/components/LegalExternalLink";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { buildLoginUrl, readSafeNextPathFromSearch } from "@/lib/authRedirect";
import type { PhoneCountryMode } from "@shared/user-phone";
import { normalizeUserPhone } from "@shared/user-phone";

type UserType = "individual" | "parent" | "institutional";

export default function Register() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { isAuthenticated, loading, sessionSettled } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<UserType>("individual");
  const [phoneMode, setPhoneMode] = useState<PhoneCountryMode>("ke");
  const [phoneValue, setPhoneValue] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const nextPath = useMemo(() => readSafeNextPathFromSearch(search, "/home"), [search]);

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
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your full name as it should appear on your certificate.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError("You must accept the Terms of Use and Privacy Policy.");
      return;
    }
    if (phoneValue.trim()) {
      const n = normalizeUserPhone({ mode: phoneMode, value: phoneValue });
      if (!n) {
        setError(
          phoneMode === "ke"
            ? "Kenya mobile: enter 9 digits (e.g. 712345678 or 0712345678)."
            : "International: enter your full number with country code (e.g. +447700900123)."
        );
        return;
      }
    }
    registerMutation.mutate({
      email,
      password,
      name: trimmedName,
      userType,
      phoneMode,
      phoneValue: phoneValue.trim() === "" ? undefined : phoneValue,
      acceptTerms: true,
      acceptPrivacy: true,
    });
  };

  useEffect(() => {
    if (loading || !sessionSettled) return;
    if (!isAuthenticated) return;
    setLocation(nextPath);
  }, [isAuthenticated, loading, sessionSettled, nextPath, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            One minute to get started. You can switch between provider, parent, and hospital tools later from the menu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="space-y-2">
              <Label htmlFor="reg-role">I am signing up as</Label>
              <Select value={userType} onValueChange={(v) => setUserType(v as UserType)}>
                <SelectTrigger id="reg-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Healthcare provider (clinical staff)</SelectItem>
                  <SelectItem value="parent">Parent or caregiver</SelectItem>
                  <SelectItem value="institutional">Hospital or institution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Jane Wanjiru Muthoni"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use the spelling you want on your AHA and Paeds Resus certificates.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Mobile (optional)</Label>
              <Select value={phoneMode} onValueChange={(v) => setPhoneMode(v as PhoneCountryMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ke">Kenya (+254)</SelectItem>
                  <SelectItem value="intl">Outside Kenya</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder={phoneMode === "ke" ? "712345678 or 0712345678" : "e.g. +447700900123"}
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@hospital.or.ke"
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
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters, letters and numbers"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
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

            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-terms"
                  checked={acceptTerms}
                  onCheckedChange={(v) => setAcceptTerms(v === true)}
                />
                <Label htmlFor="accept-terms" className="text-sm leading-snug cursor-pointer font-normal">
                  I agree to the{" "}
                  <LegalExternalLink href="/terms" className="text-primary underline">
                    Terms of Use
                  </LegalExternalLink>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-privacy"
                  checked={acceptPrivacy}
                  onCheckedChange={(v) => setAcceptPrivacy(v === true)}
                />
                <Label htmlFor="accept-privacy" className="text-sm leading-snug cursor-pointer font-normal">
                  I agree to the{" "}
                  <LegalExternalLink href="/privacy" className="text-primary underline">
                    Privacy Policy
                  </LegalExternalLink>
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={registerMutation.isPending || !acceptTerms || !acceptPrivacy}>
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
