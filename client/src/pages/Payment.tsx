import { useState } from "react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MpesaPaymentForm } from "@/components/MpesaPaymentForm";
import { CheckCircle2, Clock, AlertCircle, CreditCard, Smartphone, Building2 } from "lucide-react";
import { individualCourses, fellowshipTiers } from "@/const/pricing";

export default function Payment() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "bank" | "card">("mpesa");

  const courses = [
    {
      id: "bls",
      name: "BLS Certification",
      description: "Basic Life Support training and certification",
      price: 10000,
      duration: "2 days",
      icon: "🏥",
    },
    {
      id: "acls",
      name: "ACLS Certification",
      description: "Advanced Cardiovascular Life Support",
      price: 20000,
      duration: "3 days",
      icon: "❤️",
    },
    {
      id: "pals",
      name: "PALS Certification",
      description: "Pediatric Advanced Life Support",
      price: 20000,
      duration: "3 days",
      icon: "👶",
    },
    {
      id: "bronze",
      name: "Bronze Fellowship",
      description: "Comprehensive pediatric resuscitation",
      price: 70000,
      duration: "6 weeks",
      icon: "🥉",
    },
    {
      id: "silver",
      name: "Silver Fellowship",
      description: "Advanced clinical skills and leadership",
      price: 100000,
      duration: "12 weeks",
      icon: "🥈",
    },
    {
      id: "gold",
      name: "Gold Fellowship",
      description: "Elite training with certification",
      price: 150000,
      duration: "16 weeks",
      icon: "🥇",
    },
  ];

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  const paymentMethods = [
    {
      id: "mpesa",
      name: "M-Pesa",
      description: "Instant mobile money payment",
      icon: Smartphone,
      available: true,
    },
    {
      id: "bank",
      name: "Bank Transfer",
      description: "Direct bank account transfer",
      icon: Building2,
      available: true,
    },
    {
      id: "card",
      name: "Card Payment",
      description: "Visa, Mastercard, American Express",
      icon: CreditCard,
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Secure Payment</h1>
          <p className="text-xl text-blue-100">
            Choose your course and complete payment to start your training journey
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Course Selection */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Select Your Course</h2>
            <div className="space-y-3">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className={`cursor-pointer transition-all ${
                    selectedCourse === course.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:shadow-lg"
                  }`}
                  onClick={() => setSelectedCourse(course.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{course.icon}</span>
                          <div>
                            <h3 className="font-bold text-slate-900">{course.name}</h3>
                            <p className="text-sm text-slate-600">{course.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">KES {course.price.toLocaleString()}</p>
                        <p className="text-sm text-slate-600">{course.duration}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Summary & Method */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCourseData ? (
                  <>
                    <div>
                      <p className="text-sm text-slate-600">Course</p>
                      <p className="font-bold text-slate-900">{selectedCourseData.name}</p>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-slate-600">Total Amount</p>
                      <p className="text-3xl font-bold text-blue-600">
                        KES {selectedCourseData.price.toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-slate-500 py-8">Select a course to continue</p>
                )}
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            {selectedCourseData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          disabled={!method.available}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                            paymentMethod === method.id
                              ? "border-blue-500 bg-blue-50"
                              : method.available
                              ? "border-slate-200 hover:border-blue-300"
                              : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-slate-600" />
                            <div>
                              <p className="font-semibold text-slate-900">{method.name}</p>
                              <p className="text-xs text-slate-600">{method.description}</p>
                            </div>
                            {!method.available && (
                              <Badge className="ml-auto" variant="secondary">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Payment Form */}
                {paymentMethod === "mpesa" && (
                  <MpesaPaymentForm
                    courseId={selectedCourseData.id}
                    courseName={selectedCourseData.name}
                    amount={selectedCourseData.price}
                    onPaymentSuccess={() => {
                      // Redirect to success page or dashboard
                      window.location.href = "/learner-dashboard";
                    }}
                  />
                )}

                {paymentMethod === "bank" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Bank Transfer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                        <div>
                          <p className="text-sm text-slate-600">Account Name</p>
                          <p className="font-bold text-slate-900">Paeds Resus Limited</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Account Number</p>
                          <p className="font-bold text-slate-900">1150286006733</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Bank</p>
                          <p className="font-bold text-slate-900">Equity Bank Kenya</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Amount to Transfer</p>
                          <p className="font-bold text-blue-600 text-lg">
                            KES {selectedCourseData.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button className="w-full" variant="outline">
                        Copy Details
                      </Button>
                      <p className="text-xs text-slate-500">
                        After transfer, send proof of payment to payments@paeds-resus.com
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <CheckCircle2 className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Secure Payment</h3>
              <p className="text-sm text-slate-600">
                All transactions are encrypted and secure
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Clock className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Instant Confirmation</h3>
              <p className="text-sm text-slate-600">
                Receive confirmation immediately after payment
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <AlertCircle className="w-8 h-8 text-orange-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Support Available</h3>
              <p className="text-sm text-slate-600">
                24/7 customer support for payment issues
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
