import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingDown, TrendingUp, Clock } from 'lucide-react';
import type { PEWSScore, TrendAnalysis } from '@/lib/predictive/predictive-engine';

interface EarlyWarningAlertProps {
  pewsScore: PEWSScore;
  trendAnalysis: TrendAnalysis;
  onEscalate?: () => void;
}

export function EarlyWarningAlert({
  pewsScore,
  trendAnalysis,
  onEscalate,
}: EarlyWarningAlertProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'orange':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'green':
        return 'bg-green-500 text-white';
      case 'yellow':
        return 'bg-yellow-500 text-white';
      case 'orange':
        return 'bg-orange-500 text-white';
      case 'red':
        return 'bg-red-500 text-white animate-pulse';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'improving') {
      return <TrendingDown className="w-5 h-5 text-green-600" />;
    } else if (direction === 'deteriorating') {
      return <TrendingUp className="w-5 h-5 text-red-600" />;
    }
    return null;
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 space-y-3 ${getSeverityColor(
        pewsScore.severity
      )}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-6 h-6" />
          <h3 className="font-bold text-lg">Early Warning Score</h3>
        </div>
        <span className={`px-3 py-1 rounded-full font-bold text-sm ${getSeverityBadgeColor(pewsScore.severity)}`}>
          {pewsScore.score}/18
        </span>
      </div>

      {/* Severity Level */}
      <div className="text-sm font-semibold">
        Severity: <span className="uppercase">{pewsScore.severity}</span>
      </div>

      {/* Trend Analysis */}
      {trendAnalysis && (
        <div className="bg-white/50 rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Trend:</span>
            <div className="flex items-center gap-2">
              {getTrendIcon(trendAnalysis.direction)}
              <span className="text-sm font-semibold capitalize">{trendAnalysis.direction}</span>
            </div>
          </div>

          {trendAnalysis.timeToEscalation !== undefined && trendAnalysis.timeToEscalation < 30 && (
            <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
              <Clock className="w-4 h-4" />
              <span>
                {trendAnalysis.timeToEscalation === 0
                  ? 'ESCALATE NOW'
                  : `Escalate in ${trendAnalysis.timeToEscalation} min`}
              </span>
            </div>
          )}

          <div className="text-xs text-gray-600">
            Predicted next score: {trendAnalysis.predictedNextScore.toFixed(1)}
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {pewsScore.riskFactors.length > 0 && (
        <div className="bg-white/50 rounded p-3 space-y-2">
          <h4 className="text-sm font-semibold">Risk Factors:</h4>
          <ul className="text-sm space-y-1">
            {pewsScore.riskFactors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {pewsScore.recommendations.length > 0 && (
        <div className="bg-white/50 rounded p-3 space-y-2">
          <h4 className="text-sm font-semibold">Recommendations:</h4>
          <ul className="text-sm space-y-1">
            {pewsScore.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-bold">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Escalation Button */}
      {(pewsScore.severity === 'orange' || pewsScore.severity === 'red') && onEscalate && (
        <button
          onClick={onEscalate}
          className={`w-full py-2 px-3 rounded font-bold text-white transition-all ${
            pewsScore.severity === 'red'
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {pewsScore.severity === 'red' ? 'ESCALATE IMMEDIATELY' : 'Escalate Care'}
        </button>
      )}
    </div>
  );
}

/**
 * Trend Visualization Component
 */
interface TrendVisualizationProps {
  scores: number[];
  timestamps: number[];
  severity: string;
}

export function TrendVisualization({ scores, timestamps, severity }: TrendVisualizationProps) {
  if (scores.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
        No trend data available
      </div>
    );
  }

  const maxScore = Math.max(...scores, 8);
  const minScore = Math.min(...scores, 0);
  const range = maxScore - minScore || 1;

  // Normalize scores to 0-100 for visualization
  const normalizedScores = scores.map(s => ((s - minScore) / range) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="font-bold text-sm">PEWS Trend (Last 60 minutes)</h3>

      {/* Mini Chart */}
      <div className="flex items-end gap-1 h-24 bg-gray-50 p-2 rounded">
        {normalizedScores.map((normalized, idx) => {
          const score = scores[idx];
          let color = 'bg-green-500';

          if (score <= 2) color = 'bg-green-500';
          else if (score <= 4) color = 'bg-yellow-500';
          else if (score <= 7) color = 'bg-orange-500';
          else color = 'bg-red-500';

          return (
            <div
              key={idx}
              className={`flex-1 rounded-t ${color} opacity-80 hover:opacity-100 transition-opacity`}
              style={{ height: `${Math.max(normalized, 5)}%` }}
              title={`Score: ${score}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Green (0-2)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded" />
          <span>Yellow (3-4)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded" />
          <span>Orange (5-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span>Red (8+)</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2 rounded">
        <div className="text-center">
          <div className="font-bold">{scores[scores.length - 1]}</div>
          <div className="text-gray-600">Current</div>
        </div>
        <div className="text-center">
          <div className="font-bold">{Math.max(...scores)}</div>
          <div className="text-gray-600">Peak</div>
        </div>
        <div className="text-center">
          <div className="font-bold">{Math.min(...scores)}</div>
          <div className="text-gray-600">Lowest</div>
        </div>
      </div>
    </div>
  );
}

/**
 * PEWS Component Summary
 */
interface PEWSComponentsProps {
  components: {
    behavior: number;
    cardiorespiratory: number;
    perfusion: number;
  };
}

export function PEWSComponents({ components }: PEWSComponentsProps) {
  const getComponentColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage === 0) return 'bg-green-500';
    if (percentage < 33) return 'bg-yellow-500';
    if (percentage < 67) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="font-bold text-sm">PEWS Components</h3>

      {/* Behavior */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Behavior</span>
          <span className="font-bold">{components.behavior}/3</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getComponentColor(components.behavior, 3)}`}
            style={{ width: `${(components.behavior / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Cardiorespiratory */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Cardiorespiratory</span>
          <span className="font-bold">{components.cardiorespiratory}/6</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getComponentColor(components.cardiorespiratory, 6)}`}
            style={{ width: `${(components.cardiorespiratory / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Perfusion */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Perfusion</span>
          <span className="font-bold">{components.perfusion}/6</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getComponentColor(components.perfusion, 6)}`}
            style={{ width: `${(components.perfusion / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Total */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex justify-between text-sm font-bold">
          <span>Total Score</span>
          <span>{components.behavior + components.cardiorespiratory + components.perfusion}/15</span>
        </div>
      </div>
    </div>
  );
}
