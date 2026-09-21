import { useState } from "react";
import { ExternalLink, CheckCircle2, Upload, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type DocumentType = "video_prework" | "precourse_assessment";
type Draft = { fileName: string; contentType: "application/pdf" | "image/jpeg" | "image/png"; dataBase64: string };

export function AclsElearningProofCard({ compact = false }: { compact?: boolean }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.courses.getElearningProofStatus.useQuery({ programType: "acls" }, { retry: false });
  const [files, setFiles] = useState<Record<DocumentType, Draft | null>>({ video_prework: null, precourse_assessment: null });
  const submit = trpc.courses.submitElearningProofFiles.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      setFiles({ video_prework: null, precourse_assessment: null });
      await utils.courses.getElearningProofStatus.invalidate({ programType: "acls" });
    },
    onError: (error) => toast.error(error.message || "Could not submit the certificates."),
  });

  if (isLoading || !data) return null;
  const readyToUpload = data.eligibleToUpload && !data.alreadySubmitted;
  const handleFile = (documentType: DocumentType, file: File | undefined) => {
    if (!file) return;
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      toast.error("Each certificate must be between 1 byte and 10 MB.");
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png"] as const;
    if (!(allowed as readonly string[]).includes(file.type)) {
      toast.error("Choose a PDF, JPG, or PNG certificate.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return toast.error("Could not read that certificate.");
      setFiles((current) => ({ ...current, [documentType]: { fileName: file.name, contentType: file.type as Draft["contentType"], dataBase64: reader.result as string } }));
    };
    reader.onerror = () => toast.error("Could not read that certificate.");
    reader.readAsDataURL(file);
  };

  return (
    <Card className={compact ? "border-blue-200 bg-blue-50/40" : "border-indigo-200 bg-indigo-50/30"}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {data.alreadySubmitted ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Upload className="h-5 w-5 text-indigo-700" />}
          ACLS Phase 1 — AHA eLearning proof
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-slate-700">Complete the <a className="font-medium text-blue-700 underline" href="https://elearning.heart.org" target="_blank" rel="noreferrer">AHA Video Precourse Work</a> and pass the <a className="font-medium text-blue-700 underline" href="https://elearning.heart.org" target="_blank" rel="noreferrer">Precourse Self-Assessment</a>. Upload both certificates here before booking Phase 2 online simulations.</p>
        <p className="text-xs text-slate-600">{data.guidance}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["video_prework", "precourse_assessment"] as const).map((documentType) => (
            <label key={documentType} className={`rounded border border-dashed p-3 text-xs ${readyToUpload ? "cursor-pointer border-indigo-300 bg-white hover:bg-indigo-50" : "border-slate-200 bg-slate-50"}`}>
              <span className="block font-medium">{documentType === "video_prework" ? "Video Prework Completion Certificate" : "Passed Precourse Self-Assessment Certificate"}</span>
              <span className="mt-1 block text-slate-500">{files[documentType]?.fileName ?? (data.alreadySubmitted ? "Submitted privately" : "Choose PDF, JPG, or PNG")}</span>
              {readyToUpload ? <input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => handleFile(documentType, event.target.files?.[0])} /> : null}
            </label>
          ))}
        </div>
        {readyToUpload ? <Button size="sm" disabled={!files.video_prework || !files.precourse_assessment || submit.isPending} onClick={() => { const video = files.video_prework; const assessment = files.precourse_assessment; if (video && assessment) submit.mutate({ documents: [{ documentType: "video_prework", ...video }, { documentType: "precourse_assessment", ...assessment }] }); }}>{submit.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting privately…</> : "Submit both certificates"}</Button> : null}
        {data.alreadySubmitted ? <p className="font-medium text-emerald-700">Both certificates are on file. Phase 2 booking is available once the booking page has loaded your eligibility.</p> : null}
        <a className="inline-flex items-center gap-1 text-xs text-blue-700 underline" href="https://elearning.heart.org" target="_blank" rel="noreferrer">Open elearning.heart.org <ExternalLink className="h-3 w-3" /></a>
      </CardContent>
    </Card>
  );
}
