import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type InstitutionalProofPoint = {
  summary: string;
  sourceLabel: string;
  timeframe: string;
};

const PENDING_PROOF: InstitutionalProofPoint = {
  summary:
    "Publishable facility evidence and testimonials will be added after the relevant organisation has approved the exact wording, figures, and attribution.",
  sourceLabel: "Approved institutional evidence",
  timeframe: "Publication pending consent",
};

export default function InstitutionalProofSection({
  proofPoint = PENDING_PROOF,
}: {
  proofPoint?: InstitutionalProofPoint;
}) {
  return (
    <section aria-labelledby="proof-heading">
      <div className="mb-5 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Proof, not promises
        </p>
        <h2 id="proof-heading" className="mt-2 text-3xl font-bold">
          What readiness work looks like on the ground.
        </h2>
        <p className="mt-3 text-muted-foreground">
          We will publish only evidence that is accurate, attributable, and
          approved for public use. No outcome, mortality, or facility claim is
          implied by this placeholder.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{proofPoint.sourceLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-muted-foreground">
            {proofPoint.summary}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {proofPoint.timeframe}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
