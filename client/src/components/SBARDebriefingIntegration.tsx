/**
 * SBAR Debriefing Integration Component
 * 
 * Integrates SBAR generation into the post-event debriefing workflow
 * Automatically generates handover summary upon session completion
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Sparkles, BrainCircuit, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { generateSBARReport, type SessionData, type SBARReport } from '@/lib/resus/sbar-generator';
import SBARReportViewer from './SBARReportViewer';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

interface SBARDebriefingIntegrationProps {
  sessionData: SessionData;
  providerName: string;
  onReportGenerated?: (report: SBARReport) => void;
}

interface AIDebriefResponse {
  sbar: {
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  };
  feedback: {
    strengths: string[];
    delays: string[];
    correctiveActions: string[];
    spacedRepetitionTopic: string;
  };
}

export const SBARDebriefingIntegration: React.FC<SBARDebriefingIntegrationProps> = ({
  sessionData,
  providerName,
  onReportGenerated,
}) => {
  const [, setLocation] = useLocation();
  const [report, setReport] = useState<SBARReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  // AI Debriefing States
  const [aiDebrief, setAiDebrief] = useState<AIDebriefResponse | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiDebrief, setShowAiDebrief] = useState(false);

  const generateDebriefMutation = trpc.aiAssistant.generateSimulationDebrief.useMutation();

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
   * Call backend to get AI-powered debrief audit
   */
  const handleGenerateAIDebrief = async () => {
    try {
      setIsGeneratingAi(true);
      setAiError(null);

      const response = await generateDebriefMutation.mutateAsync({
        sessionId: sessionData.sessionId,
        emergencyType: sessionData.emergencyType,
        patient: {
          name: sessionData.patient.name,
          age: sessionData.patient.age,
          weightKg: sessionData.patient.weightKg,
          gender: sessionData.patient.gender,
          medicalRecordNumber: sessionData.patient.medicalRecordNumber,
        },
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        events: sessionData.events,
        overrides: sessionData.overrides,
        finalOutcome: sessionData.finalOutcome,
      });

      if (response.success && response.sbar && response.feedback) {
        setAiDebrief(response as AIDebriefResponse);
        setShowAiDebrief(true);
      } else {
        throw new Error('Malformed debrief response received');
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate AI debrief');
      console.error('AI debrief error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

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

  // SBAR Report Viewer override
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

  // AI Debrief Panel View
  if (showAiDebrief && aiDebrief) {
    return (
      <div className="sbar-debriefing-integration bg-slate-50 dark:bg-slate-950 rounded-2xl shadow-xl p-6 max-w-3xl mx-auto border border-slate-200/60 dark:border-slate-800 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          <button
            onClick={() => setShowAiDebrief(false)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <ArrowLeft size={16} /> Back to Summary
          </button>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles size={18} className="animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider">AI Clinician Debrief</span>
          </div>
        </div>

        {/* AI Handover (SBAR) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 mb-6 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 text-base">
            <BrainCircuit size={20} className="text-indigo-500" />
            AI-Enhanced Handover SBAR
          </h3>
          <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              <strong className="text-slate-800 dark:text-slate-200 block mb-1">Situation</strong>
              {aiDebrief.sbar.situation}
            </p>
            <p>
              <strong className="text-slate-800 dark:text-slate-200 block mb-1">Background</strong>
              {aiDebrief.sbar.background}
            </p>
            <p>
              <strong className="text-slate-800 dark:text-slate-200 block mb-1">Assessment</strong>
              {aiDebrief.sbar.assessment}
            </p>
            <p>
              <strong className="text-slate-800 dark:text-slate-200 block mb-1">Recommendation</strong>
              {aiDebrief.sbar.recommendation}
            </p>
          </div>
        </div>

        {/* Audit Feedback Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Strengths */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-4">
            <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm mb-2.5 flex items-center gap-1.5">
              <CheckCircle size={16} /> Key Strengths
            </h4>
            <ul className="text-xs text-emerald-900/90 dark:text-emerald-300/90 space-y-2 list-disc list-inside">
              {aiDebrief.feedback.strengths.map((s, idx) => (
                <li key={idx} className="leading-normal">{s}</li>
              ))}
            </ul>
          </div>

          {/* Delays & Compliance Warnings */}
          <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl p-4">
            <h4 className="font-bold text-rose-800 dark:text-rose-400 text-sm mb-2.5 flex items-center gap-1.5">
              <Clock size={16} /> Guideline Discrepancies
            </h4>
            <ul className="text-xs text-rose-900/90 dark:text-rose-300/90 space-y-2 list-disc list-inside">
              {aiDebrief.feedback.delays.length > 0 ? (
                aiDebrief.feedback.delays.map((d, idx) => (
                  <li key={idx} className="leading-normal">{d}</li>
                ))
              ) : (
                <li className="list-none italic text-slate-500">No major guideline discrepancies detected. Good timing compliance!</li>
              )}
            </ul>
          </div>
        </div>

        {/* Corrective Actions & Spaced Repetition Link */}
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 mb-6">
          <h4 className="font-bold text-blue-800 dark:text-blue-400 text-sm mb-3">Recommended Actions & Training</h4>
          <ul className="text-xs text-blue-900/90 dark:text-blue-300/90 space-y-2 list-disc list-inside mb-4">
            {aiDebrief.feedback.correctiveActions.map((c, idx) => (
              <li key={idx} className="leading-normal">{c}</li>
            ))}
          </ul>
          
          <button
            onClick={() => setLocation(`/micro-course/${aiDebrief.feedback.spacedRepetitionTopic || 'general'}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
          >
            Review Recommended Training Module <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Close */}
        <button
          onClick={() => setShowAiDebrief(false)}
          className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition"
        >
          Close Debrief
        </button>
      </div>
    );
  }

  return (
    <div className="sbar-debriefing-integration bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 max-w-2xl mx-auto border border-slate-100 dark:border-slate-800">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <Clock size={24} className="text-blue-600 dark:text-blue-400" />
          Post-Event Debriefing & Handover
        </h2>
        <p className="text-gray-600 dark:text-slate-400 mt-2 text-sm">
          Clinical handover summary for {sessionData.patient.name} ({sessionData.patient.age} years, {sessionData.patient.weightKg}kg)
        </p>
      </div>

      {/* Event Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border-l-4 border-blue-500">
          <p className="text-xs text-gray-600 dark:text-slate-400">Duration</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{durationMinutes}m</p>
        </div>
        <div className="bg-green-50/50 dark:bg-green-950/20 p-4 rounded-xl border-l-4 border-green-500">
          <p className="text-xs text-gray-600 dark:text-slate-400">Interventions</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{eventSummary.interventions}</p>
        </div>
        <div className="bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-xl border-l-4 border-orange-500">
          <p className="text-xs text-gray-600 dark:text-slate-400">Medications</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{eventSummary.medications}</p>
        </div>
      </div>

      {/* Generation Status */}
      {isGenerating && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-xl flex items-center gap-3">
          <div className="animate-spin">
            <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="text-sm text-yellow-800 dark:text-yellow-300">Generating SBAR handover summary...</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {report && !isGenerating && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-300">SBAR handover summary generated successfully</p>
        </div>
      )}

      {aiError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-300">{aiError}</p>
        </div>
      )}

      {/* Session Overview */}
      <div className="mb-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl">
        <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-3 text-sm">Session Overview</h3>
        <div className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
          <p>
            <span className="font-semibold">Emergency Type:</span>{' '}
            <span>{sessionData.emergencyType.replace('_', ' ').toUpperCase()}</span>
          </p>
          <p>
            <span className="font-semibold">Patient:</span>{' '}
            <span>
              {sessionData.patient.name}, {sessionData.patient.age} years, {sessionData.patient.weightKg}kg
            </span>
          </p>
          <p>
            <span className="font-semibold">Outcome:</span>{' '}
            <span className={`font-semibold ${
              sessionData.finalOutcome === 'ROSC' ? 'text-green-600 dark:text-green-400' :
              sessionData.finalOutcome === 'Transferred' ? 'text-blue-600 dark:text-blue-400' :
              sessionData.finalOutcome === 'Ongoing' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {sessionData.finalOutcome}
            </span>
          </p>
          <p>
            <span className="font-semibold">Events Logged:</span>{' '}
            <span>{sessionData.events.length}</span>
          </p>
          {sessionData.overrides.length > 0 && (
            <p>
              <span className="font-semibold">Protocol Overrides:</span>{' '}
              <span className="text-orange-600 dark:text-orange-400 font-semibold">{sessionData.overrides.length}</span>
            </p>
          )}
        </div>
      </div>

      {/* Protocol Overrides Summary */}
      {sessionData.overrides.length > 0 && (
        <div className="mb-6 bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-xl border-l-4 border-orange-500">
          <h3 className="font-bold text-orange-900 dark:text-orange-300 mb-3 text-sm">Protocol Deviations Documented</h3>
          <div className="space-y-2">
            {sessionData.overrides.map((override, index) => (
              <div key={index} className="text-xs bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-orange-200/35 dark:border-orange-900/35">
                <p className="font-semibold text-orange-850 dark:text-orange-350">{override.overrideType}</p>
                <p className="text-gray-700 dark:text-slate-300 mt-1">Justification: {override.justification}</p>
                <p className="text-gray-550 dark:text-slate-400 mt-1">Provider: {override.provider}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6">
        <button
          onClick={() => setShowReport(true)}
          disabled={isGenerating || !report}
          className="w-full sm:flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm"
        >
          View Handover Summary
        </button>

        <button
          onClick={handleGenerateAIDebrief}
          disabled={isGenerating || isGeneratingAi || !report}
          className="w-full sm:flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm"
        >
          {isGeneratingAi ? (
            <>
              <Clock size={16} className="animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={16} /> AI Clinician Debrief
            </>
          )}
        </button>

        <button
          onClick={() => window.print()}
          disabled={isGenerating || !report}
          className="w-full sm:w-auto px-5 py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition disabled:opacity-50 text-sm"
        >
          Print Summary
        </button>
      </div>
    </div>
  );
};

export default SBARDebriefingIntegration;
