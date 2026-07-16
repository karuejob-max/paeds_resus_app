import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ClipboardList,
  RefreshCw,
  Info,
} from "lucide-react";

interface Discrepancy {
  severity: "info" | "warning" | "critical";
  topic: string;
  standard: string;
  local: string;
  explanation: string;
}

interface AuditResult {
  success: boolean;
  complianceScore: number;
  status: "aligned" | "deviated" | "critical_mismatch";
  discrepancies: Discrepancy[];
}

export const GuidelineAuditDashboard: React.FC = () => {
  const [protocolId, setProtocolId] = useState<string>("cardiac_arrest");
  const [guidelineText, setGuidelineText] = useState<string>("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeMutation = trpc.guidelines.analyzeGuidelineDrift.useMutation();

  const handleAnalyze = async () => {
    if (!guidelineText.trim()) {
      setError("Please paste your local hospital guideline text to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const resp = await analyzeMutation.mutateAsync({
        protocolId,
        guidelineText,
      });
      setResult(resp as AuditResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run drift analysis.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aligned":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Aligned</Badge>;
      case "deviated":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Deviated</Badge>;
      case "critical_mismatch":
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white">Critical Mismatch</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="text-rose-500" size={18} />;
      case "warning":
        return <AlertTriangle className="text-yellow-500" size={18} />;
      case "info":
      default:
        return <Info className="text-blue-500" size={18} />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-yellow-500";
    return "text-rose-500";
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <ClipboardList size={22} className="text-blue-600 dark:text-blue-400" />
                Local Guideline Compliance Drift Auditor
              </CardTitle>
              <CardDescription>
                Paste your hospital guidelines to automatically check compliance and identify differences against standard resuscitation protocols.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-450 font-semibold bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
              <Sparkles size={14} className="animate-pulse" />
              Powered by Google Gemini
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Target Protocol</label>
              <Select value={protocolId} onValueChange={setProtocolId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select target protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardiac_arrest">Cardiac Arrest (Pediatric PALS)</SelectItem>
                  <SelectItem value="neonatal_resuscitation">Neonatal Resuscitation (NRP)</SelectItem>
                  <SelectItem value="status_epilepticus">Status Epilepticus</SelectItem>
                  <SelectItem value="septic_shock">Septic Shock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Paste Guideline Text</label>
            <Textarea
              value={guidelineText}
              onChange={(e) => setGuidelineText(e.target.value)}
              placeholder="Paste hospital clinical guideline, dosing rules, or triaging instructions here..."
              rows={8}
              className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-lg text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 rounded-xl py-2.5 transition active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Analyzing Guideline Drift...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Analyze Compliance & Drift
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results View */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Summary Card */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-sm flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base font-bold">Audit Score & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pb-6">
              <div className="text-center py-4">
                <span className={`text-6xl font-black ${getScoreColor(result.complianceScore)}`}>
                  {result.complianceScore}%
                </span>
                <p className="text-xs text-slate-500 mt-2">Compliance Alignment Index</p>
              </div>

              <div className="flex items-center justify-between border-t dark:border-slate-800 pt-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</span>
                {getStatusBadge(result.status)}
              </div>

              <Progress value={result.complianceScore} className="h-2 mt-2" />
            </CardContent>
          </Card>

          {/* Discrepancies List Card */}
          <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Discrepancies Audited ({result.discrepancies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.discrepancies.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={32} />
                  <p className="text-sm font-semibold">Guidelines Aligned</p>
                  <p className="text-xs">No clinical drift or critical discrepancies detected against standard protocols.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {result.discrepancies.map((d, index) => (
                    <div
                      key={index}
                      className="border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {getSeverityIcon(d.severity)}
                          {d.topic}
                        </span>
                        <Badge variant="outline" className="capitalize text-[10px] py-0 px-1.5">
                          {d.severity}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded border-l-2 border-slate-400">
                          <span className="text-[10px] text-slate-500 block">STANDARD PROTOCOL</span>
                          <span className="text-slate-700 dark:text-slate-350">{d.standard}</span>
                        </div>
                        <div className="bg-orange-50/50 dark:bg-orange-950/10 p-2.5 rounded border-l-2 border-orange-500">
                          <span className="text-[10px] text-orange-500 block">LOCAL GUIDELINE</span>
                          <span className="text-slate-700 dark:text-slate-350">{d.local}</span>
                        </div>
                      </div>
                      <p className="text-slate-650 dark:text-slate-400 mt-2 text-[11px] leading-normal">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Clinical Risk: </span>
                        {d.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
