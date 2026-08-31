import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Building2, CreditCard, FileText, GraduationCap, HeartPulse, LifeBuoy, ShieldCheck, Users, Wrench } from "lucide-react";
import { InstitutionDetailsCard } from "@/components/InstitutionDetailsCard";
import { InstitutionProductAccessPanel } from "@/components/InstitutionProductAccessPanel";
import { InstitutionPeopleRolesPanel } from "@/components/InstitutionPeopleRolesPanel";
import { AccountAdminsWidget } from "@/components/AccountAdminsWidget";
import { PendingLinkRequestsWidget } from "@/components/PendingLinkRequestsWidget";
import { InstitutionContractsTable } from "@/components/InstitutionContractsTable";
import StaffBulkImport from "@/components/StaffBulkImport";
import { SupportTicketForm } from "@/components/SupportTicketForm";
import { AdminNotificationsDashboard } from "@/components/AdminNotificationsDashboard";
import { InstitutionDataLifecyclePanel } from "@/components/InstitutionDataLifecyclePanel";
import { InstitutionRenewalPanel } from "@/components/InstitutionRenewalPanel";
import { InstitutionDepartmentReconciliationPanel } from "@/components/InstitutionDepartmentReconciliationPanel";
import InstitutionAdministrationOverview from "@/components/InstitutionAdministrationOverview";

type InstitutionRecord = {
  id: number;
  companyName: string;
  contactPhone: string | null;
  contactEmail: string;
  staffCount: number | null;
  organizationCategory?: string | null;
  facilityOwnership?: string | null;
  facilityCareLevel?: string | null;
  facilityLocalLevel?: string | null;
};

type AdministrationTab = "overview" | "institution" | "billing" | "program_operations" | "data_support";
type PeopleTab = "institution" | "people_access" | "departments" | "access_links" | "staff_import";

function getInitialAdministrationTab(): AdministrationTab {
  if (typeof window === "undefined") return "overview";
  const value = new URLSearchParams(window.location.search).get("adminTab");
  return ["institution", "billing", "program_operations", "data_support"].includes(value ?? "") ? value as AdministrationTab : "overview";
}

function getInitialPeopleTab(): PeopleTab {
  if (typeof window === "undefined") return "institution";
  const value = new URLSearchParams(window.location.search).get("peopleTab");
  return ["people_access", "departments", "access_links", "staff_import"].includes(value ?? "") ? value as PeopleTab : "institution";
}

function getInitialBillingTab(): "access" | "renewal" | "contracts" {
  if (typeof window === "undefined") return "access";
  const value = new URLSearchParams(window.location.search).get("billingTab");
  return value === "renewal" || value === "contracts" ? value : "access";
}

function getInitialDataSupportTab(): "data" | "support" | "notifications" {
  if (typeof window === "undefined") return "data";
  const value = new URLSearchParams(window.location.search).get("dataSupportTab");
  return value === "support" || value === "notifications" ? value : "data";
}

