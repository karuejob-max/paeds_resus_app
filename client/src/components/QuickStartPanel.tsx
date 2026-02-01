import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  AlertTriangle,
  Zap,
  Thermometer,
  Wind,
  Droplets,
  Activity,
  Baby,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { QUICK_START_SCENARIOS, type QuickStartScenario } from '../../../shared/quickStartScenarios';

interface QuickStartPanelProps {
  weightKg?: number;
  onScenarioSelect?: (scenario: QuickStartScenario) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Heart,
  AlertTriangle,
  Zap,
  Thermometer,
  Wind,
  Droplets,
  Activity,
  Baby,
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  red: {
    bg: 'bg-red-900/30',
    border: 'border-red-500/50',
    text: 'text-red-400',
    hover: 'hover:bg-red-900/50',
  },
  orange: {
    bg: 'bg-orange-900/30',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    hover: 'hover:bg-orange-900/50',
  },
  purple: {
    bg: 'bg-purple-900/30',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    hover: 'hover:bg-purple-900/50',
  },
  yellow: {
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    hover: 'hover:bg-yellow-900/50',
  },
  blue: {
    bg: 'bg-blue-900/30',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    hover: 'hover:bg-blue-900/50',
  },
  cyan: {
    bg: 'bg-cyan-900/30',
    border: 'border-cyan-500/50',
    text: 'text-cyan-400',
    hover: 'hover:bg-cyan-900/50',
  },
  pink: {
    bg: 'bg-pink-900/30',
    border: 'border-pink-500/50',
    text: 'text-pink-400',
    hover: 'hover:bg-pink-900/50',
  },
};

export default function QuickStartPanel({ weightKg, onScenarioSelect }: QuickStartPanelProps) {
  const [, setLocation] = useLocation();

  const handleScenarioClick = (scenario: QuickStartScenario) => {
    if (onScenarioSelect) {
      onScenarioSelect(scenario);
    }
    setLocation(scenario.route);
  };

  const renderScenarioButton = (scenario: QuickStartScenario, size: 'large' | 'medium' | 'small') => {
    const Icon = ICON_MAP[scenario.icon] || Activity;
    const colors = COLOR_MAP[scenario.color] || COLOR_MAP.orange;

    if (size === 'large') {
      return (
        <Card
          key={scenario.id}
          className={`${colors.bg} ${colors.border} cursor-pointer transition-all ${colors.hover} active:scale-95`}
          onClick={() => handleScenarioClick(scenario)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-lg ${colors.bg} ${colors.border}`}>
                <Icon className={`h-8 w-8 ${colors.text}`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${colors.text}`}>{scenario.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{scenario.description}</p>
                {scenario.criticalTimeWindow && (
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span className="text-xs text-slate-500">{scenario.criticalTimeWindow}</span>
                  </div>
                )}
              </div>
              <ArrowRight className={`h-5 w-5 ${colors.text} mt-1`} />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (size === 'medium') {
      return (
        <Card
          key={scenario.id}
          className={`${colors.bg} ${colors.border} cursor-pointer transition-all ${colors.hover} active:scale-95 p-3`}
          onClick={() => handleScenarioClick(scenario)}
        >
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${colors.text}`} />
            <span className={`text-sm font-semibold ${colors.text}`}>{scenario.shortName}</span>
          </div>
          {scenario.criticalTimeWindow && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-slate-500" />
              <span className="text-xs text-slate-500">{scenario.criticalTimeWindow}</span>
            </div>
          )}
        </Card>
      );
    }

    // Small size - improved with better visibility
    return (
      <Card
        key={scenario.id}
        className={`${colors.bg} ${colors.border} cursor-pointer transition-all ${colors.hover} active:scale-95 p-2`}
        onClick={() => handleScenarioClick(scenario)}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${colors.text}`} />
          <span className={`text-xs font-medium ${colors.text}`}>{scenario.shortName}</span>
        </div>
      </Card>
    );
  };

  // Group scenarios by urgency
  const criticalScenarios = QUICK_START_SCENARIOS.filter((s) =>
    ['cardiac_arrest', 'anaphylaxis'].includes(s.id)
  );
  const urgentScenarios = QUICK_START_SCENARIOS.filter((s) =>
    ['respiratory_failure', 'status_epilepticus', 'septic_shock'].includes(s.id)
  );
  const otherScenarios = QUICK_START_SCENARIOS.filter((s) =>
    ['dka', 'trauma', 'neonatal'].includes(s.id)
  );

  return (
    <div className="space-y-4">
      {/* Critical - Immediate Life Threat */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="destructive" className="text-xs">CRITICAL</Badge>
          <span className="text-xs text-slate-500">Immediate life threat</span>
        </div>
        <div className="space-y-2">
          {criticalScenarios.map((scenario) => renderScenarioButton(scenario, 'large'))}
        </div>
      </div>

      {/* Urgent - Time-sensitive */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">URGENT</Badge>
          <span className="text-xs text-slate-500">Time-sensitive</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {urgentScenarios.map((scenario) => renderScenarioButton(scenario, 'medium'))}
        </div>
      </div>

      {/* Specialized Modules */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">SPECIALIZED</Badge>
          <span className="text-xs text-slate-500">Specific pathways</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {otherScenarios.map((scenario) => renderScenarioButton(scenario, 'small'))}
        </div>
      </div>

      {/* Quick Drug Reference */}
      {weightKg && weightKg > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Quick Reference ({weightKg} kg)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-slate-300">
              <span className="text-slate-500">Epi (arrest):</span>{' '}
              {Math.min(weightKg * 0.01, 1).toFixed(2)} mg
            </div>
            <div className="text-slate-300">
              <span className="text-slate-500">Epi (anaphy):</span>{' '}
              {Math.min(weightKg * 0.01, 0.5).toFixed(2)} mg IM
            </div>
            <div className="text-slate-300">
              <span className="text-slate-500">Fluid bolus:</span>{' '}
              {Math.round(weightKg * 20)} mL
            </div>
            <div className="text-slate-300">
              <span className="text-slate-500">Defib:</span>{' '}
              {Math.round(weightKg * 2)} J
            </div>
            <div className="text-slate-300">
              <span className="text-slate-500">Midazolam:</span>{' '}
              {Math.min(weightKg * 0.2, 10).toFixed(1)} mg
            </div>
            <div className="text-slate-300">
              <span className="text-slate-500">Amiodarone:</span>{' '}
              {Math.round(weightKg * 5)} mg
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
