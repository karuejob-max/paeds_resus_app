import { useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  RefreshCw,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInstitutionAdministrationAttention } from "@shared/institution-administration";

type AdministrationTab =
  | "institution"
  | "billing"
  | "program_operations"
  | "data_support";

type StaffRow = {
  id: number;
  staffEmail?: string | null;
  department?: string | null;
  removedAt?: Date | string | null;
  membershipStatus?: string | null;
  facilityLinkStatus?: string | null;
};

type CatalogRow = {
  productKey?: string;
  displayName?: string | null;
  subscriptionStatus?: string | null;
  renewsAt?: Date | string | null;
  expiresAt?: Date | string | null;
};

function statusLabel(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "Active";
    case "trial":
      return "Trial";
    case "grace":
      return "Renewal due";
    case "past_due":
      return "Payment past due";
    case "expired":
      return "Expired — history preserved";
    case "suspended":
      return "Suspended";
    case "cancelled":
      return "Cancelled";
    case "payment_pending":
      return "Payment pending";
    case "ready_for_payment":
      return "Ready for payment";
    case "blocked":
      return "Blocked — review";
    case "paid":
      return "Paid";
    case "in_delivery":
      return "In delivery";
    case "completed":
      return "Completed";
    case "draft":
      return "Draft";
    default:
      return status ? status.replaceAll("_", " ") : "Not available";
  }
}

function isAttentionStatus(status: string | null | undefined): boolean {
  return [
    "grace",
    "past_due",
    "expired",
    "suspended",
    "cancelled",
    "payment_pending",
    "ready_for_payment",
    "blocked",
  ].includes(status ?? "");
}

function dateLabel(value: Date | string | null | undefined): string {
  if (!value) return "Not dated";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Not dated" : date.toLocaleDateString();
}

