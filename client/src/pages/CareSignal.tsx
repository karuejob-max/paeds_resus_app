import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CS_PAGE_MUTED = "text-slate-700 dark:text-slate-300";
const CS_SECTION_KICKER = "text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400";
import CareSignalFormV2 from "@/components/CareSignalFormV2";
import { CareSignalConsentGate } from "@/components/CareSignalConsentGate";
import { ResourceGapWidget } from "@/components/ResourceGapWidget";
import MultiFacilityBenchmarkWidget from "@/components/MultiFacilityBenchmarkWidget";
import { CARE_SIGNAL_V2_STEP_GUIDE } from "@/lib/care-signal-v2";

export default function CareSignal() {
  const loggerRef = useRef<HTMLDivElement>(null);

  const scrollToLogger = () => {
    loggerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface via-background to-background text-foreground">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-teal to-[#0d3333] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8" />
            <h1 className="text-4xl font-bold text-white">Care Signal</h1>
          </div>
          <p className="text-lg text-white/95 max-w-2xl mb-6">
            Structured reporting so no child dies from preventable causes — timelines, delays, resources, and system fixes your facility, county, and partners can act on. Parent stories remain under Safe-Truth.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="border-white/50 bg-white/15 text-white shadow-sm [&_svg]:text-white">
              <Shield className="w-3 h-3 mr-1" aria-hidden /> Confidential Reporting
            </Badge>
            <Badge variant="outline" className="border-white/50 bg-white/15 text-white shadow-sm [&_svg]:text-white">
              <TrendingUp className="w-3 h-3 mr-1" aria-hidden /> Data-Driven Insights
            </Badge>
            <Badge variant="outline" className="border-white/50 bg-white/15 text-white shadow-sm [&_svg]:text-white">
              <Heart className="w-3 h-3 mr-1" aria-hidden /> Neurologically Intact Survival
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Why Care Signal matters */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="w-5 h-5 text-brand-orange shrink-0" aria-hidden />
                Identify Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={CS_PAGE_MUTED}>
                Capture delays, equipment gaps, and system barriers — structured for facility, county, and national quality improvement.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="w-5 h-5 text-brand-teal shrink-0" aria-hidden />
                Get Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={CS_PAGE_MUTED}>
                Assess preventability and contributing factors so leaders can prioritise interventions that stop preventable deaths.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden />
                Drive Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={CS_PAGE_MUTED}>
                Propose concrete system fixes your hospital, county, or partners can implement — not blame, but actionable change.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Event Logger */}
        <div className="mb-12" ref={loggerRef}>
          <CareSignalConsentGate>
            <CareSignalFormV2 />
          </CareSignalConsentGate>
        </div>

        {/* Resource Gap Trends — sourced from ResusGPS sessions, NOT from Care Signal events */}
        <div className="mb-8">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={CS_SECTION_KICKER}>ResusGPS Data</span>
            <span className={cn("text-xs", CS_PAGE_MUTED)}>
              — interventions marked unavailable during live resuscitations
            </span>
          </div>
          <ResourceGapWidget
            title="Resource Gap Trends"
            description="Equipment and medications most frequently unavailable during live paediatric resuscitations at your facility (sourced from ResusGPS sessions, not Care Signal reports)"
            limit={10}
          />
        </div>

        {/* Multi-Facility Benchmark — sourced from ResusGPS sessions, anonymised cross-facility comparison */}
        <div className="mb-12">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={CS_SECTION_KICKER}>ResusGPS Data</span>
            <span className={cn("text-xs", CS_PAGE_MUTED)}>
              — anonymised cross-facility comparison from ResusGPS sessions
            </span>
          </div>
          <MultiFacilityBenchmarkWidget />
        </div>

        {/* How It Works */}
        <Card className="mb-12 bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">How Care Signal works</CardTitle>
            <CardDescription className={CS_PAGE_MUTED}>
              Seven focused steps: facility context, delays, resources, preventability, and actions for systems change
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {CARE_SIGNAL_V2_STEP_GUIDE.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-teal text-white font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className={cn("mt-1", CS_PAGE_MUTED)}>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Confidentiality */}
        <Card className="bg-sky-50 dark:bg-sky-950/35 border-sky-200 dark:border-sky-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-950 dark:text-sky-100">
              <Shield className="w-5 h-5 text-sky-700 dark:text-sky-300 shrink-0" aria-hidden />
              Your Privacy is Protected
            </CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-3 text-sm", CS_PAGE_MUTED)}>
            <p>
              ✓ <strong className="text-foreground">Anonymous Reporting:</strong> You can report events anonymously if you prefer.
            </p>
            <p>
              ✓ <strong className="text-foreground">Confidential Data:</strong> All reports are stored securely and used only for quality improvement.
            </p>
            <p>
              ✓ <strong className="text-foreground">No Punishment:</strong> Care Signal is designed for learning and improvement, not blame or disciplinary action.
            </p>
            <p>
              ✓ <strong className="text-foreground">Aggregated Insights:</strong> Facility-level data is anonymized and used to identify trends, not individual performance.
            </p>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Make a Difference?</h2>
          <p className={cn("mb-6 max-w-2xl mx-auto", CS_PAGE_MUTED)}>
            Every event you log contributes to our understanding of how to improve pediatric emergency care and save more children&apos;s lives.
          </p>
          <Button size="lg" className="bg-brand-teal hover:bg-[#143333] text-white" onClick={scrollToLogger}>
            Start a Care Signal report
          </Button>
        </div>
      </div>
    </div>
  );
}
