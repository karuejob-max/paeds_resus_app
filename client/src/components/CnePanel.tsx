import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { trpc } from "@/lib/trpc";
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
} from "lucide-react";

interface CnePanelProps {
  institutionId: number;
}

/**
 * Self-contained admin UI for the multi-institutional CNE attendance service.
 * Lets an institution admin set the CNE Coordinator name, open/close events,
 * view registrations, share the public QR/link, and download certificates
 * (single PDF + bulk ZIP) via the streaming Express routes.
 */
export default function CnePanel({ institutionId }: CnePanelProps) {
  const utils = trpc.useUtils();

  const settingsQuery = trpc.cne.getSettings.useQuery({ institutionId });
  const eventsQuery = trpc.cne.listEvents.useQuery({ institutionId });

  const [coordinatorName, setCoordinatorName] = useState<string | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const events = eventsQuery.data ?? [];
  const openEvent = events.find((e) => e.isOpen) ?? null;
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const effectiveEventId = selectedEventId ?? openEvent?.id ?? events[0]?.id ?? null;

  const attendeesQuery = trpc.cne.listAttendees.useQuery(
    { institutionId, eventId: effectiveEventId ?? undefined },
    { enabled: effectiveEventId != null }
  );
  const attendees = attendeesQuery.data ?? [];

  const coordinatorValue =
    coordinatorName ?? settingsQuery.data?.coordinatorName ?? "";

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/cne/register/${institutionId}`;
  }, [institutionId]);

  const updateCoordinatorMutation = trpc.cne.updateCoordinator.useMutation({
    onSuccess: () => {
      toast.success("CNE Coordinator updated");
      void utils.cne.getSettings.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to update coordinator"),
  });

  const openEventMutation = trpc.cne.openEvent.useMutation({
    onSuccess: () => {
      toast.success("Event opened for registration");
      setNewEventName("");
      setNewEventDate("");
      void utils.cne.listEvents.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to open event"),
  });

  const closeEventMutation = trpc.cne.closeEvent.useMutation({
    onSuccess: () => {
      toast.success("Event closed");
      void utils.cne.listEvents.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to close event"),
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const downloadCsv = async () => {
    try {
      const result = await utils.cne.exportCsv.fetch({
        institutionId,
        eventId: effectiveEventId ?? undefined,
      });
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cne-attendees-${effectiveEventId ?? "all"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message || "Failed to export CSV");
    }
  };

  const selectedEvent = events.find((e) => e.id === effectiveEventId) ?? null;

  return (
    <div className="space-y-6">
      {/* Coordinator settings */}
      <Card>
        <CardHeader>
          <CardTitle>CNE Coordinator</CardTitle>
          <CardDescription>
            This name is printed on the signature line of every certificate your institution issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="cne-coordinator">Coordinator name</Label>
              <Input
                id="cne-coordinator"
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
        </CardContent>
      </Card>

      {/* QR code + public link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" /> Registration QR Code
          </CardTitle>
          <CardDescription>
            Nurses scan this code (or open the link) to register — no login required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="rounded-lg border bg-white p-3">
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
          <CardTitle>CNE Events</CardTitle>
          <CardDescription>
            Open an event to start accepting registrations. Opening a new event automatically closes
            any event currently open.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="cne-event-name">Event name</Label>
              <Input
                id="cne-event-name"
                placeholder="e.g. Paediatric Sepsis Update"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cne-event-date">Event date</Label>
              <Input
                id="cne-event-date"
                placeholder="e.g. 12 June 2026"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
              />
            </div>
            <Button
              onClick={() =>
                openEventMutation.mutate({
                  institutionId,
                  name: newEventName.trim(),
                  eventDate: newEventDate.trim(),
                })
              }
              disabled={
                openEventMutation.isPending ||
                newEventName.trim().length === 0 ||
                newEventDate.trim().length === 0
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
                    window.open(`/api/cne/certificate/bulk/${effectiveEventId}`, "_blank");
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
                          window.open(`/api/cne/certificate/${a.id}`, "_blank")
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