export function InstitutionAdministrationOverview({
  institutionId,
  onNavigate,
}: {
  institutionId: number;
  onNavigate: (tab: AdministrationTab) => void;
}) {
  const utils = trpc.useUtils();
  const statsQuery = trpc.institution.getStats.useQuery(
    { institutionId },
    { staleTime: 30_000 }
  );
  const staffQuery = trpc.institution.getStaffMembers.useQuery(
    { institutionId, includeRemoved: false },
    { staleTime: 30_000 }
  );
  const pendingLinksQuery = trpc.institution.getPendingLinkRequests.useQuery(
    { institutionId },
    { staleTime: 30_000 }
  );
  const mismatchQuery = trpc.institution.getDepartmentMismatchReports.useQuery(
    { institutionId },
    { staleTime: 30_000 }
  );
  const catalogQuery = trpc.institutionProducts.getCatalog.useQuery(
    { institutionId },
    { staleTime: 30_000 }
  );
  const ilsOrdersQuery =
    trpc.institutionalLifeSupport.getInstitutionOrders.useQuery(
      { institutionId },
      { staleTime: 30_000 }
    );

  const staff = (staffQuery.data ?? []) as StaffRow[];
  const catalog = (catalogQuery.data ?? []) as CatalogRow[];
  const ilsOrders = ilsOrdersQuery.data ?? [];
  const activeStaff = staff.filter(
    row => !row.removedAt && row.membershipStatus !== "ended"
  );
  const missingDepartment = activeStaff.filter(
    row => !row.department?.trim()
  ).length;
  const pendingLinkCount = pendingLinksQuery.data?.length ?? 0;
  const mismatchCount = mismatchQuery.data?.length ?? 0;
  const productIssues = catalog.filter(row =>
    isAttentionStatus(row.subscriptionStatus)
  );
  const ilsAttentionOrders = ilsOrders.filter(order =>
    isAttentionStatus(String(order.orderStatus ?? ""))
  );
  const loading =
    statsQuery.isLoading ||
    staffQuery.isLoading ||
    catalogQuery.isLoading ||
    ilsOrdersQuery.isLoading;
  const failed =
    statsQuery.isError ||
    staffQuery.isError ||
    catalogQuery.isError ||
    ilsOrdersQuery.isError;
  const attentionItems = getInstitutionAdministrationAttention({
    pendingLinkRequests: pendingLinkCount,
    departmentMismatches: mismatchCount,
    missingDepartments: missingDepartment,
    productIssues: productIssues.length,
    ilsOrdersNeedingAttention: ilsAttentionOrders.length,
  });
  const attentionCount = attentionItems.length;
  const latestOrders = useMemo(() => ilsOrders.slice(0, 3), [ilsOrders]);

  const refresh = () => {
    void Promise.all([
      statsQuery.refetch(),
      staffQuery.refetch(),
      pendingLinksQuery.refetch(),
      mismatchQuery.refetch(),
      catalogQuery.refetch(),
      ilsOrdersQuery.refetch(),
    ]);
  };

  return (
    <div className="space-y-6">
      <Card
        className={
          attentionCount > 0
            ? "border-amber-300 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20"
            : "border-emerald-300 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
        }
      >
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldIcon />
                Administration attention
              </CardTitle>
              <CardDescription>
                Start with the decisions that keep the institution’s people,
                access, payments, training, and evidence moving. This is a
                control-plane view; bedside response remains in the provider
                workflow.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {failed ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-background p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold">
                  Some administration signals are unavailable
                </p>
                <p className="mt-1 text-muted-foreground">
                  No action is inferred from a failed query. Open the relevant
                  lane directly or refresh.
                </p>
              </div>
            </div>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">
              Loading current administration signals…
            </p>
          ) : attentionItems.length === 0 ? (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-background p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="font-semibold">
                  No administration blocker detected
                </p>
                <p className="mt-1 text-muted-foreground">
                  Continue with routine roster, product, programme, and evidence
                  review.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {attentionItems.map(item => (
                <div
                  key={item.label}
                  className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => onNavigate(item.lane)}
                  >
                    Review <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="Active roster"
          value={loading ? "—" : String(activeStaff.length)}
          detail="people on the institution roster"
        />
        <MetricCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Product issues"
          value={loading ? "—" : String(productIssues.length)}
          detail="renewal or access items needing review"
          tone={productIssues.length > 0 ? "amber" : "default"}
        />
        <MetricCard
          icon={<GraduationCap className="h-4 w-4" />}
          label="ILS orders"
          value={loading ? "—" : String(ilsOrders.length)}
          detail="institution-paid cohort orders"
        />
        <MetricCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="CPD sessions"
          value={loading ? "—" : String(statsQuery.data?.totalCpdEvents ?? 0)}
          detail={`${statsQuery.data?.completionRate ?? 0}% roster completion`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Administration lanes</CardTitle>
            <CardDescription>
              Open the lane that owns the decision. Product work stays separate
              from emergency bedside operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <LaneButton
              title="Institution & people"
              detail="Identity, roster, roles, links, departments, and staff import."
              onClick={() => onNavigate("institution")}
            />
            <LaneButton
              title="Products & billing"
              detail="IERS/CPD access, renewal, contracts, and payment history."
              onClick={() => onNavigate("billing")}
            />
            <LaneButton
              title="Programme operations"
              detail="IERS, CPD, and institution-paid ILS operating handoffs."
              onClick={() => onNavigate("program_operations")}
            />
            <LaneButton
              title="Data & support"
              detail="Exports, retention, recovery, notifications, and support requests."
              onClick={() => onNavigate("data_support")}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest ILS cohort orders</CardTitle>
            <CardDescription>
              ILS is an institution-paid provider cohort, not an individual
              self-pay course or a subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ilsOrdersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading ILS order state…
              </p>
            ) : latestOrders.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No ILS cohort orders recorded. Open the ILS lane when your
                institution is ready to plan a provider cohort.
              </p>
            ) : (
              latestOrders.map(order => (
                <div
                  key={order.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.providerCount ?? order.providers?.length ?? 0}{" "}
                      provider(s) · {dateLabel(order.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      isAttentionStatus(String(order.orderStatus ?? ""))
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {statusLabel(String(order.orderStatus ?? ""))}
                  </Badge>
                </div>
              ))
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/training/institutional-life-support">
                Open ILS operations <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
      <CheckCircle2 className="h-3.5 w-3.5" />
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "amber";
}) {
  return (
    <Card
      className={
        tone === "amber"
          ? "border-amber-300 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20"
          : ""
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function LaneButton({
  title,
  detail,
  onClick,
}: {
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-auto justify-start p-4 text-left"
      onClick={onClick}
    >
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          {detail}
        </span>
      </span>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0" />
    </Button>
  );
}

export default InstitutionAdministrationOverview;
