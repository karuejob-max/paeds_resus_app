import { useState } from "react";
import { CalendarPlus, CheckCircle2, ClipboardCheck, PlayCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const SCENARIOS = [
  ["code_blue", "Code Blue"],
  ["code_yellow", "Code Yellow"],
  ["neonatal", "Neonatal emergency"],
  ["sepsis", "Sepsis"],
  ["anaphylaxis", "Anaphylaxis"],
  ["trauma", "Trauma"],
  ["other", "Other"],
] as const;

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function IersDrillPanel({ institutionId }: { institutionId: number }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [scenarioType, setScenarioType] = useState<(typeof SCENARIOS)[number][0]>("code_blue");
  const [scheduledAt, setScheduledAt] = useState("");
  const [debriefByDrill, setDebriefByDrill] = useState<Record<number, { note: string; lessons: string }>>({});
  const drillsQuery = trpc.iers.listDrills.useQuery({ institutionId, limit: 20 }, { staleTime: 15_000, retry: 1 });
  const createDrill = trpc.iers.createDrill.useMutation({ onSuccess: async () => { setTitle(""); setScheduledAt(""); toast.success("IERS drill scheduled."); await utils.iers.listDrills.invalidate({ institutionId }); }, onError: (error) => toast.error(error.message || "Could not schedule drill.") });
  const startDrill = trpc.iers.startDrill.useMutation({ onSuccess: async () => { toast.success("Drill started."); await utils.iers.listDrills.invalidate({ institutionId }); }, onError: (error) => toast.error(error.message || "Could not start drill.") });
  const submitDebrief = trpc.iers.submitDrillDebrief.useMutation({ onSuccess: async () => { toast.success("Drill debrief submitted as IERS evidence."); await utils.iers.listDrills.invalidate({ institutionId }); await utils.iers.listEvidence.invalidate({ institutionId }); await utils.iers.getEvidenceScorecard.invalidate({ institutionId }); }, onError: (error) => toast.error(error.message || "Could not submit drill debrief.") });

  const schedule = () => {
    if (title.trim().length < 3 || !scheduledAt) { toast.error("Enter a drill title and scheduled time."); return; }
    createDrill.mutate({ institutionId, title: title.trim(), scenarioType, scheduledAt: new Date(scheduledAt), targetResponseSeconds: 180 });
  };

  return (
    <div className="space-y-6">
      <Card className="border-violet-200">
        <CardHeader className="bg-violet-50 border-b border-violet-100 pb-3"><CardTitle className="flex items-center gap-2 text-violet-900 text-base"><CalendarPlus className="h-5 w-5" /> Schedule a readiness drill</CardTitle><CardDescription className="text-violet-800/80">Use drills to test activation, provider participation, response timing, and debrief—not to create patient records.</CardDescription></CardHeader>
        <CardContent className="p-4 space-y-4"><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2 sm:col-span-2"><Label htmlFor="iers-drill-title">Drill title</Label><Input id="iers-drill-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Night shift paediatric code response" /></div><div className="space-y-2"><Label>Scenario</Label><select value={scenarioType} onChange={(event) => setScenarioType(event.target.value as typeof scenarioType)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{SCENARIOS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div><div className="space-y-2"><Label htmlFor="iers-drill-scheduled">Scheduled time</Label><Input id="iers-drill-scheduled" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></div></div><Button className="bg-violet-700 hover:bg-violet-800 text-white" onClick={schedule} disabled={createDrill.isPending}><CalendarPlus className="h-4 w-4 mr-2" />Schedule drill</Button></CardContent>
      </Card>

      <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-violet-700" /> Drill register</CardTitle><CardDescription>Every completed drill produces reviewable activation evidence.</CardDescription></CardHeader><CardContent className="p-4 space-y-3">{drillsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading drills…</p> : drillsQuery.data?.length ? drillsQuery.data.map((drill) => { const debrief = debriefByDrill[drill.id] ?? { note: "", lessons: "" }; return <div key={drill.id} className="rounded-lg border p-3 space-y-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-sm">{drill.title}</p><p className="text-xs text-slate-600 mt-1">{label(drill.scenarioType)} · {new Date(drill.scheduledAt).toLocaleString()}</p></div><Badge variant="outline">{label(drill.status)}</Badge></div>{drill.status === "planned" && <Button size="sm" variant="outline" disabled={startDrill.isPending} onClick={() => startDrill.mutate({ institutionId, drillId: drill.id })}><PlayCircle className="h-4 w-4 mr-2" />Start drill</Button>}{drill.status === "in_progress" && <div className="space-y-2"><Textarea value={debrief.note} onChange={(event) => setDebriefByDrill((current) => ({ ...current, [drill.id]: { ...debrief, note: event.target.value } }))} rows={2} placeholder="Debrief: what happened, what was delayed, and what was unsafe?" /><Textarea value={debrief.lessons} onChange={(event) => setDebriefByDrill((current) => ({ ...current, [drill.id]: { ...debrief, lessons: event.target.value } }))} rows={2} placeholder="Lessons learned and required system changes" /><Button size="sm" className="bg-violet-700 hover:bg-violet-800 text-white" disabled={submitDebrief.isPending || debrief.note.trim().length < 5 || debrief.lessons.trim().length < 5} onClick={() => submitDebrief.mutate({ institutionId, drillId: drill.id, debriefNote: debrief.note.trim(), lessonsLearned: debrief.lessons.trim() })}><CheckCircle2 className="h-4 w-4 mr-2" />Complete debrief</Button></div>}</div>; }) : <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No drills scheduled. Schedule a controlled test before claiming 24/7 activation readiness.</div>}</CardContent></Card>
    </div>
  );
}
