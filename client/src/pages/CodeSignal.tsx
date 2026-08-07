import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, Shield, Users } from "lucide-react";
import CodeSignalForm from "@/components/CodeSignalForm";
import { CodeSignalConsentGate } from "@/components/CodeSignalConsentGate";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function CodeSignal() {
  usePageMeta({
    title: "Code Signal — Whole-hospital resuscitation reporting | Paeds Resus",
    description:
      "Confidential incident and near-miss reporting for adult resuscitation, delivered by the same Emergency Response Teams that respond to paediatric codes.",
    path: "/code-signal",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface via-background to-background text-foreground">
      <div className="bg-gradient-to-r from-[#0d3333] to-brand-teal text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <HeartPulse className="w-8 h-8" />
            <h1 className="text-4xl font-bold text-white">Code Signal</h1>
          </div>
          <p className="text-lg text-white/95 max-w-2xl mb-6">
            The same team that responds to a child's code responds to an adult's — a collapsed mother, a colleague,
            any adult on the ward. Code Signal is where that response gets reported and learned from, the way Care
            Signal does for paediatric events.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="border-white/50 bg-white/15 text-white shadow-sm [&_svg]:text-white">
              <Shield className="w-3 h-3 mr-1" aria-hidden /> Confidential Reporting
            </Badge>
            <Badge variant="outline" className="border-white/50 bg-white/15 text-white shadow-sm [&_svg]:text-white">
              <Users className="w-3 h-3 mr-1" aria-hidden /> Whole-Hospital ERT
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Why Code Signal exists</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Most LMIC hospitals don't have a separate paediatric building, and paediatric wards are rarely staffed
            for a resuscitation team of their own. IERMS's whole-hospital Emergency Response Team model means the
            same responders who show up for a child's code also show up for an adult one — so the same near-miss
            learning discipline needs to cover both.
          </CardContent>
        </Card>
        <CodeSignalConsentGate>
          <CodeSignalForm />
        </CodeSignalConsentGate>
      </div>
    </div>
  );
}
