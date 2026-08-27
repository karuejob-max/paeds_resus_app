import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { trpc } from "@/lib/trpc";
import SignaturePad from "@/components/SignaturePad";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Loader2,
  Download,
  QrCode,
  PlusCircle,
  Ban,
  Save,
  FileArchive,
  Copy,
  Check,
  Printer,
  Award,
  Users,
  Building2,
  Sparkles,
  Edit,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Trash2,
  Calendar,
  BarChart3,
} from "lucide-react";
import { CANONICAL_CLINICAL_DEPARTMENTS } from "@/lib/clinical-departments";
import { DepartmentSelectors } from "@/components/DepartmentSelectors";
import CadreProgressiveSelector from "@/components/CadreProgressiveSelector";
import { StaffPerformanceRoster } from "@/components/StaffPerformanceRoster";
import { ALL_STANDARD_SPECIALTIES } from "@/lib/cadre-taxonomy";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CpdPanelProps {
  institutionId: number;
  compact?: boolean;
}

type CpdSubTab = "overview" | "sessions" | "staff_development" | "certificates" | "new_session" | "settings";

function getInitialCpdSubTab(): CpdSubTab {
  if (typeof window === "undefined") return "overview";
  const value = new URLSearchParams(window.location.search).get("cpdTab");
  return value === "sessions" || value === "staff_development" || value === "certificates" || value === "new_session" || value === "settings" ? value : "overview";
}

function AttendeeDepartmentCell({ department, canonicalDepartmentName }: { department: string; canonicalDepartmentName?: string | null }) {
  const canonical = canonicalDepartmentName?.trim() || null;
  const showOriginal = canonical != null && canonical !== department;
  return (
    <div className="min-w-0">
      <div className="font-medium break-words">{canonical ?? department}</div>
      {showOriginal && <div className="break-words text-[11px] text-muted-foreground">Recorded label: {department}</div>}
    </div>
  );
}

