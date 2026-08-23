import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { IersActivationPanel } from "@/components/IersActivationPanel";
import { IersDrillPanel } from "@/components/IersDrillPanel";
import { IersEvidencePanel } from "@/components/IersEvidencePanel";
import { IersExecutiveReportPanel } from "@/components/IersExecutiveReportPanel";
import { IersImplementationPlanPanel } from "@/components/IersImplementationPlanPanel";
import { CohortProgressWidget } from "@/components/CohortProgressWidget";
import { Phase1ProofReviewWidget } from "@/components/Phase1ProofReviewWidget";
import { ErtRosterPanel } from "@/components/ErtRosterPanel";
import { EquipmentAuditPanel } from "@/components/EquipmentAuditPanel";
import { InstitutionErcoGovernancePanel } from "@/components/InstitutionErcoGovernancePanel";
import { IersDepartmentSetupPanel } from "@/components/IersDepartmentSetupPanel";
import { InstitutionIersCompetencyPanel } from "@/components/InstitutionIersCompetencyPanel";
import CpdPanel from "@/components/CpdPanel";
import InstitutionAdministrationPanel from "@/components/InstitutionAdministrationPanel";
import InstitutionConnectedServicesPanel from "@/components/InstitutionConnectedServicesPanel";

const PRODUCT_LABELS = {
  iers: {
    label: "IERS",
    fullName: "Institutional Emergency Readiness System",
    description: "Practical competency, team response, evidence, drills, and institutional learning.",
    icon: HeartPulse,
    tone: "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20",
  },
  cpd_portal: {
    label: "CPD Portal",
    fullName: "Professional Development Intelligence",
    description: "Staff professional development, CPD sessions, certificates, and workforce insight.",
    icon: ClipboardCheck,
    tone: "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20",
  },
} as const;

type ProductKey = keyof typeof PRODUCT_LABELS;
type WorkspaceSection = "overview" | ProductKey | "administration" | "connected";
type IersWorkforceTab = "departments" | "erco" | "roster" | "equipment";

type ProductStatus = "trial" | "active" | "grace" | "past_due" | "expired" | "suspended" | "cancelled" | "legacy_unclassified" | "not_subscribed";

function getInitialWorkspaceState(): { section: WorkspaceSection; iersTab: string; workforceTab: IersWorkforceTab } {
  if (typeof window === "undefined") return { section: "overview", iersTab: "command", workforceTab: "departments" };
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("section");
  const section: WorkspaceSection = requested === "iers" || requested === "cpd_portal" || requested === "administration" || requested === "connected" ? requested : "overview";
  const requestedWorkforceTab = params.get("workforceTab");
  const workforceTab: IersWorkforceTab = requestedWorkforceTab === "erco" || requestedWorkforceTab === "roster" || requestedWorkforceTab === "equipment" ? requestedWorkforceTab : "departments";
  return { section, iersTab: params.get("iersTab") || "command", workforceTab };
}

function canUseProduct(status: ProductStatus | undefined): boolean {
  return status === "trial" || status === "active" || status === "grace" || status === "past_due" || status === "legacy_unclassified";
}

function statusLabel(status: ProductStatus | undefined): string {
  switch (status) {
    case "active": return "Active";
    case "trial": return "Trial";
    case "grace": return "Grace period";
    case "past_due": return "Payment past due";
    case "expired": return "Expired — history preserved";
    case "suspended": return "Suspended";
    case "cancelled": return "Cancelled";
    case "legacy_unclassified": return "Legacy access — review pending";
    case "not_subscribed": return "Not subscribed";
    default: return "Checking access";
  }
}

function accessBadgeVariant(status: ProductStatus | undefined): "default" | "secondary" | "outline" | "destructive" {
  if (status === "active" || status === "trial") return "default";
  if (status === "grace" || status === "past_due" || status === "legacy_unclassified") return "secondary";
  if (status === "expired" || status === "suspended" || status === "cancelled") return "destructive";
  return "outline";
}

