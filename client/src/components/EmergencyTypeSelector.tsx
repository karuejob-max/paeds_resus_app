/**\n * Emergency Type Selector Component\n * \n * Routes providers to the appropriate clinical engine based on emergency type.\n * Implements ABCDE assessment with immediate escalation to specialized engines.\n */\n\nimport React, { useState } from 'react';\nimport { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';\nimport { Button } from '@/components/ui/button';\nimport { Badge } from '@/components/ui/badge';\nimport { Alert, AlertDescription } from '@/components/ui/alert';\nimport { Heart, Wind, AlertTriangle, Zap, Brain, Droplet } from 'lucide-react';\n\nexport type EmergencyType = 'cpr' | 'status_asthmaticus' | 'bronchiolitis' | 'pneumonia' | 'ards' | 'upper_airway' | 'anaphylaxis' | 'septic_shock' | 'dka' | 'status_epilepticus';\n\ninterface EmergencyTypeSelectorProps {\n  patientWeight: number;\n  patientAgeMonths: number;\n  onSelectEmergency: (type: EmergencyType) => void;\n}\n\nconst EMERGENCY_TYPES = [\n  {\n    id: 'cpr' as EmergencyType,\n    label: 'Cardiac Arrest',\n    icon: Heart,\n    description: 'Unresponsive, no pulse',\n    color: 'bg-red-100 text-red-900 border-red-300',\n    buttonColor: 'bg-red-600 hover:bg-red-700',\n    priority: 'CRITICAL',\n  },\n    {
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
  },\n  },\n  {\n    id: 'anaphylaxis' as EmergencyType,\n    label: 'Anaphylaxis',\n    icon: AlertTriangle,\n    description: 'Allergic reaction with respiratory/cardiovascular signs',\n    color: 'bg-red-100 text-red-900 border-red-300',\n    buttonColor: 'bg-red-600 hover:bg-red-700',\n    priority: 'CRITICAL',\n  },\n  {\n    id: 'septic_shock' as EmergencyType,\n    label: 'Septic Shock',\n    icon: Droplet,\n    description: 'Infection with hypotension/altered perfusion',\n    color: 'bg-purple-100 text-purple-900 border-purple-300',\n    buttonColor: 'bg-purple-600 hover:bg-purple-700',\n    priority: 'CRITICAL',\n  },\n  {\n    id: 'dka' as EmergencyType,\n    label: 'Diabetic Ketoacidosis',\n    icon: Zap,\n    description: 'Hyperglycemia with metabolic acidosis',\n    color: 'bg-yellow-100 text-yellow-900 border-yellow-300',\n    buttonColor: 'bg-yellow-600 hover:bg-yellow-700',\n    priority: 'HIGH',\n  },\n  {\n    id: 'status_epilepticus' as EmergencyType,\n    label: 'Status Epilepticus',\n    icon: Brain,\n    description: 'Prolonged or recurrent seizures',\n    color: 'bg-indigo-100 text-indigo-900 border-indigo-300',\n    buttonColor: 'bg-indigo-600 hover:bg-indigo-700',\n    priority: 'HIGH',\n  },\n];\n\nexport const EmergencyTypeSelector: React.FC<EmergencyTypeSelectorProps> = ({\n  patientWeight,\n  patientAgeMonths,\n  onSelectEmergency,\n}) => {\n  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);\n\n  const handleSelect = (type: EmergencyType) => {\n    setSelectedType(type);\n    onSelectEmergency(type);\n  };\n\n  return (\n    <div className=\"space-y-6\">\n      {/* Header */}\n      <div>\n        <h1 className=\"text-3xl font-bold text-gray-900\">PaedsResusGPS</h1>\n        <p className=\"mt-2 text-gray-600\">Pediatric Emergency Decision Support System</p>\n        <p className=\"mt-1 text-sm text-gray-500\">\n          Patient: {patientWeight} kg, {(patientAgeMonths / 12).toFixed(1)} years old\n        </p>\n      </div>\n\n      {/* Critical Alert */}\n      <Alert className=\"border-red-200 bg-red-50\">\n        <AlertTriangle className=\"h-4 w-4 text-red-600\" />\n        <AlertDescription className=\"text-red-800\">\n          <strong>If patient is unresponsive:</strong> Select \"Cardiac Arrest\" to begin CPR and BLS/ALS pathway\n          immediately.\n        </AlertDescription>\n      </Alert>\n\n      {/* Emergency Type Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">\">\n        {EMERGENCY_TYPES.map((emergency) => {\n          const Icon = emergency.icon;\n          return (\n            <Card\n              key={emergency.id}\n              className={`cursor-pointer border-2 transition-all ${\n                selectedType === emergency.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'\n              }`}\n              onClick={() => handleSelect(emergency.id)}\n            >\n              <CardHeader>\n                <div className=\"flex items-start justify-between\">\n                  <div className=\"flex-1\">\n                    <CardTitle className=\"flex items-center gap-2\">\n                      <Icon className=\"h-5 w-5\" />\n                      {emergency.label}\n                    </CardTitle>\n                    <CardDescription>{emergency.description}</CardDescription>\n                  </div>\n                  <Badge className={emergency.color}>{emergency.priority}</Badge>\n                </div>\n              </CardHeader>\n              <CardContent>\n                <Button\n                  onClick={(e) => {\n                    e.stopPropagation();\n                    handleSelect(emergency.id);\n                  }}\n                  className={`w-full ${emergency.buttonColor}`}\n                >\n                  Start {emergency.label}\n                </Button>\n              </CardContent>\n            </Card>\n          );\n        })}\n      </div>\n\n      {/* Information Cards */}\n      <div className=\"grid gap-4 md:grid-cols-2\">\n        <Card>\n          <CardHeader>\n            <CardTitle className=\"text-base\">Quick Reference</CardTitle>\n          </CardHeader>\n          <CardContent className=\"space-y-2 text-sm\">\n            <p>
              <strong>Comprehensive Coverage:</strong> CPR, Respiratory, Shock, Metabolic, Neurological
            </p>\n            <p>
              <strong>Weight-Based Dosing:</strong> All medications calculated for {patientWeight}kg
            </p>\n            <p>\n              <strong>AHA Guidelines:</strong> All protocols aligned with current PALS/ECC standards\n            </p>\n          </CardContent>\n        </Card>\n\n        <Card>\n          <CardHeader>\n            <CardTitle className=\"text-base\">System Features</CardTitle>\n          </CardHeader>\n          <CardContent className=\"space-y-2 text-sm\">\n            <p>✓ Real-time clinical recommendations</p>\n            <p>✓ Medication eligibility tracking</p>\n            <p>✓ Override logging with justification</p>\n            <p>✓ Admin quality improvement dashboard</p>\n          </CardContent>\n        </Card>\n      </div>\n    </div>\n  );\n};\n\nexport default EmergencyTypeSelector;\n
