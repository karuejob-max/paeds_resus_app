import { ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const COURSES = [
  { key: "bls", label: "BLS", description: "Basic life support foundations" },
  {
    key: "acls",
    label: "ACLS",
    description: "Advanced cardiovascular life support",
  },
  {
    key: "pals",
    label: "PALS",
    description: "Paediatric advanced life support",
  },
  { key: "nrp", label: "NRP", description: "Neonatal resuscitation" },
] as const;

type Props = { onOpenHub: () => void };

/**
 * ILSP is the institutional competency route. These are linked course tracks,
 * not certificates issued by ILSP. The hub owns enrollment, progress, evidence,
 * and credential boundaries for each course.
 */
export function IlsRelatedCourseAccess({ onOpenHub }: Props) {
  return (
    <Card className="border-sky-200 bg-sky-50/40 dark:border-sky-900 dark:bg-sky-950/20">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-sky-700" />
              Related life-support courses
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Continue or enrol in BLS, ACLS, PALS, or NRP from one course hub.
              Each course keeps its own progress, evidence, and certificate
              rules.
            </p>
          </div>
          <Badge variant="outline">Separate credential tracks</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COURSES.map(course => (
            <div
              key={course.key}
              className="rounded-lg border bg-background p-3"
            >
              <p className="font-semibold">{course.label}</p>
              <p className="mt-1 min-h-10 text-xs text-muted-foreground">
                {course.description}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Open the hub to see eligibility and current progress.
              </p>
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={onOpenHub}>
          Open life-support course hub
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Completing ILSP does not automatically issue an AHA or NRP
          certificate. Evidence and certification are reviewed through the
          relevant course track.
        </p>
      </CardContent>
    </Card>
  );
}
