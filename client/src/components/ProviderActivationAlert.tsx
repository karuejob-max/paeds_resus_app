import { MapPin, Siren } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { trpc } from "@/lib/trpc";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ProviderActivationAlert() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const enabled = Boolean(user && role === "provider");
  const activationsQuery = trpc.iers.getMyActivations.useQuery(undefined, { enabled, refetchInterval: enabled ? 5_000 : false, staleTime: 2_000, retry: 1 });
  const receiveActivation = trpc.iers.receiveActivation.useMutation({
    onSuccess: async () => {
      toast.success("Activation receipt recorded.");
      await utils.iers.getMyActivations.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not record receipt."),
  });
  const acknowledge = trpc.iers.acknowledge.useMutation({
    onSuccess: async () => {
      toast.success("Response commitment recorded.");
      await utils.iers.getMyActivations.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not record response."),
  });

  const activation = activationsQuery.data?.find((item) => ["pending", "sent", "delivered", "received"].includes(item.responderStatus));
  const pendingReceipt = Boolean(activation && ["pending", "sent", "delivered"].includes(activation.responderStatus));
  const pendingResponse = activation?.responderStatus === "received";
  if (!activation) return null;

  return (
    <AlertDialog open>
      <AlertDialogContent className="border-red-400 p-5 sm:max-w-lg">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="flex items-center gap-2 text-red-950"><Siren className="h-5 w-5 text-red-700" />ERT activation — respond now</AlertDialogTitle>
          <AlertDialogDescription className="text-left text-slate-700">A live activation has been assigned to you. Confirm receipt, then state whether you can respond. This does not replace clinical assessment or ResusGPS.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-950">{label(activation.activationType)}</p>
          <p className="flex items-center gap-1 text-sm text-red-900"><MapPin className="h-4 w-4" />{activation.location}{activation.bedNumber ? ` · Bed ${activation.bedNumber}` : ""}{activation.department ? ` · ${activation.department}` : ""}</p>
          <p className="text-xs text-red-900/75">Activation status: {label(activation.status)}</p>
        </div>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {pendingReceipt && <div className="flex w-full flex-col gap-2 sm:flex-row"><Button type="button" className="w-full bg-red-600 text-white hover:bg-red-700" disabled={receiveActivation.isPending} onClick={() => receiveActivation.mutate({ activationEventId: activation.id })}>I received this</Button><AlertDialogAction className="w-full border-slate-300 bg-white text-slate-900 hover:bg-slate-50" onClick={() => acknowledge.mutate({ activationEventId: activation.id, accept: false, reason: "Unable to respond" })}>Unable to respond</AlertDialogAction></div>}
          {pendingResponse && <div className="flex w-full flex-col gap-2 sm:flex-row"><AlertDialogAction className="w-full bg-red-600 text-white hover:bg-red-700" onClick={() => acknowledge.mutate({ activationEventId: activation.id, accept: true })}>I can respond</AlertDialogAction><AlertDialogAction className="w-full border-slate-300 bg-white text-slate-900 hover:bg-slate-50" onClick={() => acknowledge.mutate({ activationEventId: activation.id, accept: false, reason: "Unable to respond" })}>Unable to respond</AlertDialogAction></div>}
          <Button type="button" variant="outline" className="w-full" onClick={() => setLocation(`/resus?activationId=${activation.id}`)}>Open ResusGPS case</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
