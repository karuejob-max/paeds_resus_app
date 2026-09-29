import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type InstitutionalProofPoint = {
  summary: string;
  sourceLabel: string;
  timeframe: string;
};

export default function InstitutionalProofSection({
  proofPoint,
}: {
  proofPoint?: InstitutionalProofPoint;
}) {
  if (!proofPoint) return null;

  return (
    <section aria-labelledby="proof-heading">
      <div className="mb-5 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Approved evidence
        </p>
        <h2 id="proof-heading" className="mt-2 text-3xl font-bold">
          What readiness work looks like on the ground.
        </h2>
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
