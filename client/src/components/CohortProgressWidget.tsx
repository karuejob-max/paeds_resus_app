import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText } from "lucide-react";

/**
 * Per-cadre cohort completion table + the INST-20 "Readiness summary (PDF)"
 * download button. Extracted from client/src/pages/InstitutionalPortal.tsx
 * (2026-08-07) -- that page is not imported or routed anywhere in the app,
 * so this widget, including the PDF button built for it, was unreachable by
 * any real user since it shipped. Moved here so it can be rendered from the
 * actual live coordinator portal, client/src/pages/HospitalAdminDashboard.tsx
 * (routed at /hospital-admin-dashboard).
 */
export function CohortProgressWidget({ institutionId }: { institutionId: number }) {
  const { data: cohortStats, isLoading } = trpc.institution.getCohortProgress.useQuery({ institutionId });

  if (isLoading) return <p className="text-sm text-slate-500 py-4 text-center">Loading cohort metrics...</p>;
  if (!cohortStats || cohortStats.length === 0) return null;

  const displayNameMap: Record<string, string> = {
    noi: "NOI (Nursing Officer Intern)",
    coi_bsc: "Clinical Officer Intern (BSc)",
    coi_diploma: "Diploma COI",
    moi: "MOI (Medical Officer Intern)",
    permanent_nurse: "Permanent Nurse",
    permanent_doctor: "Permanent Doctor",
    other: "Other"
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-900" />
          Intern Cohort Progress
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/api/institution/${institutionId}/cohort-readiness-summary.pdf`, "_blank")}
        >
          <FileText className="w-4 h-4 mr-1.5" />
          Readiness summary (PDF)
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left py-2 px-3 font-semibold">Cohort</th>
                <th className="text-center py-2 px-3 font-semibold">Total</th>
                <th className="text-center py-2 px-3 font-semibold">BLS Complete</th>
                <th className="text-center py-2 px-3 font-semibold">ACLS Complete</th>
                <th className="text-center py-2 px-3 font-semibold">Phase 2 Complete</th>
              </tr>
            </thead>
            <tbody>
              {cohortStats.map((row) => {
                const designationKey = row.designation || "other";
                return (
                  <tr key={designationKey} className="border-b">
                    <td className="py-2 px-3 font-medium text-slate-800">{displayNameMap[designationKey] || designationKey}</td>
                    <td className="text-center py-2 px-3">{row.totalCount}</td>
                    <td className="text-center py-2 px-3 text-green-700 font-semibold">{row.blsCompleteCount}</td>
                    <td className="text-center py-2 px-3 text-blue-700 font-semibold">{row.aclsCompleteCount}</td>
                    <td className="text-center py-2 px-3 text-orange-700 font-semibold">{row.phase2CompleteCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
