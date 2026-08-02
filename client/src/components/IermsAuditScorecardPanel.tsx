import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Award, CheckCircle2, AlertTriangle, ShieldCheck, FileCheck } from "lucide-react";
import { toast } from "sonner";

interface IermsAuditScorecardPanelProps {
  institutionId: number;
}

const DOMAINS = [
  { id: "domain1", name: "Domain 1: Governance, Policy & 24/7 ERT Activation", max: 20, desc: "ERC active, 24/7 ERTL roster published, whole-hospital reciprocity, < 3 min response." },
  { id: "domain2", name: "Domain 2: Point-of-Care Bedside Guidance (ResusGPS)", max: 20, desc: "Dedicated mobile/tablets present, offline PWA verified, weight dosing & CPR clock used." },
  { id: "domain3", name: "Domain 3: Safety Culture & Care Signal QI", max: 20, desc: "Care Signal active, monthly QI committee meetings, 30-day FPKB gap resolution." },
  { id: "domain4", name: "Domain 4: Clinical Workforce Competency & AHA Mesh", max: 20, desc: "Family-centered ACLS baseline (>75% RNs), targeted PALS/NRP, 3-tier instructor pipeline." },
  { id: "domain5", name: "Domain 5: Physical Readiness & Crash Cart Audits", max: 20, desc: "Broselow cart layout, 100% paeds equipment sizing, daily seal checks & monthly audits." },
];

