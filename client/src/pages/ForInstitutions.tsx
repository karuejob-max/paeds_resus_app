import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { buildJsonLdGraph, buildOrganizationJsonLd } from "@/lib/seo-schema";
import { ArrowRight } from "lucide-react";

/**
 * Stakeholder SEO page — canonical institutional product surface remains /institutional.
 */
export default function ForInstitutions() {
  useScrollToTop();
  usePageMeta({
    title: "For Hospitals & Institutions — Paediatric Emergency Readiness | Paeds Resus",
    description:
      "Hospital readiness systems, staff training cohorts, Care Signal facility review, and ERT management for institutions in Kenya and East Africa.",
    path: "/for-institutions",
  });

  return (
    <>
      <JsonLdScript data={buildJsonLdGraph([buildOrganizationJsonLd()])} />
      <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/50">
        <header className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-sm font-medium text-brand-teal mb-2">Hospitals & training organisations</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Readiness systems, not seat bundles</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Paeds Resus helps hospital leaders deploy ResusGPS, coordinate AHA-aligned training, review Care
            Signal at facility level, and manage emergency response teams — with honest metrics and
            mission-aligned implementation support.
          </p>
        </header>

        <div className="max-w-4xl mx-auto px-4 pb-12 space-y-6 text-muted-foreground leading-relaxed">
          <p>
            The institutional portal supports staff onboarding, training schedules, cohort enrollment with
            volume pricing, and visibility into who is certified and who needs renewal. Care Signal facility
            review connects frontline reports to actionable quality improvement — not surveillance of
            individual clinicians without consent.
          </p>
          <p>
            Request a readiness conversation or institutional quote through the main institutional page.
            Register your facility to access the hospital admin dashboard after onboarding.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/institutional">
              <Button variant="cta" className="gap-2">
                Go to institutional portal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Register institution</Button>
            </Link>
            <Link href="/training">
              <Button variant="outline">Staff training courses</Button>
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
