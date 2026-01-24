import React, { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { InvestigationUpload } from "@/components/InvestigationUpload";
import { InvestigationResultsViewer } from "@/components/InvestigationResultsViewer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Loader, Calendar, FileText } from "lucide-react";

export default function InvestigationsPage() {
  const [, params] = useRoute("/investigations/:patientId");
  const patientId = params?.patientId ? parseInt(params.patientId) : 0;
  const [selectedInvestigation, setSelectedInvestigation] = useState<number | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Fetch investigation history
  const { data: investigations, isLoading: investigationsLoading, refetch } =
    trpc.investigations.getInvestigationHistory.useQuery({
      patientId,
    });

  if (investigationsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const getInvestigationTypeIcon = (type: string) => {
    switch (type) {
      case "lab":
        return "🧪";
      case "imaging":
        return "🖼️";
      default:
        return "📋";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Investigations</h1>
              <p className="text-sm text-gray-600">
                Patient ID: {patientId}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {showUploadForm ? "Cancel" : "+ Upload Investigation"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Form */}
          {showUploadForm && (
            <div className="lg:col-span-1">
              <InvestigationUpload
                patientId={patientId}
                onSuccess={() => {
                  setShowUploadForm(false);
                  refetch();
                }}
              />
            </div>
          )}

          {/* Investigations List and Details */}
          <div className={showUploadForm ? "lg:col-span-2" : "lg:col-span-3"}>
            {/* Investigations List */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Investigation History</h2>

              {investigations && investigations.length > 0 ? (
                <div className="space-y-2">
                  {investigations.map((inv: any) => (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvestigation(inv.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedInvestigation === inv.id
                          ? "bg-blue-50 border-blue-300"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">
                              {getInvestigationTypeIcon(inv.investigationType)}
                            </span>
                            <h3 className="font-medium text-gray-900">{inv.testName}</h3>
                            <Badge className="text-xs">
                              {inv.investigationType === "lab"
                                ? "Lab Test"
                                : inv.investigationType === "imaging"
                                  ? "Imaging"
                                  : "Other"}
                            </Badge>
                          </div>
                          {inv.description && (
                            <p className="text-sm text-gray-600 mb-2">{inv.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(inv.uploadedAt).toLocaleDateString()}
                            </span>
                            {inv.resultCount && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {inv.resultCount} result{inv.resultCount !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No investigations uploaded yet</p>
                  <Button
                    onClick={() => setShowUploadForm(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    Upload First Investigation
                  </Button>
                </div>
              )}
            </Card>

            {/* Investigation Details */}
            {selectedInvestigation && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Investigation Details</h2>
                <InvestigationResultsViewer
                  investigationId={selectedInvestigation}
                  patientId={patientId}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
