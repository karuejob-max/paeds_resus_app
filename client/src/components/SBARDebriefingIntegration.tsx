/**
 * SBAR Debriefing Integration Component
 * 
 * Integrates SBAR generation into the post-event debriefing workflow
 * Automatically generates handover summary upon session completion
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { generateSBARReport, type SessionData, type SBARReport } from '@/lib/resus/sbar-generator';
import SBARReportViewer from './SBARReportViewer';

interface SBARDebriefingIntegrationProps {
  sessionData: SessionData;
  providerName: string;
  onReportGenerated?: (report: SBARReport) => void;
}

export const SBARDebriefingIntegration: React.FC<SBARDebriefingIntegrationProps> = ({
  sessionData,
  providerName,
  onReportGenerated,
}) => {
  const [report, setReport] = useState<SBARReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  /**
   * Generate SBAR report on component mount
   */
  useEffect(() => {
    const generateReport = async () => {
      try {
        setIsGenerating(true);
        setError(null);

        // Simulate async generation (in production, this might involve server-side processing)
        await new Promise(resolve => setTimeout(resolve, 500));

        const generatedReport = generateSBARReport(sessionData, providerName);
        setReport(generatedReport);

        if (onReportGenerated) {
          onReportGenerated(generatedReport);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate SBAR report');
        console.error('Error generating SBAR report:', err);
      } finally {
        setIsGenerating(false);
      }
    };

    generateReport();
  }, [sessionData, providerName, onReportGenerated]);

  /**
   * Calculate event summary statistics
   */
  const getEventSummary = () => {
    const interventions = sessionData.events.filter(e => e.eventType.includes('intervention')).length;
    const medications = sessionData.events.filter(e => e.eventType.includes('medication')).length;
    const assessments = sessionData.events.filter(e => e.eventType.includes('assessment')).length;

    return { interventions, medications, assessments };
  };

  const eventSummary = getEventSummary();
  const durationMinutes = Math.round((sessionData.endTime - sessionData.startTime) / 60000);

  if (showReport && report) {
    return (
      <SBARReportViewer
        report={report}
        patientName={sessionData.patient.name}
        emergencyType={sessionData.emergencyType}
        onClose={() => setShowReport(false)}
      />
    );
  }

  return (
    <div className="sbar-debriefing-integration bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Clock size={24} className="text-blue-600" />
          Post-Event Debriefing & Handover Summary
        </h2>
        <p className="text-gray-600 mt-2">
          Clinical handover summary for {sessionData.patient.name} ({sessionData.patient.age} years, {sessionData.patient.weightKg}kg)
        </p>
      </div>

      {/* Event Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Duration</p>
          <p className="text-2xl font-bold text-blue-600">{durationMinutes}m</p>
        </div>
        <div className="bg-green-50 p-4 rounded border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Interventions</p>
          <p className="text-2xl font-bold text-green-600">{eventSummary.interventions}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Medications</p>
          <p className="text-2xl font-bold text-orange-600">{eventSummary.medications}</p>
        </div>
      </div>

      {/* Generation Status */}
      {isGenerating && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-3">
          <div className="animate-spin">
            <Clock size={20} className="text-yellow-600" />
          </div>
          <p className="text-yellow-800">Generating SBAR handover summary...</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {report && !isGenerating && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-green-800">SBAR handover summary generated successfully</p>
        </div>
      )}

      {/* Session Overview */}
      <div className="mb-6 bg-gray-50 p-4 rounded">
        <h3 className="font-bold text-gray-800 mb-3">Session Overview</h3>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Emergency Type:</span>{' '}
            <span className="text-gray-700">{sessionData.emergencyType.replace('_', ' ').toUpperCase()}</span>
          </p>
          <p>
            <span className="font-semibold">Patient:</span>{' '}
            <span className="text-gray-700">
              {sessionData.patient.name}, {sessionData.patient.age} years, {sessionData.patient.weightKg}kg
            </span>
          </p>
          <p>
            <span className="font-semibold">Outcome:</span>{' '}
            <span className={`font-semibold ${
              sessionData.finalOutcome === 'ROSC' ? 'text-green-600' :
              sessionData.finalOutcome === 'Transferred' ? 'text-blue-600' :
              sessionData.finalOutcome === 'Ongoing' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {sessionData.finalOutcome}
            </span>
          </p>
          <p>
            <span className="font-semibold">Events Logged:</span>{' '}
            <span className="text-gray-700">{sessionData.events.length}</span>
          </p>
          {sessionData.overrides.length > 0 && (
            <p>
              <span className="font-semibold">Protocol Overrides:</span>{' '}
              <span className="text-orange-600 font-semibold">{sessionData.overrides.length}</span>
            </p>
          )}
        </div>
      </div>

      {/* Protocol Overrides Summary */}
      {sessionData.overrides.length > 0 && (
        <div className="mb-6 bg-orange-50 p-4 rounded border-l-4 border-orange-500">
          <h3 className="font-bold text-orange-900 mb-3">Protocol Deviations Documented</h3>
          <div className="space-y-2">
            {sessionData.overrides.map((override, index) => (
              <div key={index} className="text-sm bg-white p-2 rounded">
                <p className="font-semibold text-orange-800">{override.overrideType}</p>
                <p className="text-gray-700 text-xs mt-1">Justification: {override.justification}</p>
                <p className="text-gray-500 text-xs mt-1">Provider: {override.provider}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-between items-center border-t pt-6">
        <button
          onClick={() => setShowReport(true)}
          disabled={isGenerating || !report}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          View SBAR Report
        </button>

        <button
          onClick={() => window.print()}
          disabled={isGenerating || !report}
          className="flex-1 px-4 py-3 bg-gray-600 text-white rounded font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Print Summary
        </button>
      </div>

      {/* Clinical Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <h3 className="font-bold text-blue-900 mb-2">Next Steps</h3>
        <ul className="text-sm text-blue-900 space-y-1 list-disc list-inside">
          <li>Review SBAR summary for accuracy</li>
          <li>Ensure all weight-based calculations are verified</li>
          <li>Share handover with receiving facility if transferring</li>
          <li>Document any protocol deviations for quality improvement</li>
          <li>Conduct team debriefing to identify learning opportunities</li>
        </ul>
      </div>
    </div>
  );
};

export default SBARDebriefingIntegration;
