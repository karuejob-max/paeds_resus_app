import { useEffect, useMemo, useState } from "react";
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
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { IersActivationPanel } from "@/components/IersActivationPanel";
import { IersDrillPanel } from "@/components/IersDrillPanel";
import { IersEvidencePanel } from "@/components/IersEvidencePanel";
import { IersExecutiveReportPanel } from "@/components/IersExecutiveReportPanel";
import { IersImplementationPlanPanel } from "@/components/IersImplementationPlanPanel";
import { ErtRosterPanel } from "@/components/ErtRosterPanel";
import { EquipmentAuditPanel } from "@/components/EquipmentAuditPanel";
import IersReadinessTemplateAdminPanel from "@/components/IersReadinessTemplateAdminPanel";
import IersAdaptiveLearningPanel from "@/components/IersAdaptiveLearningPanel";
import { InstitutionErcoGovernancePanel } from "@/components/InstitutionErcoGovernancePanel";
import { IersDepartmentSetupPanel } from "@/components/IersDepartmentSetupPanel";
import InstitutionAdministrationPanel from "@/components/InstitutionAdministrationPanel";
import InstitutionConnectedServicesPanel from "@/components/InstitutionConnectedServicesPanel";
import InstitutionLearningOperationsPanel from "@/components/InstitutionLearningOperationsPanel";
import InstitutionHomePanel from "@/components/InstitutionHomePanel";
import { InstitutionAccountabilityPanel } from "@/components/InstitutionAccountabilityPanel";
import { IersWorkforceTab, resolveIersTab, workforceAnchor } from "@/lib/institution-readiness-navigation";

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
  ils_program: {
    label: "ILS Program",
    fullName: "Institutional Life Support Training",
    description: "Paeds Resus competency training, practical assessment, certificates, and institution-paid provider cohorts.",
    icon: GraduationCap,
    tone: "border-violet-200 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/20",
  },
} as const;

type ProductKey = keyof typeof PRODUCT_LABELS;
type WorkspaceSection = "overview" | "iers" | "learning" | "accountability" | "administration" | "connected";
type LearningNavigationTab = "overview" | "competency" | "cpd" | "intelligence" | "governance";
type ProductStatus = "trial" | "active" | "grace" | "past_due" | "expired" | "suspended" | "cancelled" | "legacy_unclassified" | "not_subscribed" | "available";

function getInitialWorkspaceState(): { section: WorkspaceSection; iersTab: string; workforceTab: IersWorkforceTab; learningTab: LearningNavigationTab } {
  if (typeof window === "undefined") return { section: "overview", iersTab: "command", workforceTab: "departments", learningTab: "overview" };
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("section");
  const section: WorkspaceSection = requested === "cpd_portal" ? "learning" : requested === "learning" || requested === "iers" || requested === "accountability" || requested === "administration" || requested === "connected" ? requested : "overview";
  const requestedWorkforceTab = params.get("workforceTab");
  const workforceTab: IersWorkforceTab = requestedWorkforceTab === "erco" || requestedWorkforceTab === "roster" || requestedWorkforceTab === "equipment" ? requestedWorkforceTab : "departments";
  const requestedIersTab = params.get("iersTab") || "command";
  const iersTab = resolveIersTab(requestedIersTab, workforceTab);
  const requestedLearningTab = params.get("learningTab");
  const learningTab: LearningNavigationTab = requestedLearningTab === "competency" || requestedLearningTab === "cpd" || requestedLearningTab === "intelligence" || requestedLearningTab === "governance" ? requestedLearningTab : "overview";
  return { section, iersTab, workforceTab, learningTab };
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
    case "available": return "Available";
    default: return "Checking access";
  }
}

