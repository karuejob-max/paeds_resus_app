import React, { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PracticeLabDebrief } from "./PracticeLabDebrief";
import type { PracticeLabProgramType } from "@shared/practice-lab-types";
import {
  Sparkles,
  Play,
  ArrowRight,
  Heart,
  Activity,
  Send,
  Zap,
  CheckCircle2,
  RefreshCw,
  Award,
} from "lucide-react";

interface Vitals {
  heartRate: number;
  respiratoryRate: number;
  bloodPressure: string;
  spo2: number;
  temperature: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Scenario {
  id: string;
  name: string;
  programType: PracticeLabProgramType;
  description: string;
  initialVitals: Vitals;
}

const AI_SCENARIOS: Scenario[] = [
  {
    id: "septic_shock_infant",
    name: "Septic Shock (Infant)",
    programType: "pals",
    description: "An 18-month-old infant presenting with high fever, lethargy, cold extremities, and weak central pulses. Establish access and initiate fluids.",
    initialVitals: { heartRate: 175, respiratoryRate: 48, bloodPressure: "68/42", spo2: 91, temperature: 39.4 },
  },
  {
    id: "severe_asthma_child",
    name: "Severe Asthma (Child)",
    programType: "pals",
    description: "A 6-year-old child with severe respiratory distress, accessory muscle use, and poor air entry. SpO2 is dropping. Initiate escalation.",
    initialVitals: { heartRate: 140, respiratoryRate: 38, bloodPressure: "105/65", spo2: 88, temperature: 37.0 },
  },
  {
    id: "anaphylaxis_adult",
    name: "Anaphylactic Shock (Adult)",
    programType: "acls",
    description: "A 25-year-old adult presenting with lip swelling, severe wheezing, and hypotension post peanut exposure. Secure airway and manage shock.",
    initialVitals: { heartRate: 130, respiratoryRate: 28, bloodPressure: "80/50", spo2: 89, temperature: 36.8 },
  },
  {
    id: "floppy_newborn",
    name: "Floppy Newborn (Meconium)",
    programType: "nrp",
    description: "Term newborn delivered through meconium-stained fluid. Floppy, apneic, and bradycardic. Start immediate NRP resuscitation.",
    initialVitals: { heartRate: 55, respiratoryRate: 0, bloodPressure: "40/25", spo2: 60, temperature: 36.5 },
  },
  {
    id: "choking_infant",
    name: "Choking Infant",
    programType: "bls",
    description: "A 9-month-old infant has suddenly stopped crying or breathing after playing with small toys. Perform foreign-body obstruction protocol.",
    initialVitals: { heartRate: 110, respiratoryRate: 0, bloodPressure: "70/45", spo2: 78, temperature: 37.0 },
  }
];

type Props = {
  programType: PracticeLabProgramType;
  enrollmentId: number;
  onBookSession: () => void;
};

export function AiRoleplayTrack({ programType, enrollmentId, onBookSession }: Props) {
  const filteredScenarios = useMemo(
    () => AI_SCENARIOS.filter((s) => s.programType === programType),
    [programType]
  );

  const [phase, setPhase] = useState<"list" | "active" | "debrief">("list");
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    passed: boolean;
    debrief: string;
    events: any[];
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = trpc.practiceLab.sendAiRoleplayMessage.useMutation();
  const evaluateMutation = trpc.practiceLab.evaluateAiRoleplaySession.useMutation();
  const recordAttemptMutation = trpc.practiceLab.recordAttempt.useMutation();

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const startSimulation = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setVitals(scenario.initialVitals);
    setChatHistory([
      {
        role: "assistant",
        content: `Hi Doctor, I am your nurse assistant today. We have a case: ${scenario.name}. ${scenario.description} What are your initial orders?`,
      },
    ]);
    setStartTime(Date.now());
    setPhase("active");
    setEvaluationResult(null);
  };

