import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { getLoginUrl } from "@/const";
import { buildJsonLdGraph, buildOrganizationJsonLd } from "@/lib/seo-schema";
import { BookOpen, ArrowRight } from "lucide-react";
import { AHA_COURSE_ORDER } from "@/const/aha-course-metadata";
import { AhaHubCourseCard } from "@/components/AhaHubCourseCard";
import type { AhaProgramType } from "@/lib/providerCourseRoutes";

function trainingDetailsPath(programType: AhaProgramType): string {
  return programType === "heartsaver" ? "/training/bls" : `/training/${programType}`;
}

export default function AHACoursesPublic() {
  useScrollToTop();
  usePageMeta({
    title: "AHA-Aligned Courses — BLS, ACLS, PALS, NRP, Heartsaver | Paeds Resus",
    description:
      "Browse AHA-aligned BLS, ACLS, PALS, NRP, and Heartsaver courses from Paeds Resus Limited. Blended cognitive modules plus hands-on skills for healthcare providers in Kenya.",
    path: "/aha-courses",
  });

  return (
    <>
      <JsonLdScript data={buildJsonLdGraph([buildOrganizationJsonLd()])} />
      <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/50">
        <header className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-brand-teal" />
            <p className="text-sm font-medium text-brand-teal">Paeds Resus Limited</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">AHA-aligned certification courses</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Complete cognitive modules online, receive a gatepass certificate, then attend a hands-on session
            for practical sign-off. Sign in to track enrollment progress and book sessions.
          </p>
        </header>

        <div className="max-w-4xl mx-auto px-4 pb-12 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {AHA_COURSE_ORDER.map((programType) => (
              <AhaHubCourseCard
                key={programType}
                programType={programType}
                footer={
                  <div className="flex flex-wrap gap-2">
                    <Link href={trainingDetailsPath(programType)}>
                      <Button variant="outline" size="sm">
                        Course details
                      </Button>
                    </Link>
                    <a href={getLoginUrl(`/enroll?courseId=${programType}`)}>
                      <Button size="sm" className="gap-1">
                        Enroll
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </a>
                  </div>
                }
              />
            ))}
          </div>

          <Card className="border-muted">
            <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold">Already enrolled?</p>
                <p className="text-sm text-muted-foreground">Sign in to continue modules and book practical sessions.</p>
              </div>
              <a href={getLoginUrl("/aha-courses")}>
                <Button variant="cta">Sign in to AHA hub</Button>
              </a>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Content is AHA-aligned. Full certification requires cognitive completion and instructor practical
            sign-off. Fellowship micro-courses are managed separately in the Fellowship section.
          </p>
        </div>

        <Footer />
      </div>
    </>
  );
}
