import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddPatientForm } from "@/components/AddPatientForm";
import { PatientCard } from "@/components/PatientCard";
import { Link } from "wouter";

export function PersonalImpactDashboard() {
  const { user } = useAuth();
  const [showAddPatient, setShowAddPatient] = useState(false);

  // Fetch patients
  const patientsQuery = trpc.patients.getPatients.useQuery();
  const interventionStatsQuery = trpc.interventions.getInterventionStats.useQuery();

  // Refetch on success
  const handlePatientAdded = () => {
    setShowAddPatient(false);
    patientsQuery.refetch();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Please log in to view your impact dashboard</p>
          <Link href="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Your Impact Dashboard</h1>
        <p className="text-gray-600">Track your interventions and lives saved</p>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lives Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {interventionStatsQuery.data?.livesSaved || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Interventions Logged</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {interventionStatsQuery.data?.totalInterventions || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {interventionStatsQuery.data?.successRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Patients Monitored</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {patientsQuery.data?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Patients Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Patients</h2>
          <Button onClick={() => setShowAddPatient(!showAddPatient)}>
            {showAddPatient ? "Cancel" : "Add Patient"}
          </Button>
        </div>

        {showAddPatient && <AddPatientForm onSuccess={handlePatientAdded} />}

        {patientsQuery.isLoading ? (
          <div className="text-center py-8">Loading patients...</div>
        ) : patientsQuery.data && patientsQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patientsQuery.data.map((patient) => (
              <PatientCard
                key={patient.id}
                id={patient.id}
                name={patient.name}
                age={patient.age || undefined}
                gender={patient.gender || undefined}
                diagnosis={patient.diagnosis || undefined}
                riskScore={patient.riskScore || 0}
                severity={(patient.severity || "MEDIUM") as "CRITICAL" | "HIGH" | "MEDIUM"}
                confidence={patient.confidence}
                timeToDeterioration={patient.timeToDeterioration}
                onViewDetails={() => {
                  // Navigate to patient details
                }}
                onLogIntervention={() => {
                  // Open intervention form
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-gray-600">No patients yet. Add your first patient to get started!</p>
          </div>
        )}
      </div>

      {/* Intervention Statistics */}
      {interventionStatsQuery.data && (
        <Card>
          <CardHeader>
            <CardTitle>Intervention Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Improved</p>
                <p className="text-2xl font-bold text-green-600">
                  {interventionStatsQuery.data.improved}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stable</p>
                <p className="text-2xl font-bold text-blue-600">
                  {interventionStatsQuery.data.stable}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deteriorated</p>
                <p className="text-2xl font-bold text-orange-600">
                  {interventionStatsQuery.data.deteriorated}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Died</p>
                <p className="text-2xl font-bold text-red-600">
                  {interventionStatsQuery.data.died}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
