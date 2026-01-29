import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Download, Mail, Copy, CheckCircle } from 'lucide-react';
import { SBARHandover, formatSBARAsText } from '@/lib/sbarHandover';

interface HandoverSummaryProps {
  handover: SBARHandover;
  onExport?: (format: 'text' | 'pdf' | 'email') => void;
}

const CRITICALITY_COLORS = {
  routine: 'bg-green-100 text-green-800',
  urgent: 'bg-yellow-100 text-yellow-800',
  emergent: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const SEVERITY_COLORS = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

export function HandoverSummary({ handover, onExport }: HandoverSummaryProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = formatSBARAsText(handover);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: 'text' | 'pdf' | 'email') => {
    if (onExport) {
      onExport(format);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Criticality */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Clinical Handover Report
              </CardTitle>
              <CardDescription>
                Generated {new Date(handover.generatedAt).toLocaleString()}
              </CardDescription>
            </div>
            <Badge className={`text-lg px-3 py-2 ${CRITICALITY_COLORS[handover.criticalityLevel]}`}>
              {handover.criticalityLevel.toUpperCase()}
            </Badge>
          </div>

          {handover.requiresImmediateTransfer && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ IMMEDIATE TRANSFER REQUIRED - This patient requires urgent escalation to higher level of care
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
      </Card>

      {/* Clinician Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Handover Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-gray-600">From:</p>
              <p>{handover.clinicianName}</p>
              <p className="text-xs text-gray-500">{handover.clinicianRole}</p>
            </div>
            {handover.receivingClinician && (
              <div>
                <p className="font-semibold text-gray-600">To:</p>
                <p>{handover.receivingClinician}</p>
              </div>
            )}
            {handover.receivingFacility && (
              <div>
                <p className="font-semibold text-gray-600">Facility:</p>
                <p>{handover.receivingFacility}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SBAR Tabs */}
      <Tabs defaultValue="situation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="situation">Situation</TabsTrigger>
          <TabsTrigger value="background">Background</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
        </TabsList>

        {/* SITUATION */}
        <TabsContent value="situation">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Situation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Patient Identification */}
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="font-semibold text-blue-900">Patient Information</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Name:</p>
                    <p className="font-medium">{handover.situation.patientIdentification.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Age:</p>
                    <p className="font-medium">{handover.situation.patientIdentification.age} years</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Weight:</p>
                    <p className="font-medium">{handover.situation.patientIdentification.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gender:</p>
                    <p className="font-medium">{handover.situation.patientIdentification.gender}</p>
                  </div>
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <p className="font-semibold">Chief Complaint</p>
                <p className="text-sm text-gray-700">{handover.situation.chiefComplaint}</p>
              </div>

              {/* Timeline */}
              <div>
                <p className="font-semibold">Timeline</p>
                <p className="text-sm text-gray-700">{handover.situation.timelineOfPresentation}</p>
              </div>

              {/* Current Status */}
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="font-semibold">Current Status</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Consciousness:</p>
                    <p className="font-medium">{handover.situation.currentStatus.consciousness}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Breathing:</p>
                    <p className="font-medium">{handover.situation.currentStatus.breathing}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Circulation:</p>
                    <p className="font-medium">{handover.situation.currentStatus.circulation}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Temperature:</p>
                    <p className="font-medium">{handover.situation.currentStatus.temperature}°C</p>
                  </div>
                </div>
              </div>

              {/* Immediate Threats */}
              <div>
                <p className="font-semibold text-red-600">Immediate Threats</p>
                <div className="mt-2 space-y-1">
                  {handover.situation.immediateThreats.map((threat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>{threat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BACKGROUND */}
        <TabsContent value="background">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Allergies */}
              <div>
                <p className="font-semibold">Allergies</p>
                <p className="text-sm text-gray-700">
                  {handover.background.allergies.length > 0
                    ? handover.background.allergies.join(', ')
                    : 'NKDA (No Known Drug Allergies)'}
                </p>
              </div>

              {/* Medications */}
              <div>
                <p className="font-semibold">Current Medications</p>
                <p className="text-sm text-gray-700">
                  {handover.background.medications.length > 0
                    ? handover.background.medications.join(', ')
                    : 'None reported'}
                </p>
              </div>

              {/* Past Medical History */}
              <div>
                <p className="font-semibold">Past Medical History</p>
                <p className="text-sm text-gray-700">
                  {handover.background.previousMedicalConditions.length > 0
                    ? handover.background.previousMedicalConditions.join(', ')
                    : 'No significant history'}
                </p>
              </div>

              {/* Social Context */}
              <div>
                <p className="font-semibold">Social Context</p>
                <p className="text-sm text-gray-700">{handover.background.socialContext}</p>
              </div>

              {/* Parental Concerns */}
              <div>
                <p className="font-semibold">Parental Concerns</p>
                <p className="text-sm text-gray-700">{handover.background.parentalConcerns}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ASSESSMENT */}
        <TabsContent value="assessment">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Diagnosis */}
              <div className="rounded-lg bg-purple-50 p-4">
                <p className="font-semibold">Primary Diagnosis</p>
                <p className="text-sm text-gray-700">{handover.assessment.primaryDiagnosis}</p>
              </div>

              {/* Active Engines */}
              {handover.assessment.activeEngines.length > 0 && (
                <div>
                  <p className="font-semibold">Active Clinical Engines</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {handover.assessment.activeEngines.map((engine, idx) => (
                      <Badge key={idx} variant="outline">
                        {engine}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Vital Signs */}
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="font-semibold">Current Vital Signs</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">HR:</p>
                    <p className="font-medium">{handover.assessment.currentVitalSigns.hr} bpm</p>
                  </div>
                  <div>
                    <p className="text-gray-600">RR:</p>
                    <p className="font-medium">{handover.assessment.currentVitalSigns.rr}/min</p>
                  </div>
                  <div>
                    <p className="text-gray-600">BP:</p>
                    <p className="font-medium">{handover.assessment.currentVitalSigns.bp}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Temp:</p>
                    <p className="font-medium">{handover.assessment.currentVitalSigns.temp}°C</p>
                  </div>
                  <div>
                    <p className="text-gray-600">SpO2:</p>
                    <p className="font-medium">{handover.assessment.currentVitalSigns.spo2}%</p>
                  </div>
                  {handover.assessment.currentVitalSigns.glucose && (
                    <div>
                      <p className="text-gray-600">Glucose:</p>
                      <p className="font-medium">{handover.assessment.currentVitalSigns.glucose} mg/dL</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Critical Findings */}
              {handover.assessment.criticalFindings.length > 0 && (
                <div>
                  <p className="font-semibold text-red-600">Critical Findings</p>
                  <div className="mt-2 space-y-2">
                    {handover.assessment.criticalFindings.map((finding, idx) => (
                      <div key={idx} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`font-semibold ${SEVERITY_COLORS[finding.severity]}`}>
                              [{finding.severity.toUpperCase()}] {finding.finding}
                            </p>
                            <p className="mt-1 text-gray-700">Action: {finding.actionTaken}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response to Intervention */}
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold">Response to Intervention</p>
                  <p className="text-sm text-gray-700 capitalize">{handover.assessment.responseToIntervention}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECOMMENDATION */}
        <TabsContent value="recommendation">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Immediate Actions */}
              <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
                <p className="font-semibold text-red-900">Immediate Actions Required</p>
                <ul className="mt-2 space-y-1">
                  {handover.recommendation.immediateActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 rounded-full bg-red-600" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Continuing Management */}
              <div>
                <p className="font-semibold">Continuing Management</p>
                <ul className="mt-2 space-y-1">
                  {handover.recommendation.continuingManagement.map((mgmt, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                      <span>{mgmt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Monitoring */}
              <div>
                <p className="font-semibold">Monitoring Parameters</p>
                <ul className="mt-2 space-y-1">
                  {handover.recommendation.monitoringParameters.map((param, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 rounded-full bg-green-600" />
                      <span>{param}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Escalation Criteria */}
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="font-semibold text-yellow-900">Escalation Criteria</p>
                <ul className="mt-2 space-y-1">
                  {handover.recommendation.escalationCriteria.map((criteria, idx) => (
                    <li key={idx} className="text-sm text-yellow-900">
                      • {criteria}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Transport & Staffing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-600">TRANSPORT</p>
                  <p className="mt-1 text-sm">{handover.recommendation.transportRequirements}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-600">STAFFING</p>
                  <p className="mt-1 text-sm">{handover.recommendation.staffingRequirements}</p>
                </div>
              </div>

              {/* Equipment */}
              <div>
                <p className="font-semibold">Equipment Required</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {handover.recommendation.equipmentNeeded.map((equipment, idx) => (
                    <Badge key={idx} variant="secondary">
                      {equipment}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Time to Stability */}
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="font-semibold text-blue-900">Estimated Time to Stability</p>
                <p className="mt-1 text-sm text-blue-800">{handover.recommendation.estimatedTimeToStability}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Handover</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('text')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('email')}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Email Handover
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