export function InstitutionAdministrationPanel({ institutionId, institution }: { institutionId: number; institution: InstitutionRecord }) {
  const [tab, setTab] = useState<AdministrationTab>(getInitialAdministrationTab);
  const [peopleTab, setPeopleTab] = useState<PeopleTab>(getInitialPeopleTab);
  const [billingTab, setBillingTab] = useState<"access" | "renewal" | "contracts">(getInitialBillingTab);
  const [dataSupportTab, setDataSupportTab] = useState<"data" | "support" | "notifications">(getInitialDataSupportTab);

  const setAdministrationTab = (nextTab: AdministrationTab) => {
    setTab(nextTab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("section", "administration");
      params.set("adminTab", nextTab);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  const setPeopleSection = (nextTab: PeopleTab) => {
    setPeopleTab(nextTab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("section", "administration");
      params.set("adminTab", nextTab === "institution" ? "institution" : "people_access");
      params.set("peopleTab", nextTab);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  const setNestedTab = (parameter: "billingTab" | "dataSupportTab", value: string) => {
    if (parameter === "billingTab") setBillingTab(value as typeof billingTab);
    else setDataSupportTab(value as typeof dataSupportTab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("section", "administration");
      params.set("adminTab", parameter === "billingTab" ? "billing" : "data_support");
      params.set(parameter, value);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  return (
    <Tabs value={tab} onValueChange={(value) => setAdministrationTab(value as AdministrationTab)} className="min-w-0 space-y-6">
      <TabsList className="grid h-auto min-w-0 w-full grid-cols-1 gap-1 min-[420px]:grid-cols-2 sm:grid-cols-5">
        <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm" value="overview"><ShieldCheck className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" />Overview</TabsTrigger>
        <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm" value="institution"><Users className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" />People & access</TabsTrigger>
        <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm" value="billing"><CreditCard className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" />Products & billing</TabsTrigger>
        <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm" value="program_operations"><GraduationCap className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" />Programme operations</TabsTrigger>
        <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm" value="data_support"><LifeBuoy className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" />Data & support</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="min-w-0 space-y-6">
        <InstitutionAdministrationOverview institutionId={institutionId} onNavigate={setAdministrationTab} />
      </TabsContent>

      <TabsContent value="institution" className="min-w-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />People & access</CardTitle>
            <CardDescription>Keep the institution identity, roster, departments, account administrators, product roles, and shared scopes accurate before assigning work.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={peopleTab} onValueChange={(value) => setPeopleSection(value as PeopleTab)}>
              <TabsList className="grid h-auto min-w-0 w-full grid-cols-1 gap-1 min-[420px]:grid-cols-2 sm:grid-cols-5">
                <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm" value="institution"><Building2 className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" />Institution</TabsTrigger>
                <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm" value="people_access"><Users className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" />People & roles</TabsTrigger>
                <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm" value="departments"><FileText className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" />Departments & CPD</TabsTrigger>
                <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm" value="access_links"><ShieldCheck className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" />Access & links</TabsTrigger>
                <TabsTrigger className="min-w-0 whitespace-normal px-2 py-2 text-center text-xs leading-tight sm:text-sm" value="staff_import"><Users className="mr-1.5 hidden h-4 w-4 shrink-0 sm:block" />Staff import</TabsTrigger>
              </TabsList>
              <TabsContent value="institution" className="mt-5"><InstitutionDetailsCard institutionId={institutionId} companyName={institution.companyName} contactPhone={institution.contactPhone} contactEmail={institution.contactEmail} staffCount={institution.staffCount} organizationCategory={institution.organizationCategory} facilityOwnership={institution.facilityOwnership} facilityCareLevel={institution.facilityCareLevel} facilityLocalLevel={institution.facilityLocalLevel} /></TabsContent>
              <TabsContent value="people_access" className="mt-5"><InstitutionPeopleRolesPanel institutionId={institutionId} /></TabsContent>
              <TabsContent value="departments" className="mt-5"><InstitutionDepartmentReconciliationPanel institutionId={institutionId} /></TabsContent>
              <TabsContent value="access_links" className="mt-5 grid min-w-0 gap-6 xl:grid-cols-2"><AccountAdminsWidget institutionId={institutionId} /><PendingLinkRequestsWidget institutionId={institutionId} /></TabsContent>
              <TabsContent value="staff_import" className="mt-5"><StaffBulkImport institutionId={institutionId} /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="billing" className="min-w-0 space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Products & billing</CardTitle><CardDescription>Review IERS and CPD Portal access, renewal, contracts, and payment history. ILS is an order-based institutional programme and is operated in its separate lane.</CardDescription></CardHeader>
          <CardContent>
            <Tabs value={billingTab} onValueChange={(value) => setNestedTab("billingTab", value)}>
              <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3"><TabsTrigger value="access">Access status</TabsTrigger><TabsTrigger value="renewal">Renewal requests</TabsTrigger><TabsTrigger value="contracts">Contracts & history</TabsTrigger></TabsList>
              <TabsContent value="access" className="mt-5"><InstitutionProductAccessPanel institutionId={institutionId} /></TabsContent>
              <TabsContent value="renewal" className="mt-5"><InstitutionRenewalPanel institutionId={institutionId} /></TabsContent>
              <TabsContent value="contracts" className="mt-5"><InstitutionContractsTable institutionId={institutionId} /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="program_operations" className="min-w-0 space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Programme operations</CardTitle><CardDescription>Administration coordinates people, access, and handoffs. Product-specific operations stay in their own lanes so the wrong workflow is not mistaken for another.</CardDescription></CardHeader>
          <CardContent className="grid min-w-0 gap-3 md:grid-cols-3">
            <ProgrammeLink title="Open ILS operations" detail="Institution-paid provider cohorts, delivery readiness, practical assessment, certificates, and AHA requests." href="/training/institutional-life-support" icon={<GraduationCap className="h-5 w-5" />} />
            <ProgrammeLink title="Open IERS Readiness" detail="Departments, ERCo governance, teams, drills, equipment, evidence, and response improvement." href="/institution?section=iers&iersTab=command" icon={<HeartPulse className="h-5 w-5" />} />
            <ProgrammeLink title="Open Learning / CPD" detail="CPD sessions, staff development, attendance, targets, certificates, and reports." href="/institution?section=learning&learningTab=overview" icon={<BookOpen className="h-5 w-5" />} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Current operating rule</CardTitle><CardDescription>Use Administration to prepare the institution; use the product lane to execute product work.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3"><Rule title="Prepare" detail="Maintain identity, roster, departments, roles, and access." /><Rule title="Operate" detail="Run IERS, Learning/CPD, and ILS from their separate workspaces." /><Rule title="Review" detail="Use reports, support, and governance to close exceptions without deleting history." /></CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="data_support" className="min-w-0 space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5" />Data, support & governance</CardTitle><CardDescription>Separate preservation and export work from support requests and notification review so each exception has a clear owner.</CardDescription></CardHeader>
          <CardContent>
            <Tabs value={dataSupportTab} onValueChange={(value) => setNestedTab("dataSupportTab", value)}>
              <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3"><TabsTrigger value="data"><FileText className="mr-1.5 h-4 w-4" />Data & recovery</TabsTrigger><TabsTrigger value="support"><LifeBuoy className="mr-1.5 h-4 w-4" />Support</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger></TabsList>
              <TabsContent value="data" className="mt-5 space-y-5"><div className="grid gap-3 sm:grid-cols-2"><Button asChild variant="outline"><a href="/institution?section=iers&iersTab=evidence">Open IERS evidence and actions</a></Button><Button asChild variant="outline"><a href="/institution?section=learning&learningTab=cpd&cpdTab=certificates">Open CPD certificates and exports</a></Button><Button asChild variant="outline"><a href="/institution?section=connected"><Wrench className="mr-2 h-4 w-4" />Review managed services</a></Button></div><InstitutionDataLifecyclePanel institutionId={institutionId} /></TabsContent>
              <TabsContent value="support" className="mt-5"><Card><CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5" />Support requests</CardTitle><CardDescription>Raise requests for access, billing, data, or product incidents. Never place patient identifiers or secrets in a ticket.</CardDescription></CardHeader><CardContent><SupportTicketForm /></CardContent></Card></TabsContent>
              <TabsContent value="notifications" className="mt-5"><AdminNotificationsDashboard institutionId={institutionId} /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function ProgrammeLink({ title, detail, href, icon }: { title: string; detail: string; href: string; icon: React.ReactNode }) {
  return <Button asChild variant="outline" className="h-auto w-full min-w-0 justify-start p-4 text-left"><a className="flex min-w-0 items-center" href={href}><span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</span><span className="min-w-0"><span className="block break-words font-semibold">{title}</span><span className="mt-1 block break-words text-xs font-normal text-muted-foreground">{detail}</span></span><ArrowRight className="ml-auto h-4 w-4 shrink-0" /></a></Button>;
}

function Rule({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-lg border bg-background p-4"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>;
}

export default InstitutionAdministrationPanel;
