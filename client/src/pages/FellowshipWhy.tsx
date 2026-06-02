import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FellowshipLearnerPageLayout } from "@/components/fellowship/FellowshipLearnerPageLayout";
import { FELLOWSHIP_PRACTITIONER_QA } from "@shared/fellowship-learner-content";

export default function FellowshipWhy() {
  return (
    <FellowshipLearnerPageLayout
      title="Fellowship — honest questions"
      description="CEO-framed answers on exams, the Fellow title, Care Signal, and turning learning into safer care."
      path="/fellowship/why"
      showWhyLink={false}
    >
      <div className="space-y-4">
        {FELLOWSHIP_PRACTITIONER_QA.map((item) => (
          <Card key={item.question}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold leading-snug">{item.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </FellowshipLearnerPageLayout>
  );
}
