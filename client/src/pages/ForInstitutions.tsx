import { Link } from "wouter";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { buildJsonLdGraph, buildOrganizationJsonLd } from "@/lib/seo-schema";
import WhatsAppButton from "@/components/WhatsAppButton";
import AcronymGlossary from "@/components/AcronymGlossary";
import InstitutionalReadinessForm from "@/components/InstitutionalReadinessForm";
import InstitutionalProofSection from "@/components/InstitutionalProofSection";
import {
  ICPD_ANNUAL_PRICE,
  IERS_ANNUAL_PRICE,
  INSTITUTIONAL_GEOGRAPHY_COPY,
  formatKes,
} from "@/const/marketingCopy";

const INSTITUTIONAL_PRODUCTS = [
  {
    title: "ILSP",
    label: "Institutional Life Support Program",
    body: "A managed institution-paid cohort pathway for life-support learning, delivery, practical assessment, and completion evidence.",
    price: "Quoted by cohort and scope",
    icon: Users,
  },
  {
    title: "IERS",
    label: "Institutional Emergency Readiness System",
    body: "A hospital-wide operating layer for response roles, activation, readiness evidence, equipment gaps, drills, corrective actions, ResusGPS, and Care Signal.",
    price: `${formatKes(IERS_ANNUAL_PRICE)} per year`,
    icon: HeartPulse,
  },
  {
    title: "ICPD",
    label: "Institutional Continuous Professional Development",
    body: "A managed institutional service for professional-development sessions, verified attendance, targets, certificates, and leadership reporting.",
    price: `${formatKes(ICPD_ANNUAL_PRICE)} per year`,
    icon: BarChart3,
  },
];

