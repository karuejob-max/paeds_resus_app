import {
  BookOpen,
  Building2,
  ClipboardCheck,
  FileCheck2,
  HeartPulse,
  Siren,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskQueue, type TaskPriority } from "@/components/TaskQueue";
import type { Attention } from "@/pages/ProviderToday";

type ActionItem = {
  title: string;
  detail: string;
  actionLabel: string;
  status: TaskPriority;
  onClick: () => void;
};
type Shortcut = {
  label: string;
  detail: string;
  icon: typeof FileCheck2;
  onClick: () => void;
  color: string;
};

function Shortcuts({ items }: { items: Shortcut[] }) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      data-role-task-links
    >
      {items.map(({ label, detail, icon: Icon, onClick, color }) => (
        <Button
          key={label}
          type="button"
          variant="outline"
          className="h-auto justify-start gap-2 bg-white py-3 text-left dark:bg-slate-950"
          onClick={onClick}
        >
          <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
          <span>
            <span className="block text-xs font-semibold">{label}</span>
            <span className="block text-[11px] font-normal text-muted-foreground">
              {detail}
            </span>
          </span>
        </Button>
      ))}
    </div>
  );
}

function Queue({
  items,
  title,
  description,
  emptyDetail,
}: {
  items: ActionItem[];
  title: string;
  description: string;
  emptyDetail?: string;
}) {
  return (
    <TaskQueue
      items={items.map(item => ({
        id: item.title,
        title: item.title,
        detail: item.detail,
        actionLabel: item.actionLabel,
        priority: item.status,
        onAction: item.onClick,
      }))}
      title={title}
      description={description}
      emptyTitle="Your access is up to date"
      emptyDetail={emptyDetail}
    />
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
      status:
        attention.tone === "red" || attention.tone === "amber"
          ? "required"
          : "available",
      onClick: () => window.location.assign(attention.destination),
    },
  ];
  if (!hasActiveMembership && !hasPendingMembership)
    items.push({
      title: "Complete your professional profile",
      detail:
        "Add your cadre, workplace context, and professional credentials before accepting clinical or institutional responsibilities.",
      actionLabel: "Open profile",
      status: "required",
      onClick: onOpenProfile,
    });
  else if (activeMembershipCount > 1)
    items.push({
      title: "Confirm your current institution",
      detail:
        "You have multiple active facilities. Open Workplaces & access before acting so your staff, duties, and approvals stay in the correct institution.",
      actionLabel: "Review workplaces",
      status: "waiting",
      onClick: onOpenRecords,
    });
  return (
    <div className="space-y-3" data-orientation="provider-action-centre">
      <Queue
        items={items}
        title="What should I do now?"
        description="Paeds Resus keeps the next important action here. Use the destinations below when you need a different task."
      />
      <Shortcuts
        items={[
          {
            label: "Profile & credentials",
            detail: "Identity and licence evidence",
            icon: FileCheck2,
            color: "text-indigo-700",
            onClick: onOpenProfile,
          },
          {
            label: "ResusGPS",
            detail: "Bedside emergency guidance",
            icon: Siren,
            color: "text-red-700",
            onClick: onOpenResus,
          },
          {
            label: "Learn",
            detail: "Fellowship and AHA tracks",
            icon: BookOpen,
            color: "text-violet-700",
            onClick: onOpenLearn,
          },
          {
            label: "My Shift",
            detail: "Duties, readiness, response",
            icon: Users,
            color: "text-teal-700",
            onClick: onOpenShift,
          },
        ]}
      />
    </div>
  );
}

function institutionRoleLabel(isInstitutionAdmin: boolean, roleKeys: string[]) {
  if (isInstitutionAdmin) return "Institutional administrator";
  if (
    roleKeys.some(key =>
      ["department_head", "deputy_department_head"].includes(key)
    )
  )
    return "Departmental leadership";
  if (
    roleKeys.some(key =>
      ["institutional_erco", "erco", "iers_coordinator"].includes(key)
    )
  )
    return "Emergency response coordination";
  if (
    roleKeys.some(key =>
      [
        "institutional_cpd_coordinator",
        "cpd_coordinator",
        "cpd_education_coordinator",
      ].includes(key)
    )
  )
    return "CPD coordination";
  return "Institutional team member";
}

