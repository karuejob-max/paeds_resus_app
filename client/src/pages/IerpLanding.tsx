import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { IerpJourneyCard } from "@/components/IerpJourneyCard";
import { calculateProgramJourney } from "@shared/program-journey";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { IERP_FULL_PRICE, formatKes } from "@/const/marketingCopy";

const phases = [
  {
    number: "01",
    title: "Build your foundation",
    technicalTitle: "Phase 1 · Cognitive learning",
    description: "Complete BLS first, then continue to ACLS and submit the two required AHA completion certificates.",
    icon: ClipboardCheck,
  },
  {
    number: "02",
    title: "Practise as a team",
    technicalTitle: "Phase 2 · Online simulations",
    description: "Complete confirmed team-leader and team-member roles in guided online simulations.",
    icon: Users,
  },
  {
    number: "03",
    title: "Demonstrate readiness",
    technicalTitle: "Phase 3 · Hands-on assessment",
    description: `Progress to the practical assessment after the Phase 1, Phase 2, and full ${formatKes(IERP_FULL_PRICE)} programme requirements are satisfied.`,
    icon: ShieldCheck,
  },
];

const outcomeTiles = [
  {
    title: "Learn",
    description: "Build a reliable BLS-to-ACLS cognitive foundation for paediatric emergencies.",
    icon: GraduationCap,
  },
  {
    title: "Prove",
    description: "Submit the two private AHA certificates that confirm your external pre-course work.",
    icon: FileCheck2,
  },
  {
    title: "Rehearse",
    description: "Practise named team roles and communication habits through online simulations.",
    icon: Users,
  },
  {
    title: "Demonstrate",
    description: "Move to hands-on assessment when the programme gates are satisfied.",
    icon: ShieldCheck,
  },
];

