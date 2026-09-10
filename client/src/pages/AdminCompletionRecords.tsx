import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

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
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pathway, setPathway] = useState<"ierp" | "nerp" | "open_enrolment" | "ilsp">("open_enrolment");
  const [phase2Completed, setPhase2Completed] = useState(false);
  const [phase3Completed, setPhase3Completed] = useState(false);
  const [phase2Date, setPhase2Date] = useState("");
  const [phase3Date, setPhase3Date] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [notes, setNotes] = useState("");
  const candidatesQuery = trpc.completionRecords.listCandidates.useQuery(
    { search: search.trim() || undefined },
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

  const selectCandidate = (row: NonNullable<typeof candidatesQuery.data>[number]) => {
    setSelectedId(row.enrollmentId);
    setPhase2Completed(Boolean(row.phase2Completed));
    setPhase3Completed(Boolean(row.phase3Completed));
    if (row.courseProgramType === "paeds_resus_ils") setPathway("ilsp");
  };

  const submit = () => {
    if (!selected) return;
    if (phase3Completed && !phase2Completed) {
      toast.error("Record Phase 2 before Phase 3.");
      return;
    }
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
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Final proof of completion</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Record Phase 2 and Phase 3 completed outside the platform for a learner who has already completed the cognitive coursework. This produces an auditable final proof certificate; it does not grant course access or bypass payment and entitlement rules.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-teal-700" />Find a learner</CardTitle>
              <CardDescription>Search by name or email. Only enrolled Life Support courses with cognitive completion are eligible for final proof.</CardDescription>
              <div className="relative pt-2"><Search className="absolute left-3 top-4 h-4 w-4 text-slate-400" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" /></div>
            </CardHeader>
            <CardContent className="space-y-2">
              {candidatesQuery.isLoading ? <div className="flex items-center justify-center py-10 text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading learners…</div> : candidatesQuery.data?.length ? candidatesQuery.data.map((row) => {
                const selectedRow = row.enrollmentId === selectedId;
                return <button key={`${row.enrollmentId}-${row.userId}`} type="button" onClick={() => selectCandidate(row)} className={`w-full rounded-lg border p-3 text-left transition ${selectedRow ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-300"}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium text-slate-900">{row.userName || "Unnamed learner"}</p><p className="text-xs text-slate-500">{row.userEmail || "No email"} · {PROGRAM_LABELS[row.courseProgramType] || row.courseProgramType}</p></div><Badge variant="outline" className={row.cognitiveModulesComplete ? "border-emerald-200 text-emerald-800" : "border-red-200 text-red-800"}>{row.cognitiveModulesComplete ? "Cognitive complete" : "Cognitive incomplete"}</Badge></div>{row.recordId ? <p className="mt-2 text-xs text-slate-600">Existing record: {row.phase3Completed ? "Phase 3 recorded" : row.phase2Completed ? "Phase 2 recorded" : "not complete"}{row.recordedByName ? ` · ${row.recordedByName}` : ""}</p> : <p className="mt-2 text-xs text-slate-500">No external completion record yet</p>}</button>;
              }) : <p className="py-8 text-sm text-slate-500">No matching eligible enrollments found.</p>}
            </CardContent>
          </Card>

          <Card className="border-teal-200 bg-white">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-teal-700" />Record completion</CardTitle><CardDescription>{selected ? `${selected.userName || "Learner"} · ${PROGRAM_LABELS[selected.courseProgramType] || selected.courseProgramType}` : "Select a learner to begin."}</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {!selected ? <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Select an eligible learner from the list. The platform will reject the record if cognitive completion is not present.</div> : <>
                <div className="space-y-2"><Label htmlFor="completion-pathway">Pathway</Label><select id="completion-pathway" value={pathway} onChange={(event) => setPathway(event.target.value as typeof pathway)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">{PATHWAYS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <div className="space-y-3 rounded-lg border border-slate-200 p-3"><p className="text-sm font-medium text-slate-900">Verified phases</p><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={phase2Completed} onChange={(event) => setPhase2Completed(event.target.checked)} />Phase 2 completed</label><Input type="date" value={phase2Date} onChange={(event) => setPhase2Date(event.target.value)} aria-label="Phase 2 completion date" /><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={phase3Completed} onChange={(event) => { setPhase3Completed(event.target.checked); if (event.target.checked) setPhase2Completed(true); }} />Phase 3 completed</label><Input type="date" value={phase3Date} onChange={(event) => setPhase3Date(event.target.value)} aria-label="Phase 3 completion date" /></div>
                <div className="space-y-2"><Label htmlFor="evidence-reference">Evidence reference</Label><Input id="evidence-reference" value={evidenceReference} onChange={(event) => setEvidenceReference(event.target.value)} placeholder="Register, certificate, session ID, or file reference" /></div>
                <div className="space-y-2"><Label htmlFor="completion-notes">Record note</Label><Textarea id="completion-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Where and how the phases were completed" rows={4} /></div>
                <Button type="button" className="w-full bg-teal-700 hover:bg-teal-800" disabled={recordMutation.isPending || !phase2Completed} onClick={submit}>{recordMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save completion and check certificate"}</Button>
                <p className="text-xs leading-5 text-slate-500">A final certificate is issued only when Phase 2 and Phase 3 are both recorded. Cognitive completion is always required.</p>
              </>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
