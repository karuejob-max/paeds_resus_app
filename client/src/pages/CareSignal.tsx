import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, TrendingUp, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import CareSignalFormV2 from "@/components/CareSignalFormV2";
import { ResourceGapWidget } from "@/components/ResourceGapWidget";
import MultiFacilityBenchmarkWidget from "@/components/MultiFacilityBenchmarkWidget";
import { CARE_SIGNAL_V2_STEP_GUIDE } from "@/lib/care-signal-v2";

export default function CareSignal() {
  const loggerRef = useRef<HTMLDivElement>(null);

  const scrollToLogger = () => {
    loggerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f9] to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#1a4d4d] to-[#0d3333] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Care Signal</h1>
          </div>
          <p className="text-lg text-white/90 max-w-2xl mb-6">
            Structured reporting so no child dies from preventable causes — timelines, delays, resources, and system fixes your facility, county, and partners can act on. Parent stories remain under Safe-Truth.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Shield className="w-3 h-3 mr-1" /> Confidential Reporting
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <TrendingUp className="w-3 h-3 mr-1" /> Data-Driven Insights
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Heart className="w-3 h-3 mr-1" /> Neurologically Intact Survival
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Why Care Signal matters */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Identify Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Capture delays, equipment gaps, and system barriers — structured for facility, county, and national quality improvement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Get Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Assess preventability and contributing factors so leaders can prioritise interventions that stop preventable deaths.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Drive Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Propose concrete system fixes your hospital, county, or partners can implement — not blame, but actionable change.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Event Logger */}
        <div className="mb-12" ref={loggerRef}>
          <CareSignalFormV2 />
        </div>

        {/* Resource Gap Trends — sourced from ResusGPS sessions, NOT from Care Signal events */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              ResusGPS Data
            </span>
            <span className="text-xs text-slate-400">— interventions marked unavailable during live resuscitations</span>
          </div>
          <ResourceGapWidget
            title="Resource Gap Trends"
            description="Equipment and medications most frequently unavailable during live paediatric resuscitations at your facility (sourced from ResusGPS sessions, not Care Signal reports)"
            limit={10}
          />
        </div>

        {/* Multi-Facility Benchmark — sourced from ResusGPS sessions, anonymised cross-facility comparison */}
        <div className="mb-12">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              ResusGPS Data
            </span>
            <span className="text-xs text-slate-400">— anonymised cross-facility comparison from ResusGPS sessions</span>
          </div>
          <MultiFacilityBenchmarkWidget />
        </div>

        {/* How It Works */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>How Care Signal works</CardTitle>
            <CardDescription>
              Seven focused steps: facility context, delays, resources, preventability, and actions for systems change
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {CARE_SIGNAL_V2_STEP_GUIDE.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#1a4d4d] text-white font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Confidentiality */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Your Privacy is Protected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              ✓ <strong>Anonymous Reporting:</strong> You can report events anonymously if you prefer.
            </p>
            <p>
              ✓ <strong>Confidential Data:</strong> All reports are stored securely and used only for quality improvement.
            </p>
            <p>
              ✓ <strong>No Punishment:</strong> Care Signal is designed for learning and improvement, not blame or disciplinary action.
            </p>
            <p>
              ✓ <strong>Aggregated Insights:</strong> Facility-level data is anonymized and used to identify trends, not individual performance.
            </p>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Every event you log contributes to our understanding of how to improve pediatric emergency care and save more children's lives.
          </p>
          <Button size="lg" className="bg-[#1a4d4d] hover:bg-[#0d3333]" onClick={scrollToLogger}>
            Start a Care Signal report
          </Button>
        </div>
      </div>
    </div>
  );
}
