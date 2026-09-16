import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getLifeSupportPathway, requiresLifeSupportPhase } from "@shared/life-support-pathways";

const PATHWAYS = [
  ["ierp", "IERP — Intern Emergency Readiness"],
  ["nerp", "NERP — Nurse Emergency Readiness"],
  ["open_enrolment", "Independent / Self-Pay"],
  ["ilsp", "ILSP — Institutional Life Support"],
] as const;

const PROGRAM_LABELS: Record<string, string> = {
  bls: "BLS",
  acls: "ACLS",
  pals: "PALS",
  nrp: "NRP",
  heartsaver: "Heartsaver",
  paeds_resus_ils: "Paeds Resus ILS",
};

export default function AdminCompletionRecords() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pathway, setPathway] = useState<"ierp" | "nerp" | "open_enrolment" | "ilsp">("open_enrolment");
  const [phase2Completed, setPhase2Completed] = useState(false);
  const [phase3Completed, setPhase3Completed] = useState(false);
  const [phase2Date, setPhase2Date] = useState("");
  const [phase3Date, setPhase3Date] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const candidatesQuery = trpc.completionRecords.listCandidates.useQuery(
    { search: debouncedSearch || undefined },
    { staleTime: 15_000, retry: 1 },
  );
  const recordMutation = trpc.completionRecords.record.useMutation({
    onSuccess: () => {
      toast.success("Completion recorded and certificate projection checked.");
      void candidatesQuery.refetch();
      setSelectedId(null);
      setPhase2Completed(false);
      setPhase3Completed(false);
      setPhase2Date("");
      setPhase3Date("");
      setEvidenceReference("");
      setNotes("");
    },
    onError: (error) => toast.error(error.message),
  });
  const selected = useMemo(() => candidatesQuery.data?.find((row) => row.enrollmentId === selectedId) ?? null, [candidatesQuery.data, selectedId]);
  const selectedPathway = selected ? getLifeSupportPathway(selected.courseProgramType) : null;
  const selectedPhase2Applicable = selected ? requiresLifeSupportPhase(selected.courseProgramType, "phase2") : false;

  const selectCandidate = (row: NonNullable<typeof candidatesQuery.data>[number]) => {
    setSelectedId(row.enrollmentId);
    setPhase2Completed(Boolean(row.phase2Completed) && requiresLifeSupportPhase(row.courseProgramType, "phase2"));
    setPhase3Completed(Boolean(row.phase3Completed));
    if (row.courseProgramType === "paeds_resus_ils") setPathway("ilsp");
  };

  const submit = () => {
    if (!selected) return;
    if (phase3Completed && selectedPhase2Applicable && !phase2Completed) {
      toast.error("Record Phase 2 before Phase 3 for this course.");
      return;
    }
    if (!selectedPhase2Applicable) setPhase2Completed(false);
    recordMutation.mutate({
      userId: selected.userId,
      enrollmentId: selected.enrollmentId,
      pathway,
      courseProgramType: selected.courseProgramType as "bls" | "acls" | "pals" | "nrp" | "heartsaver" | "paeds_resus_ils",
      phase2Completed,
      phase2CompletedAt: phase2Date ? new Date(`${phase2Date}T12:00:00`) : undefined,
      phase3Completed,
      phase3CompletedAt: phase3Date ? new Date(`${phase3Date}T12:00:00`) : undefined,
      evidenceReference: evidenceReference || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Training records</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Life Support completion ledger</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Review course progress and payment status, then record authorized off-platform Phase 2 or Phase 3 completion for a learner who has completed the cognitive coursework. Phase requirements are course-specific; this does not grant course access or bypass payment and entitlement rules.</p>
          <a href="/admin/reports" className="mt-3 inline-flex text-sm font-semibold text-teal-700 underline-offset-4 hover:underline">Open Reports & insights enrollment ledger for payment and cohort-wide progress →</a>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-teal-700" />Find a learner</CardTitle>
              <CardDescription>Search by name or email. Only enrolled Life Support courses with cognitive completion are eligible for final proof.</CardDescription>
              <div className="relative pt-2"><Search className="absolute left-3 top-4 h-4 w-4 text-slate-400" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" /></div>
            </CardHeader>
            <CardContent className="space-y-2">
              {candidatesQuery.error && !candidatesQuery.data ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Learner search could not be completed. Refresh the page and try again.</div> : candidatesQuery.data === undefined ? <div className="flex items-center justify-center py-10 text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading eligible learners…</div> : candidatesQuery.data.length ? candidatesQuery.data.map((row) => {
                const selectedRow = row.enrollmentId === selectedId;
                return <button key={`${row.enrollmentId}-${row.userId}`} type="button" onClick={() => selectCandidate(row)} className={`w-full rounded-lg border p-3 text-left transition ${selectedRow ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-300"}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium text-slate-900">{row.userName || "Unnamed learner"}</p><p className="text-xs text-slate-500">{row.userEmail || "No email"} · {PROGRAM_LABELS[row.courseProgramType] || row.courseProgramType}</p></div><Badge variant="outline" className={row.cognitiveModulesComplete ? "border-emerald-200 text-emerald-800" : "border-red-200 text-red-800"}>{row.cognitiveModulesComplete ? "Cognitive complete" : "Cognitive incomplete"}</Badge></div>{row.recordId ? <p className="mt-2 text-xs text-slate-600">Existing record: {row.phase3Completed ? "Phase 3 recorded" : row.phase2Completed ? "Phase 2 recorded" : "not complete"}{row.recordedByName ? ` · ${row.recordedByName}` : ""}</p> : <p className="mt-2 text-xs text-slate-500">No external completion record yet</p>}</button>;
              }) : <p className="py-8 text-sm text-slate-500">No eligible cognitive-complete Life Support enrollment matched this search.</p>}
            </CardContent>
          </Card>

          <Card className="border-teal-200 bg-white">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-teal-700" />Record learning completion</CardTitle><CardDescription>{selected ? `${selected.userName || "Learner"} · ${PROGRAM_LABELS[selected.courseProgramType] || selected.courseProgramType}` : "Select a learner to begin."}</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {!selected ? <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Select an eligible learner from the list. The platform will reject the record if cognitive completion is not present.</div> : <>
                <div className="space-y-2"><Label htmlFor="completion-pathway">Pathway</Label><select id="completion-pathway" value={pathway} onChange={(event) => setPathway(event.target.value as typeof pathway)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">{PATHWAYS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <div className="space-y-3 rounded-lg border border-slate-200 p-3"><p className="text-sm font-medium text-slate-900">Verified phases</p>{selectedPhase2Applicable ? <><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={phase2Completed} onChange={(event) => setPhase2Completed(event.target.checked)} />Phase 2 · Simulation training and evaluation completed</label><Input type="date" value={phase2Date} onChange={(event) => setPhase2Date(event.target.value)} aria-label="Phase 2 completion date" /></> : <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">Phase 2 is not applicable to {selectedPathway?.label ?? "this course"}. Do not record it.</p>}<label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={phase3Completed} onChange={(event) => setPhase3Completed(event.target.checked)} />Phase 3 · Practical skills evaluation completed</label><Input type="date" value={phase3Date} onChange={(event) => setPhase3Date(event.target.value)} aria-label="Phase 3 completion date" /></div>
                <div className="space-y-2"><Label htmlFor="evidence-reference">Evidence reference</Label><Input id="evidence-reference" value={evidenceReference} onChange={(event) => setEvidenceReference(event.target.value)} placeholder="Register, certificate, session ID, or file reference" /></div>
                <div className="space-y-2"><Label htmlFor="completion-notes">Record note</Label><Textarea id="completion-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Where and how the phases were completed" rows={4} /></div>
                <Button type="button" className="w-full bg-teal-700 hover:bg-teal-800" disabled={recordMutation.isPending || !phase3Completed || (selectedPhase2Applicable && !phase2Completed)} onClick={submit}>{recordMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save completion and check certificate"}</Button>
                <p className="text-xs leading-5 text-slate-500">The final provider certificate is issued only when every required phase for this course is recorded. Cognitive completion is always required. Phase 2 and Phase 3 records remain supporting evidence until the final provider certificate is issued.</p>
              </>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
