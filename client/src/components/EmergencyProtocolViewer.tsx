import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, ChevronRight, ChevronLeft, Check, Clock, AlertTriangle } from "lucide-react";

interface ProtocolViewerProps {
  protocolId?: number;
  patientId: number;
  category?: "diarrhea" | "pneumonia" | "malaria" | "meningitis" | "shock";
  onComplete?: (outcome: string) => void;
}

export const EmergencyProtocolViewer: React.FC<ProtocolViewerProps> = ({
  protocolId,
  patientId,
  category,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [protocol, setProtocol] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [adherenceLogId, setAdherenceLogId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  // Get protocol
  const getProtocolQuery = protocolId
    ? trpc.emergencyProtocols.getProtocol.useQuery({ protocolId })
    : category
    ? trpc.emergencyProtocols.getProtocolByCategory.useQuery({ category })
    : null;

  // Start protocol
  const startProtocolMutation = trpc.emergencyProtocols.startProtocol.useMutation();

  // Complete step
  const completeStepMutation = trpc.emergencyProtocols.completeStep.useMutation();

  // End protocol
  const endProtocolMutation = trpc.emergencyProtocols.endProtocol.useMutation();

  useEffect(() => {
    if (getProtocolQuery?.data) {
      setProtocol(getProtocolQuery.data.protocol);
      setSteps(getProtocolQuery.data.steps || []);
    }
  }, [getProtocolQuery?.data]);

  const handleStartProtocol = async () => {
    if (!protocol) return;

    const result = await startProtocolMutation.mutateAsync({
      patientId,
      protocolId: protocol.id,
    });

    setAdherenceLogId(result.adherenceLogId);
    setIsActive(true);
    setCurrentStep(0);
  };

  const handleNextStep = async () => {
    if (!adherenceLogId || currentStep >= steps.length - 1) return;

    const nextStep = currentStep + 1;
    await completeStepMutation.mutateAsync({
      adherenceLogId,
      stepId: steps[currentStep].id,
      stepNumber: nextStep,
    });

    setCurrentStep(nextStep);
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEndProtocol = async (outcome: string) => {
    if (!adherenceLogId) return;

    await endProtocolMutation.mutateAsync({
      adherenceLogId,
      outcome: outcome as any,
      notes: `Protocol completed with outcome: ${outcome}`,
    });

    setIsActive(false);
    setSelectedOutcome(outcome);
    onComplete?.(outcome);
  };

  if (!protocol) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-8 w-8 text-yellow-600" />
          <p className="text-gray-600">Loading protocol...</p>
        </div>
      </Card>
    );
  }

  if (!isActive) {
    return (
      <Card className="p-6 border-2 border-red-200 bg-red-50">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-red-900">{protocol.name}</h3>
          <p className="text-sm text-red-700 mt-2">{protocol.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold text-gray-700">Severity</p>
            <p className="text-lg font-bold text-red-600">{protocol.severity?.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Est. Mortality</p>
            <p className="text-lg font-bold text-red-600">{protocol.estimatedMortality}%</p>
          </div>
        </div>

        {protocol.keySymptoms && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Key Symptoms</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {JSON.parse(protocol.keySymptoms).map((symptom: string, idx: number) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{symptom}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {protocol.redFlags && (
          <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded">
            <p className="text-sm font-semibold text-red-900 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Red Flags
            </p>
            <ul className="text-sm text-red-800 space-y-1">
              {JSON.parse(protocol.redFlags).map((flag: string, idx: number) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={handleStartProtocol}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3"
          disabled={startProtocolMutation.isPending}
        >
          {startProtocolMutation.isPending ? "Starting..." : "START PROTOCOL"}
        </Button>
      </Card>
    );
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Counter */}
      <div className="text-sm text-gray-600 text-center">
        Step {currentStep + 1} of {steps.length}
      </div>

      {/* Current Step */}
      <Card className="p-6 border-2 border-green-200 bg-green-50">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-green-900">{currentStepData.title}</h3>
            <Clock className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-sm text-green-700 font-semibold">{currentStepData.timeframe}</p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Description */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
            <p className="text-sm text-gray-600">{currentStepData.description}</p>
          </div>

          {/* Action */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Action</p>
            <p className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
              {currentStepData.action}
            </p>
          </div>

          {/* Expected Outcome */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Expected Outcome</p>
            <p className="text-sm text-gray-600">{currentStepData.expectedOutcome}</p>
          </div>

          {/* Medications */}
          {currentStepData.medications &&
            JSON.parse(currentStepData.medications).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Medications</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {JSON.parse(currentStepData.medications).map((med: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2 text-blue-600">💊</span>
                      <span>{med}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Warnings */}
          {currentStepData.warnings && JSON.parse(currentStepData.warnings).length > 0 && (
            <div className="p-3 bg-yellow-100 border border-yellow-300 rounded">
              <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Warnings</p>
              <ul className="text-sm text-yellow-800 space-y-1">
                {JSON.parse(currentStepData.warnings).map((warning: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
            variant="outline"
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNextStep}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold text-gray-700">Protocol Complete. Select Outcome:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleEndProtocol("improved")}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  ✓ Improved
                </Button>
                <Button
                  onClick={() => handleEndProtocol("stable")}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  ↔ Stable
                </Button>
                <Button
                  onClick={() => handleEndProtocol("deteriorated")}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  ↓ Deteriorated
                </Button>
                <Button
                  onClick={() => handleEndProtocol("transferred")}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
                >
                  → Transferred
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
