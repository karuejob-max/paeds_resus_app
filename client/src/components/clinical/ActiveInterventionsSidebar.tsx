/**
 * Active Interventions Sidebar
 * 
 * GPS-like parallel intervention tracking. Shows all ongoing interventions
 * without blocking the main assessment flow. Providers can mark interventions
 * complete, trigger reassessments, or escalate at any time.
 */

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUp, 
  Syringe,
  Droplets,
  Activity,
  Zap,
  Wind,
  Heart,
  Thermometer,
  X,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Intervention types
export type InterventionType = 
  | 'iv_access'
  | 'io_access'
  | 'fluid_bolus'
  | 'medication'
  | 'airway'
  | 'breathing'
  | 'cpr'
  | 'defibrillation'
  | 'cardioversion'
  | 'nebulizer'
  | 'lab_collection'
  | 'monitoring';

export type InterventionStatus = 
  | 'pending'      // Not started
  | 'in_progress'  // Timer running
  | 'needs_reassessment'  // Timer expired, needs check
  | 'completed'    // Done
  | 'escalated'    // Moved to next level
  | 'failed';      // Could not complete

export type InterventionPriority = 'critical' | 'urgent' | 'routine';

export interface ActiveIntervention {
  id: string;
  type: InterventionType;
  title: string;
  instruction: string;
  priority: InterventionPriority;
  status: InterventionStatus;
  startTime: Date;
  timerDuration?: number;  // seconds
  timerRemaining?: number; // seconds
  escalationAction?: string;
  escalationTrigger?: number; // seconds until auto-escalate
  reassessmentRequired?: boolean;
  reassessmentPrompt?: string;
  dose?: string;
  route?: string;
  bolusNumber?: number;
  totalBoluses?: number;
  volumeGiven?: number;
  maxVolume?: number;
  relatedModule?: string;  // Which advanced module to trigger
  metadata?: Record<string, any>;
}

