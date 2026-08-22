import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, CreditCard, FileText, LifeBuoy, Users } from "lucide-react";
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

type InstitutionRecord = {
  id: number;
  companyName: string;
  contactPhone: string | null;
  contactEmail: string;
  staffCount: number | null;
};

export function InstitutionAdministrationPanel({ institutionId, institution }: { institutionId: number; institution: InstitutionRecord }) {
  const [tab, setTab] = useState<"profile" | "billing" | "data_support">("profile");
  const [courseType, setCourseType] = useState<"bls" | "acls" | "pals">("bls");
  const [trainingDate, setTrainingDate] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="space-y-6">
      <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
        <TabsTrigger value="profile"><Users className="mr-2 h-4 w-4" />People & profile</TabsTrigger>
        <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4" />Billing & renewal</TabsTrigger>
        <TabsTrigger value="data_support"><LifeBuoy className="mr-2 h-4 w-4" />Data, support & recovery</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <InstitutionDetailsCard
          institutionId={institutionId}
          companyName={institution.companyName}
          contactPhone={institution.contactPhone}
          contactEmail={institution.contactEmail}
          staffCount={institution.staffCount}
        />
        <InstitutionPeopleRolesPanel institutionId={institutionId} />
        <div className="grid gap-6 xl:grid-cols-2">
          <AccountAdminsWidget institutionId={institutionId} />
          <PendingLinkRequestsWidget institutionId={institutionId} />
        </div>
        <StaffBulkImport institutionId={institutionId} />
      </TabsContent>

      <TabsContent value="billing" className="space-y-6">
        <InstitutionProductAccessPanel institutionId={institutionId} />
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
            <Button asChild variant="outline"><a href="/institution#iers">Open IERS evidence and snapshot</a></Button>
            <Button asChild variant="outline"><a href="/institution#cpd_portal">Open CPD Portal records</a></Button>
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
