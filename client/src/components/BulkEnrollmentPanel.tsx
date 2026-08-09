import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Live quote + M-Pesa STK push for institutional bulk enrollment (pay for a
 * whole cohort of staff into one course at once, with a bulk discount).
 * Distinct from institution.bulkEnrollFromStaffRoster (used elsewhere in
 * this dashboard), which creates enrollment records directly with no quote
 * or payment step -- this is the pay-as-you-go purchase flow.
 * Extracted from client/src/pages/InstitutionalPortal.tsx (2026-08-08) --
 * that page is not routed anywhere, so this had zero reachable UI despite
 * the backend being fully built.
 */
export function BulkEnrollmentPanel({
  institutionId,
  courseType,
  setCourseType,
  trainingDate,
  setTrainingDate,
  phone,
  setPhone,
}: {
  institutionId: number;
  courseType: "bls" | "acls" | "pals";
  setCourseType: (v: "bls" | "acls" | "pals") => void;
  trainingDate: string;
  setTrainingDate: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
}) {
  const quoteQuery = trpc.institution.getBulkEnrollmentQuote.useQuery(
    { institutionId, courseType },
    { enabled: !!institutionId }
  );

  const payMutation = trpc.institution.initiateBulkEnrollmentPayment.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const q = quoteQuery.data;
  const staffCount = q?.staffCount ?? 0;
  const subtotal = q ? q.basePrice * staffCount : 0;
  const discount = q?.totalDiscount ?? 0;
  const total = q?.totalPrice ?? 0;
  const discountPct = q?.discountPercentage ?? 0;

  function formatKes(n: number) {
    return n.toLocaleString("en-KE") + " KES";
  }

  const canPay = staffCount > 0 && trainingDate && phone.length >= 9;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Bulk Enrollment & Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Course selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
            <div className="flex flex-wrap gap-2">
              {(["bls", "acls", "pals"] as const).map((ct) => (
                <button
                  key={ct}
                  onClick={() => setCourseType(ct)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    courseType === ct
                      ? "bg-blue-900 text-white border-blue-900"
                      : "border-slate-300 text-slate-700 hover:border-blue-400"
                  }`}
                >
                  {ct.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Training date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Training date</label>
            <input
              type="date"
              value={trainingDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setTrainingDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* M-Pesa phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">M-Pesa phone number</label>
            <input
              type="tel"
              placeholder="e.g. 0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">A single STK push will be sent to this number for the total amount.</p>
          </div>

          {/* Live quote */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            {quoteQuery.isLoading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating quote…
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Staff enrolled:</span>
                  <span className="font-semibold">{staffCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Base price per staff:</span>
                  <span className="font-semibold">{formatKes(q?.basePrice ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold">{formatKes(subtotal)}</span>
                </div>
                {discountPct > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Bulk discount ({discountPct}%):</span>
                    <span className="font-semibold text-green-600">− {formatKes(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg border-t pt-2 mt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-700">{formatKes(total)}</span>
                </div>
                {staffCount === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Add staff to your roster first (Staff Roster tab) before initiating payment.</p>
                )}
              </>
            )}
          </div>

          {/* Pay button */}
          <Button
            className="w-full bg-blue-900 hover:bg-blue-800"
            disabled={!canPay || payMutation.isPending}
            onClick={() => {
              if (!trainingDate) return;
              payMutation.mutate({
                institutionId,
                courseType,
                trainingDate: new Date(trainingDate),
                phoneNumber: phone,
              });
            }}
          >
            {payMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Initiating payment…
              </>
            ) : (
              `Pay ${formatKes(total)} via M-Pesa`
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Payment is processed via M-Pesa STK push. All staff enrollments are created immediately and certificates are released automatically once payment is confirmed and practical skills are signed off.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
