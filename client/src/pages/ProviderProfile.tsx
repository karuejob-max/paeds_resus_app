import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { ProviderProfileForm } from "@/components/ProviderProfileForm";
import { ProfessionalIdentityCard } from "@/components/ProfessionalIdentityCard";
import { ProviderCredentialsCard } from "@/components/ProviderCredentialsCard";
import { IerpInternProfileCard } from "@/components/IerpInternProfileCard";

export default function ProviderProfile() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const profileQuery = trpc.provider.getProfile.useQuery();

  if (loading || profileQuery.isLoading) {
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Professional profile</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Keep your professional identity and provider information accurate. Choose cadre and specialization once in Professional Identity, record experience and optional language context in the smaller profile section, and use Professional Credentials for one evidence-backed Licence number, jurisdiction, regulator, and AHA certificate evidence. Account security and workplace access remain separate so one field is not mistaken for another.
          </p>
          {profile?.department ? (
            <p className="mt-2 text-sm font-medium text-primary">Current workplace department: {profile.department}</p>
          ) : null}
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
        <ProviderCredentialsCard />
        <ProviderProfileForm />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> My performance</CardTitle>
            <CardDescription>
              Performance analytics are separate from professional identity. They are personal insight, not a public ranking or proof of competency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/performance-dashboard">
              <Button type="button" variant="outline">Open My performance</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
