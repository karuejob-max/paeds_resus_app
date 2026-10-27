import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, CheckCircle2, Info } from "lucide-react";
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
      void utils.institution.getDetails.invalidate({ institutionId });
      void utils.institution.getMyInstitution.invalidate();
      void utils.institutionAccountability.getMyWorkspace.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to update details"),
  });

  const categoryLabel = INSTITUTION_CATEGORY_OPTIONS.find(option => option.value === organizationCategory)?.label ?? "Not classified";
  const ownershipLabel = FACILITY_OWNERSHIP_OPTIONS.find(option => option.value === facilityOwnership)?.label;
  const careLevelLabel = CARE_FACILITY_LEVEL_OPTIONS.find(option => option.value === facilityCareLevel)?.label;
  const isCareFacility = requiresCareFacilityClassification(organizationCategory);
  const editingRequiresCareClassification = requiresCareFacilityClassification(form.organizationCategory);
  const parsedStaffCount = form.staffCount.trim() === "" ? 0 : Number(form.staffCount);
  const validStaffCount = Number.isInteger(parsedStaffCount) && parsedStaffCount >= 0;

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
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-teal-50/60 shadow-sm sm:col-span-2 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-teal-950/20">
            <div className="flex flex-col gap-3 border-b border-slate-200/80 px-4 py-4 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-teal-100 p-2 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"><Building2 className="h-5 w-5" aria-hidden="true" /></span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-800 dark:text-teal-300">Organization classification</p>
                  <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">{categoryLabel}</p>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">The facility profile used for institutional planning, access, and reporting. It does not replace regulatory registration.</p>
                </div>
              </div>
              {!editing ? <span className="inline-flex items-center gap-1 self-start rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Profile summary</span> : null}
            </div>
            <div className="grid gap-px bg-slate-200/70 sm:grid-cols-3 dark:bg-slate-800">
              <ClassificationValue label="Ownership" value={isCareFacility ? ownershipLabel : "Not applicable"} />
              <ClassificationValue label="Care classification" value={isCareFacility ? careLevelLabel : "Not applicable"} />
              <ClassificationValue label="Local designation" value={isCareFacility ? facilityLocalLevel : "Not applicable"} optional />
            </div>
            {!ownershipLabel || !careLevelLabel ? <div className="flex items-start gap-2 border-t border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>Classification is incomplete. Add the missing facility details so institutional reports can be interpreted correctly.</span></div> : null}
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
              disabled={!form.companyName.trim() || !form.contactEmail.trim() || !validStaffCount || (editingRequiresCareClassification && (!form.facilityOwnership || !form.facilityCareLevel)) || updateMutation.isPending}

              onClick={() =>
                updateMutation.mutate({
                  institutionId,
                  companyName: form.companyName.trim(),
                  contactPhone: form.contactPhone.trim() || undefined,
                  contactEmail: form.contactEmail.trim(),
                  staffCount: parsedStaffCount,
                  organizationCategory: form.organizationCategory ? form.organizationCategory as InstitutionCategory : undefined,
                  facilityOwnership: editingRequiresCareClassification && form.facilityOwnership ? form.facilityOwnership as FacilityOwnership : undefined,
                  facilityCareLevel: editingRequiresCareClassification && form.facilityCareLevel ? form.facilityCareLevel as CareFacilityLevel : undefined,
                  facilityLocalLevel: editingRequiresCareClassification ? form.facilityLocalLevel.trim() || null : null,
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

function ClassificationValue({ label, value, optional = false }: { label: string; value?: string | null; optional?: boolean }) {
  return <div className="bg-white/80 px-4 py-3 dark:bg-slate-950/50"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className={`mt-1 text-sm font-medium ${value ? "text-slate-900 dark:text-slate-100" : "text-muted-foreground"}`}>{value || (optional ? "Not recorded" : "Needs review")}</p></div>;
}
