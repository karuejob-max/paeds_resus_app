/**
 * Emergency Protocol Quick-Launcher
 * 
 * Provides direct access to emergency protocols when diagnosis is known,
 * bypassing full clinical assessment to save time in critical situations.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  Wind, 
  Droplet, 
  Zap, 
  AlertTriangle,
  Brain,
  X
} from 'lucide-react';

interface Props {
  onLaunchProtocol: (protocol: string, age: number, weight: number) => void;
  onClose: () => void;
}

interface Protocol {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  available: boolean;
}

export function EmergencyLauncher({ onLaunchProtocol, onClose }: Props) {
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [ageYears, setAgeYears] = useState(0);
  const [ageMonths, setAgeMonths] = useState(0);
  const [weight, setWeight] = useState(0);

  const protocols: Protocol[] = [
    {
      id: 'cardiac_arrest',
      name: 'Cardiac Arrest',
      icon: <Heart className="h-8 w-8" />,
      color: 'bg-red-600 hover:bg-red-700',
      description: 'CPR Clock / ACLS Protocol',
      available: true,
    },
    {
      id: 'asthma',
      name: 'Severe Asthma',
      icon: <Wind className="h-8 w-8" />,
      color: 'bg-orange-600 hover:bg-orange-700',
      description: 'Status Asthmaticus Protocol',
      available: true,
    },
    {
      id: 'dka',
      name: 'DKA',
      icon: <Droplet className="h-8 w-8" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'Diabetic Ketoacidosis',
      available: false,
    },
    {
      id: 'septic_shock',
      name: 'Septic Shock',
      icon: <AlertTriangle className="h-8 w-8" />,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      description: 'Sepsis Management Protocol',
      available: false,
    },
    {
      id: 'anaphylaxis',
      name: 'Anaphylaxis',
      icon: <Zap className="h-8 w-8" />,
      color: 'bg-pink-600 hover:bg-pink-700',
      description: 'Anaphylactic Shock Protocol',
      available: false,
    },
    {
      id: 'status_epilepticus',
      name: 'Status Epilepticus',
      icon: <Brain className="h-8 w-8" />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      description: 'Seizure Management Protocol',
      available: false,
    },
  ];

  const handleProtocolSelect = (protocolId: string) => {
    setSelectedProtocol(protocolId);
    setShowPatientDialog(true);
  };

  const handleLaunch = () => {
    if (selectedProtocol && (ageYears > 0 || ageMonths > 0) && weight > 0) {
      const totalAge = ageYears + (ageMonths / 12);
      onLaunchProtocol(selectedProtocol, totalAge, weight);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Emergency Protocol Launcher</h1>
              <p className="text-gray-400">Direct access when diagnosis is known</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>

          {/* Protocol Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {protocols.map((protocol) => (
              <Card
                key={protocol.id}
                className={`bg-gray-900 border-gray-700 ${!protocol.available ? 'opacity-50' : 'cursor-pointer hover:border-gray-500'}`}
              >
                <CardContent className="p-6">
                  <Button
                    onClick={() => protocol.available && handleProtocolSelect(protocol.id)}
                    disabled={!protocol.available}
                    className={`w-full h-auto flex flex-col items-center gap-3 py-6 ${protocol.color}`}
                  >
                    {protocol.icon}
                    <div className="text-center">
                      <div className="text-xl font-bold">{protocol.name}</div>
                      <div className="text-sm opacity-90">{protocol.description}</div>
                    </div>
                  </Button>
                  {!protocol.available && (
                    <p className="text-center text-xs text-gray-500 mt-2">Coming Soon</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Instructions */}
          <Card className="bg-gray-900 border-gray-700 mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">When to Use Quick Launch</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>You have a clear diagnosis and need immediate protocol guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Patient is critically ill and time is essential</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>You want to skip the full clinical assessment</span>
                </li>
              </ul>
              
              <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700 rounded">
                <p className="text-yellow-200 text-sm">
                  <strong>Note:</strong> If diagnosis is uncertain, use the full Clinical Assessment GPS for step-by-step guidance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Data Dialog */}
        {showPatientDialog && selectedProtocol && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-900 border-gray-700 max-w-md w-full">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Patient Information</h2>
                <p className="text-gray-300 mb-6">
                  Enter patient age and weight to launch{' '}
                  <span className="text-blue-400 font-semibold">
                    {protocols.find(p => p.id === selectedProtocol)?.name}
                  </span>{' '}
                  protocol.
                </p>

                <div className="space-y-4">
                  {/* Age Input */}
                  <div>
                    <Label className="text-white mb-2 block">Patient Age</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="age-years" className="text-gray-400 text-xs">Years</Label>
                        <Input
                          id="age-years"
                          type="number"
                          value={ageYears}
                          onChange={(e) => setAgeYears(Number(e.target.value))}
                          className="bg-gray-800 border-gray-600 text-white"
                          min="0"
                          max="120"
                        />
                      </div>
                      <div>
                        <Label htmlFor="age-months" className="text-gray-400 text-xs">Months (if &lt;2y)</Label>
                        <Input
                          id="age-months"
                          type="number"
                          value={ageMonths}
                          onChange={(e) => setAgeMonths(Number(e.target.value))}
                          className="bg-gray-800 border-gray-600 text-white"
                          min="0"
                          max="23"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Weight Input */}
                  <div>
                    <Label htmlFor="weight" className="text-white">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="bg-gray-800 border-gray-600 text-white"
                      min="0.5"
                      max="300"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {ageYears >= 18 ? 'Adult typical: 50-120 kg' : 'Pediatric typical: 3-80 kg'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPatientDialog(false);
                        setSelectedProtocol(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleLaunch}
                      disabled={(ageYears === 0 && ageMonths === 0) || weight === 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Launch Protocol
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
