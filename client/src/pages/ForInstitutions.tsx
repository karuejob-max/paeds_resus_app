import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { buildJsonLdGraph, buildOrganizationJsonLd } from "@/lib/seo-schema";
import { ArrowRight } from "lucide-react";

const SERVICE_REGION_TOWNS =
  "Nyeri, Embu, Murang'a, Kerugoya, Nyahururu, Karatina, Naromoru, Nanyuki, Meru, Nkubu, Chuka, Isiolo, and Marsabit";

/**
 * Stakeholder SEO page — canonical institutional product surface remains /institutional.
 */
export default function ForInstitutions() {
  useScrollToTop();
  usePageMeta({
    title: "Hospital Emergency Response System Kenya — Paediatric Readiness | Paeds Resus",
    description:
      "Hospital-wide Emergency Readiness System (ERS) with paediatric priority. Nurse-led 24/7 ERT, ResusGPS, Care Signal, training mesh, and readiness audits for hospitals in Nyeri, Embu, Murang'a, Meru, and central Kenya.",
    path: "/for-institutions",
  });

  return (
    <>
      <JsonLdScript data={buildJsonLdGraph([buildOrganizationJsonLd()])} />
      <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/50">
        <header className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-sm font-medium text-brand-teal mb-2">Hospitals & county referral facilities</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Hospital Emergency Readiness System — paediatric priority
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            When one nurse covers paediatrics, adult wards, and maternity, preventable child deaths still happen. Paeds
            Resus helps hospitals build a <strong className="font-semibold text-foreground">hospital-wide Emergency
            Response System (ERS)</strong> — nurse-led ERT, 24/7 cross-unit coverage, ResusGPS bedside guidance, Care
            Signal QI, training mesh from Paeds Resus Limited, and equipment readiness audits. Readiness systems, not
            seat bundles.
          </p>
        </header>

        <div className="max-w-4xl mx-auto px-4 pb-12 space-y-6 text-muted-foreground leading-relaxed">
          <p>
            The institutional portal supports ERT roster management, staff onboarding, training schedules, Care Signal
            facility review, and dashboard metrics — activations, time to response, training coverage, and open equipment
            fixes. Early pilot signal: improved ROSC at Mathari with nurse-only ERT. We do not claim mortality
            reduction until governed evaluation completes.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Service region:</strong> central and upper Eastern Kenya
            — {SERVICE_REGION_TOWNS}.
          </p>
          <p>
            Start with a readiness conversation or request hospital onboarding through the institutional page. Register
            your facility to access the hospital admin dashboard after MOU or phased rollout.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/institutional">
              <Button variant="cta" className="gap-2">
                Contact / institutional portal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/institutional-onboarding">
              <Button variant="outline">Request onboarding</Button>
            </Link>
            <Link href="/hospital-admin-dashboard">
              <Button variant="outline">Hospital admin</Button>
            </Link>
            <Link href="/training">
              <Button variant="outline">Staff training mesh</Button>
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
