import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, TrendingUp, Activity, Zap, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

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
}

export default function PredictiveInterventionDashboard() {
  const [patients] = useState<PatientRisk[]>([
    {
      id: "P001",
      name: "Amara Okonkwo",
      age: 3,
      condition: "Sepsis Risk",
      riskScore: 94,
      confidence: 0.94,
      timeToDeterioration: "12 hours",
      recommendedAction: "Start broad-spectrum antibiotics, increase IV fluids, monitor vitals every 2 hours",
      severity: "CRITICAL",
    },
    {
      id: "P002",
      name: "Kofi Mensah",
      age: 5,
      condition: "Respiratory Distress",
      riskScore: 87,
      confidence: 0.87,
      timeToDeterioration: "18 hours",
      recommendedAction: "Increase oxygen delivery, prepare for intubation, call respiratory team",
      severity: "HIGH",
    },
    {
      id: "P003",
      name: "Zainab Hassan",
      age: 2,
      condition: "Dehydration",
      riskScore: 72,
      confidence: 0.89,
      timeToDeterioration: "24 hours",
      recommendedAction: "Increase IV rehydration rate, monitor electrolytes, check urine output",
      severity: "HIGH",
    },
  ]);

  const [confirmedActions, setConfirmedActions] = useState<string[]>([]);

  const handleConfirmAction = (patientId: string) => {
    setConfirmedActions([...confirmedActions, patientId]);
    alert(`Action confirmed for patient. Healthcare team has been notified.`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "border-l-4 border-l-red-600 bg-red-50";
      case "HIGH":
        return "border-l-4 border-l-orange-600 bg-orange-50";
      case "MEDIUM":
        return "border-l-4 border-l-yellow-600 bg-yellow-50";
      default:
        return "border-l-4 border-l-gray-600 bg-gray-50";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const criticalCount = patients.filter((p) => p.severity === "CRITICAL").length;
  const highCount = patients.filter((p) => p.severity === "HIGH").length;
  const mediumCount = patients.filter((p) => p.severity === "MEDIUM").length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Predictive Intervention Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered patient risk alerts with confidence scores and recommended interventions
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Critical Alerts</p>
                  <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">High Priority</p>
                  <div className="text-3xl font-bold text-orange-600">{highCount}</div>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Medium Priority</p>
                  <div className="text-3xl font-bold text-yellow-600">{mediumCount}</div>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Actions Confirmed</p>
                  <div className="text-3xl font-bold text-green-600">{confirmedActions.length}</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model Performance */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Model Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Overall Accuracy</p>
                <p className="text-2xl font-bold text-blue-600">87%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">True Positive Rate</p>
                <p className="text-2xl font-bold text-green-600">94%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">False Positive Rate</p>
                <p className="text-2xl font-bold text-orange-600">11%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Alerts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Patient Risk Alerts</h2>

          {patients.map((patient) => (
            <Card key={patient.id} className={getSeverityColor(patient.severity)}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Patient Info */}
                  <div>
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(patient.severity)}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-600">Age: {patient.age} years</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${getSeverityBadge(patient.severity)}`}>
                          {patient.severity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Condition & Risk */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Condition</p>
                    <p className="text-lg font-semibold text-gray-900 mb-3">{patient.condition}</p>
                    <p className="text-sm text-gray-600 mb-1">Risk Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-300 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            patient.riskScore >= 80
                              ? "bg-red-600"
                              : patient.riskScore >= 70
                                ? "bg-orange-600"
                                : "bg-yellow-600"
                          }`}
                          style={{ width: `${patient.riskScore}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-900">{patient.riskScore}%</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Confidence: {(patient.confidence * 100).toFixed(0)}%</p>
                  </div>

                  {/* Time & Action */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Time to Deterioration</p>
                    <p className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {patient.timeToDeterioration}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">Recommended Action</p>
                    <p className="text-sm text-gray-900">{patient.recommendedAction}</p>
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-col gap-2">
                    {confirmedActions.includes(patient.id) ? (
                      <div className="flex items-center gap-2 text-green-600 font-semibold p-3 bg-green-100 rounded">
                        <CheckCircle className="w-5 h-5" />
                        Action Confirmed
                      </div>
                    ) : (
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                        onClick={() => handleConfirmAction(patient.id)}
                      >
                        Confirm Action
                      </Button>
                    )}
                    <Link href="/kaizen-dashboard">
                      <Button variant="outline" className="w-full">
                        View History
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Outcomes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Intervention Outcomes</CardTitle>
            <CardDescription>Validation of predictions vs. actual outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="font-semibold text-gray-900">Sepsis Prediction - Kofi Mensah</p>
                  <p className="text-sm text-gray-600">Predicted 18 hours before onset</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  ✓ Prevented
                </span>
              </div>

              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="font-semibold text-gray-900">Respiratory Distress - Amara Okonkwo</p>
                  <p className="text-sm text-gray-600">Predicted 24 hours before onset</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  ✓ Prevented
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Dehydration - Zainab Hassan</p>
                  <p className="text-sm text-gray-600">Predicted 12 hours before onset</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  ✓ Prevented
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/personalized-learning">
            <Button className="gap-2">
              View Learning Path
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </Link>
          <Link href="/kaizen-dashboard">
            <Button variant="outline" className="gap-2">
              Kaizen Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
