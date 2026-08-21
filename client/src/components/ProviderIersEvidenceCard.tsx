import { useState } from "react";
import { ClipboardCheck, FilePlus2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ProviderIersEvidenceCard() {
  const [mode, setMode] = useState<"evidence" | "gap">("evidence");
  const [criterionCode, setCriterionCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const membershipsQuery = trpc.institution.getMyMemberships.useQuery(undefined, { staleTime: 30_000, retry: 1 });
  const utils = trpc.useUtils();
  const institutionId = membershipsQuery.data?.find((membership) => membership.membershipStatus === "active")?.institutionalAccountId;
  const submitEvidence = trpc.iers.submitEvidence.useMutation({
    onSuccess: async () => {
      setCriterionCode("");
      setTitle("");
      setDescription("");
      toast.success("Evidence submitted to the institution review queue.");
      await utils.iers.listEvidence.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not submit evidence."),
  });
  const createAction = trpc.iers.createAction.useMutation({
    onSuccess: () => {
      setTitle("");
      setDescription("");
      toast.success("Readiness gap assigned to you for follow-up.");
    },
    onError: (error) => toast.error(error.message || "Could not create readiness action."),
  });

  if (!institutionId || membershipsQuery.isLoading || membershipsQuery.isError) return null;

  const submit = () => {
    if (mode === "evidence") {
      submitEvidence.mutate({
        institutionId,
        domain: "workforce",
        criterionCode: criterionCode.trim(),
        title: title.trim(),
        evidenceType: "attestation",
        description: description.trim(),
      });
    } else {
      createAction.mutate({
        institutionId,
        sourceType: "manual",
        title: title.trim(),
        gapDescription: description.trim(),
        priority: "medium",
      });
    }
  };

  const valid = title.trim().length >= 3 && description.trim().length >= 5 && (mode === "gap" || criterionCode.trim().length >= 2);

  return (
    <Card className="border-slate-200 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><FilePlus2 className="h-5 w-5 text-teal-700" /> Contribute to IERS</CardTitle>
        <CardDescription>Providers are responsible for reporting what is actually present, missing, or unsafe at the point of care.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button size="sm" variant={mode === "evidence" ? "default" : "outline"} onClick={() => setMode("evidence")}><ClipboardCheck className="h-4 w-4 mr-2" />Submit evidence</Button>
          <Button size="sm" variant={mode === "gap" ? "default" : "outline"} onClick={() => setMode("gap")}><ShieldAlert className="h-4 w-4 mr-2" />Report a gap</Button>
        </div>
        {mode === "evidence" && <div className="space-y-2"><Label htmlFor="provider-iers-criterion">Criterion code</Label><Input id="provider-iers-criterion" value={criterionCode} onChange={(event) => setCriterionCode(event.target.value)} placeholder="e.g. WF-02" /></div>}
        <div className="space-y-2"><Label htmlFor="provider-iers-title">{mode === "evidence" ? "Evidence title" : "Gap title"}</Label><Input id="provider-iers-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={mode === "evidence" ? "e.g. ERTL handover completed" : "e.g. No paediatric IO needles in crash cart"} /></div>
        <div className="space-y-2"><Label htmlFor="provider-iers-description">Details</Label><Textarea id="provider-iers-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder={mode === "evidence" ? "What did you check, where, and when?" : "What is missing, where is it, and what is the immediate safety concern?"} /></div>
        <Button className="bg-teal-700 hover:bg-teal-800 text-white" disabled={!valid || submitEvidence.isPending || createAction.isPending} onClick={submit}>{mode === "evidence" ? "Submit for review" : "Create my action"}</Button>
      </CardContent>
    </Card>
  );
}
