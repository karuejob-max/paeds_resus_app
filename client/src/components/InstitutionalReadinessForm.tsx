import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type InstitutionPlatformNeed } from "@shared/institution-onboarding";
import { INSTITUTIONAL_RESPONSE_PROMISE } from "@/const/marketingCopy";

const READINESS_NEEDS: Array<{
  value: InstitutionPlatformNeed;
  label: string;
}> = [
  { value: "iers_readiness", label: "IERS emergency readiness" },
  {
    value: "paeds_resus_training",
    label: "ILSP institutional life-support training",
  },
  { value: "cpd_portal", label: "ICPD professional development" },
  {
    value: "institution_administration",
    label: "Institution administration and access",
  },
  { value: "other_support", label: "Something else or a guided conversation" },
];

const SIZE_BANDS = [
  ["1–50", "1–50 people"],
  ["51–150", "51–150 people"],
  ["151–500", "151–500 people"],
  ["500+", "More than 500 people"],
] as const;

export default function InstitutionalReadinessForm() {
  const [form, setForm] = useState({
    facilityName: "",
    role: "",
    sizeBand: "",
    primaryGap: "",
    email: "",
    phone: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const submit = trpc.institution.submitLeadInquiry.useMutation();

  const update = (field: keyof typeof form, value: string) =>
    setForm(current => ({ ...current, [field]: value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await submit.mutateAsync({
        institutionName: form.facilityName,
        contactName: form.role,
        contactEmail: form.email,
        contactPhone: form.phone,
        staffCount: Number(form.sizeBand.split("–")[0]) || 1,
        platformNeeds: [form.primaryGap as InstitutionPlatformNeed],
        message: `Readiness conversation request. Facility size band: ${form.sizeBand}. Contact role: ${form.role}.`,
      });
      setSubmitted(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We could not save your request. Please use WhatsApp or try again."
      );
    }
  }

  if (submitted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="flex items-start gap-3 p-6">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <h3 className="font-semibold text-emerald-950">
              Readiness conversation requested
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-emerald-900">
              {INSTITUTIONAL_RESPONSE_PROMISE} This request does not enroll
              staff or create a course order.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setSubmitted(false)}
            >
              Send another request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="readiness-conversation" className="border-primary/20 shadow-sm">
      <CardHeader>
        <CardTitle>Book an emergency-readiness conversation</CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Tell us enough to route the conversation. We will help you choose
          between ILSP, IERS, and ICPD before discussing a detailed scope.
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            {error} WhatsApp remains available as a direct fallback.
          </p>
        )}
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Facility or organisation name
            <Input
              className="mt-2"
              required
              value={form.facilityName}
              onChange={event => update("facilityName", event.target.value)}
              placeholder="Your hospital or organisation"
            />
          </label>
          <label className="text-sm font-medium">
            Your role
            <Input
              className="mt-2"
              required
              value={form.role}
              onChange={event => update("role", event.target.value)}
              placeholder="Medical director, nursing lead, HR…"
            />
          </label>
          <label className="text-sm font-medium">
            Approximate people in scope
            <select
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              value={form.sizeBand}
              onChange={event => update("sizeBand", event.target.value)}
            >
              <option value="">Choose a range</option>
              {SIZE_BANDS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Primary need
            <select
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              value={form.primaryGap}
              onChange={event => update("primaryGap", event.target.value)}
            >
              <option value="">Choose a need</option>
              {READINESS_NEEDS.map(need => (
                <option key={need.value} value={need.value}>
                  {need.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Work email
            <Input
              className="mt-2"
              type="email"
              required
              value={form.email}
              onChange={event => update("email", event.target.value)}
              placeholder="name@organisation.org"
            />
          </label>
          <label className="text-sm font-medium">
            Phone or WhatsApp
            <Input
              className="mt-2"
              type="tel"
              required
              value={form.phone}
              onChange={event => update("phone", event.target.value)}
              placeholder="+254…"
            />
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Request conversation
            </Button>
            <a href="https://wa.me/254706781260?text=Hello%20Paeds%20Resus%2C%20I%20would%20like%20an%20institutional%20readiness%20conversation.">
              <Button type="button" variant="outline">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp instead
              </Button>
            </a>
          </div>
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            We use these details to scope and follow up on your institutional
            enquiry. This is not a course enrolment.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
