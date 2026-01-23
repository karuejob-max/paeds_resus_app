import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users, Activity, Zap } from "lucide-react";

interface PatientRisk {
  id: string;
  name: string;
  age: number;
  condition: string;
  riskScore: number;
  confidence: number;
  timeToDeterioration: string;
  recommendedAction: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  lastUpdated: Date;
}

interface InterventionOutcome {
  patientId: string;
  predicted: boolean;
  actual: boolean;
  timestamp: Date;
}

export default function PredictiveInterventionDashboard() {
  const [patients, setPatients] = useState<PatientRisk[]>([]);
  const [outcomes, setOutcomes] = useState<InterventionOutcome[]>([]);
  const [modelAccuracy, setModelAccuracy] = useState(87);
  const [interventionsToday, setInterventionsToday] = useState(12);
  const [livesImpacted, setLivesImpacted] = useState(47);

  // Simulate real-time patient risk data
  useEffect(() => {
    const mockPatients: PatientRisk[] = [
      {
        id: "P001",
        name: "Amara K.",
        age: 3,
        condition: "Respiratory Distress",
        riskScore: 94,
        confidence: 0.94,
        timeToDeterioration: "4-6 hours",
        recommendedAction: "Start oxygen therapy, monitor SpO2 every 15 min",
        severity: "CRITICAL",
        lastUpdated: new Date(),
      },
      {
        id: "P002",
        name: "Juma M.",
        age: 5,
        condition: "Suspected Sepsis",
        riskScore: 87,
        confidence: 0.87,
        timeToDeterioration: "6-12 hours",
        recommendedAction: "Start antibiotics, IV fluids, blood cultures",
        severity: "HIGH",
        lastUpdated: new Date(),
      },
      {
        id: "P003",
        name: "Grace N.",
        age: 2,
        condition: "Malaria with Complications",
        riskScore: 76,
        confidence: 0.76,
        timeToDeterioration: "8-24 hours",
        recommendedAction: "Artemisinin therapy, monitor glucose, manage seizures",
        severity: "HIGH",
        lastUpdated: new Date(),
      },
      {
        id: "P004",
        name: "David O.",
        age: 4,
        condition: "Acute Gastroenteritis",
        riskScore: 45,
        confidence: 0.85,
        timeToDeterioration: "24-48 hours",
        recommendedAction: "Rehydration therapy, electrolyte monitoring",
        severity: "MEDIUM",
        lastUpdated: new Date(),
      },
    ];

    setPatients(mockPatients);

    // Simulate outcomes
    const mockOutcomes: InterventionOutcome[] = [
      { patientId: "P005", predicted: true, actual: true, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { patientId: "P006", predicted: true, actual: true, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      { patientId: "P007", predicted: false, actual: false, timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      { patientId: "P008", predicted: true, actual: true, timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
    ];

    setOutcomes(mockOutcomes);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 border-red-300 text-red-900";
      case "HIGH":
        return "bg-orange-100 border-orange-300 text-orange-900";
      case "MEDIUM":
        return "bg-yellow-100 border-yellow-300 text-yellow-900";
      default:
        return "bg-gray-100 border-gray-300 text-gray-900";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "HIGH":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case "MEDIUM":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Predictive Intervention Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered patient risk alerts with confidence scores and recommended interventions
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Model Accuracy</p>
                  <div className="text-3xl font-bold text-blue-600">{modelAccuracy}%</div>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Based on 1,247 predictions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Interventions Today</p>
                  <div className="text-3xl font-bold text-green-600">{interventionsToday}</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Successful predictions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Lives Impacted</p>
                  <div className="text-3xl font-bold text-red-600">{livesImpacted}</div>
                </div>
                <Activity className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Active Alerts</p>
                  <div className="text-3xl font-bold text-orange-600">{patients.length}</div>
                </div>
                <Zap className="w-8 h-8 text-orange-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Requiring attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Critical Patient Alerts</h2>
          <div className="space-y-4">
            {patients
              .filter((p) => p.severity === "CRITICAL")
              .map((patient) => (
                <Card key={patient.id} className={`border-2 ${getSeverityColor(patient.severity)}`}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                      {/* Patient Info */}
                      <div className="md:col-span-1">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(patient.severity)}
                          <div>
                            <p className="font-semibold text-lg">{patient.name}</p>
                            <p className="text-sm text-gray-600">{patient.age} years old</p>
                            <p className="text-sm font-medium mt-1">{patient.condition}</p>
                          </div>
                        </div>
                      </div>

                      {/* Risk Assessment */}
                      <div className="md:col-span-1">
                        <p className="text-xs text-gray-600 mb-1">Risk Score</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{ width: `${patient.riskScore}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-red-600">{patient.riskScore}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Confidence: {(patient.confidence * 100).toFixed(0)}%
                        </p>
                      </div>

                      {/* Time to Deterioration */}
                      <div className="md:col-span-1">
                        <p className="text-xs text-gray-600 mb-1">Time to Deterioration</p>
                        <p className="font-semibold text-red-600">{patient.timeToDeterioration}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last updated: {patient.lastUpdated.toLocaleTimeString()}
                        </p>
                      </div>

                      {/* Recommended Action */}
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Recommended Intervention</p>
                        <p className="font-medium text-gray-900">{patient.recommendedAction}</p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">
                            Confirm Action
                          </Button>
                          <Button size="sm" variant="outline">
                            View History
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* High Priority Alerts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">High Priority Alerts</h2>
          <div className="space-y-3">
            {patients
              .filter((p) => p.severity === "HIGH")
              .map((patient) => (
                <Card key={patient.id} className={`border-2 ${getSeverityColor(patient.severity)}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(patient.severity)}
                        <div>
                          <p className="font-semibold">{patient.name}</p>
                          <p className="text-sm text-gray-600">{patient.condition}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600">Risk Score</p>
                        <p className="font-bold text-orange-600">{patient.riskScore}%</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600">Time to Deterioration</p>
                        <p className="font-semibold">{patient.timeToDeterioration}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Model Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Accuracy Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Model Accuracy Breakdown</CardTitle>
              <CardDescription>Performance on recent predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">True Positives</span>
                    <span className="text-sm font-bold text-green-600">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "94%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">True Negatives</span>
                    <span className="text-sm font-bold text-blue-600">89%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "89%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">False Positives</span>
                    <span className="text-sm font-bold text-yellow-600">6%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "6%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">False Negatives</span>
                    <span className="text-sm font-bold text-red-600">1%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: "1%" }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Prediction Outcomes</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {outcomes.map((outcome, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">Patient {outcome.patientId}</p>
                      <p className="text-xs text-gray-500">
                        {outcome.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {outcome.predicted === outcome.actual ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
