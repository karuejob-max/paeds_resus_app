// ============================================================================
// INTEGRATED CLINICAL FLOW
// Wires all advanced components together with automatic triggers
// GPS-like navigation through pediatric emergencies
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  Heart, 
  Wind, 
  Brain, 
  Droplets,
  Activity,
  Phone,
  ChevronRight,
  X
} from 'lucide-react';

// Import all advanced components
// Note: These components should be imported when available
// For now, we'll create placeholder implementations
// import ShockAssessment from './ShockAssessment';
// import AsthmaEscalation from './AsthmaEscalation';
// import IVIOAccessTimer from './IVIOAccessTimer';
// import FluidBolusTracker from './FluidBolusTracker';
// import InotropeEscalation from './InotropeEscalation';
// import LabSampleCollection from './LabSampleCollection';
// import ArrhythmiaRecognition from './ArrhythmiaRecognition';
// import ReferralInitiation from './ReferralInitiation';

import LabSampleCollection from './LabSampleCollection';
import ArrhythmiaRecognition from './ArrhythmiaRecognition';

// Clinical trigger conditions
interface ClinicalFindings {
  // Airway
  airwayCompromised: boolean;
  
  // Breathing
  respiratoryDistress: boolean;
  wheezingPresent: boolean;
  oxygenSaturation: number | null;
  respiratoryRate: number | null;
  
  // Circulation
  poorPerfusion: boolean;
  capillaryRefillTime: number | null;
  heartRate: number | null;
  bloodPressure: { systolic: number; diastolic: number } | null;
  pulseQuality: 'strong' | 'weak' | 'absent' | null;
  
  // Disability
  consciousnessLevel: 'alert' | 'voice' | 'pain' | 'unresponsive' | null;
  seizureActive: boolean;
  
  // Exposure
  temperature: number | null;
  rash: boolean;
}

interface IntegratedClinicalFlowProps {
  patientWeight: number;
  patientAge: number; // years
  clinicalFindings: ClinicalFindings;
  onReferralInitiated?: (referralData: any) => void;
  onInterventionCompleted?: (intervention: string) => void;
}

type ActiveModule = 
  | 'shock_assessment'
  | 'asthma_escalation'
  | 'iv_io_access'
  | 'fluid_bolus'
  | 'inotrope_escalation'
  | 'lab_collection'
  | 'arrhythmia'
  | 'referral'
  | null;

interface ModuleTrigger {
  module: ActiveModule;
  priority: number;
  reason: string;
  icon: React.ReactNode;
  color: string;
}

