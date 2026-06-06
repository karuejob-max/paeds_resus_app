import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, GraduationCap } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ClinicalContentSafetyFooter } from "@/components/ClinicalContentSafetyFooter";
import {
  EXAM_POLICY_ADMIN_RESET_SECTION,
  EXAM_POLICY_AHA_GAPS,
  EXAM_POLICY_COMPARE_ROWS,
  EXAM_POLICY_PAGE,
  EXAM_POLICY_SECTIONS,
  EXAM_POLICY_TRACK_INTROS,
} from "@shared/exam-policy-learner-content";

export default function ExamPolicy() {
  usePageMeta({
    title: EXAM_POLICY_PAGE.title,
    description: EXAM_POLICY_PAGE.description,
    path: EXAM_POLICY_PAGE.path,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal/10 via-background to-card py-8 px-4 md:py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Link href="/fellowship">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Fellowship
              </Button>
            </Link>
            <Link href="/aha-courses">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <GraduationCap className="h-4 w-4" />
                AHA courses
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary shrink-0" />
            {EXAM_POLICY_PAGE.title}
          </h1>
          <p className="text-muted-foreground text-lg">{EXAM_POLICY_PAGE.description}</p>
        </div>

        {EXAM_POLICY_TRACK_INTROS.map((track) => (
          <section key={track.id} id={track.id} className="scroll-mt-20 space-y-3">
            <h2 className="text-2xl font-bold text-foreground">{track.title}</h2>
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground">
                {track.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
                <ul className="list-disc list-inside space-y-2">
                  {track.bullets.map((b) => (
                    <li key={b.slice(0, 40)}>{b}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        ))}

        <h2 className="text-xl font-semibold text-foreground">Shared assessment rules</h2>

        {EXAM_POLICY_SECTIONS.map((section) => (
          <Card key={section.id} id={section.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
              {section.bullets && (
                <ul className="list-disc list-inside space-y-2">
                  {section.bullets.map((b) => (
                    <li key={b.slice(0, 40)}>{b}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Fellowship vs AHA — quick comparison</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3 font-semibold text-foreground">Rule</th>
                  <th className="py-2 pr-3 font-semibold text-foreground">Fellowship micro-courses</th>
                  <th className="py-2 font-semibold text-foreground">AHA (BLS / ACLS / PALS / NRP)</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {EXAM_POLICY_COMPARE_ROWS.map((row) => (
                  <tr key={row.rule} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-medium text-foreground">{row.rule}</td>
                    <td className="py-2 pr-3">{row.fellowship}</td>
                    <td className="py-2">{row.aha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card id={EXAM_POLICY_ADMIN_RESET_SECTION.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{EXAM_POLICY_ADMIN_RESET_SECTION.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {EXAM_POLICY_ADMIN_RESET_SECTION.paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
            <ul className="list-disc list-inside space-y-2">
              {EXAM_POLICY_ADMIN_RESET_SECTION.bullets.map((b) => (
                <li key={b.slice(0, 40)}>{b}</li>
              ))}
            </ul>
            <p>
              <Link href="/admin/reports" className="text-primary underline-offset-2 hover:underline">
                Admin enrollment ledger
              </Link>
              {" "}
              (Platform Admin → Reports → Enrollment ledger).
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rules on Fellowship, not on AHA</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              {EXAM_POLICY_AHA_GAPS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <ClinicalContentSafetyFooter surfaceId="exam-policy" surface="fellowship_player" />
      </div>
    </div>
  );
}
