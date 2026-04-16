import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ResusGPS from "./ResusGPS";
import { AlertCircle, ArrowLeft, RefreshCcw, Siren } from "lucide-react";

function mapUserTypeToRole(userType: string | null | undefined): UserRole {
  if (userType === "parent") return "parent";
  if (userType === "institutional") return "institution";
  if (userType === "individual") return "provider";
  return null;
}

function getRoleHomePath(role: UserRole): string {
  if (role === "parent") return "/parent-safe-truth";
  if (role === "institution") return "/hospital-admin-dashboard";
  return "/home";
}

function getResusGateCopy(role: UserRole) {
  if (role === "parent") {
    return {
      errorFallback: "Try again or return to parent resources. If you need the provider workspace, switch roles from the account menu first.",
      unavailableCta: "Return to parent resources",
      unavailableDestination: "/parent-safe-truth",
      accessAlert:
        "ResusGPS is part of the provider workspace. To use it as a clinician, switch to Provider from the account menu first.",
      accessCta: "Back to parent resources",
      accessDestination: "/parent-safe-truth",
    };
  }

  if (role === "institution") {
    return {
      errorFallback:
        "Try again or return to your institutional dashboard. If you need the provider workspace, switch roles from the account menu first.",
      unavailableCta: "Return to institutional dashboard",
      unavailableDestination: "/hospital-admin-dashboard",
      accessAlert:
        "ResusGPS is available from the provider workspace. Use the account menu to switch to Provider when you need bedside guidance.",
      accessCta: "Back to institutional dashboard",
      accessDestination: "/hospital-admin-dashboard",
    };
  }

  return {
    errorFallback: "Try again or continue with fellowship courses while we re-check your access.",
    unavailableCta: "Open Fellowship",
    unavailableDestination: "/fellowship",
    accessAlert: "Fellowship micro-courses extend ResusGPS access by 30 days each time you complete one.",
    accessCta: "Go to Fellowship micro-courses",
    accessDestination: "/fellowship",
  };
}

/**
 * ResusGPS with fellowship-linked access window (30 days per completed micro-course).
 */
export default function ResusGated() {
  const { user, loading } = useAuth();
  const { role } = useUserRole();
  const [, setLocation] = useLocation();
  const effectiveRole = role ?? mapUserTypeToRole(user?.userType);
  const roleHomePath = getRoleHomePath(effectiveRole);
  const gateCopy = getResusGateCopy(effectiveRole);
  const [slowLoad, setSlowLoad] = useState(false);
  const {
    data: access,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.fellowship.getResusGpsAccessStatus.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (!loading && !user) setLocation(getLoginUrl("/resus"));
  }, [loading, user, setLocation]);

  useEffect(() => {
    if (!user || !isLoading) {
      setSlowLoad(false);
      return;
    }
    const t = window.setTimeout(() => setSlowLoad(true), 8000);
    return () => window.clearTimeout(t);
  }, [user, isLoading]);

  if (!loading && !user) {
    return null;
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <Siren className="h-5 w-5" />
              Loading ResusGPS…
            </CardTitle>
            <CardDescription>
              We&apos;re checking your access and preparing the clinical guidance workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-24 rounded-lg bg-muted animate-pulse" />
            {slowLoad ? (
              <Alert>
                <RefreshCcw className="h-4 w-4" />
                <AlertDescription>
                  This is taking longer than expected. You can retry without leaving the page.
                </AlertDescription>
              </Alert>
            ) : null}
            {slowLoad ? (
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Retry access check
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !access) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-lg mx-auto space-y-6">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => setLocation(roleHomePath)}>
            <ArrowLeft className="h-4 w-4" />
            Back to hub
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>ResusGPS temporarily unavailable</CardTitle>
              <CardDescription>
                {gateCopy.errorFallback}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error?.message || "Access check failed."}</AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => void refetch()}>
                Retry ResusGPS
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setLocation(gateCopy.unavailableDestination)}
              >
                {gateCopy.unavailableCta}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!access.canUse) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-lg mx-auto space-y-6">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => setLocation(roleHomePath)}>
            <ArrowLeft className="h-4 w-4" />
            Back to hub
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>{access.headline}</CardTitle>
              <CardDescription>{access.detail}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{gateCopy.accessAlert}</AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => setLocation(gateCopy.accessDestination)}>
                {gateCopy.accessCta}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <ResusGPS />;
}
