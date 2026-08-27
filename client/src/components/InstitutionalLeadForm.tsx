import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { INSTITUTION_PLATFORM_NEED_OPTIONS, type InstitutionPlatformNeed } from "@shared/institution-onboarding";

interface LeadFormData {
  institutionName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  staffCount: number;
  platformNeeds: InstitutionPlatformNeed[];
  message: string;
}

export function InstitutionalLeadForm() {
  const [formData, setFormData] = useState<LeadFormData>({
    institutionName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    staffCount: 0,
    platformNeeds: ["cpd_portal"],
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  const submitLead = trpc.institution.submitLeadInquiry.useMutation({
    onError: (err) => {
      setSaveError(err.message || "Could not save your request. You can still use WhatsApp.");
    },
  });

  const setPlatformNeed = (need: InstitutionPlatformNeed, on: boolean) => {
    setFormData((prev) => {
      const has = prev.platformNeeds.includes(need);
      if (on === has) return prev;
      if (on) return { ...prev, platformNeeds: [...prev.platformNeeds, need] };
      return { ...prev, platformNeeds: prev.platformNeeds.filter((item) => item !== need) };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "staffCount" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveError("");

    try {
      await submitLead.mutateAsync({
        institutionName: formData.institutionName,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        staffCount: formData.staffCount,
        platformNeeds: formData.platformNeeds,
        message: formData.message || undefined,
      });
    } catch {
      /* onError sets saveError */
    }

    const selectedNeeds = INSTITUTION_PLATFORM_NEED_OPTIONS
      .filter((need) => formData.platformNeeds.includes(need.value))
      .map((need) => need.label)
      .join(", ");
    const whatsappMessage = `Hi Paeds Resus,\n\nWe would like to discuss ${selectedNeeds} for our organization.\n\nInstitution: ${formData.institutionName}\nPeople to include: ${formData.staffCount}\n\nPlease contact me at ${formData.contactPhone} or ${formData.contactEmail}.\n\nNote: this request is for scoping and follow-up; it does not enroll staff in a course.\n\nThank you,\n${formData.contactName}`;
    const whatsappUrl = `https://wa.me/254706781260?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, "_blank");

    setSubmitted(true);
    setLoading(false);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        institutionName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        staffCount: 0,
        platformNeeds: ["cpd_portal"],
        message: "",
      });
    }, 4000);
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center bg-green-50 border-green-200">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">Quote Request Sent</h3>
        <p className="text-green-700">
          Your details were saved and WhatsApp opened. Our team will review your request and follow up using the
          contact details you shared.
        </p>
        {saveError && <p className="text-amber-800 text-sm mt-2">{saveError}</p>}
      </Card>
    );
  }

  return (
    <Card className="p-8 bg-white">
      <h2 className="text-2xl font-bold mb-6">Request an Institutional Quote</h2>
      {saveError && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
          {saveError} WhatsApp will still open so you can reach us directly.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name *</label>
            <Input
              type="text"
              name="institutionName"
              value={formData.institutionName}
              onChange={handleChange}
              placeholder="e.g., County referral hospital, nursing school, or training organization"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
            <Input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Full name"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
            <Input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <Input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+254 7XX XXX XXX"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Staff to Train *</label>
            <Input
              type="number"
              name="staffCount"
              value={formData.staffCount}
              onChange={handleChange}
              placeholder="e.g., 50"
              required
              min="1"
              className="w-full"
            />
          </div>

          <fieldset className="md:col-span-2">
            <legend className="block text-sm font-medium text-gray-700 mb-2">What would you like to discuss? *</legend>
            <p className="text-xs text-gray-500 mb-3">Choose platform areas or support needs. This request does not enroll staff in a Life Support course.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {INSTITUTION_PLATFORM_NEED_OPTIONS.map((need) => (
                <label key={need.value} className="flex items-start gap-3 rounded-md border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
                  <Checkbox
                    checked={formData.platformNeeds.includes(need.value)}
                    onCheckedChange={(checked) => setPlatformNeed(need.value, checked === true)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{need.label}</span>
                    <span className="block text-xs text-gray-500 mt-1">{need.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>


        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information (Optional)</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
              placeholder="Tell us about your organization, timeline, current CPD activity, readiness goals, or questions..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          type="submit"
          disabled={
            loading ||
            !formData.institutionName ||
            !formData.contactName ||
            !formData.contactEmail ||
            !formData.contactPhone ||
            formData.staffCount === 0 ||
            formData.platformNeeds.length === 0
          }
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          {loading ? "Sending..." : "Send Quote Request via WhatsApp"}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Clicking this button opens WhatsApp with your request details. We use this information only to scope your
          institutional inquiry and follow up.
        </p>
      </form>
    </Card>
  );
}
