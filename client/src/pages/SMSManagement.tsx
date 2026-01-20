import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Phone,
} from "lucide-react";

export default function SMSManagement() {
  const [activeTab, setActiveTab] = useState<
    "send" | "history" | "templates" | "settings"
  >("send");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [messageType, setMessageType] = useState<
    "enrollment_confirmation" | "payment_reminder" | "training_reminder" | "post_training_feedback"
  >("enrollment_confirmation");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [trainingDate, setTrainingDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendEnrollmentConfirmation = trpc.sms.sendEnrollmentConfirmation.useMutation();
  const sendPaymentReminder = trpc.sms.sendPaymentReminder.useMutation();
  const sendTrainingReminder = trpc.sms.sendTrainingReminder.useMutation();
  const sendPostTrainingFeedback = trpc.sms.sendPostTrainingFeedback.useMutation();

  const handleSendSMS = async () => {
    if (!phoneNumber.trim()) {
      setResult({ error: "Please enter a phone number" });
      return;
    }

    setIsLoading(true);
    try {
      let response;

      switch (messageType) {
        case "enrollment_confirmation":
          if (!enrollmentId) {
            setResult({ error: "Please enter enrollment ID" });
            setIsLoading(false);
            return;
          }
          response = await sendEnrollmentConfirmation.mutateAsync({
            phoneNumber,
            enrollmentId: parseInt(enrollmentId),
          });
          break;

        case "payment_reminder":
          if (!amount || !enrollmentId) {
            setResult({ error: "Please enter amount and enrollment ID" });
            setIsLoading(false);
            return;
          }
          response = await sendPaymentReminder.mutateAsync({
            phoneNumber,
            amount: parseInt(amount),
            enrollmentId: parseInt(enrollmentId),
          });
          break;

        case "training_reminder":
          if (!trainingDate) {
            setResult({ error: "Please enter training date" });
            setIsLoading(false);
            return;
          }
          response = await sendTrainingReminder.mutateAsync({
            phoneNumber,
            trainingDate: new Date(trainingDate),
          });
          break;

        case "post_training_feedback":
          response = await sendPostTrainingFeedback.mutateAsync({
            phoneNumber,
          });
          break;
      }

      setResult({
        success: response?.success,
        messageId: response?.messageId,
        error: response?.error,
      });

      if (response?.success) {
        setPhoneNumber("");
        setEnrollmentId("");
        setAmount("");
        setTrainingDate("");
      }
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Failed to send SMS",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">SMS Management</h1>
          </div>
          <p className="text-gray-600">
            Send SMS notifications to learners and manage communication
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {["send", "history", "templates", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Send SMS Tab */}
        {activeTab === "send" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Send SMS
                </h2>

                <div className="space-y-4">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-gray-100 text-gray-600 rounded-lg">
                        +254
                      </span>
                      <Input
                        placeholder="712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Message Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message Type
                    </label>
                    <select
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="enrollment_confirmation">
                        Enrollment Confirmation
                      </option>
                      <option value="payment_reminder">Payment Reminder</option>
                      <option value="training_reminder">Training Reminder</option>
                      <option value="post_training_feedback">
                        Post-Training Feedback
                      </option>
                    </select>
                  </div>

                  {/* Conditional Fields */}
                  {(messageType === "enrollment_confirmation" ||
                    messageType === "payment_reminder") && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Enrollment ID
                      </label>
                      <Input
                        type="number"
                        placeholder="12345"
                        value={enrollmentId}
                        onChange={(e) => setEnrollmentId(e.target.value)}
                      />
                    </div>
                  )}

                  {messageType === "payment_reminder" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Amount (KES)
                      </label>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  )}

                  {messageType === "training_reminder" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Training Date
                      </label>
                      <Input
                        type="date"
                        value={trainingDate}
                        onChange={(e) => setTrainingDate(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Send Button */}
                  <Button
                    onClick={handleSendSMS}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isLoading ? "Sending..." : "Send SMS"}
                  </Button>
                </div>

                {/* Result */}
                {result && (
                  <div className="mt-6 pt-6 border-t">
                    {result.success ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-900">
                            SMS Sent Successfully
                          </p>
                          <p className="text-sm text-green-800">
                            Message ID: {result.messageId}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900">Failed to Send</p>
                          <p className="text-sm text-red-800">{result.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Info Panel */}
            <div className="space-y-4">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Format
                </h3>
                <p className="text-sm text-blue-800">
                  Enter Kenyan numbers without the leading +254. Example: 712345678
                </p>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Message Types</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">
                      Enrollment Confirmation
                    </p>
                    <p className="text-gray-600">Sent when user enrolls</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Payment Reminder</p>
                    <p className="text-gray-600">Payment pending notification</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Training Reminder</p>
                    <p className="text-gray-600">Pre-training notification</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">
                      Post-Training Feedback
                    </p>
                    <p className="text-gray-600">Survey request after training</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-amber-50 border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending Setup
                </h3>
                <p className="text-sm text-amber-800">
                  M-Pesa business till credentials pending. SMS will be fully automated
                  once approved.
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              SMS History
            </h2>
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                SMS history tracking coming soon. All sent messages will be logged here.
              </p>
            </div>
          </Card>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Message Templates
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  title: "Enrollment Confirmation",
                  preview:
                    "Welcome to Paeds Resus! Your enrollment is confirmed. Check your email for payment instructions.",
                },
                {
                  title: "Payment Reminder",
                  preview:
                    "Reminder: KES 5,000 payment is pending. Complete payment to secure your spot.",
                },
                {
                  title: "Training Reminder",
                  preview:
                    "Your training starts in 7 days! Please arrive 15 minutes early. See you soon!",
                },
                {
                  title: "Post-Training Feedback",
                  preview:
                    "Thank you for attending! Please rate your experience: https://survey.paedsresus.com",
                },
              ].map((template, idx) => (
                <Card key={idx} className="p-4 border">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-600">{template.preview}</p>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <Card className="p-6 max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              SMS Settings
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SMS Provider
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Africastalking (Default)</option>
                  <option>Twilio</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Configure which SMS provider to use for sending messages
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sender ID
                </label>
                <Input
                  value="PAEDSRESUS"
                  readOnly
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The name that appears as sender on SMS messages
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable automated SMS reminders
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically send reminders based on enrollment schedules
                </p>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Save Settings
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
