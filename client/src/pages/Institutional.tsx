import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BarChart3, CheckCircle2, LogIn, ShieldCheck, Users } from "lucide-react";

import { useAnalytics } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WhatsAppButton from "@/components/WhatsAppButton";
import CourseCalculator from "@/components/CourseCalculator";
import { COURSES, getAllCourses } from "@/lib/courseData";
import { InstitutionalLeadForm } from "@/components/InstitutionalLeadForm";
import { getInstitutionalPrice, institutionalPricing } from "@/const/pricing";

const COURSE_TO_PRICING_KEY: Record<string, string> = {
  bls: "bls",
  acls: "acls",
  pals: "pals",
  bronze: "fellowship",
  silver: "fellowship",
  gold: "fellowship",
};

export default function Institutional() {
  const { trackPricingCalculatorUsed, trackButtonClick } = useAnalytics("Institutional");
  const [staffCount, setStaffCount] = useState(50);
  const [selectedCourse, setSelectedCourse] = useState<string | null>("bls");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#quote") return;
    const t = window.setTimeout(() => {
      document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, []);

  const pricingKey = selectedCourse ? COURSE_TO_PRICING_KEY[selectedCourse] ?? "bls" : "bls";
  const institutionalResult = getInstitutionalPrice(pricingKey, staffCount);
  const config = institutionalPricing[pricingKey as keyof typeof institutionalPricing];
  const pricePerPerson = institutionalResult?.pricePerSeat ?? config?.basePricePerSeat ?? 8000;
  const totalCost = institutionalResult?.totalPrice ?? staffCount * pricePerPerson;

  const pricingTiers = (config?.bulkDiscounts ?? []).map((t) => ({
    staff: t.seats,
    price: Math.round((config?.basePricePerSeat ?? 8000) * (1 - t.discount / 100)),
    discount: t.discount,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <section className="bg-gradient-to-br from-[#1a4d4d] via-[#0d3333] to-[#052020] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Paeds Resus for Institutions</h1>
          <p className="text-lg md:text-xl text-orange-100 max-w-3xl">
            Equip your teams with structured paediatric emergency training, role-appropriate tools, and operational
            dashboards that support improvement planning.
          </p>
          <p className="text-sm text-orange-100/90 max-w-3xl">
            We publish only supportable claims. Clinical outcomes depend on facility context, staffing, and adherence
            to local protocols.
          </p>
        </div>
      </section>

      <section className="bg-[#0a2828] border-t border-white/10 text-white" aria-label="How to work with us">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/20 p-6 bg-white/5">
            <h2 className="text-lg font-semibold mb-2">Evaluating a partnership?</h2>
            <p className="text-sm text-orange-100/90 mb-4">
              Request a scoped quote for your facility. No login is required for this buyer workflow.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-[#ff6633] hover:bg-[#e85a2e]" onClick={() => trackButtonClick("institutional_get_quote")}>
                <a href="#quote">Get a quote</a>
              </Button>
              <WhatsAppButton
                phoneNumber="254706781260"
                message="Hello Paeds Resus, I would like information on institutional training."
                label="WhatsApp"
                className="bg-green-600 hover:bg-green-700 text-white"
              />
            </div>
          </div>
          <div className="rounded-xl border border-white/20 p-6 bg-white/5">
            <h2 className="text-lg font-semibold mb-2">Already onboarded?</h2>
            <p className="text-sm text-orange-100/90 mb-4">
              Use the hospital admin portal for roster management, session scheduling, and training analytics.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login">
                <Button variant="secondary" className="gap-2 bg-white text-[#0a2828] hover:bg-orange-50" onClick={() => trackButtonClick("institutional_sign_in")}>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Button>
              </Link>
              <Link href="/hospital-admin-dashboard">
                <Button variant="outline" className="border-white/50 text-white hover:bg-white/10">
                  Open portal
                </Button>
              </Link>
              <Link href="/institutional-onboarding">
                <Button variant="ghost" className="text-orange-100 hover:text-white hover:bg-white/10">
                  New onboarding
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Clinical scope clarity
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              ResusGPS is a provider tool for structured bedside guidance. It supports clinical teams and does not
              replace local policy or senior decision making.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Team training model
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Combine foundational courses and focused modules to match your workforce needs across nurses, clinicians,
              and emergency-facing teams.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                Operational visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Institutional dashboards help track participation and learning operations so leadership can prioritize
              improvements and follow-through.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center text-[#1a4d4d]">Training programmes</h2>
          <p className="text-center text-muted-foreground mb-8">
            Select a programme to preview content and planning costs.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {getAllCourses().map((course) => (
              <Card
                key={course.id}
                className="border-t-4 border-[#ff6633] hover:shadow-lg transition cursor-pointer"
                onClick={() => {
                  setSelectedCourse(course.id);
                  trackButtonClick("institutional_programme_selected", { courseId: course.id });
                }}
              >
                <CardHeader>
                  <CardTitle className="text-[#1a4d4d]">{course.name}</CardTitle>
                  <CardDescription>{course.duration}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-foreground/90">{course.description}</p>
                  <div className="bg-[#ff6633]/5 p-3 rounded">
                    <p className="text-sm font-semibold text-[#1a4d4d] mb-2">Selected topics:</p>
                    <ul className="text-xs space-y-1">
                      {course.topics.slice(0, 4).map((topic) => (
                        <li key={topic} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#ff6633]" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t pt-3">
                    <p className="font-bold text-[#1a4d4d]">{course.basePrice.toLocaleString()} KES base price</p>
                    <Button className="w-full mt-3 bg-[#ff6633] hover:bg-[#e55a22]">Open programme calculator</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedCourse && COURSES[selectedCourse] && (
            <CourseCalculator
              course={COURSES[selectedCourse]}
              isOpen={Boolean(selectedCourse)}
              onClose={() => setSelectedCourse(null)}
            />
          )}
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-r from-[#1a4d4d]/5 to-[#ff6633]/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-[#1a4d4d]">Budget planning calculator</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <Card className="border-t-4 border-[#ff6633]">
              <CardHeader>
                <CardTitle className="text-[#1a4d4d]">Estimate programme budget</CardTitle>
                <CardDescription>Use this for planning only. Final quote depends on confirmed scope.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#1a4d4d]">
                    Number of staff: {staffCount}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={staffCount}
                    onChange={(e) => {
                      const newCount = Number(e.target.value);
                      setStaffCount(newCount);
                      const result = getInstitutionalPrice(pricingKey, newCount);
                      trackPricingCalculatorUsed(newCount, result?.totalPrice ?? newCount * 8000);
                    }}
                    className="w-full"
                  />
                </div>

                <div className="bg-brand-surface p-4 rounded-lg space-y-3 border border-border/60">
                  <p className="text-xs text-muted-foreground">Programme: {config?.name ?? "Institutional programme"}</p>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Estimated price per seat:</span>
                    <span className="font-bold">{pricePerPerson.toLocaleString()} KES</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Estimated total:</span>
                    <span className="text-green-900">{totalCost.toLocaleString()} KES</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This estimate excludes any bespoke consulting or implementation scope.
                  </p>
                </div>

                <Button asChild className="w-full bg-green-900 hover:bg-green-800">
                  <a href="#quote">Request formal quote</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How engagement works</CardTitle>
                <CardDescription>A typical institutional path from inquiry to operations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p className="inline-flex items-start gap-2">
                  <span className="font-semibold text-foreground">1.</span>
                  <span>Scope your cohort, training priorities, and timeline with the partnerships team.</span>
                </p>
                <p className="inline-flex items-start gap-2">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>Receive a quote with programme options and delivery assumptions.</span>
                </p>
                <p className="inline-flex items-start gap-2">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>Onboard your team to the institutional portal for scheduling and staff operations.</span>
                </p>
                <p className="inline-flex items-start gap-2">
                  <span className="font-semibold text-foreground">4.</span>
                  <span>Review participation and operational indicators to guide improvement planning.</span>
                </p>
                <Link href="/help">
                  <Button variant="outline" className="w-full justify-between">
                    Review support and onboarding help
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">Bulk pricing tiers</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-4 px-4">Staff count</th>
                  <th className="text-left py-4 px-4">Estimated price per person</th>
                  <th className="text-left py-4 px-4">Discount</th>
                  <th className="text-left py-4 px-4">Estimated total</th>
                </tr>
              </thead>
              <tbody>
                {pricingTiers.map((tier) => (
                  <tr key={String(tier.staff)} className="border-b border-border hover:bg-muted/40">
                    <td className="py-4 px-4 font-semibold">{tier.staff}+ staff</td>
                    <td className="py-4 px-4">{tier.price.toLocaleString()} KES</td>
                    <td className="py-4 px-4">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {tier.discount}% off
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold">{(tier.staff * tier.price).toLocaleString()} KES</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-green-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to scope your facility plan?</h2>
          <p className="text-lg text-green-100 mb-8">
            Share your staffing and programme needs. We will return a formal quote and next-step onboarding path.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="bg-white text-green-900 hover:bg-green-50">
              <a href="#quote">Request quote</a>
            </Button>
            <WhatsAppButton
              phoneNumber="254706781260"
              message="Hello Paeds Resus, I am interested in institutional training for my hospital."
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white"
              label="Chat on WhatsApp"
            />
            <Link href="/help">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                View support centre
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="quote" className="py-16 bg-muted/30 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Request an institutional quote</h2>
            <p className="text-lg text-muted-foreground">
              We use your details to scope training and follow up with your team.
            </p>
          </div>
          <InstitutionalLeadForm />
        </div>
      </section>
    </div>
  );
}
