import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ProgramJourneyCard } from "@/components/ProgramJourneyCard";
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
    title: "Cognitive foundation",
    description:
      "Complete the platform cognitive sequence, then submit the two private AHA evidence documents for review.",
    icon: ClipboardCheck,
  },
  {
    number: "02",
    title: "Online simulations",
    description:
      "Build reliable team habits through confirmed Team Leader sessions and all six named Team Member roles.",
    icon: Users,
  },
  {
    number: "03",
    title: "Hands-on assessment",
    description: `Progress to a practical assessment only after the Phase 1 and authoritative Phase 2 gates are satisfied and the full ${formatKes(IERP_FULL_PRICE)} programme fee is paid.`,
    icon: ShieldCheck,
  },
];

export default function IerpLanding() {
  useScrollToTop();
  usePageMeta({
    title: "IERP — Intern Emergency Readiness Program | Paeds Resus",
    description:
      "A staged emergency readiness pathway for healthcare interns with required identity and deployment evidence: cognitive foundation, online simulations, and hands-on assessment.",
    path: "/programs/ierp",
  });
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const summaryQuery = trpc.ierp.getSummary.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30_000,
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
        paymentProgress: summaryQuery.data.payment.totalPaid / 15000,
        phase3Complete: summaryQuery.data.lifecycleStatus === "completed",
        phase1Action: { label: "Start BLS coursework", destination: "/learner-dashboard" },
        phase2Action: { label: "Open Phase 2", destination: "/ierp" },
        paymentAction: { label: "Open IERP payment", destination: "/programs/ierp" },
        phase3Action: { label: "Open Phase 3", destination: "/ierp" },
        phase2LockedReason: "Complete both cognitive courses and verify the AHA evidence certificates first.",
        phase3LockedReason: "Complete Phase 2 and pay the full IERP programme fee first.",
      })
    : null;

  const startIerp = () => {
    if (isAuthenticated) {
      navigate("/programs/ierp/enroll");
    } else {
      window.location.href = getLoginUrl("/programs/ierp/enroll");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {enrolled && journey ? (
        <section className="border-b border-white/10 bg-slate-900 px-6 py-12 md:px-10">
          <div className="mx-auto max-w-6xl space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">Welcome back</p>
              <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Your IERP learning journey</h1>
              <p className="mt-2 max-w-2xl text-slate-300">Continue from where you stopped. Programme progress is an orientation aid, not a clinical competence score.</p>
            </div>
            <ProgramJourneyCard
              title="Intern Emergency Readiness Program"
              subtitle="Your current IERP status and next available action."
              percentComplete={journey.percentComplete}
              phases={journey.phases}
              nextAction={journey.nextAction}
            />
          </div>
        </section>
      ) : null}
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.22),_transparent_45%),linear-gradient(135deg,_#0f172a,_#172554_60%,_#0f766e)]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
              Paeds Resus training pathway
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Start your emergency readiness journey as an intern.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              The <strong>Intern Emergency Readiness Program</strong> helps
              interns practise the knowledge, roles, communication, and
              reassessment habits that make paediatric emergencies safer under
              pressure.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-amber-400 text-slate-950 hover:bg-amber-300"
                onClick={startIerp}
              >
                Start IERP <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See how it works
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-300">
              Start with your individual Intern profile: choose your
              designation, enter your official letter reference number and
              commencement date, and upload your MoH deployment/posting letter.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-amber-100">
              The complete programme fee is {formatKes(IERP_FULL_PRICE)} for AHA
              ACLS plus Paeds Resus BLS. August–November starters may begin
              Phase 1 and Phase 2 before payment; from December onward, full
              payment is required before cognitive access and further Phase 2
              access.
            </p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-white/15 pb-5">
              <div className="rounded-2xl bg-teal-300/20 p-3">
                <GraduationCap className="h-7 w-7 text-teal-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-100">
                  IERP at a glance
                </p>
                <p className="text-xs text-slate-300">
                  A staged, evidence-led pathway
                </p>
              </div>
            </div>
            <div className="space-y-4 pt-5 text-sm text-slate-200">
              {[
                "Your programme record belongs to your individual Intern profile, not to an institutional roster.",
                "Phase 2 progress is based on confirmed named roles, not generic attendance counts.",
                `Phase 3 remains a separate hands-on assessment gate and requires the full ${formatKes(IERP_FULL_PRICE)} payment.`,
                "August–November starters have a temporary Phase 1–2 payment deferral; December onward requires full payment first.",
                "Your IERP activity does not grant IERS institutional permissions.",
              ].map(item => (
                <p key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-slate-50 px-6 py-20 text-slate-950"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
              A dependable sequence
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Learn, rehearse, then demonstrate.
            </h2>
            <p className="mt-4 text-slate-600">
              IERP keeps the learner journey explicit. Each phase explains what
              is complete, what is pending, and what must happen next.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {phases.map(({ number, title, description, icon: Icon }) => (
              <Card
                key={number}
                className="border-slate-200 bg-white shadow-sm"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-semibold text-slate-200">
                      {number}
                    </span>
                    <Icon className="h-6 w-6 text-teal-700" />
                  </div>
                  <CardTitle className="text-xl">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-slate-950">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
              Designed for real hospitals
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Useful when resources, time, and certainty are limited.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              The programme is built around practical readiness: clear
              responsibilities, closed-loop communication, deliberate
              reassessment, and a visible route to the next safe action.
            </p>
            <p className="mt-4 leading-7 text-slate-600">
              <strong>Payment timing is explicit:</strong> the{" "}
              {formatKes(IERP_FULL_PRICE)} fee is paid in full before Phase 3
              for every learner. Only August–November starters may use the
              cognitive and online-simulation stages before payment;
              December–July starters must complete payment before starting
              cognitive coursework.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Clear next steps",
              "Role-specific simulation",
              "Private evidence review",
              "Recoverable payment ledger",
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800"
              >
                <CheckCircle2 className="mb-3 h-5 w-5 text-teal-700" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-teal-800 px-6 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Ready to begin?</h2>
            <p className="mt-2 text-teal-100">
              Create your IERP record. August–November starters can begin the
              first two phases before payment; later starters pay{" "}
              {formatKes(IERP_FULL_PRICE)} first.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-white text-teal-900 hover:bg-teal-50"
            onClick={startIerp}
          >
            Start IERP <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
      <Footer />
    </div>
  );
}
