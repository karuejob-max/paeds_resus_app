import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles,
  SearchCode,
  CheckCircle,
  AlertTriangle,
  Brain,
  Layers,
  ArrowRight,
  RefreshCw,
  UserCheck,
} from "lucide-react";

interface ProposedPattern {
  patternTrack: "FAILURE" | "SUCCESS";
  patternName: string;
  primaryDomain: "RECOGNITION" | "ESCALATION" | "VASCULAR_ACCESS" | "TREATMENT" | "REFERRAL" | "MONITORING" | "COMMUNICATION" | "RESOURCE_AVAILABILITY";
  description: string;
  evidenceBasis: string;
  cadreScope: "nursing" | "medical" | "all";
  associatedObservations: string[];
  approved?: boolean;
}

export const AiPatternInbox: React.FC = () => {
  const [patterns, setPatterns] = useState<ProposedPattern[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTrack, setActiveTrack] = useState<"FAILURE" | "SUCCESS">("FAILURE");

  const discoveryMutation = trpc.fpkb.runAiPatternDiscovery.useMutation();
  const approveMutation = trpc.fpkb.approveProposedPattern.useMutation();

  const handleScan = async () => {
    setIsLoading(true);
    try {
      const resp = await discoveryMutation.mutateAsync();
      if (resp.success && resp.proposedPatterns) {
        setPatterns(resp.proposedPatterns);
        toast.success(`Successfully discovered ${resp.proposedPatterns.length} patterns!`);
      } else {
        toast.error("Failed to run discovery scan or no data found.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error running discovery.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (index: number) => {
    const item = patterns[index];
    try {
      const resp = await approveMutation.mutateAsync({
        patternTrack: item.patternTrack,
        patternName: item.patternName,
        primaryDomain: item.primaryDomain,
        description: item.description,
        evidenceBasis: item.evidenceBasis,
        cadreScope: item.cadreScope,
        associatedObservations: item.associatedObservations,
      });

      if (resp.success) {
        toast.success(`Pattern approved as ${resp.patternCode}!`);
        // Mark as approved locally
        setPatterns((prev) =>
          prev.map((p, idx) => (idx === index ? { ...p, approved: true } : p))
        );
      } else {
        toast.error("Failed to approve pattern.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed.");
      console.error(err);
    }
  };

  const filteredPatterns = patterns.filter((p) => p.patternTrack === activeTrack);

  return (
    <div className="space-y-6">
      {/* Hero Workspace Header */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Brain size={22} className="text-indigo-500" />
                AI Discovery Inbox & Pattern Aggregator
              </CardTitle>
              <CardDescription>
                Mines raw de-identified Care Signal logs and parent Safe-Truth timelines using NLP clustering to group observations into Failure and Success Patterns.
              </CardDescription>
            </div>
            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 flex gap-1.5 items-center">
              <Sparkles size={12} className="animate-pulse" />
              NLP Clustering Mode
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 mb-4 leading-normal">
            Every pattern discovered is cross-linked with its source observations to assure compliance with the **Observation Architecture v1.1** guidelines. Approved patterns enter the knowledge base as Signal or Candidate Success status for clinical governance board sign-off.
          </p>

          <Button
            onClick={handleScan}
            disabled={isLoading}
            className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-semibold rounded-xl flex items-center justify-center gap-2 py-3 transition active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Gathering observations and scanning themes...
              </>
            ) : (
              <>
                <SearchCode size={16} /> Scan Unstructured Narratives for Patterns
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Discovery Board */}
      {patterns.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Discovered AI Candidates</h3>
            <div className="flex gap-2">
              <Button
                variant={activeTrack === "FAILURE" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTrack("FAILURE")}
                className="text-xs rounded-lg"
              >
                Failure Tracks
              </Button>
              <Button
                variant={activeTrack === "SUCCESS" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTrack("SUCCESS")}
                className="text-xs rounded-lg"
              >
                Success Tracks
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatterns.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-slate-55 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                <Layers className="mx-auto mb-2 text-slate-400" size={28} />
                No proposed {activeTrack === "FAILURE" ? "failure" : "success"} patterns found in recent logs.
              </div>
            ) : (
              filteredPatterns.map((item, idx) => {
                // Find global index in the main patterns array
                const globalIndex = patterns.findIndex(
                  (p) => p.patternName === item.patternName && p.patternTrack === item.patternTrack
                );

                return (
                  <Card
                    key={idx}
                    className={`border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-sm flex flex-col justify-between transition-all duration-300 ${
                      item.approved ? "opacity-60 border-emerald-500 dark:border-emerald-900" : ""
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                          {item.primaryDomain}
                        </Badge>
                        <Badge variant="secondary" className="capitalize text-[10px] py-0 px-2">
                          Cadre: {item.cadreScope}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-2">
                        {item.patternName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150/40 dark:border-slate-900/50 space-y-1.5">
                        <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 block uppercase tracking-wider">
                          Evidence Basis
                        </span>
                        <p className="text-[11px] text-slate-650 dark:text-slate-300 leading-normal">
                          {item.evidenceBasis}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                          <Layers size={12} />
                          <span>Linked Observations: {item.associatedObservations.length}</span>
                        </div>
                      </div>

                      {item.approved ? (
                        <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                          <CheckCircle size={14} /> Approved & Promoted to Signal
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleApprove(globalIndex)}
                          className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                        >
                          Approve & Commit Pattern <ArrowRight size={12} />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
