import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Heart, Stethoscope } from "lucide-react";
import Footer from "@/components/Footer";
import { JsonLdScript } from "@/components/JsonLdScript";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { getLoginUrl } from "@/const";
import { DEFAULT_PAGE_DESCRIPTION } from "@/lib/site-meta";
import {
  buildJsonLdGraph,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/seo-schema";

export default function PublicHome() {
  useScrollToTop();
  usePageMeta({
    title:
      "Paeds Resus — Emergency Care Training & Institutional Readiness (Kenya)",
    description: DEFAULT_PAGE_DESCRIPTION,
    path: "/",
  });

  const jsonLd = buildJsonLdGraph([
    buildOrganizationJsonLd(),
    buildWebsiteJsonLd(),
  ]);

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/60">
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-teal via-[#143333] to-brand-teal text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <p className="mb-3 text-sm font-medium uppercase tracking-wide text-brand-orange">
              Kenya · Emergency care training · Institutional readiness
            </p>
            <h1 className="mb-4 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
              No patient should die from a preventable emergency
            </h1>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">
              Most preventable deaths don&apos;t happen because the right
              treatment is unknown — they happen because it doesn&apos;t reach
              the patient in time. Paeds Resus helps people and institutions
              build the readiness, training, and systems that make emergency
              care safer.
            </p>

            <section aria-label="Choose your path" className="mt-10">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
                What brings you here today?
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Link href="/for-providers">
                  <Card className="h-full cursor-pointer border-white/20 bg-white/10 p-6 text-white transition hover:bg-white/20">
                    <Stethoscope className="h-6 w-6 text-brand-orange" />
                    <p className="mt-3 font-semibold">My own readiness</p>
                    <p className="mt-1 text-sm text-white/80">
                      I want to be ready for the next code blue, shift, or
                      emergency I personally respond to.
                    </p>
                  </Card>
                </Link>
                <Link href="/for-institutions">
                  <Card className="h-full cursor-pointer border-white/20 bg-white/10 p-6 text-white transition hover:bg-white/20">
                    <Building2 className="h-6 w-6 text-brand-orange" />
                    <p className="mt-3 font-semibold">
                      Our institution&apos;s readiness
                    </p>
                    <p className="mt-1 text-sm text-white/80">
                      I&apos;m responsible for how our hospital or facility
                      responds, hospital-wide.
                    </p>
                  </Card>
                </Link>
                <Link href="/for-parents">
                  <Card className="h-full cursor-pointer border-white/20 bg-white/10 p-6 text-white transition hover:bg-white/20">
                    <Heart className="h-6 w-6 text-brand-orange" />
                    <p className="mt-3 font-semibold">
                      As family or a caregiver
                    </p>
                    <p className="mt-1 text-sm text-white/80">
                      I want to understand what good emergency care should look
                      like for someone I care about.
                    </p>
                  </Card>
                </Link>
              </div>
            </section>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/80">
              <Link
                href="/register"
                className="underline underline-offset-4 hover:text-white"
              >
                Create free account
              </Link>
              <a
                href={getLoginUrl()}
                className="underline underline-offset-4 hover:text-white"
              >
                Sign in
              </a>
              <Link
                href="/training"
                className="underline underline-offset-4 hover:text-white"
              >
                Browse training
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </>
  );
}