  const handleSend = async () => {
    if (!inputMsg.trim() || !activeScenario || !vitals) return;

    const userText = inputMsg.trim();
    setInputMsg("");
    setIsSending(true);

    const newUserMsg: ChatMessage = { role: "user", content: userText };
    const updatedHistory = [...chatHistory, newUserMsg];
    setChatHistory(updatedHistory);

    try {
      const resp = await sendMessageMutation.mutateAsync({
        scenarioName: activeScenario.name,
        scenarioDescription: activeScenario.description,
        vitals,
        chatHistory: updatedHistory,
        userMessage: userText,
      });

      if (resp.success) {
        setVitals(resp.vitals);
        setChatHistory((prev) => [...prev, { role: "assistant", content: resp.dialog }]);
      } else {
        toast.error("Failed to communicate with simulation helper.");
      }
    } catch (err) {
      toast.error("Error communicating with AI Nurse assistant.");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const declareComplete = async () => {
    if (!activeScenario || chatHistory.length < 2) return;
    setIsEvaluating(true);

    try {
      const resp = await evaluateMutation.mutateAsync({
        scenarioName: activeScenario.name,
        scenarioDescription: activeScenario.description,
        chatHistory,
      });

      if (resp.success) {
        setEvaluationResult({
          score: resp.score,
          passed: resp.passed,
          debrief: resp.debrief,
          events: resp.events,
        });
        setPhase("debrief");

        // Record the attempt on the server
        await recordAttemptMutation.mutateAsync({
          enrollmentId,
          programType,
          trackId: "ai_interactive_roleplay",
          scenarioId: activeScenario.id,
          score: resp.score,
          passed: resp.passed,
          eventLog: resp.events.map((e: any) => ({
            timestamp: e.timestamp || 0,
            type: e.type || "action",
            description: e.description || "",
            correct: e.correct ?? true,
          })),
          durationSeconds: Math.floor((Date.now() - startTime) / 1000),
        });
        toast.success("Simulation attempt recorded!");
      } else {
        toast.error("Failed to evaluate roleplay session.");
      }
    } catch (err) {
      toast.error("Error evaluating roleplay session.");
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getVitalsColor = (type: keyof Vitals, val: any) => {
    if (type === "heartRate") {
      const hr = Number(val);
      if (hr > 150 || hr < 60) return "text-red-500 animate-pulse";
      return "text-emerald-500";
    }
    if (type === "spo2") {
      const ox = Number(val);
      if (ox < 92) return "text-red-500 animate-pulse";
      return "text-emerald-500";
    }
    return "text-slate-700 dark:text-slate-350";
  };

  if (phase === "debrief" && activeScenario && evaluationResult) {
    return (
      <PracticeLabDebrief
        trackName="Paeds Resus Simulation Lab"
        scenarioName={activeScenario.name}
        score={evaluationResult.score}
        passed={evaluationResult.passed}
        events={evaluationResult.events}
        onRetry={() => startSimulation(activeScenario)}
        onBack={() => setPhase("list")}
        onBookSession={onBookSession}
      />
    );
  }

  if (phase === "active" && activeScenario && vitals) {
    return (
      <div className="space-y-6">
        {/* Vitals Monitor HUD */}
        <Card className="border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 shadow-lg rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-900 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold tracking-wider uppercase text-indigo-400 flex items-center gap-1.5">
                <Activity size={14} className="animate-pulse" />
                Resus Room Vitals Monitor
              </CardTitle>
              <CardDescription className="text-slate-400 text-[10px] uppercase">
                Patient: 18-month Infant • {activeScenario.name}
              </CardDescription>
            </div>
            <Badge className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
              Live Feed
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 text-center">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Heart Rate</span>
              <span className={`text-2xl font-black flex items-center justify-center gap-1 ${getVitalsColor("heartRate", vitals.heartRate)}`}>
                <Heart size={16} fill="currentColor" className="animate-pulse" />
                {vitals.heartRate} <span className="text-[10px] text-slate-400 font-normal">bpm</span>
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Resp Rate</span>
              <span className="text-2xl font-black text-slate-200">
                {vitals.respiratoryRate} <span className="text-[10px] text-slate-400 font-normal">/min</span>
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Blood Pres</span>
              <span className="text-2xl font-black text-slate-200">
                {vitals.bloodPressure} <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">SpO2</span>
              <span className={`text-2xl font-black ${getVitalsColor("spo2", vitals.spo2)}`}>
                {vitals.spo2}%
              </span>
            </div>
            <div className="space-y-1 col-span-2 md:col-span-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Temp</span>
              <span className="text-2xl font-black text-slate-200">
                {vitals.temperature}°C
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Chat Arena */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm h-[400px] flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-650" />
              Nurse Assistant & Team Communication Log
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-none"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-800"
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider block mb-1 opacity-70">
                    {msg.role === "user" ? "Clinician (You)" : "Nurse Assistant"}
                  </span>
                  {msg.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl rounded-tl-none border border-slate-150 text-xs text-slate-400">
                  Nurse is executing orders...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </CardContent>

          {/* Action inputs */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type orders or check pulse... (e.g. 'Give epinephrine 0.01mg/kg IV')"
              disabled={isSending || isEvaluating}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <Button
              onClick={handleSend}
              disabled={isSending || isEvaluating || !inputMsg.trim()}
              size="icon"
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
            >
              <Send size={14} />
            </Button>
          </div>
        </Card>

        {/* Declaration Panel */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm">Resuscitation declared complete?</p>
              <p className="text-xs text-slate-500">
                AI auditor will analyze the clinical log, compliance time gates, and assign your final lab attempt score.
              </p>
            </div>
            <Button
              onClick={declareComplete}
              disabled={isSending || isEvaluating}
              className="bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-semibold rounded-xl py-2 px-4 shrink-0 flex items-center gap-1.5 transition active:scale-[0.98]"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Compiling Debrief...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Declare Resuscitation Complete
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {filteredScenarios.length === 0 ? (
          <div className="text-center py-12 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 text-xs bg-white/60">
            <Zap className="mx-auto mb-2 text-slate-400" size={28} />
            No interactive AI scenarios available for this track program yet.
          </div>
        ) : (
          filteredScenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                    Interactive Actor Roleplay
                  </Badge>
                  <Badge variant="outline" className="text-[9px] uppercase">
                    v1.0 • PALS guidelines
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold mt-2 text-slate-850 dark:text-slate-100">
                  {scenario.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-4">
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                  {scenario.description}
                </p>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Award size={12} className="text-yellow-500" />
                    <span>Eligible for Spaced Repetition Boosters</span>
                  </div>
                  <Button
                    onClick={() => startSimulation(scenario)}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 transition active:scale-[0.98]"
                  >
                    Start AI Roleplay <ArrowRight size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
