/**
 * CPR Simulation Mode
 * 
 * Training mode with randomized cardiac arrest scenarios:
 * - Scenario selection (VF, PEA, asystole with complications)
 * - Real-time hints and feedback
 * - Performance scoring
 * - Post-simulation debriefing
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  RotateCcw, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  X,
  Lightbulb
} from 'lucide-react';
import { CPRClockStreamlined } from './CPRClockStreamlined';
import { 
  generateRandomScenario, 
  getAllScenarios, 
  initializeSimulation,
  simulateRhythmChange,
  calculatePerformanceMetrics,
  getSimulationHint,
  type SimulationScenario,
  type SimulationState,
  type PerformanceMetrics
} from '@/lib/simulationEngine';

interface Props {
  onClose: () => void;
}

type SimulationPhase = 'scenario_selection' | 'active' | 'debriefing';

export function CPRSimulation({ onClose }: Props) {
  const [phase, setPhase] = useState<SimulationPhase>('scenario_selection');
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [showHints, setShowHints] = useState(true);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  // Update hint every 15 seconds during active simulation
  useEffect(() => {
    if (phase === 'active' && simulationState && showHints) {
      const interval = setInterval(() => {
        const hint = getSimulationHint(simulationState);
        setCurrentHint(hint);
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [phase, simulationState, showHints]);

  // Handle scenario selection
  const handleStartScenario = (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    const initialState = initializeSimulation(scenario);
    setSimulationState(initialState);
    setPhase('active');
  };

  // Handle random scenario
  const handleRandomScenario = () => {
    const scenario = generateRandomScenario();
    handleStartScenario(scenario);
  };

  // Handle simulation end
  const handleEndSimulation = () => {
    if (simulationState) {
      const metrics = calculatePerformanceMetrics(simulationState);
      setPerformanceMetrics(metrics);
      setPhase('debriefing');
    }
  };

  // Handle restart
  const handleRestart = () => {
    setPhase('scenario_selection');
    setSelectedScenario(null);
    setSimulationState(null);
    setCurrentHint(null);
    setPerformanceMetrics(null);
  };

  // Scenario Selection Phase
  if (phase === 'scenario_selection') {
    const scenarios = getAllScenarios();

    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <Card className="w-full max-w-4xl bg-slate-900 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  CPR Simulation Training
                </CardTitle>
                <p className="text-slate-400 mt-2">
                  Practice cardiac arrest management with realistic scenarios
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* Quick Start */}
            <div className="flex gap-4">
              <Button
                onClick={handleRandomScenario}
                className="flex-1 h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Random Scenario
              </Button>
            </div>

            {/* Scenario List */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Choose a Scenario</h3>
              {scenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  className="bg-slate-800 border-slate-700 hover:border-blue-500 cursor-pointer transition-all"
                  onClick={() => handleStartScenario(scenario)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-semibold">{scenario.name}</h4>
                          <Badge variant="outline" className={
                            scenario.initialRhythm === 'VF' || scenario.initialRhythm === 'pVT'
                              ? 'border-red-500 text-red-400'
                              : 'border-yellow-500 text-yellow-400'
                          }>
                            {scenario.initialRhythm}
                          </Badge>
                          {scenario.complications.length > 0 && (
                            <Badge variant="outline" className="border-orange-500 text-orange-400">
                              {scenario.complications.length} complication{scenario.complications.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{scenario.backstory}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Age: {Math.floor(scenario.ageMonths / 12)}y {scenario.ageMonths % 12}m</span>
                          <span>Weight: {scenario.weight}kg</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    </div>

                    {/* Learning Objectives */}
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Learning Objectives:</p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        {scenario.learningObjectives.map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active Simulation Phase
  if (phase === 'active' && selectedScenario && simulationState) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Simulation Banner */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 p-3 z-50">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                🎓 SIMULATION MODE
              </Badge>
              <span className="text-white font-semibold">{selectedScenario.name}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHints(!showHints)}
                className="text-white hover:bg-white/20"
              >
                <Lightbulb className={`w-4 h-4 mr-1 ${showHints ? 'fill-yellow-300' : ''}`} />
                {showHints ? 'Hide' : 'Show'} Hints
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEndSimulation}
                className="text-white hover:bg-white/20"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                End & Review
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRestart}
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restart
              </Button>
            </div>
          </div>
        </div>

        {/* Hint Display */}
        {showHints && currentHint && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4">
            <Card className="bg-yellow-500/90 border-yellow-600 backdrop-blur">
              <CardContent className="p-3 flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-900 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-900 font-medium">{currentHint}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CPR Clock (offset by banner) */}
        <div className="pt-16 h-full">
          <CPRClockStreamlined
            patientWeight={selectedScenario.weight}
            patientAgeMonths={selectedScenario.ageMonths}
            onClose={handleEndSimulation}
          />
        </div>
      </div>
    );
  }

  // Debriefing Phase
  if (phase === 'debriefing' && performanceMetrics && selectedScenario) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <Card className="w-full max-w-4xl bg-slate-900 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Simulation Debriefing
                </CardTitle>
                <p className="text-slate-400 mt-2">{selectedScenario.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">{performanceMetrics.overallScore}</div>
                  <div className="text-sm text-white/80">/ 100</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white">
                {performanceMetrics.overallScore >= 90 ? '🎉 Excellent Performance!' :
                 performanceMetrics.overallScore >= 75 ? '✅ Good Performance' :
                 performanceMetrics.overallScore >= 60 ? '⚠️ Needs Improvement' :
                 '❌ Poor Performance'}
              </h3>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white">{performanceMetrics.timeToFirstCompression}s</div>
                  <div className="text-xs text-slate-400 mt-1">Time to CPR</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white">{performanceMetrics.timeToFirstShock}s</div>
                  <div className="text-xs text-slate-400 mt-1">Time to Shock</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white">{performanceMetrics.compressionFraction}%</div>
                  <div className="text-xs text-slate-400 mt-1">CCF</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white">{performanceMetrics.guidelineAdherence}%</div>
                  <div className="text-xs text-slate-400 mt-1">Guideline Adherence</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Performance Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Shocks Delivered:</span>
                  <span className="text-white font-semibold">{performanceMetrics.shocksDelivered}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Epinephrine Doses:</span>
                  <span className="text-white font-semibold">{performanceMetrics.epiDosesGiven}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Time to First Epinephrine:</span>
                  <span className="text-white font-semibold">{Math.floor(performanceMetrics.timeToFirstEpinephrine / 60)} min {performanceMetrics.timeToFirstEpinephrine % 60} sec</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Complications Identified:</span>
                  <span className="text-white font-semibold">{performanceMetrics.complicationsIdentified} / {selectedScenario.complications.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Feedback & Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {performanceMetrics.feedback.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {item.startsWith('✅') ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : item.startsWith('⚠️') ? (
                      <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-slate-300">{item.replace(/^[✅⚠️❌🎉]\s*/, '')}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Learning Objectives Review */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Learning Objectives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedScenario.learningObjectives.map((obj, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{obj}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleRestart}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Another Scenario
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Exit Simulation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
