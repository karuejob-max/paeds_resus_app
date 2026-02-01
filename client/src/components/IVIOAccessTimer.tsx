/**
 * IV/IO Access Timer Component
 * 
 * Tracks vascular access attempts with 90-second escalation to IO.
 * This is where children die - we must not let providers struggle with IV too long.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Syringe, Target, Phone, Play, Pause, RotateCcw } from 'lucide-react';
import { triggerAlert, triggerHaptic, playCountdownBeep } from '@/lib/alertSystem';

interface AccessAttempt {
  type: 'IV' | 'IO';
  site: string;
  startTime: Date;
  endTime?: Date;
  success: boolean;
}

interface Props {
  weightKg: number;
  onAccessObtained: (type: 'IV' | 'IO', site: string) => void;
  onReferralRequested: (reason: string) => void;
}

const IV_SITES = [
  { name: 'Dorsum of hand', tip: 'Use tourniquet, warm limb to dilate veins' },
  { name: 'Antecubital fossa', tip: 'Palpate for median cubital vein' },
  { name: 'Saphenous vein (ankle)', tip: 'Anterior to medial malleolus' },
  { name: 'Scalp vein', tip: 'For infants - visible without tourniquet' },
  { name: 'External jugular', tip: 'Last resort IV - Trendelenburg position' },
];

const IO_SITES = [
  { 
    name: 'Proximal tibia', 
    description: '1-2 cm below tibial tuberosity, medial flat surface',
    ageRange: 'All ages',
    preferred: true
  },
  { 
    name: 'Distal tibia', 
    description: '1-2 cm above medial malleolus',
    ageRange: 'All ages',
    preferred: false
  },
  { 
    name: 'Distal femur', 
    description: '1-2 cm above lateral condyle, anterior midline',
    ageRange: 'Infants only',
    preferred: false
  },
  { 
    name: 'Humeral head', 
    description: 'Greater tubercle, arm adducted and internally rotated',
    ageRange: '> 6 years',
    preferred: false
  },
];

const IO_TECHNIQUE = [
  '1. Clean site with antiseptic',
  '2. Stabilize limb firmly',
  '3. Insert needle perpendicular to bone',
  '4. Advance with rotating motion until "pop" felt',
  '5. Remove stylet',
  '6. Aspirate for marrow (may not always get)',
  '7. Flush with 5-10 mL NS - should flow freely',
  '8. Secure and connect fluids',
];

const IO_CONTRAINDICATIONS = [
  'Fracture in target bone',
  'Previous IO in same bone within 24 hours',
  'Infection at insertion site',
  'Osteogenesis imperfecta',
];

export function IVIOAccessTimer({ weightKg, onAccessObtained, onReferralRequested }: Props) {
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attempts, setAttempts] = useState<AccessAttempt[]>([]);
  const [currentAttemptType, setCurrentAttemptType] = useState<'IV' | 'IO'>('IV');
  const [showIOGuidance, setShowIOGuidance] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [accessObtained, setAccessObtained] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (timerRunning && !accessObtained) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const newValue = prev + 1;
          
          // Countdown beeps for last 10 seconds before 90
          if (newValue >= 80 && newValue < 90) {
            playCountdownBeep(90 - newValue);
          }
          
          // Alert at 90 seconds
          if (newValue === 90) {
            triggerAlert('critical_action');
            triggerHaptic('urgent');
            setShowIOGuidance(true);
          }
          
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerRunning, accessObtained]);

  const startTimer = () => {
    setTimerRunning(true);
    setElapsedSeconds(0);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setElapsedSeconds(0);
    setAttempts([]);
    setShowIOGuidance(false);
    setCurrentAttemptType('IV');
  };

  const recordAttempt = (success: boolean, site: string) => {
    const attempt: AccessAttempt = {
      type: currentAttemptType,
      site,
      startTime: new Date(Date.now() - elapsedSeconds * 1000),
      endTime: new Date(),
      success,
    };
    
    setAttempts(prev => [...prev, attempt]);

    if (success) {
      setAccessObtained(true);
      setTimerRunning(false);
      triggerAlert('success');
      onAccessObtained(currentAttemptType, site);
    } else {
      // Check if should escalate to IO
      const failedIVAttempts = [...attempts, attempt].filter(a => a.type === 'IV' && !a.success).length;
      if (failedIVAttempts >= 2 || elapsedSeconds >= 90) {
        setShowIOGuidance(true);
        setCurrentAttemptType('IO');
        triggerAlert('critical_action');
      }
    }
  };

  const getNeedleSize = () => {
    if (weightKg < 3) return '15 mm needle';
    if (weightKg <= 39) return '25 mm needle';
    return '45 mm needle';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min((elapsedSeconds / 90) * 100, 100);
  const isUrgent = elapsedSeconds >= 60;
  const isCritical = elapsedSeconds >= 90;

  if (accessObtained) {
    return (
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-green-500/10">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-6 w-6" />
            Vascular Access Obtained
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <Badge className="bg-green-600 text-white text-lg px-4 py-2">
              {attempts[attempts.length - 1]?.type} Access at {attempts[attempts.length - 1]?.site}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Time to access: {formatTime(elapsedSeconds)}
            </p>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4">
            <h4 className="font-semibold mb-2">Next Steps:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Confirm placement with flush (should flow freely)</li>
              <li>Secure access site</li>
              <li>Draw labs if needed (glucose, lactate, blood gas)</li>
              <li>Begin fluid resuscitation</li>
            </ul>
          </div>

          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => onAccessObtained(attempts[attempts.length - 1]?.type || 'IV', attempts[attempts.length - 1]?.site || '')}
          >
            Continue to Fluid Resuscitation
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timer Display */}
      <Card className={`border-2 ${isCritical ? 'border-red-500 bg-red-500/5' : isUrgent ? 'border-orange-500 bg-orange-500/5' : 'border-primary'}`}>
        <CardHeader className={isCritical ? 'bg-red-500/10' : isUrgent ? 'bg-orange-500/10' : 'bg-primary/10'}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 ${isCritical ? 'text-red-500 animate-pulse' : ''}`} />
              IV/IO Access Timer
            </div>
            <Badge variant={isCritical ? 'destructive' : isUrgent ? 'secondary' : 'outline'}>
              {currentAttemptType} Mode
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Large Timer Display */}
          <div className="text-center">
            <div className={`text-6xl font-mono font-bold ${isCritical ? 'text-red-500' : isUrgent ? 'text-orange-500' : ''}`}>
              {formatTime(elapsedSeconds)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isCritical ? 'ESCALATE TO IO NOW' : isUrgent ? 'Consider IO access' : 'Target: < 90 seconds'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress 
              value={progressPercent} 
              className={`h-3 ${isCritical ? '[&>div]:bg-red-500' : isUrgent ? '[&>div]:bg-orange-500' : ''}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0s</span>
              <span className="text-orange-500">60s</span>
              <span className="text-red-500">90s → IO</span>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex gap-2">
            {!timerRunning ? (
              <Button className="flex-1" onClick={startTimer}>
                <Play className="h-4 w-4 mr-2" />
                {elapsedSeconds === 0 ? 'Start Timer' : 'Resume'}
              </Button>
            ) : (
              <Button className="flex-1" variant="secondary" onClick={pauseTimer}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            <Button variant="outline" onClick={resetTimer}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Attempt History */}
          {attempts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Attempts:</h4>
              <div className="flex flex-wrap gap-2">
                {attempts.map((attempt, i) => (
                  <Badge 
                    key={i} 
                    variant={attempt.success ? 'default' : 'destructive'}
                    className={attempt.success ? 'bg-green-600' : ''}
                  >
                    {attempt.type} #{i + 1}: {attempt.site} {attempt.success ? '✓' : '✗'}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IV Sites (shown when in IV mode) */}
      {currentAttemptType === 'IV' && !showIOGuidance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Syringe className="h-5 w-5" />
              IV Access Sites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {IV_SITES.map((site) => (
              <div key={site.name} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                <div>
                  <div className="font-medium">{site.name}</div>
                  <div className="text-xs text-muted-foreground">{site.tip}</div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-500 border-red-500"
                    onClick={() => recordAttempt(false, site.name)}
                  >
                    Failed
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => recordAttempt(true, site.name)}
                  >
                    Success
                  </Button>
                </div>
              </div>
            ))}

            <Button 
              variant="outline" 
              className="w-full border-orange-500 text-orange-500"
              onClick={() => {
                setShowIOGuidance(true);
                setCurrentAttemptType('IO');
              }}
            >
              <Target className="h-4 w-4 mr-2" />
              Skip to IO Access
            </Button>
          </CardContent>
        </Card>
      )}

      {/* IO Guidance (shown when escalated or manually selected) */}
      {showIOGuidance && (
        <Card className="border-2 border-orange-500">
          <CardHeader className="bg-orange-500/10">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              IO Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Needle Size */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
              <div className="font-semibold">Needle Size for {weightKg} kg:</div>
              <div className="text-xl font-bold text-blue-600">{getNeedleSize()}</div>
            </div>

            {/* IO Sites */}
            <div className="space-y-2">
              <h4 className="font-semibold">Select IO Site:</h4>
              {IO_SITES.map((site) => (
                <div 
                  key={site.name} 
                  className={`p-3 border rounded ${site.preferred ? 'border-green-500 bg-green-500/5' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {site.name}
                        {site.preferred && <Badge className="bg-green-600">Preferred</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">{site.description}</div>
                      <div className="text-xs text-muted-foreground">Age: {site.ageRange}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-500 border-red-500"
                        onClick={() => recordAttempt(false, site.name)}
                      >
                        Failed
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => recordAttempt(true, site.name)}
                      >
                        Success
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* IO Technique */}
            <div className="space-y-2">
              <h4 className="font-semibold">IO Insertion Technique:</h4>
              <ol className="list-decimal list-inside text-sm space-y-1 bg-muted/50 p-3 rounded">
                {IO_TECHNIQUE.map((step, i) => (
                  <li key={i}>{step.substring(3)}</li>
                ))}
              </ol>
            </div>

            {/* Contraindications */}
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
              <h4 className="font-semibold text-red-700 mb-2">Contraindications:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {IO_CONTRAINDICATIONS.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Button */}
      <Button
        variant="outline"
        className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10"
        onClick={() => onReferralRequested('Unable to obtain vascular access')}
      >
        <Phone className="h-4 w-4 mr-2" />
        Initiate Referral (Cannot obtain access)
      </Button>
    </div>
  );
}

export default IVIOAccessTimer;
