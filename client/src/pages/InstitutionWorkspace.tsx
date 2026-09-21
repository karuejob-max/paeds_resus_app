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
  CreditCard,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  PanelLeftClose,
  PanelLeftOpen,
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
import { InstitutionalQualityBillingPanel } from "@/components/InstitutionalQualityBillingPanel";
import { IersWorkforceTab, resolveIersTab, workforceAnchor } from "@/lib/institution-readiness-navigation";

type ProductKey = "iers" | "cpd_portal" | "ils_program";
type WorkspaceSection = "overview" | "iers" | "learning" | "accountability" | "administration" | "connected";
type LearningNavigationTab = "overview" | "competency" | "cpd" | "intelligence" | "governance";
type AdministrationNavigationTab = "overview" | "institution" | "billing" | "program_operations" | "data_support";
type ProductStatus = "trial" | "active" | "grace" | "past_due" | "expired" | "suspended" | "cancelled" | "legacy_unclassified" | "not_subscribed" | "available";

function getInitialWorkspaceState(): { section: WorkspaceSection; iersTab: string; workforceTab: IersWorkforceTab; learningTab: LearningNavigationTab; adminTab: AdministrationNavigationTab } {
  if (typeof window === "undefined") return { section: "overview", iersTab: "command", workforceTab: "departments", learningTab: "overview", adminTab: "overview" };
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("section");
  const section: WorkspaceSection = requested === "cpd_portal" ? "learning" : requested === "learning" || requested === "iers" || requested === "accountability" || requested === "administration" || requested === "connected" ? requested : "overview";
  const requestedWorkforceTab = params.get("workforceTab");
  const workforceTab: IersWorkforceTab = requestedWorkforceTab === "erco" || requestedWorkforceTab === "roster" || requestedWorkforceTab === "equipment" ? requestedWorkforceTab : "departments";
  const requestedIersTab = params.get("iersTab") || "command";
  const iersTab = resolveIersTab(requestedIersTab, workforceTab);
  const requestedLearningTab = params.get("learningTab");
  const learningTab: LearningNavigationTab = requestedLearningTab === "competency" || requestedLearningTab === "cpd" || requestedLearningTab === "intelligence" || requestedLearningTab === "governance" ? requestedLearningTab : "overview";
  const requestedAdminTab = params.get("adminTab");
  const adminTab: AdministrationNavigationTab = requestedAdminTab === "institution" || requestedAdminTab === "billing" || requestedAdminTab === "program_operations" || requestedAdminTab === "data_support" ? requestedAdminTab : "overview";
  return { section, iersTab, workforceTab, learningTab, adminTab };
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

export default function InstitutionWorkspace() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const initialWorkspaceState = getInitialWorkspaceState();
  const [activeSection, setActiveSection] = useState<WorkspaceSection>(initialWorkspaceState.section);
  const [activeIersTab, setActiveIersTab] = useState(initialWorkspaceState.iersTab);
  const [activeLearningTab, setActiveLearningTab] = useState<LearningNavigationTab>(initialWorkspaceState.learningTab);
  const [activeAdminTab, setActiveAdminTab] = useState<AdministrationNavigationTab>(initialWorkspaceState.adminTab);
  const [expandedPortalSection, setExpandedPortalSection] = useState<WorkspaceSection | null>(initialWorkspaceState.section);
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const value = Number(new URLSearchParams(window.location.search).get("institutionId"));
    return Number.isInteger(value) && value > 0 ? value : null;
  });
  const legacyWorkforceTab = initialWorkspaceState.workforceTab;

  const setSection = (section: WorkspaceSection) => {
    setActiveSection(section);
    setExpandedPortalSection(section);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
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

  const setAdminTab = (tab: AdministrationNavigationTab) => {
    setActiveAdminTab(tab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("section", "administration");
      params.set("adminTab", tab);
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={navigationOpen}
            aria-controls="institution-workspace-navigation"
            onClick={() => setNavigationOpen(current => !current)}
            className="shrink-0 self-start"
          >
            {navigationOpen ? <PanelLeftClose className="mr-2 h-4 w-4" /> : <PanelLeftOpen className="mr-2 h-4 w-4" />}
            {navigationOpen ? "Hide navigation" : "Open navigation"}
          </Button>
        </div>

        <Tabs value={visibleSection} onValueChange={(value) => setSection(value as WorkspaceSection)} className="min-w-0">
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start">
            {navigationOpen ? <InstitutionPortalNavigation
              activeSection={visibleSection}
              expandedSection={expandedPortalSection}
              activeIersTab={activeIersTab}
              activeLearningTab={activeLearningTab}
              activeAdminTab={activeAdminTab}
              iersEnabled={iersEnabled}
              cpdEnabled={cpdEnabled}
              canViewAccountability={canViewAccountability}
              isInstitutionAdmin={isInstitutionAdmin}
              onToggleSection={section => setExpandedPortalSection(current => current === section ? null : section)}
              onSelectSection={setSection}
              onSelectIersTab={setIersTab}
              onSelectLearningTab={setLearningTab}
              onSelectAdminTab={setAdminTab}
              onOpenExternal={href => navigate(href)}
            /> : null}
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
                <TabsContent value="report" className="space-y-6"><InstitutionalQualityBillingPanel institutionId={institutionId} canManageBilling={isInstitutionAdmin} /><IersAdaptiveLearningPanel institutionId={institutionId} /><IersExecutiveReportPanel institutionId={institutionId} onOpenEvidence={() => setIersTab("evidence")} /></TabsContent>
              </Tabs>
            ) : (
              <ProductLockedState product="IERS" status={productStatus.iers} onAdministration={() => setActiveSection("administration")} />
            )}
          </TabsContent>

          <TabsContent value="learning">
            {iersEnabled || cpdEnabled ?                           <InstitutionLearningOperationsPanel institutionId={institutionId} iersEnabled={iersEnabled} cpdEnabled={cpdEnabled} isInstitutionAdmin={isInstitutionAdmin} controlledActiveTab={activeLearningTab} onLearningTabChange={setLearningTab} hideNavigation onOpenReadiness={() => { setSection("iers"); setIersTab("report"); }} /> : <ProductLockedState product="Learning" status={productStatus.cpd_portal} onAdministration={() => setSection("administration")} />}
          </TabsContent>

          {canViewAccountability ? <TabsContent value="accountability" className="space-y-6">
            <InstitutionAccountabilityPanel institutionId={institutionId} isInstitutionAdmin={isInstitutionAdmin} />
          </TabsContent> : null}

          {isInstitutionAdmin ?           <TabsContent value="administration" className="space-y-6">
            <InstitutionalQualityBillingPanel institutionId={institutionId} canManageBilling />
            <AdministrationSummary institutionId={institutionId} catalog={catalog ?? []} />

            <InstitutionAdministrationPanel institutionId={institutionId} institution={adminInstitutionDetails?.institution ?? { id: institutionId ?? 0, companyName: institutionName, contactPhone: null, contactEmail: "", staffCount: null }} controlledActiveTab={activeAdminTab} onAdministrationTabChange={setAdminTab} hideNavigation />
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
  | { label: string; value: string; kind: "iers" | "learning" | "admin" }
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
  activeAdminTab,
  iersEnabled,
  cpdEnabled,
  canViewAccountability,
  isInstitutionAdmin,
  onToggleSection,
  onSelectSection,
  onSelectIersTab,
  onSelectLearningTab,
  onSelectAdminTab,
  onOpenExternal,
}: {
  activeSection: WorkspaceSection;
  expandedSection: WorkspaceSection | null;
  activeIersTab: string;
  activeLearningTab: LearningNavigationTab;
  activeAdminTab: AdministrationNavigationTab;
  iersEnabled: boolean;
  cpdEnabled: boolean;
  canViewAccountability: boolean;
  isInstitutionAdmin: boolean;
  onToggleSection: (section: WorkspaceSection) => void;
  onSelectSection: (section: WorkspaceSection) => void;
  onSelectIersTab: (tab: string) => void;
  onSelectLearningTab: (tab: LearningNavigationTab) => void;
  onSelectAdminTab: (tab: AdministrationNavigationTab) => void;
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
          {
            value: "administration" as const,
            label: "Administration",
            description: "People, roles, products, and recovery",
            icon: Settings2,
            children: [
              { label: "Overview", value: "overview", kind: "admin" as const },
              { label: "People & access", value: "institution", kind: "admin" as const },
              { label: "Products & billing", value: "billing", kind: "admin" as const },
              { label: "Programme operations", value: "program_operations", kind: "admin" as const },
              { label: "Data & support", value: "data_support", kind: "admin" as const },
            ],
          },
          { value: "connected" as const, label: "Connected services", description: "Integrations and connected systems", icon: Wrench },
        ]
      : []),
  ];

  return (
    <aside
      id="institution-workspace-navigation"
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
                          : child.kind === "admin"
                            ? activeSection === "administration" && activeAdminTab === child.value
                            : false;
                      return (
                        <button
                          key={child.kind === "external" ? child.href : `${child.kind}-${child.value}`}
                          type="button"
                          onClick={() => {
                            onSelectSection(section.value);
                            if (child.kind === "iers") onSelectIersTab(child.value);
                            else if (child.kind === "learning") onSelectLearningTab(child.value as LearningNavigationTab);
                            else if (child.kind === "admin") onSelectAdminTab(child.value as AdministrationNavigationTab);
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
