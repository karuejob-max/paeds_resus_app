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

type ProductStatus = "trial" | "active" | "grace" | "past_due" | "expired" | "suspended" | "cancelled" | "legacy_unclassified" | "not_subscribed";

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
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("overview");
  const [activeIersTab, setActiveIersTab] = useState("command");

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
    setActiveSection(product);
    if (product === "iers") setActiveIersTab("command");
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
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Institution Workspace
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{institutionName}</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              One institution account, two products, and one shared administration layer. Providers and institutional leaders work from the same readiness record.
            </p>
          </div>
          <Button variant="outline" onClick={() => setActiveSection("administration")}>
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

        <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as WorkspaceSection)}>
          <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-5">
            <TabsTrigger value="overview"><LayoutDashboard className="mr-2 h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="iers"><HeartPulse className="mr-2 h-4 w-4" />IERS</TabsTrigger>
            <TabsTrigger value="cpd_portal"><ClipboardCheck className="mr-2 h-4 w-4" />CPD Portal</TabsTrigger>
            <TabsTrigger value="administration"><Settings2 className="mr-2 h-4 w-4" />Administration</TabsTrigger>
            <TabsTrigger value="connected"><Wrench className="mr-2 h-4 w-4" />Connected Services</TabsTrigger>
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
                <Button variant="outline" className="h-auto justify-start p-4 text-left" onClick={() => setActiveSection("administration")}>
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
              <Tabs value={activeIersTab} onValueChange={setActiveIersTab}>
                <TabsList className="mb-6 flex h-auto flex-wrap gap-1">
                  <TabsTrigger value="command">Command centre</TabsTrigger>
                  <TabsTrigger value="evidence">Evidence & actions</TabsTrigger>
                  <TabsTrigger value="drills">Drills & debriefs</TabsTrigger>
                  <TabsTrigger value="competency">Competency & training</TabsTrigger>
                  <TabsTrigger value="workforce">ERT & equipment</TabsTrigger>
                  <TabsTrigger value="plan">Implementation plan</TabsTrigger>
                  <TabsTrigger value="report">Executive snapshot</TabsTrigger>
                </TabsList>
                <TabsContent value="command"><IersActivationPanel institutionId={institutionId} /></TabsContent>
                <TabsContent value="evidence"><IersEvidencePanel institutionId={institutionId} /></TabsContent>
                <TabsContent value="drills"><IersDrillPanel institutionId={institutionId} /></TabsContent>
                <TabsContent value="competency" className="space-y-6">
                  <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20">
                    <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-amber-700" />Competency & training</CardTitle><CardDescription>Track readiness-linked training progress and review phase-one proof. Training completion is not the same as IERS operational readiness; both must be evidenced.</CardDescription></CardHeader>
                  </Card>
                  <CohortProgressWidget institutionId={institutionId} />
                  <Phase1ProofReviewWidget institutionId={institutionId} />
                </TabsContent>
                <TabsContent value="workforce" className="grid gap-6 xl:grid-cols-2"><ErtRosterPanel institutionId={institutionId} /><EquipmentAuditPanel institutionId={institutionId} /></TabsContent>
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
