import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";

export default function NerpOfferPage() {
  const { user, loading } = useAuth();
  const nextHref = user
    ? "/programs/nerp-acls/enroll"
    : "/login?redirect=%2Fprograms%2Fnerp-acls%2Fenroll";

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl border border-brand-orange/20 bg-gradient-to-br from-brand-surface via-background to-orange-50/40 p-6 shadow-sm md:p-10">
          <div className="max-w-3xl space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
              Paeds Resus learning pathway
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              A manageable path to ACLS readiness
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
              Complete the NERP ACLS pathway through six manageable monthly
              payments, with BLS included as part of the learning journey.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="cta" size="lg" disabled={loading}>
                <Link href={nextHref}>
                  {user ? "Start or resume enrollment" : "Sign in to continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/training/acls">View ACLS course</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CreditCard className="h-6 w-6 text-brand-orange" />
              <CardTitle className="text-lg">Lipa Mdogo Mdogo</CardTitle>
              <CardDescription>Simple monthly payments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                KES 2,500
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / month
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Six payments · KES 15,000 total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <CardTitle className="text-lg">Two linked courses</CardTitle>
              <CardDescription>
                One pathway, existing course records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 text-sm">
                <Link
                  className="rounded-full border px-3 py-1 text-primary hover:underline"
                  href="/training/bls"
                >
                  Paeds Resus BLS
                </Link>
                <Link
                  className="rounded-full border px-3 py-1 text-primary hover:underline"
                  href="/training/acls"
                >
                  AHA ACLS
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <ShieldCheck className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-lg">Clear requirements</CardTitle>
              <CardDescription>No promise without completion</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Certification is subject to completion of the programme’s
                required cognitive, assessment, and skills requirements.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What is included</CardTitle>
            <CardDescription>
              The offer links into the existing learning experience rather than
              creating duplicate course content.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            {[
              "Access to the Paeds Resus BLS learning pathway",
              "Access to the AHA ACLS cognitive pathway",
              "Six-month KES 2,500 payment plan",
              "Payment progress and remaining balance in one ledger",
              "Free Paeds Resus BLS Certificate on completion of its requirements",
              "Clear next steps for any practical or skills requirements",
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