interface ActiveInterventionsSidebarProps {
  interventions: ActiveIntervention[];
  onInterventionComplete: (id: string) => void;
  onInterventionEscalate: (id: string, reason: string) => void;
  onReassessmentTrigger: (id: string) => void;
  onInterventionCancel: (id: string) => void;
  onModuleTrigger: (moduleName: string, interventionId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  weightKg: number;
}

export const ActiveInterventionsSidebar: React.FC<ActiveInterventionsSidebarProps> = ({
  interventions,
  onInterventionComplete,
  onInterventionEscalate,
  onReassessmentTrigger,
  onInterventionCancel,
  onModuleTrigger,
  collapsed = false,
  onToggleCollapse,
  weightKg
}) => {

  // Track timer updates
  const [timerTick, setTimerTick] = useState(0);

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get icon for intervention type
  const getInterventionIcon = (type: InterventionType) => {
    switch (type) {
      case 'iv_access':
      case 'io_access':
        return <Syringe className="h-5 w-5" />;
      case 'fluid_bolus':
        return <Droplets className="h-5 w-5" />;
      case 'medication':
        return <Activity className="h-5 w-5" />;
      case 'airway':
        return <Wind className="h-5 w-5" />;
      case 'breathing':
        return <Wind className="h-5 w-5" />;
      case 'cpr':
        return <Heart className="h-5 w-5" />;
      case 'defibrillation':
      case 'cardioversion':
        return <Zap className="h-5 w-5" />;
      case 'nebulizer':
        return <Wind className="h-5 w-5" />;
      case 'lab_collection':
        return <Thermometer className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  // Get color based on priority and status
  const getInterventionColor = (intervention: ActiveIntervention) => {
    if (intervention.status === 'needs_reassessment') {
      return 'border-yellow-500 bg-yellow-900/50';
    }
    if (intervention.status === 'completed') {
      return 'border-green-500 bg-green-900/30';
    }
    if (intervention.status === 'failed') {
      return 'border-red-500 bg-red-900/50';
    }
    if (intervention.priority === 'critical') {
      return 'border-red-500 bg-red-900/30';
    }
    if (intervention.priority === 'urgent') {
      return 'border-orange-500 bg-orange-900/30';
    }
    return 'border-slate-500 bg-slate-800/50';
  };

  // Format time remaining
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time remaining for an intervention
  const getTimeRemaining = (intervention: ActiveIntervention): number => {
    if (!intervention.timerDuration) return 0;
    const elapsed = Math.floor((Date.now() - intervention.startTime.getTime()) / 1000);
    return Math.max(0, intervention.timerDuration - elapsed);
  };

  // Get active (non-completed) interventions
  const activeInterventions = interventions.filter(
    i => i.status !== 'completed' && i.status !== 'failed'
  );

  // Get completed interventions
  const completedInterventions = interventions.filter(
    i => i.status === 'completed' || i.status === 'failed'
  );

  // Sort by priority
  const sortedActive = [...activeInterventions].sort((a, b) => {
    const priorityOrder = { critical: 0, urgent: 1, routine: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (collapsed) {
    return (
      <div 
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 cursor-pointer"
        onClick={onToggleCollapse}
      >
        <div className="bg-slate-800 border border-slate-600 rounded-l-lg p-2 shadow-lg">
          <div className="flex flex-col items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            {activeInterventions.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeInterventions.length}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-slate-400 rotate-180" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-80 md:w-96 bg-slate-900/95 border-l border-slate-700 z-40 overflow-hidden flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          <h3 className="font-bold text-white">Active Interventions</h3>
          {activeInterventions.length > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {activeInterventions.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Active Interventions */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sortedActive.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active interventions</p>
            <p className="text-xs mt-1">Interventions will appear here as they're triggered</p>
          </div>
        ) : (
          sortedActive.map(intervention => {
            const timeRemaining = getTimeRemaining(intervention);
            const isExpired = intervention.timerDuration && timeRemaining <= 0;
            const isUrgent = timeRemaining > 0 && timeRemaining <= 30;

            return (
              <Card
                key={intervention.id}
                className={`border-2 p-3 transition-all ${getInterventionColor(intervention)} ${
                  isExpired ? 'animate-pulse' : ''
                }`}
              >
                {/* Priority Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center gap-2 text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    intervention.priority === 'critical' ? 'bg-red-600 text-white' :
                    intervention.priority === 'urgent' ? 'bg-orange-600 text-white' :
                    'bg-slate-600 text-slate-200'
                  }`}>
                    {getInterventionIcon(intervention.type)}
                    {intervention.priority}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onInterventionCancel(intervention.id)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-white text-sm mb-1">
                  {intervention.title}
                </h4>

                {/* Instruction */}
                <p className="text-slate-300 text-xs mb-2">
                  {intervention.instruction}
                </p>

                {/* Dose/Route if applicable */}
                {(intervention.dose || intervention.route) && (
                  <div className="flex gap-2 mb-2">
                    {intervention.dose && (
                      <span className="bg-black/30 px-2 py-1 rounded text-xs text-white">
                        {intervention.dose}
                      </span>
                    )}
                    {intervention.route && (
                      <span className="bg-black/30 px-2 py-1 rounded text-xs text-slate-300">
                        {intervention.route}
                      </span>
                    )}
                  </div>
                )}

                {/* Bolus Progress if applicable */}
                {intervention.bolusNumber && intervention.totalBoluses && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Bolus {intervention.bolusNumber}/{intervention.totalBoluses}</span>
                      <span>{intervention.volumeGiven || 0} / {intervention.maxVolume || 0} mL</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all"
                        style={{ 
                          width: `${((intervention.volumeGiven || 0) / (intervention.maxVolume || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Timer */}
                {intervention.timerDuration && (
                  <div className={`flex items-center gap-2 mb-2 p-2 rounded ${
                    isExpired ? 'bg-red-600' : isUrgent ? 'bg-yellow-600' : 'bg-black/30'
                  }`}>
                    <Clock className="h-4 w-4 text-white" />
                    <span className={`font-mono font-bold ${
                      isExpired || isUrgent ? 'text-white' : 'text-slate-300'
                    }`}>
                      {isExpired ? 'TIME UP' : formatTime(timeRemaining)}
                    </span>
                    {isExpired && intervention.escalationAction && (
                      <span className="text-xs text-white ml-auto">
                        → {intervention.escalationAction}
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-2">
                  {intervention.status === 'needs_reassessment' || isExpired ? (
                    <Button
                      size="sm"
                      onClick={() => onReassessmentTrigger(intervention.id)}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reassess Now
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onInterventionComplete(intervention.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Done
                    </Button>
                  )}
                  
                  {intervention.escalationAction && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onInterventionEscalate(intervention.id, 'Manual escalation')}
                      className="bg-transparent border-orange-500 text-orange-400 hover:bg-orange-500/20 text-xs"
                    >
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Escalate
                    </Button>
                  )}
                </div>

                {/* Module Trigger */}
                {intervention.relatedModule && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onModuleTrigger(intervention.relatedModule!, intervention.id)}
                    className="w-full mt-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    Open {intervention.relatedModule} Module →
                  </Button>
                )}
              </Card>
            );
          })
        )}

        {/* Completed Interventions (collapsed) */}
        {completedInterventions.length > 0 && (
          <details className="mt-4">
            <summary className="text-slate-400 text-sm cursor-pointer hover:text-white">
              Completed ({completedInterventions.length})
            </summary>
            <div className="mt-2 space-y-2">
              {completedInterventions.map(intervention => (
                <div
                  key={intervention.id}
                  className={`p-2 rounded border text-xs ${
                    intervention.status === 'completed' 
                      ? 'border-green-700 bg-green-900/20 text-green-400'
                      : 'border-red-700 bg-red-900/20 text-red-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {intervention.status === 'completed' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span>{intervention.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Footer - Quick Stats */}
      <div className="p-3 border-t border-slate-700 bg-slate-800">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-slate-400">Active</p>
            <p className="text-lg font-bold text-orange-500">{activeInterventions.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Done</p>
            <p className="text-lg font-bold text-green-500">
              {completedInterventions.filter(i => i.status === 'completed').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Weight</p>
            <p className="text-lg font-bold text-white">{weightKg.toFixed(1)}kg</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to create interventions
export const createIntervention = (
  type: InterventionType,
  title: string,
  instruction: string,
  priority: InterventionPriority,
  options?: Partial<ActiveIntervention>
): ActiveIntervention => {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    instruction,
    priority,
    status: 'in_progress',
    startTime: new Date(),
    ...options
  };
};

// Predefined intervention templates
export const interventionTemplates = {
  ivAccess: (weightKg: number): ActiveIntervention => createIntervention(
    'iv_access',
    'GET IV ACCESS NOW',
    'Establish peripheral IV access. Use largest gauge possible.',
    'critical',
    {
      timerDuration: 90,
      escalationAction: 'Switch to IO',
      escalationTrigger: 90,
      relatedModule: 'IVIOAccessTimer'
    }
  ),

  ioAccess: (weightKg: number): ActiveIntervention => createIntervention(
    'io_access',
    'INTRAOSSEOUS ACCESS',
    weightKg < 10 
      ? 'Proximal tibia, 1-2cm below tibial tuberosity, medial flat surface'
      : 'Proximal tibia or distal femur. Use appropriate needle size.',
    'critical',
    {
      timerDuration: 60,
      relatedModule: 'IVIOAccessTimer'
    }
  ),

  fluidBolus: (weightKg: number, bolusNumber: number = 1): ActiveIntervention => {
    const volume = Math.round(weightKg * 10);
    return createIntervention(
      'fluid_bolus',
      `FLUID BOLUS ${bolusNumber}`,
      `Give ${volume} mL (10 mL/kg) Normal Saline or Ringer's Lactate`,
      'critical',
      {
        timerDuration: 300, // 5 minutes for bolus
        dose: `${volume} mL`,
        route: 'IV/IO push',
        bolusNumber,
        totalBoluses: 6, // Max 60 mL/kg
        volumeGiven: 0,
        maxVolume: weightKg * 60,
        reassessmentRequired: true,
        reassessmentPrompt: 'Reassess perfusion after bolus',
        relatedModule: 'FluidBolusTracker'
      }
    );
  },

  salbutamolNeb: (weightKg: number): ActiveIntervention => createIntervention(
    'nebulizer',
    'SALBUTAMOL NEBULIZER',
    weightKg < 20 
      ? '2.5 mg via nebulizer with oxygen'
      : '5 mg via nebulizer with oxygen',
    'urgent',
    {
      timerDuration: 600, // 10 minutes
      dose: weightKg < 20 ? '2.5 mg' : '5 mg',
      route: 'Nebulizer',
      reassessmentRequired: true,
      reassessmentPrompt: 'Reassess work of breathing and SpO2',
      relatedModule: 'AsthmaEscalation'
    }
  ),

  epinephrine: (weightKg: number, route: 'IV' | 'IM' = 'IV'): ActiveIntervention => {
    const dose = route === 'IV' 
      ? `${(weightKg * 0.01).toFixed(2)} mg (0.01 mg/kg)` 
      : `${Math.min(weightKg * 0.01, 0.5).toFixed(2)} mg (0.01 mg/kg, max 0.5mg)`;
    return createIntervention(
      'medication',
      route === 'IV' ? 'EPINEPHRINE IV' : 'EPINEPHRINE IM',
      route === 'IV' 
        ? 'Give 1:10,000 epinephrine IV/IO during CPR'
        : 'Give 1:1,000 epinephrine IM for anaphylaxis',
      'critical',
      {
        timerDuration: route === 'IV' ? 180 : 300, // 3 min for CPR, 5 min for anaphylaxis
        dose,
        route: route === 'IV' ? 'IV/IO' : 'IM (anterolateral thigh)',
        reassessmentRequired: true
      }
    );
  },

  bvmVentilation: (): ActiveIntervention => createIntervention(
    'breathing',
    'BAG-VALVE-MASK VENTILATION',
    'Position airway (head tilt-chin lift or jaw thrust). Ensure good seal. Squeeze bag to see chest rise.',
    'critical',
    {
      timerDuration: 30,
      reassessmentRequired: true,
      reassessmentPrompt: 'Is chest rising? Is SpO2 improving?'
    }
  ),

  cpr: (): ActiveIntervention => createIntervention(
    'cpr',
    'START CPR',
    'Hard and fast compressions. 100-120/min. Full chest recoil. Minimize interruptions.',
    'critical',
    {
      timerDuration: 120, // 2-minute cycles
      reassessmentRequired: true,
      reassessmentPrompt: 'Rhythm check and pulse check'
    }
  ),

  labCollection: (context: string): ActiveIntervention => createIntervention(
    'lab_collection',
    'COLLECT LAB SAMPLES',
    `Collect: VBG, lactate, glucose, electrolytes, CBC. Context: ${context}`,
    'urgent',
    {
      relatedModule: 'LabSampleCollection'
    }
  )
};

export default ActiveInterventionsSidebar;
