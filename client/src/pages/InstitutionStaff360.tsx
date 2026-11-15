import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Filter,
  GraduationCap,
  Loader2,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const date = (value: string | Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value))
    : "Not recorded";
const status = (value: string | null | undefined) => value?.replaceAll("_", " ") || "Not recorded";
function Item({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm capitalize">{String(value || "Not recorded")}</p>
    </div>
  );
}
function appointmentLabel(value: { role: "primary" | "deputy"; status: string } | null | undefined) {
  if (!value) return "No active departmental appointment";
  return `${value.role === "primary" ? "Primary Departmental Head" : "Deputy Departmental Head"} · ${value.status === "pending_acceptance" ? "Acceptance pending" : status(value.status)}`;
}
type DirectoryFilter = "all" | "attention" | "unlinked" | "incomplete";

export default function InstitutionStaff360() {
  const [, params] = useRoute("/institution/staff/:userId");
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const legacyUserId = Number(params?.userId || 0);
  const initialUserId = Number(searchParams?.get("staffId") || legacyUserId || 0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<DirectoryFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);
  const [reviewField, setReviewField] = useState<"identity" | "department" | "membership" | "role" | "training" | "credential" | "cpd" | "quality_signal">("department");
  const [reviewReason, setReviewReason] = useState("");
  const detailRef = useRef<HTMLElement | null>(null);
  const institutionId = Number(searchParams?.get("institutionId") || 0);
  const fallback = trpc.institution.getMyInstitution.useQuery(undefined, { enabled: !institutionId });
  const selectedInstitutionId = institutionId || fallback.data?.institution?.id || 0;
  const directory = trpc.institutionStaff360.getDirectory.useQuery(
    { institutionId: selectedInstitutionId, search: debouncedSearch.trim() || undefined, page },
    { enabled: selectedInstitutionId > 0, staleTime: 15_000 }
  );
  const profile = trpc.institutionStaff360.getProfile.useQuery(
    { institutionId: selectedInstitutionId, userId: selectedUserId },
    { enabled: selectedInstitutionId > 0 && selectedUserId > 0, staleTime: 15_000 }
  );
  const detail = profile.data;
  const requestReview = trpc.institutionStaff360.requestReview.useMutation({ onSuccess: () => setReviewReason("") });
  const rows = useMemo(() => {
    const source = directory.data?.rows ?? [];
    return source.filter(row => {
      if (filter === "unlinked") return !row.userId;
      if (filter === "incomplete") return row.enrollmentStatus === "pending" || row.enrollmentStatus === "in_progress" || (row.certificationStatus != null && row.certificationStatus !== "certified");
      if (filter === "attention") return !row.userId || row.facilityLinkStatus !== "linked" || row.enrollmentStatus === "pending" || row.enrollmentStatus === "in_progress" || (row.certificationStatus != null && row.certificationStatus !== "certified");
      return true;
    });
  }, [directory.data?.rows, filter]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter, selectedInstitutionId]);

  useEffect(() => {
    if (typeof window === "undefined" || selectedInstitutionId <= 0) return;
    const next = new URLSearchParams(window.location.search);
    if (selectedUserId > 0) next.set("staffId", String(selectedUserId));
    else next.delete("staffId");
    window.history.replaceState(null, "", `${window.location.pathname}?${next.toString()}`);
  }, [selectedInstitutionId, selectedUserId]);

  useEffect(() => {
    if (selectedUserId <= 0 || typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1279px)").matches) {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [selectedUserId]);

  const selectPerson = (userId: number) => {
    if (!userId) return;
    setSelectedUserId(userId);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Button variant="ghost" className="mb-2 px-0" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back to People & access
            </Button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Institution Administration · People & access</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Staff directory & Staff 360</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Find a staff member, understand what needs attention, and open the institution-scoped operational file without losing your search context.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">Authorised institutional view</Badge>
        </header>

        <div className="grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <Card className="xl:sticky xl:top-4 xl:h-[calc(100vh-8rem)] xl:overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base"><Search className="h-5 w-5 text-teal-700" />Find a staff member</CardTitle>
              <CardDescription>Search within your authorised institution or department scope.</CardDescription>
              <Input className="mt-2" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email or department" aria-label="Search staff" />
              <div className="mt-3 flex flex-wrap gap-2" aria-label="Staff filters">
                <Filter className="mt-1 h-4 w-4 text-muted-foreground" />
                {(["all", "attention", "unlinked", "incomplete"] as DirectoryFilter[]).map(value => (
                  <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>
                    {value === "all" ? "All active" : value === "attention" ? "Needs attention" : value === "unlinked" ? "Unlinked" : "Incomplete training"}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto p-3 xl:h-[calc(100%-13rem)]">
              {directory.data?.total ? <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">Showing page {directory.data.page} of {Math.max(1, Math.ceil(directory.data.total / directory.data.pageSize))} · {directory.data.total} active staff records.</div> : null}
              {directory.isLoading ? <div className="py-8 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading staff directory…</div> : directory.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">This directory is not available to your current institutional role.</div> : rows.map(row => {
                const selected = row.userId === selectedUserId;
                const needsAttention = !row.userId || row.facilityLinkStatus !== "linked" || row.enrollmentStatus === "pending" || row.enrollmentStatus === "in_progress" || (row.certificationStatus != null && row.certificationStatus !== "certified");
                return <button key={row.staffMemberId} type="button" onClick={() => selectPerson(row.userId ?? 0)} disabled={!row.userId} aria-current={selected ? "true" : undefined} className={`w-full rounded-xl border p-3 text-left transition ${selected ? "border-teal-500 bg-teal-50 ring-2 ring-teal-100" : "hover:border-teal-300 hover:bg-teal-50"} ${!row.userId ? "cursor-not-allowed opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold">{row.name}</p><p className="truncate text-xs text-muted-foreground">{row.email}</p></div><Badge variant={row.userId ? "default" : "outline"}>{row.userId ? "Linked" : "Unlinked"}</Badge></div>
                  <div className="mt-2 flex items-center justify-between gap-2"><p className="truncate text-xs text-muted-foreground">{row.department || "Department not recorded"} · {status(row.staffRole)}</p>{needsAttention ? <AlertTriangle className="h-4 w-4 shrink-0 text-orange-600" aria-label="Needs attention" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="No listed attention item" />}</div>
                  {row.userId ? <p className="mt-2 flex items-center text-xs font-medium text-teal-700">Open Staff 360 <ChevronRight className="ml-1 h-3.5 w-3.5" /></p> : null}
                </button>;
              })}
              {!directory.isLoading && !directory.error && rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No staff matched this search and filter.</p> : null}
              {!directory.isLoading && !directory.error && directory.data && directory.data.total > directory.data.pageSize ? <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3"><Button type="button" size="sm" variant="outline" disabled={!directory.data.hasPrevious} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</Button><span className="text-xs text-muted-foreground">Page {directory.data.page}</span><Button type="button" size="sm" variant="outline" disabled={!directory.data.hasNext} onClick={() => setPage(current => current + 1)}>Next</Button></div> : null}
            </CardContent>
          </Card>

          <main id="staff-360-detail" ref={detailRef} className="min-w-0 scroll-mt-4 space-y-5">
            {!selectedUserId ? <Card className="border-teal-200 bg-gradient-to-br from-teal-50 via-white to-orange-50"><CardContent className="flex min-h-[28rem] flex-col items-center justify-center p-8 text-center"><UserRound className="mb-4 h-12 w-12 text-teal-700" /><h2 className="text-xl font-bold text-slate-950">Select a staff member</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Search the directory, choose a person, and their Staff 360 record will open here. Your search and filters will stay in place.</p></CardContent></Card> : profile.isLoading ? <Card><CardContent className="flex min-h-80 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading Staff 360…</CardContent></Card> : profile.error || !detail ? <Card className="border-red-200 bg-red-50"><CardContent className="p-5 text-sm text-red-800">This record is unavailable or outside your authorised scope. Return to the directory and choose another linked staff member.</CardContent></Card> : <>
              <Card className="overflow-hidden border-teal-200"><div className="border-b bg-gradient-to-r from-teal-50 via-white to-orange-50 p-5"><div className="flex flex-col justify-between gap-4 lg:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold">{detail.user.name || detail.staff.staffName}</h2><Badge>Membership: {status(detail.memberships[0]?.membershipStatus)}</Badge>{detail.departmentalAppointment ? <Badge variant="secondary">{appointmentLabel(detail.departmentalAppointment)}</Badge> : null}<Badge variant="outline">Scope: {detail.scope.institutionWide ? "Institution-wide" : "Department-scoped"}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{detail.institution?.companyName || "Institution"} · {detail.department?.name || detail.staff.department || "Department not recorded"}</p><p className="mt-1 text-sm">{detail.user.email || detail.staff.staffEmail} · {detail.user.phone || detail.staff.staffPhone || "No phone recorded"}</p></div><div className="rounded-xl border border-orange-200 bg-white/80 p-3 text-xs text-muted-foreground"><p className="font-semibold text-orange-800">This is an operational record</p><p className="mt-1 max-w-xs">Training, attendance, certificates and assignments are evidence states, not proof of competence or clinical performance.</p></div></div></div><CardContent className="grid gap-3 p-4 sm:grid-cols-4"><div className="rounded-xl border border-teal-200 bg-teal-50 p-3"><p className="text-2xl font-bold">{status(detail.staff.facilityLinkStatus)}</p><p className="text-xs">Institution link</p></div><div className="rounded-xl border p-3"><p className="text-2xl font-bold">{status(detail.staff.enrollmentStatus)}</p><p className="text-xs">Training status</p></div><div className="rounded-xl border p-3"><p className="text-2xl font-bold">{status(detail.staff.certificationStatus)}</p><p className="text-xs">Institutional evidence</p></div><div className="rounded-xl border border-orange-200 bg-orange-50 p-3"><p className="text-2xl font-bold">{detail.actions.length}</p><p className="text-xs">Open actions</p></div></CardContent></Card>
              {detail.actions.length > 0 ? <Card className="border-orange-200 bg-orange-50/60"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5 text-orange-700" />What needs attention?</CardTitle><CardDescription>Use these items to decide the next institutional follow-up. They are not clinical or professional judgements.</CardDescription></CardHeader><CardContent className="grid gap-2 md:grid-cols-2">{detail.actions.map(action => <div key={action.key} className="rounded-lg border border-orange-200 bg-white p-3"><div className="flex justify-between gap-2"><p className="font-semibold">{action.label}</p><Badge variant={action.severity === "high" ? "destructive" : "secondary"}>{action.severity}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{action.detail}</p></div>)}</CardContent></Card> : <Card className="border-emerald-200 bg-emerald-50"><CardContent className="flex items-center gap-3 p-4 text-sm text-emerald-900"><CheckCircle2 className="h-5 w-5" />No open institutional follow-up actions are recorded for this person.</CardContent></Card>}
              <div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-5 w-5 text-teal-700" />Identity and institutional role</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Item label="Staff category" value={detail.user.cadreOther || detail.user.cadre || detail.user.providerType || detail.staff.staffRole} /><Item label="Designation" value={detail.staff.designation} /><Item label="Departmental appointment" value={appointmentLabel(detail.departmentalAppointment)} /><Item label="Department" value={detail.department?.name || detail.staff.department} /><Item label="Years of experience" value={detail.staff.yearsOfExperience} /><Item label="Profile updated" value={date(detail.user.updatedAt)} /></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-teal-700" />Membership and responsibilities</CardTitle><CardDescription>Membership responsibility and departmental appointments are separate records.</CardDescription></CardHeader><CardContent className="space-y-3">{detail.memberships.map(row => <div key={row.id} className="rounded-lg border p-3"><div className="flex justify-between gap-2"><Badge>{status(row.membershipStatus)}</Badge><Badge variant="outline">{status(row.responsibilityRole)}</Badge></div><div className="mt-3 grid gap-3 sm:grid-cols-3"><Item label="Invited" value={date(row.invitedAt)} /><Item label="Accepted" value={date(row.acceptedAt)} /><Item label="Ended" value={date(row.endedAt)} /></div></div>)}{detail.roles.length > 0 ? <div className="border-t pt-3"><p className="mb-2 text-sm font-semibold">Product roles</p>{detail.roles.map((role, index) => <div key={`${role.productKey}-${role.roleKey}-${index}`} className="flex justify-between border-b py-2 text-sm"><span>{role.productName} · {status(role.roleKey)}</span><Badge variant="outline">{status(role.roleStatus)}</Badge></div>)}</div> : <p className="text-sm text-muted-foreground">No product roles recorded.</p>}</CardContent></Card></div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-teal-700" />Responsibilities and assigned duties</CardTitle>
                  <CardDescription>Standing appointments, product permissions, and dated duties are separate evidence records. None is proof of competence, licence validity, or clinical dispatch authority.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <section aria-labelledby="staff360-standing-appointments"><h3 id="staff360-standing-appointments" className="text-sm font-semibold">Standing appointments</h3>{detail.responsibilities.standingAppointments.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No standing appointment is recorded for this person in the selected institution.</p> : <div className="mt-2 grid gap-2 md:grid-cols-2">{detail.responsibilities.standingAppointments.map((appointment, index) => <div key={`${appointment.kind}-${appointment.sourceId ?? "none"}-${index}`} className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium capitalize">{appointment.kind.replaceAll("_", " ")}</p><Badge variant={appointment.status === "active" ? "default" : appointment.status === "pending_acceptance" ? "secondary" : "outline"}>{status(appointment.status)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{appointment.scope === "department" ? appointment.departmentLabel || "Department not recorded" : "Institution-wide"} · Source: {appointment.source.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-muted-foreground">Assigned {date(appointment.assignedAt)} · Accepted {date(appointment.acceptedAt)}</p></div>)}</div>}</section>
                  <section aria-labelledby="staff360-product-roles"><h3 id="staff360-product-roles" className="text-sm font-semibold">Product permissions</h3>{detail.responsibilities.productRoles.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No product permission is recorded for this person.</p> : <div className="mt-2 grid gap-2 md:grid-cols-2">{detail.responsibilities.productRoles.map((role, index) => <div key={`${role.productKey}-${role.roleKey}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{role.label}</p><p className="text-xs text-muted-foreground">{role.productKey}</p></div><Badge variant={role.status === "active" ? "default" : "outline"}>{status(role.status)}</Badge></div>)}</div>}</section>
                  <section aria-labelledby="staff360-dated-duties"><h3 id="staff360-dated-duties" className="text-sm font-semibold">Dated IERS duties</h3>{detail.responsibilities.datedDuties.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No current or recent dated IERS duty is recorded for this person.</p> : <div className="mt-2 space-y-2">{detail.responsibilities.datedDuties.map(duty => <div key={`${duty.roleScope}-${duty.assignmentId}`} className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium uppercase">{duty.roleKey}</p><Badge variant={duty.assignmentStatus === "accepted" || duty.assignmentStatus === "active" ? "default" : "outline"}>{status(duty.assignmentStatus)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{duty.departmentLabel || "Department not recorded"} · {date(duty.effectiveFrom)} to {date(duty.effectiveUntil)}{duty.shiftType ? ` · ${duty.shiftType}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">Accepted {date(duty.acceptedAt)}</p></div>)}</div>}</section>
                </CardContent>
              </Card>
              <Card className="border-teal-200 bg-teal-50/40"><CardHeader><CardTitle className="text-base">Request a record review</CardTitle><CardDescription>If a field is wrong or incomplete, create a reasoned institution-scoped review request. This does not silently change source data.</CardDescription></CardHeader><CardContent className="space-y-3"><label className="block text-sm font-medium">Area<select className="mt-1 block h-10 w-full rounded-md border bg-background px-3" value={reviewField} onChange={event => setReviewField(event.target.value as typeof reviewField)}><option value="identity">Identity</option><option value="department">Department</option><option value="membership">Membership</option><option value="role">Role or appointment</option><option value="training">Training</option><option value="credential">Licence or credential</option><option value="cpd">CPD record</option><option value="quality_signal">Quality-improvement record</option></select></label><label className="block text-sm font-medium">Reason<textarea className="mt-1 min-h-24 w-full rounded-md border bg-background p-2 text-sm" value={reviewReason} onChange={event => setReviewReason(event.target.value)} placeholder="Explain what should be reviewed and the evidence available." /></label><Button type="button" size="sm" disabled={!detail || reviewReason.trim().length < 10 || requestReview.isPending} onClick={() => detail && requestReview.mutate({ institutionId: selectedInstitutionId, userId: selectedUserId, field: reviewField, reason: reviewReason.trim() })}>{requestReview.isPending ? "Submitting…" : requestReview.isSuccess ? "Review requested" : "Request review"}</Button>{requestReview.error ? <p className="text-sm text-red-700">{requestReview.error.message}</p> : <p className="text-xs text-muted-foreground">Requests are deduplicated while open and routed through the institutional action log.</p>}</CardContent></Card>
              <div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-5 w-5 text-teal-700" />Training and evidence</CardTitle><CardDescription>Course-level status first; supporting evidence remains institution-scoped.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Item label="Enrolment status" value={detail.staff.enrollmentStatus} /><Item label="Learning phase" value={detail.staff.phaseStatus} /><Item label="Certification status" value={detail.staff.certificationStatus} /><Item label="Certification date" value={date(detail.staff.certificationDate)} /><Item label="Certification expiry" value={date(detail.staff.certificationExpiryDate)} /><Item label="Completion date" value={date(detail.staff.completionDate)} /></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-teal-700" />Professional licence and life support</CardTitle><CardDescription>Dates and evidence completeness are shown separately; these are not clinical-readiness judgements.</CardDescription></CardHeader><CardContent className="space-y-2">{detail.sourceStatus.professionalCredentials === "unavailable" ? <p className="text-sm text-orange-800">Credential evidence is temporarily unavailable. No conclusion about this person’s status should be drawn from this section.</p> : detail.professionalCredentials.length === 0 ? <p className="text-sm text-muted-foreground">No professional credentials are recorded.</p> : detail.professionalCredentials.map(credential => <div key={credential.id} className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{credential.credentialType.replaceAll("_", " ")}</p><Badge variant={credential.status === "verified" ? "default" : "outline"}>{status(credential.status)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{credential.issuer}{credential.jurisdiction ? ` · ${credential.jurisdiction}` : ""} · expires {date(credential.expiresAt)}</p><p className="mt-1 text-xs text-muted-foreground">Evidence: {credential.hasEvidence ? "uploaded" : "not uploaded"}</p></div>)}</CardContent></Card></div>
              <div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5 text-teal-700" />Recorded CPD activity</CardTitle><CardDescription>Institution-linked attendance, presented sessions, and co-presented sessions are separate counts.</CardDescription></CardHeader><CardContent className="space-y-3">{detail.sourceStatus.cpdPresented === "unavailable" || detail.sourceStatus.cpdCoPresented === "unavailable" ? <p className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">Presentation history is temporarily unavailable. Attendance below is not affected.</p> : null}<div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-lg border p-2"><p className="text-xl font-bold">{detail.cpd.length}</p><p className="text-xs text-muted-foreground">Attended</p></div><div className="rounded-lg border p-2"><p className="text-xl font-bold">{detail.cpdPresented.length}</p><p className="text-xs text-muted-foreground">Presented</p></div><div className="rounded-lg border p-2"><p className="text-xl font-bold">{detail.cpdCoPresented.length}</p><p className="text-xs text-muted-foreground">Co-presented</p></div></div>{detail.cpd.length === 0 ? <p className="text-sm text-muted-foreground">No institution-linked CPD attendance found.</p> : detail.cpd.slice(0, 5).map(row => <div key={row.attendeeId} className="rounded-lg border p-3"><div className="flex justify-between gap-2"><p className="font-semibold">{row.eventName}</p><Badge variant={row.attendanceStatus === "attendance_verified" ? "default" : "outline"}>{status(row.attendanceStatus)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{date(row.eventDateAt || row.eventDate)} · {row.cpdPoints || "0"} CPD points</p></div>)}</CardContent></Card></div>
              <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5 text-teal-700" />Quality-improvement participation</CardTitle><CardDescription>Source-linked participation and assigned follow-up only. This is not a clinical performance rating.</CardDescription></CardHeader><CardContent>{detail.qualitySignalSourceStatus === "unavailable" ? <p className="text-sm text-orange-800">Quality-improvement data is temporarily unavailable. No conclusion should be drawn from this section.</p> : <div className="grid gap-4 md:grid-cols-3"><div className="rounded-lg border p-3"><p className="text-2xl font-bold">{detail.qualitySignals.reports.length}</p><p className="text-xs text-muted-foreground">QI reports submitted</p></div><div className="rounded-lg border p-3"><p className="text-2xl font-bold">{detail.qualitySignals.reports.filter(report => report.reportType === "care_signal").length}</p><p className="text-xs text-muted-foreground">Care Signal-linked</p></div><div className="rounded-lg border p-3"><p className="text-2xl font-bold">{detail.qualitySignals.reports.filter(report => report.reportType === "code_signal").length}</p><p className="text-xs text-muted-foreground">Code Signal-linked</p></div><div className="rounded-lg border p-3 md:col-span-3"><p className="font-semibold">Owned QI actions: {detail.qualitySignals.ownedActions.length}</p><p className="mt-1 text-xs text-muted-foreground">{detail.qualitySignals.ownedActions.filter(action => action.status !== "completed" && action.status !== "cancelled").length} remain open or in progress. Assignment is an operational follow-up signal, not a competence judgement.</p></div></div>}</CardContent></Card>
              <p className="text-xs leading-5 text-muted-foreground">Generated {date(detail.generatedAt)}. Access is institution-scoped and logged. Excluded: {detail.excluded.join(", ")}.</p>
            </>}
          </main>
        </div>
      </div>
    </div>
  );
}
