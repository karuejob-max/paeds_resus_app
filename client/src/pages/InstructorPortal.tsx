import { useMemo } from "react";
import { Link } from "wouter";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { instructorResources } from "@/const/instructorResources";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function InstructorPortal() {
  useScrollToTop();
  const { isAuthenticated, loading } = useAuth();
  const statusQuery = trpc.instructor.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const assignmentsQuery = trpc.instructor.getMyAssignments.useQuery(undefined, { enabled: isAuthenticated });

  const { upcoming, past } = useMemo(() => {
    const list = [...(assignmentsQuery.data?.assignments ?? [])];
    const sod = startOfTodayLocal();
    const upcomingList: typeof list = [];
    const pastList: typeof list = [];
    for (const a of list) {
      if (!a.scheduledDate) {
        pastList.push(a);
        continue;
      }
      const t = new Date(a.scheduledDate);
      if (t >= sod) upcomingList.push(a);
      else pastList.push(a);
    }
    return { upcoming: upcomingList, past: pastList };
  }, [assignmentsQuery.data?.assignments]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-surface to-background">
        <Card className="max-w-md w-full border-border">
          <CardHeader>
            <CardTitle>Instructor portal</CardTitle>
            <CardDescription>Sign in to view your instructor status and assignments.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full" variant="cta">
                Sign in
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const s = statusQuery.data;
  const certified = s?.certified;
  const approved = s?.approved;
  const unlocked = s?.portalUnlocked;

  const renderAssignment = (a: (typeof upcoming)[0]) => (
    <li
      key={a.id}
      className="rounded-lg border border-border p-4 flex flex-col gap-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">{a.institutionName ?? "Institution"}</p>
          <p className="text-sm text-muted-foreground">
            {a.courseTitle} · <span className="uppercase">{a.programType}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {a.scheduledDate ? new Date(a.scheduledDate).toLocaleString() : "—"}
            {a.startTime || a.endTime
              ? ` · ${[a.startTime, a.endTime].filter(Boolean).join("–")}`
              : ""}
            {a.location ? ` · ${a.location}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {a.trainingType.replace("_", " ")} · {a.enrolledCount ?? 0}/{a.maxCapacity} enrolled
          </p>
        </div>
        <Badge variant="outline" className="capitalize shrink-0 w-fit">
          {a.status ?? "scheduled"}
        </Badge>
      </div>
      {(a.institutionContactName || a.institutionContactEmail || a.institutionContactPhone) && (
        <div className="rounded-md bg-muted/50 border border-border px-3 py-2 text-sm">
          <p className="font-medium text-foreground mb-1 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Hospital contact
          </p>
          {a.institutionContactName ? (
            <p className="text-foreground/90">{a.institutionContactName}</p>
          ) : null}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mt-1.5">
            {a.institutionContactEmail ? (
              <a
                href={`mailto:${a.institutionContactEmail}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {a.institutionContactEmail}
              </a>
            ) : null}
            {a.institutionContactPhone ? (
              <a
                href={`tel:${a.institutionContactPhone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {a.institutionContactPhone}
              </a>
            ) : null}
          </div>
          {!a.institutionContactEmail && !a.institutionContactPhone ? (
            <p className="text-xs text-muted-foreground mt-1">Ask your administrator to add contact details on the institution profile.</p>
          ) : null}
        </div>
      )}
    </li>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background">
      <section className="bg-gradient-to-r from-[var(--brand-teal)] to-[#143333] text-primary-foreground py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-10 w-10 shrink-0 opacity-90" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Instructor portal</h1>
              <p className="mt-2 text-white/90 max-w-2xl">
                Complete the Instructor Course for your instructor number, then receive platform approval to teach on
                institutional schedules.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your status
            </CardTitle>
            <CardDescription>Certification → approval → teaching assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant={certified ? "default" : "secondary"} className="gap-1">
                {certified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                Instructor course
              </Badge>
              <Badge variant={approved ? "default" : "secondary"} className="gap-1">
                {approved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                Platform approval
              </Badge>
            </div>
            {certified && s?.instructorNumber && (
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Instructor number:</span>{" "}
                <span className="font-mono font-semibold">{s.instructorNumber}</span>
              </p>
            )}
            {!certified && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-sm text-foreground/90">
                  Start with the Paeds Resus Instructor Course: enroll, complete modules and the quiz, then pay. Your
                  certificate and instructor number are issued after you pass all assessments.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/enroll">
                    <Button size="sm" variant="cta">
                      Enroll in Instructor Course
                    </Button>
                  </Link>
                  <Link href="/course/instructor">
                    <Button size="sm" variant="outline">
                      Open course
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            {certified && !approved && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 text-sm text-foreground/90">
                You are certified with instructor number <span className="font-mono font-medium">{s?.instructorNumber}</span>.
                A platform admin must approve you under Admin → Reports before you can be assigned to hospital sessions.
              </div>
            )}
            {unlocked && (
              <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                You can be assigned to institutional sessions and see your schedule below.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My assignments
            </CardTitle>
            <CardDescription>
              Hospital sessions where you are the assigned instructor. Upcoming first; contact the institution for
              changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignmentsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading assignments…
              </p>
            ) : !unlocked ? (
              <p className="text-sm text-muted-foreground">
                Assignments appear here after you are certified and approved.
              </p>
            ) : assignmentsQuery.data?.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions assigned yet.</p>
            ) : (
              <div className="space-y-8">
                {upcoming.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Upcoming</h3>
                    <ul className="space-y-3">{upcoming.map(renderAssignment)}</ul>
                  </div>
                ) : null}
                {past.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Past</h3>
                    <ul className="space-y-3 opacity-90">{past.map(renderAssignment)}</ul>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Resources
            </CardTitle>
            <CardDescription>Quick links for instructors. Facilitator PDFs and slide decks can be added here as they ship.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {instructorResources.map((r) => (
                <li
                  key={r.href + r.title}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{r.title}</p>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  </div>
                  {r.external ? (
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary shrink-0"
                    >
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link href={r.href}>
                      <Button variant="outline" size="sm" className="shrink-0">
                        Open
                      </Button>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
