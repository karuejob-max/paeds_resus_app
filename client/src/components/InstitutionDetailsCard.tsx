import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { CARE_FACILITY_LEVEL_OPTIONS, FACILITY_OWNERSHIP_OPTIONS, INSTITUTION_CATEGORY_OPTIONS, requiresCareFacilityClassification, type CareFacilityLevel, type FacilityOwnership, type InstitutionCategory } from "@shared/institution-onboarding";
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
  organizationCategory,
  facilityOwnership,
  facilityCareLevel,
  facilityLocalLevel,
}: {
  institutionId: number;
  companyName: string;
  contactPhone: string | null;
  contactEmail: string;
  staffCount: number | null;
  organizationCategory?: string | null;
  facilityOwnership?: string | null;
  facilityCareLevel?: string | null;
  facilityLocalLevel?: string | null;
}) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    companyName,
    contactPhone: contactPhone ?? "",
    contactEmail,
    staffCount: staffCount != null ? String(staffCount) : "",
    organizationCategory: organizationCategory ?? "",
    facilityOwnership: facilityOwnership ?? "",
    facilityCareLevel: facilityCareLevel ?? "",
    facilityLocalLevel: facilityLocalLevel ?? "",
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
        organizationCategory: organizationCategory ?? "",
        facilityOwnership: facilityOwnership ?? "",
        facilityCareLevel: facilityCareLevel ?? "",
        facilityLocalLevel: facilityLocalLevel ?? "",
      });
    }
  }, [editing, companyName, contactPhone, contactEmail, staffCount, organizationCategory, facilityOwnership, facilityCareLevel, facilityLocalLevel]);

  const updateMutation = trpc.institution.updateDetails.useMutation({
    onSuccess: () => {
      toast.success("Institution details updated");
      setEditing(false);
      void utils.institution.getMyInstitution.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to update details"),
  });

  const categoryLabel = INSTITUTION_CATEGORY_OPTIONS.find(option => option.value === organizationCategory)?.label ?? "Not classified";
  const ownershipLabel = FACILITY_OWNERSHIP_OPTIONS.find(option => option.value === facilityOwnership)?.label;
  const careLevelLabel = CARE_FACILITY_LEVEL_OPTIONS.find(option => option.value === facilityCareLevel)?.label;
  const editingRequiresCareClassification = requiresCareFacilityClassification(form.organizationCategory);

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-3 sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Organization classification</p>
            <p className="mt-1 font-medium">{categoryLabel}</p>
            {ownershipLabel || careLevelLabel || facilityLocalLevel ? <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3"><span>Ownership: {ownershipLabel ?? "Not recorded"}</span><span>Care classification: {careLevelLabel ?? "Not recorded"}</span><span>Local designation: {facilityLocalLevel || "Not recorded"}</span></div> : <p className="mt-1 text-xs text-muted-foreground">Review classification in onboarding if this does not reflect your organization.</p>}
          </div>
          {editing && <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:col-span-2"><div><p className="font-medium">Maintain classification</p><p className="mt-1 text-xs text-muted-foreground">Use the closest local equivalent when your country does not use Kenya’s Level 1–6 terminology.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label>Organization category</Label><Select value={form.organizationCategory || undefined} onValueChange={value => setForm(current => ({ ...current, organizationCategory: value, facilityOwnership: requiresCareFacilityClassification(value) ? current.facilityOwnership : "", facilityCareLevel: requiresCareFacilityClassification(value) ? current.facilityCareLevel : "", facilityLocalLevel: requiresCareFacilityClassification(value) ? current.facilityLocalLevel : "" }))}><SelectTrigger><SelectValue placeholder="Select organization category" /></SelectTrigger><SelectContent>{INSTITUTION_CATEGORY_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>{editingRequiresCareClassification && <><div className="space-y-2"><Label>Ownership model</Label><Select value={form.facilityOwnership || undefined} onValueChange={value => setForm(current => ({ ...current, facilityOwnership: value }))}><SelectTrigger><SelectValue placeholder="Select ownership" /></SelectTrigger><SelectContent>{FACILITY_OWNERSHIP_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Care tier and level</Label><Select value={form.facilityCareLevel || undefined} onValueChange={value => setForm(current => ({ ...current, facilityCareLevel: value, facilityLocalLevel: value === "other_or_not_sure" ? current.facilityLocalLevel : "" }))}><SelectTrigger><SelectValue placeholder="Select care classification" /></SelectTrigger><SelectContent>{CARE_FACILITY_LEVEL_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2 sm:col-span-2"><Label>Local designation (optional unless using another national classification)</Label><Input value={form.facilityLocalLevel} onChange={event => setForm(current => ({ ...current, facilityLocalLevel: event.target.value }))} placeholder="e.g. national level or local equivalent" /></div></>}</div></div>}
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
              disabled={!form.companyName.trim() || !form.contactEmail.trim() || (editingRequiresCareClassification && (!form.facilityOwnership || !form.facilityCareLevel)) || updateMutation.isPending}

              onClick={() =>
                updateMutation.mutate({
                  institutionId,
                  companyName: form.companyName.trim(),
                  contactPhone: form.contactPhone.trim() || undefined,
                  contactEmail: form.contactEmail.trim(),
                  staffCount: form.staffCount ? parseInt(form.staffCount, 10) : 0,
                  organizationCategory: form.organizationCategory ? form.organizationCategory as InstitutionCategory : undefined,
                  facilityOwnership: editingRequiresCareClassification && form.facilityOwnership ? form.facilityOwnership as FacilityOwnership : undefined,
                  facilityCareLevel: editingRequiresCareClassification && form.facilityCareLevel ? form.facilityCareLevel as CareFacilityLevel : undefined,
                  facilityLocalLevel: editingRequiresCareClassification ? form.facilityLocalLevel.trim() || undefined : undefined,
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
