import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, CreditCard, FileText, LifeBuoy, ShieldCheck, Users, Wrench } from "lucide-react";
import { InstitutionDetailsCard } from "@/components/InstitutionDetailsCard";
import { InstitutionProductAccessPanel } from "@/components/InstitutionProductAccessPanel";
import { InstitutionPeopleRolesPanel } from "@/components/InstitutionPeopleRolesPanel";
import { AccountAdminsWidget } from "@/components/AccountAdminsWidget";
import { PendingLinkRequestsWidget } from "@/components/PendingLinkRequestsWidget";
import { InstitutionContractsTable } from "@/components/InstitutionContractsTable";
import StaffBulkImport from "@/components/StaffBulkImport";
import { BulkEnrollmentPanel } from "@/components/BulkEnrollmentPanel";
import { SupportTicketForm } from "@/components/SupportTicketForm";
import { AdminNotificationsDashboard } from "@/components/AdminNotificationsDashboard";
import { InstitutionDataLifecyclePanel } from "@/components/InstitutionDataLifecyclePanel";
import { InstitutionRenewalPanel } from "@/components/InstitutionRenewalPanel";
import { InstitutionDepartmentReconciliationPanel } from "@/components/InstitutionDepartmentReconciliationPanel";

type InstitutionRecord = {
  id: number;
  companyName: string;
  contactPhone: string | null;
  contactEmail: string;
  staffCount: number | null;
};

type AdministrationProfileTab = "institution" | "people_roles" | "departments_cpd" | "access_links" | "staff_import";

function getInitialAdministrationProfileTab(): AdministrationProfileTab {
  if (typeof window === "undefined") return "institution";
  const value = new URLSearchParams(window.location.search).get("adminTab");
  return value === "people_roles" || value === "departments_cpd" || value === "access_links" || value === "staff_import" ? value : "institution";
}

export function InstitutionAdministrationPanel({ institutionId, institution }: { institutionId: number; institution: InstitutionRecord }) {
  const [tab, setTab] = useState<"profile" | "billing" | "data_support">("profile");
  const [profileTab, setProfileTab] = useState<AdministrationProfileTab>(getInitialAdministrationProfileTab);
  const [courseType, setCourseType] = useState<"bls" | "acls" | "pals">("bls");
  const [trainingDate, setTrainingDate] = useState("");
  const [phone, setPhone] = useState("");

  const setAdministrationProfileTab = (nextTab: AdministrationProfileTab) => {
    setProfileTab(nextTab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("section", "administration");
      params.set("adminTab", nextTab);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="space-y-6">
      <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
        <TabsTrigger value="profile"><Users className="mr-2 h-4 w-4" />People & profile</TabsTrigger>
        <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4" />Billing & renewal</TabsTrigger>
        <TabsTrigger value="data_support"><LifeBuoy className="mr-2 h-4 w-4" />Data, support & recovery</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <Tabs value={profileTab} onValueChange={(value) => setAdministrationProfileTab(value as AdministrationProfileTab)} className="space-y-5">
          <TabsList className="sticky top-2 z-20 grid h-auto w-full grid-cols-2 gap-1 overflow-x-auto bg-background/95 p-1 shadow-sm backdrop-blur sm:grid-cols-5">
            <TabsTrigger value="institution" className="min-w-0 whitespace-normal text-xs sm:text-sm"><Building2 className="mr-1.5 h-4 w-4 shrink-0" />Institution</TabsTrigger>
            <TabsTrigger value="people_roles" className="min-w-0 whitespace-normal text-xs sm:text-sm"><Users className="mr-1.5 h-4 w-4 shrink-0" />People & roles</TabsTrigger>
            <TabsTrigger value="departments_cpd" className="min-w-0 whitespace-normal text-xs sm:text-sm"><FileText className="mr-1.5 h-4 w-4 shrink-0" />Departments & CPD</TabsTrigger>
            <TabsTrigger value="access_links" className="min-w-0 whitespace-normal text-xs sm:text-sm"><ShieldCheck className="mr-1.5 h-4 w-4 shrink-0" />Access & links</TabsTrigger>
            <TabsTrigger value="staff_import" className="min-w-0 whitespace-normal text-xs sm:text-sm"><Users className="mr-1.5 h-4 w-4 shrink-0" />Staff import</TabsTrigger>
          </TabsList>
          <TabsContent value="institution" className="space-y-6">
            <InstitutionDetailsCard
              institutionId={institutionId}
              companyName={institution.companyName}
              contactPhone={institution.contactPhone}
              contactEmail={institution.contactEmail}
              staffCount={institution.staffCount}
            />
          </TabsContent>
          <TabsContent value="people_roles" className="space-y-6"><InstitutionPeopleRolesPanel institutionId={institutionId} /></TabsContent>
          <TabsContent value="departments_cpd" className="space-y-6"><InstitutionDepartmentReconciliationPanel institutionId={institutionId} /></TabsContent>
          <TabsContent value="access_links" className="grid gap-6 xl:grid-cols-2">
            <AccountAdminsWidget institutionId={institutionId} />
            <PendingLinkRequestsWidget institutionId={institutionId} />
          </TabsContent>
          <TabsContent value="staff_import" className="space-y-6"><StaffBulkImport institutionId={institutionId} /></TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="billing" className="space-y-6">
        <InstitutionProductAccessPanel institutionId={institutionId} />
        <InstitutionRenewalPanel institutionId={institutionId} />
        <BulkEnrollmentPanel
          institutionId={institutionId}
          courseType={courseType}
          setCourseType={setCourseType}
          trainingDate={trainingDate}
          setTrainingDate={setTrainingDate}
          phone={phone}
          setPhone={setPhone}
        />
        <InstitutionContractsTable institutionId={institutionId} />
      </TabsContent>

      <TabsContent value="data_support" className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Data & exports</CardTitle><CardDescription>Product exports remain product-filtered. Use the IERS executive snapshot for readiness evidence and CPD Portal exports for staff development records.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline"><a href="/institution?section=iers&iersTab=evidence">Open IERS evidence and actions</a></Button>
            <Button asChild variant="outline"><a href="/institution?section=learning&learningTab=cpd&cpdTab=certificates">Open CPD certificates and exports</a></Button>
            <Button asChild variant="outline"><a href="/institution?section=connected"><Wrench className="mr-2 h-4 w-4" />Review managed services</a></Button>
          </CardContent>
        </Card>
        <InstitutionDataLifecyclePanel institutionId={institutionId} />
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5" />Notifications, support & recovery</CardTitle><CardDescription>Review facility alerts and raise support requests for access, billing, data, or product incidents. Never place patient identifiers or secrets in a ticket.</CardDescription></CardHeader>
          <CardContent><SupportTicketForm /></CardContent>
        </Card>
        <AdminNotificationsDashboard institutionId={institutionId} />
      </TabsContent>
    </Tabs>
  );
}

export default InstitutionAdministrationPanel;
