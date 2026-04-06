import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Shield,
} from 'lucide-react';

interface MpesaEnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  price: number; // in cents
  duration: number; // in minutes
}

export default function MpesaEnrollmentModal({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  price,
  duration,
}: MpesaEnrollmentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>(
    'idle'
  );
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [enrollmentId, setEnrollmentId] = useState(0);

  // tRPC mutations
  const enrollMutation = trpc.courses.enrollWithMpesa.useMutation();
  const confirmPaymentMutation = trpc.courses.confirmMpesaPayment.useMutation();

  const priceInKES = Math.round(price / 100);

  // Format phone number for display
  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('254')) {
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
    }
    if (cleaned.length === 10 && cleaned.startsWith('07')) {
      return `0${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    }
    return phone;
  };

  // Handle enrollment
  const handleEnroll = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setPaymentStatus('pending');
    try {
      const result = await enrollMutation.mutateAsync({
        courseId,
        phoneNumber,
      });

      setCheckoutRequestId(result.checkoutRequestId);
      setEnrollmentId(result.enrollmentId);

      toast.success('✅ M-Pesa prompt sent!', {
        description: result.message,
        duration: 10000,
      });

      // Start polling for payment confirmation
      pollPaymentStatus(result.checkoutRequestId);
    } catch (error) {
      setPaymentStatus('failed');
      toast.error('❌ Failed to initiate payment', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
    }
  };

  // Poll for payment confirmation
  const pollPaymentStatus = (requestId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (5 second intervals)

    const poll = async () => {
      attempts++;

      try {
        // In production, you would query the backend to check payment status
        // For now, we wait for the webhook callback
        if (attempts >= maxAttempts) {
          setPaymentStatus('failed');
          toast.error('Payment timeout', {
            description: 'Please try again or contact support',
          });
          return;
        }

        // Continue polling
        setTimeout(poll, 5000);
      } catch (error) {
        console.error('Poll error:', error);
        setTimeout(poll, 5000);
      }
    };

    poll();
  };

  // Handle payment confirmation (called by webhook)
  const handlePaymentConfirmed = async (resultCode: string, receiptNumber: string) => {
    if (resultCode === '0') {
      setPaymentStatus('completed');
      toast.success('✅ Payment confirmed!', {
        description: 'Your enrollment is now active. Course access granted.',
        duration: 5000,
      });

      // Confirm payment in backend
      try {
        await confirmPaymentMutation.mutateAsync({
          checkoutRequestId,
          resultCode,
          mpesaReceiptNumber: receiptNumber,
        });
      } catch (error) {
        console.error('Payment confirmation error:', error);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setPaymentStatus('idle');
        setPhoneNumber('');
      }, 2000);
    } else {
      setPaymentStatus('failed');
      toast.error('❌ Payment failed', {
        description: 'Please try again',
        duration: 5000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-xl">Enroll with M-Pesa</DialogTitle>
          <DialogDescription>Pay for {courseTitle} using M-Pesa</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Details */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Course</span>
              <span className="text-sm font-semibold text-slate-900">{courseTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <DollarSign className="h-4 w-4" />
                Amount
              </span>
              <span className="text-lg font-bold text-green-600">KES {priceInKES.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4" />
                Duration
              </span>
              <span className="text-sm font-semibold text-slate-900">{duration} minutes</span>
            </div>
          </div>

          {/* Phone Input */}
          {paymentStatus === 'idle' && (
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-sm font-semibold">
                M-Pesa Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="phone"
                  placeholder="254712345678 or 0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  disabled={enrollMutation.isPending}
                />
              </div>
              <p className="text-xs text-slate-500">
                Enter your M-Pesa registered phone number. Format: 254712345678, +254712345678, or 0712345678
              </p>
            </div>
          )}

          {/* Payment Status: Pending */}
          {paymentStatus === 'pending' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <span className="font-semibold text-blue-900">Waiting for M-Pesa prompt...</span>
              </div>
              <p className="text-sm text-blue-700">
                Check your phone for an M-Pesa prompt. Enter your PIN to complete payment.
              </p>
              <div className="bg-white p-3 rounded border border-blue-100 text-xs text-slate-600 font-mono">
                Phone: {formatPhoneDisplay(phoneNumber)}
                <br />
                Amount: KES {priceInKES.toLocaleString()}
              </div>
            </div>
          )}

          {/* Payment Status: Completed */}
          {paymentStatus === 'completed' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">Payment confirmed!</span>
              </div>
              <p className="text-sm text-green-700">
                Your enrollment is now active. You can start learning immediately.
              </p>
              <Badge className="bg-green-600 text-white">Enrollment Active</Badge>
            </div>
          )}

          {/* Payment Status: Failed */}
          {paymentStatus === 'failed' && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-900">Payment failed</span>
              </div>
              <p className="text-sm text-red-700">
                The payment was not completed. Please try again or contact support.
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2">
            <Shield className="h-4 w-4 text-slate-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600">
              Your payment is secure and encrypted. M-Pesa is a trusted payment method in Kenya.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setPaymentStatus('idle');
                setPhoneNumber('');
              }}
              disabled={enrollMutation.isPending || paymentStatus === 'pending'}
              className="flex-1"
            >
              Cancel
            </Button>

            {paymentStatus === 'idle' && (
              <Button
                onClick={handleEnroll}
                disabled={enrollMutation.isPending || !phoneNumber.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {enrollMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Pay KES {priceInKES.toLocaleString()}
                  </>
                )}
              </Button>
            )}

            {paymentStatus === 'completed' && (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  setPaymentStatus('idle');
                  setPhoneNumber('');
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Start Learning
              </Button>
            )}

            {paymentStatus === 'failed' && (
              <Button
                onClick={() => {
                  setPaymentStatus('idle');
                  setPhoneNumber('');
                }}
                className="flex-1"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
