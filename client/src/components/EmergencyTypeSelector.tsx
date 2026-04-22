/**
 * Emergency Type Selector Component
 * 
 * Routes providers to the appropriate clinical engine based on emergency type.
 * Implements ABCDE assessment with immediate escalation to specialized engines.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Wind, AlertTriangle, Zap, Brain, Droplet } from 'lucide-react';

export type EmergencyType = 'cpr' | 'status_asthmaticus' | 'bronchiolitis' | 'pneumonia' | 'ards' | 'upper_airway' | 'anaphylaxis' | 'septic_shock' | 'dka' | 'status_epilepticus';

interface EmergencyTypeSelectorProps {
  patientWeight: number;
  patientAgeMonths: number;
  onSelectEmergency: (type: EmergencyType) => void;
}

const EMERGENCY_TYPES = [
  {
    id: 'cpr' as EmergencyType,
    label: 'Cardiac Arrest',
    icon: Heart,
    description: 'Unresponsive, no pulse',
    color: 'bg-red-100 text-red-900 border-red-300',
    buttonColor: 'bg-red-600 hover:bg-red-700',
    priority: 'CRITICAL',
  },
    {
    id: 'status_asthmaticus' as EmergencyType,
    label: 'Status Asthmaticus',
    icon: Wind,
    description: 'Severe asthma exacerbation',
    color: 'bg-orange-100 text-orange-900 border-orange-300',
    buttonColor: 'bg-orange-600 hover:bg-orange-700',
    priority: 'HIGH',
  },
  {
    id: 'bronchiolitis' as EmergencyType,
    label: 'Bronchiolitis',
    icon: Wind,
    description: 'Acute bronchiolitis with respiratory distress',
    color: 'bg-blue-100 text-blue-900 border-blue-300',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    priority: 'HIGH',
  },
  {
    id: 'pneumonia' as EmergencyType,
    label: 'Pneumonia',
    icon: Wind,
    description: 'Community-acquired pneumonia',
    color: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    buttonColor: 'bg-cyan-600 hover:bg-cyan-700',
    priority: 'HIGH',
  },
  {
    id: 'ards' as EmergencyType,
    label: 'ARDS',
    icon: Wind,
    description: 'Acute respiratory distress syndrome',
    color: 'bg-red-100 text-red-900 border-red-300',
    buttonColor: 'bg-red-600 hover:bg-red-700',
    priority: 'CRITICAL',
  },
  {
    id: 'upper_airway' as EmergencyType,
    label: 'Upper Airway Obstruction',
    icon: AlertTriangle,
    description: 'Croup, epiglottitis, or laryngeal stridor',
    color: 'bg-red-100 text-red-900 border-red-300',
    buttonColor: 'bg-red-600 hover:bg-red-700',
    priority: 'CRITICAL',
  },
  {
    id: 'anaphylaxis' as EmergencyType,
    label: 'Anaphylaxis',
    icon: AlertTriangle,
    description: 'Allergic reaction with respiratory/cardiovascular signs',
    color: 'bg-red-100 text-red-900 border-red-300',
    buttonColor: 'bg-red-600 hover:bg-red-700',
    priority: 'CRITICAL',
  },
  {
    id: 'septic_shock' as EmergencyType,
    label: 'Septic Shock',
    icon: Droplet,
    description: 'Infection with hypotension/altered perfusion',
    color: 'bg-purple-100 text-purple-900 border-purple-300',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    priority: 'CRITICAL',
  },
  {
    id: 'dka' as EmergencyType,
    label: 'Diabetic Ketoacidosis',
    icon: Zap,
    description: 'Hyperglycemia with metabolic acidosis',
    color: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
    priority: 'HIGH',
  },
  {
    id: 'status_epilepticus' as EmergencyType,
    label: 'Status Epilepticus',
    icon: Brain,
    description: 'Prolonged or recurrent seizures',
    color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
    priority: 'HIGH',
  },
];

export const EmergencyTypeSelector: React.FC<EmergencyTypeSelectorProps> = ({
  patientWeight,
  patientAgeMonths,
  onSelectEmergency,
}) => {
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);

  const handleSelect = (type: EmergencyType) => {
    setSelectedType(type);
    onSelectEmergency(type);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">PaedsResusGPS</h1>
        <p className="mt-2 text-gray-600">Pediatric Emergency Decision Support System</p>
        <p className="mt-1 text-sm text-gray-500">
          Patient: {patientWeight} kg, {(patientAgeMonths / 12).toFixed(1)} years old
        </p>
      </div>

      {/* Critical Alert */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>If patient is unresponsive:</strong> Select "Cardiac Arrest" to begin CPR and BLS/ALS pathway
          immediately.
        </AlertDescription>
      </Alert>

      {/* Emergency Type Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {EMERGENCY_TYPES.map((emergency) => {
          const Icon = emergency.icon;
          return (
            <Card
              key={emergency.id}
              className={`cursor-pointer border-2 transition-all ${
                selectedType === emergency.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSelect(emergency.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {emergency.label}
                    </CardTitle>
                    <CardDescription>{emergency.description}</CardDescription>
                  </div>
                  <Badge className={emergency.color}>{emergency.priority}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(emergency.id);
                  }}
                  className={`w-full ${emergency.buttonColor}`}
                >
                  Start {emergency.label}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Information Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Comprehensive Coverage:</strong> CPR, Respiratory, Shock, Metabolic, Neurological
            </p>
            <p>
              <strong>Weight-Based Dosing:</strong> All medications calculated for {patientWeight}kg
            </p>
            <p>
              <strong>AHA Guidelines:</strong> All protocols aligned with current PALS/ECC standards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✓ Real-time clinical recommendations</p>
            <p>✓ Medication eligibility tracking</p>
            <p>✓ Override logging with justification</p>
            <p>✓ Admin quality improvement dashboard</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyTypeSelector;

