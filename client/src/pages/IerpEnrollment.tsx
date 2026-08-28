import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IerpInternProfileCard } from "@/components/IerpInternProfileCard";
import { IerpProgramCard } from "./LearnerDashboard";

export default function IerpEnrollment() {
  const { user, loading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login?next=%2Fprograms%2Fierp%2Fenroll",
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-700" />
      </div>
    );
  }

  if (user.userType === "institutional") {
    return (
      <div className="min-h-screen bg-muted/20 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Button asChild variant="ghost" className="-ml-3">
            <Link href="/programs/ierp">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to IERP pathway
            </Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Use an individual provider account for IERP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                IERP intern registration belongs to an individual learner
                profile. This institutional account cannot be registered as an
                intern or hold an IERP programme record.
              </p>
              <Button asChild>
                <Link href="/programs/ierp">Return to the IERP offer</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href="/programs/ierp">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to IERP pathway
          </Link>
        </Button>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">
            Secure enrollment
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Intern Emergency Readiness Program
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Register your intern profile first. Then complete the three-phase
            KES 15,000 pathway for AHA ACLS plus Paeds Resus BLS.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
          <div>
              <p className="font-semibold">Verification → Payment → Learning</p>
            <p className="mt-1">
              Submit your MoH deployment/posting letter, official internship
              letter reference number, and effective commencement date. After your
              profile is registered, open the BLS cognitive refresh; ACLS opens
              after BLS cognitive completion. August–November starters do not pay
              before 1 December EAT. From 1 December, the full KES 15,000 balance
              must be paid in one payment before continuing. If evidence is
              rejected or revoked, access pauses and the reviewer’s correction
              reason is shown before you can continue.
            </p>
          </div>
        </div>
        <IerpInternProfileCard />
        <IerpProgramCard enrollmentPage />
      </div>
    </div>
  );
}
