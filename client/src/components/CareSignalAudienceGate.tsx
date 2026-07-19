import type { ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

type Props = {
  children: ReactNode;
};

/**
 * 2026-07-19 (account-types PR1): the parent userType is retired (North Star
 * §6.1) — Care Signal accounts are always provider/institution now, and
 * Safe-Truth (parent/caregiver stories) is a separate unauthenticated flow
 * that never reaches this gate. This component previously blocked
 * userType === "parent" here; that branch is now structurally unreachable,
 * so it's removed rather than left as dead code. Kept as a thin wrapper
 * (loading state only) in case a future audience check belongs here.
 */
export function CareSignalAudienceGate({ children }: Props) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Checking your account…
      </div>
    );
  }

  return <>{children}</>;
}
