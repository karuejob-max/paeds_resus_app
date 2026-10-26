import { useState } from "react";
import { ExternalLink, CheckCircle2, Upload, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type DocumentType = "video_prework" | "precourse_assessment" | "precourse_assessment_screenshot";
type Draft = { fileName: string; contentType: "application/pdf" | "image/jpeg" | "image/png"; dataBase64: string };
const emptyFiles: Record<DocumentType, Draft | null> = { video_prework: null, precourse_assessment: null, precourse_assessment_screenshot: null };

export function AclsElearningProofCard({ compact = false, programType = "acls" }: { compact?: boolean; programType?: "acls" | "pals" | "nrp" }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.courses.getElearningProofStatus.useQuery({ programType }, { retry: false });
  const [files, setFiles] = useState<Record<DocumentType, Draft | null>>(emptyFiles);
  const [score, setScore] = useState("");
  const submit = trpc.courses.submitElearningProofFiles.useMutation({
    onSuccess: async (result) => { toast.success(result.message); setFiles(emptyFiles); setScore(""); await utils.courses.getElearningProofStatus.invalidate({ programType }); },
    onError: (error) => toast.error(error.message || "Could not submit the AHA evidence."),
  });
  if (isLoading || !data) return null;
  const readyToUpload = data.eligibleToUpload && !data.alreadySubmitted;
  const handleFile = (documentType: DocumentType, file: File | undefined) => {
    if (!file) return;
    if (file.size === 0 || file.size > 10 * 1024 * 1024) return toast.error("Each file must be between 1 byte and 10 MB.");
    const allowed = ["application/pdf", "image/jpeg", "image/png"] as const;
    if (!(allowed as readonly string[]).includes(file.type)) return toast.error("Choose a PDF, JPG, or PNG file.");
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && setFiles(current => ({ ...current, [documentType]: { fileName: file.name, contentType: file.type as Draft["contentType"], dataBase64: reader.result } }));
    reader.onerror = () => toast.error("Could not read that file.");
    reader.readAsDataURL(file);
  };
  const labels: Record<DocumentType, string> = { video_prework: "Video Prework Completion Certificate", precourse_assessment: "Passed Precourse Self-Assessment Certificate", precourse_assessment_screenshot: "Screenshot showing your score" };
  return <Card id="nerp-phase1-evidence" className={compact ? "border-blue-200 bg-blue-50/40" : "border-indigo-200 bg-indigo-50/30"}>
    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base">{data.alreadySubmitted ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Upload className="h-5 w-5 text-indigo-700" />}{programType.toUpperCase()} Phase 1 — AHA eLearning evidence</CardTitle></CardHeader>
    <CardContent className="space-y-3 text-sm">
      <p className="text-slate-700">Complete the <a className="font-medium text-blue-700 underline" href="https://elearning.heart.org" target="_blank" rel="noreferrer">AHA Video Precourse Work</a> and <a className="font-medium text-blue-700 underline" href="https://elearning.heart.org" target="_blank" rel="noreferrer">Precourse Self-Assessment</a>. Record the score exactly as shown and upload the score screenshot plus both certificates.</p>
      <p className="text-xs text-slate-600">{data.guidance}</p>
      {data.precourseAssessmentScore != null ? <p className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">Recorded precourse score: <strong>{data.precourseAssessmentScore}/100</strong>{data.hasPrecourseAssessmentScreenshot ? " · screenshot on file" : ""}</p> : null}
      {readyToUpload ? <label className="block max-w-xs text-xs font-medium">Precourse Self-Assessment score (0–100)<Input className="mt-1 bg-white" type="number" min="0" max="100" value={score} onChange={event => setScore(event.target.value)} placeholder="e.g. 84" /></label> : null}
      <div className="grid gap-2 sm:grid-cols-3">{(Object.keys(labels) as DocumentType[]).map(documentType => <label key={documentType} className={`rounded border border-dashed p-3 text-xs ${readyToUpload ? "cursor-pointer border-indigo-300 bg-white hover:bg-indigo-50" : "border-slate-200 bg-slate-50"}`}><span className="block font-medium">{labels[documentType]}</span><span className="mt-1 block text-slate-500">{files[documentType]?.fileName ?? (data.alreadySubmitted ? "Submitted privately" : "Choose PDF, JPG, or PNG")}</span>{readyToUpload ? <input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" onChange={event => handleFile(documentType, event.target.files?.[0])} /> : null}</label>)}</div>
      {readyToUpload ? <Button size="sm" disabled={!score || Number(score) < 0 || Number(score) > 100 || Object.values(files).some(file => !file) || submit.isPending} onClick={() => { const documents = (Object.entries(files) as [DocumentType, Draft | null][]).map(([documentType, file]) => file ? { documentType, ...file } : null).filter((file): file is { documentType: DocumentType } & Draft => Boolean(file)); if (documents.length === 3) submit.mutate({ programType, precourseAssessmentScore: Number(score), documents }); }}>{submit.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting privately…</> : "Submit score and 3 evidence files"}</Button> : null}
      {data.alreadySubmitted ? <p className="font-medium text-emerald-700">Your score and three evidence files are on file. Phase 2 booking is available after reviewer verification.</p> : null}
      <a className="inline-flex items-center gap-1 text-xs text-blue-700 underline" href="https://elearning.heart.org" target="_blank" rel="noreferrer">Open elearning.heart.org <ExternalLink className="h-3 w-3" /></a>
    </CardContent>
  </Card>;
}
