import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Building2, CheckCircle2, ClipboardList, CreditCard, Users, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { LegalExternalLink } from "@/components/LegalExternalLink";
import { FacilityAutocomplete } from "@/components/FacilityAutocomplete";
import { DepartmentSelectors } from "@/components/DepartmentSelectors";
import { PlatformAccountAutocomplete, type PlatformAccountOption } from "@/components/PlatformAccountAutocomplete";
import { validateSecondAdminSelection } from "@/lib/institutionOnboardingValidation";
import { INSTITUTION_PLATFORM_NEED_OPTIONS, INSTITUTION_TYPE_OPTIONS, type InstitutionPlatformNeed, type InstitutionType } from "@shared/institution-onboarding";


export default function InstitutionalOnboarding() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const acceptB2b = trpc.legal.acceptInstitutionalB2b.useMutation();

  const completeOnboarding = trpc.institution.completeOnboarding.useMutation({
    onSuccess: () => {
      setSuccess(true);
      sessionStorage.setItem("institutionalPortalWelcome", "1");
      setTimeout(() => navigate("/institution"), 2000);
    },
    onError: (err) => {
      setError(err.message || "Failed to create account");
      setLoading(false);
    },
  });

  const [isManualFacilityEntry, setIsManualFacilityEntry] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [selectedSecondAdmin, setSelectedSecondAdmin] = useState<PlatformAccountOption | null>(null);

  const [formData, setFormData] = useState({
    institutionName: "",
    institutionType: "" as InstitutionType | "",
    country: "Kenya",
    city: "",
    address: "",
    registrationNumber: "",
    healthcareStaffCount: "",
    contactPhone: "",
    contactDesignation: "",
    platformNeeds: [] as InstitutionPlatformNeed[],
    departmentNames: [""],
    agreeToTerms: false,
  });

  useEffect(() => {
    if (!user?.phone) return;
    setFormData((prev) => (prev.contactPhone ? prev : { ...prev, contactPhone: user.phone ?? "" }));
  }, [user?.phone]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setPlatformNeed = (need: InstitutionPlatformNeed, on: boolean) => {
    setFormData((prev) => {
      const has = prev.platformNeeds.includes(need);
      if (on === has) return prev;
      if (on) return { ...prev, platformNeeds: [...prev.platformNeeds, need] };
      return { ...prev, platformNeeds: prev.platformNeeds.filter((item) => item !== need) };
    });
  };

  const handleNext = () => {
    if (step === 1 && formData.institutionName.trim().length < 3) {
      setError("Enter an organization name with at least 3 characters, or select a listed facility.");
      return;
    }
    if (step === 1 && !formData.institutionType) {
      setError("Select the type of organization you are onboarding.");
      return;
    }
    if (step === 2) {
      if (!formData.contactPhone.trim() || !formData.contactDesignation.trim()) {
        setError("Add the primary administrator's role and an institution contact phone number.");
        return;
      }
      const secondAdminError = validateSecondAdminSelection({
        primaryAdminUserId: user?.id,
        secondAdminUserId: selectedSecondAdmin?.id,
      });
      if (secondAdminError) {
        setError(secondAdminError);
        return;
      }
    }
    if (step === 3 && formData.platformNeeds.length === 0) {
      setError("Select at least one platform area you want to use or discuss.");
      return;
    }

    setError("");
    setStep((currentStep) => currentStep + 1);
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
      setError("Select the type of organization you are onboarding.");
      setLoading(false);
      return;
    }

    if (!formData.contactPhone.trim() || !formData.contactDesignation.trim()) {
      setError("Add the primary administrator's role and an institution contact phone number.");
      setStep(2);
      setLoading(false);
      return;
    }

    const secondAdminError = validateSecondAdminSelection({
      primaryAdminUserId: user?.id,
      secondAdminUserId: selectedSecondAdmin?.id,
    });
    if (secondAdminError) {
      setError(secondAdminError);
      setStep(2);
      setLoading(false);
      return;
    }

    if (formData.platformNeeds.length === 0) {
      setError("Select at least one platform area you want to use or discuss.");
      setStep(3);
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
      await acceptB2b.mutateAsync();
      await completeOnboarding.mutateAsync({
        institutionName: formData.institutionName.trim(),
        institutionType: formData.institutionType,
        registrationNumber: formData.registrationNumber.trim() || undefined,
        healthcareStaffCount: staffCount,
        country: formData.country.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        contactPhone: formData.contactPhone.trim(),
        contactDesignation: formData.contactDesignation.trim(),
        platformNeeds: formData.platformNeeds,
        secondAdminUserId: selectedSecondAdmin!.id,
        departmentNames: formData.departmentNames.filter((name) => name.trim().length >= 2),
      });
    } catch {
      // onError sets message + loading false
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Organization details", icon: Building2 },
    { number: 2, title: "Administrator access", icon: Users },
    { number: 3, title: "Platform needs", icon: ClipboardList },
    { number: 4, title: "Review & create", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-brand-surface/60 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Set up your Paeds Resus institution workspace</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tell us about your organization, connect two existing Paeds Resus administrator accounts, and choose the platform areas you want to use or discuss.
          </p>
          {!isAuthenticated && (
            <Card className="mt-6 p-4 text-left max-w-xl mx-auto border-border bg-secondary/50">
              <p className="text-sm text-foreground mb-3">
                Sign in with the Paeds Resus account that will be the primary institution administrator. The second administrator must already have a Paeds Resus account too.
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
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4" role="alert" aria-live="polite">
                <AlertCircle className="mt-0.5 text-red-600" size={20} />
                <p className="text-red-800">{error}</p>
              </div>
            )}
            {/* Step 1: Institution Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Organization details</h2>
                <p className="text-sm text-muted-foreground mb-4">Country defaults to Kenya. Change it if your organization operates elsewhere.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FacilityAutocomplete
                      value={formData.institutionName}
                      onSelect={(facility) => {
                        setSelectedFacility(facility);
                        if (facility) {
                          setFormData((prev) => ({
                            ...prev,
                            institutionName: facility.name,
                            registrationNumber: facility.code || "",
                          }));
                        }
                      }}
                      onManualEntry={(name) => {
                        setFormData((prev) => ({ ...prev, institutionName: name }));
                      }}
                      registrationNumber={formData.registrationNumber}
                      onRegistrationNumberChange={(value) =>
                        setFormData((prev) => ({ ...prev, registrationNumber: value }))
                      }
                      isManualEntry={isManualFacilityEntry}
                      onManualEntryChange={setIsManualFacilityEntry}
                      entityLabel="organization or facility"
                    />
                  </div>

                  <div>
                    <Label htmlFor="institutionType">Organization type *</Label>
                    <Select
                      value={formData.institutionType || undefined}
                      onValueChange={(v) => handleSelectChange("institutionType", v)}
                    >
                      <SelectTrigger id="institutionType">
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSTITUTION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Choose the closest fit. This helps us route your onboarding and does not limit which platform areas you can use.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="healthcareStaffCount">People to include in the portal *</Label>
                    <Input
                      id="healthcareStaffCount"
                      name="healthcareStaffCount"
                      type="number"
                      value={formData.healthcareStaffCount}
                      onChange={handleInputChange}
                      placeholder="e.g., 25 or 250"
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

                <div className="rounded-xl border border-brand-orange/30 bg-brand-surface/50 p-4 sm:p-5">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Label className="text-base">Departments or operating areas <span className="font-normal text-muted-foreground">(optional when not applicable)</span></Label>
                      <p className="mt-1 text-sm text-muted-foreground">Add the departments, teams, or operating areas you want to use for CPD reporting and readiness work. Leave this blank if your organization is not structured that way; you can configure it later.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" onClick={() => setFormData((prev) => ({ ...prev, departmentNames: [...prev.departmentNames, ""] }))}>
                      <Plus className="mr-1.5 h-4 w-4" />Add department
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.departmentNames.map((departmentName, index) => (
                      <div key={`department-${index}`} className="flex min-w-0 items-start gap-2">
                        <DepartmentSelectors
                          value={departmentName}
                          onChange={(value) => setFormData((prev) => ({ ...prev, departmentNames: prev.departmentNames.map((name, itemIndex) => itemIndex === index ? value : name) }))}
                          className="min-w-0 flex-1"
                        />
                        {formData.departmentNames.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" aria-label={`Remove department ${index + 1}`} onClick={() => setFormData((prev) => ({ ...prev, departmentNames: prev.departmentNames.filter((_, itemIndex) => itemIndex !== index) }))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                    <Label htmlFor="address">Main office or operating location *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                      placeholder="Office, campus, or operating location"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Administrator Access */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Administrator access</h2>
                  <p className="text-sm text-muted-foreground">
                    Administrator access is tied to Paeds Resus accounts, not typed names or email addresses. This prevents the wrong person from being linked to the institution.
                  </p>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-foreground">Primary administrator</p>
                  <p className="mt-2 font-medium text-foreground">{user?.name || "Your Paeds Resus account"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "Signed-in account email"}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    This is the Paeds Resus account currently signed in. It will be the first administrator for this institution.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="contactDesignation">Primary administrator role *</Label>
                    <Input
                      id="contactDesignation"
                      name="contactDesignation"
                      value={formData.contactDesignation}
                      onChange={handleInputChange}
                      placeholder="e.g., Director, CPD coordinator, or training lead"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Institution contact phone *</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      placeholder="+254 700 000 000"
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                <div className="border-t pt-6 mt-2">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Second administrator account <span className="text-destructive">*</span></h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Search by name or email and select the correct existing Paeds Resus account. We do not accept a manually typed administrator here, and the second account must be different from the primary account.
                    </p>
                  </div>
                  <PlatformAccountAutocomplete
                    selectedAccount={selectedSecondAdmin}
                    onSelect={setSelectedSecondAdmin}
                    label="Search for the second administrator"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 3: Platform needs */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">What do you want to use?</h2>
                  <p className="text-muted-foreground">
                    Select every platform area that fits your organization. This helps us configure access and route your first conversation; it does not enroll anyone in a course or start a training contract.
                  </p>
                </div>

                <div className="space-y-3">
                  {INSTITUTION_PLATFORM_NEED_OPTIONS.map((need) => (
                    <label
                      key={need.value}
                      htmlFor={`need-${need.value}`}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
                    >
                      <Checkbox
                        id={`need-${need.value}`}
                        checked={formData.platformNeeds.includes(need.value)}
                        onCheckedChange={(checked) => setPlatformNeed(need.value, checked === true)}
                        className="mt-0.5"
                      />
                      <span className="flex-1">
                        <span className="block font-semibold text-foreground">{need.label}</span>
                        <span className="text-sm text-muted-foreground">{need.description}</span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-950">
                  <strong>About training:</strong> Institutional Life Support Training is not yet an in-portal enrollment flow. Select Training partnership if you want the Paeds Resus team to discuss delivery separately; no course enrollment is created by this onboarding form.
                </div>
              </div>
            )}

            {/* Step 4: Review & Agreement */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">Review & create</h2>
                <p className="text-sm text-muted-foreground">
                  Check the organization details, linked administrator accounts, and platform needs. This creates the institution workspace; it does not enroll staff in a Life Support course.
                </p>

                <Card className="bg-muted/40 p-6 border-border">
                  <h3 className="font-semibold text-foreground mb-4">Summary</h3>
                  <div className="space-y-2 text-sm text-foreground/90">
                    <p><strong>Institution:</strong> {formData.institutionName}</p>
                    <p><strong>Type:</strong> {INSTITUTION_TYPE_OPTIONS.find((option) => option.value === formData.institutionType)?.label}</p>
                    <p><strong>Location:</strong> {formData.city}, {formData.country}</p>
                    <p><strong>People included:</strong> {formData.healthcareStaffCount}</p>
                    <p><strong>Primary administrator:</strong> {user?.name} ({user?.email})</p>
                    <p><strong>Second administrator:</strong> {selectedSecondAdmin?.name} ({selectedSecondAdmin?.email})</p>
                    <p><strong>Platform needs:</strong> {INSTITUTION_PLATFORM_NEED_OPTIONS.filter((option) => formData.platformNeeds.includes(option.value)).map((option) => option.label).join(", ")}</p>
                  </div>
                </Card>

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
                        I agree to the{" "}
                        <LegalExternalLink href="/terms" className="text-primary underline">
                          Terms of Service
                        </LegalExternalLink>
                        ,{" "}
                        <LegalExternalLink href="/privacy" className="text-primary underline">
                          Privacy Policy
                        </LegalExternalLink>
                        , and Institutional B2B data processing terms (see docs/legal/INSTITUTIONAL_B2B_ADDENDUM.md).
                        I acknowledge our institution acts as data controller for staff data shared with Paeds Resus for
                        training and QI dashboards.
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
                <Button type="button" variant="cta" onClick={handleNext} disabled={loading}>
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
            { title: "Shared administrator access", desc: "Link two existing Paeds Resus accounts so your organization is not dependent on one person" },
            { title: "CPD visibility", desc: "Track attendance, points, certificates, staff development, and reports in one workspace" },
            { title: "Readiness coordination", desc: "Configure institutional readiness and improvement areas when your organization is ready" },
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
