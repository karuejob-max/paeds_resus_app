import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Award,
  Building2,
  Clock3,
  CreditCard,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "Not recorded";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatMoney(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "Not recorded";
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(cents / 100);
}

function statusVariant(status: string | null | undefined): "default" | "secondary" | "outline" | "destructive" {
  if (["active", "completed", "certified", "attendance_verified", "linked"].includes(status ?? "")) return "default";
  if (["expired", "failed", "cancelled", "ended", "suspended", "pending"].includes(status ?? "")) return "destructive";
  return "secondary";
}

function LabelValue({ label, value }: { label: string; value: ReactNode }) {
  return <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 text-sm text-slate-900">{value || "Not recorded"}</p></div>;
}

function Metric({ label, value, tone = "teal" }: { label: string; value: number; tone?: "teal" | "orange" | "slate" }) {
  const classes = tone === "orange" ? "border-orange-200 bg-orange-50 text-orange-900" : tone === "slate" ? "border-slate-200 bg-slate-50 text-slate-900" : "border-teal-200 bg-teal-50 text-teal-900";
  return <div className={`rounded-xl border p-3 ${classes}`}><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs font-medium opacity-80">{label}</p></div>;
}

export default function AdminUser360() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const value = Number(new URLSearchParams(window.location.search).get("userId"));
    return Number.isInteger(value) && value > 0 ? value : null;
  });
  const usersQuery = trpc.adminStats.getUsers.useQuery({ search: search.trim() || undefined, limit: 100, offset: 0 }, { staleTime: 15_000 });
  const detailQuery = trpc.adminStats.getUser360.useQuery({ userId: selectedId ?? 0 }, { enabled: selectedId !== null, staleTime: 15_000 });
  const users = usersQuery.data?.users ?? [];
  useEffect(() => {
    if (selectedId === null && users.length > 0) setSelectedId(users[0].id);
  }, [selectedId, users]);

  const detail = detailQuery.data;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">People & access</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Platform Admin User 360</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">A read-only institutional file for each platform user. See identity, institution links, learning evidence, certificates, payments, CPD participation, and workflow attention without treating any single record as proof of competence or licensure.</p>
        </header>

        <div className="grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <Card className="border-slate-200 bg-white xl:sticky xl:top-4 xl:h-[calc(100vh-8rem)] xl:overflow-hidden">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base"><UsersRound className="h-5 w-5 text-teal-700" />User directory</CardTitle>
              <CardDescription>Search by name or email. Select a person to open their institutional file.</CardDescription>
              <div className="relative pt-2"><Search className="absolute left-3 top-4 h-4 w-4 text-slate-400" /><Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name or email" /></div>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto p-3 xl:h-[calc(100%-10rem)]">
              {usersQuery.isLoading ? <div className="flex items-center justify-center py-10 text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading users…</div> : usersQuery.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">The user directory could not be loaded. Refresh and try again.</div> : users.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">No users matched this search.</div> : users.map(user => <button key={user.id} type="button" onClick={() => setSelectedId(user.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === user.id ? "border-teal-500 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50"}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold text-slate-950">{user.name || "Unnamed user"}</p><p className="truncate text-xs text-slate-500">{user.email || "No email"}</p></div><Badge variant={user.userType === "institutional" ? "default" : "secondary"}>{user.userType}</Badge></div><p className="mt-2 text-xs text-slate-500">ID {user.id} · Joined {formatDate(user.createdAt)}</p></button>)}
            </CardContent>
          </Card>

          <main className="space-y-5">
            {!selectedId ? <Card className="border-dashed border-slate-300 bg-white"><CardContent className="flex min-h-80 flex-col items-center justify-center text-center"><UserRound className="h-10 w-10 text-slate-300" /><h2 className="mt-3 text-lg font-semibold text-slate-900">Select a user</h2><p className="mt-1 max-w-md text-sm text-slate-500">The selected person’s institutional file will appear here. Restricted clinical narratives and credentials are deliberately excluded from this V1 view.</p></CardContent></Card> : detailQuery.isLoading ? <Card><CardContent className="flex min-h-80 items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading institutional file…</CardContent></Card> : detailQuery.error || !detail ? <Card className="border-red-200 bg-red-50"><CardContent className="p-5 text-sm text-red-800">This user file could not be loaded. The directory record remains unchanged.</CardContent></Card> : <>
              <Card className="overflow-hidden border-teal-200 bg-white">
                <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50 via-white to-orange-50 p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold text-slate-950">{detail.user.name || "Unnamed user"}</h2><Badge variant={detail.user.role === "admin" ? "default" : "secondary"}>{detail.user.role}</Badge><Badge variant={detail.user.userType === "institutional" ? "default" : "outline"}>{detail.user.userType}</Badge></div><p className="mt-1 text-sm text-slate-600">User ID {detail.user.id} · Last signed in {formatDate(detail.user.lastSignedIn)}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700"><span className="inline-flex items-center gap-1"><Mail className="h-4 w-4 text-teal-700" />{detail.user.email || "No email"}</span><span className="inline-flex items-center gap-1"><Phone className="h-4 w-4 text-teal-700" />{detail.user.phone || "No phone"}</span></div></div><div className="rounded-xl border border-orange-200 bg-white/80 p-3 text-xs text-slate-600"><p className="font-semibold text-orange-800">Evidence boundary</p><p className="mt-1 max-w-xs">{detail.sourceBoundary}</p></div></div></div>
                <CardContent className="grid gap-3 p-4 sm:grid-cols-4"><Metric label="Active institutions" value={detail.summary.activeInstitutionCount} /><Metric label="Active enrolments" value={detail.summary.activeEnrolmentCount} /><Metric label="Current certificates" value={detail.summary.currentCertificateCount} /><Metric label="Attention items" value={detail.summary.attentionCount} tone={detail.summary.attentionCount ? "orange" : "teal"} /></CardContent>
              </Card>

              {detail.attention.length > 0 && <Card className="border-orange-200 bg-orange-50/60"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base text-orange-950"><AlertTriangle className="h-5 w-5 text-orange-700" />Attention required</CardTitle><CardDescription className="text-orange-900/70">Workflow signals only. They require review; they are not clinical, professional, or fraud judgements.</CardDescription></CardHeader><CardContent className="grid gap-2 md:grid-cols-2">{detail.attention.map(item => <div key={item.key} className="rounded-lg border border-orange-200 bg-white p-3"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-slate-900">{item.label}</p><Badge variant={item.severity === "high" ? "destructive" : "secondary"}>{item.severity}</Badge></div><p className="mt-1 text-sm text-slate-600">{item.detail}</p></div>)}</CardContent></Card>}

              <div className="grid gap-5 lg:grid-cols-2">
                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-5 w-5 text-teal-700" />Identity & professional profile</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><LabelValue label="Provider type" value={detail.user.providerType} /><LabelValue label="Cadre" value={detail.user.cadreOther || detail.user.cadre} /><LabelValue label="Institutional role" value={detail.user.institutionalRole} /><LabelValue label="Login method" value={detail.user.loginMethod} /><LabelValue label="Account created" value={formatDate(detail.user.createdAt)} /><LabelValue label="Profile updated" value={formatDate(detail.user.updatedAt)} /><LabelValue label="Instructor number" value={detail.user.instructorNumber} /><LabelValue label="Instructor tier" value={detail.user.instructorTier} /></CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-teal-700" />Consent & governance</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><LabelValue label="Terms accepted" value={formatDate(detail.user.termsAcceptedAt)} /><LabelValue label="Privacy accepted" value={formatDate(detail.user.privacyAcceptedAt)} /><LabelValue label="Institutional addendum" value={formatDate(detail.user.institutionalB2bAcceptedAt)} /><LabelValue label="Care Signal consent" value={formatDate(detail.user.careSignalConsentAt)} /><LabelValue label="Code Signal consent" value={formatDate(detail.user.codeSignalConsentAt)} /><LabelValue label="Instructor approved" value={formatDate(detail.user.instructorApprovedAt)} /></CardContent></Card>
              </div>

              <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5 text-teal-700" />Institutional file</CardTitle><CardDescription>Membership and operational staff records are shown separately because they represent different contracts and evidence sources.</CardDescription></CardHeader><CardContent className="space-y-4">{detail.institutions.length === 0 && detail.staffRecords.length === 0 ? <p className="text-sm text-slate-500">No institution memberships or linked operational staff records were found.</p> : <>{detail.institutions.map(row => <div key={`membership-${row.membershipId}`} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-slate-950">{row.institutionName}</p><p className="mt-1 text-xs text-slate-500">{row.facilityCareLevel || "Facility level not recorded"} · Invited email {row.invitedEmail}</p></div><div className="flex gap-2"><Badge variant={statusVariant(row.membershipStatus)}>{row.membershipStatus}</Badge><Badge variant="outline">{row.responsibilityRole}</Badge></div></div><div className="mt-3 grid gap-3 text-sm sm:grid-cols-4"><LabelValue label="Invited" value={formatDate(row.invitedAt)} /><LabelValue label="Accepted" value={formatDate(row.acceptedAt)} /><LabelValue label="Ended" value={formatDate(row.endedAt)} /><LabelValue label="Institution status" value={row.institutionStatus} /></div></div>)}{detail.staffRecords.map(row => <div key={`staff-${row.id}`} className="rounded-xl border border-dashed border-slate-300 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-slate-950">{row.staffName} <span className="font-normal text-slate-500">· operational roster</span></p><p className="mt-1 text-xs text-slate-500">{row.department || "Department not recorded"} · {row.staffRole} · {row.governanceRole || "general staff"}</p></div><div className="flex gap-2"><Badge variant={statusVariant(row.facilityLinkStatus)}>{row.facilityLinkStatus || "link status unknown"}</Badge><Badge variant={statusVariant(row.certificationStatus)}>{row.certificationStatus || "not certified"}</Badge></div></div><div className="mt-3 grid gap-3 text-sm sm:grid-cols-4"><LabelValue label="Enrollment status" value={row.enrollmentStatus} /><LabelValue label="Phase" value={row.phaseStatus} /><LabelValue label="Created" value={formatDate(row.createdAt)} /><LabelValue label="Updated" value={formatDate(row.updatedAt)} /></div></div>)}</>}</CardContent></Card>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-5 w-5 text-teal-700" />Learning & enrolments</CardTitle><CardDescription>Course progress is evidence of learning activity, not automatic proof of competence.</CardDescription></CardHeader><CardContent className="space-y-3">{detail.enrolments.length === 0 ? <p className="text-sm text-slate-500">No training enrolments found.</p> : detail.enrolments.map(row => <div key={row.enrollmentId} className="rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-slate-900">{row.courseTitle || row.programType}</p><p className="mt-1 text-xs text-slate-500">{row.programType} · Created {formatDate(row.createdAt)}</p></div><Badge variant={statusVariant(row.enrollmentStatus)}>{row.enrollmentStatus}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Badge variant={row.cognitiveModulesComplete ? "default" : "outline"}>{row.cognitiveModulesComplete ? "Cognitive complete" : "Cognitive incomplete"}</Badge><Badge variant={row.practicalSkillsSignedOff ? "default" : "outline"}>{row.practicalSkillsSignedOff ? "Practical signed off" : "Practical pending"}</Badge><Badge variant="outline">{row.paymentStatus}</Badge></div></div>)}</CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Award className="h-5 w-5 text-teal-700" />Certificates</CardTitle><CardDescription>Certificate records remain distinct from AHA cards, licences, and current clinical readiness.</CardDescription></CardHeader><CardContent className="space-y-3">{detail.certificates.length === 0 ? <p className="text-sm text-slate-500">No certificates found.</p> : detail.certificates.map(row => <div key={row.id} className="rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-slate-900">{row.programType}</p><p className="mt-1 text-xs text-slate-500">{row.certificateNumber || "Number not recorded"} · Issued {formatDate(row.issueDate)}</p></div><Badge variant={row.expiryDate && new Date(row.expiryDate).getTime() < Date.now() ? "destructive" : "default"}>{row.expiryDate && new Date(row.expiryDate).getTime() < Date.now() ? "expired" : "current / no expiry"}</Badge></div><p className="mt-2 text-xs text-slate-600">Expiry: {formatDate(row.expiryDate)} · Pathway: {row.readinessPathway || "not recorded"}</p></div>)}</CardContent></Card>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-5 w-5 text-teal-700" />Payments & access evidence</CardTitle><CardDescription>Payment status is shown without exposing full payment credentials or secrets.</CardDescription></CardHeader><CardContent className="space-y-3">{detail.payments.length === 0 ? <p className="text-sm text-slate-500">No individual payment records found.</p> : detail.payments.map(row => <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"><div><p className="font-semibold text-slate-900">{formatMoney(row.amountCents)}</p><p className="mt-1 text-xs text-slate-500">{row.paymentMethod} · {formatDate(row.createdAt)} · Transaction reference {row.transactionId || "not recorded"}</p></div><Badge variant={statusVariant(row.status)}>{row.status}</Badge></div>)}</CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-teal-700" />CPD participation</CardTitle><CardDescription>Attendance is separated from registration and verification.</CardDescription></CardHeader><CardContent className="space-y-3">{detail.cpd.length === 0 ? <p className="text-sm text-slate-500">No linked CPD attendance records found.</p> : detail.cpd.slice(0, 10).map(row => <div key={row.attendeeId} className="rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-slate-900">{row.eventName}</p><p className="mt-1 text-xs text-slate-500">{row.eventDate} · {row.department || "Department not recorded"}</p></div><Badge variant={statusVariant(row.attendanceStatus)}>{row.attendanceStatus}</Badge></div><p className="mt-2 text-xs text-slate-600">CPD points: {row.cpdPoints || "Not recorded"} · Submitted {formatDate(row.submittedAt)}</p></div>)}</CardContent></Card>
              </div>

              <Card className="border-slate-200 bg-slate-50"><CardContent className="flex items-start gap-3 p-4"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" /><div><p className="font-semibold text-slate-800">V1 boundary</p><p className="mt-1 text-sm leading-6 text-slate-600">{detail.auditBoundary} User-specific audit corrections, support history, restricted clinical narratives, and export controls will be added as governed follow-on work rather than inferred from unrelated records.</p></div></CardContent></Card>
            </>}
          </main>
        </div>
      </div>
    </div>
  );
}
