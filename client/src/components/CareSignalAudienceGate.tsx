import type { ReactNode } from "react";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

type Props = {
  children: ReactNode;
};

/** Parent accounts belong on Parent Safe-Truth — block the provider Care Signal form up front. */
export function CareSignalAudienceGate({ children }: Props) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Checking your account…
      </div>
    );
  }

  if (isAuthenticated && user?.userType === "parent") {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-700" />
        <AlertTitle className="text-amber-950">Care Signal is for healthcare providers</AlertTitle>
        <AlertDescription className="text-amber-900 space-y-3">
          <p>
            Parents and caregivers should share care journey feedback through Parent Safe-Truth — a
            separate product with the right tone and privacy for families.
          </p>
          <Button asChild className="bg-brand-teal hover:bg-[#143333] text-white">
            <Link href="/parent-safe-truth">Open Parent Safe-Truth</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
