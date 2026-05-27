import { SITE_ORIGIN } from "@/lib/site-meta";

export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;

export type CourseSchemaInput = {
  name: string;
  description: string;
  path: string;
  courseCode: string;
  duration?: string;
  priceKes?: number | null;
};

/** Canonical public routes included in sitemap.xml (path only). */
export const PUBLIC_SEO_ROUTES = [
  "/",
  "/start",
  "/about",
  "/help",
  "/verify",
  "/login",
  "/register",
  "/privacy",
  "/terms",
  "/legal/cookies",
  "/legal/care-signal",
  "/legal/clinical-use",
  "/legal/subprocessors",
  "/legal/data-request",
  "/parent-safe-truth",
  "/institutional",
  "/micro-courses",
  "/aha-courses",
  "/training",
  "/training/bls",
  "/training/acls",
  "/training/pals",
  "/training/nrp",
  "/for-providers",
  "/for-institutions",
  "/for-parents",
] as const;

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Paeds Resus",
    legalName: "Paeds Resus Limited",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/og-image.png`,
    description:
      "Paeds Resus is an integrated paediatric emergency care platform serving Kenya and the East African Community with AHA-aligned training, ResusGPS bedside guidance, Care Signal quality improvement, Safe-Truth family resources, and institutional readiness systems.",
    areaServed: ["Kenya", "East African Community"],
    email: "paedsresus254@gmail.com",
    telephone: "+254706781260",
    sameAs: [
      "https://www.linkedin.com/company/paeds-resus/",
      "https://www.facebook.com/share/16tgbVhZ9S/",
      "https://www.instagram.com/paedsresus",
      "https://x.com/PaedsResus",
      "https://youtube.com/@paeds_resus",
    ],
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Paeds Resus",
    url: SITE_ORIGIN,
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_ORIGIN}/help?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildCourseJsonLd(input: CourseSchemaInput) {
  const url = `${SITE_ORIGIN}${input.path}`;
  const provider = {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Paeds Resus Limited",
  };

  const course: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.name,
    description: input.description,
    url,
    courseCode: input.courseCode,
    provider,
    inLanguage: "en",
    availableLanguage: "en",
    educationalLevel: "Professional",
    teaches: input.description,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "blended",
      location: {
        "@type": "Place",
        name: "Kenya and East African Community",
        address: {
          "@type": "PostalAddress",
          addressCountry: "KE",
        },
      },
    },
  };

  if (input.duration) {
    (course.hasCourseInstance as Record<string, unknown>).courseWorkload = input.duration;
  }

  if (input.priceKes != null && input.priceKes > 0) {
    course.offers = {
      "@type": "Offer",
      price: input.priceKes,
      priceCurrency: "KES",
      url,
      availability: "https://schema.org/InStock",
      seller: provider,
    };
  }

  return course;
}

export function buildJsonLdGraph(items: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": items,
  };
}
