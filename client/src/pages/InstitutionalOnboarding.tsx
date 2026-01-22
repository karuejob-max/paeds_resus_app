import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, FileText, Users, CreditCard, CheckCheck, Upload } from "lucide-react";
import { useLocation } from "wouter";

export default function InstitutionalOnboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    institutionName: "",
    institutionType: "",
    country: "Kenya",
    city: "",
    address: "",
    registrationNumber: "",
    healthcareStaffCount: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactDesignation: "",
    programInterest: [] as string[],
    agreeToTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProgramToggle = (program: string) => {
    setFormData((prev) => ({
      ...prev,
      programInterest: prev.programInterest.includes(program)
        ? prev.programInterest.filter((p) => p !== program)
        : [...prev.programInterest, program],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.agreeToTerms) {
      setError("You must agree to the terms and conditions");
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      setTimeout(() => navigate("/institutional-portal"), 2000);
    } catch (err) {
      setError("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Institution Details", icon: FileText },
    { number: 2, title: "Contact Information", icon: Users },
    { number: 3, title: "Program Selection", icon: CheckCheck },
    { number: 4, title: "Review & Agreement", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Partner with Paeds Resus</h1>
          <p className="text-lg text-slate-600">
            Equip your healthcare team with life-saving BLS and ACLS skills
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between mb-8">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.number;
              const isCompleted = step > s.number;
              return (
                <div key={s.number} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg scale-110"
                        : isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                  </div>
                  <p className={`text-sm font-medium text-center ${isActive ? "text-blue-600" : "text-slate-600"}`}>
                    {s.title}
                  </p>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 mt-4 ${isCompleted ? "bg-green-600" : "bg-slate-200"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <Card className="p-8 shadow-lg">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Institution Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Institution Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="institutionName">Institution Name *</Label>
                    <Input
                      id="institutionName"
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleInputChange}
                      placeholder="e.g., Kenyatta National Hospital"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="institutionType">Institution Type *</Label>
                    <Select value={formData.institutionType} onValueChange={(v) => handleSelectChange("institutionType", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public_hospital">Public Hospital</SelectItem>
                        <SelectItem value="private_hospital">Private Hospital</SelectItem>
                        <SelectItem value="clinic">Clinic</SelectItem>
                        <SelectItem value="medical_college">Medical College</SelectItem>
                        <SelectItem value="nursing_school">Nursing School</SelectItem>
                        <SelectItem value="ambulance_service">Ambulance Service</SelectItem>
                        <SelectItem value="fire_rescue">Fire & Rescue</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="registrationNumber">Registration Number *</Label>
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., REG-2024-001"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="healthcareStaffCount">Healthcare Staff Count *</Label>
                    <Input
                      id="healthcareStaffCount"
                      name="healthcareStaffCount"
                      type="number"
                      value={formData.healthcareStaffCount}
                      onChange={handleInputChange}
                      placeholder="e.g., 250"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      disabled
                      className="bg-slate-100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g., Nairobi"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Physical Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Full physical address"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Contact Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="contactName">Contact Person Name *</Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactDesignation">Designation *</Label>
                    <Input
                      id="contactDesignation"
                      name="contactDesignation"
                      value={formData.contactDesignation}
                      onChange={handleInputChange}
                      placeholder="e.g., Head of Training"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Email Address *</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      placeholder="email@institution.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Phone Number *</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      placeholder="+254 700 000 000"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Program Selection */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Program Selection</h2>
                <p className="text-slate-600 mb-6">Select the training programs you're interested in:</p>

                <div className="space-y-4">
                  {[
                    { id: "bls", label: "Basic Life Support (BLS)", desc: "CPR, AED, and basic emergency response" },
                    { id: "acls", label: "Advanced Cardiac Life Support (ACLS)", desc: "Advanced cardiac care and medications" },
                    { id: "pals", label: "Pediatric Advanced Life Support (PALS)", desc: "Pediatric emergency care protocols" },
                    { id: "nrp", label: "Neonatal Resuscitation Program (NRP)", desc: "Newborn resuscitation skills" },
                    { id: "trauma", label: "Trauma & Emergency Response", desc: "Trauma assessment and management" },
                  ].map((program) => (
                    <div
                      key={program.id}
                      className="flex items-start p-4 border-2 border-slate-200 rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
                      onClick={() => handleProgramToggle(program.id)}
                    >
                      <Checkbox
                        checked={formData.programInterest.includes(program.id)}
                        onCheckedChange={() => handleProgramToggle(program.id)}
                        className="mt-1 mr-4"
                        id={program.id}
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{program.label}</p>
                        <p className="text-sm text-slate-600">{program.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Review & Agreement */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Review & Agreement</h2>

                <Card className="bg-slate-50 p-6 border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Summary</h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    <p><strong>Institution:</strong> {formData.institutionName}</p>
                    <p><strong>Type:</strong> {formData.institutionType}</p>
                    <p><strong>Location:</strong> {formData.city}, {formData.country}</p>
                    <p><strong>Staff Count:</strong> {formData.healthcareStaffCount}</p>
                    <p><strong>Contact:</strong> {formData.contactName} ({formData.contactDesignation})</p>
                    <p><strong>Programs:</strong> {formData.programInterest.join(", ") || "None selected"}</p>
                  </div>
                </Card>

                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="text-red-600 mt-0.5" size={20} />
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Checkbox
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, agreeToTerms: checked as boolean }))
                      }
                      className="mt-1"
                      id="terms"
                    />
                    <div className="text-sm text-slate-700">
                      <p>
                        I agree to the Paeds Resus Terms of Service and Privacy Policy. I understand that my institution
                        will be responsible for ensuring all participants complete the required training and assessments.
                      </p>
                    </div>
                  </div>
                </div>

                {success && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="text-green-600" size={20} />
                    <p className="text-green-800">Account created successfully! Redirecting...</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1 || loading}
              >
                Previous
              </Button>

              {step < 4 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={loading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !formData.agreeToTerms}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Comprehensive Training", desc: "BLS, ACLS, PALS, and specialized programs" },
            { title: "Paperless System", desc: "Digital enrollment, tracking, and certification" },
            { title: "Real-Time Analytics", desc: "Monitor staff progress and compliance" },
          ].map((benefit, i) => (
            <Card key={i} className="p-6 text-center">
              <h3 className="font-semibold text-slate-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-slate-600">{benefit.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