export default function CpdPanel({ institutionId, compact = false }: CpdPanelProps) {
  const utils = trpc.useUtils();

  const settingsQuery = trpc.cpd.getSettings.useQuery({ institutionId });
  const eventsQuery = trpc.cpd.listEvents.useQuery({ institutionId });
  const analyticsQuery = trpc.cpd.getInstitutionalCpdAnalytics.useQuery({ institutionId });

  // Drilldown Modal states
  const [drilldownType, setDrilldownType] = useState<"sessions" | "registrations" | "points" | "active_depts" | "role_engagement" | "dept_heatmap" | null>(null);
  const [selectedDrilldownDept, setSelectedDrilldownDept] = useState<string | null>(null);
  const [selectedDrilldownRole, setSelectedDrilldownRole] = useState<string | null>(null);

  const allAttendeesQuery = trpc.cpd.listAttendees.useQuery(
    { institutionId },
    { enabled: drilldownType === "registrations" || drilldownType === "points" || drilldownType === "dept_heatmap" }
  );
  const allAttendees = allAttendeesQuery.data ?? [];

  const [coordinatorName, setCoordinatorName] = useState<string | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [eventType, setEventType] = useState<"cne" | "cme" | "cpd_general" | "grand_rounds" | "journal_club" | "workshop">("cne");
  
  // Presenter Autocomplete State (Open Event)
  const [presenterUserId, setPresenterUserId] = useState<number | null>(null);
  const [presenterName, setPresenterName] = useState("");
  const [presenterCadre, setPresenterCadre] = useState("");
  const [presenterSubSpecialty, setPresenterSubSpecialty] = useState("");
  const [presenterCustomOther, setPresenterCustomOther] = useState("");
  const [presenterDepartment, setPresenterDepartment] = useState("");
  const [showPresenterSuggestions, setShowPresenterSuggestions] = useState(false);

  const [approvingCouncil, setApprovingCouncil] = useState("NCK");
  const [customCouncil, setCustomCouncil] = useState("");
  const [cpdPoints, setCpdPoints] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Presenter Autocomplete State (Edit Event)
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editPresenterUserId, setEditPresenterUserId] = useState<number | null>(null);
  const [editPresenterName, setEditPresenterName] = useState("");
  const [editPresenterCadre, setEditPresenterCadre] = useState("");
  const [editPresenterSubSpecialty, setEditPresenterSubSpecialty] = useState("");
  const [editPresenterCustomOther, setEditPresenterCustomOther] = useState("");
  const [editPresenterDept, setEditPresenterDept] = useState("");
  const [editEventType, setEditEventType] = useState<"cne" | "cme" | "cpd_general" | "grand_rounds" | "journal_club" | "workshop">("cne");
  const [editCpdPoints, setEditCpdPoints] = useState("");
  const [editApprovingCouncil, setEditApprovingCouncil] = useState("NCK");
  const [showEditPresenterSuggestions, setShowEditPresenterSuggestions] = useState(false);

  // Helper functions for parsing and setting presenter cadre
  const setPresenterCadreFromUser = (
    userCadre: string | null,
    userCadreOther: string | null,
    isEdit: boolean
  ) => {
    const cadre = userCadre || "";
    let subSpecialty = "";
    let customOther = "";

    if (cadre) {
      const isStandardSub = ALL_STANDARD_SPECIALTIES.includes(userCadreOther || "");
      if (userCadreOther && !isStandardSub && [
        "Consultant Physician", "MSN", "HND", "Consultant Physician Student", "MSN Student", "HND Student", "RCO HND"
      ].includes(cadre)) {
        subSpecialty = "Other";
        customOther = userCadreOther;
      } else {
        subSpecialty = userCadreOther || "";
        customOther = ["Other Staff", "Other Intern", "Other Student"].includes(cadre) ? (userCadreOther || "") : "";
      }
    }

    if (isEdit) {
      setEditPresenterCadre(cadre);
      setEditPresenterSubSpecialty(subSpecialty);
      setEditPresenterCustomOther(customOther);
    } else {
      setPresenterCadre(cadre);
      setPresenterSubSpecialty(subSpecialty);
      setPresenterCustomOther(customOther);
    }
  };

  const parsePresenterCadre = (presenterCadreString: string) => {
    const val = presenterCadreString.trim();
    if (!val) {
      return { cadre: "", cadreOther: "", customOther: "" };
    }

    const parts = val.split(" - ");
    if (parts.length === 2) {
      const cadre = parts[0];
      const cadreOther = parts[1];
      const isStandardSub = ALL_STANDARD_SPECIALTIES.includes(cadreOther);
      if (!isStandardSub && [
        "Consultant Physician", "MSN", "HND", "Consultant Physician Student", "MSN Student", "HND Student", "RCO HND"
      ].includes(cadre)) {
        return { cadre, cadreOther: "Other", customOther: cadreOther };
      }
      return {
        cadre,
        cadreOther,
        customOther: ["Other Staff", "Other Intern", "Other Student"].includes(cadre) ? cadreOther : ""
      };
    }

    const standardCadres = [
      "Consultant Physician", "MO", "RCO", "RN", "Other Staff",
      "MOI", "NOI", "COI", "Other Intern",
      "Medical Student", "Nursing Student", "Clinical Officer Student", "Consultant Physician Student", "Other Student"
    ];
    if (standardCadres.includes(val)) {
      return { cadre: val, cadreOther: "", customOther: "" };
    }

    if (ALL_STANDARD_SPECIALTIES.includes(val)) {
      const consultantSpecialties = [
        "General Paediatrician", "Paediatric Cardiologist", "Paediatric Nephrologist",
        "Paediatric Oncologist / Haematologist", "Paediatric Neurologist", "Paediatric Endocrinologist",
        "Paediatric Pulmonologist / Respirologist", "Paediatric Gastroenterologist", "Neonatologist",
        "Paediatric Critical Care Specialist", "Paediatric Emergency Medicine Specialist",
        "Paediatric Infectious Disease Specialist", "Paediatric Rheumatologist", "Paediatric Allergist / Immunologist",
        "Other Specialist"
      ];
      if (consultantSpecialties.includes(val)) {
        return { cadre: "Consultant Physician", cadreOther: val, customOther: "" };
      }

      const msnSpecialties = [
        "Paediatric Critical Care Nursing", "Neonatal Nursing", "Midwifery / Reproductive Health Nursing",
        "Nephrology / Renal Nursing", "Oncology and Palliative Care Nursing", "Critical Care Nursing (Intensive Care)",
        "Trauma & Emergency Nursing", "Medical Surgical Nursing", "Nursing Education / Leadership",
        "Community Health Nursing", "Mental Health and Psychiatric Nursing"
      ];
      if (msnSpecialties.includes(val)) {
        return { cadre: "MSN", cadreOther: val, customOther: "" };
      }

      const hndSpecialties = [
        "Nurse Anaesthesia Nursing (KRNA)", "Peri-Operative Nursing (Theatre Nursing)",
        "Stoma and Wound Care Nursing", "Infection Prevention and Control Nursing", "Nephrology Nursing (Renal)",
        "Cardiovascular / Cardiac Nursing", "Oncology Nursing", "Pediatric Oncology Nursing", "Diabetes Nursing",
        "Ophthalmic Nursing (Eye Care)", "Ear, Nose, and Throat (ENT) Nursing", "Paediatric Nursing",
        "Psychiatric / Mental Health Nursing", "Geriatric Nursing (Aged Care)", "Community Health / Public Health Nursing",
        "Family Health Nursing", "Palliative Care Nursing"
      ];
      if (hndSpecialties.includes(val)) {
        return { cadre: "HND", cadreOther: val, customOther: "" };
      }

      const coSpecialties = [
        "Anaesthesia", "Paediatrics", "Ophthalmology / Cataract Surgery", "Orthopaedics",
        "ENT / Audiology", "Reproductive Health / Medicine", "Dermatology", "Oncology",
        "Chest / Pulmonology Medicine", "Emergency Medicine / Critical Care"
      ];
      if (coSpecialties.includes(val)) {
        return { cadre: "RCO HND", cadreOther: val, customOther: "" };
      }
    }

    return { cadre: "Other Staff", cadreOther: "", customOther: val };
  };

  // Search queries for autocomplete
  const presenterSearchQuery = trpc.cpd.searchPresenters.useQuery(
    { query: presenterName, institutionId },
    { enabled: showPresenterSuggestions && presenterName.trim().length >= 2 }
  );

  const editPresenterSearchQuery = trpc.cpd.searchPresenters.useQuery(
    { query: editPresenterName, institutionId },
    { enabled: showEditPresenterSuggestions && editPresenterName.trim().length >= 2 }
  );

  const events = eventsQuery.data ?? [];
  const openEvent = events.find((e) => e.isOpen) ?? null;
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const effectiveEventId = selectedEventId ?? openEvent?.id ?? events[0]?.id ?? null;
  const selectedEvent = events.find((e) => e.id === effectiveEventId) ?? null;

  const [cpdCodeInput, setCpdCodeInput] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  // Navigation Tabs for new users (avoid vertical scrolling fatigue)
  const [cpdSubTab, setCpdSubTabState] = useState<CpdSubTab>(() => {
    const requested = getInitialCpdSubTab();
    if (compact && requested !== "sessions" && requested !== "certificates") return "sessions";
    return requested;
  });
  const setCpdSubTab = (tab: CpdSubTab) => {
    setCpdSubTabState(tab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("section", "cpd_portal");
      params.set("cpdTab", tab);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  // Delete event state
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<{ id: number; name: string; isOpen: boolean; attendeeCount: number } | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteConfirmAttendeesInput, setDeleteConfirmAttendeesInput] = useState("");

  useEffect(() => {
    if (selectedEvent) {
      setCpdCodeInput(selectedEvent.cpdCode ?? "");
    } else {
      setCpdCodeInput("");
    }
  }, [selectedEvent]);

  const attendeesQuery = trpc.cpd.listAttendees.useQuery(
    { institutionId, eventId: effectiveEventId ?? undefined },
    { enabled: effectiveEventId != null }
  );
  const attendees = attendeesQuery.data ?? [];

  const coordinatorValue = coordinatorName ?? settingsQuery.data?.coordinatorName ?? "";

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/cpd/register/${institutionId}`;
  }, [institutionId]);

  const updateCoordinatorMutation = trpc.cpd.updateCoordinator.useMutation({
    onSuccess: () => {
      toast.success("CPD Coordinator updated");
      void utils.cpd.getSettings.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to update coordinator"),
  });

  const openEventMutation = trpc.cpd.openEvent.useMutation({
    onSuccess: () => {
      toast.success("Event opened for registration");
      setNewEventName("");
      setNewEventDate("");
      setPresenterUserId(null);
      setPresenterName("");
      setPresenterCadre("");
      setPresenterSubSpecialty("");
      setPresenterCustomOther("");
      setPresenterDepartment("");
      setApprovingCouncil("NCK");
      setCustomCouncil("");
      setCpdPoints("");
      setShowPresenterSuggestions(false);
      void utils.cpd.listEvents.invalidate({ institutionId });
      void utils.cpd.getInstitutionalCpdAnalytics.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to open event"),
  });

  const updateEventPresenterMutation = trpc.cpd.updateEventPresenter.useMutation({
    onSuccess: () => {
      toast.success("Event presenter & details updated");
      setEditingEventId(null);
      setShowEditPresenterSuggestions(false);
      void utils.cpd.listEvents.invalidate({ institutionId });
      void utils.cpd.getInstitutionalCpdAnalytics.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to update event details"),
  });

  const closeEventMutation = trpc.cpd.closeEvent.useMutation({
    onSuccess: () => {
      toast.success("CPD Event closed");
      void utils.cpd.listEvents.invalidate({ institutionId });
      void utils.cpd.getInstitutionalCpdAnalytics.invalidate({ institutionId });
    },
  });

  const deleteEventMutation = trpc.cpd.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("CPD event permanently deleted.");
      setDeleteTargetEvent(null);
      setDeleteConfirmInput("");
      setDeleteConfirmAttendeesInput("");
      void utils.cpd.listEvents.invalidate({ institutionId });
      void utils.cpd.getInstitutionalCpdAnalytics.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to delete event"),
  });

  const updateCpdCodeMutation = trpc.cpd.updateCpdCode.useMutation({
    onSuccess: () => {
      toast.success("CPD secret code updated");
      void utils.cpd.listEvents.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to update CPD code"),
  });

  const updateSignatureMutation = trpc.cpd.updateSignature.useMutation({
    onSuccess: (res) => {
      toast.success(res.hasSignature ? "Signature saved" : "Signature cleared");
      void utils.cpd.getSettings.invalidate({ institutionId });
    },
    onError: (err) => toast.error(err.message || "Failed to save signature"),
  });

  const savedSignature = settingsQuery.data?.coordinatorSignature ?? null;
  const analytics = analyticsQuery.data;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const printQrCode = () => {
    const svgEl = qrCodeRef.current?.querySelector("svg");
    if (!svgEl) {
      toast.error("QR code isn't ready yet.");
      return;
    }
    const printWindow = window.open("", "_blank", "width=480,height=620");
    if (!printWindow) {
      toast.error("Pop-up blocked.");
      return;
    }
    const eventLabel = openEvent
      ? `${openEvent.name} — ${openEvent.eventDate}`
      : selectedEvent
        ? `${selectedEvent.name} — ${selectedEvent.eventDate}`
        : "";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CPD Registration QR Code</title>
          <style>
            body { font-family: -apple-system, sans-serif; text-align: center; padding: 40px 24px; }
            h1 { font-size: 18px; margin: 0 0 8px; }
            p { font-size: 14px; color: #444; margin: 0 0 24px; }
            .qr-box { display: inline-block; border: 1px solid #ccc; border-radius: 12px; padding: 24px; }
            .footer { margin-top: 24px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <h1>Scan to register for CPD</h1>
          ${eventLabel ? `<p>${eventLabel}</p>` : ""}
          <div class="qr-box">${svgEl.outerHTML}</div>
          <p class="footer">Paeds Resus login required</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const downloadCsv = async () => {
    try {
      const result = await utils.cpd.exportCsv.fetch({
        institutionId,
        eventId: effectiveEventId ?? undefined,
      });
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cpd-attendees-${effectiveEventId ?? "all"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message || "Failed to export CSV");
    }
  };

  const filteredStaffMatrix = (analytics?.staffMatrix ?? []).filter(
    (s) =>
      s.fullName.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.department.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.cadre.toLowerCase().includes(staffSearch.toLowerCase())
  );  return (
    <>
      {/* Sub-tab navigation header for new users */}
      <div className="sticky top-2 z-20 -mx-1 mb-6 flex gap-2 overflow-x-auto border-b bg-background/95 px-1 pb-3 pt-1 shadow-sm backdrop-blur sm:static sm:mx-0 sm:flex-wrap sm:overflow-visible sm:bg-transparent sm:px-0 sm:pt-0 sm:shadow-none">
        {!compact && <Button
          variant={cpdSubTab === "overview" ? "default" : "outline"}
          onClick={() => setCpdSubTab("overview")}
          className="text-xs font-semibold gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Overview & Analytics
        </Button>}
        <Button
          variant={cpdSubTab === "sessions" ? "default" : "outline"}
          onClick={() => setCpdSubTab("sessions")}
          className="text-xs font-semibold gap-2"
        >
          <Calendar className="h-4 w-4" />
          Sessions & Check-In
        </Button>
        {!compact && <Button
          variant={cpdSubTab === "staff_development" ? "default" : "outline"}
          onClick={() => setCpdSubTab("staff_development")}
          className="text-xs font-semibold gap-2"
        >
          <UserCheck className="h-4 w-4" />
          Staff Development
        </Button>}
        <Button
          variant={cpdSubTab === "certificates" ? "default" : "outline"}
          onClick={() => setCpdSubTab("certificates")}
          className="text-xs font-semibold gap-2"
        >
          <Award className="h-4 w-4" />
          Certificates & Exports
        </Button>
        {!compact && <Button
          variant={cpdSubTab === "new_session" ? "default" : "outline"}
          onClick={() => setCpdSubTab("new_session")}
          className="text-xs font-semibold gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Open New Session
        </Button>}
        {!compact && <Button
          variant={cpdSubTab === "settings" ? "default" : "outline"}
          onClick={() => setCpdSubTab("settings")}
          className="text-xs font-semibold gap-2"
        >
          <Building2 className="h-4 w-4" />
          Certificate settings
        </Button>}
      </div>

      <div className="space-y-6">
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="grid gap-3 p-4 text-xs sm:grid-cols-4">
            <div><p className="font-semibold text-blue-950 dark:text-blue-100">Reporting scope</p><p className="text-muted-foreground">Professional development activity only.</p></div>
            <div><p className="font-semibold text-blue-950 dark:text-blue-100">Primary source</p><p className="text-muted-foreground">CPD sessions, registrations, attendance, and certificates.</p></div>
            <div><p className="font-semibold text-blue-950 dark:text-blue-100">Freshness</p><p className="text-muted-foreground">Live institution-scoped records; refresh the page after bulk changes.</p></div>
            <div><p className="font-semibold text-blue-950 dark:text-blue-100">Boundary</p><p className="text-muted-foreground">CPD figures do not certify IERS emergency competency.</p></div>
          </CardContent>
        </Card>
        {/* --- OVERVIEW & ANALYTICS TAB --- */}
        {!compact && cpdSubTab === "overview" && (
          <>
            {/* 📊 Institutional Learning Radar Summary */}
            {analytics && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card 
                  className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-white dark:border-blue-900/30 dark:from-blue-950/20 dark:to-background cursor-pointer hover:shadow-md hover:border-blue-300 transition-all select-none"
                  onClick={() => setDrilldownType("sessions")}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Total CPD Sessions
                    </CardTitle>
                    <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.summary.totalEvents}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.summary.cneCount} CNEs · {analytics.summary.cmeCount} CMEs · {analytics.summary.workshopCount} Workshops
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-background cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all select-none"
                  onClick={() => setDrilldownType("registrations")}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                      Total Registrations
                    </CardTitle>
                    <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.summary.totalAttendees}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Across all clinical departments
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="border-purple-100 bg-gradient-to-br from-purple-50/50 to-white dark:border-purple-900/30 dark:from-purple-950/20 dark:to-background cursor-pointer hover:shadow-md hover:border-purple-300 transition-all select-none"
                  onClick={() => setDrilldownType("points")}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-200">
                      Points Issued
                    </CardTitle>
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.summary.totalPointsIssued}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Council accredited points minted
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="border-amber-100 bg-gradient-to-br from-amber-50/50 to-white dark:border-amber-900/30 dark:from-amber-950/20 dark:to-background cursor-pointer hover:shadow-md hover:border-amber-300 transition-all select-none"
                  onClick={() => setDrilldownType("active_depts")}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      Active Departments
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.departmentHeatmap.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Participating hospital units
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 📊 Staff CPD Engagement Rates */}
            {analytics?.roleEngagement && analytics.roleEngagement.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Staff CPD Participation & Engagement Rates
                  </CardTitle>
                  <CardDescription>
                    Percentage of registered hospital staff members who have participated in at least one CNE session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {analytics.roleEngagement.map((re) => {
                      if (re.totalStaff === 0) return null;
                      return (
                        <div 
                          key={re.role} 
                          className="rounded-lg border p-3 bg-slate-50/50 dark:bg-slate-900/20 space-y-2 cursor-pointer hover:shadow-sm hover:border-indigo-300 transition-all select-none"
                          onClick={() => {
                            setSelectedDrilldownRole(re.label);
                            setDrilldownType("role_engagement");
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">{re.label}</span>
                            <Badge className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-200/50 dark:bg-indigo-950 dark:text-indigo-200">
                              {re.cneParticipants} / {re.totalStaff} Active
                            </Badge>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1">
                              <span>CNE Attendance Rate</span>
                              <span>{re.cneRate}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${re.cneRate}%` }} />
                            </div>
                          </div>
                          <div className="text-[10px] text-muted-foreground pt-1 border-t border-dashed">
                            {re.cpdParticipants} of {re.totalStaff} ({re.cpdRate}%) attended any CPD session
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 🏆 Department Leaderboard & Presenter Hall of Fame */}
            {analytics && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Presenting Department Leaderboard */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" /> Departmental CPD Activity
                    </CardTitle>
                    <CardDescription>
                      Which departments present most vs. which are being left behind
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.departmentHeatmap.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No departmental data yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.departmentHeatmap.slice(0, 6).map((dept) => (
                          <div 
                            key={dept.department} 
                            className="flex items-center justify-between border-b pb-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 p-1.5 rounded transition-colors select-none"
                            onClick={() => {
                              setSelectedDrilldownDept(dept.department);
                              setDrilldownType("dept_heatmap");
                            }}
                          >
                            <div>
                              <span className="font-medium text-slate-800 dark:text-slate-200">{dept.department}</span>
                              <div className="text-xs text-muted-foreground">
                                {dept.presentedCount} sessions presented
                              </div>
                            </div>
                            <Badge variant={dept.attendedCount > 5 ? "default" : "secondary"}>
                              {dept.attendedCount} Attendees
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Presenter Hall of Fame */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" /> Internal Faculty & Presenters
                    </CardTitle>
                    <CardDescription>
                      Clinicians and educators leading CPD presentations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.presenterLeaderboard.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2 opacity-80" />
                        <p className="text-sm font-medium">No Presenters Logged Yet</p>
                        <p className="text-xs max-w-xs mt-1">
                          Assign presenters to your CPD events below to build your hospital's internal faculty leaderboard.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analytics.presenterLeaderboard.slice(0, 6).map((p) => (
                          <div key={p.presenterName} className="flex items-center justify-between border-b pb-2 text-sm">
                            <div>
                              <span className="font-medium text-slate-800 dark:text-slate-200">{p.presenterName}</span>
                              <div className="text-xs text-muted-foreground">
                                {p.cadre} · {p.department}
                              </div>
                            </div>
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200">
                              {p.sessionCount} {p.sessionCount === 1 ? "Session" : "Sessions"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Staff Attendance & Locum Matrix */}
            {analytics && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Staff CPD Ledger & Locum Matrix</CardTitle>
                      <CardDescription>
                        Detailed attendance records per staff member with locum/outreach flags
                      </CardDescription>
                    </div>
                    <Input
                      placeholder="Search staff or department..."
                      className="max-w-xs h-8 text-xs"
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredStaffMatrix.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No matching staff attendance found.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff Name</TableHead>
                          <TableHead>Cadre & Department</TableHead>
                          <TableHead>CNEs Attended</TableHead>
                          <TableHead>CMEs Attended</TableHead>
                          <TableHead>Total CPDs</TableHead>
                          <TableHead className="text-right">Attendance Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStaffMatrix.map((staff) => (
                          <TableRow key={staff.email}>
                            <TableCell className="font-medium">
                              <div>{staff.fullName}</div>
                              <div className="text-[11px] text-muted-foreground">{staff.email}</div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {staff.cadre} · <span className="font-medium text-slate-700 dark:text-slate-300">{staff.department}</span>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-blue-600">{staff.cneAttended}</TableCell>
                            <TableCell className="text-xs font-semibold text-emerald-600">{staff.cmeAttended}</TableCell>
                            <TableCell className="text-xs font-bold">{staff.totalAttended}</TableCell>
                            <TableCell className="text-right">
                              {staff.isLocum ? (
                                <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950">
                                  Locum / Outreach
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Primary Staff</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* --- STAFF DEVELOPMENT TAB --- */}
        {!compact && cpdSubTab === "staff_development" && (
          <div className="space-y-6">
            <Card className="border-indigo-200 bg-indigo-50/40 dark:border-indigo-900 dark:bg-indigo-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-indigo-700" />Staff Development</CardTitle>
                <CardDescription>Use CPD participation, QI engagement, crash-cart activity, and life-support status to guide professional-development conversations. This is an appraisal aid, not a public leaderboard.</CardDescription>
              </CardHeader>
            </Card>
            <StaffPerformanceRoster />
          </div>
        )}

        {/* --- CERTIFICATES & EXPORTS TAB --- */}
        {cpdSubTab === "certificates" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-purple-700" />CPD Certificates & Exports</CardTitle>
                <CardDescription>Choose a session, review attendance, and export only the records belonging to this institution.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-xl space-y-2">
                  <Label htmlFor="certificate-event">Session</Label>
                  <select id="certificate-event" value={effectiveEventId ?? ""} onChange={(event) => setSelectedEventId(event.target.value ? Number(event.target.value) : null)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {events.length === 0 ? <option value="">No sessions available</option> : events.map((event) => <option key={event.id} value={event.id}>{event.name} — {event.eventDate}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={downloadCsv} disabled={attendees.length === 0}><Download className="mr-2 h-4 w-4" />Export attendance CSV</Button>
                  <Button onClick={() => effectiveEventId && window.open(`/api/cpd/certificate/bulk/${effectiveEventId}`, "_blank")} disabled={!effectiveEventId || attendees.length === 0}><FileArchive className="mr-2 h-4 w-4" />Download certificates ZIP</Button>
                </div>
                <p className="text-xs text-muted-foreground">{attendees.length} attendee record(s) loaded for the selected session.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Certificate register</CardTitle><CardDescription>Individual PDF links are available after attendance has been recorded.</CardDescription></CardHeader>
              <CardContent>
                {attendees.length === 0 ? <p className="text-sm text-muted-foreground">No attendance records for this session yet.</p> : <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Cadre</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Certificate</TableHead></TableRow></TableHeader><TableBody>{attendees.map((attendee) => <TableRow key={attendee.id}><TableCell className="font-medium">{attendee.fullName}</TableCell><TableCell>{attendee.cadre === "Other" ? attendee.cadreOther || "Other" : attendee.cadre}</TableCell><TableCell><AttendeeDepartmentCell department={attendee.department} canonicalDepartmentName={attendee.canonicalDepartmentName} /></TableCell><TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => window.open(`/api/cpd/certificate/${attendee.id}`, "_blank")}><Download className="mr-1 h-3.5 w-3.5" />PDF</Button></TableCell></TableRow>)}</TableBody></Table>}
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- SESSIONS & CHECK-IN TAB --- */}
        {cpdSubTab === "sessions" && (
          <>
            {/* QR code + public link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-blue-600" /> Registration QR Code
                </CardTitle>
                <CardDescription>
                  Nurses and doctors scan this code to check-in — Paeds Resus login required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                  <div ref={qrCodeRef} className="rounded-lg border bg-white p-3 shadow-sm">
                    {publicUrl ? <QRCodeSVG value={publicUrl} size={148} /> : null}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Public registration link</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={publicUrl} className="font-mono text-xs" />
                      <Button variant="outline" onClick={copyLink}>
                        {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" onClick={printQrCode} disabled={!publicUrl} title="Print QR code">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {openEvent
                        ? `Open event: ${openEvent.name} (${openEvent.eventDate})`
                        : "No event is currently open. Open one below to accept registrations."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Events list */}
            <Card>
              <CardHeader>
                <CardTitle>All CPD Sessions</CardTitle>
                <CardDescription>
                  Click 'View' to see registrations and verify certificates for any event below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eventsQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Presenter</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Attendees</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow
                          key={event.id}
                          className={event.id === effectiveEventId ? "bg-muted/40" : undefined}
                        >
                          <TableCell className="font-medium">
                            <div>{event.name}</div>
                            {event.cpdPoints && (
                              <div className="text-xs text-muted-foreground">
                                {event.cpdPoints} Points · {event.approvingCouncil || "Standard"}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase text-[10px]">
                              {event.eventType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {event.presenterName ? (
                              <div className="text-xs">
                                <span className="font-semibold">{event.presenterName}</span>
                                <div className="text-muted-foreground">{event.presenterDepartment || "General"}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>{event.eventDate}</TableCell>
                          <TableCell>
                            {event.isOpen ? (
                              <Badge className="bg-emerald-600">Open</Badge>
                            ) : (
                              <Badge variant="secondary">Closed</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-slate-50 font-mono">
                              {(event as any).attendeeCount ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEventId(event.id)}
                              >
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Edit Presenter & Details"
                                onClick={() => {
                                  setEditingEventId(event.id);
                                  setEditPresenterUserId(event.presenterUserId || null);
                                  setEditPresenterName(event.presenterName || "");
                                  const parsed = parsePresenterCadre(event.presenterCadre || "");
                                  setEditPresenterCadre(parsed.cadre);
                                  setEditPresenterSubSpecialty(parsed.cadreOther);
                                  setEditPresenterCustomOther(parsed.customOther);
                                  setEditPresenterDept(event.presenterDepartment || "");
                                  setEditEventType((event.eventType as any) || "cne");
                                  setEditCpdPoints(event.cpdPoints || "");
                                  setEditApprovingCouncil(event.approvingCouncil || "NCK");
                                  setShowEditPresenterSuggestions(false);
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              {event.isOpen ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    closeEventMutation.mutate({ institutionId, eventId: event.id })
                                  }
                                  disabled={closeEventMutation.isPending}
                                >
                                  <Ban className="mr-1 h-3.5 w-3.5" />
                                  Close
                                </Button>
                              ) : null}
                              {/* Delete button — supports both empty sessions & sessions with attendees via super-confirm */}
                              {!event.isOpen && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Delete CPD session (irreversible)"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setDeleteTargetEvent({
                                      id: event.id,
                                      name: event.name,
                                      isOpen: event.isOpen,
                                      attendeeCount: (event as any).attendeeCount ?? 0,
                                    });
                                    setDeleteConfirmInput("");
                                    setDeleteConfirmAttendeesInput("");
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Edit Presenter Modal/Inline Card */}
                {editingEventId && (
                  <Card className="mt-4 border-purple-200 bg-purple-50/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Edit / Backfill CPD Event Details</span>
                        <Badge variant="outline" className="uppercase text-[10px]">{editEventType}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        <div>
                          <Label className="text-xs">Category / Event Type *</Label>
                          <select
                            className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                            value={editEventType}
                            onChange={(e) => setEditEventType(e.target.value as any)}
                          >
                            <option value="cne">CNE (Continuing Nursing Education)</option>
                            <option value="cme">CME (Continuing Medical Education)</option>
                            <option value="cpd_general">CPD (General Interprofessional)</option>
                            <option value="grand_rounds">Grand Rounds</option>
                            <option value="journal_club">Journal Club / Audit</option>
                            <option value="workshop">Skills Workshop</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Approving Council</Label>
                          <select
                            className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                            value={editApprovingCouncil}
                            onChange={(e) => setEditApprovingCouncil(e.target.value)}
                          >
                            <option value="NCK">NCK (Nursing Council of Kenya)</option>
                            <option value="KMPDC">KMPDC (Medical Council)</option>
                            <option value="COC">COC (Clinical Officers Council)</option>
                            <option value="Other">Other / Custom</option>
                            <option value="None">None / Not Approved</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">CPD Points</Label>
                          <Input
                            type="number"
                            step="0.5"
                            className="h-8 text-xs"
                            value={editCpdPoints}
                            onChange={(e) => setEditCpdPoints(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="relative">
                          <Label className="text-xs">
                            Presenter Name {editPresenterUserId && <UserCheck className="inline h-3 w-3 text-emerald-600 ml-1" />}
                          </Label>
                          <Input
                            className="h-8 text-xs"
                            placeholder="Type to search..."
                            value={editPresenterName}
                            onChange={(e) => {
                              setEditPresenterName(e.target.value);
                              setEditPresenterUserId(null);
                              setShowEditPresenterSuggestions(true);
                            }}
                            onFocus={() => setShowEditPresenterSuggestions(true)}
                          />
                          {showEditPresenterSuggestions && editPresenterSearchQuery.data && editPresenterSearchQuery.data.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md max-h-48 overflow-auto">
                              {editPresenterSearchQuery.data.map((user) => (
                                <div
                                  key={user.id}
                                  className="cursor-pointer rounded-sm px-2 py-1 text-[11px] hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                                  onClick={() => {
                                    setEditPresenterUserId(user.id);
                                    setEditPresenterName(user.fullName);
                                    setPresenterCadreFromUser(user.cadre, user.cadreOther, true);
                                    if (user.department) setEditPresenterDept(user.department);
                                    setShowEditPresenterSuggestions(false);
                                  }}
                                >
                                  <div>
                                    <span className="font-semibold">{user.fullName}</span>
                                    <span className="text-muted-foreground ml-1">({user.email})</span>
                                  </div>
                                  {user.cadre && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {user.cadre === "Other" ? user.cadreOther || "Other" : (user.cadreOther ? `${user.cadre} - ${user.cadreOther}` : user.cadre)}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Presenter Cadre</Label>
                          <CadreProgressiveSelector
                            value={editPresenterCadre}
                            onChange={setEditPresenterCadre}
                            cadreOtherValue={editPresenterCustomOther}
                            onCadreOtherChange={setEditPresenterCustomOther}
                            subSpecialtyValue={editPresenterSubSpecialty}
                            onSubSpecialtyChange={setEditPresenterSubSpecialty}
                          />
                        </div>
                        <div className="sm:col-span-2 md:col-span-3">
                          <DepartmentSelectors
                            value={editPresenterDept}
                            onChange={setEditPresenterDept}
                            labelSize="xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingEventId(null)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const isOtherCadre = ["Other Staff", "Other Intern", "Other Student"].includes(editPresenterCadre);
                            const finalEditPresenterCadreOther = isOtherCadre ? editPresenterCustomOther : (editPresenterSubSpecialty === "Other" ? editPresenterCustomOther : editPresenterSubSpecialty);

                            updateEventPresenterMutation.mutate({
                              institutionId,
                              eventId: editingEventId,
                              eventType: editEventType,
                              presenterUserId: editPresenterUserId,
                              presenterName: editPresenterName.trim() || null,
                              presenterCadre: editPresenterCadre.trim() || null,
                              presenterCadreOther: finalEditPresenterCadreOther.trim() || null,
                              presenterDepartment: editPresenterDept.trim() || null,
                              cpdPoints: editCpdPoints.trim() ? Number(editCpdPoints) : null,
                              approvingCouncil: editApprovingCouncil === "None" ? null : editApprovingCouncil,
                            });
                          }}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* --- OPEN NEW SESSION TAB --- */}
        {!compact && cpdSubTab === "new_session" && (
          <Card>
            <CardHeader>
              <CardTitle>Open CPD Event</CardTitle>
              <CardDescription>
                Configure CNE/CME classification, presenter attributes, and points for upcoming or live sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <Label htmlFor="cpd-event-name">Event title *</Label>
                  <Input
                    id="cpd-event-name"
                    placeholder="e.g. Pediatric Shock & Fluid Resuscitation"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cpd-event-date">Event date *</Label>
                  <Input
                    id="cpd-event-date"
                    placeholder="e.g. 12 August 2026"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cpd-event-type">Category / Type *</Label>
                  <select
                    id="cpd-event-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                  >
                    <option value="cne">CNE (Continuing Nursing Education)</option>
                    <option value="cme">CME (Continuing Medical Education)</option>
                    <option value="cpd_general">CPD (General Interprofessional)</option>
                    <option value="grand_rounds">Grand Rounds</option>
                    <option value="journal_club">Journal Club / Audit</option>
                    <option value="workshop">Skills Workshop</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="relative">
                  <Label htmlFor="cpd-presenter-name">
                    Presenter Name {presenterUserId && <UserCheck className="inline h-3.5 w-3.5 text-emerald-600 ml-1" />}
                  </Label>
                  <Input
                    id="cpd-presenter-name"
                    placeholder="Type name to search platform clinicians..."
                    value={presenterName}
                    onChange={(e) => {
                      setPresenterName(e.target.value);
                      setPresenterUserId(null);
                      setShowPresenterSuggestions(true);
                    }}
                    onFocus={() => setShowPresenterSuggestions(true)}
                  />
                  {showPresenterSuggestions && presenterSearchQuery.data && presenterSearchQuery.data.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md max-h-48 overflow-auto">
                      {presenterSearchQuery.data.map((user) => (
                        <div
                          key={user.id}
                          className="cursor-pointer rounded-sm px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                          onClick={() => {
                            setPresenterUserId(user.id);
                            setPresenterName(user.fullName);
                            setPresenterCadreFromUser(user.cadre, user.cadreOther, false);
                            if (user.department) setPresenterDepartment(user.department);
                            setShowPresenterSuggestions(false);
                          }}
                        >
                          <div>
                            <span className="font-semibold">{user.fullName}</span>
                            <span className="text-muted-foreground ml-1">({user.email})</span>
                          </div>
                          {user.cadre && (
                            <Badge variant="outline" className="text-[10px]">
                              {user.cadre === "Other" ? user.cadreOther || "Other" : (user.cadreOther ? `${user.cadre} - ${user.cadreOther}` : user.cadre)}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cpd-presenter-cadre">Lead presenter cadre</Label>
                  <Input
                    id="cpd-presenter-cadre"
                    value={presenterCadre || "Select a member to populate"}
                    readOnly
                    aria-readonly="true"
                  />
                </div>
                <div className="sm:col-span-3 space-y-1">
                  <Label htmlFor="cpd-presenter-department">Lead presenter department</Label>
                  <Input
                    id="cpd-presenter-department"
                    value={presenterDepartment || "Select a member to populate"}
                    readOnly
                    aria-readonly="true"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2">
                <div>
                  <Label htmlFor="cpd-approving-council">Approving Council</Label>
                  <select
                    id="cpd-approving-council"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={approvingCouncil}
                    onChange={(e) => setApprovingCouncil(e.target.value)}
                  >
                    <option value="NCK">NCK (Nursing Council of Kenya)</option>
                    <option value="KMPDC">KMPDC (Medical Council)</option>
                    <option value="COC">COC (Clinical Officers Council)</option>
                    <option value="Other">Other / Custom</option>
                    <option value="None">None / Not Approved</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="cpd-points">CPD Points</Label>
                  <Input
                    id="cpd-points"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 2.0"
                    value={cpdPoints}
                    onChange={(e) => setCpdPoints(e.target.value)}
                  />
                </div>
              </div>

              {approvingCouncil === "Other" && (
                <div className="max-w-md">
                  <Label htmlFor="cpd-custom-council">Specify Council Name</Label>
                  <Input
                    id="cpd-custom-council"
                    placeholder="e.g. Pharmacy and Poisons Board"
                    value={customCouncil}
                    onChange={(e) => setCustomCouncil(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => {
                    if (!presenterUserId) {
                      toast.error("Choose the lead presenter from the active institution-member list.");
                      return;
                    }
                    const finalCouncil = approvingCouncil === "None"
                      ? null
                      : approvingCouncil === "Other"
                        ? customCouncil.trim()
                        : approvingCouncil;
                    const pointsNum = cpdPoints.trim() ? Number(cpdPoints) : null;
                    const isOtherCadre = ["Other Staff", "Other Intern", "Other Student"].includes(presenterCadre);
                    const finalPresenterCadreOther = isOtherCadre ? presenterCustomOther : (presenterSubSpecialty === "Other" ? presenterCustomOther : presenterSubSpecialty);

                    openEventMutation.mutate({
                      institutionId,
                      name: newEventName.trim(),
                      eventDate: newEventDate.trim(),
                      eventType,
                      presenterUserId,
                      presenterName: presenterName.trim() || null,
                      presenterCadre: presenterCadre.trim() || null,
                      presenterCadreOther: finalPresenterCadreOther.trim() || null,
                      presenterDepartment: presenterDepartment.trim() || null,
                      approvingCouncil: finalCouncil,
                      cpdPoints: pointsNum,
                    });
                  }}
                  disabled={
                    openEventMutation.isPending ||
                    newEventName.trim().length === 0 ||
                    newEventDate.trim().length === 0 ||
                    !presenterUserId ||
                    (approvingCouncil === "Other" && customCouncil.trim().length === 0)
                  }
                >
                  {openEventMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Open Event
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- COORDINATOR & SETTINGS TAB --- */}
        {!compact && cpdSubTab === "settings" && (
          <Card>
            <CardHeader>
              <CardTitle>CPD Coordinator</CardTitle>
              <CardDescription>
                This name is printed on the signature line of every certificate your institution issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="cpd-coordinator">Coordinator name</Label>
                  <Input
                    id="cpd-coordinator"
                    placeholder="e.g. Job Karue, RN"
                    value={coordinatorValue}
                    onChange={(e) => setCoordinatorName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() =>
                    updateCoordinatorMutation.mutate({
                      institutionId,
                      coordinatorName: coordinatorValue.trim(),
                    })
                  }
                  disabled={
                    updateCoordinatorMutation.isPending || coordinatorValue.trim().length === 0
                  }
                >
                  {updateCoordinatorMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>

              <div className="mt-6 space-y-2 border-t pt-6">
                <div>
                  <Label>Coordinator signature</Label>
                  <p className="text-xs text-muted-foreground">
                    Draw the signature once. It is embedded above the signature line on every certificate.
                  </p>
                </div>
                {settingsQuery.isLoading ? (
                  <div className="flex py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <SignaturePad
                    initialDataUrl={savedSignature}
                    saving={updateSignatureMutation.isPending}
                    onSave={(dataUrl) =>
                      updateSignatureMutation.mutate({ institutionId, signature: dataUrl })
                    }
                    onClear={() => {
                      if (savedSignature) {
                        updateSignatureMutation.mutate({ institutionId, signature: null });
                      }
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registrations for selected event — displayed under active session check-ins in the Sessions tab */}
        {cpdSubTab === "sessions" && effectiveEventId && (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Registrations</CardTitle>
                  <CardDescription>
                    {selectedEvent
                      ? `${selectedEvent.name} — ${attendees.length} registered`
                      : "Select an event to view registrations"}
                  </CardDescription>
                </div>
                {selectedEvent && (
                  <div className="w-full mt-4 p-4 border border-border rounded-lg bg-muted/20 flex flex-col md:flex-row md:items-end gap-3">
                    <div className="flex-1">
                      <Label htmlFor="cpd-code-input" className="text-sm font-medium">
                        Verification Code (CPD Secret Code)
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Setting this enables self-check-in verification logs for your attendees.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          id="cpd-code-input"
                          placeholder="e.g. Ready-Pals"
                          value={cpdCodeInput}
                          onChange={(e) => setCpdCodeInput(e.target.value)}
                          className="max-w-xs font-mono"
                        />
                        <Button
                          onClick={() =>
                            updateCpdCodeMutation.mutate({
                              institutionId,
                              eventId: effectiveEventId,
                              cpdCode: cpdCodeInput.trim(),
                            })
                          }
                          disabled={updateCpdCodeMutation.isPending}
                        >
                          {updateCpdCodeMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Code
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadCsv}
                        disabled={attendees.length === 0}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button
                        size="sm"
                        disabled={!effectiveEventId || attendees.length === 0}
                        onClick={() => {
                          if (effectiveEventId) {
                            window.open(`/api/cpd/certificate/bulk/${effectiveEventId}`, "_blank");
                          }
                        }}
                      >
                        <FileArchive className="mr-2 h-4 w-4" />
                        Download all (ZIP)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {attendeesQuery.isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : attendees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No registrations for this event yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Cadre</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Certificate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendees.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.fullName}</TableCell>
                        <TableCell>
                          {a.cadre === "Other" ? a.cadreOther || "Other" : a.cadre}
                        </TableCell>
                        <TableCell><AttendeeDepartmentCell department={a.department} canonicalDepartmentName={a.canonicalDepartmentName} /></TableCell>
                        <TableCell className="text-xs">{a.email}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(`/api/cpd/certificate/${a.id}`, "_blank")
                            }
                          >
                            <Download className="mr-1 h-3.5 w-3.5" />
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>  {/* end .space-y-6 */}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteTargetEvent !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetEvent(null);
            setDeleteConfirmInput("");
            setDeleteConfirmAttendeesInput("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Permanently Delete CPD Session
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  You are about to permanently delete:{" "}
                  <strong>{deleteTargetEvent?.name}</strong>.
                </p>

                {deleteTargetEvent && deleteTargetEvent.attendeeCount > 0 ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-destructive space-y-2">
                    <p className="font-semibold">⚠️ WARNING: Registered Attendees Detected</p>
                    <p className="text-xs">
                      This session has <strong>{deleteTargetEvent.attendeeCount}</strong> registered attendee(s).
                      Deleting it will permanently invalidate and delete all their attendance records and associated certificates!
                    </p>
                    <p className="text-xs font-semibold">This action cannot be undone.</p>
                  </div>
                ) : (
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-muted-foreground">
                    <p className="font-semibold text-foreground">⚠️ This action is irreversible.</p>
                    <p className="text-xs mt-1">
                      All associated session records, codes, and logs will be permanently removed.
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground" htmlFor="cpd-delete-confirm-input">
                    Type the event name to confirm:
                  </label>
                  <Input
                    id="cpd-delete-confirm-input"
                    placeholder={deleteTargetEvent?.name ?? "Event name"}
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    className="border-destructive/40 focus-visible:ring-destructive text-xs h-8"
                  />
                </div>

                {deleteTargetEvent && deleteTargetEvent.attendeeCount > 0 && (
                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-semibold text-destructive" htmlFor="cpd-delete-super-confirm-input">
                      Type the super-confirm phrase below to authorize deleting attendees:
                    </label>
                    <div className="text-[11px] font-mono bg-destructive/10 text-destructive p-1.5 rounded select-all font-semibold text-center mb-1">
                      DELETE SESSION WITH {deleteTargetEvent.attendeeCount} ATTENDEES
                    </div>
                    <Input
                      id="cpd-delete-super-confirm-input"
                      placeholder={`DELETE SESSION WITH ${deleteTargetEvent.attendeeCount} ATTENDEES`}
                      value={deleteConfirmAttendeesInput}
                      onChange={(e) => setDeleteConfirmAttendeesInput(e.target.value)}
                      className="border-destructive/40 focus-visible:ring-destructive text-xs h-8 font-mono"
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteTargetEvent(null);
              setDeleteConfirmInput("");
              setDeleteConfirmAttendeesInput("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={
                deleteEventMutation.isPending ||
                deleteConfirmInput.trim().toLowerCase() !== (deleteTargetEvent?.name ?? "").trim().toLowerCase() ||
                (deleteTargetEvent !== null && deleteTargetEvent.attendeeCount > 0 &&
                  deleteConfirmAttendeesInput.trim().toLowerCase() !== `delete session with ${deleteTargetEvent.attendeeCount} attendees`)
              }
              onClick={() => {
                if (!deleteTargetEvent) return;
                deleteEventMutation.mutate({
                  institutionId,
                  eventId: deleteTargetEvent.id,
                  confirmName: deleteConfirmInput.trim(),
                  confirmAttendeesPhrase: deleteTargetEvent.attendeeCount > 0 ? deleteConfirmAttendeesInput.trim() : undefined,
                });
              }}
            >
              {deleteEventMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Yes, permanently delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CPD Metrics Drilldown Modal */}
      <Dialog open={drilldownType !== null} onOpenChange={(open) => { if (!open) setDrilldownType(null); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {drilldownType === "sessions" && "Total CPD Sessions"}
              {drilldownType === "registrations" && "CPD Registrations Log"}
              {drilldownType === "points" && "CPD Points Distribution Leaderboard"}
              {drilldownType === "active_depts" && "Active Departments Overview"}
              {drilldownType === "dept_heatmap" && `CPD Activity: ${selectedDrilldownDept}`}
              {drilldownType === "role_engagement" && `CPD Engagement Detail: ${selectedDrilldownRole}`}
            </DialogTitle>
            <DialogDescription>
              {drilldownType === "sessions" && "Detailed list of all CNE, CME, and workshop events conducted at the institution."}
              {drilldownType === "registrations" && "Check-in times and details for all registrations across all CPD sessions."}
              {drilldownType === "points" && "Total points earned by clinical team members from participating in accredited sessions."}
              {drilldownType === "active_depts" && "Breakdown of activity, presentation volume, and check-ins by clinical unit."}
              {drilldownType === "dept_heatmap" && `Specific check-in history and learning events recorded for ${selectedDrilldownDept}.`}
              {drilldownType === "role_engagement" && `Detailed session check-ins for rostered staff members matching the role ${selectedDrilldownRole}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* SESSIONS VIEW */}
            {drilldownType === "sessions" && (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Event Name</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Date</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Type</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Presenter</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Presenter Department</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Points</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Attendees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">No events recorded.</td>
                      </tr>
                    ) : (
                      events.map((e) => (
                        <tr key={e.id} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="p-3 font-medium">{e.name}</td>
                          <td className="p-3 whitespace-nowrap">{e.eventDate ? new Date(e.eventDate).toLocaleDateString() : "—"}</td>
                          <td className="p-3"><Badge variant="outline" className="capitalize">{e.eventType?.replace("_", " ")}</Badge></td>
                          <td className="p-3">{e.presenterName || "Guest / General"}</td>
                          <td className="p-3 text-xs text-muted-foreground">{e.presenterDepartment || "—"}</td>
                          <td className="p-3 text-center font-bold text-indigo-600">{e.cpdPoints}</td>
                          <td className="p-3 text-center">{e.attendeeCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* REGISTRATIONS VIEW */}
            {drilldownType === "registrations" && (
              <div className="space-y-4">
                {allAttendeesQuery.isLoading ? (
                  <div className="flex justify-center py-8 text-muted-foreground items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading registrations...
                  </div>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Attendee Name</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Email</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Cadre</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Department</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Event Attended</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Check-in Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAttendees.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-muted-foreground">No registrations recorded.</td>
                          </tr>
                        ) : (
                          allAttendees.map((a: any) => {
                            const ev = events.find(e => e.id === a.cpdEventId);
                            return (
                              <tr key={a.id} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                <td className="p-3 font-medium">{a.fullName}</td>
                                <td className="p-3 text-xs text-muted-foreground">{a.email}</td>
                                <td className="p-3 text-xs">{a.cadre || "—"}</td>
                                <td className="p-3 text-xs"><AttendeeDepartmentCell department={a.department || "—"} canonicalDepartmentName={a.canonicalDepartmentName} /></td>
                                <td className="p-3 font-medium text-xs">{ev?.name || "Unknown Session"}</td>
                                <td className="p-3 text-xs whitespace-nowrap">{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* POINTS VIEW */}
            {drilldownType === "points" && (
              <div className="space-y-4">
                {allAttendeesQuery.isLoading ? (
                  <div className="flex justify-center py-8 text-muted-foreground items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading points leaderboard...
                  </div>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Attendee Name</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Email</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Cadre</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Department</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Total Sessions</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Total Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const pointsMap = new Map<string, { name: string; email: string; cadre: string; department: string; points: number; count: number }>();
                          for (const a of allAttendees) {
                            const key = a.email.toLowerCase().trim();
                            const ev = events.find(e => e.id === a.cpdEventId);
                            const pts = Number(ev?.cpdPoints ?? 0);
                            if (!pointsMap.has(key)) {
                              pointsMap.set(key, {
                                name: a.fullName,
                                email: a.email,
                                cadre: a.cadre || "Clinician",
                                department: a.canonicalDepartmentName || a.department || "General",
                                points: 0,
                                count: 0
                              });
                            }
                            const item = pointsMap.get(key)!;
                            item.points += pts;
                            item.count += 1;
                          }
                          const pointsRows = Array.from(pointsMap.values()).sort((a, b) => b.points - a.points);
                          if (pointsRows.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="p-6 text-center text-muted-foreground">No points accumulated yet.</td>
                              </tr>
                            );
                          }
                          return pointsRows.map((r, i) => (
                            <tr key={r.email} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                              <td className="p-3 font-medium flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-mono w-4">{i + 1}.</span>
                                {r.name}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground">{r.email}</td>
                              <td className="p-3 text-xs">{r.cadre}</td>
                              <td className="p-3 text-xs">{r.department}</td>
                              <td className="p-3 text-center">{r.count}</td>
                              <td className="p-3 text-center font-bold text-purple-600">{r.points} CPDP</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ACTIVE DEPTS VIEW */}
            {drilldownType === "active_depts" && (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Department</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Sessions Presented</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Check-in Attendances</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.departmentHeatmap.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">No departmental activity logged.</td>
                      </tr>
                    ) : (
                      analytics?.departmentHeatmap.map((d) => (
                        <tr key={d.department} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="p-3 font-medium">{d.department}</td>
                          <td className="p-3 text-center">{d.presentedCount}</td>
                          <td className="p-3 text-center">{d.attendedCount}</td>
                          <td className="p-3 text-center">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs h-7"
                              onClick={() => {
                                setSelectedDrilldownDept(d.department);
                                setDrilldownType("dept_heatmap");
                              }}
                            >
                              View Check-ins
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* DEPT HEATMAP (SPECIFIC DEPARTMENT CHECK-INS) */}
            {drilldownType === "dept_heatmap" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setSelectedDrilldownDept(null);
                      setDrilldownType("active_depts");
                    }}
                    className="text-xs"
                  >
                    ← Back to Departments
                  </Button>
                </div>
                {allAttendeesQuery.isLoading ? (
                  <div className="flex justify-center py-8 text-muted-foreground items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading department check-ins...
                  </div>
                ) : (
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Attendee Name</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Email</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Cadre</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Event Name</th>
                          <th className="p-3 font-semibold text-xs uppercase tracking-wider">Check-in Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const filtered = allAttendees.filter((a: any) => (a.canonicalDepartmentName || a.department) === selectedDrilldownDept);
                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-muted-foreground">No check-ins logged for this department.</td>
                              </tr>
                            );
                          }
                          return filtered.map((a: any) => {
                            const ev = events.find(e => e.id === a.cpdEventId);
                            return (
                              <tr key={a.id} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                <td className="p-3 font-medium">{a.fullName}</td>
                                <td className="p-3 text-xs text-muted-foreground">{a.email}</td>
                                <td className="p-3 text-xs">{a.cadre || "—"}</td>
                                <td className="p-3 text-xs">{ev?.name || "Unknown Session"}</td>
                                <td className="p-3 text-xs whitespace-nowrap">{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ROLE ENGAGEMENT VIEW */}
            {drilldownType === "role_engagement" && (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Staff Member Name</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Email</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Department</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">CNE Attended</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">CME Attended</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Total CPD Attended</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Last Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filtered = (analytics?.staffMatrix ?? []).filter((s: any) => s.cadre === selectedDrilldownRole);
                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-muted-foreground">No staff members logged under this designation.</td>
                          </tr>
                        );
                      }
                      return filtered.map((s: any) => (
                        <tr key={s.email} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="p-3 font-medium">{s.fullName}</td>
                          <td className="p-3 text-xs text-muted-foreground">{s.email}</td>
                          <td className="p-3 text-xs">{s.department || "—"}</td>
                          <td className="p-3 text-center">{s.cneAttended}</td>
                          <td className="p-3 text-center">{s.cmeAttended}</td>
                          <td className="p-3 text-center font-semibold">{s.totalAttended}</td>
                          <td className="p-3 text-xs whitespace-nowrap">{s.lastSignIn ? new Date(s.lastSignIn).toLocaleDateString() : "Never"}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