function accessBadgeVariant(status: ProductStatus | undefined): "default" | "secondary" | "outline" | "destructive" {
  if (status === "active" || status === "trial" || status === "available") return "default";
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
  const [activeLearningTab, setActiveLearningTab] = useState<LearningNavigationTab>(initialWorkspaceState.learningTab);
  const [expandedPortalSection, setExpandedPortalSection] = useState<WorkspaceSection | null>(initialWorkspaceState.section);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const value = Number(new URLSearchParams(window.location.search).get("institutionId"));
    return Number.isInteger(value) && value > 0 ? value : null;
  });
  const legacyWorkforceTab = initialWorkspaceState.workforceTab;

  const setSection = (section: WorkspaceSection) => {
    setActiveSection(section);
    setExpandedPortalSection(section);
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

  const setLearningTab = (tab: LearningNavigationTab) => {
    setActiveLearningTab(tab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("section", "learning");
      params.set("learningTab", tab);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  const { data: workspacePreview } = trpc.institutionAccountability.getMyWorkspace.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  const availableInstitutions = workspacePreview?.institutions ?? [];
  const resolvedInstitutionId = availableInstitutions.some(item => item.id === selectedInstitutionId)
    ? selectedInstitutionId
    : workspacePreview?.institution?.id ?? availableInstitutions[0]?.id ?? null;
  const { data: myInstitution, isLoading: institutionLoading } = trpc.institutionAccountability.getMyWorkspace.useQuery(
    resolvedInstitutionId ? { institutionId: resolvedInstitutionId } : undefined,
    { enabled: isAuthenticated && resolvedInstitutionId != null, staleTime: 30_000 }
  );
  const institutionId = myInstitution?.institution?.id ?? resolvedInstitutionId;

  useEffect(() => {
    if (!availableInstitutions.length || resolvedInstitutionId == null) return;
    if (selectedInstitutionId === resolvedInstitutionId) return;
    setSelectedInstitutionId(resolvedInstitutionId);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("institutionId", String(resolvedInstitutionId));
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  }, [availableInstitutions, resolvedInstitutionId, selectedInstitutionId]);

  useEffect(() => {
    if (activeIersTab !== "workforce" || legacyWorkforceTab === "departments" || typeof window === "undefined") return;
    window.requestAnimationFrame(() => document.getElementById(workforceAnchor(legacyWorkforceTab))?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [activeIersTab, legacyWorkforceTab]);
  const catalog = (myInstitution?.productAccess ?? []).filter(item => item.institutionId === institutionId);
  const isInstitutionAdmin = myInstitution?.isInstitutionAdmin === true;
  const canViewAccountability = myInstitution?.canViewAccountability === true;
  const visibleSection = (activeSection === "accountability" && !canViewAccountability) || (activeSection === "connected" && !isInstitutionAdmin) ? "overview" : activeSection;
  const { data: adminInstitutionDetails, isLoading: adminDetailsLoading } = trpc.institution.getMyInstitution.useQuery(undefined, {
    enabled: isAuthenticated && isInstitutionAdmin,
  });

  const productStatus = useMemo(() => {
    const getStatus = (key: ProductKey): ProductStatus | undefined => {
      const row = catalog?.find((item) => item.productKey === key);
      return row?.subscriptionStatus as ProductStatus | undefined;
    };
    return { iers: getStatus("iers"), cpd_portal: getStatus("cpd_portal"), ils_program: "available" as ProductStatus };
  }, [catalog]);

  if (institutionLoading || (isInstitutionAdmin && adminDetailsLoading)) {
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
    if (product === "iers") {
      setSection("iers");
      setIersTab("command");
      return;
    }
    if (product === "ils_program") {
      navigate("/training/institutional-life-support");
      return;
    }
    setSection("learning");
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
      <div className="mx-auto min-w-0 max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex min-w-0 flex-col justify-between gap-3 md:mb-6 md:flex-row md:items-start md:gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Institution Workspace
            </div>
            <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{institutionName}</h1>
            {availableInstitutions.length > 1 ? (
              <label className="mt-3 flex max-w-md items-center gap-2 text-sm text-muted-foreground">
                <span className="shrink-0">Switch institution</span>
                <select
                  className="min-w-0 rounded-md border bg-background px-3 py-2 text-foreground"
                  value={institutionId ?? ""}
                  onChange={event => {
                    const nextId = Number(event.target.value);
                    setSelectedInstitutionId(nextId);
                    const params = new URLSearchParams(window.location.search);
                    params.set("institutionId", String(nextId));
                    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
                  }}
                >
                  {availableInstitutions.map(item => <option key={item.id} value={item.id}>{item.companyName}</option>)}
                </select>
              </label>
            ) : null}
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 md:w-auto md:flex-row">
            <Button className="w-full md:w-auto" variant="outline" onClick={() => navigate("/iers/orientation")}>
              <BookOpen className="mr-2 h-4 w-4" /> IERS guide
            </Button>
            <Button className="w-full md:w-auto" variant="outline" onClick={() => navigate("/learning/guide")}>
              <BookOpen className="mr-2 h-4 w-4" /> Learning guide
            </Button>
            <Button className="w-full md:w-auto" variant="outline" onClick={() => goToProduct("ils_program")}>
              <GraduationCap className="mr-2 h-4 w-4" /> ILS Program
            </Button>
            {isInstitutionAdmin ? <Button className="w-full md:w-auto" variant="outline" onClick={() => setSection("administration")}>
              <Settings2 className="mr-2 h-4 w-4" /> Administration
            </Button> : null}
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          {(Object.keys(PRODUCT_LABELS) as ProductKey[]).map((product) => {
            const details = PRODUCT_LABELS[product];
            const Icon = details.icon;
            const enabled = product === "iers" ? iersEnabled : product === "cpd_portal" ? cpdEnabled : true;
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
                    {product === "ils_program" ? "Open offering" : enabled ? "Open product" : "View access status"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={visibleSection} onValueChange={(value) => setSection(value as WorkspaceSection)} className="min-w-0">
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start">
            <InstitutionPortalNavigation
              activeSection={visibleSection}
              expandedSection={expandedPortalSection}
              activeIersTab={activeIersTab}
              activeLearningTab={activeLearningTab}
              iersEnabled={iersEnabled}
              cpdEnabled={cpdEnabled}
              canViewAccountability={canViewAccountability}
              isInstitutionAdmin={isInstitutionAdmin}
              onToggleSection={section => setExpandedPortalSection(current => current === section ? null : section)}
              onSelectSection={setSection}
              onSelectIersTab={setIersTab}
              onSelectLearningTab={setLearningTab}
              onOpenExternal={href => navigate(href)}
            />
            <div className="min-w-0">
              <TabsList className="sr-only">
                <TabsTrigger value="overview">Home</TabsTrigger>
                <TabsTrigger value="iers">Readiness</TabsTrigger>
                <TabsTrigger value="learning">Learning</TabsTrigger>
                <TabsTrigger value="accountability">Accountability</TabsTrigger>
                <TabsTrigger value="administration">Administration</TabsTrigger>
                <TabsTrigger value="connected">Connected</TabsTrigger>
              </TabsList>

          <TabsContent value="overview" className="space-y-6">
              <InstitutionHomePanel
              institutionId={institutionId}
              iersEnabled={iersEnabled}
              onOpenLearning={() => setSection("learning")}
              onOpenReadiness={() => goToProduct("iers")}
              onOpenIls={() => goToProduct("ils_program")}
              onOpenAdministration={() => setSection("administration")}
            />
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
                  <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-left text-xs leading-tight sm:text-sm" value="workforce">Team & shift setup</TabsTrigger>
                  <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-left text-xs leading-tight sm:text-sm" value="equipment">Equipment</TabsTrigger>
                  <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-left text-xs leading-tight sm:text-sm" value="plan">Implementation plan</TabsTrigger>
                  <TabsTrigger className="min-h-10 flex-none shrink-0 whitespace-nowrap px-3 py-2 text-left text-xs leading-tight sm:text-sm" value="report">Executive snapshot</TabsTrigger>
                </TabsList>
                <TabsContent value="command"><IersActivationPanel institutionId={institutionId} /></TabsContent>
                <TabsContent value="evidence"><IersEvidencePanel institutionId={institutionId} /></TabsContent>
                <TabsContent value="drills"><IersDrillPanel institutionId={institutionId} /></TabsContent>
                <TabsContent value="workforce" className="mt-4 min-w-0 space-y-10">
                  <nav aria-label="Team and shift setup steps" className="sticky top-2 z-10 flex min-w-0 flex-wrap gap-2 rounded-lg border bg-background/95 p-2 text-xs shadow-sm backdrop-blur sm:text-sm">
                    <a href="#team-setup-departments" className="rounded-md px-2 py-1.5 font-medium text-primary hover:bg-muted">Step 1: Departments & poles</a>
                    <a href="#team-setup-erco" className="rounded-md px-2 py-1.5 font-medium text-primary hover:bg-muted">Step 2: ERCo governance</a>
                    <a href="#team-setup-roster" className="rounded-md px-2 py-1.5 font-medium text-primary hover:bg-muted">Step 3: Shift roster</a>
                  </nav>
                  <section id="team-setup-departments" className="scroll-mt-24 space-y-3"><h2 className="text-base font-semibold sm:text-lg">Step 1 — Departments & poles</h2><IersDepartmentSetupPanel institutionId={institutionId} /></section>
                  <section id="team-setup-erco" className="scroll-mt-24 space-y-3"><h2 className="text-base font-semibold sm:text-lg">Step 2 — ERCo governance</h2><InstitutionErcoGovernancePanel institutionId={institutionId} /></section>
                  <section id="team-setup-roster" className="scroll-mt-24 space-y-3"><h2 className="text-base font-semibold sm:text-lg">Step 3 — Shift roster</h2><ErtRosterPanel institutionId={institutionId} /></section>
                </TabsContent>
                <TabsContent value="equipment" className="mt-4 min-w-0 space-y-8">
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Crash-cart audit — all staff, regular</h3>
                    <EquipmentAuditPanel institutionId={institutionId} />
                  </section>
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Checklist governance — admin, occasional</h3>
                    <IersReadinessTemplateAdminPanel institutionId={institutionId} />
                  </section>
                </TabsContent>
                <TabsContent value="plan"><IersImplementationPlanPanel institutionId={institutionId} /></TabsContent>
                <TabsContent value="report" className="space-y-6"><IersAdaptiveLearningPanel institutionId={institutionId} /><IersExecutiveReportPanel institutionId={institutionId} onOpenEvidence={() => setIersTab("evidence")} /></TabsContent>
              </Tabs>
            ) : (
              <ProductLockedState product="IERS" status={productStatus.iers} onAdministration={() => setActiveSection("administration")} />
            )}
          </TabsContent>

          <TabsContent value="learning">
            {iersEnabled || cpdEnabled ?             <InstitutionLearningOperationsPanel institutionId={institutionId} iersEnabled={iersEnabled} cpdEnabled={cpdEnabled} isInstitutionAdmin={isInstitutionAdmin} controlledActiveTab={activeLearningTab} onLearningTabChange={setLearningTab} onOpenReadiness={() => { setSection("iers"); setIersTab("report"); }} /> : <ProductLockedState product="Learning" status={productStatus.cpd_portal} onAdministration={() => setSection("administration")} />}
          </TabsContent>

          {canViewAccountability ? <TabsContent value="accountability" className="space-y-6">
            <InstitutionAccountabilityPanel institutionId={institutionId} isInstitutionAdmin={isInstitutionAdmin} />
          </TabsContent> : null}

          {isInstitutionAdmin ? <TabsContent value="administration" className="space-y-6">
            <AdministrationSummary institutionId={institutionId} catalog={catalog ?? []} />
            <InstitutionAdministrationPanel institutionId={institutionId} institution={adminInstitutionDetails?.institution ?? { id: institutionId ?? 0, companyName: institutionName, contactPhone: null, contactEmail: "", staffCount: null }} />
          </TabsContent> : null}

              <TabsContent value="connected" className="space-y-6">
                <InstitutionConnectedServicesPanel institutionId={institutionId} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

type PortalNavChild =
  | { label: string; value: string; kind: "iers" | "learning" }
  | { label: string; href: string; kind: "external" };

type PortalNavSection = {
  value: WorkspaceSection;
  label: string;
  description: string;
  icon: LucideIcon;
  children?: PortalNavChild[];
};

function InstitutionPortalNavigation({
  activeSection,
  expandedSection,
  activeIersTab,
  activeLearningTab,
  iersEnabled,
  cpdEnabled,
  canViewAccountability,
  isInstitutionAdmin,
  onToggleSection,
  onSelectSection,
  onSelectIersTab,
  onSelectLearningTab,
  onOpenExternal,
}: {
  activeSection: WorkspaceSection;
  expandedSection: WorkspaceSection | null;
  activeIersTab: string;
  activeLearningTab: LearningNavigationTab;
  iersEnabled: boolean;
  cpdEnabled: boolean;
  canViewAccountability: boolean;
  isInstitutionAdmin: boolean;
  onToggleSection: (section: WorkspaceSection) => void;
  onSelectSection: (section: WorkspaceSection) => void;
  onSelectIersTab: (tab: string) => void;
  onSelectLearningTab: (tab: LearningNavigationTab) => void;
  onOpenExternal: (href: string) => void;
}) {
  const sections: PortalNavSection[] = [
    {
      value: "overview",
      label: "Home",
      description: "Workspace overview and product status",
      icon: LayoutDashboard,
      children: [
        { label: "IERS guide", href: "/iers/orientation", kind: "external" },
        { label: "Learning guide", href: "/learning/guide", kind: "external" },
      ],
    },
    {
      value: "iers",
      label: "Readiness",
      description: "Institutional emergency readiness operations",
      icon: HeartPulse,
      children: iersEnabled
        ? [
            { label: "Command centre", value: "command", kind: "iers" },
            { label: "Evidence & actions", value: "evidence", kind: "iers" },
            { label: "Drills & debriefs", value: "drills", kind: "iers" },
            { label: "Team & shift setup", value: "workforce", kind: "iers" },
            { label: "Equipment", value: "equipment", kind: "iers" },
            { label: "Implementation plan", value: "plan", kind: "iers" },
            { label: "Executive snapshot", value: "report", kind: "iers" },
          ]
        : undefined,
    },
    {
      value: "learning",
      label: "Learning",
      description: "Cohorts, CPD, competency, and workforce insight",
      icon: ClipboardCheck,
      children: [
        { label: "Learning overview", value: "overview", kind: "learning" },
        ...(iersEnabled
          ? [{ label: "Cohorts & competency", value: "competency", kind: "learning" as const }]
          : []),
        ...(cpdEnabled
          ? [
              { label: "CPD sessions", value: "cpd", kind: "learning" as const },
              { label: "Reports & insights", value: "intelligence", kind: "learning" as const },
              { label: "People & targets", value: "governance", kind: "learning" as const },
            ]
          : []),
        { label: "Institutional Life Support", href: "/training/institutional-life-support", kind: "external" },
      ],
    },
    ...(canViewAccountability
      ? [{ value: "accountability" as const, label: "Accountability", description: "Shared responsibility and evidence", icon: ShieldCheck }]
      : []),
    ...(isInstitutionAdmin
      ? [
          { value: "administration" as const, label: "Administration", description: "People, roles, products, and recovery", icon: Settings2 },
          { value: "connected" as const, label: "Connected services", description: "Integrations and connected systems", icon: Wrench },
        ]
      : []),
  ];

  return (
    <aside
      aria-label="Institution workspace navigation"
      className="min-w-0 rounded-xl border bg-background/95 p-2 shadow-sm lg:sticky lg:top-4"
    >
      <div className="px-3 pb-2 pt-1">
        <p className="text-sm font-semibold">Workspace navigation</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Open any institutional page from one place.</p>
      </div>
      <div className="max-h-[55vh] space-y-1 overflow-y-auto overscroll-contain pr-1 lg:max-h-[calc(100vh-14rem)]">
        {sections.map(section => {
          const SectionIcon = section.icon;
          const isExpanded = expandedSection === section.value;
          const isActive = activeSection === section.value;
          const sectionId = `institution-portal-section-${section.value}`;
          return (
            <div key={section.value}>
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={sectionId}
                onClick={() => {
                  if (activeSection !== section.value) onSelectSection(section.value);
                  onToggleSection(section.value);
                }}
                className={`flex min-h-12 w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"}`}
              >
                <SectionIcon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{section.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{section.description}</span>
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
              </button>
              {isExpanded && section.children?.length ? (
                <div id={sectionId} className="ml-3 mt-1 max-h-[40vh] overflow-y-auto overscroll-contain border-l pl-2">
                  <div className="space-y-1">
                    {section.children.map(child => {
                      const isChildActive = child.kind === "iers"
                        ? activeSection === "iers" && activeIersTab === child.value
                        : child.kind === "learning"
                          ? activeSection === "learning" && activeLearningTab === child.value
                          : false;
                      return (
                        <button
                          key={child.kind === "external" ? child.href : `${child.kind}-${child.value}`}
                          type="button"
                          onClick={() => {
                            onSelectSection(section.value);
                            if (child.kind === "iers") onSelectIersTab(child.value);
                            else if (child.kind === "learning") onSelectLearningTab(child.value as LearningNavigationTab);
                            else if (child.kind === "external") onOpenExternal(child.href);
                          }}
                          className={`flex min-h-10 w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isChildActive ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                        >
                          <span className="min-w-0 truncate">{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
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
