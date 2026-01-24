import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { Zap, X, AlertCircle, Check } from "lucide-react";

interface DefibrillatorInterfaceProps {
  sessionId: number;
  patientWeight: number;
  patientAge?: number;
  elapsedSeconds: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DefibrillatorInterface({
  sessionId,
  patientWeight,
  patientAge,
  elapsedSeconds,
  onClose,
  onSuccess,
}: DefibrillatorInterfaceProps) {
  const [rhythm, setRhythm] = useState<
    "VF" | "pulseless_VT" | "asystole" | "PEA" | "sinus" | "unknown"
  >("unknown");
  const [shockDelivered, setShockDelivered] = useState(false);
  const [customEnergy, setCustomEnergy] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<"ROSC" | "no_change" | "deterioration" | null>(
    null
  );

  const calculateEnergyQuery = trpc.cprClock.calculateDefibrillatorEnergy.useQuery({
    weightKg: patientWeight,
    ageMonths: patientAge,
    initialShock: true,
  });

  const logDefibrillationMutation = trpc.cprClock.logDefibrillation.useMutation();

  const energyData = calculateEnergyQuery.data;

  const handleDeliverShock = async () => {
    if (!energyData) return;

    try {
      const energy = customEnergy || energyData.initialEnergy;
      await logDefibrillationMutation.mutateAsync({
        sessionId,
        eventTime: elapsedSeconds,
        rhythm,
        shockDelivered,
        energyLevel: energy,
        energyPerKg: energyData.energyPerKg,
        outcome: outcome || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to log defibrillation:", error);
    }
  };

  const isShockable = ["VF", "pulseless_VT"].includes(rhythm);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-600" size={24} />
            <h2 className="text-2xl font-bold text-yellow-700">Defibrillator</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Rhythm Detection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Detected Rhythm
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["VF", "pulseless_VT", "asystole", "PEA", "sinus", "unknown"] as const).map(
              (r) => (
                <button
                  key={r}
                  onClick={() => setRhythm(r)}
                  className={`py-2 px-2 rounded font-semibold text-sm ${
                    rhythm === r
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {r === "VF"
                    ? "VF"
                    : r === "pulseless_VT"
                      ? "pVT"
                      : r === "asystole"
                        ? "Asystole"
                        : r === "PEA"
                          ? "PEA"
                          : r === "sinus"
                            ? "Sinus"
                            : "Unknown"}
                </button>
              )
            )}
          </div>
        </div>

        {/* Shockable Rhythm Alert */}
        {isShockable && (
          <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-sm text-red-700">
              <strong>SHOCKABLE RHYTHM DETECTED</strong>
              <br />
              Prepare for defibrillation. Clear the patient.
            </div>
          </div>
        )}

        {/* Energy Level Display */}
        {energyData && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-2">
              <strong>Recommended Energy:</strong>
            </div>
            <div className="text-3xl font-bold text-yellow-700 mb-2">
              {energyData.initialEnergy} J
            </div>
            <div className="text-xs text-gray-600">
              {energyData.energyPerKg} J/kg × {patientWeight} kg
            </div>
          </div>
        )}

        {/* Custom Energy Override */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Actual Energy Delivered (J)
          </label>
          <input
            type="number"
            step="10"
            value={customEnergy || (energyData?.initialEnergy || "")}
            onChange={(e) => setCustomEnergy(e.target.value ? Number(e.target.value) : null)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none"
          />
        </div>

        {/* Shock Delivered Checkbox */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shockDelivered}
              onChange={(e) => setShockDelivered(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm font-semibold text-gray-700">Shock Delivered</span>
          </label>
        </div>

        {/* Post-Shock Outcome */}
        {shockDelivered && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Post-Shock Outcome
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["ROSC", "no_change", "deterioration"] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setOutcome(o)}
                  className={`py-2 px-2 rounded font-semibold text-xs ${
                    outcome === o
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {o === "ROSC" ? "ROSC" : o === "no_change" ? "No Change" : "Deterioration"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Safety Alert */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-blue-700">
            <strong>Safety Check:</strong>
            <br />
            Ensure all personnel are clear. Verify pad placement. Confirm energy
            level before delivery.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDeliverShock}
            disabled={logDefibrillationMutation.isPending}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            Log Event
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
