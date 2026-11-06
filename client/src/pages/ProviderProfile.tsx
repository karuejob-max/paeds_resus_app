import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseBusiness, ClipboardCheck, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { ProviderProfileForm } from "@/components/ProviderProfileForm";
import { ProfessionalIdentityCard } from "@/components/ProfessionalIdentityCard";
import { IerpInternProfileCard } from "@/components/IerpInternProfileCard";
import { ProviderCredentialsCard } from "@/components/ProviderCredentialsCard";

export default function ProviderProfile() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const profileQuery = trpc.provider.getProfile.useQuery();
  const internProfileQuery = trpc.ierp.getMyInternProfile.useQuery(undefined, { retry: false });
  const workspaceQuery = trpc.institutionAccountability.getMyWorkspace.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-muted-foreground">Loading professional profile…</p>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;
  const roleText = [
    (user as { providerType?: string | null } | null)?.providerType,
    (user as { cadre?: string | null } | null)?.cadre,
    (user as { cadreOther?: string | null } | null)?.cadreOther,
  ].filter(Boolean).join(" ").toLowerCase();
  const hasInternContext = /\bintern\b|\bnoi\b|\bcoi\b|\bmoi\b/.test(roleText) || Boolean(internProfileQuery.data);
  const readiness = profile?.professionalReadiness;
  const licenseStatus = readiness?.licenseRequired
    ? readiness.licenseStatus === "missing"
      ? "Required evidence missing"
      : readiness.licenseStatus === "expired"
        ? "Licence expired"
        : readiness.licenseStatus === "verified"
          ? "Licence verified"
          : "Licence awaiting review"
    : "No licence required for this profile";
  const reviewInstitutions = (workspaceQuery.data?.institutions ?? []).filter(institution =>
    (workspaceQuery.data?.accountabilityInstitutionIds ?? []).includes(institution.id)
  );

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {profileQuery.isLoading ? <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">Loading your professional profile details…</p> : null}
        {profileQuery.isError ? <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Some profile details could not be loaded. You can still review and update your professional credentials below.</p> : null}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Professional profile</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Keep your professional identity, licence evidence, and provider information accurate in one place. Account security and workplace access remain separate so one field is not mistaken for another.
          </p>
          {profile?.department ? (
            <p className="mt-2 text-sm font-medium text-primary">Current workplace department: {profile.department}{" "}<Link href="/workplaces" className="underline">Change</Link></p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No workplace department set yet. <Link href="/workplaces" className="text-primary underline">Set it in Workplaces & access</Link>.</p>
          )}
        </div>

        <Card className="border-slate-200 bg-background shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5 text-primary" /> Your profile at a glance</CardTitle>
            <CardDescription>Identity, required evidence, and workplace access are separate records. Completing this page does not grant clinical duties or institutional permissions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Profile details</p><p className="mt-1 text-sm font-semibold">{profile?.profileCompletionPercentage ?? 0}% complete</p></div>
            <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Required evidence</p><p className="mt-1 text-sm font-semibold">{licenseStatus}</p></div>
            <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Workplace access</p><p className="mt-1 text-sm font-semibold">{profile?.department ? `Department: ${profile.department}` : "Not configured"}</p></div>
          </CardContent>
        </Card>

        <section aria-labelledby="identity-heading" className="space-y-3">
          <div><h2 id="identity-heading" className="text-xl font-semibold">Professional identity</h2><p className="mt-1 text-sm text-muted-foreground">Set the role and professional area that describe you. These values help route learning and workplace workflows but do not grant permissions.</p></div>
          <ProfessionalIdentityCard />
        </section>

        {hasInternContext ? (
          <section id="intern-registration" aria-labelledby="intern-registration-heading" className="space-y-3">
            <div><h2 id="intern-registration-heading" className="text-xl font-semibold">Intern registration</h2><p className="mt-1 text-sm text-muted-foreground">This is separate from your professional licence, workplace membership, and certificates. It is required only for the Intern Emergency Readiness Program.</p></div>
            <IerpInternProfileCard />
          </section>
        ) : (
          <Card className="border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold text-indigo-950 dark:text-indigo-100">Intern pathway</p><p className="mt-1 text-sm text-indigo-900/80 dark:text-indigo-100/80">Are you completing an internship? Add an intern role only if you need to register IERP deployment evidence.</p></div>
              <Link href="/programs/ierp/enroll"><Button type="button" variant="outline">Open IERP registration</Button></Link>
            </CardContent>
          </Card>
        )}

        <section aria-labelledby="details-heading" className="space-y-3">
          <div><h2 id="details-heading" className="text-xl font-semibold">Professional details</h2><p className="mt-1 text-sm text-muted-foreground">Maintain your experience context, languages, and professional summary. Where a verified licence exists, experience is derived from its first issue date.</p></div>
          <ProviderProfileForm experienceOverride={readiness?.experienceYears ?? null} />
        </section>

        <section id="professional-credentials" aria-labelledby="professional-credentials-heading" className="space-y-3">
          <div>
            <h2 id="professional-credentials-heading" className="text-xl font-semibold text-foreground">Licences and professional evidence</h2>
            <p className="mt-1 text-sm text-muted-foreground">Submit or renew a regulatory licence and add optional external certificates. Uploaded evidence is private and reviewed only by authorised reviewers.</p>
          </div>
          <ProviderCredentialsCard />
        </section>

        {reviewInstitutions.length > 0 ? (
          <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-950 dark:text-indigo-100">
                <ClipboardCheck className="h-5 w-5 text-indigo-700" />
                Institutional administration
              </CardTitle>
              <CardDescription>
                Open the staff credential and learning queue for an institution where you are an administrator, Departmental Head, deputy, CPD lead, or credential manager. The workspace will automatically limit results to your authorised scope.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {reviewInstitutions.map(institution => (
                <div key={institution.id} className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{institution.companyName || "Institution"}</p>
                    <p className="text-xs text-muted-foreground">Credential status, learning progress, and priority workforce actions</p>
                  </div>
                  <Link href={`/institution?section=accountability&institutionId=${institution.id}`}>
                    <Button type="button" variant="outline" size="sm">Open review queue</Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-blue-950 dark:text-blue-100">Professional records</h2>
                <p className="mt-1 text-sm text-blue-900/80 dark:text-blue-100/80">
                Certificates, CPD, life-support evidence, and Fellowship records are organised in one Records destination. Regulatory evidence is managed above when an action is needed.
              </p>
            </div>
            <Link href="/my-progress?section=records"><Button type="button" variant="outline">Open Certificates &amp; Records</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Professional progress</CardTitle>
            <CardDescription>
              Performance analytics are separate from professional identity. They are personal insight, not a public ranking or proof of competency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/my-progress?section=overview">
              <Button type="button" variant="outline">Open Professional progress</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
