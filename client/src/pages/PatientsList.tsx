import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { AddPatientForm } from "@/components/AddPatientForm";

export default function PatientsList() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const patientsQuery = trpc.patients.getPatients.useQuery();
  const addPatientMutation = trpc.patients.addPatient.useMutation({
    onSuccess: () => {
      patientsQuery.refetch();
      setShowAddForm(false);
    },
  });

  if (loading || patientsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  const patients = patientsQuery.data || [];
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalCount = patients.filter(p => p.riskScore > 70).length;
  const highRiskCount = patients.filter(p => p.riskScore > 50 && p.riskScore <= 70).length;
  const mediumRiskCount = patients.filter(p => p.riskScore <= 50).length;

  const getRiskColor = (riskScore: number) => {
    if (riskScore > 70) return "bg-red-100 text-red-800 border-red-300";
    if (riskScore > 50) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore > 70) return "destructive";
    if (riskScore > 50) return "secondary";
    return "default";
  };

  const getSeverityLabel = (riskScore: number) => {
    if (riskScore > 70) return "CRITICAL";
    if (riskScore > 50) return "HIGH";
    return "MEDIUM";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
              <p className="text-gray-600 mt-2">Manage and monitor all your patients</p>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Patient
            </Button>
          </div>

          {/* Add Patient Form */}
          {showAddForm && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <AddPatientForm
                  onSuccess={() => setShowAddForm(false)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{patients.length}</div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-700">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700">High Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{highRiskCount}</div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700">Medium Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{mediumRiskCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search patients by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Patients List */}
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchTerm ? "No patients found matching your search" : "No patients yet. Add your first patient to get started."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddForm(true)}>Add First Patient</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${getRiskColor(patient.riskScore)}`}
                onClick={() => setLocation(`/patient/${patient.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{patient.name}</h3>
                        <Badge variant={getRiskBadgeColor(patient.riskScore)}>
                          {getSeverityLabel(patient.riskScore)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-medium opacity-75">Age</p>
                          <p className="text-sm font-semibold">{patient.age || "N/A"} years</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium opacity-75">Gender</p>
                          <p className="text-sm font-semibold capitalize">{patient.gender || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium opacity-75">Diagnosis</p>
                          <p className="text-sm font-semibold">{patient.diagnosis || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium opacity-75">Risk Score</p>
                          <p className="text-sm font-semibold">{patient.riskScore}%</p>
                        </div>
                      </div>

                      {patient.latestVitals && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                          <div>
                            <p className="opacity-75">HR</p>
                            <p className="font-semibold">{patient.latestVitals.heartRate || "—"} bpm</p>
                          </div>
                          <div>
                            <p className="opacity-75">RR</p>
                            <p className="font-semibold">{patient.latestVitals.respiratoryRate || "—"} /min</p>
                          </div>
                          <div>
                            <p className="opacity-75">O₂</p>
                            <p className="font-semibold">{patient.latestVitals.oxygenSaturation || "—"}%</p>
                          </div>
                          <div>
                            <p className="opacity-75">BP</p>
                            <p className="font-semibold">
                              {patient.latestVitals.systolicBP || "—"}/{patient.latestVitals.diastolicBP || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="opacity-75">Temp</p>
                            <p className="font-semibold">{patient.latestVitals.temperature || "—"}°C</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 text-right">
                      <div className="text-3xl font-bold mb-2">{patient.riskScore}%</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/patient/${patient.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
