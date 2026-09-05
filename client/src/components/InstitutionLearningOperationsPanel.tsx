import { useState } from "react";
import {
  Award,
  BookOpenCheck,
  CalendarDays,
  FileBarChart2,
  GraduationCap,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CohortProgressWidget } from "@/components/CohortProgressWidget";
import { Phase1ProofReviewWidget } from "@/components/Phase1ProofReviewWidget";
import { InstitutionIersCompetencyPanel } from "@/components/InstitutionIersCompetencyPanel";
import CpdPanel from "@/components/CpdPanel";
import InstitutionLearningIntelligencePanel from "@/components/InstitutionLearningIntelligencePanel";
import InstitutionLearningGovernancePanel from "@/components/InstitutionLearningGovernancePanel";
import { StaffPerformanceRoster } from "@/components/StaffPerformanceRoster";

type LearningTab =
  | "overview"
  | "competency"
  | "cpd"
  | "intelligence"
  | "governance";

function getInitialLearningTab(): LearningTab {
  if (typeof window === "undefined") return "overview";
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("learningTab");
  if (
    requested === "competency" ||
    requested === "cpd" ||
    requested === "intelligence" ||
    requested === "governance"
  )
    return requested;
  if (params.get("cpdTab")) return "cpd";
  return "overview";
}

