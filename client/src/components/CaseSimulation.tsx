import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SIMULATION_CASES,
  getSimulationById,
  getSimulationsByCategory,
  getSimulationsByDifficulty,
  calculateScore,
  getSimulationCategories,
  type SimulationCase,
  type SimulationResult,
  type SimulationCategory,
  type SimulationDifficulty,
  type SimulationEvent,
} from '../../../shared/caseSimulation';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trophy,
  Target,
  Heart,
  Activity,
  Syringe,
  Wind,
  Brain,
  Shield,
  Baby,
  Flame,
  ChevronRight,
  Volume2,
} from 'lucide-react';

interface CaseSimulationProps {
  onComplete?: (result: SimulationResult) => void;
  language?: 'en' | 'sw' | 'fr' | 'ar';
}

const categoryIcons: Record<SimulationCategory, React.ReactNode> = {
  cardiac_arrest: <Heart className="h-5 w-5" />,
  respiratory_failure: <Wind className="h-5 w-5" />,
  anaphylaxis: <AlertTriangle className="h-5 w-5" />,
  septic_shock: <Activity className="h-5 w-5" />,
  status_epilepticus: <Brain className="h-5 w-5" />,
  trauma: <Shield className="h-5 w-5" />,
  neonatal: <Baby className="h-5 w-5" />,
  dka: <Flame className="h-5 w-5" />,
};

const difficultyColors: Record<SimulationDifficulty, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  expert: 'bg-red-500/20 text-red-400 border-red-500/30',
};

type SimulationPhase = 'selection' | 'briefing' | 'active' | 'debriefing';

