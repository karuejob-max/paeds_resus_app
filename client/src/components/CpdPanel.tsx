import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { trpc } from "@/lib/trpc";
import SignaturePad from "@/components/SignaturePad";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Loader2,
  Download,
  QrCode,
  PlusCircle,
  Ban,
  Save,
  FileArchive,
  Copy,
  Check,
  Printer,
} from "lucide-react";

interface CpdPanelProps {
  institutionId: number;
}

/**
 * Self-contained admin UI for the multi-institutional CPD attendance service.
 * Lets an institution admin set the CPD Coordinator name, open/close events,
 * view registrations, share the public QR/link, and download certificates
 * (single PDF + bulk ZIP) via the streaming Express routes.
 */
export default function CpdPanel({ institutionId }: CpdPanelProps) {
  const utils = trpc.useUtils();

  const settingsQuery = trpc.cpd.getSettings.useQuery({ institutionId });
  const eventsQuery = trpc.cpd.listEvents.useQuery({ institutionId });

  const [coordinatorName, setCoordinatorName] = useState<string | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [approvingCouncil, setApprovingCouncil] = useState("NCK");
  const [customCouncil, setCustomCouncil] = useState("");
  const [cpdPoints, setCpdPoints] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const events = eventsQuery.data ?? [];
  const openEvent = events.find((e) => e.isOpen) ?? null;
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const effectiveEventId = selectedEventId ?? openEvent?.id ?? events[0]?.id ?? null;
  const selectedEvent = events.find((e) => e.id === effectiveEventId) ?? null;

  const [cpdCodeInput, setCpdCodeInput] = useState("");

  useEffect(() => {
    if (selectedEvent) {
      setCpdCodeInput(selectedEvent.cpdCode ?? "");
    } else {
      setCpdCodeInput("");
    }
  }, [selectedEvent]);

  const attendeesQuery = trpc.cpd.listAttendees.useQuery(
    { institutionId, eventId: effectiveEventId ?? undefined },
    { enabled: effectiveEventId != null }
  );
  const attendees = attendeesQuery.data ?? [];

  const coordinatorValue =
    coordinatorName ?? settingsQuery.data?.coordinatorName ?? "";

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/cpd/register/${institutionId}`;
  }, [institutionId]);

  const updateCoordinatorMutation = trpc.cpd.updateCoordinator.useMutation({
    onSuccess: () => {
      toast.success("CPD Coordinator updated");
      void utils.cpd.getSettings.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to update coordinator"),
  });

  const openEventMutation = trpc.cpd.openEvent.useMutation({
    onSuccess: () => {
      toast.success("Event opened for registration");
      setNewEventName("");
      setNewEventDate("");
      setApprovingCouncil("NCK");
      setCustomCouncil("");
      setCpdPoints("");
      void utils.cpd.listEvents.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to open event"),
  });

  const closeEventMutation = trpc.cpd.closeEvent.useMutation({
    onSuccess: () => {
      toast.success("CPD Event closed");
      void utils.cpd.listEvents.invalidate({ institutionId });
    },
  });

  const updateCpdCodeMutation = trpc.cpd.updateCpdCode.useMutation({
    onSuccess: () => {
      toast.success("CPD secret code updated");
      void utils.cpd.listEvents.invalidate({ institutionId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update CPD code");
    },
  });

  const updateSignatureMutation = trpc.cpd.updateSignature.useMutation({
    onSuccess: (res) => {
      toast.success(res.hasSignature ? "Signature saved" : "Signature cleared");
      void utils.cpd.getSettings.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to save signature"),
  });

  const savedSignature = settingsQuery.data?.coordinatorSignature ?? null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  /**
   * QRCodeSVG renders as inline SVG markup, not a discrete image resource, so a
   * browser's right-click "Save/Print image" doesn't work on it the way it does
   * on an <img>, and printing the whole dashboard page (Ctrl+P) drags in nav
   * chrome nobody wants on a printed sheet. This opens a small, isolated window
   * with just the QR SVG (cloned from what's already rendered, so it's always
   * in sync with the current event's link) plus the event name/date, and
   * triggers print directly — the standard fix for "can't print an inline SVG."
   */
  const printQrCode = () => {
    const svgEl = qrCodeRef.current?.querySelector("svg");
    if (!svgEl) {
      toast.error("QR code isn't ready yet — try again in a moment.");
      return;
    }
    const printWindow = window.open("", "_blank", "width=480,height=620");
    if (!printWindow) {
      toast.error("Pop-up blocked — allow pop-ups for this site to print the QR code.");
      return;
    }
    const eventLabel = openEvent
      ? `${openEvent.name} — ${openEvent.eventDate}`
      : selectedEvent
        ? `${selectedEvent.name} — ${selectedEvent.eventDate}`
        : "";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CPD Registration QR Code</title>
          <style>
            body { font-family: -apple-system, sans-serif; text-align: center; padding: 40px 24px; }
            h1 { font-size: 18px; margin: 0 0 8px; }
            p { font-size: 14px; color: #444; margin: 0 0 24px; }
            .qr-box { display: inline-block; border: 1px solid #ccc; border-radius: 12px; padding: 24px; }
            .footer { margin-top: 24px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <h1>Scan to register for CPD</h1>
          ${eventLabel ? `<p>${eventLabel}</p>` : ""}
          <div class="qr-box">${svgEl.outerHTML}</div>
          <p class="footer">Paeds Resus login required</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const downloadCsv = async () => {
    try {
      const result = await utils.cpd.exportCsv.fetch({
        institutionId,
        eventId: effectiveEventId ?? undefined,
      });
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cpd-attendees-${effectiveEventId ?? "all"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message || "Failed to export CSV");
    }
  };

  return (
    <div className="space-y-6">
      {/* Coordinator settings */}
      <Card>
        <CardHeader>
          <CardTitle>CPD Coordinator</CardTitle>
          <CardDescription>
            This name is printed on the signature line of every certificate your institution issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="cpd-coordinator">Coordinator name</Label>
              <Input
                id="cpd-coordinator"
                placeholder="e.g. Job Karue, RN"
                value={coordinatorValue}
                onChange={(e) => setCoordinatorName(e.target.value)}
              />
            </div>
            <Button
              onClick={() =>
                updateCoordinatorMutation.mutate({
                  institutionId,
                  coordinatorName: coordinatorValue.trim(),
                })
              }
              disabled={
                updateCoordinatorMutation.isPending || coordinatorValue.trim().length === 0
              }
            >
              {updateCoordinatorMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>

          {/* Coordinator signature pad */}
          <div className="mt-6 space-y-2 border-t pt-6">
            <div>
              <Label>Coordinator signature</Label>
              <p className="text-xs text-muted-foreground">
                Draw the signature once. It is embedded above the signature line on every
                certificate. Saved signatures are shown below — drawing again replaces it.
              </p>
            </div>
            {settingsQuery.isLoading ? (
              <div className="flex py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <SignaturePad
                initialDataUrl={savedSignature}
                saving={updateSignatureMutation.isPending}
                onSave={(dataUrl) =>
                  updateSignatureMutation.mutate({ institutionId, signature: dataUrl })
                }
                onClear={() => {
                  // Only persist a clear when there is already a saved signature.
                  if (savedSignature) {
                    updateSignatureMutation.mutate({ institutionId, signature: null });
                  }
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR code + public link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" /> Registration QR Code
          </CardTitle>
          <CardDescription>
            Nurses scan this code (or open the link) to register — Paeds Resus login required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div ref={qrCodeRef} className="rounded-lg border bg-white p-3">
              {publicUrl ? <QRCodeSVG value={publicUrl} size={148} /> : null}
            </div>
            <div className="flex-1 space-y-2">
              <Label>Public registration link</Label>
              <div className="flex gap-2">
                <Input readOnly value={publicUrl} className="font-mono text-xs" />
                <Button variant="outline" onClick={copyLink}>
                  {linkCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" onClick={printQrCode} disabled={!publicUrl} title="Print QR code" aria-label="Print QR code">
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {openEvent
                  ? `Open event: ${openEvent.name} (${openEvent.eventDate})`
                  : "No event is currently open. Open one below to accept registrations."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open a new event */}
      <Card>
        <CardHeader>
          <CardTitle>CPD Events</CardTitle>
          <CardDescription>
            Open an event to start accepting registrations. Opening a new event automatically closes
            any event currently open.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-end">
            <div>
              <Label htmlFor="cpd-event-name">Event name</Label>
              <Input
                id="cpd-event-name"
                placeholder="e.g. Paediatric Sepsis Update"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cpd-event-date">Event date</Label>
              <Input
                id="cpd-event-date"
                placeholder="e.g. 12 June 2026"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cpd-approving-council">Approving Council</Label>
              <select
                id="cpd-approving-council"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={approvingCouncil}
                onChange={(e) => setApprovingCouncil(e.target.value)}
              >
                <option value="NCK">NCK (Nursing Council)</option>
                <option value="KMPDC">KMPDC (Medical Council)</option>
                <option value="COC">COC (Clinical Officers Council)</option>
                <option value="Other">Other / Custom</option>
                <option value="None">None / Not Approved</option>
              </select>
            </div>
            <div>
              <Label htmlFor="cpd-points">CPD Points</Label>
              <Input
                id="cpd-points"
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g. 3.0"
                value={cpdPoints}
                onChange={(e) => setCpdPoints(e.target.value)}
              />
            </div>
          </div>
          {approvingCouncil === "Other" && (
            <div className="max-w-md">
              <Label htmlFor="cpd-custom-council">Specify Council Name</Label>
              <Input
                id="cpd-custom-council"
                placeholder="e.g. Pharmacy and Poisons Board"
                value={customCouncil}
                onChange={(e) => setCustomCouncil(e.target.value)}
              />
            </div>
          )}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                const finalCouncil = approvingCouncil === "None"
                  ? null
                  : approvingCouncil === "Other"
                    ? customCouncil.trim()
                    : approvingCouncil;
                const pointsNum = cpdPoints.trim() ? Number(cpdPoints) : null;
                openEventMutation.mutate({
                  institutionId,
                  name: newEventName.trim(),
                  eventDate: newEventDate.trim(),
                  approvingCouncil: finalCouncil,
                  cpdPoints: pointsNum,
                });
              }}
              disabled={
                openEventMutation.isPending ||
                newEventName.trim().length === 0 ||
                newEventDate.trim().length === 0 ||
                (approvingCouncil === "Other" && customCouncil.trim().length === 0)
              }
            >
              {openEventMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Open Event
            </Button>
          </div>

          {/* Events list */}
          {eventsQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className={event.id === effectiveEventId ? "bg-muted/40" : undefined}
                  >
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.eventDate}</TableCell>
                    <TableCell>
                      {event.isOpen ? (
                        <Badge>Open</Badge>
                      ) : (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEventId(event.id)}
                        >
                          View
                        </Button>
                        {event.isOpen ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              closeEventMutation.mutate({ institutionId, eventId: event.id })
                            }
                            disabled={closeEventMutation.isPending}
                          >
                            <Ban className="mr-1 h-3.5 w-3.5" />
                            Close
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Registrations for selected event */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Registrations</CardTitle>
              <CardDescription>
                {selectedEvent
                  ? `${selectedEvent.name} — ${attendees.length} registered`
                  : "Select an event to view registrations"}
              </CardDescription>
            </div>
            {selectedEvent && (
              <div className="w-full mt-4 p-4 border border-border rounded-lg bg-muted/20 flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                  <Label htmlFor="cpd-code-input" className="text-sm font-medium">
                    NCK CPD Portal Secret Code
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Enter the secret code received from NCK for this training session. 
                    Attendees will see this next to their certificate to claim points on the NCK portal.
                  </p>
                  <Input
                    id="cpd-code-input"
                    placeholder="e.g. CPD-2026-CONSOLATA-XXXX"
                    value={cpdCodeInput}
                    onChange={(e) => setCpdCodeInput(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    updateCpdCodeMutation.mutate({
                      institutionId,
                      eventId: selectedEvent.id,
                      cpdCode: cpdCodeInput.trim() || null,
                    })
                  }
                  disabled={
                    updateCpdCodeMutation.isPending ||
                    (selectedEvent.cpdCode ?? "") === cpdCodeInput.trim()
                  }
                >
                  {updateCpdCodeMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Code
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCsv}
                disabled={attendees.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                size="sm"
                disabled={!effectiveEventId || attendees.length === 0}
                onClick={() => {
                  if (effectiveEventId) {
                    window.open(`/api/cpd/certificate/bulk/${effectiveEventId}`, "_blank");
                  }
                }}
              >
                <FileArchive className="mr-2 h-4 w-4" />
                Download all (ZIP)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendeesQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : attendees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations for this event yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Cadre</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Certificate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.fullName}</TableCell>
                    <TableCell>
                      {a.cadre === "Other" ? a.cadreOther || "Other" : a.cadre}
                    </TableCell>
                    <TableCell>{a.department}</TableCell>
                    <TableCell className="text-xs">{a.email}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(`/api/cpd/certificate/${a.id}`, "_blank")
                        }
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