export function InstitutionOrientationActionCentre({
  institutionId,
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
  institutionId: number;
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
  const hasDepartmentLeadership =
    isInstitutionAdmin ||
    roleKeys.some(key =>
      ["department_head", "deputy_department_head"].includes(key)
    );
  const hasDepartmentCpd = roleKeys.some(key =>
    ["cpd_education_coordinator", "deputy_department_cpd_coordinator"].includes(
      key
    )
  );
  const hasInstitutionCpd =
    isInstitutionAdmin ||
    roleKeys.some(key =>
      ["cpd_coordinator", "institutional_cpd_coordinator"].includes(key)
    );
  const hasInstitutionIers =
    isInstitutionAdmin ||
    roleKeys.some(key =>
      [
        "iers_chair",
        "iers_coordinator",
        "iers_governance",
        "institutional_erco",
      ].includes(key)
    );
  if (canViewAccountability)
    items.push({
      title: "Review staff credentials and readiness gaps",
      detail:
        "Start with missing, rejected, expiring, or unverified credentials in your authorised institution scope.",
      actionLabel: "Open accountability",
      status: "required",
      onClick: onOpenAccountability,
    });
  if (hasIersRole)
    items.push({
      title: "Check emergency-response readiness",
      detail:
        "Use the Readiness lane for response teams, duties, equipment, and operational exceptions.",
      actionLabel: "Open readiness",
      status: items.length ? "available" : "required",
      onClick: onOpenReadiness,
    });
  if (hasCpdRole)
    items.push({
      title: "Plan learning and CPD",
      detail:
        "Use Learning for competency sessions, attendance, CPD coordination, and synthesized progress.",
      actionLabel: "Open learning",
      status: items.length ? "available" : "required",
      onClick: onOpenLearning,
    });
  if (isInstitutionAdmin)
    items.push({
      title: "Manage people, roles, and institution setup",
      detail:
        "Administrators own staff linking, role appointments, institution settings, and access operations.",
      actionLabel: "Open administration",
      status: items.length ? "available" : "required",
      onClick: onOpenAdministration,
    });
  const shortcuts: Shortcut[] = [];
  if (hasDepartmentLeadership) {
    shortcuts.push({
      label: "Review department staff",
      detail: "Credentials, learning, conflicts",
      icon: ClipboardCheck,
      color: "text-indigo-700",
      onClick: onOpenAccountability,
    });
    shortcuts.push({
      label: "Appoint department roles",
      detail: "ERCo and CPD Coordinator",
      icon: Users,
      color: "text-teal-700",
      onClick: () =>
        window.location.assign(
          `/institution?section=iers&iersTab=workforce&workforceTab=erco&institutionId=${institutionId}#team-setup-erco`
        ),
    });
  }
  if (hasDepartmentCpd || hasInstitutionCpd)
    shortcuts.push({
      label: "Create CPD session",
      detail: "Start with the presenter search",
      icon: BookOpen,
      color: "text-violet-700",
      onClick: () =>
        window.location.assign(
          `/institution?section=learning&learningTab=cpd&cpdTab=new_session&institutionId=${institutionId}`
        ),
    });
  if (hasInstitutionIers)
    shortcuts.push({
      label: "Manage readiness teams",
      detail: "Staffing and emergency roles",
      icon: HeartPulse,
      color: "text-red-700",
      onClick: () =>
        window.location.assign(
          `/institution?section=iers&iersTab=workforce&institutionId=${institutionId}`
        ),
    });
  return (
    <div className="space-y-3" data-orientation="institution-action-centre">
      <Queue
        items={items}
        title={roleLabel}
        description="Your view is scoped to the selected institution and the permissions attached to this role. Start with the next operational decision below."
        emptyDetail="You can view the institution overview. An administrator must assign a product role before operational lanes become available."
      />
      {shortcuts.length ? <Shortcuts items={shortcuts} /> : null}
      <div className="grid gap-2 border-t pt-3 sm:grid-cols-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ClipboardCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700"
            aria-hidden="true"
          />
          <span>
            <strong className="text-foreground">Credentials</strong> are
            reviewed by authorised platform or institution verifiers.
          </span>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <HeartPulse
            className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
            aria-hidden="true"
          />
          <span>
            <strong className="text-foreground">Readiness</strong> supports
            operations; it does not replace bedside judgement.
          </span>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Building2
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-700"
            aria-hidden="true"
          />
          <span>
            <strong className="text-foreground">Switch institution</strong>{" "}
            before reviewing another facility’s data.
          </span>
        </div>
      </div>
    </div>
  );
}
