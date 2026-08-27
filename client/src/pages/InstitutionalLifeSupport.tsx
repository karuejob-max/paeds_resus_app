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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PAEDS_RESUS_ILS_BASE_PRICE_KES,
  PAEDS_RESUS_ILS_AHA_ADD_ON_PRICES_KES,
  PAEDS_RESUS_ILS_AHA_FULL_TRAINING_PRICES_KES,
} from "@shared/institutional-life-support";

const kes = (amount: number) => `KES ${amount.toLocaleString()}`;

export default function InstitutionalLifeSupport() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const isInstitutionUser = user?.userType === "institutional";
  const institutionQuery = trpc.institution.getMyInstitution.useQuery(
    undefined,
    { enabled: isAuthenticated && isInstitutionUser }
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
  const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? "");
  const [trainingDate, setTrainingDate] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCredentialRequestId, setActiveCredentialRequestId] = useState<
    number | null
  >(null);

  const enroll = trpc.institutionalLifeSupport.enroll.useMutation({
    onSuccess: () => {
      setMessage(
        "Enrollment created. Pay the KES 10,000 provider fee before opening the learning modules."
      );
      void enrollmentQuery.refetch();
    },
    onError: err => setError(err.message),
  });
  const payEnrollment =
    trpc.institutionalLifeSupport.initiateEnrollmentPayment.useMutation({
      onSuccess: result => {
        setMessage(
          result.alreadyPaid
            ? result.message
            : `M-Pesa prompt sent for ${kes(result.amountKes ?? PAEDS_RESUS_ILS_BASE_PRICE_KES)}. Complete it on your phone, then refresh this page.`
        );
        void enrollmentQuery.refetch();
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

  if (!isAuthenticated) {
    return (
      <Card className="mx-auto mt-12 max-w-xl">
        <CardHeader>
          <CardTitle>Sign in to use Institutional Life Support</CardTitle>
          <CardDescription>
            Use your Paeds Resus account to enrol personally or manage an
            institutional cohort.
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
        "Pay the KES 10,000 provider fee before opening the learning modules."
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
                  Paeds Resus competency programme
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
              <Card>
                <CardHeader>
                  <CardTitle>Enroll linked providers</CardTitle>
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
                        createOrder.isPending
                      }
                      onClick={() => {
                        setError(null);
                        createOrder.mutate({
                          institutionId: institutionId!,
                          staffMemberIds: selectedStaffIds,
                          trainingDate: new Date(`${trainingDate}T12:00:00Z`),
                          phoneNumber,
                        });
                      }}
                    >
                      {createOrder.isPending
                        ? "Starting payment…"
                        : "Create cohort order and pay"}
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
                          </div>
                          <Badge
                            variant={
                              order.paymentStatus === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {order.paymentStatus}
                          </Badge>
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
            </TabsContent>
            <TabsContent value="programme" className="mt-6">
              <ProgrammeDetails course={course} pricing={pricing} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>Your provider pathway</CardTitle>
                <CardDescription>
                  Complete the Paeds Resus learning and practical steps in
                  order. Payment is required before the modules open.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {!enrollment ? (
                  <Button
                    onClick={() => enroll.mutate()}
                    disabled={enroll.isPending}
                  >
                    {enroll.isPending
                      ? "Preparing enrollment…"
                      : `Start for ${kes(PAEDS_RESUS_ILS_BASE_PRICE_KES)}`}
                  </Button>
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
                      <div className="space-y-3">
                        <Label htmlFor="providerPaymentPhone">
                          M-Pesa number *
                        </Label>
                        <Input
                          id="providerPaymentPhone"
                          value={phoneNumber}
                          onChange={event => setPhoneNumber(event.target.value)}
                          placeholder="0712 345 678"
                        />
                        <Button
                          onClick={() =>
                            payEnrollment.mutate({
                              enrollmentId: enrollment.id,
                              phoneNumber,
                            })
                          }
                          disabled={!phoneNumber || payEnrollment.isPending}
                        >
                          {payEnrollment.isPending
                            ? "Starting payment…"
                            : `Pay ${kes(PAEDS_RESUS_ILS_BASE_PRICE_KES)}`}
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
                    {activeCredentialRequest.status === "payment_pending" && (
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