export function IermsAuditScorecardPanel({ institutionId }: IermsAuditScorecardPanelProps) {
  const utils = trpc.useUtils();
  const [domain1, setDomain1] = useState(15);
  const [domain2, setDomain2] = useState(15);
  const [domain3, setDomain3] = useState(15);
  const [domain4, setDomain4] = useState(15);
  const [domain5, setDomain5] = useState(15);
  const [notes, setNotes] = useState("");

  const { data: latestScorecard, isLoading } = trpc.institution.getLatestIermsAuditScorecard.useQuery(
    { institutionId },
    { enabled: !!institutionId }
  );

  const submitAuditMutation = trpc.institution.submitIermsAuditScorecard.useMutation({
    onSuccess: (res) => {
      toast.success(`IERMS™ Audit Submitted! Score: ${res.totalScore}/100 (${res.accreditationLevel.replace("level_", "Level ").replace("_", " ").toUpperCase()})`);
      void utils.institution.getLatestIermsAuditScorecard.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to submit audit scorecard"),
  });

  const calculatedTotal = domain1 + domain2 + domain3 + domain4 + domain5;

  function getTierBadge(level: string | undefined, score: number | undefined) {
    if (!level && score === undefined) return null;
    const pts = score ?? 0;
    if (pts >= 90) return <Badge className="bg-emerald-600 text-white font-bold text-sm">Level 4: High-Reliability Exemplar</Badge>;
    if (pts >= 70) return <Badge className="bg-primary text-white font-bold text-sm">Level 3: IERMS™ Certified</Badge>;
    if (pts >= 50) return <Badge className="bg-amber-600 text-white font-bold text-sm">Level 2: Baseline Functional</Badge>;
    return <Badge className="bg-red-600 text-white font-bold text-sm">Level 1: Unprepared / High Risk</Badge>;
  }

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading IERMS™ Audit Data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Active Accreditation Status Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                IERMS™ Facility Accreditation Status
              </CardTitle>
              <CardDescription>
                Official 100-Point Audit Scorecard & Annual Accreditation
              </CardDescription>
            </div>
            {latestScorecard ? (
              getTierBadge(latestScorecard.accreditationLevel, latestScorecard.totalScore)
            ) : (
              <Badge variant="outline" className="text-muted-foreground">No Audit Logged Yet</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {latestScorecard ? (
            <div className="grid md:grid-cols-4 gap-4 mt-2">
              <div className="bg-background p-4 rounded-lg border border-border/60">
                <p className="text-xs text-muted-foreground">Total Audit Score</p>
                <p className="text-3xl font-bold text-primary">{latestScorecard.totalScore} / 100</p>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border/60">
                <p className="text-xs text-muted-foreground">Audit Date</p>
                <p className="text-sm font-semibold">{new Date(latestScorecard.auditDate).toLocaleDateString()}</p>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border/60">
                <p className="text-xs text-muted-foreground">Accreditation Valid Until</p>
                <p className="text-sm font-semibold">{new Date(latestScorecard.validUntil).toLocaleDateString()}</p>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border/60">
                <p className="text-xs text-muted-foreground">Breakdown (D1-D5)</p>
                <p className="text-xs font-mono font-medium mt-1">
                  D1:{latestScorecard.domain1Score} | D2:{latestScorecard.domain2Score} | D3:{latestScorecard.domain3Score} | D4:{latestScorecard.domain4Score} | D5:{latestScorecard.domain5Score}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Perform your baseline audit below to calculate your IERMS™ score and accreditation tier.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Interactive Audit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Perform IERMS™ 100-Point Audit Evaluation
          </CardTitle>
          <CardDescription>
            Evaluated across the 5 canonical IERMS™ readiness domains (20 points per domain).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Domain 1 */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-base">{DOMAINS[0].name}</Label>
                <span className="font-bold text-primary">{domain1} / 20 pts</span>
              </div>
              <p className="text-xs text-muted-foreground">{DOMAINS[0].desc}</p>
              <input
                type="range"
                min="0"
                max="20"
                value={domain1}
                onChange={(e) => setDomain1(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Domain 2 */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-base">{DOMAINS[1].name}</Label>
                <span className="font-bold text-primary">{domain2} / 20 pts</span>
              </div>
              <p className="text-xs text-muted-foreground">{DOMAINS[1].desc}</p>
              <input
                type="range"
                min="0"
                max="20"
                value={domain2}
                onChange={(e) => setDomain2(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Domain 3 */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-base">{DOMAINS[2].name}</Label>
                <span className="font-bold text-primary">{domain3} / 20 pts</span>
              </div>
              <p className="text-xs text-muted-foreground">{DOMAINS[2].desc}</p>
              <input
                type="range"
                min="0"
                max="20"
                value={domain3}
                onChange={(e) => setDomain3(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Domain 4 */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-base">{DOMAINS[3].name}</Label>
                <span className="font-bold text-primary">{domain4} / 20 pts</span>
              </div>
              <p className="text-xs text-muted-foreground">{DOMAINS[3].desc}</p>
              <input
                type="range"
                min="0"
                max="20"
                value={domain4}
                onChange={(e) => setDomain4(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Domain 5 */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-base">{DOMAINS[4].name}</Label>
                <span className="font-bold text-primary">{domain5} / 20 pts</span>
              </div>
              <p className="text-xs text-muted-foreground">{DOMAINS[4].desc}</p>
              <input
                type="range"
                min="0"
                max="20"
                value={domain5}
                onChange={(e) => setDomain5(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auditNotes">Audit Notes & Action Items</Label>
            <Textarea
              id="auditNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record specific gaps, equipment deficits, or governance recommendations identified during audit..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Calculated Score:</p>
              <p className="text-2xl font-bold text-primary">{calculatedTotal} / 100 Pts</p>
            </div>
            <Button
              onClick={() =>
                submitAuditMutation.mutate({
                  institutionId,
                  domain1Score: domain1,
                  domain2Score: domain2,
                  domain3Score: domain3,
                  domain4Score: domain4,
                  domain5Score: domain5,
                  notes,
                })
              }
              disabled={submitAuditMutation.isPending}
              className="bg-[#1a4d4d] hover:bg-[#0d3333]"
            >
              {submitAuditMutation.isPending ? "Submitting Audit..." : "Submit Official Audit Scorecard"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
