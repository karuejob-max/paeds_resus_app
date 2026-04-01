import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, FileText, Users, CreditCard, CheckCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function InstitutionalOnboarding() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const completeOnboarding = trpc.institution.completeOnboarding.useMutation({
    onSuccess: () => {
      setSuccess(true);
      sessionStorage.setItem("institutionalPortalWelcome", "1");
      setTimeout(() => navigate("/hospital-admin-dashboard"), 2000);
    },
    onError: (err) => {
      setError(err.message || "Failed to create account");
      setLoading(false);
    },
  });

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

  /** Program checkboxes: only update from Checkbox `onCheckedChange` (no parent click) — avoids double-toggle + React max update depth (#185). */
  const setProgramInterest = (programId: string, on: boolean) => {
    setFormData((prev) => {
      const has = prev.programInterest.includes(programId);
      if (on === has) return prev;
      if (on) return { ...prev, programInterest: [...prev.programInterest, programId] };
      return { ...prev, programInterest: prev.programInterest.filter((p) => p !== programId) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isAuthenticated) {
      setError("Please sign in to complete institutional onboarding.");
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError("You must agree to the terms and conditions");
      setLoading(false);
      return;
    }

    if (!formData.institutionType) {
      setError("Please select an institution type.");
      setLoading(false);
      return;
    }

    const staffCount = parseInt(formData.healthcareStaffCount, 10);
    if (Number.isNaN(staffCount) || staffCount < 1) {
      setError("Enter a valid healthcare staff count.");
      setLoading(false);
      return;
    }

    try {
      await completeOnboarding.mutateAsync({
        institutionName: formData.institutionName,
        institutionType: formData.institutionType,
        registrationNumber: formData.registrationNumber,
        healthcareStaffCount: staffCount,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        contactDesignation: formData.contactDesignation,
        programInterest: formData.programInterest,
      });
    } catch {
      // onError sets message + loading false
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
    <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/60 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Partner with Paeds Resus</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Paediatric emergency training, institutional dashboards, and scalable programmes for hospitals and teams — start by linking your facility.
          </p>
          {!isAuthenticated && (
            <Card className="mt-6 p-4 text-left max-w-xl mx-auto border-border bg-secondary/50">
              <p className="text-sm text-foreground mb-3">
                Sign in first so we can link this facility to your account.
              </p>
              <a href={getLoginUrl()}>
                <Button variant="default">Sign in</Button>
              </a>
            </Card>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <ol className="flex flex-wrap justify-center gap-2 md:gap-4">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.number;
              const isCompleted = step > s.number;
              return (
                <li key={s.number} className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isActive
                        ? "bg-brand-orange text-white shadow-md ring-2 ring-brand-orange/30"
                        : isCompleted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
                  </div>
                  <span
                    className={`text-sm font-medium max-w-[7rem] md:max-w-none ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.title}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Form */}
        <Card className="p-6 md:p-8 shadow-md border-border">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Institution Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Institution details</h2>
                <p className="text-sm text-muted-foreground mb-4">Country defaults to Kenya; change it if your facility is elsewhere.</p>

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
                    <Select
                      value={formData.institutionType ? formData.institutionType : undefined}
                      onValueChange={(v) => handleSelectChange("institutionType", v)}
                    >
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
                      onChange={handleInputChange}
                      placeholder="e.g., Kenya"
                      autoComplete="country-name"
                      required
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
                <h2 className="text-2xl font-bold text-foreground mb-6">Contact information</h2>

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

            {/* Step 3: Program Selection — checkbox only (no row onClick) to avoid double-firing Radix + state loop */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Program selection</h2>
                <p className="text-muted-foreground mb-4">
                  Select the training programmes your institution is interested in (you can choose more than one):
                </p>

                <div className="space-y-3">
                  {[
                    { id: "bls", label: "Basic Life Support (BLS)", desc: "CPR, AED, and basic emergency response" },
                    { id: "acls", label: "Advanced Cardiac Life Support (ACLS)", desc: "Advanced cardiac care and medications" },
                    { id: "pals", label: "Pediatric Advanced Life Support (PALS)", desc: "Pediatric emergency care protocols" },
                    { id: "nrp", label: "Neonatal Resuscitation Program (NRP)", desc: "Newborn resuscitation skills" },
                    { id: "trauma", label: "Trauma & emergency response", desc: "Trauma assessment and management" },
                  ].map((program) => (
                    <label
                      key={program.id}
                      htmlFor={`program-${program.id}`}
                      className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        id={`program-${program.id}`}
                        checked={formData.programInterest.includes(program.id)}
                        onCheckedChange={(checked) => setProgramInterest(program.id, checked === true)}
                        className="mt-0.5"
                      />
                      <span className="flex-1">
                        <span className="font-semibold text-foreground block">{program.label}</span>
                        <span className="text-sm text-muted-foreground">{program.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Review & Agreement */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">Review & agreement</h2>

                <Card className="bg-muted/40 p-6 border-border">
                  <h3 className="font-semibold text-foreground mb-4">Summary</h3>
                  <div className="space-y-2 text-sm text-foreground/90">
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
                  <div className="flex items-start gap-3 p-4 bg-brand-surface/80 border border-border rounded-lg">
                    <Checkbox
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, agreeToTerms: checked === true }))
                      }
                      className="mt-1"
                      id="terms"
                    />
                    <div className="text-sm text-foreground/90">
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
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1 || loading}
              >
                Previous
              </Button>

              {step < 4 ? (
                <Button type="button" variant="cta" onClick={() => setStep(step + 1)} disabled={loading}>
                  Next
                </Button>
              ) : (
                <Button type="submit" variant="cta" disabled={loading || !formData.agreeToTerms}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Benefits Section */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Comprehensive training", desc: "BLS, ACLS, PALS, and paediatric-focused programmes" },
            { title: "Paperless workflows", desc: "Digital enrolment, tracking, and certification" },
            { title: "Institutional insight", desc: "Cohort progress and training visibility" },
          ].map((benefit, i) => (
            <Card key={i} className="p-5 text-center border-border bg-card/80">
              <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
