import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { ProviderProfileForm } from "@/components/ProviderProfileForm";
import { ProfessionalIdentityCard } from "@/components/ProfessionalIdentityCard";
import { IerpInternProfileCard } from "@/components/IerpInternProfileCard";
import { ProviderCredentialsCard } from "@/components/ProviderCredentialsCard";

export default function ProviderProfile() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const profileQuery = trpc.provider.getProfile.useQuery();

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

        {profile && (profile.profileCompletionPercentage ?? 0) < 100 ? (
          <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h2 className="font-semibold text-amber-950 dark:text-amber-100">Complete your professional profile</h2>
                <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">
                  Your professional profile is {profile.profileCompletionPercentage ?? 0}% complete. This score includes current evidence where your cadre requires professional verification; it does not grant institutional duties or emergency dispatch authority.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <ProfessionalIdentityCard />
        <IerpInternProfileCard />
        <ProviderProfileForm />

        <section id="professional-credentials" aria-labelledby="professional-credentials-heading" className="space-y-3">
          <div>
            <h2 id="professional-credentials-heading" className="text-xl font-semibold text-foreground">Professional credentials</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter your regulatory licence here. The same verified record is used when you accept clinical institutional roles.</p>
          </div>
          <ProviderCredentialsCard />
        </section>

        <Card className="border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-blue-950 dark:text-blue-100">Professional records</h2>
              <p className="mt-1 text-sm text-blue-900/80 dark:text-blue-100/80">
                Certificates, CPD, and Fellowship records remain available in My Records. Regulatory licences are managed above in your Professional Profile.
              </p>
            </div>
            <Link href="/records"><Button type="button" variant="outline">Open My Records</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Professional portfolio overview</CardTitle>
            <CardDescription>
              Performance analytics are separate from professional identity. They are personal insight, not a public ranking or proof of competency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/my-progress?section=overview">
              <Button type="button" variant="outline">Open Professional portfolio overview</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
