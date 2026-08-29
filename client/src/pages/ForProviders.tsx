import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  HeartPulse,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { getLoginUrl } from "@/const";
import AcronymGlossary from "@/components/AcronymGlossary";
import {
  ACLS_COHORT_PRICE,
  ACLS_PRICE,
  BLS_COHORT_PRICE,
  BLS_PRICE,
  formatCohortLine,
  formatIerpValueLine,
  formatNerpValueLine,
} from "@/const/marketingCopy";
import { buildJsonLdGraph, buildOrganizationJsonLd } from "@/lib/seo-schema";

const INDIVIDUAL_PRODUCTS = [
  {
    title: "AHA BLS",
    eyebrow: "Foundation",
    body: "Build dependable CPR, AED, team-response, and paediatric basic-life-support skills.",
    tagline:
      "Be ready for the next interview, the next posting, the next shift that needs proof you can handle it.",
    supporting:
      "AHA-aligned certification that opens doors, not just a line on a CV.",
    price: formatCohortLine(BLS_PRICE, BLS_COHORT_PRICE),
    href: "/training/bls",
  },
  {
    title: "AHA ACLS",
    eyebrow: "Advanced response",
    body: "Strengthen advanced cardiovascular emergency response, team leadership, and algorithm-based decision-making.",
    tagline:
      "Be ready for the next interview, the next posting, the next shift that needs proof you can handle it.",
    supporting:
      "AHA-aligned certification that opens doors, not just a line on a CV.",
    price: formatCohortLine(ACLS_PRICE, ACLS_COHORT_PRICE),
    href: "/training/acls",
  },
  {
    title: "NERP",
    eyebrow: "For nurses",
    body: "A structured Nurses Emergency Readiness Program with learning, simulations, evidence, and practical progression.",
    tagline: "Don't just shout for help — be the help.",
    supporting:
      'A structured path from "call the doctor" to "I\'ve got this," six payments, KES 2,500 each.',
    price: formatNerpValueLine(),
    href: "/programs/nerp-acls",
  },
  {
    title: "IERP",
    eyebrow: "For interns",
    body: "A profile-first Interns Emergency Readiness Program with named roles, simulations, and evidence gates.",
    tagline: "Be ready when that call comes.",
    supporting:
      "Named roles, real simulations, and evidence gates — so the page doesn't catch you off guard.",
    price: formatIerpValueLine(),
    href: "/programs/ierp",
  },
  {
    title: "Paeds Resus Fellowship",
    eyebrow: "Deep paediatric learning",
    body: "Focused micro-courses that build paediatric emergency breadth and pattern recognition over time.",
    tagline: 'Go from "I got through it" to "I know exactly what to do."',
    supporting:
      "Deep paediatric pattern recognition, for the provider who wants to be the one others call.",
    price: "Explore the catalogue",
    href: "/fellowship",
  },
];

export default function ForProviders() {
  useScrollToTop();
  usePageMeta({
    title:
      "Paediatric Emergency Training for Healthcare Providers | Paeds Resus",
    description:
      "Individual paediatric emergency pathways for healthcare providers in Kenya and East Africa: AHA BLS, AHA ACLS, NERP, IERP, and the Paeds Resus Fellowship.",
    path: "/for-providers",
  });

  return (
    <>
      <JsonLdScript data={buildJsonLdGraph([buildOrganizationJsonLd()])} />
      <div className="min-h-screen bg-background">
        <section className="bg-[#082f2f] text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              Individual provider pathways
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Build the emergency capability your role demands.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-teal-50 md:text-xl">
              Choose an individual course or cadre-specific pathway. Paeds Resus
              keeps AHA training, NERP, IERP, and Fellowship learning distinct
              so you can see exactly what you are joining and what it is
              designed to do.
            </p>
            <AcronymGlossary />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/training">
                <Button variant="cta" size="lg">
                  Browse training <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href={getLoginUrl("/resus")}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  Sign in to ResusGPS
                </Button>
              </a>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-6xl space-y-16 px-4 py-14 md:py-20">
          <section aria-labelledby="pathways-heading">
            <div className="mb-8 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                Individual products
              </p>
              <h2
                id="pathways-heading"
                className="mt-2 text-3xl font-bold md:text-4xl"
              >
                Start with the pathway that fits your work.
              </h2>
              <p className="mt-3 text-muted-foreground">
                These products are for individual providers. Cohorts may be
                organised, but the learner pathway and account remain
                individual.
              </p>
            </div>
            <div
              className="mb-6 flex flex-wrap gap-3"
              aria-label="Choose your provider pathway"
            >
              <a href="#nerp">
                <Button variant="outline">
                  I&apos;m a nurse needing certification
                </Button>
              </a>
              <a href="#ierp">
                <Button variant="outline">I&apos;m a medical intern</Button>
              </a>
              <a href="#courses">
                <Button variant="outline">I know which course I need</Button>
              </a>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {INDIVIDUAL_PRODUCTS.map(product => (
                <Card
                  key={product.title}
                  id={
                    product.title === "NERP"
                      ? "nerp"
                      : product.title === "IERP"
                        ? "ierp"
                        : product.title === "AHA BLS"
                          ? "courses"
                          : undefined
                  }
                  className="flex flex-col border-border/80"
                >
                  <CardHeader>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      {product.eyebrow}
                    </p>
                    <CardTitle className="mt-2 text-xl">
                      {product.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
                    <p className="text-base font-semibold leading-relaxed text-foreground">
                      {product.tagline}
                    </p>
                    <p className="leading-relaxed">{product.supporting}</p>
                    <p className="leading-relaxed">{product.body}</p>
                    <p className="mt-auto rounded-lg bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground">
                      {product.price}
                    </p>
                    <Link href={product.href}>
                      <Button variant="outline" className="w-full">
                        Explore {product.title}{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section
            className="grid gap-5 md:grid-cols-3"
            aria-labelledby="support-heading"
          >
            <div className="md:col-span-3">
              <h2 id="support-heading" className="text-2xl font-bold">
                One platform, distinct jobs.
              </h2>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HeartPulse className="h-5 w-5 text-primary" />
                  ResusGPS
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                ResusGPS is the bedside-guidance product within IERS. When your
                institution uses IERS, it supports structured paediatric
                assessment, CPR timing, calculations, and reassessment prompts.
                It does not replace local protocols or clinical judgement.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Care Signal
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                Care Signal is the improvement layer within IERS. It supports
                honest reporting and review of incidents, near-misses, and
                system actions. It is not a parent service or a substitute for a
                formal clinical record.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Fellowship depth
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                The Paeds Resus Fellowship is a unified micro-course pathway.
                AHA BLS, ACLS, and other AHA tracks remain separate parallel
                offerings, not hidden Fellowship requirements.
              </CardContent>
            </Card>
          </section>

          <section
            className="rounded-3xl border border-primary/15 bg-primary/5 p-6 md:p-10"
            aria-labelledby="next-heading"
          >
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 id="next-heading" className="text-2xl font-bold">
                  Ready to choose your next step?
                </h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Create a free provider account, browse the catalogue, and
                  enter the pathway that matches your role and scope.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/register">
                  <Button variant="cta">Create provider account</Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline">About Paeds Resus</Button>
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
