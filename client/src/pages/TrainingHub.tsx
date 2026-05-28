import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { getLoginUrl } from "@/const";
import { TRAINING_LANDING_CONFIGS, getTrainingPrice } from "@/lib/training-landing-content";
import { formatPrice } from "@/const/pricing";
import { formatAhaDurationLabel } from "@/const/aha-course-metadata";
import { buildJsonLdGraph, buildOrganizationJsonLd } from "@/lib/seo-schema";
import { ArrowRight, GraduationCap, Clock } from "lucide-react";

const MICRO_COURSE_NOTE =
  "Condition-focused micro-courses (e.g. Septic Shock, Seriously Ill Child) complement AHA certification and support the Paeds Resus Fellowship Pillar A — browse the full catalog after signing in.";

export default function TrainingHub() {
  useScrollToTop();
  usePageMeta({
    title: "Paediatric & AHA-Aligned Training Kenya | Paeds Resus",
    description:
      "Browse BLS, ACLS, PALS, NRP, Heartsaver, and micro-courses from Paeds Resus Limited — AHA-aligned training for healthcare providers in Kenya and East Africa.",
    path: "/training",
  });

  return (
    <>
      <JsonLdScript data={buildJsonLdGraph([buildOrganizationJsonLd()])} />
      <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/50">
        <header className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="h-8 w-8 text-brand-teal" />
            <p className="text-sm font-medium text-brand-teal">Paeds Resus Limited</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Training & certification for paediatric emergency care
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Healthcare providers across Kenya and the East African Community use Paeds Resus for AHA-aligned
            BLS, ACLS, PALS, and Heartsaver — plus fellowship micro-courses aligned with bedside practice.
            Each course has a dedicated page so teams can find the right enrollment path from search engines
            and referrals.
          </p>
        </header>

        <div className="max-w-4xl mx-auto px-4 pb-12 space-y-8">
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.values(TRAINING_LANDING_CONFIGS).map((course) => {
              const price = getTrainingPrice(course.slug);
              return (
              <Card key={course.slug} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{course.courseCode}</CardTitle>
                  <CardDescription>
                    {course.subtitle.slice(0, 100)}…
                    <span className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {formatAhaDurationLabel(course.slug)}
                    </span>
                    {price != null && price > 0 && (
                      <span className="block mt-2 font-medium text-foreground">
                        From {formatPrice(price)}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={course.path}>
                    <Button variant="outline" className="w-full gap-2">
                      View {course.courseCode} details
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Heartsaver CPR AED</CardTitle>
              <CardDescription>
                For lay rescuers and non-clinical staff
                <span className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {formatAhaDurationLabel("heartsaver")}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Heartsaver covers adult, child, and infant CPR plus AED use. Available through the AHA courses
                hub after sign-in — ideal for hospital support staff, schools, and community responders.
              </p>
              <Link href="/aha-courses">
                <Button variant="outline" size="sm">
                  AHA courses hub
                </Button>
              </Link>
            </CardContent>
          </Card>

          <section>
            <h2 className="text-xl font-bold mb-3">Micro-courses & fellowship learning</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">{MICRO_COURSE_NOTE}</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/micro-courses">
                <Button variant="outline">Browse micro-courses</Button>
              </Link>
              <Link href="/for-providers">
                <Button variant="outline">Fellowship overview</Button>
              </Link>
            </div>
          </section>

          <section className="rounded-xl border bg-muted/30 p-6">
            <h2 className="text-lg font-bold mb-2">How enrollment works</h2>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
              <li>Create a free provider account or sign in.</li>
              <li>Choose your course and complete payment where required.</li>
              <li>Finish cognitive modules online and receive a gatepass certificate.</li>
              <li>Attend a hands-on session for practical sign-off and full certification.</li>
            </ol>
            <div className="flex flex-wrap gap-2 mt-4">
              <a href={getLoginUrl("/enroll")}>
                <Button variant="cta">Enroll now</Button>
              </a>
              <Link href="/register">
                <Button variant="outline">Register</Button>
              </Link>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </>
  );
}
