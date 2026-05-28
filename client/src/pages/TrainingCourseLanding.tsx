import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { getLoginUrl } from "@/const";
import { formatPrice } from "@/const/pricing";
import {
  TRAINING_LANDING_CONFIGS,
  getTrainingPrice,
  type TrainingLandingConfig,
} from "@/lib/training-landing-content";
import {
  buildCourseJsonLd,
  buildJsonLdGraph,
  buildOrganizationJsonLd,
} from "@/lib/seo-schema";
import { ArrowRight } from "lucide-react";

type Props = {
  slug: TrainingLandingConfig["slug"];
};

export default function TrainingCourseLanding({ slug }: Props) {
  const config = TRAINING_LANDING_CONFIGS[slug];
  const price = getTrainingPrice(slug);

  useScrollToTop();
  usePageMeta({
    title: config.title,
    description: config.metaDescription,
    path: config.path,
  });

  const jsonLd = buildJsonLdGraph([
    buildOrganizationJsonLd(),
    buildCourseJsonLd({
      name: config.h1,
      description: config.metaDescription,
      path: config.path,
      courseCode: config.courseCode,
      duration: config.duration,
      priceKes: price,
    }),
  ]);

  const enrollPath = getLoginUrl(`/enroll?courseId=${slug}`);

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <article className="min-h-screen bg-gradient-to-b from-background to-brand-surface/50">
        <header className="bg-gradient-to-r from-brand-teal to-[#143333] text-white py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-brand-orange font-medium mb-2">Paeds Resus Limited · AHA-aligned</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{config.h1}</h1>
            <p className="text-lg text-white/90">{config.subtitle}</p>
            {price != null && price > 0 && (
              <p className="mt-4 text-white/80 text-sm">
                Individual enrollment from <strong className="text-white">{formatPrice(price)}</strong> — institutional
                cohort pricing available.
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-6">
              <a href={enrollPath}>
                <Button variant="cta" size="lg" className="gap-2">
                  Enroll / sign in
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/register">
                <Button variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10">
                  Create account
                </Button>
              </Link>
              <Link href="/training">
                <Button variant="ghost" size="lg" className="text-white hover:bg-white/10">
                  All courses
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
          {config.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-muted-foreground leading-relaxed mb-3">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-xl font-bold mb-4">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {config.faqs.map((faq, i) => (
                <AccordionItem key={faq.question} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Important disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Course content is AHA-aligned and delivered by Paeds Resus Limited. Certification requires
                cognitive completion and instructor practical sign-off where applicable. Always follow your
                facility protocol and local Ministry of Health guidance during real patient care.
              </p>
              <p>
                Paeds Resus supports clinical judgment — it does not replace licensing, senior oversight, or
                institutional policies.
              </p>
            </CardContent>
          </Card>

          <nav aria-label="Related pages" className="flex flex-wrap gap-2 pt-4 border-t">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Platform home
              </Button>
            </Link>
            <Link href="/institutional">
              <Button variant="ghost" size="sm">
                Institutions
              </Button>
            </Link>
            <Link href="/aha-courses">
              <Button variant="ghost" size="sm">
                AHA courses hub
              </Button>
            </Link>
            <Link href="/verify">
              <Button variant="ghost" size="sm">
                Verify certificate
              </Button>
            </Link>
          </nav>
        </div>

        <Footer />
      </article>
    </>
  );
}
