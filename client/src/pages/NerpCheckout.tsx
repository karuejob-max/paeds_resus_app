import { Link } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MpesaPaymentForm } from "@/components/MpesaPaymentForm";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function NerpCheckout() {
  const { user, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login?redirect=%2Fprograms%2Fnerp-acls%2Fenroll",
  });
  const utils = trpc.useUtils();
  const checkout = trpc.nerp.getCheckoutContext.useQuery(undefined, {
    enabled: Boolean(user),
  });

  if (authLoading || checkout.isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (checkout.isError || !checkout.data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />
        <h1 className="mt-4 text-xl font-semibold">
          NERP checkout is unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {checkout.error?.message ?? "Please try again shortly."}
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/programs/nerp-acls">Back to the offer</Link>
        </Button>
      </div>
    );
  }

  const { offer, paymentState, amount, installmentNumber, enrollmentId } =
    checkout.data;
  const isComplete = paymentState.status === "completed";

  const refresh = () => {
    void checkout.refetch();
    void utils.nerp.getMyEnrollment.invalidate();
  };

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href="/programs/nerp-acls">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to NERP pathway
          </Link>
        </Button>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            Secure enrollment
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            NERP ACLS pathway
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Your BLS and ACLS learning records are linked to one six-payment
            pathway.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment plan</CardTitle>
                <CardDescription>
                  Use M-Pesa to pay the next installment. Your account phone is
                  prefilled and can be replaced before sending the prompt.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total pathway
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    KES {Number(offer.totalAmountKes).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Paid so far
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">
                    KES {paymentState.amountPaidKes.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Balance
                  </p>
                  <p className="mt-1 text-2xl font-bold text-brand-orange">
                    KES {paymentState.balanceKes.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning pathway</CardTitle>
                <CardDescription>
                  Payment unlocks the linked course records; certification
                  remains subject to course requirements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">Paeds Resus BLS</p>
                    <p className="text-xs text-muted-foreground">
                      Included course record
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/training/bls">Open BLS</Link>
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">AHA ACLS</p>
                    <p className="text-xs text-muted-foreground">
                      Included course record
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/training/acls">Open ACLS</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {isComplete ? (
              <Card className="border-emerald-200 bg-emerald-50/60">
                <CardHeader>
                  <CheckCircle2 className="h-7 w-7 text-emerald-700" />
                  <CardTitle>Pathway paid in full</CardTitle>
                  <CardDescription>
                    Your payment ledger is complete. Continue with the linked
                    course requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="cta">
                    <Link href="/training/acls">Continue to ACLS</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <MpesaPaymentForm
                courseId="acls"
                courseName={`NERP ACLS installment ${installmentNumber} of ${offer.installmentCount}`}
                amount={amount}
                enrollmentId={enrollmentId}
                initialPhoneNumber={user?.phone ?? ""}
                nerpOfferEnrollmentId={offer.id}
                installmentNumber={installmentNumber}
                onPaymentComplete={refresh}
              />
            )}
            <Card className="border-blue-100 bg-blue-50/50">
              <CardContent className="flex items-start gap-3 pt-6">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                <p className="text-sm leading-6 text-blue-950/80">
                  Payment status is recorded against your NERP ledger. We do not
                  change your profile phone number when you use an alternate
                  M-Pesa number.
                </p>
              </CardContent>
            </Card>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                Installment {installmentNumber} / {offer.installmentCount}
              </Badge>
              <span>Next payment: KES {amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
