import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AddPatientForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male" as "male" | "female" | "other",
    diagnosis: "",
    heartRate: "",
    respiratoryRate: "",
    systolicBP: "",
    diastolicBP: "",
    oxygenSaturation: "",
    temperature: "",
    symptoms: "",
  });

  const addPatientMutation = trpc.patients.addPatient.useMutation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await addPatientMutation.mutateAsync({
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
        diagnosis: formData.diagnosis || undefined,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
        systolicBP: formData.systolicBP ? parseInt(formData.systolicBP) : undefined,
        diastolicBP: formData.diastolicBP ? parseInt(formData.diastolicBP) : undefined,
        oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        symptoms: formData.symptoms || undefined,
      });

      // Reset form
      setFormData({
        name: "",
        age: "",
        gender: "male",
        diagnosis: "",
        heartRate: "",
        respiratoryRate: "",
        systolicBP: "",
        diastolicBP: "",
        oxygenSaturation: "",
        temperature: "",
        symptoms: "",
      });

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to add patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Patient</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Patient Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter patient name"
              />
            </div>

            <div>
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                placeholder="Age"
              />
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                placeholder="Primary diagnosis"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Vital Signs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input
                  id="heartRate"
                  name="heartRate"
                  type="number"
                  value={formData.heartRate}
                  onChange={handleChange}
                  placeholder="60-100"
                />
              </div>

              <div>
                <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</Label>
                <Input
                  id="respiratoryRate"
                  name="respiratoryRate"
                  type="number"
                  value={formData.respiratoryRate}
                  onChange={handleChange}
                  placeholder="12-20"
                />
              </div>

              <div>
                <Label htmlFor="systolicBP">Systolic BP (mmHg)</Label>
                <Input
                  id="systolicBP"
                  name="systolicBP"
                  type="number"
                  value={formData.systolicBP}
                  onChange={handleChange}
                  placeholder="120"
                />
              </div>

              <div>
                <Label htmlFor="diastolicBP">Diastolic BP (mmHg)</Label>
                <Input
                  id="diastolicBP"
                  name="diastolicBP"
                  type="number"
                  value={formData.diastolicBP}
                  onChange={handleChange}
                  placeholder="80"
                />
              </div>

              <div>
                <Label htmlFor="oxygenSaturation">O2 Saturation (%)</Label>
                <Input
                  id="oxygenSaturation"
                  name="oxygenSaturation"
                  type="number"
                  value={formData.oxygenSaturation}
                  onChange={handleChange}
                  placeholder="95-100"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  name="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={handleChange}
                  placeholder="36.5-37.5"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="symptoms">Symptoms</Label>
              <textarea
                id="symptoms"
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                placeholder="Describe patient symptoms"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading || !formData.name} className="w-full">
            {loading ? "Adding Patient..." : "Add Patient"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
