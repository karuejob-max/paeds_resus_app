import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminProfessionalCpdIdentityResolution() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
  const [note, setNote] = useState("");
  const utils = trpc.useUtils();
  const cases = trpc.professionalProgress.listCpdIdentityResolutionCases.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const candidates = trpc.professionalProgress.searchCpdIdentityUsers.useQuery({ query: search }, { enabled: isAuthenticated && user?.role === "admin" && search.trim().length >= 2 });
  const resolve = trpc.professionalProgress.resolveCpdIdentityResolutionCase.useMutation({ onSuccess: async () => { setSelectedCaseId(null); setSelectedUserId(undefined); setNote(""); await utils.professionalProgress.listCpdIdentityResolutionCases.invalidate(); } });
  const createCase = trpc.professionalProgress.createCpdIdentityResolutionCase.useMutation({ onSuccess: async () => { await utils.professionalProgress.listCpdIdentityResolutionCases.invalidate(); } });

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) setLocation("/");
  }, [loading, isAuthenticated, user, setLocation]);

  if (loading || !isAuthenticated || user?.role !== "admin") return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (cases.isLoading) return <div className="p-8 text-muted-foreground">Loading CPD identity queue…</div>;
  if (cases.error) return <div className="p-8 text-destructive">Unable to load the CPD identity queue: {cases.error.message}</div>;

  const rows = cases.data ?? [];
  const selected = rows.find((row) => row.case.id === selectedCaseId);

  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <header className="rounded-2xl border bg-background p-6 shadow-sm">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><ShieldCheck className="h-6 w-6" /></div><div><p className="text-sm font-medium text-primary">Paeds Resus · Evidence Integrity</p><h1 className="mt-1 text-2xl font-semibold">CPD identity resolution</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Historical CPD records without a stable account link stay outside Professional Progress until an administrator explicitly confirms the owning account. Email similarity is an investigation aid, never automatic proof.</p></div></div>
    </header>
    {rows.length === 0 ? <Card className="border-emerald-300 bg-emerald-50"><CardContent className="flex items-center gap-2 pt-6 text-sm text-emerald-900"><CheckCircle2 className="h-5 w-5" />No open CPD identity cases.</CardContent></Card> : <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <Card><CardHeader><CardTitle>Open cases</CardTitle><CardDescription>{rows.length} case(s) awaiting explicit review.</CardDescription></CardHeader><CardContent className="space-y-3">{rows.map((row) => <button type="button" key={row.case.id} onClick={() => { setSelectedCaseId(row.case.id); setSelectedUserId(row.case.proposedUserId ?? undefined); setSearch(""); setNote(""); }} className={`w-full rounded-lg border p-3 text-left ${selectedCaseId === row.case.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{row.attendee.fullName}</p><p className="text-xs text-muted-foreground">{row.attendee.email} · attendee #{row.attendee.id}</p><p className="mt-1 text-sm">{row.event.name}</p></div><Badge variant="secondary">open</Badge></div></button>)}</CardContent></Card>
      <Card>{selected ? <><CardHeader><CardTitle>Review attendee #{selected.attendee.id}</CardTitle><CardDescription>Do not approve based on name or email alone. Confirm the account using reliable platform context.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="rounded-lg border bg-muted/30 p-3 text-sm"><p><strong>{selected.attendee.fullName}</strong></p><p>{selected.attendee.email}</p><p>{selected.attendee.phone} · {selected.attendee.cadre} · {selected.attendee.department}</p><p className="mt-1 text-muted-foreground">Session: {selected.event.name}</p></div><label className="block text-sm font-medium">Search platform account<Input className="mt-1" placeholder="Name or email" value={search} onChange={(event) => setSearch(event.target.value)} /></label>{candidates.data?.length ? <div className="space-y-2">{candidates.data.map((candidate) => <button type="button" key={candidate.id} onClick={() => setSelectedUserId(candidate.id)} className={`w-full rounded border p-2 text-left text-sm ${selectedUserId === candidate.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}><strong>{candidate.name}</strong><span className="ml-2 text-muted-foreground">{candidate.email} · #{candidate.id} · {candidate.cadre ?? "cadre not set"}</span></button>)}</div> : search.length >= 2 ? <p className="text-xs text-muted-foreground">No matching accounts.</p> : null}<p className="text-xs text-muted-foreground">Selected account ID: {selectedUserId ?? "none"}</p><label className="block text-sm font-medium">Review note<textarea className="mt-1 min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={note} onChange={(event) => setNote(event.target.value)} placeholder="State the evidence used to confirm or reject identity." /></label>{resolve.error && <p className="text-sm text-destructive">{resolve.error.message}</p>}<div className="flex flex-wrap gap-2"><Button disabled={!selectedUserId || note.trim().length < 3 || resolve.isPending} onClick={() => resolve.mutate({ caseId: selected.case.id, decision: "approved", userId: selectedUserId, reviewerNote: note })}>{resolve.isPending ? "Saving…" : "Approve linkage"}</Button><Button variant="outline" disabled={note.trim().length < 3 || resolve.isPending} onClick={() => resolve.mutate({ caseId: selected.case.id, decision: "rejected", reviewerNote: note })}>Reject / keep unresolved</Button></div><div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"><AlertTriangle className="mr-1 inline h-4 w-4" />Approval links the CPD attendee to the selected account; it does not certify competence or alter attendance status.</div></CardContent></> : <CardContent className="pt-6 text-sm text-muted-foreground">Select an open case to review it.</CardContent>}</Card>
    </div>}
    <Card><CardHeader><CardTitle>Discover an unlinked record</CardTitle><CardDescription>Create a review case for a historical attendee record. This does not link anything.</CardDescription></CardHeader><CardContent className="flex flex-wrap items-end gap-3"><label className="text-sm">CPD attendee ID<Input className="mt-1 w-48" type="number" id="cpd-attendee-id" /></label><Button variant="outline" onClick={() => { const input = document.getElementById("cpd-attendee-id") as HTMLInputElement | null; const id = Number(input?.value); if (id > 0) createCase.mutate({ cpdAttendeeId: id, reviewerNote: "Queued for explicit identity review." }); }} disabled={createCase.isPending}><Search className="mr-2 h-4 w-4" />{createCase.isPending ? "Queuing…" : "Queue for review"}</Button>{createCase.error && <p className="text-sm text-destructive">{createCase.error.message}</p>}</CardContent></Card>
  </main>;
}
