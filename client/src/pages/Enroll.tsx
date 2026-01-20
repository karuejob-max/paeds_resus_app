import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Enroll() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    programType: "",
    trainingDate: "",
    phone: user?.phone || "",
    specialization: "",
    institution: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const createEnrollment = trpc.enrollment.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In to Enroll</CardTitle>
            <CardDescription>You need to be logged in to enroll in a program</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full bg-blue-900 hover:bg-blue-800">Sign In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.programType || !formData.trainingDate) {
      alert("Please fill in all required fields");
      return;
    }

    createEnrollment.mutate({
      programType: formData.programType as "bls" | "acls" | "pals" | "fellowship",
      trainingDate: new Date(formData.trainingDate),
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Enrollment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your enrollment has been recorded. You'll receive an SMS confirmation shortly.
              </p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const programs = [
    { value: "bls", label: "BLS (Basic Life Support) - 5,000 KES" },
    { value: "acls", label: "ACLS (Advanced Cardiac Life Support) - 8,000 KES" },
    { value: "pals", label: "PALS (Pediatric Advanced Life Support) - 10,000 KES" },
    { value: "fellowship", label: "Elite Fellowship (12 weeks) - 50,000 KES" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Enroll in a Program</CardTitle>
            <CardDescription>
              Complete this form to reserve your spot in our next cohort
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={user?.name || ""}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="254712345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Program Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Program Selection</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="program">Select Program *</Label>
                    <Select value={formData.programType} onValueChange={(value) => setFormData({ ...formData, programType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.value} value={program.value}>
                            {program.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Preferred Training Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.trainingDate}
                      onChange={(e) => setFormData({ ...formData, trainingDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="specialization">Healthcare Specialization</Label>
                    <Input
                      id="specialization"
                      placeholder="e.g., Nursing, Emergency Medicine"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="institution">Institution/Hospital</Label>
                    <Input
                      id="institution"
                      placeholder="e.g., Kenyatta National Hospital"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>1. Complete this enrollment form</li>
                      <li>2. Receive payment instructions via SMS</li>
                      <li>3. Make payment via M-Pesa or bank transfer</li>
                      <li>4. Confirm payment and receive training details</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 bg-blue-900 hover:bg-blue-800"
                  disabled={createEnrollment.isPending}
                >
                  {createEnrollment.isPending ? "Processing..." : "Continue to Payment"}
                </Button>
              </div>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center">
                By enrolling, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
