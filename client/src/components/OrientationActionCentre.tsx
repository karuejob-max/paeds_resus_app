import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  HeartPulse,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Attention } from "@/pages/ProviderToday";

type ActionStatus = "required" | "waiting" | "available";

type ActionItem = {
  title: string;
  detail: string;
  actionLabel: string;
  status: ActionStatus;
  onClick: () => void;
};

function statusLabel(status: ActionStatus) {
  if (status === "required") return "Do now";
  if (status === "waiting") return "Waiting";
  return "Available";
}

function statusClass(status: ActionStatus) {
  if (status === "required") return "border-amber-200 bg-amber-50 text-amber-950";
  if (status === "waiting") return "border-blue-200 bg-blue-50 text-blue-950";
  return "border-slate-200 bg-slate-50 text-slate-900";
}

function ActionRow({ item }: { item: ActionItem }) {
  return (
    <div className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${statusClass(item.status)}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{item.title}</p>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{statusLabel(item.status)}</Badge>
        </div>
        <p className="mt-1 text-sm opacity-80">{item.detail}</p>
      </div>
      <Button type="button" size="sm" variant="outline" className="shrink-0 bg-white/70" onClick={item.onClick}>
        {item.actionLabel}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

export function ProviderOrientationActionCentre({
  attention,
  hasActiveMembership,
  activeMembershipCount,
  hasPendingMembership,
  onOpenProfile,
  onOpenShift,
  onOpenLearn,
  onOpenRecords,
  onOpenResus,
}: {
  attention: Attention;
  hasActiveMembership: boolean;
  activeMembershipCount: number;
  hasPendingMembership: boolean;
  onOpenProfile: () => void;
  onOpenShift: () => void;
  onOpenLearn: () => void;
  onOpenRecords: () => void;
  onOpenResus: () => void;
}) {
  const items: ActionItem[] = [
    {
      title: attention.title,
      detail: attention.detail,
      actionLabel: attention.action,
      status: attention.tone === "red" || attention.tone === "amber" ? "required" : "available",
      onClick: () => {
        window.location.assign(attention.destination);
      },
    },
  ];

  if (!hasActiveMembership && !hasPendingMembership) {
    items.push({
      title: "Complete your professional profile",
      detail: "Add your cadre, workplace context, and professional credentials before accepting clinical or institutional responsibilities.",
      actionLabel: "Open profile",
      status: "required",
      onClick: onOpenProfile,
    });
  } else if (activeMembershipCount > 1) {
    items.push({
      title: "Confirm your current institution",
      detail: "You have multiple active facilities. Open Workplaces & access before acting so your staff, duties, and approvals stay in the correct institution.",
      actionLabel: "Review workplaces",
      status: "waiting",
      onClick: onOpenRecords,
    });
  }

  return (
    <Card className="border-2 border-teal-200 bg-white shadow-sm" data-orientation="provider-action-centre">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-teal-100 p-2 text-teal-800"><CheckCircle2 className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Your Action Centre</p>
            <CardTitle className="mt-1 text-lg">What should I do now?</CardTitle>
            <CardDescription>Paeds Resus keeps the next important action here. Use the destinations below when you need a different task.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(item => <ActionRow key={item.title} item={item} />)}
        <div className="grid gap-2 pt-1 sm:grid-cols-4">
          <Button type="button" variant="outline" className="h-auto justify-start gap-2 bg-white py-3 text-left" onClick={onOpenProfile}>
            <FileCheck2 className="h-4 w-4 text-indigo-700" />
            <span><span className="block text-xs font-semibold">Profile & credentials</span><span className="block text-[11px] font-normal text-muted-foreground">Identity and licence evidence</span></span>
          </Button>
          <Button type="button" variant="outline" className="h-auto justify-start gap-2 bg-white py-3 text-left" onClick={onOpenResus}>
            <Siren className="h-4 w-4 text-red-700" />
            <span><span className="block text-xs font-semibold">ResusGPS</span><span className="block text-[11px] font-normal text-muted-foreground">Bedside emergency guidance</span></span>
          </Button>
          <Button type="button" variant="outline" className="h-auto justify-start gap-2 bg-white py-3 text-left" onClick={onOpenLearn}>
            <BookOpen className="h-4 w-4 text-violet-700" />
            <span><span className="block text-xs font-semibold">Learn</span><span className="block text-[11px] font-normal text-muted-foreground">Fellowship and AHA tracks</span></span>
          </Button>
          <Button type="button" variant="outline" className="h-auto justify-start gap-2 bg-white py-3 text-left" onClick={onOpenShift}>
            <Users className="h-4 w-4 text-teal-700" />
            <span><span className="block text-xs font-semibold">My Shift</span><span className="block text-[11px] font-normal text-muted-foreground">Duties, readiness, response</span></span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function institutionRoleLabel(isInstitutionAdmin: boolean, roleKeys: string[]) {
  if (isInstitutionAdmin) return "Institutional administrator";
  if (roleKeys.some(key => ["department_head", "deputy_department_head"].includes(key))) return "Departmental leadership";
  if (roleKeys.some(key => ["institutional_erco", "erco", "iers_coordinator"].includes(key))) return "Emergency response coordination";
  if (roleKeys.some(key => ["institutional_cpd_coordinator", "cpd_coordinator", "cpd_education_coordinator"].includes(key))) return "CPD coordination";
  return "Institutional team member";
}

export function InstitutionOrientationActionCentre({
  isInstitutionAdmin,
  roleKeys,
  canViewAccountability,
  hasIersRole,
  hasCpdRole,
  onOpenAccountability,
  onOpenLearning,
  onOpenReadiness,
  onOpenAdministration,
}: {
  isInstitutionAdmin: boolean;
  roleKeys: string[];
  canViewAccountability: boolean;
  hasIersRole: boolean;
  hasCpdRole: boolean;
  onOpenAccountability: () => void;
  onOpenLearning: () => void;
  onOpenReadiness: () => void;
  onOpenAdministration: () => void;
}) {
  const roleLabel = institutionRoleLabel(isInstitutionAdmin, roleKeys);
  const items: ActionItem[] = [];

  if (canViewAccountability) {
    items.push({ title: "Review staff credentials and readiness gaps", detail: "Start with missing, rejected, expiring, or unverified credentials in your authorised institution scope.", actionLabel: "Open accountability", status: "required", onClick: onOpenAccountability });
  }
  if (hasIersRole) {
    items.push({ title: "Check emergency-response readiness", detail: "Use the Readiness lane for response teams, duties, equipment, and operational exceptions.", actionLabel: "Open readiness", status: items.length ? "available" : "required", onClick: onOpenReadiness });
  }
  if (hasCpdRole) {
    items.push({ title: "Plan learning and CPD", detail: "Use Learning for competency sessions, attendance, CPD coordination, and synthesized progress.", actionLabel: "Open learning", status: items.length ? "available" : "required", onClick: onOpenLearning });
  }
  if (isInstitutionAdmin) {
    items.push({ title: "Manage people, roles, and institution setup", detail: "Administrators own staff linking, role appointments, institution settings, and access operations.", actionLabel: "Open administration", status: items.length ? "available" : "required", onClick: onOpenAdministration });
  }

  return (
    <Card className="border-2 border-indigo-200 bg-white shadow-sm" data-orientation="institution-action-centre">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-800"><Building2 className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Your institutional route</p>
            <CardTitle className="mt-1 text-lg">{roleLabel}</CardTitle>
            <CardDescription>Your view is scoped to the selected institution and the permissions attached to this role. Start with the next operational decision below.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map(item => <ActionRow key={item.title} item={item} />) : (
          <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
            <div><p className="font-semibold">Your institutional access is being prepared</p><p className="mt-1 text-muted-foreground">You can view the institution overview. An administrator must assign a product role before operational lanes become available.</p></div>
          </div>
        )}
        <div className="grid gap-2 border-t pt-3 sm:grid-cols-3">
          <div className="flex items-start gap-2 text-xs text-muted-foreground"><ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" /><span><strong className="text-foreground">Credentials</strong> are reviewed by authorised platform or institution verifiers.</span></div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground"><HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" /><span><strong className="text-foreground">Readiness</strong> supports operations; it does not replace bedside judgement.</span></div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" /><span><strong className="text-foreground">Switch institution</strong> before reviewing another facility’s data.</span></div>
        </div>
      </CardContent>
    </Card>
  );
}
