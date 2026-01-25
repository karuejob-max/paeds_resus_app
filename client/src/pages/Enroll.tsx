import { useState } from "react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Clock, Users, Award, Shield, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Enroll() {
  useScrollToTop();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"course-select" | "checkout" | "success">("course-select");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    phone: user?.phone || "",
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ")[1] || "",
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const createEnrollment = trpc.enrollment.create.useMutation({
    onSuccess: () => {
      setStep("success");
      setTimeout(() => {
        setLocation("/learner-dashboard");
      }, 3000);
    },
    onError: (error) => {
      alert(`Enrollment failed: ${error.message}`);
    },
  });

  // Course data with clear pricing and value
  const courses = [
    {
      id: "bls",
      name: "Basic Life Support (BLS)",
      description: "CPR and emergency response for infants and children",
      price: 500,
      duration: "30 minutes",
      features: [
        "CPR techniques for infants and children",
        "Recovery position and choking relief",
        "When and how to call for help",
        "Official certificate upon completion",
      ],
      popular: true,
    },
    {
      id: "first-aid",
      name: "First Aid Essentials",
      description: "Handle common emergencies with confidence",
      price: 300,
      duration: "45 minutes",
      features: [
        "Wound care and bleeding control",
        "Burns, fractures, and sprains",
        "Fever, allergies, and poisoning",
        "Official certificate upon completion",
      ],
      popular: false,
    },
    {
      id: "acls",
      name: "Advanced Cardiovascular Life Support",
      description: "For healthcare professionals",
      price: 2000,
      duration: "2 hours",
      features: [
        "Advanced CPR techniques",
        "Medication administration",
        "Defibrillation and advanced airway",
        "Professional certification",
      ],
      popular: false,
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle>Sign In to Enroll</CardTitle>
            <CardDescription>Join thousands of parents learning life-saving skills</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Learn at your own pace</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Get certified immediately</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Access lifetime resources</span>
              </div>
            </div>
            <a href={getLoginUrl()}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base">
                Sign In to Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <p className="text-xs text-gray-500 text-center mt-4">
              Takes less than 1 minute. No credit card required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Course Selection
  if (step === "course-select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Course
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              All courses include video lessons, practice, and official certification
            </p>
          </div>

          {/* Course Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {courses.map((course) => (
              <div
                key={course.id}
                className={`relative transition-all cursor-pointer ${
                  selectedCourse === course.id
                    ? "ring-2 ring-blue-600 scale-105"
                    : "hover:shadow-lg"
                }`}
                onClick={() => {
                  setSelectedCourse(course.id);
                  setStep("checkout");
                }}
              >
                {course.popular && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                <Card className={`h-full ${course.popular ? "border-2 border-blue-600" : ""}`}>
                  <CardHeader className={course.popular ? "bg-blue-50" : ""}>
                    <CardTitle className="text-xl">{course.name}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Price */}
                    <div>
                      <div className="text-4xl font-bold text-gray-900">
                        KES {course.price.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {course.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      className={`w-full h-12 text-base ${
                        course.popular
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                      }`}
                      onClick={() => {
                        setSelectedCourse(course.id);
                        setStep("checkout");
                      }}
                    >
                      Enroll Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Trust Signals */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">10,000+ Enrolled</p>
                <p className="text-sm text-gray-600">Parents and caregivers trained</p>
              </div>
              <div className="text-center">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">Official Certificates</p>
                <p className="text-sm text-gray-600">Recognized and valid</p>
              </div>
              <div className="text-center">
                <Shield className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">100% Secure</p>
                <p className="text-sm text-gray-600">Your data is protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Checkout
  if (step === "checkout" && selectedCourse) {
    const course = courses.find((c) => c.id === selectedCourse);
    if (!course) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => setStep("course-select")}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              ← Back
            </button>
            <div className="flex-1 text-right text-sm text-gray-600">
              Step 2 of 2
            </div>
          </div>

          {/* Order Summary */}
          <Card className="mb-6 border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">{course.name}</span>
                  <span className="font-semibold">KES {course.price.toLocaleString()}</span>
                </div>
                <div className="border-t border-green-200 pt-3 flex justify-between">
                  <span className="font-bold text-green-900">Total</span>
                  <span className="text-2xl font-bold text-green-900">
                    KES {course.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Enrollment</CardTitle>
              <CardDescription>Quick checkout - takes less than 1 minute</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!agreeToTerms) {
                    alert("Please agree to terms and conditions");
                    return;
                  }
                  createEnrollment.mutate({
                    programType: selectedCourse as "bls" | "acls" | "pals" | "fellowship",
                    trainingDate: new Date(),
                  });
                }}
                className="space-y-6"
              >
                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+254 700 000000"
                      required
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Payment Method</h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>M-Pesa:</strong> You'll receive an STK prompt to complete payment
                    </p>
                  </div>
                </div>

                {/* Terms */}
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="w-5 h-5 mt-0.5"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={createEnrollment.isPending || !agreeToTerms}
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
                >
                  {createEnrollment.isPending ? "Processing..." : "Complete Enrollment"}
                </Button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                  <Shield className="w-4 h-4" />
                  Secure payment powered by M-Pesa
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 3: Success
  if (step === "success") {
    const course = courses.find((c) => c.id === selectedCourse);
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg border-2 border-green-200">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Enrollment Successful!
              </h2>
              <p className="text-gray-600 mb-6">
                You're now enrolled in <strong>{course?.name}</strong>
              </p>

              {/* Next Steps */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6 space-y-3 text-left">
                <p className="text-sm font-semibold text-gray-900">What happens next:</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>Check your email for course access details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>Start learning immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>Get your certificate upon completion</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                Redirecting to your dashboard in 3 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
