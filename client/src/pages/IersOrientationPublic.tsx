import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePageMeta } from "@/hooks/usePageMeta";

const JOURNEYS = [
  {
    title: "Providers",
    icon: Users,
    description:
      "See your pole’s current Emergency Response Team, accept or decline assigned duties, complete UTL readiness checks, and submit role-linked observations when activated.",
    href: "/home",
    action: "Open provider platform",
  },
  {
    title: "ERCos and IERS Leads",
    icon: HeartPulse,
    description:
      "Coordinate governance, confirm departments and poles, assign dated UTL coverage, and keep response readiness visible without becoming automatic shift staff.",
    href: "/institution",
    action: "Open institution platform",
  },
  {
    title: "Institution administrators",
    icon: Building2,
    description:
      "Maintain people, memberships, canonical departments, product access, local escalation contacts, and the facility’s approved readiness configuration.",
    href: "/institution/administration",
    action: "Open administration",
  },
  {
    title: "Reviewers and quality leads",
    icon: ClipboardCheck,
    description:
      "Review readiness gaps, role coverage, targeted reports, drills, and improvement patterns. Use the data to improve systems, not to rank individual staff.",
    href: "/institution/iers/report",
    action: "Open IERS reports",
  },
];

const OPERATING_LOOP = [
  [
    "Configure",
    "Confirm the facility’s departments, operational poles, people, roles, local emergency routes, and approved readiness template.",
  ],
  [
    "Assign and accept",
    "Publish dated UTL, ERTL, and ERT-member duties. Each provider accepts or declines their own duty; a decline must be resolved explicitly.",
  ],
  [
    "Check readiness",
    "The UTL checks the approved crash-cart and equipment list for the exact shift. A checklist result is evidence of the check, not a guarantee that care will be successful.",
  ],
  [
    "Respond and report",
    "Use the local emergency route first. During an activation, named ERT members can submit a short role-at-event report without patient identifiers.",
  ],
  [
    "Review and improve",
    "Institutional leaders review readiness, coverage, gaps, and observations. The Adaptive Learning view identifies system improvements without punitive individual scoring.",
  ],
];

export default function IersOrientationPublic() {
  usePageMeta({
    title: "How IERS works — Paeds Resus",
    description:
      "A public orientation to the Paeds Resus Institutional Emergency Readiness System for providers, ERCos, administrators, and quality teams.",
    path: "/iers/orientation",
  });

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950/30">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4">
            Public IERS orientation
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            How the Paeds Resus IERS works
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            IERS turns emergency readiness into a shared institutional operating
            loop: the right people, the right role, the right equipment, a clear
            response, and a measurable improvement record.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/login">
              <Button>
                Sign in to your platform <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/institutional">
              <Button variant="outline">For institutions</Button>
            </Link>
          </div>
        </header>

        <Alert className="mx-auto mt-8 max-w-4xl border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Safety and scope</AlertTitle>
          <AlertDescription>
            IERS is an emergency-readiness, responsibility, evidence, and
            learning system. It is not an emergency dispatch service, a
            substitute for local policy, a medical record, or a replacement for
            trained clinical judgement, senior review, emergency services, or
            ResusGPS clinical guidance. Never enter patient identifiers into
            IERS improvement reports.
          </AlertDescription>
        </Alert>

        <section className="mt-12" aria-labelledby="journeys-heading">
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
              Choose your path
            </p>
            <h2
              id="journeys-heading"
              className="mt-2 text-2xl font-semibold tracking-tight"
            >
              Everyone has a defined job
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Use the public guide for orientation, then use the signed-in
              platform for institution-scoped work. Access is controlled by
              role, membership, product entitlement, and dated assignment.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {JOURNEYS.map(
              ({ title, icon: Icon, description, href, action }) => (
                <Card key={title} className="h-full">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription className="mt-1 leading-5">
                          {description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={href}>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {action}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="loop-heading">
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
              The operating loop
            </p>
            <h2
              id="loop-heading"
              className="mt-2 text-2xl font-semibold tracking-tight"
            >
              From setup to improvement
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {OPERATING_LOOP.map(([title, description], index) => (
              <Card key={title} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <CardTitle className="text-base">{title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm leading-5 text-muted-foreground">
                  {description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section
          className="mt-12 grid gap-6 lg:grid-cols-2"
          aria-labelledby="boundaries-heading"
        >
          <Card>
            <CardHeader>
              <CardTitle
                id="boundaries-heading"
                className="flex items-center gap-2"
              >
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                What belongs in IERS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                <strong className="text-foreground">Readiness:</strong> people,
                roles, equipment checks, drills, evidence, gaps, and improvement
                actions.
              </p>
              <p>
                <strong className="text-foreground">Responsibility:</strong>{" "}
                dated UTL, ERTL, and ERT-member duties with explicit acceptance
                and safe replacement.
              </p>
              <p>
                <strong className="text-foreground">Learning:</strong>{" "}
                structured observations that help a facility improve systems and
                response reliability over time.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-700" />
                Keep the boundaries clear
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                <strong className="text-foreground">ICPD:</strong> professional
                development, attendance, certificates, and workforce learning
                records.
              </p>
              <p>
                <strong className="text-foreground">ResusGPS:</strong>{" "}
                structured clinical guidance for trained providers; it does not
                replace judgement or local protocol.
              </p>
              <p>
                <strong className="text-foreground">Care/Code Signal:</strong>{" "}
                an anonymous reporting route available to providers, separate
                from named activation role reports.
              </p>
            </CardContent>
          </Card>
        </section>

        <section
          className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          aria-labelledby="first-day-heading"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <h2 id="first-day-heading" className="text-xl font-semibold">
                Your first day with IERS
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A provider confirms their profile and institution link, reads
                their assigned role, accepts or declines dated duties, and knows
                the local emergency route. An administrator confirms the
                facility’s departments, poles, people, permissions, local
                escalation contacts, and readiness-template approval. An ERCo or
                IERS Lead confirms actual UTL coverage rather than relying on
                automatic staffing.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/help">
                  <Button variant="outline">Open help centre</Button>
                </Link>
                <Link href="/institutional-onboarding">
                  <Button variant="outline">
                    Start institution onboarding
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t pt-6 text-sm text-muted-foreground">
          <p>
            For detailed institutional policy, facility completion, and agent
            implementation instructions, ask your Paeds Resus implementation
            lead for the IERS documentation package.
          </p>
          <p className="mt-2">
            <Link href="/privacy" className="underline">
              Privacy
            </Link>
            {" · "}
            <Link href="/terms" className="underline">
              Terms
            </Link>
            {" · "}
            <Link href="/help" className="underline">
              Help
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
