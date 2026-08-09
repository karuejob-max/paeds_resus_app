import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

/**
 * institution.updateDetails was fully built with no UI calling it anywhere
 * in the client (found during the 2026-08-08 institutional portal gap
 * audit) -- coordinators had no self-service way to correct their own
 * institution's name, contact details, or staff count.
 */
export function InstitutionDetailsCard({
  institutionId,
  companyName,
  contactPhone,
  contactEmail,
  staffCount,
}: {
  institutionId: number;
  companyName: string;
  contactPhone: string | null;
  contactEmail: string;
  staffCount: number | null;
}) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    companyName,
    contactPhone: contactPhone ?? "",
    contactEmail,
    staffCount: staffCount != null ? String(staffCount) : "",
  });

  // Keep the form in sync if the underlying query data changes (e.g. after
  // another admin updates it, or on refetch) while not actively editing.
  useEffect(() => {
    if (!editing) {
      setForm({
        companyName,
        contactPhone: contactPhone ?? "",
        contactEmail,
        staffCount: staffCount != null ? String(staffCount) : "",
      });
    }
  }, [editing, companyName, contactPhone, contactEmail, staffCount]);

  const updateMutation = trpc.institution.updateDetails.useMutation({
    onSuccess: () => {
      toast.success("Institution details updated");
      setEditing(false);
      void utils.institution.getMyInstitution.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to update details"),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Institution Details
          </CardTitle>
          <CardDescription>Your institution's name and contact information</CardDescription>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="inst-name">Institution name</Label>
            <Input
              id="inst-name"
              value={form.companyName}
              disabled={!editing}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inst-phone">Contact phone</Label>
            <Input
              id="inst-phone"
              value={form.contactPhone}
              disabled={!editing}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inst-email">Contact email</Label>
            <Input
              id="inst-email"
              type="email"
              value={form.contactEmail}
              disabled={!editing}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inst-staff-count">Total staff count</Label>
            <Input
              id="inst-staff-count"
              type="number"
              min={0}
              value={form.staffCount}
              disabled={!editing}
              onChange={(e) => setForm((f) => ({ ...f, staffCount: e.target.value }))}
            />
          </div>
        </div>

        {editing && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              disabled={!form.companyName.trim() || !form.contactEmail.trim() || updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  institutionId,
                  companyName: form.companyName.trim(),
                  contactPhone: form.contactPhone.trim() || undefined,
                  contactEmail: form.contactEmail.trim(),
                  staffCount: form.staffCount ? parseInt(form.staffCount, 10) : undefined,
                })
              }
            >
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
