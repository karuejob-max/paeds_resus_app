import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Award,
  Building2,
  GraduationCap,
  Heart,
  ShieldCheck,
  Siren,
  Stethoscope,
} from "lucide-react";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { getLoginUrl } from "@/const";
import { buildJsonLdGraph, buildOrganizationJsonLd, buildWebsiteJsonLd } from "@/lib/seo-schema";

const TRAINING_LINKS = [
  { href: "/training/bls", label: "BLS" },
  { href: "/training/acls", label: "ACLS" },
  { href: "/training/pals", label: "PALS" },
  { href: "/training/nrp", label: "NRP" },
  { href: "/training", label: "All training" },
];

export default function PublicHome() {
  useScrollToTop();
  usePageMeta({
    title: "Paeds Resus — Preventable child death ends here | Kenya & EAC",
    description:
      "Paeds Resus: integrated paediatric emergency platform for Kenya and East Africa. AHA-aligned training, ResusGPS bedside guidance, Care Signal QI, Safe-Truth for families, and hospital readiness systems.",
    path: "/",
  });

  const jsonLd = buildJsonLdGraph([buildOrganizationJsonLd(), buildWebsiteJsonLd()]);

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/60">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-teal via-[#143333] to-brand-teal text-white">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
            <p className="text-sm font-medium text-brand-orange mb-3 tracking-wide uppercase">
              Kenya · East African Community · LMIC-focused
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-3xl">
              No child should die from a preventable emergency
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8 leading-relaxed">
              Paeds Resus is one integrated platform — bedside guidance, AHA-aligned training, quality
              improvement, family safety, and hospital readiness — so every stakeholder knows where to start.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button variant="cta" size="lg" className="gap-2">
                  Create free account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href={getLoginUrl()}>
                <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  Sign in
                </Button>
              </a>
              <Link href="/training">
                <Button variant="ghost" size="lg" className="text-white hover:bg-white/10">
                  Browse training
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 space-y-16">
          {/* Healthcare providers */}
          <section id="providers" aria-labelledby="providers-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-brand-teal/10 p-3 text-brand-teal">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <h2 id="providers-heading" className="text-2xl md:text-3xl font-bold">
                  Healthcare providers
                </h2>
                <p className="text-muted-foreground">ResusGPS · Care Signal · Fellowship</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ResusGPS</CardTitle>
                  <CardDescription>Bedside paediatric emergency guidance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Structured ABCDE flows, CPR Clock, weight-based drug calculators, and protocols for
                    time-critical decisions. ResusGPS is one product on Paeds Resus — not the whole platform.
                  </p>
                  <a href={getLoginUrl("/resus")}>
                    <Button className="w-full gap-2">
                      Sign in to open ResusGPS
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Care Signal</CardTitle>
                  <CardDescription>Monthly QI incident & near-miss reporting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Provider-facing quality improvement — distinct from Parent Safe-Truth. Contributes to
                    Fellowship Pillar C when you maintain qualifying monthly reports.
                  </p>
                  <a href={getLoginUrl("/care-signal")}>
                    <Button variant="outline" className="w-full">
                      Sign in for Care Signal
                    </Button>
                  </a>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Paeds Resus Fellowship</CardTitle>
                  <CardDescription>Three pillars · one earned title</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Micro-courses, ResusGPS attributable cases, and Care Signal discipline — automated
                    progress tracking. BLS/ACLS/PALS are optional parallel tracks, not fellowship requirements.
                  </p>
                  <Link href="/for-providers">
                    <Button variant="outline" className="w-full">
                      Learn about the pathway
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Training */}
          <section id="training" aria-labelledby="training-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-brand-teal/10 p-3 text-brand-teal">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h2 id="training-heading" className="text-2xl md:text-3xl font-bold">
                  Training & AHA-aligned courses
                </h2>
                <p className="text-muted-foreground">Delivered by Paeds Resus Limited</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 max-w-3xl">
              BLS, ACLS, PALS, Heartsaver, NRP coordination, and condition-focused micro-courses — blended
              cognitive modules plus hands-on skills sessions. Search-friendly landing pages explain each
              course for teams across Kenya and the East African Community.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {TRAINING_LINKS.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" size="sm">
                    {link.label}
                  </Button>
                </Link>
              ))}
              <Link href="/micro-courses">
                <Button variant="outline" size="sm">
                  Micro-courses
                </Button>
              </Link>
              <Link href="/aha-courses">
                <Button variant="outline" size="sm">
                  AHA hub
                </Button>
              </Link>
            </div>
            <Card className="border-brand-teal/20 bg-brand-teal/5">
              <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold">Ready to enroll?</p>
                  <p className="text-sm text-muted-foreground">
                    Create a provider account, choose your course, and complete cognitive modules at your pace.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={getLoginUrl("/enroll")}>
                    <Button variant="cta">Enroll now</Button>
                  </a>
                  <Link href="/register">
                    <Button variant="outline">Register</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Parents */}
          <section id="parents" aria-labelledby="parents-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-brand-teal/10 p-3 text-brand-teal">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <h2 id="parents-heading" className="text-2xl md:text-3xl font-bold">
                  Parents & caregivers
                </h2>
                <p className="text-muted-foreground">Parent Safe-Truth</p>
              </div>
            </div>
            <Card>
              <CardContent className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <p className="text-muted-foreground max-w-2xl">
                  Trustworthy, appropriately scoped family resources — separate tone and audience from
                  ResusGPS and Care Signal. Help your community recognise danger signs and seek care early.
                </p>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link href="/parent-safe-truth">
                    <Button variant="cta" className="gap-2">
                      Explore Safe-Truth
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/for-parents">
                    <Button variant="outline">Overview</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Institutions */}
          <section id="institutions" aria-labelledby="institutions-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-brand-teal/10 p-3 text-brand-teal">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 id="institutions-heading" className="text-2xl md:text-3xl font-bold">
                  Hospitals & institutions
                </h2>
                <p className="text-muted-foreground">Readiness systems · staff training · ERT visibility</p>
              </div>
            </div>
            <Card>
              <CardContent className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <p className="text-muted-foreground max-w-2xl">
                  Deploy ResusGPS, coordinate AHA-aligned cohorts, review Care Signal at facility level, and
                  manage emergency response teams — mission-aligned readiness, not seat bundles alone.
                </p>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link href="/institutional">
                    <Button variant="cta" className="gap-2">
                      Institutional portal
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/for-institutions">
                    <Button variant="outline">Learn more</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline">Register institution</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Trust signals */}
          <section id="trust" aria-labelledby="trust-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-brand-teal/10 p-3 text-brand-teal">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 id="trust-heading" className="text-2xl md:text-3xl font-bold">
                  Trust & verification
                </h2>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-brand-teal" />
                    Certificate verify
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Employers and institutions can verify Paeds Resus and AHA-aligned certificates publicly.
                  </p>
                  <Link href="/verify">
                    <Button variant="outline" size="sm">
                      Verify a certificate
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Paeds Resus Limited</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Legal entity and AHA-aligned training provider for BLS, ACLS, PALS, and instructor
                    programmes. Invoices and training correspondence use Paeds Resus Limited.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Siren className="h-4 w-4 text-brand-teal" />
                    Clinical scope
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    We support — not replace — professional judgment and local protocols. Read our intended
                    use statement before bedside use.
                  </p>
                  <Link href="/legal/clinical-use">
                    <Button variant="outline" size="sm">
                      Intended use
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* EAC note */}
          <section className="rounded-xl border border-border bg-muted/30 p-6 md:p-8">
            <h2 className="text-xl font-bold mb-2">Kenya today · East Africa next</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">
              Paeds Resus is headquartered in Kenya and built for resource-limited settings across the East
              African Community. Training cohorts, institutional pilots, and localized discovery pages will
              expand as we partner with ministries of health and referral hospitals — without compromising
              data integrity or brand clarity.
            </p>
          </section>
        </div>

        <Footer />
      </div>
    </>
  );
}