const IntegratedClinicalFlow: React.FC<IntegratedClinicalFlowProps> = ({
  patientWeight,
  patientAge,
  clinicalFindings,
  onReferralInitiated,
  onInterventionCompleted,
}) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>(null);
  const [triggeredModules, setTriggeredModules] = useState<ModuleTrigger[]>([]);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [ivAccessObtained, setIvAccessObtained] = useState(false);
  const [shockType, setShockType] = useState<string | null>(null);
  const [totalFluidGiven, setTotalFluidGiven] = useState(0);
  
  // Evaluate clinical findings and trigger appropriate modules
  const evaluateTriggers = useCallback(() => {
    const triggers: ModuleTrigger[] = [];
    
    // CIRCULATION - Highest priority for shock
    if (clinicalFindings.poorPerfusion || 
        (clinicalFindings.capillaryRefillTime && clinicalFindings.capillaryRefillTime > 3) ||
        clinicalFindings.pulseQuality === 'weak' ||
        clinicalFindings.pulseQuality === 'absent') {
      
      // First: Need shock assessment to differentiate type
      if (!shockType && !completedModules.has('shock_assessment')) {
        triggers.push({
          module: 'shock_assessment',
          priority: 1,
          reason: 'Poor perfusion detected - differentiate shock type',
          icon: <Droplets className="h-5 w-5" />,
          color: 'bg-red-600',
        });
      }
      
      // Then: Need IV/IO access
      if (!ivAccessObtained && !completedModules.has('iv_io_access')) {
        triggers.push({
          module: 'iv_io_access',
          priority: 2,
          reason: 'Vascular access needed for resuscitation',
          icon: <Activity className="h-5 w-5" />,
          color: 'bg-orange-600',
        });
      }
      
      // Then: Fluid boluses
      if (ivAccessObtained && shockType && shockType !== 'cardiogenic' && totalFluidGiven < 60 * patientWeight) {
        triggers.push({
          module: 'fluid_bolus',
          priority: 3,
          reason: `Continue fluid resuscitation (${totalFluidGiven} mL given)`,
          icon: <Droplets className="h-5 w-5" />,
          color: 'bg-blue-600',
        });
      }
      
      // If fluid refractory: Inotropes
      if (totalFluidGiven >= 40 * patientWeight && clinicalFindings.poorPerfusion) {
        triggers.push({
          module: 'inotrope_escalation',
          priority: 2,
          reason: 'Fluid-refractory shock - consider vasopressors',
          icon: <Heart className="h-5 w-5" />,
          color: 'bg-purple-600',
        });
      }
    }
    
    // BREATHING - Asthma/Wheeze
    if (clinicalFindings.wheezingPresent || 
        (clinicalFindings.oxygenSaturation && clinicalFindings.oxygenSaturation < 92)) {
      triggers.push({
        module: 'asthma_escalation',
        priority: clinicalFindings.oxygenSaturation && clinicalFindings.oxygenSaturation < 88 ? 1 : 3,
        reason: 'Respiratory distress with wheeze - bronchodilator escalation',
        icon: <Wind className="h-5 w-5" />,
        color: 'bg-cyan-600',
      });
    }
    
    // CARDIAC - Arrhythmia detection
    if (clinicalFindings.heartRate) {
      const ageInMonths = patientAge * 12;
      const normalHRLow = ageInMonths < 12 ? 100 : ageInMonths < 36 ? 90 : 70;
      const normalHRHigh = ageInMonths < 12 ? 180 : ageInMonths < 36 ? 150 : 120;
      
      if (clinicalFindings.heartRate < normalHRLow || clinicalFindings.heartRate > normalHRHigh) {
        triggers.push({
          module: 'arrhythmia',
          priority: clinicalFindings.heartRate < 60 || clinicalFindings.heartRate > 220 ? 1 : 4,
          reason: `Abnormal heart rate (${clinicalFindings.heartRate} bpm) - identify rhythm`,
          icon: <Heart className="h-5 w-5" />,
          color: 'bg-red-500',
        });
      }
    }
    
    // LAB COLLECTION - Always relevant in critical illness
    if (clinicalFindings.poorPerfusion || 
        clinicalFindings.respiratoryDistress ||
        clinicalFindings.consciousnessLevel === 'unresponsive' ||
        clinicalFindings.consciousnessLevel === 'pain') {
      triggers.push({
        module: 'lab_collection',
        priority: 5,
        reason: 'Collect diagnostic samples for workup',
        icon: <Activity className="h-5 w-5" />,
        color: 'bg-emerald-600',
      });
    }
    
    // Sort by priority
    triggers.sort((a, b) => a.priority - b.priority);
    setTriggeredModules(triggers);
    
    // Auto-open highest priority if nothing active
    if (!activeModule && triggers.length > 0) {
      setActiveModule(triggers[0].module);
    }
  }, [clinicalFindings, shockType, ivAccessObtained, totalFluidGiven, completedModules, activeModule, patientWeight, patientAge]);
  
  useEffect(() => {
    evaluateTriggers();
  }, [evaluateTriggers]);
  
  // Handle module completion
  const handleModuleComplete = (module: string, data?: any) => {
    setCompletedModules(prev => new Set([...Array.from(prev), module]));
    
    switch (module) {
      case 'shock_assessment':
        if (data?.shockType) setShockType(data.shockType);
        break;
      case 'iv_io_access':
        setIvAccessObtained(true);
        break;
      case 'fluid_bolus':
        if (data?.totalVolume) setTotalFluidGiven(data.totalVolume);
        break;
    }
    
    onInterventionCompleted?.(module);
    setActiveModule(null);
  };
  
  // Render active module
  const renderActiveModule = () => {
    switch (activeModule) {
      case 'shock_assessment':
        return (
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h3 className="text-white font-bold mb-2">Shock Assessment</h3>
            <p className="text-slate-300 mb-4">Differentiate shock type through systematic assessment</p>
            <Button onClick={() => handleModuleComplete('shock_assessment', { shockType: 'hypovolemic' })} className="bg-green-600">
              Complete Assessment
            </Button>
          </Card>
        );
      
      case 'asthma_escalation':
        return (
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h3 className="text-white font-bold mb-2">Asthma Escalation</h3>
            <p className="text-slate-300 mb-4">Bronchodilator escalation pathway</p>
            <Button onClick={() => handleModuleComplete('asthma_escalation')} className="bg-green-600">
              Complete Escalation
            </Button>
          </Card>
        );
      
      case 'iv_io_access':
        return (
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h3 className="text-white font-bold mb-2">IV/IO Access</h3>
            <p className="text-slate-300 mb-4">Obtain vascular access within 90 seconds</p>
            <Button onClick={() => handleModuleComplete('iv_io_access', { accessType: 'IV' })} className="bg-green-600">
              Access Obtained
            </Button>
          </Card>
        );
      
      case 'fluid_bolus':
        return (
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h3 className="text-white font-bold mb-2">Fluid Bolus Tracker</h3>
            <p className="text-slate-300 mb-4">Track fluid administration with reassessment</p>
            <Button onClick={() => handleModuleComplete('fluid_bolus', { totalVolume: totalFluidGiven + (patientWeight * 10) })} className="bg-green-600">
              Complete Bolus
            </Button>
          </Card>
        );
      
      case 'inotrope_escalation':
        return (
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h3 className="text-white font-bold mb-2">Inotrope Escalation</h3>
            <p className="text-slate-300 mb-4">Vasopressor support for fluid-refractory shock</p>
            <Button onClick={() => handleModuleComplete('inotrope_escalation')} className="bg-green-600">
              Infusion Started
            </Button>
          </Card>
        );
      
      case 'lab_collection':
        return (
          <LabSampleCollection
            clinicalContext={shockType ? 'shock' : clinicalFindings.wheezingPresent ? 'respiratory' : 'general'}
            patientAge={patientAge}
            patientWeight={patientWeight}
            onSamplesCollected={() => handleModuleComplete('lab_collection')}
          />
        );
      
      case 'arrhythmia':
        return (
          <ArrhythmiaRecognition
            patientWeight={patientWeight}
            patientAge={patientAge}
            onTreatmentSelected={() => handleModuleComplete('arrhythmia')}
          />
        );
      
      case 'referral':
        return (
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h3 className="text-white font-bold mb-2">Initiate Referral</h3>
            <p className="text-slate-300 mb-4">Generate SBAR summary and contact referral center</p>
            <Button onClick={() => {
              handleModuleComplete('referral');
              onReferralInitiated?.({ shockType, fluidGiven: totalFluidGiven });
            }} className="bg-red-600">
              Complete Referral
            </Button>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Triggered Modules Panel */}
      {triggeredModules.length > 0 && !activeModule && (
        <Card className="bg-slate-800/90 border-slate-700 p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            Clinical Actions Required
          </h3>
          <div className="space-y-2">
            {triggeredModules.map((trigger, idx) => (
              <Button
                key={trigger.module}
                variant="outline"
                onClick={() => setActiveModule(trigger.module)}
                className={`w-full h-auto py-3 px-4 justify-start text-left border-slate-600 hover:border-white ${
                  idx === 0 ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <div className={`${trigger.color} p-2 rounded mr-3`}>
                  {trigger.icon}
                </div>
                <div className="flex-1">
                  <span className="text-white font-medium block">
                    {trigger.module?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="text-slate-400 text-sm">{trigger.reason}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Button>
            ))}
          </div>
        </Card>
      )}
      
      {/* Active Module */}
      {activeModule && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveModule(null)}
            className="absolute top-2 right-2 z-10 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
          {renderActiveModule()}
        </div>
      )}
      
      {/* Referral Button - Always Visible */}
      <Button
        variant="outline"
        onClick={() => setActiveModule('referral')}
        className="w-full border-red-600 bg-red-900/20 hover:bg-red-900/40 text-red-300"
      >
        <Phone className="h-5 w-5 mr-2" />
        Initiate Referral / Get Help
      </Button>
      
      {/* Status Summary */}
      <Card className="bg-slate-900/50 border-slate-700 p-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`px-2 py-1 rounded ${ivAccessObtained ? 'bg-green-600' : 'bg-slate-600'}`}>
            IV/IO: {ivAccessObtained ? 'Obtained' : 'Pending'}
          </span>
          {shockType && (
            <span className="px-2 py-1 rounded bg-blue-600">
              Shock: {shockType}
            </span>
          )}
          {totalFluidGiven > 0 && (
            <span className="px-2 py-1 rounded bg-cyan-600">
              Fluids: {totalFluidGiven} mL ({(totalFluidGiven / patientWeight).toFixed(0)} mL/kg)
            </span>
          )}
          {completedModules.size > 0 && (
            <span className="px-2 py-1 rounded bg-emerald-600">
              Completed: {completedModules.size} modules
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};

export default IntegratedClinicalFlow;
