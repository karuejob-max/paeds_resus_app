import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmergencyProtocolViewer } from "@/components/EmergencyProtocolViewer";
import { AlertCircle, BookOpen, Shield } from "lucide-react";

export const EmergencyProtocols: React.FC = () => {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const getAllProtocolsQuery = trpc.emergencyProtocols.getAllProtocols.useQuery();
  const getAdherenceStatsQuery = trpc.emergencyProtocols.getAdherenceStats.useQuery();

  const protocols = getAllProtocolsQuery.data?.protocols || [];

  const protocolCategories = [
    {
      id: "diarrhea",
      name: "Severe Diarrhea",
      icon: "🌊",
      color: "bg-blue-100 border-blue-300",
      description: "Management of severe dehydrating diarrhea",
    },
    {
      id: "pneumonia",
      name: "Pneumonia",
      icon: "🫁",
      color: "bg-red-100 border-red-300",
      description: "Management of severe community-acquired pneumonia",
    },
    {
      id: "malaria",
      name: "Malaria",
      icon: "🦟",
      color: "bg-yellow-100 border-yellow-300",
      description: "Management of severe malaria",
    },
    {
      id: "meningitis",
      name: "Meningitis",
      icon: "🧠",
      color: "bg-purple-100 border-purple-300",
      description: "Management of bacterial meningitis",
    },
    {
      id: "shock",
      name: "Septic Shock",
      icon: "⚡",
      color: "bg-red-100 border-red-400",
      description: "Management of pediatric septic shock",
    },
  ];

  if (showViewer && selectedProtocol) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Button
          onClick={() => {
            setShowViewer(false);
            setSelectedProtocol(null);
          }}
          variant="outline"
          className="mb-4"
        >
          ← Back to Protocols
        </Button>
        <EmergencyProtocolViewer
          category={selectedProtocol as any}
          patientId={selectedPatientId || 1}
          onComplete={(outcome) => {
            alert(`Protocol completed with outcome: ${outcome}`);
            setShowViewer(false);
            setSelectedProtocol(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Emergency Protocols</h1>
          </div>
          <p className="text-gray-600">
            Evidence-based protocols for managing common pediatric emergencies
          </p>
        </div>

        {/* Stats */}
        {getAdherenceStatsQuery.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Protocols Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {getAdherenceStatsQuery.data.totalProtocolsUsed}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {getAdherenceStatsQuery.data.completedProtocols}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Avg Adherence</p>
              <p className="text-2xl font-bold text-blue-600">
                {getAdherenceStatsQuery.data.avgAdherence}%
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Improved</p>
              <p className="text-2xl font-bold text-green-600">
                {getAdherenceStatsQuery.data.outcomeStats.improved}
              </p>
            </Card>
          </div>
        )}

        {/* Protocol Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {protocolCategories.map((category) => (
            <Card
              key={category.id}
              className={`p-6 border-2 cursor-pointer hover:shadow-lg transition-all ${category.color}`}
              onClick={() => {
                setSelectedProtocol(category.id);
                setShowViewer(true);
              }}
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
              <p className="text-sm text-gray-700 mb-4">{category.description}</p>
              <Button className="w-full" variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                View Protocol
              </Button>
            </Card>
          ))}
        </div>

        {/* Available Protocols */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Available Protocols ({protocols.length})
          </h2>

          <div className="space-y-3">
            {protocols.map((protocol: any) => (
              <div
                key={protocol.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedProtocol(protocol.category);
                  setShowViewer(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{protocol.name}</h3>
                    <p className="text-sm text-gray-600">{protocol.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Age: {protocol.ageMin}-{protocol.ageMax} months</span>
                      <span>Severity: {protocol.severity}</span>
                      <span>Est. Mortality: {protocol.estimatedMortality}%</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Reference */}
        <Card className="p-6 mt-8 bg-blue-50 border-2 border-blue-200">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Quick Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-semibold mb-2">🚨 When to Use Protocols:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Child presents with emergency symptoms</li>
                <li>Need step-by-step clinical guidance</li>
                <li>Want to track adherence and outcomes</li>
                <li>Need evidence-based recommendations</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">✓ Protocol Features:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Age-specific guidance</li>
                <li>Medication dosing calculator</li>
                <li>Decision trees for branching</li>
                <li>Outcome tracking</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