export function CaseSimulation({ onComplete, language = 'en' }: CaseSimulationProps) {
  const [phase, setPhase] = useState<SimulationPhase>('selection');
  const [selectedCase, setSelectedCase] = useState<SimulationCase | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [actionsPerformed, setActionsPerformed] = useState<{ actionId: string; timestamp: Date }[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [filterCategory, setFilterCategory] = useState<SimulationCategory | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<SimulationDifficulty | 'all'>('all');
  
  const startTimeRef = useRef<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const categories = getSimulationCategories();

  // Filter cases
  const filteredCases = SIMULATION_CASES.filter(c => {
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    if (filterDifficulty !== 'all' && c.difficulty !== filterDifficulty) return false;
    return true;
  });

  // Timer effect
  useEffect(() => {
    if (phase === 'active' && !isPaused && selectedCase) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          // Check for events
          const nextEvent = selectedCase.events[currentEventIndex];
          if (nextEvent && newTime >= nextEvent.timeOffset) {
            setCurrentEventIndex(prev => prev + 1);
          }
          // Check for simulation end
          if (newTime >= selectedCase.durationMinutes * 60) {
            endSimulation();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, isPaused, selectedCase, currentEventIndex]);

  const startSimulation = (caseData: SimulationCase) => {
    setSelectedCase(caseData);
    setPhase('briefing');
  };

  const beginActivePhase = () => {
    startTimeRef.current = new Date();
    setElapsedTime(0);
    setCurrentEventIndex(0);
    setActionsPerformed([]);
    setPhase('active');
  };

  const performAction = (actionId: string) => {
    setActionsPerformed(prev => [
      ...prev,
      { actionId, timestamp: new Date() }
    ]);
  };

  const endSimulation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (selectedCase && startTimeRef.current) {
      const simResult = calculateScore(selectedCase, actionsPerformed, startTimeRef.current);
      setResult(simResult);
      setPhase('debriefing');
      onComplete?.(simResult);
    }
  };

  const resetSimulation = () => {
    setPhase('selection');
    setSelectedCase(null);
    setElapsedTime(0);
    setCurrentEventIndex(0);
    setActionsPerformed([]);
    setResult(null);
    setIsPaused(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLocalizedContent = (caseData: SimulationCase) => {
    if (language === 'en') {
      return { title: caseData.title, description: caseData.description };
    }
    const translation = caseData.translations[language as 'sw' | 'fr' | 'ar'];
    if (translation) {
      return { title: translation.title, description: translation.description };
    }
    return { title: caseData.title, description: caseData.description };
  };

  // Render case selection
  if (phase === 'selection') {
    return (
      <div className="flex flex-col h-full bg-slate-900 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="h-7 w-7 text-orange-500" />
            Case Simulation Mode
          </h2>
          <p className="text-slate-400 mt-2">
            Practice emergency scenarios to build muscle memory and confidence
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('all')}
                className="text-sm"
              >
                All
              </Button>
              {categories.map(({ category, label }) => (
                <Button
                  key={category}
                  variant={filterCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory(category)}
                  className="text-sm gap-1"
                >
                  {categoryIcons[category]}
                  {label}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Difficulty</label>
            <div className="flex gap-2">
              <Button
                variant={filterDifficulty === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDifficulty('all')}
              >
                All
              </Button>
              {(['beginner', 'intermediate', 'advanced', 'expert'] as SimulationDifficulty[]).map(diff => (
                <Button
                  key={diff}
                  variant={filterDifficulty === diff ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterDifficulty(diff)}
                  className={filterDifficulty === diff ? '' : difficultyColors[diff]}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Case Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.map(caseData => {
              const content = getLocalizedContent(caseData);
              return (
                <Card
                  key={caseData.id}
                  className="bg-slate-800 border-slate-700 hover:border-teal-500/50 transition-colors cursor-pointer"
                  onClick={() => startSimulation(caseData)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-teal-500">
                        {categoryIcons[caseData.category]}
                      </div>
                      <Badge className={difficultyColors[caseData.difficulty]}>
                        {caseData.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-white mt-2">
                      {content.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                      {content.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {caseData.durationMinutes} min
                      </span>
                      <span className="text-slate-500">
                        Pass: {caseData.passingScore}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Render briefing
  if (phase === 'briefing' && selectedCase) {
    const content = getLocalizedContent(selectedCase);
    return (
      <div className="flex flex-col h-full bg-slate-900 p-6">
        <Button
          variant="ghost"
          onClick={resetSimulation}
          className="self-start mb-4 text-slate-400"
        >
          ← Back to cases
        </Button>

        <Card className="bg-slate-800 border-slate-700 max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              {categoryIcons[selectedCase.category]}
              <Badge className={difficultyColors[selectedCase.difficulty]}>
                {selectedCase.difficulty}
              </Badge>
            </div>
            <CardTitle className="text-2xl text-white">{content.title}</CardTitle>
            <CardDescription className="text-base">{content.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Patient Profile */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Patient Profile</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Age:</span>
                  <span className="text-white ml-2">
                    {selectedCase.patientProfile.age.years} years
                    {selectedCase.patientProfile.age.months > 0 && ` ${selectedCase.patientProfile.age.months} months`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Weight:</span>
                  <span className="text-white ml-2">{selectedCase.patientProfile.weight} kg</span>
                </div>
                <div>
                  <span className="text-slate-400">Gender:</span>
                  <span className="text-white ml-2">{selectedCase.patientProfile.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400">Chief Complaint:</span>
                  <span className="text-white ml-2">{selectedCase.patientProfile.chiefComplaint}</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-slate-400">History:</span>
                <p className="text-white mt-1">{selectedCase.patientProfile.history}</p>
              </div>
              {selectedCase.patientProfile.allergies.length > 0 && (
                <div className="mt-3">
                  <span className="text-slate-400">Allergies:</span>
                  <span className="text-red-400 ml-2">
                    {selectedCase.patientProfile.allergies.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Initial Vitals */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Initial Vital Signs</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Heart Rate</div>
                  <div className="text-lg font-bold text-white">
                    {selectedCase.initialVitals.heartRate} bpm
                  </div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Resp Rate</div>
                  <div className="text-lg font-bold text-white">
                    {selectedCase.initialVitals.respiratoryRate}/min
                  </div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">SpO2</div>
                  <div className="text-lg font-bold text-white">
                    {selectedCase.initialVitals.oxygenSaturation}%
                  </div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Consciousness</div>
                  <div className="text-lg font-bold text-white capitalize">
                    {selectedCase.initialVitals.consciousness}
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Learning Objectives</h3>
              <ul className="space-y-2">
                {selectedCase.learningObjectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300">
                    <Target className="h-4 w-4 text-teal-500 mt-1 flex-shrink-0" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>

            {/* Start Button */}
            <div className="pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Duration: {selectedCase.durationMinutes} minutes | Pass: {selectedCase.passingScore}%
                </div>
                <Button
                  size="lg"
                  onClick={beginActivePhase}
                  className="bg-teal-600 hover:bg-teal-700 gap-2"
                >
                  <Play className="h-5 w-5" />
                  Start Simulation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render active simulation
  if (phase === 'active' && selectedCase) {
    const currentEvent = selectedCase.events[currentEventIndex - 1];
    const progress = (elapsedTime / (selectedCase.durationMinutes * 60)) * 100;

    return (
      <div className="flex flex-col h-full bg-slate-900">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{selectedCase.title}</h2>
              <p className="text-sm text-slate-400">
                Patient: {selectedCase.patientProfile.age.years}y, {selectedCase.patientProfile.weight}kg
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-orange-500">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-xs text-slate-400">Elapsed</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={endSimulation}
              >
                End Simulation
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-3 h-2" />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Current Event */}
          <div className="flex-1 p-6 overflow-auto">
            {currentEvent && (
              <Card className={`mb-6 ${
                currentEvent.type === 'critical' 
                  ? 'bg-red-900/30 border-red-500' 
                  : 'bg-slate-800 border-slate-700'
              }`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {currentEvent.type === 'critical' && (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <Badge variant={currentEvent.type === 'critical' ? 'destructive' : 'secondary'}>
                      {currentEvent.type.toUpperCase()}
                    </Badge>
                  </div>
                  <CardTitle className="text-white">{currentEvent.description}</CardTitle>
                </CardHeader>
                {currentEvent.expectedAction && (
                  <CardContent>
                    <p className="text-sm text-slate-400">
                      Expected action: {currentEvent.expectedAction}
                    </p>
                    {currentEvent.criticalWindow && (
                      <p className="text-sm text-yellow-400 mt-2">
                        ⏱ Critical window: {currentEvent.criticalWindow} seconds
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Available Actions</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedCase.correctActions.map(action => {
                  const isPerformed = actionsPerformed.some(a => a.actionId === action.id);
                  return (
                    <Button
                      key={action.id}
                      variant={isPerformed ? 'secondary' : 'outline'}
                      className={`h-auto py-3 justify-start ${isPerformed ? 'opacity-50' : ''}`}
                      onClick={() => !isPerformed && performAction(action.id)}
                      disabled={isPerformed}
                    >
                      <div className="text-left">
                        <div className="font-medium">{action.name}</div>
                        <div className="text-xs text-slate-400 capitalize">{action.category}</div>
                      </div>
                      {isPerformed && <CheckCircle className="h-4 w-4 ml-auto text-green-500" />}
                    </Button>
                  );
                })}
              </div>

              {/* Incorrect actions (hidden but available) */}
              <div className="mt-6">
                <h4 className="text-sm text-slate-500 mb-2">Other Actions</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedCase.incorrectActions.map(action => {
                    const isPerformed = actionsPerformed.some(a => a.actionId === action.id);
                    return (
                      <Button
                        key={action.id}
                        variant="ghost"
                        size="sm"
                        className={`justify-start text-slate-400 ${isPerformed ? 'opacity-50' : ''}`}
                        onClick={() => !isPerformed && performAction(action.id)}
                        disabled={isPerformed}
                      >
                        {action.name}
                        {isPerformed && <XCircle className="h-4 w-4 ml-auto text-red-500" />}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Actions Log */}
          <div className="w-80 bg-slate-800 border-l border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Actions Performed</h3>
            <ScrollArea className="h-[calc(100vh-300px)]">
              {actionsPerformed.length === 0 ? (
                <p className="text-sm text-slate-500">No actions yet</p>
              ) : (
                <div className="space-y-2">
                  {actionsPerformed.map((action, i) => {
                    const actionData = [...selectedCase.correctActions, ...selectedCase.incorrectActions]
                      .find(a => a.id === action.actionId);
                    return (
                      <div
                        key={i}
                        className={`p-2 rounded text-sm ${
                          actionData?.isCorrect 
                            ? 'bg-green-900/20 text-green-400' 
                            : 'bg-red-900/20 text-red-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {actionData?.isCorrect ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {actionData?.name}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {formatTime(Math.floor((action.timestamp.getTime() - (startTimeRef.current?.getTime() || 0)) / 1000))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  }

  // Render debriefing
  if (phase === 'debriefing' && selectedCase && result) {
    return (
      <div className="flex flex-col h-full bg-slate-900 p-6 overflow-auto">
        <Card className="bg-slate-800 border-slate-700 max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {result.passed ? (
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-green-500" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
              )}
            </div>
            <CardTitle className={`text-3xl ${result.passed ? 'text-green-500' : 'text-red-500'}`}>
              {result.passed ? 'PASSED' : 'FAILED'}
            </CardTitle>
            <CardDescription className="text-lg">
              Score: {result.percentageScore.toFixed(0)}% ({result.totalScore}/{result.maxScore} points)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {result.actionsPerformed.filter(a => a.pointsEarned > 0).length}
                </div>
                <div className="text-sm text-slate-400">Correct Actions</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">{result.missedActions.length}</div>
                <div className="text-sm text-slate-400">Missed Actions</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-white">{result.criticalErrors.length}</div>
                <div className="text-sm text-slate-400">Critical Errors</div>
              </div>
            </div>

            {/* Feedback */}
            {result.actionsPerformed.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Action Feedback</h3>
                <div className="space-y-2">
                  {result.actionsPerformed.map((action, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg ${
                        action.pointsEarned > 0 
                          ? 'bg-green-900/20 border border-green-500/30' 
                          : 'bg-red-900/20 border border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={action.pointsEarned > 0 ? 'text-green-400' : 'text-red-400'}>
                          {action.pointsEarned > 0 ? '+' : ''}{action.pointsEarned} points
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mt-1">{action.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missed Actions */}
            {result.missedActions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Missed Actions</h3>
                <ul className="space-y-1">
                  {result.missedActions.map((action, i) => (
                    <li key={i} className="flex items-center gap-2 text-yellow-400">
                      <AlertTriangle className="h-4 w-4" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Debriefing Points */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Key Learning Points</h3>
              <ul className="space-y-2">
                {selectedCase.debriefingPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle className="h-4 w-4 text-teal-500 mt-1 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={resetSimulation}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={resetSimulation}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                Choose Another Case
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default CaseSimulation;
