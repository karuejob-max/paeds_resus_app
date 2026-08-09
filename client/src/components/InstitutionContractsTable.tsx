import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSignature } from "lucide-react";

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  service_agreement: "Service Agreement",
  training_agreement: "Training Agreement",
  data_sharing_agreement: "Data Sharing Agreement",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  draft: "border-slate-300 text-slate-600",
  pending_signature: "border-amber-400 text-amber-700 bg-amber-50",
  signed: "border-blue-400 text-blue-700 bg-blue-50",
  active: "border-green-500 text-green-700 bg-green-50",
  completed: "border-slate-400 text-slate-600 bg-slate-50",
  terminated: "border-red-400 text-red-700 bg-red-50",
};

/**
 * institution.getContracts was fully built with no UI calling it anywhere
 * in the client (found during the 2026-08-08 institutional portal gap
 * audit) -- parallel to institution.getQuotations, which is used.
 */
export function InstitutionContractsTable({ institutionId }: { institutionId: number }) {
  const { data: contracts, isLoading } = trpc.institution.getContracts.useQuery({ institutionId });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="w-5 h-5" />
          Contracts
        </CardTitle>
        <CardDescription>Service, training, and data-sharing agreements linked to your institution</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-slate-600">Loading…</p>
        ) : !contracts?.length ? (
          <div className="text-center py-12 text-slate-500">
            <p>No contracts yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Contract #</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Total value (KES)</th>
                  <th className="py-2 pr-4">Start</th>
                  <th className="py-2 pr-4">End</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">{c.contractNumber}</td>
                    <td className="py-2 pr-4">{CONTRACT_TYPE_LABELS[c.contractType] ?? c.contractType}</td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline" className={STATUS_BADGE_CLASS[c.status ?? "draft"]}>
                        {(c.status ?? "draft").replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4">{(c.totalValue / 100).toLocaleString("en-KE")}</td>
                    <td className="py-2 pr-4">{c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"}</td>
                    <td className="py-2 pr-4">{c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
