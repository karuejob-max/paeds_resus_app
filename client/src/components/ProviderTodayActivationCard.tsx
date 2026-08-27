import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneCall, Siren, WifiOff, X } from "lucide-react";
import { toast } from "sonner";

type CurrentTeam = {
  teamId: number;
  institutionId: number;
  poleName: string;
};

type ActivationType = "code_blue" | "code_yellow" | "neonatal" | "sepsis" | "anaphylaxis" | "trauma" | "other";

export default function ProviderTodayActivationCard({
  currentTeam,
  isLoading,
  hasActiveMembership,
}: {
  currentTeam: CurrentTeam | null;
  isLoading: boolean;
  hasActiveMembership: boolean;
}) {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activationType, setActivationType] = useState<ActivationType>("code_blue");
  const [location, setActivationLocation] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const activateMutation = trpc.iers.triggerActivation.useMutation({
    onSuccess: (result) => {
      toast.success("ERT activated. Opening ResusGPS.");
      setIsOpen(false);
      setLocation(`/resus?activationId=${result.activationEventId}`);
    },
    onError: (error) => toast.error(error.message || "The ERT could not be activated."),
  });

  const openConfirmation = () => {
    if (!currentTeam) return;
    setActivationLocation((value) => value || currentTeam.poleName);
    setIsOpen(true);
  };

  const submit = () => {
    if (!isOnline || !currentTeam || location.trim().length < 2) return;
    activateMutation.mutate({
      institutionId: currentTeam.institutionId,
      teamId: currentTeam.teamId,
      activationType,
      location: location.trim(),
      bedNumber: bedNumber.trim() || undefined,
      priority: "critical",
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Card className="border-red-300 bg-red-50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Emergency response</p>
            <CardTitle className="mt-1 flex items-center gap-2 text-lg text-red-950">
              <Siren className="h-5 w-5 shrink-0 text-red-700" /> Activate the ERT
            </CardTitle>
            <CardDescription className="mt-1 text-red-900/75">
              {isOnline ? "Send the alert to the current dated ERT for your pole. Confirm the location before sending." : "No server alert can be sent while offline. Use the manual fallback and open ResusGPS locally."}
            </CardDescription>
          </div>
          {isOpen && (
            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-red-800" aria-label="Close activation confirmation" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!hasActiveMembership ? (
          <p className="text-sm text-red-900/80">Link an active facility membership before activating a scoped ERT.</p>
        ) : isLoading ? (
          <p className="text-sm text-red-900/80">Checking the current dated ERT…</p>
        ) : !currentTeam ? (
          <div className="space-y-2">
            <p className="text-sm text-red-900/80">No current published ERT is available for your pole, so an alert cannot be sent safely.</p>
            <Button type="button" variant="outline" className="border-red-300 bg-white text-red-800 hover:bg-red-100" onClick={() => setLocation("/my-shift?tab=team")}>
              Open My Shift to resolve
            </Button>
          </div>
        ) : !isOnline ? (
          <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <div className="flex items-start gap-2">
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold">Offline: ERT notification is not confirmed</p>
                <p className="mt-1 text-xs text-amber-900/80">Call the facility emergency number or use radio/runner now. This device cannot notify the dated ERT, record arrival, or claim that a team has received the call.</p>
              </div>
            </div>
            <Button type="button" className="w-full bg-red-700 text-white hover:bg-red-800" onClick={() => setLocation("/resus?offline=1")}>
              <Siren className="mr-2 h-4 w-4" /> Open ResusGPS locally
            </Button>
            <p className="flex items-center gap-1 text-[11px] text-amber-900/75"><PhoneCall className="h-3.5 w-3.5" /> Confirm the emergency call through your facility’s manual process.</p>
          </div>
        ) : !isOpen ? (
          <Button type="button" className="w-full bg-red-700 text-white hover:bg-red-800" onClick={openConfirmation}>
            <Siren className="mr-2 h-4 w-4" /> Immediate ERT activation
          </Button>
        ) : (
          <div className="space-y-3 rounded-lg border border-red-200 bg-white p-3">
            <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-900">
                              <strong>Current ERT:</strong> {currentTeam.poleName}. This will notify the dated team now. Confirm the location before sending.

            </div>
            <select aria-label="Activation type" className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={activationType} onChange={(event) => setActivationType(event.target.value as ActivationType)}>
              <option value="code_blue">Code Blue</option>
              <option value="code_yellow">Code Yellow</option>
              <option value="neonatal">Neonatal emergency</option>
              <option value="sepsis">Sepsis</option>
              <option value="anaphylaxis">Anaphylaxis</option>
              <option value="trauma">Trauma</option>
              <option value="other">Other</option>
            </select>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input value={location} onChange={(event) => setActivationLocation(event.target.value)} placeholder="Ward / room / location" aria-label="Emergency location" />
              <Input value={bedNumber} onChange={(event) => setBedNumber(event.target.value)} placeholder="Bed number (optional)" aria-label="Bed number" />
            </div>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Urgent access or resource note (optional)" rows={2} aria-label="Urgent note" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" className="bg-red-700 text-white hover:bg-red-800 sm:flex-1" onClick={submit} disabled={activateMutation.isPending || location.trim().length < 2}>
                {activateMutation.isPending ? "Activating…" : "Confirm and open ResusGPS"}
              </Button>
              <Button type="button" variant="outline" className="bg-white" onClick={() => setIsOpen(false)} disabled={activateMutation.isPending}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export type { CurrentTeam };
