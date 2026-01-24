import React, { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { AlertCircle, Check, X } from "lucide-react";

interface MedicationAdministrationProps {
  sessionId: number;
  patientWeight: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MedicationAdministration({
  sessionId,
  patientWeight,
  onClose,
  onSuccess,
}: MedicationAdministrationProps) {
  const [selectedMedication, setSelectedMedication] = useState<number | null>(null);
  const [route, setRoute] = useState<"IV" | "IO" | "IM" | "ET" | "IN">("IV");
  const [customDose, setCustomDose] = useState<number | null>(null);

  const getMedicationsQuery = trpc.cprClock.getMedications.useQuery();
  const calculateDoseQuery = trpc.cprClock.calculateMedicationDose.useQuery(
    selectedMedication
      ? { medicationId: selectedMedication, weightKg: patientWeight }
      : { medicationId: 0, weightKg: 0 },
    { enabled: !!selectedMedication }
  );
  const logMedicationMutation = trpc.cprClock.logMedication.useMutation();

  const medications = getMedicationsQuery.data?.medications || [];
  const calculatedDose = calculateDoseQuery.data;

  const handleAdminister = async () => {
    if (!selectedMedication || !calculatedDose) return;

    try {
      const dose = customDose || calculatedDose.calculatedDose;
      await logMedicationMutation.mutateAsync({
        sessionId,
        medicationId: selectedMedication,
        administeredAt: 0, // Will be set by backend
        dose,
        dosePerKg: calculatedDose.dosagePerKg,
        route,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to log medication:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-red-700">Medication Administration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Medication Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Medication
          </label>
          <select
            value={selectedMedication || ""}
            onChange={(e) => setSelectedMedication(Number(e.target.value))}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
          >
            <option value="">-- Select --</option>
            {medications.map((med: any) => (
              <option key={med.id} value={med.id}>
                {med.name} ({med.category})
              </option>
            ))}
          </select>
        </div>

        {/* Calculated Dose Display */}
        {calculatedDose && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-2">
              <strong>Medication:</strong> {calculatedDose.medicationName}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <strong>Dosage:</strong> {calculatedDose.dosagePerKg} mg/kg
            </div>
            <div className="text-lg font-bold text-blue-700 mb-2">
              Calculated Dose: {calculatedDose.calculatedDose.toFixed(2)} mg
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <strong>Max Dose:</strong> {calculatedDose.maxDose} mg
            </div>
            <div className="text-sm text-gray-600">
              <strong>Concentration:</strong> {calculatedDose.concentration}
            </div>
          </div>
        )}

        {/* Route Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Route of Administration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["IV", "IO", "IM", "ET", "IN"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoute(r)}
                className={`py-2 px-2 rounded font-semibold text-sm ${
                  route === r
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Dose Override */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Actual Dose Administered (mg)
          </label>
          <input
            type="number"
            step="0.1"
            value={customDose || (calculatedDose?.calculatedDose || "")}
            onChange={(e) => setCustomDose(e.target.value ? Number(e.target.value) : null)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
          />
          <div className="text-xs text-gray-500 mt-1">
            Leave blank to use calculated dose
          </div>
        </div>

        {/* Alert */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-yellow-700">
            Verify medication, dose, and route before administration. Double-check
            with team member if possible.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleAdminister}
            disabled={!selectedMedication || logMedicationMutation.isPending}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Administer
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
