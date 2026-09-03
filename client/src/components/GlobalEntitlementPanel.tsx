import { useMemo, useState } from "react";
import {
  BadgePercent,
  Building2,
  CheckCircle2,
  KeyRound,
  Search,
  ShieldCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const programmeOptions = [
  { value: "ierp", label: "IERP — Intern Emergency Readiness Program" },
  { value: "nerp", label: "NERP — Nurses Emergency Readiness Program" },
  {
    value: "paeds_resus_ils",
    label: "ILSP — Institutional Life Support Program",
  },
  { value: "self_pay", label: "Self-pay fellowship microcourse" },
  { value: "bls", label: "Self-pay BLS" },
  { value: "acls", label: "Self-pay ACLS" },
  { value: "pals", label: "Self-pay PALS" },
  { value: "heartsaver", label: "Self-pay Heartsaver" },
  { value: "nrp", label: "Self-pay NRP" },
  { value: "instructor", label: "Self-pay Instructor Course" },
] as const;

type Programme = (typeof programmeOptions)[number]["value"];

export default function GlobalEntitlementPanel() {
  const [programType, setProgramType] = useState<Programme>("self_pay");
  const [targetQuery, setTargetQuery] = useState("");
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [targetInstitutionalAccountId, setTargetInstitutionalAccountId] =
    useState<number | null>(null);
  const [selfPayCourseId, setSelfPayCourseId] = useState("");
  const [selfPayCourseQuery, setSelfPayCourseQuery] = useState("");
  const [benefitType, setBenefitType] = useState<
    "free" | "percentage_discount"
  >("free");
  const [discountPercent, setDiscountPercent] = useState("25");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("1");
  const [shareable, setShareable] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);

  const isInstitutionTarget = programType === "paeds_resus_ils";
  const isCourseScopedProgramme = ["self_pay", "bls", "acls", "pals", "heartsaver", "nrp", "instructor"].includes(programType);
  const usersQuery = trpc.adminEntitlements.searchUsers.useQuery(
    { query: targetQuery.trim() },
    { enabled: !isInstitutionTarget && targetQuery.trim().length >= 2 }
  );
  const institutionsQuery = trpc.adminEntitlements.searchInstitutions.useQuery(
    { query: targetQuery.trim() },
    { enabled: isInstitutionTarget && targetQuery.trim().length >= 2 }
  );
  const listQuery = trpc.adminEntitlements.list.useQuery();
  const selfPayCoursesQuery = trpc.adminEntitlements.listSelfPayCourses.useQuery(undefined, {
    enabled: programType === "self_pay",
  });
  const ahaSelfPayCoursesQuery = trpc.adminEntitlements.listAhaSelfPayCourses.useQuery(undefined, {
    enabled: ["bls", "acls", "pals", "heartsaver", "nrp", "instructor"].includes(programType),
  });
  const createMutation = trpc.adminEntitlements.create.useMutation({
    onSuccess: (result) => {
      setIssuedCode(result.accessCode ?? null);
      setTargetQuery("");
      setTargetUserId(null);
      setTargetInstitutionalAccountId(null);
      setSelfPayCourseId("");
      setSelfPayCourseQuery("");
      setReason("");
      void listQuery.refetch();
    },
  });
  const revokeMutation = trpc.adminEntitlements.revoke.useMutation({
    onSuccess: () => void listQuery.refetch(),
  });

  const selectedUser = usersQuery.data?.find(user => user.id === targetUserId);
  const selectedInstitution = institutionsQuery.data?.find(
    institution => institution.id === targetInstitutionalAccountId
  );
  const targetReady = shareable && isCourseScopedProgramme
    ? true
    : isInstitutionTarget
      ? targetInstitutionalAccountId != null
      : targetUserId != null;
  const discount =
    benefitType === "percentage_discount" ? Number(discountPercent) : 100;
  const validDiscount =
    benefitType === "free" ||
    (Number.isInteger(discount) && discount >= 1 && discount <= 99);
  const canSubmit =
    targetReady &&
    validDiscount &&
    reason.trim().length >= 10 &&
    /^\d{4}-\d{2}-\d{2}$/.test(expiresAt) &&
    Number(maxRedemptions) >= 1 &&
    (!["self_pay", "bls", "acls", "pals", "heartsaver", "nrp", "instructor"].includes(programType) || selfPayCourseId.trim().length > 0);
  const courseOptions = programType === "self_pay"
    ? (selfPayCoursesQuery.data ?? []).map(course => ({
        courseId: course.courseId,
        title: course.title,
        level: course.level,
        isPublished: course.isPublished,
        priceLabel: `KES ${Math.ceil(course.price / 100).toLocaleString()}`,
        searchText: [course.title, course.courseId, course.emergencyType, course.level].filter(Boolean).join(" "),
      }))
    : (ahaSelfPayCoursesQuery.data ?? []).filter(course => course.courseId === programType).map(course => ({
        courseId: course.courseId,
        title: course.title,
        level: course.level,
        isPublished: true,
        priceLabel: "AHA course",
        searchText: [course.title, course.courseId, course.level].filter(Boolean).join(" "),
      }));
  const selectedSelfPayCourse = courseOptions.find(course => course.courseId === selfPayCourseId);
  const filteredSelfPayCourses = useMemo(() => {
    const query = selfPayCourseQuery.trim().toLowerCase();
    const courses = courseOptions;
    if (!query) return courses;
    return courses.filter(course =>
      course.searchText.toLowerCase().includes(query)
    );
  }, [selfPayCourseQuery, programType, selfPayCoursesQuery.data, ahaSelfPayCoursesQuery.data]);
  const selectedTargetLabel =
    selectedInstitution?.companyName ||
    selectedUser?.name ||
    selectedUser?.email ||
    "No target selected";
  const benefitLabel =
    benefitType === "free" ? "full waiver" : `${discount}% discount`;
  const programmeLabel = useMemo(
    () =>
      programmeOptions.find(option => option.value === programType)?.label ??
      programType,
    [programType]
  );

  const resetTarget = () => {
    setTargetQuery("");
    setTargetUserId(null);
    setTargetInstitutionalAccountId(null);
  };

  const submit = () => {
    if (!canSubmit) return;
    createMutation.mutate({
      programType,
      targetUserId: shareable || isInstitutionTarget ? null : targetUserId,
      targetInstitutionalAccountId:
        shareable || !isInstitutionTarget ? null : targetInstitutionalAccountId,
      selfPayCourseId:
        isCourseScopedProgramme ? selfPayCourseId.trim() : null,
      benefitType,
      discountPercent: benefitType === "percentage_discount" ? discount : null,
      reason: reason.trim(),
      expiresAt,
      maxRedemptions: Number(maxRedemptions),
      shareable,
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Global Admin entitlements
        </CardTitle>
        <CardDescription>
          Create a named, auditable entitlement for an existing Paeds Resus
          account or institution. This creates an internal grant reference, not
          a shareable learner token. Clinical, eligibility, roster, assessment,
          and certificate safeguards remain active.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="global-entitlement-program"
            >
              Programme
            </label>
            <select
              id="global-entitlement-program"
              value={programType}
              onChange={event => {
                setProgramType(event.target.value as Programme);
                resetTarget();
                setSelfPayCourseId("");
                setSelfPayCourseQuery("");
              }}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {programmeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="global-entitlement-target"
            >
              {isInstitutionTarget ? "Find institution" : "Find named account"}
            </label>
            <Input
              id="global-entitlement-target"
              value={targetQuery}
              onChange={event => {
                setTargetQuery(event.target.value);
                setTargetUserId(null);
                setTargetInstitutionalAccountId(null);
              }}
              placeholder={
                isInstitutionTarget
                  ? "Institution name"
                  : "Provider name or email"
              }
            />
            {isInstitutionTarget && institutionsQuery.data?.length ? (
              <div className="rounded-md border bg-background text-sm">
                {institutionsQuery.data.map(institution => (
                  <button
                    type="button"
                    key={institution.id}
                    onClick={() =>
                      setTargetInstitutionalAccountId(institution.id)
                    }
                    className={`block w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted ${targetInstitutionalAccountId === institution.id ? "bg-muted" : ""}`}
                  >
                    <Building2 className="mr-2 inline h-4 w-4" />
                    {institution.companyName}
                    <span className="ml-2 text-muted-foreground">
                      {institution.contactEmail}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            {!isInstitutionTarget && usersQuery.data?.length ? (
              <div className="rounded-md border bg-background text-sm">
                {usersQuery.data.map(user => (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => setTargetUserId(user.id)}
                    className={`block w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted ${targetUserId === user.id ? "bg-muted" : ""}`}
                  >
                    <UserPlus className="mr-2 inline h-4 w-4" />
                    {user.name || "Unnamed account"}
                    <span className="ml-2 text-muted-foreground">
                      {user.email || `User #${user.id}`}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Selected: {selectedTargetLabel}
            </p>
          </div>
          {["self_pay", "bls", "acls", "pals", "heartsaver", "nrp", "instructor"].includes(programType) && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="global-entitlement-course"
              >
                {programType === "self_pay" ? "Self-pay fellowship course" : `${programType.toUpperCase()} life-support course`}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="global-entitlement-course"
                  value={selfPayCourseQuery}
                  onChange={event => {
                    setSelfPayCourseQuery(event.target.value);
                    setSelfPayCourseId("");
                  }}
                  placeholder="Search by course title or course ID"
                  className="pl-9"
                  aria-describedby="global-entitlement-course-help"
                />
              </div>
              <p
                id="global-entitlement-course-help"
                className="text-xs leading-5 text-muted-foreground"
              >
                Select the published catalogue course. The course ID is copied
                into the grant automatically.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={shareable}
                  onChange={event => {
                    setShareable(event.target.checked);
                    if (event.target.checked) resetTarget();
                  }}
                />
                Issue a shareable learner access code
              </label>
              {shareable ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  The plaintext code is shown once after creation. Send it only
                  to the intended learner.
                </p>
              ) : null}
              {issuedCode ? (
                <div className="rounded-md border border-green-300 bg-green-50 px-3 py-3 text-sm text-green-950">
                  <p className="font-semibold">Access code — copy now</p>
                  <code className="mt-1 block text-base tracking-wider">{issuedCode}</code>
                  <p className="mt-1 text-xs">This code will not be shown again.</p>
                </div>
              ) : null}
              {selectedSelfPayCourse ? (
                <div className="flex items-start justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{selectedSelfPayCourse.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedSelfPayCourse.courseId} · KES{" "}
                      {selectedSelfPayCourse.priceLabel} {" "}
                      · {selectedSelfPayCourse.level}
                    </p>
                  </div>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                </div>
              ) : null}
              <div className="max-h-56 overflow-y-auto rounded-md border bg-background text-sm">
                {(programType === "self_pay" ? selfPayCoursesQuery.isLoading : ahaSelfPayCoursesQuery.isLoading) ? (
                  <p className="px-3 py-3 text-muted-foreground">
                    Loading self-pay catalogue…
                  </p>
                ) : (programType === "self_pay" ? selfPayCoursesQuery.isError : ahaSelfPayCoursesQuery.isError) ? (
                  <p className="px-3 py-3 text-destructive">
                    Self-pay catalogue unavailable. Refresh and try again.
                  </p>
                ) : filteredSelfPayCourses.length ? (
                  filteredSelfPayCourses.map(course => (
                    <button
                      type="button"
                      key={course.courseId}
                      disabled={!course.isPublished}
                      onClick={() => {
                        setSelfPayCourseId(course.courseId);
                        setSelfPayCourseQuery(course.title);
                      }}
                      className={`block w-full border-b px-3 py-2 text-left last:border-b-0 ${course.isPublished ? "hover:bg-muted" : "cursor-not-allowed opacity-50"} ${selfPayCourseId === course.courseId ? "bg-muted" : ""}`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {course.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {course.courseId} · {course.priceLabel} ·{" "}
                            {course.level}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {course.isPublished ? "Published" : "Unavailable"}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-3 text-muted-foreground">
                    No matching self-pay courses.
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="global-entitlement-benefit"
            >
              Benefit
            </label>
            <select
              id="global-entitlement-benefit"
              value={benefitType}
              onChange={event =>
                setBenefitType(
                  event.target.value as "free" | "percentage_discount"
                )
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="free">Full waiver — KES 0 balance</option>
              <option value="percentage_discount">Percentage discount</option>
            </select>
          </div>
          {benefitType === "percentage_discount" && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="global-entitlement-percent"
              >
                Discount percentage
              </label>
              <Input
                id="global-entitlement-percent"
                type="number"
                min="1"
                max="99"
                value={discountPercent}
                onChange={event => setDiscountPercent(event.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="global-entitlement-expires"
            >
              Expiry
            </label>
            <Input
              id="global-entitlement-expires"
              type="date"
              value={expiresAt}
              onChange={event => setExpiresAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="global-entitlement-redemptions"
            >
              Maximum redemptions
            </label>
            <Input
              id="global-entitlement-redemptions"
              type="number"
              min="1"
              max="1000"
              value={maxRedemptions}
              onChange={event => setMaxRedemptions(event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label
              className="text-sm font-medium"
              htmlFor="global-entitlement-reason"
            >
              Business reason
            </label>
            <Input
              id="global-entitlement-reason"
              value={reason}
              onChange={event => setReason(event.target.value)}
              placeholder="At least 10 characters; this appears in the audit record"
            />
          </div>
        </div>
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <KeyRound className="mr-2 inline h-4 w-4" />
          <strong>Preview:</strong> {programmeLabel} · {selectedTargetLabel} ·{" "}
          {benefitLabel} · expires {expiresAt || "not set"} ·{" "}
          {maxRedemptions || "0"} use(s)
        </div>
        <Button
          type="button"
          onClick={submit}
          disabled={!canSubmit || createMutation.isPending}
        >
          <BadgePercent className="mr-2 h-4 w-4" />
          {createMutation.isPending ? "Creating…" : "Create entitlement"}
        </Button>
        {createMutation.data && (
          <p className="text-sm text-emerald-700">
            Created internal reference:{" "}
            <strong>{createMutation.data.grantReference}</strong>. This is not a
            shareable access token.
          </p>
        )}
        {createMutation.error && (
          <p className="text-sm text-destructive">
            {createMutation.error.message}
          </p>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Recent entitlement history</h3>
          {listQuery.data?.length ? (
            listQuery.data.map(entitlement => {
              const active =
                entitlement.status === "active" &&
                new Date(entitlement.expiresAt).getTime() > Date.now() &&
                entitlement.redemptionCount < entitlement.maxRedemptions;
              return (
                <div
                  key={entitlement.id}
                  className="flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{entitlement.programmeLabel}</p>
                    <p>
                      {entitlement.targetInstitutionName ||
                        entitlement.targetUserName ||
                        entitlement.targetUserEmail ||
                        "Named target"}{" "}
                      ·{" "}
                      {entitlement.benefitType === "free"
                        ? "Full waiver"
                        : `${entitlement.discountPercent}% discount`}{" "}
                      · {entitlement.redemptionCount}/
                      {entitlement.maxRedemptions} used
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entitlement.grantReference} · expires{" "}
                      {new Date(entitlement.expiresAt).toLocaleDateString()} ·{" "}
                      {entitlement.reason}
                    </p>
                    {entitlement.redemptions.map(redemption => (
                      <p
                        key={`${entitlement.id}-${redemption.resourceReference}`}
                        className="text-xs text-emerald-700"
                      >
                        Applied to {redemption.resourceReference} at KES{" "}
                        {redemption.effectiveAmountKes.toLocaleString()}
                      </p>
                    ))}
                  </div>
                  {active ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const revokeReason = window.prompt(
                          "Reason for revoking this entitlement:"
                        );
                        if (revokeReason?.trim())
                          revokeMutation.mutate({
                            entitlementId: entitlement.id,
                            reason: revokeReason.trim(),
                          });
                      }}
                      disabled={revokeMutation.isPending}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Revoke
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              No global entitlements recorded.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