export default function InstitutionWorkspace() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const initialWorkspaceState = getInitialWorkspaceState();
  const [activeSection, setActiveSection] = useState<WorkspaceSection>(initialWorkspaceState.section);
  const [activeIersTab, setActiveIersTab] = useState(initialWorkspaceState.iersTab);
  const [activeWorkforceTab, setActiveWorkforceTab] = useState<IersWorkforceTab>(initialWorkspaceState.workforceTab);

  const setSection = (section: WorkspaceSection) => {
    setActiveSection(section);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("section", section);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  const setIersTab = (tab: string) => {
    setActiveIersTab(tab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("iersTab", tab);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  const setWorkforceTab = (tab: IersWorkforceTab) => {
    setActiveWorkforceTab(tab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("iersTab", "workforce");
      params.set("workforceTab", tab);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  const { data: myInstitution, isLoading: institutionLoading } = trpc.institution.getMyInstitution.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const institutionId = myInstitution?.institution?.id ?? null;
  const { data: catalog, isLoading: catalogLoading } = trpc.institutionProducts.getCatalog.useQuery(
    { institutionId: institutionId! },
    { enabled: !!institutionId },
  );

  const productStatus = useMemo(() => {
    const getStatus = (key: ProductKey): ProductStatus | undefined => {
      const row = catalog?.find((item) => item.productKey === key);
      return row?.subscriptionStatus as ProductStatus | undefined;
    };
    return { iers: getStatus("iers"), cpd_portal: getStatus("cpd_portal") };
  }, [catalog]);

  if (institutionLoading || catalogLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Card>
          <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
            <Activity className="h-5 w-5 animate-pulse" />
            Loading the institution workspace…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!institutionId || !myInstitution?.institution) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Finish institution setup</CardTitle>
            <CardDescription>Your account is not linked to an institutional workspace yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/institutional-onboarding")}>Open institution setup <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const institutionName = myInstitution.institution.companyName || "Your institution";
  const iersEnabled = canUseProduct(productStatus.iers);
  const cpdEnabled = canUseProduct(productStatus.cpd_portal);

  const goToProduct = (product: ProductKey) => {
    setSection(product);
    if (product === "iers") setIersTab("command");
  };

  const renderProductStatus = (product: ProductKey) => {
    const status = productStatus[product];
    return (
      <Badge variant={accessBadgeVariant(status)} className="whitespace-nowrap">
        {statusLabel(status)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950/30">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex min-w-0 flex-col justify-between gap-3 md:mb-6 md:flex-row md:items-start md:gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Institution Workspace
            </div>
            <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{institutionName}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-5 text-muted-foreground sm:text-base">
              One institution account, two products, and one shared administration layer. Providers and institutional leaders work from the same readiness record.
            </p>
          </div>
          <Button className="w-full shrink-0 md:w-auto" variant="outline" onClick={() => setSection("administration")}>
            <Settings2 className="mr-2 h-4 w-4" /> Administration
          </Button>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          {(Object.keys(PRODUCT_LABELS) as ProductKey[]).map((product) => {
            const details = PRODUCT_LABELS[product];
            const Icon = details.icon;
            const enabled = product === "iers" ? iersEnabled : cpdEnabled;
            return (
              <Card key={product} className={`border ${details.tone}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-slate-900"><Icon className="h-5 w-5" /></div>
                      <div>
                        <CardTitle className="text-lg">{details.label}</CardTitle>
                        <CardDescription>{details.fullName}</CardDescription>
                      </div>
                    </div>
                    {renderProductStatus(product)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="min-h-12 text-sm text-muted-foreground">{details.description}</p>
                  <Button className="mt-4 w-full" variant={enabled ? "default" : "outline"} onClick={() => goToProduct(product)}>
                    {enabled ? "Open product" : "View access status"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={activeSection} onValueChange={(value) => setSection(value as WorkspaceSection)}>
          <TabsList className="mb-6 grid h-auto w-full grid-cols-1 gap-1 p-1 min-[380px]:grid-cols-2 sm:grid-cols-5">
            <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-xs leading-tight sm:text-sm" value="overview"><LayoutDashboard className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" /><span>Overview</span></TabsTrigger>
            <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-xs leading-tight sm:text-sm" value="iers"><HeartPulse className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" /><span>IERS</span></TabsTrigger>
            <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-xs leading-tight sm:text-sm" value="cpd_portal"><ClipboardCheck className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" /><span>CPD Portal</span></TabsTrigger>
            <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-xs leading-tight sm:text-sm" value="administration"><Settings2 className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" /><span>Administration</span></TabsTrigger>
            <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-xs leading-tight sm:text-sm" value="connected"><Wrench className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" /><span>Connected Services</span></TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose the operating lane</CardTitle>
                <CardDescription>IERS handles emergency readiness. CPD Portal handles professional development. Administration controls the institution.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-auto justify-start p-4 text-left" onClick={() => goToProduct("iers")}>
                  <div><div className="font-semibold">Run emergency readiness</div><div className="mt-1 text-xs text-muted-foreground">Activation, ERT, equipment, drills, evidence, QI.</div></div><ArrowRight className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="outline" className="h-auto justify-start p-4 text-left" onClick={() => goToProduct("cpd_portal")}>
                  <div><div className="font-semibold">Manage professional development</div><div className="mt-1 text-xs text-muted-foreground">CPD events, attendance, certificates, and workforce insight.</div></div><ArrowRight className="ml-auto h-4 w-4" />
                </Button>
                <Button variant="outline" className="h-auto justify-start p-4 text-left" onClick={() => setSection("administration")}>
                  <div><div className="font-semibold">Manage the account</div><div className="mt-1 text-xs text-muted-foreground">People, roles, contracts, billing, and renewal.</div></div><ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            {(!iersEnabled || !cpdEnabled) && (
              <Alert>
                <LockKeyhole className="h-4 w-4" />
                <AlertDescription>
                  A product without an active subscription remains visible with its history preserved, but new operations are blocked until the subscription is restored. Active IERS events, response timelines, debriefs, and evidence exports must remain available during renewal resolution.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="iers">
            {iersEnabled ? (
              <Tabs value={activeIersTab} onValueChange={setIersTab}>
                <TabsList className="sticky top-2 z-20 mb-6 flex h-auto w-full max-w-full min-w-0 justify-start gap-1 overflow-x-auto overscroll-x-contain bg-background/95 p-1 shadow-sm backdrop-blur sm:flex-wrap sm:overflow-visible sm:p-0 sm:shadow-none">
                  <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-left text-xs leading-tight sm:text-sm" value="command">Command centre</TabsTrigger>
                  <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-left text-xs leading-tight sm:text-sm" value="evidence">Evidence & actions</TabsTrigger>
                  <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-left text-xs leading-tight sm:text-sm" value="drills">Drills & debriefs</TabsTrigger>
                  <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-left text-xs leading-tight sm:text-sm" value="competency">Competency & training</TabsTrigger>
                  <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-left text-xs leading-tight sm:text-sm" value="workforce">ERT & equipment</TabsTrigger>
                  <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-left text-xs leading-tight sm:text-sm" value="plan">Implementation plan</TabsTrigger>
                  <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-left text-xs leading-tight sm:text-sm" value="report">Executive snapshot</TabsTrigger>
                </TabsList>
                <TabsContent value="command"><IersActivationPanel institutionId={institutionId} /></TabsContent>
                <TabsContent value="evidence"><IersEvidencePanel institutionId={institutionId} /></TabsContent>
                <TabsContent value="drills"><IersDrillPanel institutionId={institutionId} /></TabsContent>
                <TabsContent value="competency" className="space-y-6">
                  <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
                    <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-amber-700" />Competency & training</CardTitle><CardDescription>Schedule and document emergency-readiness competency, review cohort progress, and review phase-one proof. Training completion is not the same as IERS operational readiness; both must be evidenced.</CardDescription></CardHeader>
                  </Card>
                  <InstitutionIersCompetencyPanel institutionId={institutionId} />
                  <CohortProgressWidget institutionId={institutionId} />
                  <Phase1ProofReviewWidget institutionId={institutionId} />
                </TabsContent>
                <TabsContent value="workforce" className="space-y-6">
                  <Tabs value={activeWorkforceTab} onValueChange={(value) => setWorkforceTab(value as IersWorkforceTab)}>
                    <TabsList className="sticky top-16 z-10 flex h-auto w-full max-w-full min-w-0 justify-start gap-1 overflow-x-auto overscroll-x-contain bg-background/95 p-1 shadow-sm backdrop-blur sm:flex-wrap sm:overflow-visible sm:shadow-none">
                      <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-xs sm:text-sm" value="departments">Departments & poles</TabsTrigger>
                      <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-xs sm:text-sm" value="erco">ERCo governance</TabsTrigger>
                      <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-xs sm:text-sm" value="roster">Shift staffing</TabsTrigger>
                      <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-xs sm:text-sm" value="equipment">Equipment</TabsTrigger>
                    </TabsList>
                    <TabsContent value="departments" className="mt-4"><IersDepartmentSetupPanel institutionId={institutionId} /></TabsContent>
                    <TabsContent value="erco" className="mt-4"><InstitutionErcoGovernancePanel institutionId={institutionId} /></TabsContent>
                    <TabsContent value="roster" className="mt-4"><ErtRosterPanel institutionId={institutionId} /></TabsContent>
                    <TabsContent value="equipment" className="mt-4"><EquipmentAuditPanel institutionId={institutionId} /></TabsContent>
                  </Tabs>
                </TabsContent>
                <TabsContent value="plan"><IersImplementationPlanPanel institutionId={institutionId} /></TabsContent>
                <TabsContent value="report"><IersExecutiveReportPanel institutionId={institutionId} /></TabsContent>
              </Tabs>
            ) : (
              <ProductLockedState product="IERS" status={productStatus.iers} onAdministration={() => setActiveSection("administration")} />
            )}
          </TabsContent>

          <TabsContent value="cpd_portal">
            {cpdEnabled ? <CpdPanel institutionId={institutionId} /> : <ProductLockedState product="CPD Portal" status={productStatus.cpd_portal} onAdministration={() => setActiveSection("administration")} />}
          </TabsContent>

          <TabsContent value="administration" className="space-y-6">
            <AdministrationSummary institutionId={institutionId} catalog={catalog ?? []} />
            <InstitutionAdministrationPanel institutionId={institutionId} institution={myInstitution.institution} />
          </TabsContent>

          <TabsContent value="connected" className="space-y-6">
            <InstitutionConnectedServicesPanel institutionId={institutionId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProductLockedState({ product, status, onAdministration }: { product: string; status: ProductStatus | undefined; onAdministration: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5" />{product} access is not active</CardTitle>
        <CardDescription>{statusLabel(status)}. Existing history remains preserved.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">Contact an institution administrator to review the plan, renewal, or product access. Emergency continuity and historical exports should remain available while access is resolved.</p>
        <Button variant="outline" onClick={onAdministration}><CreditCard className="mr-2 h-4 w-4" />Review administration</Button>
      </CardContent>
    </Card>
  );
}

function AdministrationSummary({ institutionId, catalog }: { institutionId: number; catalog: Array<{ productKey?: string; displayName?: string; subscriptionStatus?: string; renewsAt?: Date | string | null; expiresAt?: Date | string | null }> }) {
  return (
    <Card>
      <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Shared Administration</CardTitle>
            <CardDescription>People, roles, contracts, product access, billing, renewals, and recovery belong here—not inside IERS or CPD Portal.</CardDescription>
            <p className="mt-1 text-xs text-muted-foreground">Institution ID: {institutionId}</p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <AdminControl title="People & roles" detail="Invite admins, link providers, and maintain responsibility assignments." icon={Users} />
        <AdminControl title="Products & renewal" detail="IERS and CPD Portal subscriptions are independent and auditable." icon={CreditCard} />
        <AdminControl title="Exports & recovery" detail="Preserve historical evidence, certificates, and account records during expiry." icon={FileText} />
      </CardContent>
      <CardContent className="border-t pt-4">
        <div className="space-y-2 text-sm font-medium">Product access summary</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {catalog.filter((item) => item.productKey === "iers" || item.productKey === "cpd_portal").map((item) => (
            <div key={item.productKey} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span>{item.displayName ?? item.productKey}</span>
              <Badge variant={item.subscriptionStatus === "active" ? "default" : "secondary"}>{statusLabel(item.subscriptionStatus as ProductStatus)}</Badge>
            </div>
          ))}
          {catalog.length === 0 && <span className="text-sm text-muted-foreground">Product ledger is not yet available; legacy continuity rules apply.</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function AdminControl({ title, detail, icon: Icon }: { title: string; detail: string; icon: typeof Users }) {
  return <div className="rounded-lg border bg-background p-4"><Icon className="mb-3 h-5 w-5 text-muted-foreground" /><div className="font-semibold">{title}</div><div className="mt-1 text-sm text-muted-foreground">{detail}</div></div>;
}
