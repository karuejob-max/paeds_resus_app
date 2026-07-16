import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles,
  Search,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
  Info,
  Play,
  FileCheck,
  TrendingUp,
  Activity,
  PlusCircle,
  RefreshCw,
} from "lucide-react";

interface SuggestedAction {
  gapIdentified: string;
  systemChange: string;
}

interface AuditFinding {
  severity: "critical" | "warning" | "info";
  type: "override" | "delay" | "success" | "resource";
  title: string;
  details: string;
  suggestedAction: SuggestedAction;
  imported?: boolean;
}

interface ResusGpsAuditPanelProps {
  institutionId: number;
}

export const ResusGpsAuditPanel: React.FC<ResusGpsAuditPanelProps> = ({ institutionId }) => {
  const [auditData, setAuditData] = useState<{
    scannedCasesCount: number;
    averageDepthScore: number;
    findings: AuditFinding[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  const runAuditMutation = trpc.institution.runResusGpsAudit.useMutation();
  const importActionMutation = trpc.institution.importResusGpsAuditAction.useMutation();

  const handleRunAudit = async () => {
    setIsLoading(true);
    try {
      const res = await runAuditMutation.mutateAsync({ institutionId });
      if (res.success) {
        setAuditData({
          scannedCasesCount: res.scannedCasesCount,
          averageDepthScore: res.averageDepthScore,
          findings: res.findings,
        });
        toast.success(`Successfully audited ${res.scannedCasesCount} ResusGPS cases!`);
      } else {
        toast.error("Failed to compile quality audit. Ensure staff members have run ResusGPS simulations.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error running audit.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (index: number) => {
    if (!auditData) return;
    const item = auditData.findings[index];
    try {
      const res = await importActionMutation.mutateAsync({
        institutionId,
        gapIdentified: item.suggestedAction.gapIdentified,
        systemChange: item.suggestedAction.systemChange,
      });

      if (res.success) {
        toast.success("Successfully imported gap to hospital Action Log!");
        setAuditData((prev) => {
          if (!prev) return null;
          const updatedFindings = prev.findings.map((f, idx) =>
            idx === index ? { ...f, imported: true } : f
          );
          return { ...prev, findings: updatedFindings };
        });
      } else {
        toast.error("Failed to import action log entry.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed.");
      console.error(err);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertOctagon size={16} className="text-red-500" />;
      case "warning":
        return <AlertTriangle size={16} className="text-amber-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900";
      case "warning":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900";
    }
  };

  const filteredFindings = auditData
    ? auditData.findings.filter((f) => filterSeverity === "ALL" || f.severity === filterSeverity.toLowerCase())
    : [];

  return (
    <div className="space-y-6">
      {/* Overview/Scan workspace card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Activity size={22} className="text-indigo-650" />
                ResusGPS AI Quality Audit Panel
              </CardTitle>
              <CardDescription>
                Audits raw ResusGPS simulation clickstream events across all staff doctors and nurses to locate protocol deviations and logistical bottlenecks.
              </CardDescription>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 flex gap-1 items-center">
              <Sparkles size={12} className="animate-pulse" />
              Clinical NLP Auditor
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 mb-4 leading-normal">
            By analyzing ABCDE checklist speeds, drug dosage overrides, and time-to-fluid parameters, the auditor suggests logistical improvements (like defibrillator relocation or adrenaline kits) and imports them directly to your hospital Action Log board.
          </p>

          <Button
            onClick={handleRunAudit}
            disabled={isLoading}
            className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-semibold rounded-xl flex items-center justify-center gap-2 py-3 transition active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Compiling clinical records & auditing...
              </>
            ) : (
              <>
                <Play size={16} /> Run Automated ResusGPS Quality Audit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Audit stats and findings list */}
      {auditData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white/65 shadow-sm p-4 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
                <FileCheck className="text-indigo-650" size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Cases Audited</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {auditData.scannedCasesCount}
                </span>
              </div>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-white/65 shadow-sm p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                <TrendingUp className="text-emerald-650" size={24} />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Average Depth Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {auditData.averageDepthScore}%
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {auditData.averageDepthScore >= 85 ? "Excellent Pass" : "Needs Review"}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Quality Finding Logs</h3>
              <div className="flex gap-1">
                {["ALL", "CRITICAL", "WARNING", "INFO"].map((level) => (
                  <Button
                    key={level}
                    variant={filterSeverity === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterSeverity(level)}
                    className="text-[10px] py-1 px-2.5 rounded-lg h-7 font-bold"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {filteredFindings.length === 0 ? (
              <div className="text-center py-12 bg-slate-55 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                <CheckCircle className="mx-auto mb-2 text-emerald-500" size={32} />
                No quality bottlenecks detected in this category. Hospital staff are compliant!
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFindings.map((finding, index) => (
                  <Card key={index} className="border-slate-200 dark:border-slate-800 bg-white/60 shadow-sm">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">{getSeverityIcon(finding.severity)}</div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                              {finding.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 capitalize">
                              Category: {finding.type}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] font-bold ${getSeverityBadge(finding.severity)}`}>
                          {finding.severity}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {finding.details}
                      </p>

                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150/40 dark:border-slate-900/50 space-y-2">
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block uppercase tracking-wider">
                            Gap Identified
                          </span>
                          <p className="text-xs text-slate-650 dark:text-slate-300">
                            {finding.suggestedAction.gapIdentified}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider">
                            Suggested System Change
                          </span>
                          <p className="text-xs text-slate-650 dark:text-slate-300">
                            {finding.suggestedAction.systemChange}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        {finding.imported ? (
                          <div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                            <CheckCircle size={14} /> Imported to Action Log
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleImport(index)}
                            size="sm"
                            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition active:scale-[0.98]"
                          >
                            <PlusCircle size={14} /> Import to Hospital Action Log
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
