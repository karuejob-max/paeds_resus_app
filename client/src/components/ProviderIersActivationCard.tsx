import { AlertTriangle, Building2, CheckCircle2, Clock3, MapPin, Siren } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function notificationStageCopy(status: string) {
  const copy: Record<string, string> = {
    pending: "Assignment created. Delivery has not been confirmed.",
    sent: "A delivery attempt was accepted by the push service; receipt is still unconfirmed.",
    delivered: "The notification was delivered by the configured channel; confirm receipt before responding.",
    failed: "Delivery failed. Keep this page open and follow the escalation instructions from your team.",
    received: "You confirmed receipt. Choose whether you can respond.",
    acknowledged: "You accepted the assignment and can now record movement to the scene.",
    declined: "You declined this assignment. The response team can measure and escalate the gap.",
    timed_out: "No response was recorded within the response window.",
  };
  return copy[status] ?? "The current notification stage is recorded in the response timeline.";
}

export default function ProviderIersActivationCard() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const activationQuery = trpc.iers.getMyActivations.useQuery(undefined, {
    refetchInterval: 15_000,
    retry: 1,
  });
  const receiveActivation = trpc.iers.receiveActivation.useMutation({
    onSuccess: async () => {
      toast.success("Activation receipt recorded.");
      await utils.iers.getMyActivations.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not record notification receipt."),
  });
  const acknowledge = trpc.iers.acknowledge.useMutation({
    onSuccess: async () => {
      toast.success("Activation response recorded.");
      await utils.iers.getMyActivations.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not record your activation response."),
  });
  const markResponse = trpc.iers.markResponse.useMutation({
    onSuccess: async () => {
      toast.success("Response status recorded.");
      await utils.iers.getMyActivations.invalidate();
    },
    onError: (error) => toast.error(error.message || "Could not record your response status."),
  });

  if (activationQuery.isLoading || activationQuery.isError || !activationQuery.data?.length) return null;

  return (
    <Card className="border-red-300 shadow-sm overflow-hidden">
      <CardHeader className="bg-red-50 border-b border-red-100 pb-3">
        <CardTitle className="flex items-center gap-2 text-red-900 text-base">
          <Siren className="h-5 w-5" />
          Active IERS Response
          <Badge className="ml-auto bg-red-600 text-white">Live</Badge>
        </CardTitle>
        <CardDescription className="text-red-800/80">
          A facility activation needs a provider response. Use the controls below to create a reliable timeline.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {activationQuery.data.map((activation) => {
          const pending = ["pending", "sent", "delivered"].includes(activation.responderStatus);
          const received = activation.responderStatus === "received";
          const acknowledged = activation.responderStatus === "acknowledged";
          const declined = activation.responderStatus === "declined";
          return (
            <div key={activation.id} className="rounded-lg border border-red-100 bg-white p-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{label(activation.activationType)}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <Building2 className="h-3 w-3" /> {activation.companyName}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {activation.location}
                    {activation.bedNumber ? ` · Bed ${activation.bedNumber}` : ""}
                    {activation.department ? ` · ${activation.department}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className="border-red-200 text-red-700 shrink-0">
                  {label(activation.status)}
                </Badge>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2" role="status" aria-label={`Notification stage: ${label(activation.responderStatus)}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Notification stage</span>
                  <Badge variant={activation.responderStatus === "failed" || activation.responderStatus === "timed_out" ? "destructive" : "secondary"}>
                    {label(activation.responderStatus)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-600">{notificationStageCopy(activation.responderStatus)}</p>
              </div>

              {pending && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={receiveActivation.isPending}
                    onClick={() => receiveActivation.mutate({ activationEventId: activation.id })}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> I received this
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-300"
                    disabled={acknowledge.isPending}
                    onClick={() => acknowledge.mutate({ activationEventId: activation.id, accept: false, reason: "Unable to respond" })}
                  >
                    Unable to respond
                  </Button>
                </div>
              )}

              {received && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Receipt recorded. Confirm whether you can respond.</div>
                  <div className="flex flex-wrap gap-2"><Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" disabled={acknowledge.isPending} onClick={() => acknowledge.mutate({ activationEventId: activation.id, accept: true })}>I can respond</Button><Button size="sm" variant="outline" disabled={acknowledge.isPending} onClick={() => acknowledge.mutate({ activationEventId: activation.id, accept: false, reason: "Unable to respond" })}>Unable to respond</Button></div>
                </div>
              )}

              {acknowledged && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Responding status accepted — record your movement to the scene.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={markResponse.isPending}
                      onClick={() => markResponse.mutate({ activationEventId: activation.id, state: "responding" })}
                    >
                      <Clock3 className="h-4 w-4 mr-2" /> Responding
                    </Button>
                    <Button
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white"
                      disabled={markResponse.isPending}
                      onClick={() => markResponse.mutate({ activationEventId: activation.id, state: "at_scene" })}
                    >
                      <MapPin className="h-4 w-4 mr-2" /> At scene
                    </Button>
                  </div>
                </div>
              )}

              {(received || acknowledged || ["responding", "at_scene"].includes(activation.status)) && <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => setLocation(`/resus?activationId=${activation.id}`)}>Open ResusGPS case</Button>}

              {declined && (
                <p className="text-xs text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Your inability to respond was recorded so backup escalation can be measured.
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
