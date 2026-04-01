import { Link } from "wouter";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { BookOpen, Calendar, CheckCircle2, GraduationCap, Loader2, Lock, Shield } from "lucide-react";

export default function InstructorPortal() {
  useScrollToTop();
  const { isAuthenticated, loading } = useAuth();
  const statusQuery = trpc.instructor.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const assignmentsQuery = trpc.instructor.getMyAssignments.useQuery(undefined, { enabled: isAuthenticated });

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
            <CardDescription>Hospital sessions where you are the assigned instructor</CardDescription>
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
              <ul className="space-y-3">
                {assignmentsQuery.data?.assignments.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium text-foreground">{a.institutionName ?? "Institution"}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.courseTitle} · <span className="uppercase">{a.programType}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {a.scheduledDate ? new Date(a.scheduledDate).toLocaleString() : "—"}
                        {a.location ? ` · ${a.location}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0">
                      {a.status ?? "scheduled"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Resources
            </CardTitle>
            <CardDescription>Central place for instructor materials (coming next)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Slide decks, facilitator notes, and updates will be linked here as product rolls out. For now, use your
              learner dashboard and hospital admin contacts for session details.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
