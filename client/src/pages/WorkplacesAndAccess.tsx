import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, ChevronRight, ShieldCheck } from "lucide-react";
import { ProviderFacilityLinkingCard } from "@/components/ProviderFacilityLinkingCard";
import { ProviderWorkplaceContextCard } from "@/components/ProviderWorkplaceContextCard";

function membershipLabel(status: string) {
  switch (status) {
    case "active":
      return "Active membership";
    case "invited":
      return "Invitation pending";
    case "suspended":
      return "Access suspended";
    case "ended":
      return "Membership ended";
    default:
      return status.replaceAll("_", " ");
  }
}

function membershipClass(status: string) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "invited":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function WorkplacesAndAccess() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const membershipsQuery = trpc.institution.getMyMemberships.useQuery(
    undefined,
    {
      enabled: Boolean(user),
      staleTime: 10_000,
    }
  );

  if (loading || membershipsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading workplaces…
      </div>
    );
  }

  if (!user) return null;

  const memberships = membershipsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Workplaces &amp; access
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage your relationships with registered institutions. A workplace
            link identifies an institutional relationship; it does not prove
            competency, assign an IERS duty, or replace explicit acceptance of a
            dated responsibility.
          </p>
        </div>

        <Card className="border-teal-200 bg-teal-50/30 dark:border-teal-900/50 dark:bg-teal-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-700" /> What access
              means
            </CardTitle>
            <CardDescription>
              General membership, product permissions, dated duties, readiness,
              and activation response are separate states. The platform keeps
              them separate so a facility relationship cannot silently grant
              emergency authority.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/provider-profile">
              <Button type="button" variant="outline">
                Edit professional profile
              </Button>
            </Link>
            <Link href="/my-shift">
              <Button type="button" variant="ghost">
                Open My Shift
              </Button>
            </Link>
          </CardContent>
        </Card>

        <ProviderWorkplaceContextCard />
        <ProviderFacilityLinkingCard />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Your institution
              memberships
            </CardTitle>
            <CardDescription>
              These are the institution relationships currently associated with
              this account. Department and facility context are shown only when
              the institution has supplied them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {memberships.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm font-medium">
                  No institution membership yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the request panel above to find a registered facility and
                  ask its administrator to review your relationship.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {memberships.map(membership => (
                  <div
                    key={membership.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {membership.companyName || "Institution"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {membership.staffRole
                          ? membership.staffRole.replaceAll("_", " ")
                          : "Provider relationship"}
                        {membership.department
                          ? ` · ${membership.department}`
                          : ""}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${membershipClass(membership.membershipStatus)}`}
                      >
                        {membershipLabel(membership.membershipStatus)}
                      </span>
                      {membership.isPendingInvite ? (
                        <p className="mt-2 text-xs text-amber-800">
                          Accept the invitation from your provider dashboard
                          before institutional operations become available.
                        </p>
                      ) : null}
                      {membership.membershipStatus === "active" ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          IERS roles and dated responsibilities still require
                          separate assignment and acceptance.
                        </p>
                      ) : null}
                    </div>
                    {membership.membershipStatus === "active" ? (
                      <Link href="/institution">
                        <Button type="button" variant="outline" size="sm">
                          Open workspace{" "}
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
