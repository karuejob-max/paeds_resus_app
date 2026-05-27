import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { buildJsonLdGraph, buildOrganizationJsonLd } from "@/lib/seo-schema";
import { ArrowRight, Heart } from "lucide-react";

export default function ForParents() {
  useScrollToTop();
  usePageMeta({
    title: "For Parents & Caregivers — Parent Safe-Truth | Paeds Resus",
    description:
      "Parent Safe-Truth: trustworthy family-facing resources from Paeds Resus. Separate from provider tools — help your community recognise danger signs and seek care early.",
    path: "/for-parents",
  });

  return (
    <>
      <JsonLdScript data={buildJsonLdGraph([buildOrganizationJsonLd()])} />
      <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/50">
        <header className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-brand-teal" />
            <p className="text-sm font-medium text-brand-teal">Parents & caregivers</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Parent Safe-Truth — family safety, clear language</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Paeds Resus serves families through Parent Safe-Truth — a distinct product with appropriate tone
            and scope. It is not ResusGPS and not Care Signal (which is for healthcare staff reporting).
          </p>
        </header>

        <div className="max-w-4xl mx-auto px-4 pb-12 space-y-6 text-muted-foreground leading-relaxed">
          <p>
            Safe-Truth helps parents and guardians understand when a child needs urgent care, how to respond
            before reaching hospital, and how to participate in community safety conversations without
            clinical jargon or unsupported outcome claims.
          </p>
          <p>
            Create a parent account or explore resources anonymously on the Safe-Truth page. For clinical
            emergencies, contact your nearest emergency services or go to the closest hospital immediately.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/parent-safe-truth">
              <Button variant="cta" className="gap-2">
                Open Parent Safe-Truth
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Create parent account</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">Platform home</Button>
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
