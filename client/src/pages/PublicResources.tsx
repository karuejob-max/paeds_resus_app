import { Link } from "wouter";
import { ArrowRight, BookOpen, Building2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { PUBLIC_RESOURCES } from "@/const/publicResources";
import {
  buildJsonLdGraph,
  buildMedicalOrganizationJsonLd,
  buildOrganizationJsonLd,
} from "@/lib/seo-schema";

export default function PublicResources() {
  useScrollToTop();
  usePageMeta({
    title:
      "Emergency Care Resources for Providers and Institutions | Paeds Resus",
    description:
      "Practical emergency-care resources for healthcare providers and institutional leadership teams in Kenya, from Paeds Resus.",
    path: "/resources",
  });

  return (
    <>
      <JsonLdScript
        data={buildJsonLdGraph([
          buildOrganizationJsonLd(),
          buildMedicalOrganizationJsonLd(),
        ])}
      />
      <div className="min-h-screen bg-background">
        <section className="bg-[#082f2f] text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              Paeds Resus resources
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Useful answers for the next emergency-care decision.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-teal-50 md:text-xl">
              Practical, Kenya-focused guidance for individual providers and
              institutional teams. These resources support learning; they do not
              replace local protocols, clinical judgement, supervision, or
              emergency services.
            </p>
          </div>
        </section>
        <main className="mx-auto max-w-6xl space-y-8 px-4 py-14 md:py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {PUBLIC_RESOURCES.map(resource => (
              <article
                key={resource.slug}
                className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  {resource.audience === "Institutions" ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <Stethoscope className="h-4 w-4" />
                  )}
                  {resource.audience}
                </div>
                <h2 className="mt-4 text-2xl font-bold leading-tight">
                  {resource.title}
                </h2>
                <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">
                  {resource.summary}
                </p>
                <Link href={`/resources/${resource.slug}`}>
                  <Button className="mt-6 w-full" variant="outline">
                    Read the resource <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </article>
            ))}
          </div>
          <section className="rounded-2xl border border-primary/15 bg-primary/5 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <BookOpen className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">
                  Built from practice, reviewed with care.
                </h2>
                <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
                  Paeds Resus resources are designed to make emergency-care
                  decisions clearer without overstating what a tool or article
                  can do. For institutional readiness, start with ILSP, IERS, or
                  ICPD according to the problem you need to solve.
                </p>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

export function PublicResourceArticle({ slug }: { slug: string }) {
  useScrollToTop();
  const resource = PUBLIC_RESOURCES.find(item => item.slug === slug);
  usePageMeta({
    title: resource
      ? `${resource.title} | Paeds Resus`
      : "Resource not found | Paeds Resus",
    description: resource?.summary ?? "Paeds Resus emergency-care resources.",
    path: `/resources/${slug}`,
  });

  if (!resource) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Resource not found</h1>
        <Link href="/resources">
          <Button className="mt-6">Back to resources</Button>
        </Link>
      </div>
    );
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: resource.title,
    description: resource.summary,
    datePublished: resource.publishedAt,
    dateModified: resource.publishedAt,
    mainEntityOfPage: `https://www.paedsresus.com/resources/${resource.slug}`,
    author: {
      "@type": "Organization",
      name: "Paeds Resus",
      url: "https://www.paedsresus.com/",
    },
    publisher: {
      "@type": "Organization",
      name: "Paeds Resus",
      url: "https://www.paedsresus.com/",
    },
    inLanguage: "en",
  };

  return (
    <>
      <JsonLdScript data={articleJsonLd} />
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-3xl px-4 py-14 md:py-20">
          <Link
            href="/resources"
            className="text-sm font-semibold text-primary"
          >
            ← All resources
          </Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            {resource.audience} · Paeds Resus resource
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
            {resource.title}
          </h1>
          <p className="mt-5 text-xl leading-relaxed text-muted-foreground">
            {resource.summary}
          </p>
          <div className="mt-10 space-y-6 text-lg leading-relaxed">
            {resource.body.map(paragraph => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <aside className="mt-12 rounded-2xl border border-orange-200 bg-orange-50 p-6 text-orange-950">
            <p className="font-semibold">Clinical and operational boundary</p>
            <p className="mt-2 text-sm leading-relaxed">
              This educational resource does not replace local protocols,
              clinical judgement, senior supervision, formal certification, or
              emergency referral pathways.
            </p>
          </aside>
        </main>
        <Footer />
      </div>
    </>
  );
}
