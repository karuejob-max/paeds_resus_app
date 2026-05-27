/**
 * P2-LAND-1: Role-aware entry chooser for anonymous visitors.
 * Clarifies Paeds Resus platform vs ResusGPS product; logged-in users route via RootEntry.
 */
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Siren, Stethoscope, Heart, Building2, BookOpen, GraduationCap, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { usePageMeta } from "@/hooks/usePageMeta";
import { BottomNav } from "@/components/BottomNav";

const rolePaths = [
  {
    title: "Healthcare provider",
    description:
      "Bedside guidance with ResusGPS, monthly Care Signal QI reports, and the Paeds Resus Fellowship pathway.",
    icon: Stethoscope,
    primaryHref: getLoginUrl(),
    primaryCta: "Sign in",
    secondaryHref: getLoginUrl("/resus"),
    secondaryCta: "Open ResusGPS",
    externalPrimary: true,
    externalSecondary: true,
  },
  {
    title: "Training & courses",
    description: "AHA-aligned BLS, ACLS, PALS, and condition-focused micro-courses (e.g. Septic Shock I).",
    href: "/enroll",
    icon: GraduationCap,
    cta: "Browse courses",
    external: false,
  },
  {
    title: "Parents & caregivers",
    description: "Parent Safe-Truth resources and family-facing learning — separate from provider tools.",
    href: "/parent-safe-truth",
    icon: Heart,
    cta: "For parents",
    external: false,
  },
  {
    title: "Hospitals & institutions",
    description: "Paediatric emergency readiness systems, staff training, and hospital admin tools.",
    href: "/institutional",
    icon: Building2,
    cta: "For institutions",
    external: false,
  },
] as const;

export default function Start() {
  useScrollToTop();
  usePageMeta({
    title: "Paeds Resus — Paediatric emergency care platform",
    description:
      "Choose your path: ResusGPS bedside guidance for providers, AHA-aligned training, Parent Safe-Truth for families, or institutional readiness tools for hospitals in Kenya and LMICs.",
    path: "/start",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/80 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-brand-teal mb-2">Paeds Resus platform</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            How do you want to use Paeds Resus?
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            One integrated platform for bedside guidance, quality improvement, training, and family safety.
            Pick your path — ResusGPS is one product, not the whole platform.
          </p>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-4">
            Trusted by paediatric emergency teams across Kenya — fellowship pathway, ResusGPS clinical support,
            Care Signal QI reporting, and hospital readiness in one place.
          </p>
        </div>

        <Card className="mb-6 border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Siren className="h-4 w-4 text-brand-teal" />
              First time here?
            </CardTitle>
            <CardDescription>Use this quick sequence for a smoother start.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>1) Choose your role below and sign in when prompted.</p>
            <p>2) Complete your first action (ResusGPS case, Care Signal report, course enrollment, or institutional quote).</p>
            <p>3) Use the header role switcher whenever you need another workspace.</p>
          </CardContent>
        </Card>

        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">I am a…</p>
        <div className="space-y-4">
          {rolePaths.map((tile) => {
            const Icon = tile.icon;
            const hasSecondary = "secondaryHref" in tile;

            return (
              <Card key={tile.title} className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-brand-teal/10 p-3 text-brand-teal">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <CardTitle className="text-lg">{tile.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">{tile.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex flex-wrap justify-end gap-2">
                  {hasSecondary ? (
                    <>
                      {"externalPrimary" in tile && tile.externalPrimary ? (
                        <Button variant="default" asChild>
                          <a href={tile.primaryHref} className="gap-2">
                            {tile.primaryCta}
                            <ArrowRight className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : null}
                      {"secondaryHref" in tile && tile.externalSecondary ? (
                        <Button variant="outline" asChild>
                          <a href={tile.secondaryHref} className="gap-2">
                            {tile.secondaryCta}
                          </a>
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <Button variant="outline" asChild>
                      <Link href={tile.href} className="gap-2">
                        {tile.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Card className="border-dashed">
            <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Support, privacy, terms, and about Paeds Resus</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/help">Help centre</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Clinical emergency? Healthcare providers should sign in first, then open{" "}
          <a href={getLoginUrl("/resus")} className="text-primary underline font-medium">
            ResusGPS
          </a>{" "}
          for bedside guidance.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
