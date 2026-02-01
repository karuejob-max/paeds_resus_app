/**
 * Referral Initiation Component
 * 
 * Allows providers to initiate referral at any point when they feel stuck.
 * Generates structured handover summary for receiving facility.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Copy, FileText, CheckCircle, AlertTriangle, Clock, User, Activity } from 'lucide-react';

interface PatientData {
  age?: { value: number; unit: string };
  weightKg?: number;
  chiefComplaint?: string;
  vitalSigns?: {
    hr?: number;
    rr?: number;
    spo2?: number;
    bp?: string;
    temp?: number;
    gcs?: number;
  };
  interventions?: string[];
  currentStatus?: string;
}

interface Props {
  patientData: PatientData;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergent';
  onReferralSent?: () => void;
  onCancel: () => void;
}

const REFERRAL_CENTERS = [
  { name: 'Regional PICU', phone: '+254 XXX XXX XXX', level: 'Level 3' },
  { name: 'National Children\'s Hospital', phone: '+254 XXX XXX XXX', level: 'Level 4' },
  { name: 'Nearest District Hospital', phone: 'Contact local directory', level: 'Level 2' },
];

export function ReferralInitiation({ patientData, reason, urgency, onReferralSent, onCancel }: Props) {
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);

  const generateSBARSummary = () => {
    const age = patientData.age 
      ? `${patientData.age.value} ${patientData.age.unit}` 
      : 'Unknown';
    
    const vitals = patientData.vitalSigns;
    const vitalsStr = vitals 
      ? `HR: ${vitals.hr || '-'}, RR: ${vitals.rr || '-'}, SpO2: ${vitals.spo2 || '-'}%, BP: ${vitals.bp || '-'}, Temp: ${vitals.temp || '-'}°C, GCS: ${vitals.gcs || '-'}`
      : 'Not recorded';

    const interventions = patientData.interventions?.length 
      ? patientData.interventions.join(', ')
      : 'None yet';

    return `
=== PEDIATRIC EMERGENCY REFERRAL ===
Time: ${new Date().toLocaleString()}
Urgency: ${urgency.toUpperCase()}

[S] SITUATION
- ${patientData.age?.value || 'Unknown age'} ${patientData.age?.unit || ''} child
- Weight: ${patientData.weightKg || 'Unknown'} kg
- Chief Complaint: ${patientData.chiefComplaint || 'Not specified'}
- Reason for Referral: ${reason}

[B] BACKGROUND
- Current Status: ${patientData.currentStatus || 'Unstable'}
- Relevant History: ${additionalNotes || 'None provided'}

[A] ASSESSMENT
- Vital Signs: ${vitalsStr}
- Clinical Impression: ${reason}

[R] RECOMMENDATION
- Interventions Given: ${interventions}
- Requesting: ${urgency === 'emergent' ? 'IMMEDIATE PICU/HDU bed' : urgency === 'urgent' ? 'Urgent specialist review' : 'Specialist consultation'}
- Transport: ${urgency === 'emergent' ? 'Ambulance with medical escort' : 'Standard ambulance'}

=== END REFERRAL ===
    `.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateSBARSummary());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Urgency Banner */}
      <Card className={`border-2 ${
        urgency === 'emergent' ? 'border-red-500 bg-red-500/5' :
        urgency === 'urgent' ? 'border-orange-500 bg-orange-500/5' :
        'border-blue-500 bg-blue-500/5'
      }`}>
        <CardHeader className={
          urgency === 'emergent' ? 'bg-red-500/10' :
          urgency === 'urgent' ? 'bg-orange-500/10' :
          'bg-blue-500/10'
        }>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Initiate Referral
            </div>
            <Badge variant={urgency === 'emergent' ? 'destructive' : urgency === 'urgent' ? 'secondary' : 'outline'}>
              {urgency.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Reason */}
          <div className="p-3 border rounded bg-muted/50">
            <div className="text-sm text-muted-foreground">Reason for Referral:</div>
            <div className="font-semibold">{reason}</div>
          </div>

          {/* Patient Summary */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 border rounded">
              <User className="h-4 w-4 inline mr-1" />
              Age: {patientData.age ? `${patientData.age.value} ${patientData.age.unit}` : 'Unknown'}
            </div>
            <div className="p-2 border rounded">
              <Activity className="h-4 w-4 inline mr-1" />
              Weight: {patientData.weightKg || 'Unknown'} kg
            </div>
          </div>

          {/* Vital Signs */}
          {patientData.vitalSigns && (
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">Current Vital Signs:</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>HR: {patientData.vitalSigns.hr || '-'}</div>
                <div>RR: {patientData.vitalSigns.rr || '-'}</div>
                <div>SpO2: {patientData.vitalSigns.spo2 || '-'}%</div>
                <div>BP: {patientData.vitalSigns.bp || '-'}</div>
                <div>Temp: {patientData.vitalSigns.temp || '-'}°C</div>
                <div>GCS: {patientData.vitalSigns.gcs || '-'}</div>
              </div>
            </div>
          )}

          {/* Interventions Given */}
          {patientData.interventions && patientData.interventions.length > 0 && (
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">Interventions Given:</div>
              <div className="flex flex-wrap gap-1">
                {patientData.interventions.map((intervention, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {intervention}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="text-sm font-medium">Additional Notes:</label>
            <Textarea
              placeholder="Add any relevant history, allergies, or concerns..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Referral Centers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Receiving Facility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {REFERRAL_CENTERS.map((center) => (
            <Button
              key={center.name}
              variant={selectedCenter === center.name ? 'default' : 'outline'}
              className="w-full justify-between h-auto py-3"
              onClick={() => setSelectedCenter(center.name)}
            >
              <div className="text-left">
                <div className="font-medium">{center.name}</div>
                <div className="text-xs opacity-80">{center.phone}</div>
              </div>
              <Badge variant="outline">{center.level}</Badge>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* SBAR Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              SBAR Handover Summary
            </div>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">
            {generateSBARSummary()}
          </pre>
        </CardContent>
      </Card>

      {/* Pre-Transport Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Pre-Transport Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            'Airway secured / patent',
            'IV/IO access confirmed working',
            'Medications prepared for transport',
            'Monitoring equipment ready',
            'Documentation complete',
            'Family informed',
            'Receiving facility notified and accepting',
          ].map((item, i) => (
            <label key={i} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer">
              <input type="checkbox" className="h-4 w-4" />
              <span className="text-sm">{item}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel Referral
        </Button>
        <Button 
          className={urgency === 'emergent' ? 'bg-red-600 hover:bg-red-700' : ''}
          onClick={onReferralSent}
          disabled={!selectedCenter}
        >
          <Phone className="h-4 w-4 mr-2" />
          Call {selectedCenter || 'Facility'}
        </Button>
      </div>

      {/* Emergency Numbers */}
      {urgency === 'emergent' && (
        <Card className="border-red-500 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">EMERGENT - Call immediately</span>
            </div>
            <p className="text-sm">
              If no response from referral center, contact:
            </p>
            <ul className="list-disc list-inside text-sm mt-2">
              <li>Emergency Medical Services: 999 / 112</li>
              <li>Hospital switchboard for urgent transfer</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ReferralInitiation;
