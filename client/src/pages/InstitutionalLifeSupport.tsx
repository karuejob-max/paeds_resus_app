import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Users,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWorkspaceAccess } from "@/hooks/useWorkspaceAccess";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PAEDS_RESUS_ILS_BASE_PRICE_KES,
  PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES,
  PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES,
  PAEDS_RESUS_ILS_DELIVERY_LABEL,
} from "@shared/institutional-life-support";

import { getIlsPilotAcceptanceGaps } from "@shared/ils-operations";

const kes = (amount: number) => `KES ${amount.toLocaleString()}`;

export default function InstitutionalLifeSupport() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { effectiveWorkspace, hasInstitutionAccess } = useWorkspaceAccess();
  const isInstitutionUser = effectiveWorkspace === "institution";
  const institutionQuery = trpc.institution.getMyInstitution.useQuery(
    undefined,
    { enabled: isAuthenticated && hasInstitutionAccess }
  );
  const catalogQuery = trpc.institutionalLifeSupport.getCatalog.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const enrollmentQuery =
    trpc.institutionalLifeSupport.getMyEnrollment.useQuery(undefined, {
      enabled: isAuthenticated && !isInstitutionUser,
    });
  const credentialRequestsQuery =
    trpc.institutionalLifeSupport.getMyCredentialRequests.useQuery(undefined, {
      enabled: isAuthenticated && !isInstitutionUser,
    });
  const institutionId = institutionQuery.data?.institution?.id ?? null;
  const rosterQuery =
    trpc.institutionalLifeSupport.getInstitutionRoster.useQuery(
      { institutionId: institutionId! },
      { enabled: !!institutionId }
    );
  const ordersQuery =
    trpc.institutionalLifeSupport.getInstitutionOrders.useQuery(
      { institutionId: institutionId! },
      { enabled: !!institutionId }
    );
  const providerRegisterQuery =
    trpc.institutionalLifeSupport.getInstitutionProviderRegister.useQuery(
      { institutionId: institutionId! },
      { enabled: !!institutionId }
    );
  const sessionsQuery =
    trpc.institutionalLifeSupport.listDeliverySessions.useQuery(
      { institutionId: institutionId! },
      { enabled: !!institutionId }
    );
  const instructorsQuery =
    trpc.institutionalLifeSupport.listAssignableInstructors.useQuery(
      { institutionId: institutionId! },
      { enabled: isAuthenticated && isInstitutionUser && !!institutionId }
    );
  const metricsQuery =
    trpc.institutionalLifeSupport.getInstitutionIlsMetrics.useQuery(
      { institutionId: institutionId! },
      { enabled: !!institutionId }
    );
  const pilotGateGaps = metricsQuery.data
    ? getIlsPilotAcceptanceGaps({
        paymentToAccessSuccessPercent:
          metricsQuery.data.paymentToAccessSuccessPercent,
        activationWithin7dPercent: metricsQuery.data.activationWithin7dPercent,
        cognitiveWithin30dPercent: metricsQuery.data.cognitiveWithin30dPercent,
        practicalOpportunityWithin14dPercent:
          metricsQuery.data.practicalOpportunityWithin14dPercent,
      })
    : [];
  const pilotCohortsQuery =
    trpc.institutionalLifeSupport.listPilotCohorts.useQuery(
      { institutionId: institutionId! },
      { enabled: !!institutionId }
    );
  const [selectedPilotId, setSelectedPilotId] = useState<number | null>(null);
  const pilotMetricsQuery =
    trpc.institutionalLifeSupport.listPilotMetrics.useQuery(
      { institutionId: institutionId!, pilotCohortId: selectedPilotId! },
      { enabled: !!institutionId && !!selectedPilotId }
    );
  const operationalCasesQuery =
    trpc.institutionalLifeSupport.listOperationalCases.useQuery(
      { institutionId: institutionId!, status: "open" },
      { enabled: !!institutionId }
    );
  const assessmentRosterQuery =
    trpc.institutionalLifeSupport.getMyAssessmentRoster.useQuery(undefined, {
      enabled: isAuthenticated && !isInstitutionUser,
    });
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? "");
  const [trainingDate, setTrainingDate] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [sessionLocation, setSessionLocation] = useState("");
  const [sessionInstructorId, setSessionInstructorId] = useState("");
  const [sessionCapacity, setSessionCapacity] = useState("10");
  const [venueConfirmed, setVenueConfirmed] = useState(false);
  const [equipmentConfirmed, setEquipmentConfirmed] = useState(false);
  const [claimsAcknowledged, setClaimsAcknowledged] = useState(false);
  const [rosterConfirmed, setRosterConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCredentialRequestId, setActiveCredentialRequestId] = useState<
    number | null
  >(null);

  const [pilotSegment, setPilotSegment] = useState<
    "training_provider" | "faith_based_hospital"
  >("training_provider");
  const [pilotName, setPilotName] = useState("");
  const [pilotTargetCount, setPilotTargetCount] = useState("10");
  const [pilotMinimumCount, setPilotMinimumCount] = useState("5");
  const [pilotStartDate, setPilotStartDate] = useState("");
  const [pilotClinicalOwnerId, setPilotClinicalOwnerId] = useState("");
  const [caseCategory, setCaseCategory] = useState<
    | "payment"
    | "roster"
    | "access"
    | "delivery"
    | "assessment"
    | "certificate"
    | "aha_credentialing"
    | "support"
  >("support");
  const [caseSummary, setCaseSummary] = useState("");
  const [caseDetails, setCaseDetails] = useState("");
  const [paymentToAccessPercent, setPaymentToAccessPercent] = useState("100");
  const [activationWithin7dPercent, setActivationWithin7dPercent] =
    useState("0");
  const [cognitiveWithin30dPercent, setCognitiveWithin30dPercent] =
    useState("0");
  const [practicalWithin14dPercent, setPracticalWithin14dPercent] =
    useState("0");
  const [practicalPassPercent, setPracticalPassPercent] = useState("0");
  const [supportMinutesPerProvider, setSupportMinutesPerProvider] =
    useState("");
  const [costPerProviderKes, setCostPerProviderKes] = useState("");
  const [marginPerProviderKes, setMarginPerProviderKes] = useState("");
  const [coordinatorSatisfaction, setCoordinatorSatisfaction] = useState("");
  const [assessmentEnrollmentId, setAssessmentEnrollmentId] = useState<
    number | null
  >(null);
  const [assessmentResult, setAssessmentResult] = useState<
    "pass" | "remediation_required" | "fail" | "no_show"
  >("pass");
  const [assessmentScore, setAssessmentScore] = useState("");
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [assessmentChecklistVersion, setAssessmentChecklistVersion] =
    useState("ils-v1");
  const [assessmentCalibrationConfirmed, setAssessmentCalibrationConfirmed] =
    useState(false);
  const [assessmentSecondAssessorUserId, setAssessmentSecondAssessorUserId] =
    useState("");
  const [remediationDueAt, setRemediationDueAt] = useState("");
  const resetAssessmentForm = () => {
    setAssessmentEnrollmentId(null);
    setAssessmentResult("pass");
    setAssessmentScore("");
    setAssessmentNotes("");
    setAssessmentChecklistVersion("ils-v1");
    setAssessmentCalibrationConfirmed(false);
    setAssessmentSecondAssessorUserId("");
    setRemediationDueAt("");
  };

  const createDeliverySession =
    trpc.institutionalLifeSupport.createDeliverySession.useMutation({
      onSuccess: session => {
        setSelectedSessionId(session?.id ?? null);
        setMessage(
          "Delivery plan created. Confirm the venue and equipment before payment."
        );
        void sessionsQuery.refetch();
      },
      onError: err => setError(err.message),
    });
  const confirmDeliverySession =
    trpc.institutionalLifeSupport.confirmDeliverySession.useMutation({
      onSuccess: result => {
        setMessage(result.message);
        void sessionsQuery.refetch();
      },
      onError: err => setError(err.message),
    });
  const createOrder =
    trpc.institutionalLifeSupport.createInstitutionOrder.useMutation({
      onSuccess: result => {
        setMessage(
          `M-Pesa prompt sent for ${kes(result.totalAmountKes)} for ${result.providerCount} provider(s).`
        );
        setSelectedStaffIds([]);
        void ordersQuery.refetch();
        void rosterQuery.refetch();
      },
      onError: err => setError(err.message),
    });
  const requestCredential =
    trpc.institutionalLifeSupport.requestAhaCredential.useMutation({
      onSuccess: request => {
        setActiveCredentialRequestId(request.id);
        setMessage(
          `${request.credentialType.toUpperCase()} credentialing request created. Pay ${kes(request.amountKes)} before the deadline to send it for review.`
        );
        void credentialRequestsQuery.refetch();
      },
      onError: err => setError(err.message),
    });
  const payCredential =
    trpc.institutionalLifeSupport.initiateAhaCredentialPayment.useMutation({
      onSuccess: result => {
        setMessage(
          `M-Pesa prompt sent for ${kes(result.amountKes ?? 0)}. The request will move to credentialing review after payment confirmation.`
        );
        void credentialRequestsQuery.refetch();
      },
      onError: err => setError(err.message),
    });
  const cancelPendingEnrollment =
    trpc.institutionalLifeSupport.cancelPendingEnrollment.useMutation({
      onSuccess: result => {
        setMessage(
          result.alreadyCancelled
            ? "This pending enrollment was already cancelled."
            : "Pending enrollment cancelled. No payment was taken."
        );
        void enrollmentQuery.refetch();
      },
      onError: err => setError(err.message),
    });

  const [replacementAssignmentId, setReplacementAssignmentId] = useState<
    number | null
  >(null);
  const [replacementStaffMemberId, setReplacementStaffMemberId] = useState("");
  const [replacementReason, setReplacementReason] = useState("");
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [cancelOrderReason, setCancelOrderReason] = useState("");
  const replaceInstitutionProvider =
    trpc.institutionalLifeSupport.replaceInstitutionProvider.useMutation({
      onSuccess: () => {
        setMessage(
          "Provider replacement recorded. The original assignment remains in the audit history and the replacement is attached to the same order."
        );
        setReplacementAssignmentId(null);
        setReplacementStaffMemberId("");
        setReplacementReason("");
        void ordersQuery.refetch();
        void rosterQuery.refetch();
        void metricsQuery.refetch();
      },
      onError: err => setError(err.message),
    });
  const cancelInstitutionOrder =
    trpc.institutionalLifeSupport.cancelInstitutionOrder.useMutation({
      onSuccess: () => {
        setMessage(
          "Pending ILS order cancelled. Reserved capacity and pending payment state were released."
        );
        setCancelOrderId(null);
        setCancelOrderReason("");
        void ordersQuery.refetch();
        void rosterQuery.refetch();
        void metricsQuery.refetch();
      },
      onError: err => setError(err.message),
    });
  const createPilotCohort =
    trpc.institutionalLifeSupport.createPilotCohort.useMutation({
      onSuccess: result => {
        setMessage(`Pilot cohort ${result?.name ?? "created"}.`);
        setPilotName("");
        void pilotCohortsQuery.refetch();
      },
      onError: err => setError(err.message),
    });
  const createOperationalCase =
    trpc.institutionalLifeSupport.createOperationalCase.useMutation({
      onSuccess: () => {
        setMessage("Operational case opened for follow-up.");
        setCaseSummary("");
        setCaseDetails("");
        void operationalCasesQuery.refetch();
        void metricsQuery.refetch();
      },
      onError: err => setError(err.message),
    });
  const recordPilotMetrics =
    trpc.institutionalLifeSupport.recordPilotMetrics.useMutation({
      onSuccess: () => {
        setMessage("Pilot scorecard recorded.");
        void metricsQuery.refetch();
      },
      onError: err => setError(err.message),
    });
  const recordPracticalAssessment =
    trpc.institutionalLifeSupport.recordPracticalAssessment.useMutation({
      onSuccess: result => {
        setMessage(
          result.certificateIssued
            ? "Assessment passed and the Paeds Resus competency certificate was issued."
            : "Practical assessment recorded."
        );
        resetAssessmentForm();
        void assessmentRosterQuery.refetch();
      },
      onError: err => setError(err.message),
    });

  const course = catalogQuery.data?.course;
  const pricing = catalogQuery.data?.pricing;
  const enrollment = enrollmentQuery.data;
  const activeCredentialRequest = useMemo(
    () =>
      credentialRequestsQuery.data?.find(
        request => request.id === activeCredentialRequestId
      ) ?? credentialRequestsQuery.data?.[0],
    [activeCredentialRequestId, credentialRequestsQuery.data]
  );
  const selectedProviderCount = selectedStaffIds.length;
  const selectedProviderTotal =
    selectedProviderCount * PAEDS_RESUS_ILS_BASE_PRICE_KES;

  const selectedSession = sessionsQuery.data?.find(
    session => session.id === selectedSessionId
  );
  const selectedInstructor = instructorsQuery.data?.find(
    instructor => instructor.id === Number(sessionInstructorId)
  );

  if (!isAuthenticated) {
    return (
      <Card className="mx-auto mt-12 max-w-xl">
        <CardHeader>
          <CardTitle>Sign in to use Institutional Life Support</CardTitle>
          <CardDescription>
            Use your Paeds Resus account to manage an institution-paid provider
            cohort or access learning assigned by your institution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/login")}>Sign in</Button>
        </CardContent>
      </Card>
    );
  }

  if (catalogQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-8 text-center text-muted-foreground">
        Loading the Institutional Life Support programme…
      </div>
    );
  }

  const openCourse = () => {
    if (!enrollment?.id || enrollment.paymentStatus !== "completed") {
      setError(
        "Your institution must complete the bulk provider payment before the learning modules can open."
      );
      return;
    }
    navigate(
      `/micro-course/paeds-resus-competency?programType=paeds_resus_ils&enrollmentId=${enrollment.id}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                  <Badge className="mb-3 bg-blue-700 text-white">
                  {isInstitutionUser ? PAEDS_RESUS_ILS_DELIVERY_LABEL : "Institution-assigned provider pathway"}
                </Badge>
                <CardTitle className="text-3xl">
                  Institutional Life Support Training Program
                </CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-base">
                  A structured Paeds Resus programme for providers and
                  institutions. It follows an online learning, knowledge-check,
                  practical-assessment, and certificate workflow similar to
                  established life-support programmes.
                </CardDescription>
              </div>
              <div className="rounded-xl bg-white/80 p-4 text-right shadow-sm dark:bg-background/60">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Per provider
                </p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {kes(
                    pricing?.providerPriceKes ?? PAEDS_RESUS_ILS_BASE_PRICE_KES
                  )}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-background/70 p-3">
              <BookOpen className="mb-2 h-5 w-5 text-blue-700" />
              <p className="font-semibold">Learn and check knowledge</p>
              <p className="text-sm text-muted-foreground">
                Complete six structured modules and a final knowledge check.
              </p>
            </div>
            <div className="rounded-lg bg-background/70 p-3">
              <Users className="mb-2 h-5 w-5 text-emerald-700" />
              <p className="font-semibold">Assess practical competence</p>
              <p className="text-sm text-muted-foreground">
                An approved Paeds Resus instructor signs off the hands-on
                assessment.
              </p>
            </div>
            <div className="rounded-lg bg-background/70 p-3">
              <Award className="mb-2 h-5 w-5 text-violet-700" />
              <p className="font-semibold">Receive the right certificate</p>
              <p className="text-sm text-muted-foreground">
                Successful completion issues a Paeds Resus certificate, not an
                AHA certificate.
              </p>
            </div>
          </CardContent>
        </Card>

        {(message || error) && (
          <div
            className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error ?? message}</span>
            <button
              className="ml-auto text-xs underline"
              onClick={() => {
                setError(null);
                setMessage(null);
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {isInstitutionUser ? (
          <Tabs defaultValue="cohort">
            <TabsList>
              <TabsTrigger value="cohort">
                <Building2 className="mr-2 h-4 w-4" />
                Institution cohort
              </TabsTrigger>
              <TabsTrigger value="programme">
                <BookOpen className="mr-2 h-4 w-4" />
                Programme details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cohort" className="mt-6 space-y-6">
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                <CardHeader>
                  <CardTitle>1. Confirm delivery before payment</CardTitle>
                  <CardDescription>
                    ILS is delivered as a scheduled institutional cohort.
                    Confirm an approved instructor, capacity, venue, equipment,
                    and a practical date before creating the payment order.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="ils-session-location">
                        Venue or location
                      </Label>
                      <Input
                        id="ils-session-location"
                        value={sessionLocation}
                        onChange={event =>
                          setSessionLocation(event.target.value)
                        }
                        placeholder="Training room or facility"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ils-session-instructor">
                        Approved instructor
                      </Label>
                      <select
                        id="ils-session-instructor"
                        className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={sessionInstructorId}
                        onChange={event =>
                          setSessionInstructorId(event.target.value)
                        }
                      >
                        <option value="">Select instructor</option>
                        {(instructorsQuery.data ?? []).map(instructor => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.name ??
                              instructor.email ??
                              `User ${instructor.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="ils-session-capacity">
                        Maximum providers
                      </Label>
                      <Input
                        id="ils-session-capacity"
                        type="number"
                        min={1}
                        max={200}
                        value={sessionCapacity}
                        onChange={event =>
                          setSessionCapacity(event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <Button
                      variant="outline"
                      disabled={
                        !trainingDate ||
                        !sessionLocation.trim() ||
                        !sessionInstructorId ||
                        createDeliverySession.isPending
                      }
                      onClick={() => {
                        setError(null);
                        createDeliverySession.mutate({
                          institutionId: institutionId!,
                          scheduledDate: new Date(`${trainingDate}T12:00:00Z`),
                          location: sessionLocation.trim(),
                          instructorUserId: Number(sessionInstructorId),
                          maxCapacity: Number(sessionCapacity),
                        });
                      }}
                    >
                      {createDeliverySession.isPending
                        ? "Creating plan…"
                        : "Create delivery plan"}
                    </Button>
                    {(!trainingDate ||
                      !sessionLocation.trim() ||
                      !sessionInstructorId) && (
                      <p className="text-xs text-muted-foreground">
                        Choose the practical date, enter a venue, and select an
                        approved instructor before creating the delivery plan.
                      </p>
                    )}
                  </div>
                  {sessionsQuery.data?.length ? (
                    <div className="space-y-2">
                      <Label>Delivery sessions</Label>
                      {sessionsQuery.data.map(session => {
                        const selected = session.id === selectedSessionId;
                        return (
                          <button
                            key={session.id}
                            type="button"
                            className={`flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left text-sm ${selected ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "bg-background"}`}
                            onClick={() => {
                              setSelectedSessionId(session.id);
                              setTrainingDate(
                                new Date(session.scheduledDate)
                                  .toISOString()
                                  .slice(0, 10)
                              );
                              setSessionLocation(session.location ?? "");
                              setSessionInstructorId(
                                session.instructorId
                                  ? String(session.instructorId)
                                  : ""
                              );
                              setVenueConfirmed(session.venueConfirmed);
                              setEquipmentConfirmed(session.equipmentConfirmed);
                            }}
                          >
                            <span>
                              <span className="block font-medium">
                                {new Date(
                                  session.scheduledDate
                                ).toLocaleDateString()}{" "}
                                · {session.location || "Venue to be confirmed"}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {session.instructorName ||
                                  "Instructor to be confirmed"}{" "}
                                · capacity {session.reservedCount}/
                                {session.maxCapacity}
                              </span>
                            </span>
                            <Badge
                              variant={
                                session.sessionStatus === "confirmed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {session.sessionStatus}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {selectedSession && (
                    <div className="space-y-4 rounded-lg border bg-background p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={venueConfirmed}
                            onChange={event =>
                              setVenueConfirmed(event.target.checked)
                            }
                            className="mt-1 h-4 w-4"
                          />
                          <span>
                            <span className="block font-medium">
                              Venue confirmed
                            </span>
                            <span className="text-xs text-muted-foreground">
                              The practical assessment location is available.
                            </span>
                          </span>
                        </label>
                        <label className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={equipmentConfirmed}
                            onChange={event =>
                              setEquipmentConfirmed(event.target.checked)
                            }
                            className="mt-1 h-4 w-4"
                          />
                          <span>
                            <span className="block font-medium">
                              Equipment plan confirmed
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Required practical equipment is available for the
                              cohort.
                            </span>
                          </span>
                        </label>
                      </div>
                      <Button
                        variant="outline"
                        disabled={confirmDeliverySession.isPending}
                        onClick={() =>
                          confirmDeliverySession.mutate({
                            institutionId: institutionId!,
                            sessionId: selectedSession.id,
                            venueConfirmed,
                            equipmentConfirmed,
                            practicalDateConfirmed: true,
                          })
                        }
                      >
                        {confirmDeliverySession.isPending
                          ? "Saving readiness…"
                          : "Confirm delivery readiness"}
                      </Button>
                      <label className="flex items-start gap-2 border-t pt-3 text-sm">
                        <input
                          type="checkbox"
                          checked={claimsAcknowledged}
                          onChange={event =>
                            setClaimsAcknowledged(event.target.checked)
                          }
                          className="mt-1 h-4 w-4"
                        />
                        <span>
                          <span className="block font-medium">
                            I understand the certification boundary
                          </span>
                          <span className="text-xs text-muted-foreground">
                            This cohort produces a Paeds Resus competency
                            certificate. It does not automatically issue an AHA
                            credential.
                          </span>
                        </span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Payment is enabled only after the session is confirmed
                        and this acknowledgement is selected.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              {metricsQuery.data && (
                <Card>
                  <CardHeader>
                    <CardTitle>2. Pilot and cohort status</CardTitle>
                    <CardDescription>
                      Use these operational measures to spot stalled delivery
                      before accepting another cohort.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Paid providers
                      </p>
                      <p className="text-xl font-semibold">
                        {metricsQuery.data.paidProviderCount}/
                        {metricsQuery.data.providerCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Payment → access
                      </p>
                      <p className="text-xl font-semibold">
                        {metricsQuery.data.paymentToAccessSuccessPercent}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Activation ≤7d
                      </p>
                      <p className="text-xl font-semibold">
                        {metricsQuery.data.activationWithin7dPercent}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Cognitive ≤30d
                      </p>
                      <p className="text-xl font-semibold">
                        {metricsQuery.data.cognitiveWithin30dPercent}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Practical opportunity ≤14d
                      </p>
                      <p className="text-xl font-semibold">
                        {metricsQuery.data.practicalOpportunityWithin14dPercent}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Practical pass
                      </p>
                      <p className="text-xl font-semibold">
                        {metricsQuery.data.practicalPassPercent}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Remediation / open cases
                      </p>
                      <p className="text-xl font-semibold">
                        {metricsQuery.data.remediationCount} /{" "}
                        {metricsQuery.data.openCaseCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        SLA overdue
                      </p>
                      <p className="text-xl font-semibold">
                        {metricsQuery.data.overdueCaseCount}
                      </p>
                    </div>
                    <div
                      className={`sm:col-span-3 lg:col-span-6 rounded-lg border p-3 text-sm ${pilotGateGaps.length ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}
                    >
                      <p className="font-semibold">
                        Pilot gate:{" "}
                        {pilotGateGaps.length
                          ? "Current thresholds not met"
                          : "Current threshold snapshot met"}
                      </p>
                      <p className="mt-1 text-xs">
                        {pilotGateGaps.length
                          ? `Still required: ${pilotGateGaps.join("; ")}.`
                          : "Scale approval still requires two consecutive qualifying cohorts, clinical-owner assessment review, and a repeat or expanded institution order. This is an operational gate, not proof of clinical effectiveness or regulatory approval."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>3. Enroll linked providers</CardTitle>
                  <CardDescription>
                    Select active roster members who already have Paeds Resus
                    accounts. The institution pays{" "}
                    {kes(PAEDS_RESUS_ILS_BASE_PRICE_KES)} per provider in one
                    auditable M-Pesa order.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {!institutionId ? (
                    <p className="text-sm text-muted-foreground">
                      No institution workspace is linked to this account yet.
                    </p>
                  ) : rosterQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading linked providers…
                    </p>
                  ) : rosterQuery.data?.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {rosterQuery.data.map(provider => {
                        const selected = selectedStaffIds.includes(
                          provider.staffMemberId
                        );
                        return (
                          <label
                            key={provider.staffMemberId}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${selected ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "bg-background"}`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                setSelectedStaffIds(current =>
                                  selected
                                    ? current.filter(
                                        id => id !== provider.staffMemberId
                                      )
                                    : [...current, provider.staffMemberId]
                                )
                              }
                              className="mt-1 h-4 w-4"
                            />
                            <span>
                              <span className="block font-medium">
                                {provider.account?.name}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {provider.account?.email} · {provider.staffRole}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      No active linked provider accounts are available. Add
                      providers to the institutional roster and link their
                      existing Paeds Resus accounts first.
                    </p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="trainingDate">
                        Preferred training date *
                      </Label>
                      <Input
                        id="trainingDate"
                        type="date"
                        value={trainingDate}
                        onChange={event => setTrainingDate(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="institutionPaymentPhone">
                        M-Pesa number for this order *
                      </Label>
                      <Input
                        id="institutionPaymentPhone"
                        value={phoneNumber}
                        onChange={event => setPhoneNumber(event.target.value)}
                        placeholder="0712 345 678"
                      />
                    </div>
                  </div>
                  <label className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
                    <input
                      type="checkbox"
                      checked={rosterConfirmed}
                      onChange={event =>
                        setRosterConfirmed(event.target.checked)
                      }
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      <span className="block font-medium">
                        I confirm this final provider roster
                      </span>
                      <span className="text-xs opacity-80">
                        Every selected provider is the intended participant, is
                        an active institutional roster member, and has the Paeds
                        Resus account shown above. Payment cannot be transferred
                        to a different provider without an auditable
                        replacement.
                      </span>
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-4">
                    <div>
                      <p className="font-semibold">
                        Selected: {selectedProviderCount} provider(s)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total: {kes(selectedProviderTotal)}
                      </p>
                    </div>
                    <Button
                      disabled={
                        !institutionId ||
                        !trainingDate ||
                        !phoneNumber ||
                        !selectedProviderCount ||
                        !selectedSessionId ||
                        selectedSession?.sessionStatus !== "confirmed" ||
                        !claimsAcknowledged ||
                        !rosterConfirmed ||
                        createOrder.isPending
                      }
                      onClick={() => {
                        setError(null);
                        createOrder.mutate({
                          institutionId: institutionId!,
                          staffMemberIds: selectedStaffIds,
                          trainingDate: new Date(`${trainingDate}T12:00:00Z`),
                          deliverySessionId: selectedSessionId!,
                          claimsAcknowledged: true,
                          rosterConfirmed: true,
                          phoneNumber,
                        });
                      }}
                    >
                      {createOrder.isPending
                        ? "Starting payment…"
                        : "Create cohort order and send payment prompt"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Institutional Life Support orders</CardTitle>
                  <CardDescription>
                    Payment confirmation and provider enrollments remain
                    auditable here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersQuery.data?.length ? (
                    <div className="space-y-3">
                      {ordersQuery.data.map(order => (
                        <div
                          key={order.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                        >
                          <div>
                            <p className="font-semibold">
                              Order #{order.id} · {order.providerCount}{" "}
                              provider(s)
                            </p>
                            <p className="text-muted-foreground">
                              {kes(order.totalAmountKes)} ·{" "}
                              {new Date(
                                order.trainingDate
                              ).toLocaleDateString()}
                            </p>
                          <p className="text-xs text-muted-foreground">
                              Lifecycle: {order.orderStatus} · Receipt:{" "}
                              {order.paymentReceiptReference ||
                                "pending payment"}
                            </p>
                            {!!order.providers?.length && (
                              <div className="mt-2 space-y-2">
                                {order.providers.map(provider => {
                                  const staff = rosterQuery.data?.find(
                                    item =>
                                      item.staffMemberId ===
                                      provider.staffMemberId
                                  );
                                  const canReplace =
                                    [
                                      "draft",
                                      "ready_for_payment",
                                      "payment_pending",
                                      "paid",
                                    ].includes(order.orderStatus) &&
                                    provider.assignmentStatus === "active";
                                  return (
                                    <div
                                      key={provider.id}
                                      className="rounded-md border bg-muted/20 p-2 text-xs"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span>
                                          {staff?.account?.name ||
                                            `Provider account #${provider.userId}`}{" "}
                                          · {provider.assignmentStatus}
                                        </span>
                                        {canReplace && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setReplacementAssignmentId(
                                                provider.id
                                              )
                                            }
                                          >
                                            Replace provider
                                          </Button>
                                        )}
                                      </div>
                                      {replacementAssignmentId ===
                                        provider.id && (
                                        <div className="mt-2 space-y-2">
                                          <select
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2"
                                            value={replacementStaffMemberId}
                                            onChange={event =>
                                              setReplacementStaffMemberId(
                                                event.target.value
                                              )
                                            }
                                          >
                                            <option value="">
                                              Select an existing Paeds Resus
                                              account
                                            </option>
                                            {rosterQuery.data
                                              ?.filter(
                                                item =>
                                                  item.userId != null &&
                                                  !order.providers?.some(
                                                    other =>
                                                      other.assignmentStatus ===
                                                        "active" &&
                                                      other.userId ===
                                                        item.userId
                                                  )
                                              )
                                              .map(item => (
                                                <option
                                                  key={item.staffMemberId}
                                                  value={item.staffMemberId}
                                                >
                                                  {item.account?.name} ·{" "}
                                                  {item.account?.email}
                                                </option>
                                              ))}
                                          </select>
                                          <Input
                                            value={replacementReason}
                                            onChange={event =>
                                              setReplacementReason(
                                                event.target.value
                                              )
                                            }
                                            placeholder="Reason for replacement"
                                            maxLength={255}
                                          />
                                          <div className="flex flex-wrap gap-2">
                                            <Button
                                              size="sm"
                                              disabled={
                                                !replacementStaffMemberId ||
                                                !replacementReason.trim() ||
                                                replaceInstitutionProvider.isPending
                                              }
                                              onClick={() => {
                                                if (
                                                  !window.confirm(
                                                    "Replace this provider? The old assignment will remain in the audit history and the selected existing account will take the same paid or pending place."
                                                  )
                                                )
                                                  return;
                                                replaceInstitutionProvider.mutate(
                                                  {
                                                    institutionId:
                                                      institutionId!,
                                                    orderId: order.id,
                                                    providerAssignmentId:
                                                      provider.id,
                                                    replacementStaffMemberId:
                                                      Number(
                                                        replacementStaffMemberId
                                                      ),
                                                    reason:
                                                      replacementReason.trim(),
                                                  }
                                                );
                                              }}
                                            >
                                              {replaceInstitutionProvider.isPending
                                                ? "Replacing…"
                                                : "Confirm replacement"}
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                setReplacementAssignmentId(null)
                                              }
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={
                              order.paymentStatus === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {order.paymentStatus}
                          </Badge>
                        {order.paymentStatus === "pending" &&
                              [
                                "draft",
                                "ready_for_payment",
                                "payment_pending",
                              ].includes(order.orderStatus) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCancelOrderId(order.id)}
                                  >
                                    Cancel pending order
                                  </Button>
                                  {cancelOrderId === order.id && (
                                    <div className="w-full max-w-xs space-y-2 rounded-md border bg-background p-2">
                                      <Input
                                        value={cancelOrderReason}
                                        onChange={event =>
                                          setCancelOrderReason(
                                            event.target.value
                                          )
                                        }
                                        placeholder="Reason for cancellation"
                                        maxLength={255}
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          disabled={
                                            !cancelOrderReason.trim() ||
                                            cancelInstitutionOrder.isPending
                                          }
                                          onClick={() => {
                                            if (
                                              !window.confirm(
                                                "Cancel this unpaid ILS order? Pending payment, provider assignments, and reserved capacity will be closed while the audit history is retained."
                                              )
                                            )
                                              return;
                                            cancelInstitutionOrder.mutate({
                                              institutionId: institutionId!,
                                              orderId: order.id,
                                              reason: cancelOrderReason.trim(),
                                            });
                                          }}
                                        >
                                          {cancelInstitutionOrder.isPending
                                            ? "Cancelling…"
                                            : "Confirm cancellation"}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setCancelOrderId(null)}
                                        >
                                          Keep order
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No orders yet.
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>4. Provider completion register</CardTitle>
                  <CardDescription>
                    Use this register as the operational source of truth for
                    every paid provider, practical result, and Paeds Resus
                    certificate.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {providerRegisterQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading provider register…
                    </p>
                  ) : providerRegisterQuery.data?.length ? (
                    providerRegisterQuery.data.map(provider => {
                      const progress = provider.certificateNumber
                        ? "Paeds Resus certificate issued"
                        : provider.practicalSkillsSignedOff
                          ? "Practical sign-off complete"
                          : provider.cognitiveModulesComplete
                            ? "Cognitive complete"
                            : provider.activatedAt
                              ? "Activated"
                              : "Not activated";
                      return (
                        <div
                          key={`${provider.orderId}-${provider.providerAssignmentId}`}
                          className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {provider.providerName ||
                                `Provider account #${provider.userId}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {provider.providerEmail || "No saved email"} ·
                              order #{provider.orderId}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Payment
                            </p>
                            <p>
                              {provider.paymentStatus}{" "}
                              {provider.paymentReceiptReference
                                ? `· ${provider.paymentReceiptReference}`
                                : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Progress
                            </p>
                            <p>
                              {progress} · {provider.assignmentStatus}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {provider.certificateExpiryDate
                              ? `Expires ${new Date(provider.certificateExpiryDate).toLocaleDateString()}`
                              : provider.trainingDate
                                ? `Training ${new Date(provider.trainingDate).toLocaleDateString()}`
                                : "Date not set"}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No provider assignments recorded yet.
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>5. Pilot governance and scorecard</CardTitle>
                  <CardDescription>
                    Create a controlled pilot for a training provider or
                    faith-based hospital, then record the delivery measures
                    before expanding.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label htmlFor="ils-pilot-segment">Pilot segment</Label>
                      <select
                        id="ils-pilot-segment"
                        className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={pilotSegment}
                        onChange={event =>
                          setPilotSegment(
                            event.target.value as typeof pilotSegment
                          )
                        }
                      >
                        <option value="training_provider">
                          Training provider
                        </option>
                        <option value="faith_based_hospital">
                          Faith-based hospital
                        </option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="ils-pilot-name">Pilot name</Label>
                      <Input
                        id="ils-pilot-name"
                        value={pilotName}
                        onChange={event => setPilotName(event.target.value)}
                        placeholder="e.g. First provider cohort"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ils-pilot-target">Target providers</Label>
                      <Input
                        id="ils-pilot-target"
                        type="number"
                        min={1}
                        max={200}
                        value={pilotTargetCount}
                        onChange={event =>
                          setPilotTargetCount(event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="ils-pilot-minimum">
                        Minimum providers
                      </Label>
                      <Input
                        id="ils-pilot-minimum"
                        type="number"
                        min={1}
                        max={200}
                        value={pilotMinimumCount}
                        onChange={event =>
                          setPilotMinimumCount(event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="ils-pilot-start">
                        Target start date *
                      </Label>
                      <Input
                        id="ils-pilot-start"
                        type="date"
                        value={pilotStartDate}
                        onChange={event =>
                          setPilotStartDate(event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="ils-pilot-clinical-owner">
                        Clinical owner *
                      </Label>
                      <select
                        id="ils-pilot-clinical-owner"
                        className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={pilotClinicalOwnerId}
                        onChange={event =>
                          setPilotClinicalOwnerId(event.target.value)
                        }
                      >
                        <option value="">Select approved instructor</option>
                        {instructorsQuery.data?.map(instructor => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.name ||
                              instructor.email ||
                              `Instructor #${instructor.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The creating coordinator is recorded as the operational
                    owner. The clinical owner must be an approved and certified
                    Paeds Resus instructor.
                  </p>
                  <Button
                    disabled={
                      !institutionId ||
                      !pilotName.trim() ||
                      !pilotStartDate ||
                      !pilotClinicalOwnerId ||
                      createPilotCohort.isPending
                    }
                    onClick={() =>
                      createPilotCohort.mutate({
                        institutionId: institutionId!,
                        segment: pilotSegment,
                        name: pilotName.trim(),
                        targetProviderCount: Number(pilotTargetCount),
                        minimumProviderCount: Number(pilotMinimumCount),
                        targetStartDate: new Date(
                          `${pilotStartDate}T12:00:00Z`
                        ),
                        clinicalOwnerUserId: Number(pilotClinicalOwnerId),
                      })
                    }
                  >
                    {createPilotCohort.isPending
                      ? "Creating pilot…"
                      : "Create pilot cohort"}
                  </Button>
                  {!!pilotCohortsQuery.data?.length && (
                    <div className="space-y-2">
                      <Label>Existing pilot cohorts</Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {pilotCohortsQuery.data.map(pilot => (
                          <button
                            key={pilot.id}
                            type="button"
                            className={`rounded-lg border p-3 text-left text-sm ${selectedPilotId === pilot.id ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "bg-background"}`}
                            onClick={() => setSelectedPilotId(pilot.id)}
                          >
                            <span className="block font-medium">
                              {pilot.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {pilot.segment.replaceAll("_", " ")} · target{" "}
                              {pilot.targetProviderCount} · {pilot.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedPilotId && (
                    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                      {pilotMetricsQuery.data?.[0] && (
                        <div className="rounded-md border bg-background p-3 text-sm">
                          <p className="font-medium">
                            Latest recorded scorecard
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Measured{" "}
                            {new Date(
                              pilotMetricsQuery.data[0].measuredAt
                            ).toLocaleDateString()}{" "}
                            · payment-to-access{" "}
                            {
                              pilotMetricsQuery.data[0]
                                .paymentToAccessSuccessPercent
                            }
                            % · activation ≤7d{" "}
                            {
                              pilotMetricsQuery.data[0]
                                .activationWithin7dPercent
                            }
                            % · practical opportunity ≤14d{" "}
                            {
                              pilotMetricsQuery.data[0]
                                .practicalOpportunityWithin14dPercent
                            }
                            % · practical pass{" "}
                            {pilotMetricsQuery.data[0].practicalPassPercent}%
                          </p>
                        </div>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                          <Label htmlFor="ils-metric-payment">
                            Payment → access %
                          </Label>
                          <Input
                            id="ils-metric-payment"
                            type="number"
                            min={0}
                            max={100}
                            value={paymentToAccessPercent}
                            onChange={event =>
                              setPaymentToAccessPercent(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="ils-metric-activation">
                            Activation ≤7 days %
                          </Label>
                          <Input
                            id="ils-metric-activation"
                            type="number"
                            min={0}
                            max={100}
                            value={activationWithin7dPercent}
                            onChange={event =>
                              setActivationWithin7dPercent(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="ils-metric-cognitive">
                            Cognitive ≤30 days %
                          </Label>
                          <Input
                            id="ils-metric-cognitive"
                            type="number"
                            min={0}
                            max={100}
                            value={cognitiveWithin30dPercent}
                            onChange={event =>
                              setCognitiveWithin30dPercent(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="ils-metric-practical">
                            Practical opportunity ≤14 days %
                          </Label>
                          <Input
                            id="ils-metric-practical"
                            type="number"
                            min={0}
                            max={100}
                            value={practicalWithin14dPercent}
                            onChange={event =>
                              setPracticalWithin14dPercent(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="ils-metric-pass">
                            Practical pass %
                          </Label>
                          <Input
                            id="ils-metric-pass"
                            type="number"
                            min={0}
                            max={100}
                            value={practicalPassPercent}
                            onChange={event =>
                              setPracticalPassPercent(event.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <Label htmlFor="ils-metric-support">
                            Support minutes / provider
                          </Label>
                          <Input
                            id="ils-metric-support"
                            type="number"
                            min={0}
                            value={supportMinutesPerProvider}
                            onChange={event =>
                              setSupportMinutesPerProvider(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="ils-metric-cost">
                            Cost / provider (KES)
                          </Label>
                          <Input
                            id="ils-metric-cost"
                            type="number"
                            min={0}
                            value={costPerProviderKes}
                            onChange={event =>
                              setCostPerProviderKes(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="ils-metric-margin">
                            Margin / provider (KES)
                          </Label>
                          <Input
                            id="ils-metric-margin"
                            type="number"
                            value={marginPerProviderKes}
                            onChange={event =>
                              setMarginPerProviderKes(event.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <Label htmlFor="ils-metric-satisfaction">
                            Coordinator satisfaction (1–5)
                          </Label>
                          <Input
                            id="ils-metric-satisfaction"
                            type="number"
                            min={1}
                            max={5}
                            value={coordinatorSatisfaction}
                            onChange={event =>
                              setCoordinatorSatisfaction(event.target.value)
                            }
                          />
                        </div>
                        <Button
                          disabled={recordPilotMetrics.isPending}
                          onClick={() =>
                            recordPilotMetrics.mutate({
                              institutionId: institutionId!,
                              pilotCohortId: selectedPilotId,
                              paymentToAccessSuccessPercent: Number(
                                paymentToAccessPercent
                              ),
                              activationWithin7dPercent: Number(
                                activationWithin7dPercent
                              ),
                              cognitiveWithin30dPercent: Number(
                                cognitiveWithin30dPercent
                              ),
                              practicalOpportunityWithin14dPercent: Number(
                                practicalWithin14dPercent
                              ),
                              practicalPassPercent:
                                Number(practicalPassPercent),
                              supportMinutesPerProvider:
                                supportMinutesPerProvider
                                  ? Number(supportMinutesPerProvider)
                                  : undefined,
                              costPerProviderKes: costPerProviderKes
                                ? Number(costPerProviderKes)
                                : undefined,
                              marginPerProviderKes: marginPerProviderKes
                                ? Number(marginPerProviderKes)
                                : undefined,
                              coordinatorSatisfactionScore:
                                coordinatorSatisfaction
                                  ? Number(coordinatorSatisfaction)
                                  : undefined,
                            })
                          }
                        >
                          {recordPilotMetrics.isPending
                            ? "Saving scorecard…"
                            : "Record pilot scorecard"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>5. Operational support</CardTitle>
                  <CardDescription>
                    Record payment, roster, access, delivery, assessment,
                    certificate, or AHA handoff issues where the team can track
                    ownership and resolution.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                    <div>
                      <Label htmlFor="ils-case-category">Issue category</Label>
                      <select
                        id="ils-case-category"
                        className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={caseCategory}
                        onChange={event =>
                          setCaseCategory(
                            event.target.value as typeof caseCategory
                          )
                        }
                      >
                        <option value="payment">Payment</option>
                        <option value="roster">Roster</option>
                        <option value="access">Access</option>
                        <option value="delivery">Delivery</option>
                        <option value="assessment">Assessment</option>
                        <option value="certificate">Certificate</option>
                        <option value="aha_credentialing">
                          AHA credentialing
                        </option>
                        <option value="support">General support</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="ils-case-summary">
                        Short description
                      </Label>
                      <Input
                        id="ils-case-summary"
                        value={caseSummary}
                        onChange={event => setCaseSummary(event.target.value)}
                        placeholder="What needs attention?"
                      />
                    </div>
                  </div>
                  <Textarea
                    value={caseDetails}
                    onChange={event => setCaseDetails(event.target.value)}
                    placeholder="Add enough detail for the operational owner to reproduce and resolve the issue."
                  />
                  <Button
                    variant="outline"
                    disabled={
                      !institutionId ||
                      !caseSummary.trim() ||
                      createOperationalCase.isPending
                    }
                    onClick={() =>
                      createOperationalCase.mutate({
                        institutionId: institutionId!,
                        category: caseCategory,
                        summary: caseSummary.trim(),
                        details: caseDetails.trim() || undefined,
                      })
                    }
                  >
                    {createOperationalCase.isPending
                      ? "Opening case…"
                      : "Open operational case"}
                  </Button>
                  {!!operationalCasesQuery.data?.length && (
                    <div className="space-y-2">
                      <Label>Open cases</Label>
                      {operationalCasesQuery.data.slice(0, 5).map(item => {
                        const overdue = Boolean(
                          item.slaDueAt &&
                            new Date(item.slaDueAt).getTime() < Date.now());
                        return (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                          >
                            <span>
                              <span className="font-medium">
                                {item.summary}
                    </span>
                              <span className="ml-2 text-xs text-muted-foreground">
                  {item.category} · {item.priority} · SLA{" "}
                                {item.slaDueAt
                                  ? new Date(item.slaDueAt).toLocaleString() : "not set"}
                              </span>
                            </span>
                    <Badge
                              variant={
                                overdue || item.priority === "critical"
                                  ? "destructive"
                                  : "secondary"
                              }>
                      {overdue ? "overdue" : item.
                    status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="programme" className="mt-6">
              <ProgrammeDetails course={course} pricing={pricing} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                  <CardTitle>Your assigned provider pathway</CardTitle>
                  <CardDescription>
                  Your institution selects and pays for provider places in bulk.
                  Complete the Paeds Resus learning and practical steps after
                  your institution confirms your place.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {!enrollment ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                    <p className="font-semibold">Waiting for institution assignment</p>
                    <p className="mt-1">
                      ILS is not an individual purchase. Ask your institution coordinator
                      to add your existing Paeds Resus account to a provider cohort and
                      complete the single bulk payment.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                      <div>
                        <p className="font-semibold">
                          Enrollment #{enrollment.id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Payment: {enrollment.paymentStatus} · Cognitive:{" "}
                          {enrollment.cognitiveModulesComplete
                            ? "complete"
                            : "pending"}{" "}
                          · Practical:{" "}
                          {enrollment.practicalSkillsSignedOff
                            ? "signed off"
                            : "pending"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          enrollment.paymentStatus === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {enrollment.paymentStatus}
                      </Badge>
                    </div>
                    {enrollment.paymentStatus !== "completed" ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                        <p className="font-semibold">Institution payment pending</p>
                        <p className="mt-1">
                          Your institution must complete the bulk provider order before
                          the learning modules can open. No individual payment is due here.
                        </p>
                        <Button
                          className="mt-3"
                          size="sm"
                          variant="outline"
                          disabled={cancelPendingEnrollment.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Cancel this unpaid Institutional Life Support enrollment? This preserves the record for audit and lets your institution assign you again later."
                              )
                            ) {
                              cancelPendingEnrollment.mutate({
                                enrollmentId: enrollment.id,
                              });
                            }
                          }}
                        >
                          {cancelPendingEnrollment.isPending
                            ? "Cancelling…"
                            : "Cancel pending enrollment"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={openCourse}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          {enrollment.cognitiveModulesComplete
                            ? "Review learning"
                            : "Open learning modules"}
                        </Button>
                        {enrollment.practicalSkillsSignedOff &&
                          enrollment.certificateNumber && (
                            <Button
                              variant="outline"
                              onClick={() => navigate("/my-cpd-certificates")}
                            >
                              <Award className="mr-2 h-4 w-4" />
                              View certificate
                            </Button>
                          )}
                      </div>
                    )}
                    {enrollment.paymentStatus === "completed" &&
                      !enrollment.practicalSkillsSignedOff && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                          <strong>Practical step pending:</strong> after the
                          learning and final knowledge check, attend an approved
                          Paeds Resus practical assessment for instructor
                          sign-off.
                        </div>
                      )}
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Optional AHA credentialing</CardTitle>
                <CardDescription>
                  Available only after Paeds Resus certification, without extra
                  training during the open window.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                  <Clock3 className="mb-2 h-5 w-5" />
                  <p>
                    <strong>Three-month window:</strong> the request and payment
                    must be completed within 90 days of the Paeds Resus
                    certificate issue date.
                  </p>
                </div>
                {enrollment?.credentialingWindowOpen ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["bls", "acls"] as const).map(credential => (
                      <Button
                        key={credential}
                        variant="outline"
                        disabled={
                          !enrollment.certificateNumber ||
                          requestCredential.isPending
                        }
                        onClick={() =>
                          requestCredential.mutate({
                            enrollmentId: enrollment.id,
                            credentialType: credential,
                          })
                        }
                      >
                        {credential.toUpperCase()} add-on ·{" "}
                        {kes(PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES[credential])}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Complete Paeds Resus certification to open this option.
                    After 90 days, a new full training enrolment applies: BLS{" "}
                    {kes(PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES.bls)} or
                    ACLS{" "}
                    {kes(PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES.acls)}.
                  </p>
                )}
                {activeCredentialRequest && (
                  <div className="space-y-3 rounded-lg border p-4 text-sm">
                    <p className="font-semibold">
                      {activeCredentialRequest.credentialType.toUpperCase()}{" "}
                      request · {activeCredentialRequest.status}
                    </p>
                    <p className="text-muted-foreground">
                      Deadline:{" "}
                      {new Date(
                        activeCredentialRequest.credentialingDeadline
                      ).toLocaleDateString()}
                    </p>
                    {activeCredentialRequest.status === "payment_pending" && activeCredentialRequest.windowOpen && (
                      <>
                        <Label htmlFor="credentialPaymentPhone">
                          M-Pesa number *
                        </Label>
                        <Input
                          id="credentialPaymentPhone"
                          value={phoneNumber}
                          onChange={event => setPhoneNumber(event.target.value)}
                        />
                        <Button
                          onClick={() =>
                            payCredential.mutate({
                              requestId: activeCredentialRequest.id,
                              phoneNumber,
                            })
                          }
                          disabled={!phoneNumber || payCredential.isPending}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay {kes(activeCredentialRequest.amountKes)} and
                          submit
                        </Button>
                      </>
                    )}
                  {activeCredentialRequest.status === "payment_pending" &&
                      !activeCredentialRequest.windowOpen && (
                        <p className="text-sm text-amber-800">
                          This request is outside the 90-day AHA credentialing
                          window and cannot be paid at the add-on price. A new
                          full-training enrolment is required; Platform Ops will
                          retain the request for audit.
                        </p>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {!!assessmentRosterQuery.data?.length && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Assigned practical assessments</CardTitle>
              <CardDescription>
                Use the approved practical checklist. Record the outcome and
                concise evidence here; a pass still requires the normal Paeds
                Resus certificate gate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {assessmentRosterQuery.data.map(session => (
                <div key={session.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {new Date(session.scheduledDate).toLocaleDateString()} ·{" "}
                        {session.location || "Venue to be confirmed"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.participants.length} provider(s) ·{" "}
                        {session.sessionStatus}
                      </p>
                    </div>
                    <Badge variant="secondary">Assigned instructor</Badge>
                  </div>
                  <div className="space-y-2">
                    {session.participants.map(participant => (
                      <div
                        key={participant.enrollmentId ?? participant.userId}
                        className="rounded-lg border bg-muted/20 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {participant.name ||
                                `Provider ${participant.userId}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {participant.email || "No saved email"} ·
                              cognitive{" "}
                              {participant.cognitiveModulesComplete
                                ? "complete"
                                : "pending"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!participant.enrollmentId}
                            onClick={() => {
                              if (
                                assessmentEnrollmentId !==
                                participant.enrollmentId
                              )
                                resetAssessmentForm();
                              setAssessmentEnrollmentId(
                                participant.enrollmentId
                              );
                            }}
                          >
                            {assessmentEnrollmentId === participant.enrollmentId
                              ? "Editing assessment"
                              : "Record assessment"}
                          </Button>
                        </div>
                        {assessmentEnrollmentId === participant.enrollmentId &&
                          participant.enrollmentId && (
                            <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                              <div>
                                <Label
                                  htmlFor={`assessment-result-${participant.enrollmentId}`}
                                >
                                  Result
                                </Label>
                                <select
                                  id={`assessment-result-${participant.enrollmentId}`}
                                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  value={assessmentResult}
                                  onChange={event =>
                                    setAssessmentResult(
                                      event.target
                                        .value as typeof assessmentResult
                                    )
                                  }
                                >
                                  <option value="pass">Pass</option>
                                  <option value="remediation_required">
                                    Remediation required
                                  </option>
                                  <option value="fail">Fail</option>
                                  <option value="no_show">No show</option>
                                </select>
                              </div>
                              <div>
                                <Label
                                  htmlFor={`assessment-score-${participant.enrollmentId}`}
                                >
                                  Score (if used by approved checklist)
                                </Label>
                                <Input
                                  id={`assessment-score-${participant.enrollmentId}`}
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={assessmentScore}
                                  onChange={event =>
                                    setAssessmentScore(event.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor={`assessment-checklist-${participant.enrollmentId}`}
                                >
                                  Checklist version
                                </Label>
                                <Input
                                  id={`assessment-checklist-${participant.enrollmentId}`}
                                  value={assessmentChecklistVersion}
                                  onChange={event =>
                                    setAssessmentChecklistVersion(
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                              {assessmentResult === "remediation_required" && (
                                <div>
                                  <Label
                                    htmlFor={`assessment-remediation-${participant.enrollmentId}`}
                                  >
                                    Remediation due
                                  </Label>
                                  <Input
                                    id={`assessment-remediation-${participant.enrollmentId}`}
                                    type="date"
                                    value={remediationDueAt}
                                    onChange={event =>
                                      setRemediationDueAt(event.target.value)
                                    }
                                  />
                                </div>
                              )}
                              {assessmentResult === "remediation_required" && (
                                <div>
                                  <Label
                                    htmlFor={`assessment-second-assessor-${participant.enrollmentId}`}
                                  >
                                    Second approved assessor *
                                  </Label>
                                  <select
                                    id={`assessment-second-assessor-${participant.enrollmentId}`}
                                    className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={assessmentSecondAssessorUserId}
                                    onChange={event =>
                                      setAssessmentSecondAssessorUserId(
                                        event.target.value
                                      )
                                    }
                                  >
                                    <option value="">Select assessor</option>
                                    {instructorsQuery.data
                                      ?.filter(
                                        instructor => instructor.id !== user?.id
                                      )
                                      .map(instructor => (
                                        <option
                                          key={instructor.id}
                                          value={instructor.id}
                                        >
                                          {instructor.name ||
                                            instructor.email ||
                                            `Assessor #${instructor.id}`}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              )}
                              <label className="sm:col-span-2 flex items-start gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={assessmentCalibrationConfirmed}
                                  onChange={event =>
                                    setAssessmentCalibrationConfirmed(
                                      event.target.checked
                                    )
                                  }
                                  className="mt-1 h-4 w-4"
                                />
                                <span>
                                  <span className="font-medium">
                                    Checklist reviewed and calibrated for this
                                    assessment
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    Record only after the approved ILS checklist
                                    and assessor calibration process have been
                                    followed.
                                  </span>
                                </span>
                              </label>
                              <div className="sm:col-span-2">
                                <Label
                                  htmlFor={`assessment-notes-${participant.enrollmentId}`}
                                >
                                  Evidence / assessor note
                                </Label>
                                <Textarea
                                  id={`assessment-notes-${participant.enrollmentId}`}
                                  value={assessmentNotes}
                                  onChange={event =>
                                    setAssessmentNotes(event.target.value)
                                  }
                                  placeholder="Record the approved checklist summary, observed strengths, and any remediation action."
                                />
                              </div>
                              <Button
                                className="sm:col-span-2"
                                disabled={
                                  recordPracticalAssessment.isPending ||
                                  !assessmentCalibrationConfirmed ||
                                  (assessmentResult ===
                                    "remediation_required" &&
                                    !assessmentSecondAssessorUserId)
                                }
                                onClick={() =>
                                  recordPracticalAssessment.mutate({
                                    institutionId:
                                      session.institutionalAccountId,
                                    enrollmentId: participant.enrollmentId!,
                                    deliverySessionId: session.id,
                                    result: assessmentResult,
                                    score: assessmentScore
                                      ? Number(assessmentScore)
                                      : undefined,
                                    checklistVersion:
                                      assessmentChecklistVersion.trim() ||
                                      "ils-v1",
                                    assessorCalibrationConfirmed:
                                      assessmentCalibrationConfirmed,
                                    secondAssessorUserId:
                                      assessmentSecondAssessorUserId
                                        ? Number(assessmentSecondAssessorUserId)
                                        : undefined,
                                    notes: assessmentNotes.trim() || undefined,
                                    remediationDueAt:
                                      assessmentResult ===
                                        "remediation_required" &&
                                      remediationDueAt
                                        ? new Date(
                                            `${remediationDueAt}T12:00:00Z`
                                          )
                                        : undefined,
                                  })
                                }
                              >
                                {recordPracticalAssessment.isPending
                                  ? "Saving assessment…"
                                  : "Save practical assessment"}
                              </Button>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
                ))}
              </CardContent>
            </Card>

        )}
      </div>
    </div>
  );
}

function ProgrammeDetails({
  course,
  pricing,
}: {
  course?: {
    title: string;
    description: string | null;
    duration: number | null;
  };
  pricing?: {
    providerPriceKes: number;
    credentialingWindowDays: number;
    ahaAddOnPricesKes: { bls: number; acls: number };
    ahaFullTrainingPricesKes: { bls: number; acls: number };
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {course?.title ?? "Institutional Life Support Training Program"}
        </CardTitle>
        <CardDescription>{course?.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Provider fee:{" "}
            {kes(pricing?.providerPriceKes ?? PAEDS_RESUS_ILS_BASE_PRICE_KES)}{" "}
            per provider.
          </li>
          <li>
            Completion issues a Paeds Resus competency certificate. It does not
            issue an AHA certificate.
          </li>
          <li>
            After certification, BLS credentialing is{" "}
            {kes(
              pricing?.ahaAddOnPricesKes.bls ??
                PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES.bls
            )}{" "}
            and ACLS credentialing is{" "}
            {kes(
              pricing?.ahaAddOnPricesKes.acls ??
                PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES.acls
            )}{" "}
            when requested and paid within{" "}
            {pricing?.credentialingWindowDays ?? 90} days.
          </li>
          <li>
            No extra training is required for an in-window add-on, but the
            request remains subject to separate AHA credentialing review.
          </li>
          <li>
            After the window, a new full training enrolment applies: BLS{" "}
            {kes(
              pricing?.ahaFullTrainingPricesKes.bls ??
                PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES.bls
            )}{" "}
            or ACLS{" "}
            {kes(
              pricing?.ahaFullTrainingPricesKes.acls ??
                PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES.acls
            )}
            .
          </li>
        </ul>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
          This programme is not a shortcut around clinical assessment. Follow
          current local paediatric resuscitation guidance, complete practical
          verification, and escalate uncertainty to an approved instructor or
          senior clinician.
        </p>
      </CardContent>
    </Card>
  );
}