export default function InstitutionLearningOperationsPanel({
  institutionId,
  iersEnabled,
  cpdEnabled,
  onOpenReadiness,
  isInstitutionAdmin = false,
  controlledActiveTab,
  onLearningTabChange,
}: {
  institutionId: number;
  iersEnabled: boolean;
  cpdEnabled: boolean;
  onOpenReadiness?: () => void;
  isInstitutionAdmin?: boolean;
  controlledActiveTab?: LearningTab;
  onLearningTabChange?: (tab: LearningTab) => void;
}) {
  const [internalActiveTab, setInternalActiveTab] = useState<LearningTab>(() => {
    const requested = getInitialLearningTab();
    if (requested === "competency" && !iersEnabled) {
      return cpdEnabled ? "cpd" : "overview";
    }
    if ((requested === "cpd" || requested === "governance") && !cpdEnabled) {
      return iersEnabled ? "competency" : "overview";
    }
    if (requested === "intelligence" && !iersEnabled && !cpdEnabled) {
      return "overview";
    }
    return requested;
  });

  const activeTab = controlledActiveTab ?? internalActiveTab;

  const setLearningTab = (tab: LearningTab) => {
    setInternalActiveTab(tab);
    onLearningTabChange?.(tab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("section", "learning");
      params.set("learningTab", tab);
      if (tab === "cpd") params.set("cpdTab", "overview");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`
      );
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-5 w-5 text-blue-700" />
            Learning Operations
          </CardTitle>
          <CardDescription>
            Organise institutional learning from enrolment through completion
            and records. Providers complete their personal learning in the
            individual portal; this workspace manages the institution’s cohort
            and evidence view.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-xs sm:grid-cols-3">
          <div>
            <p className="font-semibold text-blue-950 dark:text-blue-100">
              Institutional competency
            </p>
            <p className="text-muted-foreground">
              Schedules, attendance, readiness competency, and proof review.
            </p>
          </div>
          <div>
            <p className="font-semibold text-blue-950 dark:text-blue-100">
              Institutional Life Support
            </p>
            <p className="text-muted-foreground">
              Enrol linked providers at KES 10,000 per provider for Paeds Resus competency training.
            </p>
          </div>
          <div>
            <p className="font-semibold text-blue-950 dark:text-blue-100">
              CPD Portal
            </p>
            <p className="text-muted-foreground">
              Professional-development sessions, certificates, and
              staff-development records.
            </p>
          </div>
          <div>
            <p className="font-semibold text-blue-950 dark:text-blue-100">
              Boundary
            </p>
            <p className="text-muted-foreground">
              Completion or attendance does not prove emergency readiness or
              bedside competence.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={value => setLearningTab(value as LearningTab)}
      >
        <TabsList className="sticky top-2 z-20 grid h-auto min-w-0 w-full grid-cols-1 gap-1 bg-background/95 p-1 shadow-sm backdrop-blur min-[420px]:grid-cols-2 sm:grid-cols-5 sm:static sm:bg-transparent sm:p-0 sm:shadow-none">
          <TabsTrigger value="overview" className="min-h-10 min-w-0 whitespace-normal px-2 text-center text-xs leading-tight sm:text-sm">
            <BookOpenCheck className="mr-2 hidden h-4 w-4 sm:block" />
            Learning overview
          </TabsTrigger>
          {iersEnabled && (
            <TabsTrigger
              value="competency"
              className="min-h-10 min-w-0 whitespace-normal px-2 text-center text-xs leading-tight sm:text-sm"
            >
              <CalendarDays className="mr-2 hidden h-4 w-4 sm:block" />
              Cohorts & competency
            </TabsTrigger>
          )}
          {cpdEnabled && (
            <TabsTrigger value="cpd" className="min-h-10 min-w-0 whitespace-normal px-2 text-center text-xs leading-tight sm:text-sm">
              <Award className="mr-2 hidden h-4 w-4 sm:block" />
              CPD sessions
            </TabsTrigger>
          )}
          {cpdEnabled && (
            <TabsTrigger
              value="intelligence"
              className="min-h-10 min-w-0 whitespace-normal px-2 text-center text-xs leading-tight sm:text-sm"
            >
              Reports & insights
            </TabsTrigger>
          )}
          {cpdEnabled && (
            <TabsTrigger
              value="governance"
              className="min-h-10 min-w-0 whitespace-normal px-2 text-center text-xs leading-tight sm:text-sm"
            >
              People & targets
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {iersEnabled && (
              <Card>
                <CardHeader className="pb-3">
                  <UsersRound className="h-5 w-5 text-blue-700" />
                  <CardTitle className="text-base">Set up a cohort</CardTitle>
                  <CardDescription>
                    Enrol staff and assign an institutional learning activity.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => setLearningTab("competency")}
                  >
                    Open cohorts & competency
                  </Button>
                </CardContent>
              </Card>
            )}
            {iersEnabled && (
              <Card>
                <CardHeader className="pb-3">
                  <CalendarDays className="h-5 w-5 text-emerald-700" />
                  <CardTitle className="text-base">
                    Schedule competency
                  </CardTitle>
                  <CardDescription>
                    Plan sessions, attendance, and readiness competency
                    evidence.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => setLearningTab("competency")}
                  >
                    Open institutional competency
                  </Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <GraduationCap className="h-5 w-5 text-blue-700" />
                <CardTitle className="text-base">Institutional Life Support Training</CardTitle>
                <CardDescription>
                  Enrol linked provider accounts at KES 10,000 each. Completion issues a Paeds Resus certificate; AHA credentialing is a separate, time-limited request.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => window.location.assign("/training/institutional-life-support")}
                >
                  Open Institutional Life Support
                </Button>
              </CardContent>
            </Card>
            {cpdEnabled && (
              <Card>
                <CardHeader>
                  <Award className="h-5 w-5 text-violet-700" />
                  <CardTitle className="text-base">
                    Manage CPD records
                  </CardTitle>
                  <CardDescription>
                    Run professional-development sessions and issue records.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => setLearningTab("cpd")}
                  >
                    Open CPD Portal
                  </Button>
                </CardContent>
              </Card>
            )}
            {cpdEnabled && (
              <Card>
                <CardHeader>
                  <FileBarChart2 className="h-5 w-5 text-blue-700" />
                  <CardTitle className="text-base">
                    See learning intelligence
                  </CardTitle>
                  <CardDescription>
                    Compare departments and people to learning targets, then
                    download stakeholder reports.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => setLearningTab("intelligence")}
                  >
                    Open intelligence
                  </Button>
                </CardContent>
              </Card>
            )}
            {cpdEnabled && (
              <Card>
                <CardHeader>
                  <UserRoundCheck className="h-5 w-5 text-emerald-700" />
                  <CardTitle className="text-base">
                    Set coordinators and targets
                  </CardTitle>
                  <CardDescription>
                    Give each department a coordinator and define facility,
                    department, or individual expectations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => setLearningTab("governance")}
                  >
                    Open governance
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Institutional learning journey
              </CardTitle>
              <CardDescription>
                Use the stages in order; do not treat any one stage as proof of
                clinical performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-5">
              {[
                ["1", "Need", "Identify the readiness or development gap."],
                ["2", "Enrol", "Import or invite the right staff."],
                ["3", "Train", "Schedule competency or CPD activity."],
                ["4", "Verify", "Review attendance, completion, and records."],
                [
                  "5",
                  "Improve",
                  "Use readiness evidence and actions to follow up.",
                ],
              ].map(([step, label, detail]) => (
                <div key={step} className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                      {step}
                    </span>
                    {label}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competency" className="mt-6 space-y-6">
          <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-base">
                Cohorts & institutional competency
              </CardTitle>
              <CardDescription>
                Enrol staff, schedule institutional competency, record
                attendance, and review proof. These records remain separate from
                CPD and individual bedside activity.
              </CardDescription>
            </CardHeader>
          </Card>
          {iersEnabled && (
            <>
              <Card className="border-violet-200 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/20">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">Institutional Life Support cohorts use the ILS workspace</p>
                    <p className="mt-1 text-sm text-muted-foreground">The institution selects linked Paeds Resus accounts and pays once per cohort. Individual BLS/ACLS/PALS payment is not started from this Learning workspace.</p>
                  </div>
                  <Button asChild variant="outline" className="shrink-0"><a href="/training/institutional-life-support">Open ILS operations <GraduationCap className="ml-2 h-4 w-4" /></a></Button>
                </CardContent>
              </Card>
              <InstitutionIersCompetencyPanel institutionId={institutionId} />
              <CohortProgressWidget institutionId={institutionId} />
              <Phase1ProofReviewWidget institutionId={institutionId} />
            </>
          )}
        </TabsContent>

        <TabsContent value="cpd" className="mt-6 space-y-6">
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-3">
              <div><p className="font-semibold">Create</p><p className="text-muted-foreground">Use the department-aware form below. This is now the single CPD session creation route.</p></div>
              <div><p className="font-semibold">Operate</p><p className="text-muted-foreground">Use Sessions & Check-In for the QR link, attendance, certificates, and exports.</p></div>
              <div><p className="font-semibold">Understand</p><p className="text-muted-foreground">Use People & targets for scoped coordination and follow-up; use Reports & insights for analysis.</p></div>
            </CardContent>
          </Card>
          <InstitutionLearningGovernancePanel institutionId={institutionId} mode="sessions" isInstitutionAdmin={isInstitutionAdmin} />
          <CpdPanel institutionId={institutionId} compact />
        </TabsContent>

        <TabsContent value="intelligence" className="mt-6">
          <InstitutionLearningIntelligencePanel
            institutionId={institutionId}
            onOpenReadiness={iersEnabled ? onOpenReadiness : undefined}
          />
        </TabsContent>

        <TabsContent value="governance" className="mt-6 space-y-6">
          <InstitutionLearningGovernancePanel institutionId={institutionId} mode="people" isInstitutionAdmin={isInstitutionAdmin} />
          {isInstitutionAdmin ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold">Staff development follow-up</h3>
                <p className="text-sm text-muted-foreground">Protected institution-admin appraisal view. Department coordinators do not receive this institution-wide people list.</p>
              </div>
              <StaffPerformanceRoster />
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
