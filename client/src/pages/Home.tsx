import { Suspense, lazy, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Stethoscope, Building2 } from "lucide-react";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { getLoginUrl } from "@/const";

const ProviderDashboard = lazy(() => import("./ProviderDashboard"));

type UserType = "individual" | "institutional";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const updateUserType = trpc.auth.updateUserType.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  const userType = user?.userType ?? null;
  const { track } = useProviderConversionAnalytics("/home");

  // Not logged in → login
  useEffect(() => {
    if (!loading && !user) {
      setLocation(getLoginUrl("/home"));
    }
  }, [loading, user, setLocation]);

  // When user has chosen "institution" in the Header, redirect to that area (so default landing matches role)
  const { role } = useUserRole();
  useEffect(() => {
    if (loading || !user) return;
    // If they explicitly chose a role via the header dropdown, respect that choice
    // (role takes precedence over userType from database)
    if (role === "provider") return; // Stay on provider hub
    if (role === "institution") {
      setLocation("/hospital-admin-dashboard");
      return;
    }
    // If no explicit role chosen yet, use userType from database
    if (userType === "institutional") {
      setLocation("/hospital-admin-dashboard");
      return;
    }
  }, [user, userType, role, loading, setLocation]);

  const handleSetUserType = (type: UserType) => {
    if (type === "individual") {
      track("provider_conversion", "provider_role_selected", {
        role: "provider",
        source: "home_role_gate",
      });
    }
    updateUserType.mutate(
      { userType: type },
      {
        onSuccess: () => {
          if (type === "institutional") setLocation("/hospital-admin-dashboard");
        },
      }
    );
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // No userType set (e.g existing user) → show "Who are you?"
  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Choose how you&apos;ll use the platform so we can show you the right tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              onValueChange={(v) => handleSetUserType(v as UserType)}
              className="grid gap-3"
              disabled={updateUserType.isPending}
            >
              <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="individual" id="onb-individual" />
                <Stethoscope className="h-5 w-5" />
                <div>
                  <p className="font-medium">Healthcare Provider</p>
                  <p className="text-sm text-muted-foreground">
                    Access Fellowship, AHA certification, ResusGPS, and Care Signal in one provider workspace
                  </p>
                </div>
              </Label>
              <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary">
                <RadioGroupItem value="institutional" id="onb-institutional" />
                <Building2 className="h-5 w-5" />
                <div>
                  <p className="font-medium">Institution / Hospital</p>
                  <p className="text-sm text-muted-foreground">Manage staff training, track facility performance, and institutional subscriptions</p>
                </div>
              </Label>
            </RadioGroup>
            <p className="text-sm text-center text-muted-foreground">
              Parent or caregiver? Safe-Truth needs no account —{" "}
              <a href="/safe-truth" className="underline">
                share your story here
              </a>
              .
            </p>
          </CardContent>
          <div className="px-6 pb-4 text-center">
            <p className="text-xs text-muted-foreground">You can change your role anytime from the account menu</p>
          </div>
        </Card>
      </div>
    );
  }

  // Provider home — Fellowship vs AHA hub (include hospital admins who switched to Healthcare Provider in the menu)
  if (userType === "individual" || role === "provider") {
    return (
      <Suspense
        fallback={
          <div className="max-w-5xl mx-auto px-4 py-12">
            <Card>
              <CardHeader>
                <CardTitle>Loading provider home…</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Preparing your dashboard and next steps.
                </p>
                <div className="h-24 rounded-lg bg-muted animate-pulse" />
              </CardContent>
            </Card>
          </div>
        }
      >
        <ProviderDashboard />
      </Suspense>
    );
  }

  // Fallback (shouldn't reach here)
  return null;
}
