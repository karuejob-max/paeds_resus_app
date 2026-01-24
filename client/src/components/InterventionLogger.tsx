import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface InterventionLoggerProps {
  patientId: number;
  onSuccess?: (data: any) => void;
}

export function InterventionLogger({ patientId, onSuccess }: InterventionLoggerProps) {
  const [formData, setFormData] = useState({
    interventionType: "medication",
    interventionName: "",
    dosage: "",
    route: "",
    indication: "",
    outcome: "",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const logInterventionMutation = trpc.interventions.logIntervention.useMutation({
    onSuccess: (data: any) => {
      if (onSuccess) onSuccess(data);
      // Reset form
      setFormData({
        interventionType: "medication",
        interventionName: "",
        dosage: "",
        route: "",
        indication: "",
        outcome: "",
        notes: "",
      });
    },
    onError: (error: any) => {
      console.error("Error logging intervention:", error);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await logInterventionMutation.mutateAsync({
        patientId,
        interventionType: formData.interventionType,
        description: [
          formData.interventionName,
          formData.dosage && `Dosage: ${formData.dosage}`,
          formData.route && `Route: ${formData.route}`,
          formData.indication && `Indication: ${formData.indication}`,
          formData.outcome && `Outcome: ${formData.outcome}`,
          formData.notes && `Notes: ${formData.notes}`,
        ]
          .filter(Boolean)
          .join(" | ") as any,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const interventionTypes = [
    { value: "medication", label: "Medication", icon: "💊" },
    { value: "procedure", label: "Procedure", icon: "🔧" },
    { value: "monitoring", label: "Monitoring", icon: "📊" },
    { value: "referral", label: "Referral", icon: "🚑" },
    { value: "other", label: "Other", icon: "📝" },
  ];

  const currentType = interventionTypes.find((t) => t.value === formData.interventionType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Log Intervention
        </CardTitle>
        <CardDescription>
          Record medications, procedures, monitoring, or referrals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Intervention Type Selection */}
          <div className="space-y-3">
            <Label>Intervention Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {interventionTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                onClick={() =>
                  setFormData((prev: any) => ({
                    ...prev,
                    interventionType: type.value,
                  }))
                }
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.interventionType === type.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Intervention Name */}
          <div className="space-y-2">
            <Label htmlFor="interventionName">
              {formData.interventionType === "medication"
                ? "Medication Name"
                : formData.interventionType === "procedure"
                  ? "Procedure Name"
                  : "Intervention Name"}
              *
            </Label>
            <Input
              id="interventionName"
              name="interventionName"
              placeholder={
                formData.interventionType === "medication"
                  ? "e.g., Epinephrine"
                  : formData.interventionType === "procedure"
                    ? "e.g., IV insertion"
                    : "e.g., Continuous monitoring"
              }
              value={formData.interventionName}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Medication/Procedure Specific Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(formData.interventionType === "medication" ||
              formData.interventionType === "procedure") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dosage">
                    {formData.interventionType === "medication" ? "Dosage" : "Details"}
                  </Label>
                  <Input
                    id="dosage"
                    name="dosage"
                    placeholder={
                      formData.interventionType === "medication"
                        ? "e.g., 0.01 mg/kg"
                        : "e.g., Central line"
                    }
                    value={formData.dosage}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="route">
                    {formData.interventionType === "medication" ? "Route" : "Location"}
                  </Label>
                  <Input
                    id="route"
                    name="route"
                    placeholder={
                      formData.interventionType === "medication" ? "e.g., IV, IM, PO" : "e.g., Right arm"
                    }
                    value={formData.route}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}
          </div>

          {/* Indication */}
          <div className="space-y-2">
            <Label htmlFor="indication">Indication / Reason</Label>
            <Input
              id="indication"
              name="indication"
              placeholder="Why was this intervention given?"
              value={formData.indication}
              onChange={handleInputChange}
            />
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome</Label>
            <select
              id="outcome"
              name="outcome"
              value={formData.outcome}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select outcome...</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Any additional details..."
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || logInterventionMutation.isPending || !formData.interventionName}
            className="w-full"
          >
            {isLoading || logInterventionMutation.isPending ? "Logging..." : "Log Intervention"}
          </Button>

          {logInterventionMutation.isSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-300 rounded-lg text-green-900">
              <CheckCircle2 className="w-5 h-5" />
              <span>Intervention logged successfully!</span>
            </div>
          )}

          {logInterventionMutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 rounded-lg text-red-900">
              <AlertCircle className="w-5 h-5" />
              <span>Error logging intervention. Please try again.</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
