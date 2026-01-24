import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Heart, Wind, Droplets, Thermometer, Weight, Ruler } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface VitalSignsFormProps {
  patientId: number;
  onSuccess?: (data: any) => void;
}

export function VitalSignsForm({ patientId, onSuccess }: VitalSignsFormProps) {
  const [formData, setFormData] = useState({
    heartRate: "",
    respiratoryRate: "",
    systolicBP: "",
    diastolicBP: "",
    oxygenSaturation: "",
    temperature: "",
    weight: "",
    height: "",
    age: "",
    symptoms: [] as string[],
    notes: "",
  });

  const [riskResult, setRiskResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const logVitalsMutation = trpc.vitals.logVitals.useMutation({
    onSuccess: (data) => {
      setRiskResult(data);
      if (onSuccess) onSuccess(data);
      // Reset form
      setFormData({
        heartRate: "",
        respiratoryRate: "",
        systolicBP: "",
        diastolicBP: "",
        oxygenSaturation: "",
        temperature: "",
        weight: "",
        height: "",
        age: "",
        symptoms: [],
        notes: "",
      });
    },
    onError: (error) => {
      console.error("Error logging vitals:", error);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      await logVitalsMutation.mutateAsync({
        patientId,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
        systolicBP: formData.systolicBP ? parseInt(formData.systolicBP) : undefined,
        diastolicBP: formData.diastolicBP ? parseInt(formData.diastolicBP) : undefined,
        oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        symptoms: formData.symptoms,
        notes: formData.notes,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-red-50 border-red-300 text-red-900";
      case "HIGH":
        return "bg-orange-50 border-orange-300 text-orange-900";
      case "MEDIUM":
        return "bg-yellow-50 border-yellow-300 text-yellow-900";
      case "LOW":
        return "bg-green-50 border-green-300 text-green-900";
      default:
        return "bg-gray-50 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Log Vital Signs
          </CardTitle>
          <CardDescription>
            Enter patient vital signs to calculate risk score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vital Signs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Heart Rate */}
              <div className="space-y-2">
                <Label htmlFor="heartRate" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Heart Rate (bpm)
                </Label>
                <Input
                  id="heartRate"
                  name="heartRate"
                  type="number"
                  placeholder="60-100"
                  value={formData.heartRate}
                  onChange={handleInputChange}
                  min="0"
                  max="300"
                />
              </div>

              {/* Respiratory Rate */}
              <div className="space-y-2">
                <Label htmlFor="respiratoryRate" className="flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  Respiratory Rate (breaths/min)
                </Label>
                <Input
                  id="respiratoryRate"
                  name="respiratoryRate"
                  type="number"
                  placeholder="12-20"
                  value={formData.respiratoryRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                />
              </div>

              {/* Oxygen Saturation */}
              <div className="space-y-2">
                <Label htmlFor="oxygenSaturation" className="flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  O₂ Saturation (%)
                </Label>
                <Input
                  id="oxygenSaturation"
                  name="oxygenSaturation"
                  type="number"
                  placeholder="95-100"
                  value={formData.oxygenSaturation}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                />
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature" className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperature (°C)
                </Label>
                <Input
                  id="temperature"
                  name="temperature"
                  type="number"
                  placeholder="36.5-37.5"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  step="0.1"
                  min="30"
                  max="45"
                />
              </div>

              {/* Systolic BP */}
              <div className="space-y-2">
                <Label htmlFor="systolicBP">Systolic BP (mmHg)</Label>
                <Input
                  id="systolicBP"
                  name="systolicBP"
                  type="number"
                  placeholder="100-120"
                  value={formData.systolicBP}
                  onChange={handleInputChange}
                  min="0"
                  max="300"
                />
              </div>

              {/* Diastolic BP */}
              <div className="space-y-2">
                <Label htmlFor="diastolicBP">Diastolic BP (mmHg)</Label>
                <Input
                  id="diastolicBP"
                  name="diastolicBP"
                  type="number"
                  placeholder="60-80"
                  value={formData.diastolicBP}
                  onChange={handleInputChange}
                  min="0"
                  max="200"
                />
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Weight className="w-4 h-4" />
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  placeholder="20"
                  value={formData.weight}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                />
              </div>

              {/* Height */}
              <div className="space-y-2">
                <Label htmlFor="height" className="flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Height (cm)
                </Label>
                <Input
                  id="height"
                  name="height"
                  type="number"
                  placeholder="120"
                  value={formData.height}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                />
              </div>

              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  placeholder="5"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="0"
                  max="18"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Any additional observations..."
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || logVitalsMutation.isPending}
              className="w-full"
            >
              {isLoading || logVitalsMutation.isPending ? "Calculating Risk..." : "Log Vital Signs"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Risk Score Result */}
      {riskResult && (
        <Card className={`border-2 ${getRiskColor(riskResult.riskLevel)}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Risk Assessment Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-600">Risk Score</p>
                <p className="text-3xl font-bold">{riskResult.riskScore}/100</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Risk Level</p>
                <p className="text-2xl font-bold">{riskResult.riskLevel}</p>
              </div>
            </div>

            {riskResult.riskFactors && riskResult.riskFactors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Risk Factors</p>
                <ul className="space-y-1">
                  {riskResult.riskFactors.map((factor: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
