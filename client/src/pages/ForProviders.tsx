import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { getLoginUrl } from "@/const";
import { buildJsonLdGraph, buildOrganizationJsonLd } from "@/lib/seo-schema";
import { ArrowRight, Radio, Stethoscope, GraduationCap } from "lucide-react";

export default function ForProviders() {
  useScrollToTop();
  usePageMeta({
    title: "For Healthcare Providers — ResusGPS, Care Signal & Fellowship | Paeds Resus",
    description:
      "Healthcare providers in Kenya: ResusGPS bedside guidance, Care Signal monthly QI reporting, AHA-aligned training, and the Paeds Resus Fellowship pathway on one platform.",
    path: "/for-providers",
  });

  return (
    <>
      <JsonLdScript data={buildJsonLdGraph([buildOrganizationJsonLd()])} />
      <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/50">
        <header className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-sm font-medium text-brand-teal mb-2">Healthcare providers</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">One account for bedside care, QI, and learning</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Paeds Resus is the platform. ResusGPS, Care Signal, and fellowship micro-courses are products on
            that platform — each with a clear job for clinicians in Kenya and the East African Community.
          </p>
        </header>

        <div className="max-w-4xl mx-auto px-4 pb-12 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="h-5 w-5 text-brand-teal" />
                ResusGPS — bedside clinical guidance
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Open ResusGPS during paediatric emergencies for structured ABCDE assessment, CPR Clock,
                weight-based medications, and protocol checklists. Designed for resource-limited settings —
                always defer to your senior clinician and local protocol.
              </p>
              <a href={getLoginUrl("/resus")}>
                <Button className="gap-2">
                  Sign in to ResusGPS
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Radio className="h-5 w-5 text-brand-teal" />
                Care Signal — monthly QI discipline
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Report incidents and near-misses to strengthen paediatric emergency culture. Care Signal is
                for providers — not parents. Qualifying monthly reports contribute to Fellowship Pillar C.
              </p>
              <a href={getLoginUrl("/care-signal")}>
                <Button variant="outline">Sign in for Care Signal</Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-brand-teal" />
                Fellowship & AHA-aligned courses
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Earn progress toward Paeds Resus Fellow through micro-courses, ResusGPS attributable cases, and
                Care Signal reporting. BLS, ACLS, and PALS are optional parallel tracks via Paeds Resus
                Limited — not fellowship requirements.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/training">
                  <Button variant="outline">Training catalog</Button>
                </Link>
                <a href={getLoginUrl("/fellowship")}>
                  <Button variant="outline">Fellowship dashboard</Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2 pt-4">
            <Link href="/register">
              <Button variant="cta">Create provider account</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">Platform home</Button>
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