export default function IerpLanding() {
  useScrollToTop();
  usePageMeta({
    title: "IERP — Intern Emergency Readiness Program | Paeds Resus",
    description:
      "A clear, staged emergency readiness pathway for healthcare interns: BLS, ACLS, evidence, online simulations, and hands-on assessment.",
    path: "/programs/ierp",
  });
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const summaryQuery = trpc.ierp.getSummary.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const enrolled = Boolean(summaryQuery.data?.enrollmentId);
  const bls = summaryQuery.data?.aha.find((row) => row.programType === "bls");
  const acls = summaryQuery.data?.aha.find((row) => row.programType === "acls");
  const phase2 = summaryQuery.data?.phase2;
  const phase2Progress = phase2
    ? Math.min(
        phase2.teamLeaderCount / Math.max(1, phase2.teamLeaderRequired),
        phase2.teamMemberSessionsTotal / Math.max(1, phase2.teamMemberSessionsRequired),
        phase2.teamMemberRolesCovered / Math.max(1, phase2.teamMemberRolesRequired),
      )
    : 0;
  const journey = summaryQuery.data
    ? calculateProgramJourney({
        blsProgress: bls?.cognitiveModulesComplete ? 1 : 0,
        aclsProgress: acls?.cognitiveModulesComplete ? 1 : 0,
        ahaEvidenceVerified: summaryQuery.data.phase1Complete,
        phase2Progress,
        paymentProgress: summaryQuery.data.payment.totalPaid / IERP_FULL_PRICE,
        phase3Complete: summaryQuery.data.lifecycleStatus === "completed",
        phase1Action: { label: "Start BLS cognitive learning", destination: "/learner-dashboard" },
        phase2Action: { label: "Continue to online simulations", destination: "/ierp" },
        paymentAction: { label: "Review programme payment", destination: "/programs/ierp" },
        phase3Action: { label: "Open hands-on assessment", destination: "/ierp" },
        phase2LockedReason: "Complete BLS, ACLS, and submit the required AHA certificates first.",
        phase3LockedReason: "Complete online simulations and the full programme payment first.",
      })
    : null;

  const startIerp = () => {
    if (isAuthenticated) {
      navigate("/programs/ierp/enroll");
    } else {
      window.location.href = getLoginUrl("/programs/ierp/enroll");
    }
  };

  const primaryAction = enrolled && journey?.nextAction ? journey.nextAction : null;
  const primaryLabel = primaryAction?.label ?? "Check eligibility and start";
  const runPrimaryAction = () => {
    if (primaryAction) {
      navigate(primaryAction.destination);
    } else {
      startIerp();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {enrolled && journey ? (
        <section className="border-b border-slate-200 bg-slate-100 px-4 py-8 sm:px-6 md:px-10 md:py-10">
          <div className="mx-auto max-w-6xl space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Welcome back</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Your IERP journey</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">One current step, one safe next action, and a clear route to readiness.</p>
              </div>
              <p className="text-xs text-slate-500">Programme progress is an orientation aid, not a clinical competence score.</p>
            </div>
            <IerpJourneyCard
              title="Intern Emergency Readiness Program"
              subtitle="Your current learning stage and next available action."
              percentComplete={journey.percentComplete}
              phases={journey.phases}
              nextAction={journey.nextAction}
            />
          </div>
        </section>
      ) : null}

      <main>
        <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6 md:px-10 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Paeds Resus · Intern pathway</p>
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
                Build readiness for paediatric emergencies during internship.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                IERP takes you from BLS and ACLS learning to team-based simulation and hands-on assessment in one visible route.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="bg-slate-950 text-white hover:bg-slate-800" onClick={runPrimaryAction}>
                  {primaryLabel}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  onClick={() => document.getElementById("journey")?.scrollIntoView({ behavior: "smooth" })}
                >
                  See the 3-step journey
                </Button>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
                Start with your individual intern profile, official letter reference number, commencement date, and MoH deployment/posting letter.
              </p>
            </div>

            <Card className="border-slate-200 bg-slate-50 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.5)]">
              <CardHeader className="border-b border-slate-200 pb-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-teal-700 p-3 text-white">
                    <GraduationCap className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">At a glance</p>
                    <CardTitle className="mt-1 text-xl text-slate-950">A guided route, not a content library</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["For", "Healthcare interns"],
                    ["Route", "BLS → ACLS → simulation"],
                    ["Fee", `${formatKes(IERP_FULL_PRICE)} total`],
                    ["First step", "Individual profile"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <p className="text-sm font-semibold text-teal-950">Payment timing is account-specific.</p>
                  <p className="mt-1 text-sm leading-6 text-teal-900">Your account will show whether you may begin the early stages before payment or must pay the full fee first.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50 px-4 py-12 sm:px-6 md:px-10 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">What you will complete</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Learn, prove, rehearse, demonstrate.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">Each part of IERP has a clear purpose and a visible handoff to the next.</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {outcomeTiles.map(({ title, description, icon: Icon }) => (
                <Card key={title} className="border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="bg-white px-4 py-12 sm:px-6 md:px-10 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">The route</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Three stages. One clear direction.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">Start with knowledge, practise as a team, then demonstrate readiness in person.</p>
            </div>
            <div className="mt-9 grid gap-4 lg:grid-cols-3">
              {phases.map(({ number, title, technicalTitle, description, icon: Icon }, index) => (
                <div key={number} className="relative">
                  {index < phases.length - 1 ? <div className="absolute right-[-1rem] top-12 hidden h-px w-8 bg-slate-200 lg:block" aria-hidden="true" /> : null}
                  <Card className="h-full border-slate-200 bg-slate-50 shadow-none">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <span className="text-4xl font-semibold text-slate-200">{number}</span>
                        <div className="rounded-xl bg-white p-2.5 text-teal-700 shadow-sm">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                      </div>
                      <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-700">{technicalTitle}</p>
                      <CardTitle className="text-xl text-slate-950">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-slate-600">{description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50 px-4 py-12 sm:px-6 md:px-10 md:py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">How payment works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Transparent requirements, shown at the right time.</h2>
              <p className="mt-4 leading-7 text-slate-600">The full programme fee is {formatKes(IERP_FULL_PRICE)}. Your account shows the payment timing that applies to your internship start window.</p>
            </div>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["01", "See your account rule", "Know whether early access is available before payment."],
                  ["02", "Track your balance", "Use the payment ledger to see paid amount and balance."],
                  ["03", "Clear the final gate", "The full programme requirement must be satisfied before hands-on assessment."],
                ].map(([number, title, description]) => (
                  <div key={number} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-semibold text-slate-200">{number}</p>
                    <h3 className="mt-2 text-sm font-semibold text-slate-950">{title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{description}</p>
                  </div>
                ))}
              </div>
              <details className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <summary className="cursor-pointer font-semibold text-slate-950">Programme boundaries</summary>
                <p className="mt-2 max-w-3xl leading-6">IERP is an individual learning record for interns. It does not create institutional roster membership or grant IERS permissions. Institutional access and learner access remain separate safeguards.</p>
              </details>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-12 text-white sm:px-6 md:px-10 md:py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Your first step</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Start with your individual intern profile.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">We will show you the correct access and payment route for your account.</p>
            </div>
            <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-100" onClick={runPrimaryAction}>
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.5)] backdrop-blur md:hidden">
        <Button className="w-full bg-slate-950 text-white hover:bg-slate-800" onClick={runPrimaryAction}>
          {primaryLabel}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <Footer />
    </div>
  );
}
