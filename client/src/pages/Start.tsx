/**
 * HI-PLAT-3: Role-aware entry chooser for first-time visitors (anonymous).
 */
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Siren, Stethoscope, Heart, Building2, BookOpen, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { BottomNav } from "@/components/BottomNav";

const tiles = [
  {
    title: "ResusGPS",
    description: "Point-of-care paediatric resuscitation guidance — no account required to try the tool.",
    href: "/resus",
    icon: Siren,
    cta: "Open ResusGPS",
    variant: "default" as const,
  },
  {
    title: "Healthcare providers",
    description: "Sign in for protocols, referrals, training enrollment, and certificates.",
    href: getLoginUrl(),
    icon: Stethoscope,
    cta: "Sign in",
    variant: "outline" as const,
    external: true,
  },
  {
    title: "Parents & caregivers",
    description: "Safe-Truth and learning resources tailored for families.",
    href: "/parent-safe-truth",
    icon: Heart,
    cta: "For parents",
    variant: "outline" as const,
  },
  {
    title: "Hospitals & institutions",
    description: "Bulk training, quotations, and hospital admin tools.",
    href: "/institutional",
    icon: Building2,
    cta: "For institutions",
    variant: "outline" as const,
  },
  {
    title: "Help & policies",
    description: "Support, privacy, terms, and about.",
    href: "/help",
    icon: BookOpen,
    cta: "Help centre",
    variant: "ghost" as const,
  },
];

export default function Start() {
  useScrollToTop();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">How do you want to use Paeds Resus?</h1>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
            Pick a path below. You can always use the header to switch later.
          </p>
        </div>

        <div className="space-y-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            const inner = (
              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-[#1a4d4d]/10 p-3 text-[#1a4d4d]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <CardTitle className="text-lg">{tile.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">{tile.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex justify-end">
                  {tile.external ? (
                    <Button variant={tile.variant} asChild>
                      <a href={tile.href} className="gap-2">
                        {tile.cta}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button variant={tile.variant} asChild>
                      <Link href={tile.href} className="gap-2">
                        {tile.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
            return <div key={tile.title}>{inner}</div>;
          })}
        </div>

        <p className="text-center text-sm text-slate-500 mt-10">
          Clinical emergency? ResusGPS at <Link href="/resus" className="text-[#1a4d4d] underline font-medium">/resus</Link> is the fastest entry.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
