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
  const facilityHistory = profile?.facilityHistory ?? [];
  const assignedInstitutionRoles = profile?.assignedInstitutionRoles ?? [];
  const workplaceCards = facilityHistory.length
    ? facilityHistory.map(institution => ({
        institutionId: institution.institutionId,
        institutionName: institution.institutionName,
        departments: institution.departments,
        membershipStatus: institution.membershipStatus,
      }))
    : reviewInstitutions.map(institution => ({
        institutionId: institution.id,
        institutionName: institution.companyName || "Institution",
        departments: [] as string[],
        membershipStatus: null,
      }));
  const jumpLinks = [
    { id: "identity", label: "Identity" },
    { id: "intern-registration", label: "IERP" },
    { id: "details", label: "Details" },
    { id: "professional-credentials", label: "Licences & evidence" },
    { id: "workplaces", label: "Workplaces" },
    { id: "records", label: "Records" },
    { id: "progress", label: "Progress" },
  ];

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

        <nav aria-label="Profile sections" className="sticky top-[4.5rem] z-20 -mx-1 overflow-x-auto rounded-xl border bg-background/95 p-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex min-w-max gap-1">
            {jumpLinks.map(link => (
              <a key={link.id} href={`#${link.id}`} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring">
                {link.label}
              </a>
            ))}
          </div>
        </nav>

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

        <section id="identity" aria-labelledby="identity-heading" className="scroll-mt-28 space-y-3">
          <div><h2 id="identity-heading" className="text-xl font-semibold">Professional identity</h2><p className="mt-1 text-sm text-muted-foreground">Set the role and professional area that describe you. These values help route learning and workplace workflows but do not grant permissions.</p></div>
          <ProfessionalIdentityCard />
        </section>

        {hasInternContext ? (
          <section id="intern-registration" aria-labelledby="intern-registration-heading" className="space-y-3">
            <div><h2 id="intern-registration-heading" className="text-xl font-semibold">Intern registration</h2><p className="mt-1 text-sm text-muted-foreground">This is separate from your professional licence, workplace membership, and certificates. It is required only for the Intern Emergency Readiness Program.</p></div>
            <IerpInternProfileCard />
          </section>
        ) : (
          <Card id="intern-registration" className="scroll-mt-28 border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold text-indigo-950 dark:text-indigo-100">Intern pathway</p><p className="mt-1 text-sm text-indigo-900/80 dark:text-indigo-100/80">Are you completing an internship? Add an intern role only if you need to register IERP deployment evidence.</p></div>
              <Link href="/programs/ierp/enroll"><Button type="button" variant="outline">Open IERP registration</Button></Link>
            </CardContent>
          </Card>
        )}

        <section id="details" aria-labelledby="details-heading" className="scroll-mt-28 space-y-3">
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

        <section id="workplaces" aria-labelledby="workplaces-heading" className="scroll-mt-28 space-y-3">
          <div>
            <h2 id="workplaces-heading" className="text-xl font-semibold">Workplace access</h2>
            <p className="mt-1 text-sm text-muted-foreground">Institutions and departments come from your workplace memberships and attendance history. Manage access and department choices in Workplaces &amp; access.</p>
          </div>
          <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-950 dark:text-indigo-100">
                <ClipboardCheck className="h-5 w-5 text-indigo-700" />
                Institutional administration
              </CardTitle>
              <CardDescription>
                Your institutional responsibilities and review queues are shown below. These badges describe assigned platform roles; they do not replace acceptance or competency evidence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {workplaceCards.map(institution => (
                <div key={institution.institutionId} className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{institution.institutionName}</p>
                    <p className="text-xs text-muted-foreground">{institution.departments?.length ? `Department: ${institution.departments.join(", ")}` : "No department recorded yet"}{institution.membershipStatus ? ` · membership ${institution.membershipStatus}` : ""}</p>
                  </div>
                  <Link href={`/workplaces?institutionId=${institution.institutionId}`}>
                    <Button type="button" variant="outline" size="sm">Manage workplace</Button>
                  </Link>
                </div>
              ))}
              {!facilityHistory.length && !reviewInstitutions.length ? <p className="text-sm text-muted-foreground">No institution or department is linked to this account yet.</p> : null}
              {assignedInstitutionRoles.length ? (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold">Assigned platform roles</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {assignedInstitutionRoles.map((role, index) => (
                      <div key={`${role.institutionId}-${role.roleKey}-${role.department ?? "all"}-${index}`} className="rounded-lg border bg-background p-3">
                        <p className="text-sm font-medium">{role.roleLabel}</p>
                        <p className="text-xs text-muted-foreground">{role.institutionName}{role.department ? ` · ${role.department}` : ""} · {role.status.replaceAll("_", " ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <Card id="records" className="scroll-mt-28 border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20">
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

        <Card id="progress" className="scroll-mt-28">
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
