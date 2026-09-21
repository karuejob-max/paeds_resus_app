import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  HeartPulse,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { buildJsonLdGraph, buildOrganizationJsonLd } from "@/lib/seo-schema";

const INDIVIDUAL_PRODUCTS = [
  {
    title: "AHA BLS",
    body: "A practical basic life-support pathway for healthcare providers.",
    href: "/training/bls",
  },
  {
    title: "AHA ACLS",
    body: "Advanced cardiovascular emergency response and team leadership.",
    href: "/training/acls",
  },
  {
    title: "NERP",
    body: "Nurses Emergency Readiness Program for structured nurse-specific progression.",
    href: "/programs/nerp-acls",
  },
  {
    title: "IERP",
    body: "Interns Emergency Readiness Program for profile-first emergency learning and simulation.",
    href: "/programs/ierp",
  },
  {
    title: "Paeds Resus Fellowship",
    body: "A unified pathway of focused paediatric emergency micro-courses.",
    href: "/fellowship",
  },
];

export default function About() {
  useScrollToTop();
  usePageMeta({
    title:
      "About Paeds Resus — Emergency Care Training and Readiness in Kenya",
    description:
      "Paeds Resus builds emergency-care capability through individual training, institutional readiness, IERS with ResusGPS and Care Signal, and ICPD professional-development records in Kenya.",
    path: "/about",
  });

  return (
    <>
      <JsonLdScript data={buildJsonLdGraph([buildOrganizationJsonLd()])} />
      <div className="min-h-screen bg-background text-foreground">
        <section className="relative overflow-hidden bg-[#082f2f] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,122,69,0.22),transparent_35%),radial-gradient(circle_at_10%_90%,rgba(74,222,208,0.16),transparent_30%)]" />
          <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              About Paeds Resus
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Building the people and systems that make emergency care more reliable.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-teal-50 md:text-xl">
              Paeds Resus is an emergency-care organisation and platform for healthcare
              providers and institutions in Kenya, built on paediatric
              resuscitation science and extended to every patient population. We connect practical training,
              institutional readiness, bedside guidance, quality improvement,
              and professional development without collapsing them into one
              unclear product.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/for-providers">
                <Button variant="cta" size="lg">
                  For individual providers{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/for-institutions">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  For institutions
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  Create a free account
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-6xl space-y-16 px-4 py-14 md:py-20">
          <section
            className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start"
            aria-labelledby="mission-heading"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                Why we exist
              </p>
              <h2
                id="mission-heading"
                className="mt-3 text-3xl font-bold md:text-4xl"
              >
                Close the gap between knowing and doing.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Preventable harm often persists because the right action is not
                delivered at the right time, in the right sequence, with the
                right team support. Paeds Resus focuses on the practical
                conditions that make emergency care more dependable: trained
                people, clear systems, usable bedside reference, honest learning
                signals, and leadership visibility.
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                We do not promise that software or a certificate replaces
                clinical judgement. We build structured pathways that help
                providers and institutions see what is being learned, what is
                ready, what is missing, and what should happen next.
              </p>
            </div>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-primary" />
                  One organisation. Clear product boundaries.
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  <strong className="text-foreground">
                    Individual products
                  </strong>{" "}
                  build provider capability through AHA BLS, AHA ACLS, NERP,
                  IERP, and the Paeds Resus Fellowship.
                </p>
                <p>
                  <strong className="text-foreground">
                    Institutional products
                  </strong>{" "}
                  build facility capability through ILSP, IERS, and ICPD.
                </p>
                <p>
                  <strong className="text-foreground">
                    IERS includes ResusGPS and Care Signal
                  </strong>{" "}
                  as its bedside-guidance and improvement layers.
                </p>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="individual-heading">
            <div className="mb-6 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                For individual providers
              </p>
              <h2 id="individual-heading" className="mt-2 text-3xl font-bold">
                Choose the pathway that fits your role.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Training and readiness programmes are separate from the
                institutional operating products. Start with the course or cadre
                pathway you need.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {INDIVIDUAL_PRODUCTS.map(product => (
                <Card
                  key={product.title}
                  className="transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{product.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex h-full flex-col justify-between gap-4 text-sm text-muted-foreground">
                    <p>{product.body}</p>
                    <Link href={product.href}>
                      <Button variant="outline" size="sm">
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
            aria-labelledby="institutional-heading"
            className="rounded-3xl bg-[#082f2f] p-6 text-white md:p-10"
          >
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-200">
                  For institutions
                </p>
                <h2
                  id="institutional-heading"
                  className="mt-3 text-3xl font-bold"
                >
                  Make readiness, learning, and improvement visible.
                </h2>
                <p className="mt-4 leading-relaxed text-teal-50">
                  Institutional products are connected, but they are not
                  interchangeable. Choose the layer that matches the operational
                  problem.
                </p>
                <Link href="/for-institutions">
                  <Button className="mt-6 bg-[#ff7043] text-white hover:bg-[#e65d34]">
                    Explore institutional products{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <Building2 className="h-5 w-5 text-orange-200" />
                  <h3 className="mt-3 font-semibold">ILSP</h3>
                  <p className="mt-2 text-sm text-teal-50">
                    Institution-paid life-support cohorts with accountable
                    delivery and assessment.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <ShieldCheck className="h-5 w-5 text-orange-200" />
                  <h3 className="mt-3 font-semibold">IERS</h3>
                  <p className="mt-2 text-sm text-teal-50">
                    Emergency-readiness operations, including ResusGPS and Care
                    Signal.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <Users className="h-5 w-5 text-orange-200" />
                  <h3 className="mt-3 font-semibold">ICPD</h3>
                  <p className="mt-2 text-sm text-teal-50">
                    Institutional Continuous Professional Development records
                    and reports.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="trust-heading"
            className="grid gap-4 md:grid-cols-3"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Evidence before claims
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                We publish measurable process language and keep outcome claims
                within the evidence available.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Learning with boundaries
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                Training, ICPD activity, IERS readiness, and bedside guidance
                each have a defined purpose.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Built for real teams
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                Our language reflects busy departments, limited staffing, shared
                responsibility, and low-resource realities.
              </CardContent>
            </Card>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