export default function ForInstitutions() {
  useScrollToTop();
  usePageMeta({
    title: "Hospital Emergency Readiness, ILSP and ICPD Kenya | Paeds Resus",
    description:
      "Institutional products for hospitals and health facilities in Kenya: ILSP life-support cohorts, IERS emergency readiness with ResusGPS and Care Signal, and ICPD professional-development reporting.",
    path: "/for-institutions",
  });

  return (
    <>
      <JsonLdScript data={buildJsonLdGraph([buildOrganizationJsonLd()])} />
      <div className="min-h-screen bg-background">
        <section className="bg-[#082f2f] text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              Institutional products
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Build a facility where readiness, learning, and improvement are
              visible.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-teal-50 md:text-xl">
              Paeds Resus helps hospitals move beyond disconnected training
              seats. Choose the institutional product that matches your
              operational need: ILSP for life-support cohorts, IERS for
              emergency readiness, and ICPD for continuous professional
              development.
            </p>
            <AcronymGlossary />
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#products">
                <Button variant="cta" size="lg">
                  Explore institutional products{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/institutional">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  Request a quote
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-6xl space-y-16 px-4 py-14 md:py-20">
          <section id="products" aria-labelledby="products-heading">
            <div className="mb-8 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                One institutional portfolio
              </p>
              <h2
                id="products-heading"
                className="mt-2 text-3xl font-bold md:text-4xl"
              >
                Three products. Three clear jobs.
              </h2>
              <p className="mt-3 text-muted-foreground">
                These products can work together, but they should remain
                separate in scope, pricing, evidence, and reporting.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {INSTITUTIONAL_PRODUCTS.map(
                ({ title, label, body, price, icon: Icon }) => (
                  <Card key={title} className="flex flex-col border-border/80">
                    <CardHeader>
                      <Icon className="h-6 w-6 text-primary" />
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        {title}
                      </p>
                      <CardTitle className="mt-1 text-xl">{label}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-5 text-sm text-muted-foreground">
                      <p className="leading-relaxed">{body}</p>
                      <p className="mt-auto rounded-lg bg-muted/60 px-3 py-2 font-semibold text-foreground">
                        {price}
                      </p>
                      <Link
                        href={
                          title === "IERS"
                            ? "/institutional"
                            : "/institutional#quote"
                        }
                      >
                        <Button variant="outline" className="w-full">
                          Discuss {title}{" "}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </section>

          <InstitutionalProofSection />

          <section aria-labelledby="conversation-heading">
            <div className="mb-5 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                Start with the problem
              </p>
              <h2 id="conversation-heading" className="mt-2 text-3xl font-bold">
                Choose the right institutional conversation before choosing a
                product.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Share a small amount of context and we will help scope ILSP,
                IERS, or ICPD. This is a conversation request, not a course
                enrolment or payment.
              </p>
            </div>
            <InstitutionalReadinessForm />
          </section>

          <section
            aria-labelledby="iers-heading"
            className="grid gap-8 rounded-3xl bg-[#082f2f] p-6 text-white md:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-200">
                IERS at the centre
              </p>
              <h2 id="iers-heading" className="mt-3 text-3xl font-bold">
                A working emergency-readiness system, not a certificate
                catalogue.
              </h2>
              <p className="mt-4 leading-relaxed text-teal-50">
                IERS connects the institution’s response model to the teams and
                evidence that make it real.
              </p>
              <Link href="/institutional">
                <Button className="mt-6 bg-[#ff7043] text-white hover:bg-[#e65d34]">
                  Explore IERS <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <HeartPulse className="h-5 w-5 text-orange-200" />
                <h3 className="mt-3 font-semibold">ResusGPS</h3>
                <p className="mt-2 text-sm text-teal-50">
                  The IERS bedside-guidance product for structured paediatric
                  assessment, calculations, CPR timing, and reassessment
                  prompts.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <ClipboardCheck className="h-5 w-5 text-orange-200" />
                <h3 className="mt-3 font-semibold">Care Signal</h3>
                <p className="mt-2 text-sm text-teal-50">
                  The IERS improvement layer for honest near-miss reporting,
                  review, and corrective action.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 sm:col-span-2">
                <CheckCircle2 className="h-5 w-5 text-orange-200" />
                <h3 className="mt-3 font-semibold">Evidence and review</h3>
                <p className="mt-2 text-sm text-teal-50">
                  Track activation, response, training coverage, equipment
                  fixes, drills, and open actions without unsupported outcome
                  claims.
                </p>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="icpd-heading"
            className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                ICPD
              </p>
              <h2 id="icpd-heading" className="mt-2 text-3xl font-bold">
                Institutional Continuous Professional Development.
              </h2>
              <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                ICPD gives education, HR, nursing, medical, and quality teams
                one accountable record of professional-development activity:
                sessions, verified attendance, targets, certificates, and
                leadership reports. It measures learning activity; it does not
                prove emergency readiness.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
              <p className="text-sm text-muted-foreground">
                Annual institutional plan
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {formatKes(ICPD_ANNUAL_PRICE)}
              </p>
              <Link href="/institutional#quote">
                <Button className="mt-4">Start ICPD conversation</Button>
              </Link>
            </div>
          </section>

          <section aria-labelledby="process-heading">
            <h2 id="process-heading" className="text-2xl font-bold">
              How institutional implementation works
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              {[
                "Readiness conversation",
                "Scope and baseline",
                "Phased implementation",
                "Review and improve",
              ].map((step, index) => (
                <div key={step} className="rounded-2xl border bg-card p-5">
                  <p className="text-sm font-semibold text-primary">
                    0{index + 1}
                  </p>
                  <h3 className="mt-2 font-semibold">{step}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {
                      [
                        "Map your staffing reality, emergency priorities, and institutional goal.",
                        "Choose ILSP, IERS, ICPD, or a defined combination with clear acceptance evidence.",
                        "Activate people, workflows, schedules, learning, and reporting in manageable phases.",
                        "Review process measures, close actions, and define the next phase with your team.",
                      ][index]
                    }
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-primary/15 bg-primary/5 p-6 md:flex md:items-center md:justify-between md:gap-6">
            <div>
              <h2 className="text-2xl font-bold">
                Built and proven in central Kenya. Built to scale across Kenya
                and the EAC.
              </h2>
              <p className="mt-2 text-muted-foreground">
                {INSTITUTIONAL_GEOGRAPHY_COPY}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
              <WhatsAppButton
                phoneNumber="254706781260"
                message="Hello Paeds Resus, I would like to discuss ILSP, IERS, or ICPD for our institution."
                label="WhatsApp Paeds Resus"
                className="bg-green-600 text-white hover:bg-green-700"
              />
              <Link href="/institutional">
                <Button variant="outline">Request onboarding</Button>
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
