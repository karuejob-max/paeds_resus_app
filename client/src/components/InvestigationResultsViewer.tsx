import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingDown, TrendingUp, Zap, Loader } from "lucide-react";

interface InvestigationResultsViewerProps {
  investigationId: number;
  patientId: number;
}

export function InvestigationResultsViewer({
  investigationId,
  patientId,
}: InvestigationResultsViewerProps) {
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  // Fetch investigation results
  const { data: results, isLoading: resultsLoading } =
    trpc.investigations.getInvestigationResults.useQuery({
      investigationId,
    });

  // Fetch AI analysis
  const { data: analysis, isLoading: analysisLoading } =
    trpc.investigations.getInvestigationAnalysis.useQuery({
      investigationId,
    });

  // Fetch clinical insights
  const { data: insights, isLoading: insightsLoading } =
    trpc.investigations.getClinicalInsights.useQuery({
      patientId,
    });

  if (resultsLoading || analysisLoading || insightsLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe":
        return "bg-red-100 text-red-800";
      case "moderate":
        return "bg-orange-100 text-orange-800";
      case "mild":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Investigation Results */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Investigation Results</h3>

        {results && results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  setExpandedResult(expandedResult === index ? null : index)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{result.resultName}</p>
                    <p className="text-sm text-gray-600">
                      {result.resultValue} {result.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.isAbnormal && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <Badge className={getSeverityColor(result.severity)}>
                      {result.severity}
                    </Badge>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedResult === index && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    {result.normalRange && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Normal Range:</span>{" "}
                        {result.normalRange}
                      </p>
                    )}
                    {result.interpretation && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Interpretation:</span>{" "}
                        {result.interpretation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No results available</p>
        )}
      </Card>

      {/* AI Interpretation */}
      {analysis && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                AI Interpretation
              </h3>
              <p className="text-blue-800 mb-4">{analysis.aiInterpretation}</p>

              {analysis.confidence && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Confidence: {Math.round(analysis.confidence)}%
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${analysis.confidence}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Differential Diagnoses */}
              {analysis.differentialDiagnoses &&
                analysis.differentialDiagnoses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Possible Diagnoses:
                    </p>
                    <ul className="space-y-1">
                      {analysis.differentialDiagnoses.map(
                        (diagnosis: any, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-blue-800 flex items-center gap-2"
                          >
                            <span className="font-medium">
                              {index + 1}. {diagnosis.name}
                            </span>
                            {diagnosis.likelihood && (
                              <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                                {diagnosis.likelihood}% likely
                              </span>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </Card>
      )}

      {/* Clinical Insights */}
      {insights && insights.insights && insights.insights.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Clinical Insights</h3>

          <div className="space-y-3">
            {insights.insights.map((insight: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {insight.type === "warning" && (
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                )}
                {insight.type === "improvement" && (
                  <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                {insight.type === "deterioration" && (
                  <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}

                <div>
                  <p className="font-medium text-gray-900">{insight.value}</p>
                  {insight.recommendation && (
                    <p className="text-sm text-gray-600 mt-1">
                      {insight.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Abnormal Findings Summary */}
      {insights && insights.abnormalFindings > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              {insights.abnormalFindings} abnormal finding
              {insights.abnormalFindings !== 1 ? "s" : ""} detected. Review
              results carefully.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
