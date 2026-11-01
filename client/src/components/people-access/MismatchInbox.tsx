import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { InstitutionPeopleRolesPanel } from "@/components/InstitutionPeopleRolesPanel";
import { PendingLinkRequestsWidget } from "@/components/PendingLinkRequestsWidget";

export function MismatchInbox({
  institutionId,
  focus,
}: {
  institutionId: number;
  focus?: { kind: "mismatch" | "link-request"; id: number };
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Mismatch inbox
          </CardTitle>
          <CardDescription>
            Review pending access links and department evidence conflicts.
            Actions remain institution-scoped and preserve historical records.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0" />
      </Card>
      <PendingLinkRequestsWidget
        institutionId={institutionId}
        focusRequestId={focus?.kind === "link-request" ? focus.id : undefined}
      />
      <InstitutionPeopleRolesPanel
        institutionId={institutionId}
        initialSection="roster"
        focusMismatchReportId={
          focus?.kind === "mismatch" ? focus.id : undefined
        }
      />
    </div>
  );
}
