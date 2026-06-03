import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FellowshipLearnerPageLayout } from "@/components/fellowship/FellowshipLearnerPageLayout";
import { ClinicalContentSafetyFooter } from "@/components/ClinicalContentSafetyFooter";
import {
  FELLOWSHIP_ABOUT_SECTIONS,
  FELLOWSHIP_MISSION_TAGLINE,
} from "@shared/fellowship-learner-content";

export default function FellowshipAbout() {
  return (
    <FellowshipLearnerPageLayout
      title="Paeds Resus Fellowship guide"
      description="What the Fellowship is, how the three pillars work, and what Paeds Resus Fellow means for you and your patients."
      path="/fellowship/about"
    >
      <div className="space-y-6">
        {FELLOWSHIP_ABOUT_SECTIONS.map((section) => (
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

        <Card className="bg-muted/40">
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">{FELLOWSHIP_MISSION_TAGLINE}</p>
            <p>
              Honest answers about exams, patient impact, and Care Signal:{" "}
              <Link href="/fellowship/why" className="text-primary underline-offset-2 hover:underline">
                Practitioner Q&amp;A
              </Link>
              . Summative rules and retries:{" "}
              <Link href="/learning/exam-policy" className="text-primary underline-offset-2 hover:underline">
                Assessment policy
              </Link>
            </p>
          </CardContent>
        </Card>

        <ClinicalContentSafetyFooter surfaceId="fellowship-about" surface="fellowship_player" />
      </div>
    </FellowshipLearnerPageLayout>
  );
}
