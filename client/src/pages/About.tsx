import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Stethoscope, Users } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function About() {
  usePageMeta({
    title: "About Paeds Resus — An adaptive learning system for paediatric emergency care",
    description:
      "Paeds Resus exists to close the gap between what's known to save children and what reaches them in time. Bedside guidance, training, and quality improvement, working as one learning system across Kenya and East Africa.",
    path: "/about",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal via-background to-card text-foreground py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-foreground">About Paeds Resus</h1>
        <p className="text-lg text-muted-foreground">
          No child should die from preventable causes. Most of the time, that isn't because the right care is
          unknown — it's because it doesn't reach the child in time, in the right sequence, at the right moment.
          Paeds Resus exists to close that gap.
        </p>
        <p className="text-lg text-muted-foreground">
          We're not a training company with extra tools attached. We're an adaptive learning system: ResusGPS
          guides providers through time-critical decisions at the bedside, training builds the underlying
          competence, and Care Signal — together with Safe-Truth, which carries the family's side of the story —
          turns every case into a lesson the whole system learns from. The loop is the product. The next provider,
          the next hospital, the next country, benefits from what was learned at a bedside before them — the way
          aviation safety improves from every reported near-miss.
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>ResusGPS and protocols for time-critical decisions</li>
          <li>Certified courses (BLS, ACLS, PALS, fellowship pathways)</li>
          <li>Care Signal for clinicians and Safe-Truth for families — quality improvement</li>
          <li>Institutional programmes, analytics, and scale</li>
        </ul>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base inline-flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Clinical scope
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              ResusGPS is designed to support provider decision-making at point of care. It does not replace local
              protocols, clinical leadership, or licensing frameworks.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Institutional model
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              We support institutions with training operations, staff pathways, and dashboard-based visibility for
              implementation follow-through.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Trust posture
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              We avoid unsupported outcome claims. Product and programme language is intentionally scoped to what the
              platform can verify and deliver.
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/institutional">
            <Button variant="cta">For institutions</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Platform home</Button>
          </Link>
          <Link href="/enroll">
            <Button variant="outline">Enrol</Button>
          </Link>
          <Link href="/help">
            <Button variant="ghost">Help</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
