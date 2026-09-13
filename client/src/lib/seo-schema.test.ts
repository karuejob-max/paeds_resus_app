import { describe, expect, it } from "vitest";
import {
  PUBLIC_SEO_ROUTES,
  buildBreadcrumbListJsonLd,
  buildCourseJsonLd,
  buildFaqPageJsonLd,
  buildJsonLdGraph,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "./seo-schema";
import { TRAINING_LANDING_CONFIGS, getTrainingPrice } from "./training-landing-content";

describe("buildOrganizationJsonLd", () => {
  it("includes legal name and Kenya area served", () => {
    const org = buildOrganizationJsonLd();
    expect(org["@type"]).toBe("Organization");
    expect(org.legalName).toBe("Paeds Resus Limited");
    expect(org.areaServed).toContain("Kenya");
  });
});

describe("buildCourseJsonLd", () => {
  it("builds PALS course schema with offer when price provided", () => {
    const course = buildCourseJsonLd({
      name: "PALS Training",
      description: "Pediatric advanced life support",
      path: "/training/pals",
      courseCode: "PALS",
      duration: "PT16H",
      priceKes: 20000,
    });
    expect(course["@type"]).toBe("Course");
    expect(course.courseCode).toBe("PALS");
    expect(course.url).toBe("https://www.paedsresus.com/training/pals");
    expect(course.offers).toMatchObject({ priceCurrency: "KES", price: 20000 });
  });

  it("builds NRP course schema with offer when price provided", () => {
    const course = buildCourseJsonLd({
      name: "NRP Training",
      description: "Neonatal resuscitation",
      path: "/training/nrp",
      courseCode: "NRP",
      duration: "PT8H",
      priceKes: 10000,
    });
    expect(course.courseCode).toBe("NRP");
    expect(course.url).toBe("https://www.paedsresus.com/training/nrp");
    expect(course.offers).toMatchObject({ priceCurrency: "KES", price: 10000 });
  });

  it("omits offers when price is null", () => {
    const course = buildCourseJsonLd({
      name: "NRP",
      description: "Neonatal resuscitation",
      path: "/training/nrp",
      courseCode: "NRP",
    });
    expect(course.offers).toBeUndefined();
  });

  it("NRP landing price matches pricing source of truth for JSON-LD", () => {
    const config = TRAINING_LANDING_CONFIGS.nrp;
    const price = getTrainingPrice("nrp");
    const course = buildCourseJsonLd({
      name: config.h1,
      description: config.metaDescription,
      path: config.path,
      courseCode: config.courseCode,
      duration: config.duration,
      priceKes: price,
    });
    expect(price).toBe(10000);
    expect(course.offers).toMatchObject({ priceCurrency: "KES", price: 10000 });
  });
});

describe("public training structured data", () => {
  it("builds a canonical breadcrumb list", () => {
    const breadcrumbs = buildBreadcrumbListJsonLd([
      { name: "Home", path: "/" },
      { name: "Training", path: "/training" },
      { name: "BLS", path: "/training/bls" },
    ]);
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbs.itemListElement).toHaveLength(3);
    expect(breadcrumbs.itemListElement[2]).toMatchObject({
      position: 3,
      name: "BLS",
      item: "https://www.paedsresus.com/training/bls",
    });
  });

  it("builds FAQPage data from visible training FAQs", () => {
    const faq = buildFaqPageJsonLd(TRAINING_LANDING_CONFIGS.bls.faqs, "/training/bls");
    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "How much does BLS training cost in Kenya?" }),
      expect.objectContaining({ name: "Is BLS training available in Nairobi?" }),
    ]));
  });
});

describe("buildJsonLdGraph", () => {
  it("wraps items in a graph", () => {
    const graph = buildJsonLdGraph([buildOrganizationJsonLd(), buildWebsiteJsonLd()]);
    expect(graph["@graph"]).toHaveLength(2);
  });
});

describe("PUBLIC_SEO_ROUTES", () => {
  it("includes training and stakeholder paths", () => {
    expect(PUBLIC_SEO_ROUTES).toContain("/training/pals");
    expect(PUBLIC_SEO_ROUTES).toContain("/for-providers");
    expect(PUBLIC_SEO_ROUTES).toContain("/aha-courses");
  });
});

describe("TRAINING_LANDING_CONFIGS", () => {
  it("has 400+ words of visible content per course", () => {
    for (const config of Object.values(TRAINING_LANDING_CONFIGS)) {
      const text = [
        config.subtitle,
        ...config.sections.flatMap((s) => s.paragraphs),
        ...config.faqs.flatMap((f) => [f.question, f.answer]),
      ].join(" ");
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      expect(wordCount, `${config.slug} has ${wordCount} words`).toBeGreaterThanOrEqual(400);
    }
  });
});
