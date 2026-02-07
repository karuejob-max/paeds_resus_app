/**
 * Universal Trauma Protocol
 * 
 * ATLS-based systematic approach adapted for ALL patient types:
 * - Pediatric (child hit by car, falls, burns)
 * - Adult (boda boda crashes, workplace injuries)
 * - Maternal (pregnant woman in MVA, domestic violence)
 * - Neonatal (birth trauma, falls)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  X, 
  AlertTriangle, 
  Zap,
  Baby,
  Activity,
  Heart,
  Droplets,
  Brain,
  Eye,
  Shield
} from 'lucide-react';

interface Props {
  patientAge: number;
  patientWeight: number;
  onClose: () => void;
}

type TraumaPhase = 
  | 'patient_info'
  | 'mechanism'
  | 'primary_survey_airway'
  | 'primary_survey_breathing'
  | 'primary_survey_circulation'
  | 'primary_survey_disability'
  | 'primary_survey_exposure'
  | 'secondary_survey'
  | 'complete';

interface TraumaData {
  patientType: 'pediatric' | 'adult' | 'maternal' | 'neonatal';
  gestationalAge?: number;
  mechanismType: string;
  mechanismDetails: string;
  timeOfInjury: string;
  airway: {
    status: 'patent' | 'threatened' | 'obstructed';
    cSpineProtection: boolean;
    interventions: string[];
  };
  breathing: {
    rate: number;
    spO2: number;
    chestInjuries: string[];
  };
  circulation: {
    heartRate: number;
    bloodPressure: { systolic: number; diastolic: number };
    capRefill: number;
    activeHemorrhage: boolean;
    hemorrhageSite: string[];
    ivAccess: string[];
    fluidGiven: number;
  };
  disability: {
    gcs: { eye: number; verbal: number; motor: number };
    avpu: 'alert' | 'voice' | 'pain' | 'unresponsive';
    pupils: {
      left: { size: number; reactive: boolean };
      right: { size: number; reactive: boolean };
    };
    lateralizingSigns: boolean;
  };
  exposure: {
    temperature: number;
    injuries: string[];
    burns: {
      present: boolean;
      tbsa?: number;
      depth?: string;
    };
  };
  secondarySurvey: {
    head: string[];
    neck: string[];
    chest: string[];
    abdomen: string[];
    pelvis: string[];
    extremities: string[];
    back: string[];
  };
}

export default function TraumaProtocol({ patientAge, patientWeight, onClose }: Props) {
  const [phase, setPhase] = useState<TraumaPhase>('patient_info');
  const [data, setData] = useState<TraumaData>({
    patientType: patientAge < 1/12 ? 'neonatal' : patientAge < 18 ? 'pediatric' : 'adult',
    mechanismType: '',
    mechanismDetails: '',
    timeOfInjury: '',
    airway: {
      status: 'patent',
      cSpineProtection: false,
      interventions: [],
    },
    breathing: {
      rate: 0,
      spO2: 100,
      chestInjuries: [],
    },
    circulation: {
      heartRate: 0,
      bloodPressure: { systolic: 0, diastolic: 0 },
      capRefill: 2,
      activeHemorrhage: false,
      hemorrhageSite: [],
      ivAccess: [],
      fluidGiven: 0,
    },
    disability: {
      gcs: { eye: 4, verbal: 5, motor: 6 },
      avpu: 'alert',
      pupils: {
        left: { size: 3, reactive: true },
        right: { size: 3, reactive: true },
      },
      lateralizingSigns: false,
    },
    exposure: {
      temperature: 37,
      injuries: [],
      burns: {
        present: false,
      },
    },
    secondarySurvey: {
      head: [],
      neck: [],
      chest: [],
      abdomen: [],
      pelvis: [],
      extremities: [],
      back: [],
    },
  });

  const renderPatientInfo = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-amber-400">
        <AlertTriangle className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Patient Information</h2>
      </div>

      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Patient Type</Label>
            <RadioGroup
              value={data.patientType}
              onValueChange={(value) => setData({ ...data, patientType: value as any })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neonatal" id="neonatal" />
                <Label htmlFor="neonatal">Neonatal (&lt;1 month)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pediatric" id="pediatric" />
                <Label htmlFor="pediatric">Pediatric (1 month - 18 years)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="adult" id="adult" />
                <Label htmlFor="adult">Adult (&gt;18 years)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="maternal" id="maternal" />
                <Label htmlFor="maternal">Maternal (Pregnant/Postpartum)</Label>
              </div>
            </RadioGroup>
          </div>

          {data.patientType === 'maternal' && (
            <div>
              <Label>Gestational Age (weeks)</Label>
              <Input
                type="number"
                value={data.gestationalAge || ''}
                onChange={(e) => setData({ ...data, gestationalAge: parseInt(e.target.value) })}
                placeholder="e.g., 32"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Age: {patientAge} years</Label>
            </div>
            <div>
              <Label>Weight: {patientWeight} kg</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => setPhase('mechanism')}
        className="w-full bg-amber-600 hover:bg-amber-700"
      >
        Continue to Mechanism of Injury
      </Button>
    </div>
  );

  const renderMechanism = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-amber-400">
        <Zap className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Mechanism of Injury</h2>
      </div>

      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Mechanism Type</Label>
            <RadioGroup
              value={data.mechanismType}
              onValueChange={(value) => setData({ ...data, mechanismType: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mva" id="mva" />
                <Label htmlFor="mva">Motor Vehicle Accident (MVA)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="motorcycle" id="motorcycle" />
                <Label htmlFor="motorcycle">Motorcycle/Boda Boda Crash</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fall" id="fall" />
                <Label htmlFor="fall">Fall</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="assault" id="assault" />
                <Label htmlFor="assault">Assault/Violence</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="burn" id="burn" />
                <Label htmlFor="burn">Burn</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="penetrating" id="penetrating" />
                <Label htmlFor="penetrating">Penetrating Trauma (stab/gunshot)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Mechanism Details</Label>
            <Textarea
              value={data.mechanismDetails}
              onChange={(e) => setData({ ...data, mechanismDetails: e.target.value })}
              placeholder="Describe the injury mechanism (speed, height, protective equipment, etc.)"
              rows={3}
            />
          </div>

          <div>
            <Label>Time of Injury</Label>
            <Input
              type="text"
              value={data.timeOfInjury}
              onChange={(e) => setData({ ...data, timeOfInjury: e.target.value })}
              placeholder="e.g., 30 minutes ago, 2 hours ago"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={() => setPhase('patient_info')}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={() => setPhase('primary_survey_airway')}
          className="flex-1 bg-red-600 hover:bg-red-700"
          disabled={!data.mechanismType}
        >
          Start Primary Survey (ABCDE)
        </Button>
      </div>
    </div>
  );

  const renderAirway = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-red-400">
        <Activity className="h-6 w-6" />
        <h2 className="text-2xl font-bold">A - Airway + C-Spine Protection</h2>
      </div>

      <Card className="bg-red-950 border-red-800">
        <CardHeader>
          <CardTitle className="text-red-300">⚠️ Assume C-spine injury until cleared</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cspine"
              checked={data.airway.cSpineProtection}
              onCheckedChange={(checked) =>
                setData({
                  ...data,
                  airway: { ...data.airway, cSpineProtection: checked as boolean },
                })
              }
            />
            <Label htmlFor="cspine" className="text-white">
              C-spine immobilization applied (collar + blocks/manual stabilization)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Airway Status</Label>
            <RadioGroup
              value={data.airway.status}
              onValueChange={(value) =>
                setData({ ...data, airway: { ...data.airway, status: value as any } })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="patent" id="patent" />
                <Label htmlFor="patent">Patent (talking, crying, clear sounds)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="threatened" id="threatened" />
                <Label htmlFor="threatened">Threatened (stridor, hoarseness, facial burns, expanding hematoma)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="obstructed" id="obstructed" />
                <Label htmlFor="obstructed">Obstructed (unable to speak, no air movement)</Label>
              </div>
            </RadioGroup>
          </div>

          {(data.airway.status === 'threatened' || data.airway.status === 'obstructed') && (
            <Card className="bg-red-950 border-red-800">
              <CardHeader>
                <CardTitle className="text-red-300">Immediate Airway Interventions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {['Jaw thrust (NOT head tilt)', 'Suction blood/secretions', 'Oropharyngeal airway', 'Nasopharyngeal airway', 'Bag-valve-mask ventilation', 'Supraglottic airway (i-gel/LMA)', 'Endotracheal intubation (with C-spine stabilization)', 'Surgical airway (cricothyroidotomy)'].map((intervention) => (
                  <div key={intervention} className="flex items-center space-x-2">
                    <Checkbox
                      id={intervention}
                      checked={data.airway.interventions.includes(intervention)}
                      onCheckedChange={(checked) => {
                        const newInterventions = checked
                          ? [...data.airway.interventions, intervention]
                          : data.airway.interventions.filter((i) => i !== intervention);
                        setData({
                          ...data,
                          airway: { ...data.airway, interventions: newInterventions },
                        });
                      }}
                    />
                    <Label htmlFor={intervention} className="text-white">
                      {intervention}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={() => setPhase('mechanism')}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={() => setPhase('primary_survey_breathing')}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          disabled={!data.airway.cSpineProtection}
        >
          Continue to Breathing
        </Button>
      </div>
    </div>
  );

  const getVitalRanges = () => {
    if (patientAge < 1) {
      return { hr: [100, 160], rr: [30, 60], sbp: [60, 90] };
    } else if (patientAge < 3) {
      return { hr: [90, 150], rr: [24, 40], sbp: [80, 100] };
    } else if (patientAge < 6) {
      return { hr: [80, 140], rr: [22, 34], sbp: [85, 105] };
    } else if (patientAge < 12) {
      return { hr: [70, 120], rr: [18, 30], sbp: [90, 110] };
    } else {
      return { hr: [60, 100], rr: [12, 20], sbp: [100, 120] };
    }
  };

  const vitalRanges = getVitalRanges();

  const renderBreathing = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-blue-400">
        <Activity className="h-6 w-6" />
        <h2 className="text-2xl font-bold">B - Breathing</h2>
      </div>

      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Respiratory Rate (breaths/min)</Label>
              <Input
                type="number"
                value={data.breathing.rate || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    breathing: { ...data.breathing, rate: parseInt(e.target.value) },
                  })
                }
              />
              <p className="text-sm text-gray-400 mt-1">
                Normal: {vitalRanges.rr[0]}-{vitalRanges.rr[1]}
              </p>
            </div>

            <div>
              <Label>SpO2 (%)</Label>
              <Input
                type="number"
                value={data.breathing.spO2 || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    breathing: { ...data.breathing, spO2: parseInt(e.target.value) },
                  })
                }
              />
              <p className="text-sm text-gray-400 mt-1">Target: &gt;94%</p>
            </div>
          </div>

          <div>
            <Label>Chest Injuries (check all that apply)</Label>
            <div className="space-y-2 mt-2">
              {[
                'Tension pneumothorax (tracheal deviation, absent breath sounds, hypotension)',
                'Open pneumothorax (sucking chest wound)',
                'Massive hemothorax (absent breath sounds, dull percussion)',
                'Flail chest (paradoxical movement)',
                'Rib fractures',
                'Subcutaneous emphysema',
                'None observed',
              ].map((injury) => (
                <div key={injury} className="flex items-center space-x-2">
                  <Checkbox
                    id={injury}
                    checked={data.breathing.chestInjuries.includes(injury)}
                    onCheckedChange={(checked) => {
                      const newInjuries = checked
                        ? [...data.breathing.chestInjuries, injury]
                        : data.breathing.chestInjuries.filter((i) => i !== injury);
                      setData({
                        ...data,
                        breathing: { ...data.breathing, chestInjuries: newInjuries },
                      });
                    }}
                  />
                  <Label htmlFor={injury}>{injury}</Label>
                </div>
              ))}
            </div>
          </div>

          {data.breathing.chestInjuries.some((i) => i.includes('Tension') || i.includes('Open') || i.includes('hemothorax')) && (
            <Card className="bg-red-950 border-red-800">
              <CardHeader>
                <CardTitle className="text-red-300">⚠️ Life-Threatening Chest Injury</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-white">Immediate interventions required:</p>
                <ul className="list-disc list-inside text-white space-y-1">
                  {data.breathing.chestInjuries.includes('Tension pneumothorax (tracheal deviation, absent breath sounds, hypotension)') && (
                    <li>Needle decompression (2nd intercostal space, midclavicular line) → Chest tube</li>
                  )}
                  {data.breathing.chestInjuries.includes('Open pneumothorax (sucking chest wound)') && (
                    <li>Three-sided occlusive dressing → Chest tube</li>
                  )}
                  {data.breathing.chestInjuries.includes('Massive hemothorax (absent breath sounds, dull percussion)') && (
                    <li>Large-bore chest tube + fluid resuscitation + blood products</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={() => setPhase('primary_survey_airway')}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={() => setPhase('primary_survey_circulation')}
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          Continue to Circulation
        </Button>
      </div>
    </div>
  );

  const isPregnant = data.patientType === 'maternal';

  const renderCirculation = () => {
    const estimatedBloodVolume = patientWeight * 70;
    const bolus20ml = Math.round(patientWeight * 20);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-red-400">
          <Heart className="h-6 w-6" />
          <h2 className="text-2xl font-bold">C - Circulation</h2>
        </div>

        {isPregnant && data.gestationalAge && data.gestationalAge > 20 && (
          <Card className="bg-purple-950 border-purple-800">
            <CardHeader>
              <CardTitle className="text-purple-300 flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Pregnancy-Specific: Left Lateral Tilt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white">
                Position patient 15-30° left lateral tilt to relieve aortocaval compression.
                If on backboard, tilt entire board or place wedge under right hip.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Heart Rate (bpm)</Label>
                <Input
                  type="number"
                  value={data.circulation.heartRate || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      circulation: { ...data.circulation, heartRate: parseInt(e.target.value) },
                    })
                  }
                />
                <p className="text-sm text-gray-400 mt-1">
                  Normal: {vitalRanges.hr[0]}-{vitalRanges.hr[1]}
                </p>
              </div>

              <div>
                <Label>Capillary Refill (seconds)</Label>
                <Input
                  type="number"
                  value={data.circulation.capRefill || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      circulation: { ...data.circulation, capRefill: parseInt(e.target.value) },
                    })
                  }
                />
                <p className="text-sm text-gray-400 mt-1">Normal: &lt;2 seconds</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Systolic BP (mmHg)</Label>
                <Input
                  type="number"
                  value={data.circulation.bloodPressure.systolic || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      circulation: {
                        ...data.circulation,
                        bloodPressure: {
                          ...data.circulation.bloodPressure,
                          systolic: parseInt(e.target.value),
                        },
                      },
                    })
                  }
                />
                <p className="text-sm text-gray-400 mt-1">
                  Normal: &gt;{vitalRanges.sbp[0]}
                </p>
              </div>

              <div>
                <Label>Diastolic BP (mmHg)</Label>
                <Input
                  type="number"
                  value={data.circulation.bloodPressure.diastolic || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      circulation: {
                        ...data.circulation,
                        bloodPressure: {
                          ...data.circulation.bloodPressure,
                          diastolic: parseInt(e.target.value),
                        },
                      },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Active Hemorrhage?
              </Label>
              <RadioGroup
                value={data.circulation.activeHemorrhage ? 'yes' : 'no'}
                onValueChange={(value) =>
                  setData({
                    ...data,
                    circulation: { ...data.circulation, activeHemorrhage: value === 'yes' },
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no-hemorrhage" />
                  <Label htmlFor="no-hemorrhage">No visible hemorrhage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes-hemorrhage" />
                  <Label htmlFor="yes-hemorrhage">Active hemorrhage present</Label>
                </div>
              </RadioGroup>
            </div>

            {data.circulation.activeHemorrhage && (
              <>
                <div>
                  <Label>Hemorrhage Sites</Label>
                  <div className="space-y-2 mt-2">
                    {['Scalp', 'Face', 'Chest', 'Abdomen', 'Pelvis', 'Extremity', 'External (visible)', 'Internal (suspected)'].map((site) => (
                      <div key={site} className="flex items-center space-x-2">
                        <Checkbox
                          id={site}
                          checked={data.circulation.hemorrhageSite.includes(site)}
                          onCheckedChange={(checked) => {
                            const newSites = checked
                              ? [...data.circulation.hemorrhageSite, site]
                              : data.circulation.hemorrhageSite.filter((s) => s !== site);
                            setData({
                              ...data,
                              circulation: { ...data.circulation, hemorrhageSite: newSites },
                            });
                          }}
                        />
                        <Label htmlFor={site}>{site}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Card className="bg-red-950 border-red-800">
                  <CardHeader>
                    <CardTitle className="text-red-300">Hemorrhage Control</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-white font-semibold">Priority: STOP THE BLEEDING</p>
                    <ul className="list-disc list-inside text-white space-y-1">
                      <li>Direct pressure (5-10 minutes)</li>
                      <li>Tourniquet for extremity hemorrhage (if direct pressure fails)</li>
                      <li>Pelvic binder for unstable pelvis</li>
                      <li>Consider tranexamic acid (TXA) within 3 hours: {Math.round(patientWeight * 15)}mg loading dose</li>
                      <li>Activate massive transfusion protocol if available</li>
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}

            <div>
              <Label>IV Access Established</Label>
              <div className="space-y-2 mt-2">
                {['2 large-bore peripheral IVs', 'Intraosseous (IO)', 'Central line', 'None yet'].map((access) => (
                  <div key={access} className="flex items-center space-x-2">
                    <Checkbox
                      id={access}
                      checked={data.circulation.ivAccess.includes(access)}
                      onCheckedChange={(checked) => {
                        const newAccess = checked
                          ? [...data.circulation.ivAccess, access]
                          : data.circulation.ivAccess.filter((a) => a !== access);
                        setData({
                          ...data,
                          circulation: { ...data.circulation, ivAccess: newAccess },
                        });
                      }}
                    />
                    <Label htmlFor={access}>{access}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Fluid Resuscitation (mL given so far)</Label>
              <Input
                type="number"
                value={data.circulation.fluidGiven || ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    circulation: { ...data.circulation, fluidGiven: parseInt(e.target.value) },
                  })
                }
              />
              <p className="text-sm text-gray-400 mt-1">
                Bolus: {bolus20ml}mL (20mL/kg) | Estimated blood volume: {estimatedBloodVolume}mL
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={() => setPhase('primary_survey_breathing')}
            variant="outline"
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={() => setPhase('primary_survey_disability')}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            Continue to Disability
          </Button>
        </div>
      </div>
    );
  };

  const gcsTotal = data.disability.gcs.eye + data.disability.gcs.verbal + data.disability.gcs.motor;

  const renderDisability = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-purple-400">
        <Brain className="h-6 w-6" />
        <h2 className="text-2xl font-bold">D - Disability (Neurological Status)</h2>
      </div>

      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>AVPU Score</Label>
            <RadioGroup
              value={data.disability.avpu}
              onValueChange={(value) =>
                setData({ ...data, disability: { ...data.disability, avpu: value as any } })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alert" id="alert" />
                <Label htmlFor="alert">Alert (awake, oriented)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="voice" id="voice" />
                <Label htmlFor="voice">Responds to Voice</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pain" id="pain" />
                <Label htmlFor="pain">Responds to Pain only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unresponsive" id="unresponsive" />
                <Label htmlFor="unresponsive">Unresponsive</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Glasgow Coma Scale (GCS)</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label className="text-sm">Eye (1-4)</Label>
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={data.disability.gcs.eye}
                  onChange={(e) =>
                    setData({
                      ...data,
                      disability: {
                        ...data.disability,
                        gcs: { ...data.disability.gcs, eye: parseInt(e.target.value) },
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Verbal (1-5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={data.disability.gcs.verbal}
                  onChange={(e) =>
                    setData({
                      ...data,
                      disability: {
                        ...data.disability,
                        gcs: { ...data.disability.gcs, verbal: parseInt(e.target.value) },
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Motor (1-6)</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={data.disability.gcs.motor}
                  onChange={(e) =>
                    setData({
                      ...data,
                      disability: {
                        ...data.disability,
                        gcs: { ...data.disability.gcs, motor: parseInt(e.target.value) },
                      },
                    })
                  }
                />
              </div>
            </div>
            <p className="text-lg font-semibold mt-2">
              Total GCS: {gcsTotal}/15
              {gcsTotal <= 8 && <span className="text-red-400 ml-2">⚠️ Severe head injury - Intubate!</span>}
            </p>
          </div>

          <div>
            <Label>Pupils</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-sm">Left Pupil Size (mm)</Label>
                <Input
                  type="number"
                  value={data.disability.pupils.left.size}
                  onChange={(e) =>
                    setData({
                      ...data,
                      disability: {
                        ...data.disability,
                        pupils: {
                          ...data.disability.pupils,
                          left: { ...data.disability.pupils.left, size: parseInt(e.target.value) },
                        },
                      },
                    })
                  }
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="left-reactive"
                    checked={data.disability.pupils.left.reactive}
                    onCheckedChange={(checked) =>
                      setData({
                        ...data,
                        disability: {
                          ...data.disability,
                          pupils: {
                            ...data.disability.pupils,
                            left: { ...data.disability.pupils.left, reactive: checked as boolean },
                          },
                        },
                      })
                    }
                  />
                  <Label htmlFor="left-reactive" className="text-sm">
                    Reactive to light
                  </Label>
                </div>
              </div>

              <div>
                <Label className="text-sm">Right Pupil Size (mm)</Label>
                <Input
                  type="number"
                  value={data.disability.pupils.right.size}
                  onChange={(e) =>
                    setData({
                      ...data,
                      disability: {
                        ...data.disability,
                        pupils: {
                          ...data.disability.pupils,
                          right: { ...data.disability.pupils.right, size: parseInt(e.target.value) },
                        },
                      },
                    })
                  }
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="right-reactive"
                    checked={data.disability.pupils.right.reactive}
                    onCheckedChange={(checked) =>
                      setData({
                        ...data,
                        disability: {
                          ...data.disability,
                          pupils: {
                            ...data.disability.pupils,
                            right: { ...data.disability.pupils.right, reactive: checked as boolean },
                          },
                        },
                      })
                    }
                  />
                  <Label htmlFor="right-reactive" className="text-sm">
                    Reactive to light
                  </Label>
                </div>
              </div>
            </div>

            {(Math.abs(data.disability.pupils.left.size - data.disability.pupils.right.size) > 1 ||
              data.disability.pupils.left.reactive !== data.disability.pupils.right.reactive) && (
              <Card className="bg-red-950 border-red-800 mt-2">
                <CardContent className="p-4">
                  <p className="text-red-300 font-semibold">⚠️ Unequal/Non-reactive pupils → Increased ICP or brain herniation</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="lateralizing"
              checked={data.disability.lateralizingSigns}
              onCheckedChange={(checked) =>
                setData({ ...data, disability: { ...data.disability, lateralizingSigns: checked as boolean } })
              }
            />
            <Label htmlFor="lateralizing">
              Lateralizing signs present (weakness, asymmetry)
            </Label>
          </div>

          {(gcsTotal <= 8 || !data.disability.pupils.left.reactive || !data.disability.pupils.right.reactive) && (
            <Card className="bg-red-950 border-red-800">
              <CardHeader>
                <CardTitle className="text-red-300">Severe Head Injury Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="list-disc list-inside text-white space-y-1">
                  <li>Intubate for airway protection (GCS ≤8)</li>
                  <li>Maintain SpO2 &gt;94%, avoid hypoxia</li>
                  <li>Maintain SBP &gt;{vitalRanges.sbp[0]} mmHg, avoid hypotension</li>
                  <li>Elevate head of bed 30° (if spine cleared)</li>
                  <li>Avoid hyperventilation unless signs of herniation</li>
                  <li>Consider mannitol or hypertonic saline for increased ICP</li>
                  <li>Urgent CT head + neurosurgery consult</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={() => setPhase('primary_survey_circulation')}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={() => setPhase('primary_survey_exposure')}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          Continue to Exposure
        </Button>
      </div>
    </div>
  );

  const renderExposure = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-orange-400">
        <Eye className="h-6 w-6" />
        <h2 className="text-2xl font-bold">E - Exposure & Environmental Control</h2>
      </div>

      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Temperature (°C)</Label>
            <Input
              type="number"
              step="0.1"
              value={data.exposure.temperature || ''}
              onChange={(e) =>
                setData({ ...data, exposure: { ...data.exposure, temperature: parseFloat(e.target.value) } })
              }
            />
            <p className="text-sm text-gray-400 mt-1">
              {data.exposure.temperature < 35 && '⚠️ Hypothermia - Rewarm actively'}
              {data.exposure.temperature >= 35 && data.exposure.temperature <= 37.5 && '✓ Normal'}
              {data.exposure.temperature > 37.5 && '⚠️ Fever/Hyperthermia'}
            </p>
          </div>

          <div>
            <Label>Burns Present?</Label>
            <RadioGroup
              value={data.exposure.burns.present ? 'yes' : 'no'}
              onValueChange={(value) =>
                setData({
                  ...data,
                  exposure: { ...data.exposure, burns: { ...data.exposure.burns, present: value === 'yes' } },
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no-burns" />
                <Label htmlFor="no-burns">No burns</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes-burns" />
                <Label htmlFor="yes-burns">Burns present</Label>
              </div>
            </RadioGroup>
          </div>

          {data.exposure.burns.present && (
            <>
              <div>
                <Label>Total Body Surface Area (TBSA) %</Label>
                <Input
                  type="number"
                  value={data.exposure.burns.tbsa || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      exposure: {
                        ...data.exposure,
                        burns: { ...data.exposure.burns, tbsa: parseInt(e.target.value) },
                      },
                    })
                  }
                />
                <p className="text-sm text-gray-400 mt-1">
                  Use Rule of 9s (adult) or Lund-Browder (pediatric)
                </p>
              </div>

              <div>
                <Label>Burn Depth</Label>
                <RadioGroup
                  value={data.exposure.burns.depth || ''}
                  onValueChange={(value) =>
                    setData({
                      ...data,
                      exposure: { ...data.exposure, burns: { ...data.exposure.burns, depth: value } },
                    })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="superficial" id="superficial" />
                    <Label htmlFor="superficial">Superficial (1st degree)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="partial" />
                    <Label htmlFor="partial">Partial thickness (2nd degree)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full">Full thickness (3rd degree)</Label>
                  </div>
                </RadioGroup>
              </div>

              {data.exposure.burns.tbsa && data.exposure.burns.tbsa > 10 && (
                <Card className="bg-orange-950 border-orange-800">
                  <CardHeader>
                    <CardTitle className="text-orange-300">Burn Fluid Resuscitation (Parkland Formula)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-white">
                      First 24 hours: {4 * patientWeight * (data.exposure.burns.tbsa || 0)}mL Ringer's Lactate
                    </p>
                    <p className="text-white">
                      Give half in first 8 hours: {2 * patientWeight * (data.exposure.burns.tbsa || 0)}mL
                    </p>
                    <p className="text-white">
                      Give remaining half over next 16 hours: {2 * patientWeight * (data.exposure.burns.tbsa || 0)}mL
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                      Titrate to urine output: {patientAge < 12 ? '1mL/kg/hr' : '0.5mL/kg/hr'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div>
            <Label>Visible Injuries (check all that apply)</Label>
            <div className="space-y-2 mt-2">
              {[
                'Lacerations',
                'Abrasions',
                'Contusions/Bruising',
                'Deformities',
                'Swelling',
                'Open fractures',
                'Penetrating wounds',
                'None visible',
              ].map((injury) => (
                <div key={injury} className="flex items-center space-x-2">
                  <Checkbox
                    id={injury}
                    checked={data.exposure.injuries.includes(injury)}
                    onCheckedChange={(checked) => {
                      const newInjuries = checked
                        ? [...data.exposure.injuries, injury]
                        : data.exposure.injuries.filter((i) => i !== injury);
                      setData({ ...data, exposure: { ...data.exposure, injuries: newInjuries } });
                    }}
                  />
                  <Label htmlFor={injury}>{injury}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-950 border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-300 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Prevent Hypothermia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-white space-y-1">
            <li>Remove wet clothing</li>
            <li>Cover with warm blankets</li>
            <li>Warm IV fluids if available</li>
            <li>Increase ambient temperature</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={() => setPhase('primary_survey_disability')}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={() => setPhase('secondary_survey')}
          className="flex-1 bg-cyan-600 hover:bg-cyan-700"
        >
          Continue to Secondary Survey
        </Button>
      </div>
    </div>
  );

  const renderSecondarySurvey = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-cyan-400">
        <Eye className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Secondary Survey (Head-to-Toe)</h2>
      </div>

      <Card className="bg-blue-950 border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-300">⚠️ Only After Primary Survey Complete</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white">
            Secondary survey is performed ONLY after all life-threatening injuries from the primary survey have been addressed.
            This is a systematic head-to-toe examination to identify all injuries.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6 space-y-6">
          <div>
            <Label className="text-lg font-semibold">Head</Label>
            <div className="space-y-2 mt-2">
              {['Scalp laceration', 'Skull deformity/fracture', 'Battle sign (mastoid ecchymosis)', 'Raccoon eyes (periorbital ecchymosis)', 'CSF leak (nose/ears)', 'Facial fractures', 'None'].map((finding) => (
                <div key={finding} className="flex items-center space-x-2">
                  <Checkbox
                    id={`head-${finding}`}
                    checked={data.secondarySurvey.head.includes(finding)}
                    onCheckedChange={(checked) => {
                      const newFindings = checked
                        ? [...data.secondarySurvey.head, finding]
                        : data.secondarySurvey.head.filter((f) => f !== finding);
                      setData({ ...data, secondarySurvey: { ...data.secondarySurvey, head: newFindings } });
                    }}
                  />
                  <Label htmlFor={`head-${finding}`}>{finding}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold">Neck</Label>
            <div className="space-y-2 mt-2">
              {['Midline tenderness', 'Step-off deformity', 'Subcutaneous emphysema', 'Tracheal deviation', 'JVD', 'Penetrating injury', 'None'].map((finding) => (
                <div key={finding} className="flex items-center space-x-2">
                  <Checkbox
                    id={`neck-${finding}`}
                    checked={data.secondarySurvey.neck.includes(finding)}
                    onCheckedChange={(checked) => {
                      const newFindings = checked
                        ? [...data.secondarySurvey.neck, finding]
                        : data.secondarySurvey.neck.filter((f) => f !== finding);
                      setData({ ...data, secondarySurvey: { ...data.secondarySurvey, neck: newFindings } });
                    }}
                  />
                  <Label htmlFor={`neck-${finding}`}>{finding}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold">Chest</Label>
            <div className="space-y-2 mt-2">
              {['Rib tenderness/crepitus', 'Sternal tenderness', 'Seatbelt sign', 'Penetrating wound', 'Asymmetric expansion', 'None'].map((finding) => (
                <div key={finding} className="flex items-center space-x-2">
                  <Checkbox
                    id={`chest-${finding}`}
                    checked={data.secondarySurvey.chest.includes(finding)}
                    onCheckedChange={(checked) => {
                      const newFindings = checked
                        ? [...data.secondarySurvey.chest, finding]
                        : data.secondarySurvey.chest.filter((f) => f !== finding);
                      setData({ ...data, secondarySurvey: { ...data.secondarySurvey, chest: newFindings } });
                    }}
                  />
                  <Label htmlFor={`chest-${finding}`}>{finding}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold">Abdomen</Label>
            <div className="space-y-2 mt-2">
              {['Tenderness', 'Distension', 'Guarding/rigidity', 'Seatbelt sign', 'Penetrating wound', 'Absent bowel sounds', 'None'].map((finding) => (
                <div key={finding} className="flex items-center space-x-2">
                  <Checkbox
                    id={`abdomen-${finding}`}
                    checked={data.secondarySurvey.abdomen.includes(finding)}
                    onCheckedChange={(checked) => {
                      const newFindings = checked
                        ? [...data.secondarySurvey.abdomen, finding]
                        : data.secondarySurvey.abdomen.filter((f) => f !== finding);
                      setData({ ...data, secondarySurvey: { ...data.secondarySurvey, abdomen: newFindings } });
                    }}
                  />
                  <Label htmlFor={`abdomen-${finding}`}>{finding}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold">Pelvis</Label>
            <div className="space-y-2 mt-2">
              {['Pelvic instability (compress/distract)', 'Tenderness', 'Blood at urethral meatus', 'Scrotal/perineal hematoma', 'None'].map((finding) => (
                <div key={finding} className="flex items-center space-x-2">
                  <Checkbox
                    id={`pelvis-${finding}`}
                    checked={data.secondarySurvey.pelvis.includes(finding)}
                    onCheckedChange={(checked) => {
                      const newFindings = checked
                        ? [...data.secondarySurvey.pelvis, finding]
                        : data.secondarySurvey.pelvis.filter((f) => f !== finding);
                      setData({ ...data, secondarySurvey: { ...data.secondarySurvey, pelvis: newFindings } });
                    }}
                  />
                  <Label htmlFor={`pelvis-${finding}`}>{finding}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold">Extremities</Label>
            <div className="space-y-2 mt-2">
              {['Deformity', 'Swelling', 'Tenderness', 'Open fracture', 'Neurovascular compromise', 'Compartment syndrome signs', 'None'].map((finding) => (
                <div key={finding} className="flex items-center space-x-2">
                  <Checkbox
                    id={`extremities-${finding}`}
                    checked={data.secondarySurvey.extremities.includes(finding)}
                    onCheckedChange={(checked) => {
                      const newFindings = checked
                        ? [...data.secondarySurvey.extremities, finding]
                        : data.secondarySurvey.extremities.filter((f) => f !== finding);
                      setData({ ...data, secondarySurvey: { ...data.secondarySurvey, extremities: newFindings } });
                    }}
                  />
                  <Label htmlFor={`extremities-${finding}`}>{finding}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-lg font-semibold">Back (Log Roll Required)</Label>
            <div className="space-y-2 mt-2">
              {['Spinal tenderness', 'Step-off deformity', 'Penetrating wound', 'Bruising', 'None'].map((finding) => (
                <div key={finding} className="flex items-center space-x-2">
                  <Checkbox
                    id={`back-${finding}`}
                    checked={data.secondarySurvey.back.includes(finding)}
                    onCheckedChange={(checked) => {
                      const newFindings = checked
                        ? [...data.secondarySurvey.back, finding]
                        : data.secondarySurvey.back.filter((f) => f !== finding);
                      setData({ ...data, secondarySurvey: { ...data.secondarySurvey, back: newFindings } });
                    }}
                  />
                  <Label htmlFor={`back-${finding}`}>{finding}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={() => setPhase('primary_survey_exposure')}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={() => setPhase('complete')}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Complete Assessment
        </Button>
      </div>
    </div>
  );

  const renderComplete = () => {
    const needsOR = data.circulation.activeHemorrhage || 
                    data.breathing.chestInjuries.some(i => i.includes('hemothorax')) ||
                    gcsTotal <= 8;
    
    const needsICU = gcsTotal <= 12 || 
                     data.circulation.bloodPressure.systolic < vitalRanges.sbp[0] ||
                     data.breathing.spO2 < 90;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-green-400">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Assessment Complete</h2>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Patient Type</p>
                <p className="text-lg font-semibold capitalize">{data.patientType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Mechanism</p>
                <p className="text-lg font-semibold">{data.mechanismType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">GCS</p>
                <p className="text-lg font-semibold">{gcsTotal}/15</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Hemodynamics</p>
                <p className="text-lg font-semibold">
                  HR {data.circulation.heartRate} | BP {data.circulation.bloodPressure.systolic}/{data.circulation.bloodPressure.diastolic}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Special Considerations Based on Patient Type */}
        {isPregnant && data.gestationalAge && data.gestationalAge > 20 && (
          <Card className="bg-purple-950 border-purple-800">
            <CardHeader>
              <CardTitle className="text-purple-300 flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Maternal Trauma Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside text-white space-y-1">
                <li>Maintain left lateral tilt throughout (already applied)</li>
                <li>Fetal assessment: Check fetal heart rate if available</li>
                <li>Consider placental abruption if abdominal trauma</li>
                <li>Rh status: Give RhoGAM if Rh-negative and trauma</li>
                <li>
                  <strong className="text-red-300">Perimortem C-Section Criteria:</strong> If maternal cardiac arrest
                  and gestational age ≥24 weeks, prepare for emergency C-section within 4 minutes of arrest if ROSC
                  not achieved
                </li>
              </ul>
            </CardContent>
          </Card>
        )}

        {patientAge < 18 && (
          <Card className="bg-blue-950 border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Pediatric Trauma Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside text-white space-y-1">
                <li>
                  <strong>Growth plate injuries:</strong> Suspect Salter-Harris fractures at physeal plates - requires
                  orthopedic consultation
                </li>
                <li>
                  <strong>Non-Accidental Trauma (NAT) screening:</strong> Consider if:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Injury inconsistent with developmental stage or history</li>
                    <li>Multiple injuries at different stages of healing</li>
                    <li>Bruising in non-ambulatory infant</li>
                    <li>Retinal hemorrhages (shaken baby syndrome)</li>
                    <li>Delay in seeking care</li>
                    <li>Changing or inconsistent history</li>
                  </ul>
                </li>
                <li>Document all injuries with photos and detailed descriptions</li>
                <li>Mandatory reporting if NAT suspected</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {data.exposure.burns.present && data.exposure.burns.tbsa && data.exposure.burns.tbsa > 10 && (
          <Card className="bg-orange-950 border-orange-800">
            <CardHeader>
              <CardTitle className="text-orange-300">Enhanced Burn Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside text-white space-y-1">
                <li>
                  <strong>Airway:</strong> High risk of inhalation injury if facial burns, singed nasal hairs, soot in
                  mouth/nose. Consider early intubation before edema develops.
                </li>
                <li>
                  <strong>Circumferential burns:</strong> Check for compartment syndrome in extremities or chest wall
                  restriction. May need escharotomy.
                </li>
                <li>
                  <strong>Burn center transfer criteria:</strong> TBSA &gt;10% (pediatric) or &gt;20% (adult), full
                  thickness burns, burns to face/hands/feet/genitalia/perineum/major joints, electrical/chemical burns,
                  inhalation injury
                </li>
                <li>
                  <strong>Pain management:</strong> IV opioids (morphine 0.1mg/kg or fentanyl 1-2mcg/kg) - avoid IM
                  injections
                </li>
                <li>
                  <strong>Wound care:</strong> Cover with clean dry sheet, avoid ice (causes vasoconstriction and
                  hypothermia)
                </li>
              </ul>
            </CardContent>
          </Card>
        )}


        <Card className={needsOR ? 'bg-red-950 border-red-800' : 'bg-gray-900 border-gray-700'}>
          <CardHeader>
            <CardTitle className={needsOR ? 'text-red-300' : ''}>
              Disposition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {needsOR && (
              <div className="p-4 bg-red-900 rounded">
                <p className="text-white font-bold text-lg">⚠️ URGENT: Operating Room Required</p>
              </div>
            )}

            {needsICU && !needsOR && (
              <div className="p-4 bg-yellow-900 rounded">
                <p className="text-white font-bold text-lg">ICU Admission Required</p>
              </div>
            )}

            {!needsOR && !needsICU && (
              <div className="p-4 bg-green-900 rounded">
                <p className="text-white font-bold text-lg">✓ Stable for Ward Admission</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
          Close Protocol
        </Button>
      </div>
    );
  };

  const renderPhase = () => {
    switch (phase) {
      case 'patient_info':
        return renderPatientInfo();
      case 'mechanism':
        return renderMechanism();
      case 'primary_survey_airway':
        return renderAirway();
      case 'primary_survey_breathing':
        return renderBreathing();
      case 'primary_survey_circulation':
        return renderCirculation();
      case 'primary_survey_disability':
        return renderDisability();
      case 'primary_survey_exposure':
        return renderExposure();
      case 'secondary_survey':
        return renderSecondarySurvey();
      case 'complete':
        return renderComplete();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
                Universal Trauma Protocol
              </h1>
              <p className="text-gray-400 mt-1">
                ATLS-based | Age: {patientAge}y | Weight: {patientWeight}kg
              </p>
            </div>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm">
              {['Patient Info', 'Mechanism', 'A', 'B', 'C', 'D', 'E'].map((step, idx) => {
                const phases: TraumaPhase[] = ['patient_info', 'mechanism', 'primary_survey_airway', 'primary_survey_breathing', 'primary_survey_circulation', 'primary_survey_disability', 'primary_survey_exposure', 'secondary_survey', 'complete'];
                const currentIdx = phases.indexOf(phase);
                const isActive = idx === currentIdx;
                const isComplete = idx < currentIdx;

                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center $${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isComplete
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {isComplete ? '✓' : idx + 1}
                    </div>
                    <span className={`mt-1 $${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {renderPhase()}
        </div>
      </div>
    </div>
  );
}
