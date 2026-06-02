import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, BookOpen, CheckCircle2, Clock, Download, Heart, Loader2, Stethoscope } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CERTIFICATE_COMPETENCE_DISCLAIMER_SHORT } from "@shared/fellowship-learner-content";

type PillarSlice = {
  percentage: number;
  completed?: number;
  required?: number;
  conditionsWithThreshold?: number;
  totalConditionsTaught?: number;
  streak?: number;
};

export type FellowshipGraduationCardProps = {
  isQualified: boolean;
  fellowTitleEnabled: boolean;
  canDisplayFellowTitle: boolean;
  coursesPillar: PillarSlice & { completed: number; required: number };
  resusGPSPillar: PillarSlice & {
    conditionsWithThreshold: number;
    totalConditionsTaught: number;
  };
  careSignalPillar: PillarSlice & { streak: number };
  diplomaCertificateNumber?: string | null;
  onGraduationClaimed?: () => void;
};

function PillarRow({
  label,
  icon: Icon,
  percentage,
  detail,
}: {
  label: string;
  icon: typeof BookOpen;
  percentage: number;
  detail: string;
}) {
  const done = percentage >= 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <Badge variant={done ? "default" : "secondary"}>{percentage}%</Badge>
      </div>
      <Progress value={percentage} className="h-1.5" />
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

export function FellowshipGraduationCard({
  isQualified,
  fellowTitleEnabled,
  canDisplayFellowTitle,
  coursesPillar,
  resusGPSPillar,
  careSignalPillar,
  diplomaCertificateNumber,
  onGraduationClaimed,
}: FellowshipGraduationCardProps) {
  const utils = trpc.useUtils();
  const [claimed, setClaimed] = useState(false);
  const claimMutation = trpc.fellowship.claimGraduation.useMutation({
    onSuccess: async (res) => {
      if (res.success) {
        setClaimed(true);
        toast.success(
          res.alreadyIssued
            ? "Paeds Resus Fellow credential already on your account."
            : "Congratulations — you are now a Paeds Resus Fellow on the platform."
        );
        await utils.fellowship.getProgress.invalidate();
        await utils.certificates.getMyCertificates.invalidate();
        onGraduationClaimed?.();
      }
    },
    onError: (e) => toast.error(e.message || "Could not claim Fellow title"),
  });

  const downloadCert = trpc.certificates.download.useMutation({
    onSuccess: (res) => {
      if (res.success && res.pdfBase64) {
        try {
          const byteCharacters = atob(res.pdfBase64);
          const byteArray = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([byteArray], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = res.filename || "paeds-resus-fellow-diploma.pdf";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success("Diploma downloaded");
        } catch {
          toast.error("Failed to save PDF");
        }
      } else {
        toast.error(typeof res.error === "string" ? res.error : "Download failed");
      }
    },
    onError: (e) => toast.error(e.message || "Download failed"),
  });

  const hasDiploma = Boolean(diplomaCertificateNumber);
  const showFellowUi = (canDisplayFellowTitle && (hasDiploma || claimed)) || claimed;
  const showClaimButton =
    isQualified && fellowTitleEnabled && !hasDiploma && !claimed && !claimMutation.isSuccess;
  const allPillarsComplete = isQualified;

  return (
    <Card
      className={
        allPillarsComplete
          ? "border-2 border-primary/30 bg-primary/5"
          : "border-dashed"
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          {showFellowUi ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              Paeds Resus Fellow
            </>
          ) : allPillarsComplete ? (
            <>
              <Clock className="h-6 w-6 text-amber-600" />
              All three pillars complete
            </>
          ) : (
            <>
              <Award className="h-6 w-6 text-primary" />
              Path to Paeds Resus Fellow
            </>
          )}
        </CardTitle>
        <CardDescription>
          {showFellowUi
            ? "You have claimed the Fellow title on this platform."
            : allPillarsComplete
              ? "You've completed all three pillars. The Fellow credential unlocks when the platform completes final review."
              : "Complete all three pillars to 100% to qualify for the Paeds Resus Fellow pathway credential."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4 rounded-lg border bg-card/80 p-4">
          <PillarRow
            label="Pillar 1: Courses"
            icon={BookOpen}
            percentage={coursesPillar.percentage}
            detail={`${coursesPillar.completed} of ${coursesPillar.required} fellowship micro-courses`}
          />
          <PillarRow
            label="Pillar 2: ResusGPS"
            icon={Stethoscope}
            percentage={resusGPSPillar.percentage}
            detail={`${resusGPSPillar.conditionsWithThreshold} of ${resusGPSPillar.totalConditionsTaught} conditions with ≥3 cases`}
          />
          <PillarRow
            label="Pillar 3: Care Signal"
            icon={Heart}
            percentage={careSignalPillar.percentage}
            detail={`${careSignalPillar.streak} of 24 consecutive qualifying months`}
          />
        </div>

        {showFellowUi && (
          <p className="text-xs text-muted-foreground border-l-2 border-amber-500/50 pl-3">
            {CERTIFICATE_COMPETENCE_DISCLAIMER_SHORT}{" "}
            <Link href="/fellowship/about#fellow-title" className="text-primary underline-offset-2 hover:underline">
              Read more
            </Link>
          </p>
        )}

        {showClaimButton && (
          <Button
            className="w-full gap-2"
            size="lg"
            disabled={claimMutation.isPending}
            onClick={() => claimMutation.mutate()}
          >
            {claimMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            Claim Paeds Resus Fellow
          </Button>
        )}

        {allPillarsComplete && !fellowTitleEnabled && (
          <p className="text-sm text-muted-foreground">
            Your progress is saved.{" "}
            <Link href="/fellowship/about" className="text-primary font-medium underline-offset-2 hover:underline">
              Learn what Fellow means
            </Link>
          </p>
        )}

        {showFellowUi && diplomaCertificateNumber && (
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={downloadCert.isPending}
            onClick={() =>
              downloadCert.mutate({ certificateNumber: diplomaCertificateNumber })
            }
          >
            {downloadCert.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download fellowship diploma
          </Button>
        )}

        {!allPillarsComplete && (
          <p className="text-sm text-muted-foreground">
            <Link href="/fellowship/about" className="text-primary underline-offset-2 hover:underline">
              Fellowship guide
            </Link>{" "}
            — how pillars, exams, and the Fellow title work.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
