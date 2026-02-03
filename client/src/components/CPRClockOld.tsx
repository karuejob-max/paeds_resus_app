import React, { useState, useEffect, useRef } from "react";
import { trpc } from "../lib/trpc";
import { AlertCircle, Play, Pause, StopCircle, Plus, Zap } from "lucide-react";

interface CPRClockProps {
  patientId: number;
  patientName: string;
  patientAge?: number;
  patientWeight?: number;
  onSessionEnd?: (sessionId: number) => void;
}

export function CPRClock({
  patientId,
  patientName,
  patientAge,
  patientWeight,
}: CPRClockProps) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStatus, setSessionStatus] = useState<
    "idle" | "active" | "completed"
  >("idle");
  const [outcome, setOutcome] = useState<"ROSC" | "pCOSCA" | "mortality" | null>(
    null
  );
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showDefibrillatorModal, setShowDefibrillatorModal] = useState(false);
  const [compressionRate, setCompressionRate] = useState(0);
  const [lastCompressionTime, setLastCompressionTime] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startSessionMutation = trpc.cprClock.startSession.useMutation();
  const endSessionMutation = trpc.cprClock.endSession.useMutation();
  const logEventMutation = trpc.cprClock.logEvent.useMutation();

  // Start CPR session
  const handleStartSession = async () => {
    try {
      const result = await startSessionMutation.mutateAsync({
        patientId,
        ageMonths: patientAge,
        weightKg: patientWeight,
      });

      setSessionId(result.sessionId);
      setSessionStatus("active");
      setIsRunning(true);
      setElapsedSeconds(0);
    } catch (error) {
      console.error("Failed to start CPR session:", error);
    }
  };

  // End CPR session
  const handleEndSession = async () => {
    if (!sessionId) return;

    try {
      await endSessionMutation.mutateAsync({
        sessionId,
        outcome: outcome || "ongoing",
      });

      setSessionStatus("completed");
      setIsRunning(false);
    } catch (error) {
      console.error("Failed to end CPR session:", error);
    }
  };

  // Log compression
  const handleCompression = async () => {
    if (!sessionId || !isRunning) return;

    const now = Date.now();
    if (lastCompressionTime > 0) {
      const timeSinceLastCompression = (now - lastCompressionTime) / 1000;
      const newRate = Math.round(60 / timeSinceLastCompression);
      setCompressionRate(newRate);
    }

    setLastCompressionTime(now);

    try {
      await logEventMutation.mutateAsync({
        sessionId,
        eventType: "compression_cycle",
        eventTime: elapsedSeconds,
        description: `Compression at ${compressionRate} bpm`,
      });

      // Play metronome sound
      playMetronomeSound();
    } catch (error) {
      console.error("Failed to log compression:", error);
    }
  };

  // Play metronome sound
  const playMetronomeSound = () => {
    if (!audioRef.current) {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  };

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Determine decision window (every 2 minutes)
  const decisionWindow = Math.floor(elapsedSeconds / 120);
  const timeInWindow = elapsedSeconds % 120;
  const timeUntilDecision = 120 - timeInWindow;

  // Color based on risk level
  const getRiskColor = () => {
    if (elapsedSeconds > 600) return "bg-red-900"; // > 10 min
    if (elapsedSeconds > 300) return "bg-red-700"; // > 5 min
    if (elapsedSeconds > 120) return "bg-orange-600"; // > 2 min
    return "bg-yellow-500";
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-4 border-red-500">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-red-700 mb-2">CPR CLOCK</h1>
        <div className="text-lg text-gray-700">
          <span className="font-semibold">{patientName}</span>
          {patientAge && <span className="ml-4">Age: {patientAge} months</span>}
          {patientWeight && <span className="ml-4">Weight: {patientWeight} kg</span>}
        </div>
      </div>

      {/* Main Timer Display */}
      <div className={`${getRiskColor()} rounded-xl p-8 mb-6 text-center transition-all`}>
        <div className="text-7xl font-bold text-white font-mono mb-2">
          {formatTime(elapsedSeconds)}
        </div>
        <div className="text-xl text-white opacity-90">
          Decision Window #{decisionWindow + 1} - {timeUntilDecision}s until next decision
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <div className="text-sm text-gray-600">Compression Rate</div>
          <div className="text-3xl font-bold text-red-600">{compressionRate}</div>
          <div className="text-xs text-gray-500">bpm</div>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <div className="text-sm text-gray-600">Session Status</div>
          <div className="text-lg font-bold text-blue-600 capitalize">
            {sessionStatus}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <div className="text-sm text-gray-600">Decision Window</div>
          <div className="text-3xl font-bold text-orange-600">#{decisionWindow + 1}</div>
        </div>
      </div>

      {/* Main Controls */}
      {sessionStatus === "idle" && (
        <button
          onClick={handleStartSession}
          disabled={startSessionMutation.isPending}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg text-lg flex items-center justify-center gap-2 mb-4"
        >
          <Play size={24} />
          START CPR SESSION
        </button>
      )}

      {sessionStatus === "active" && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`${
              isRunning
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2`}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? "PAUSE" : "RESUME"}
          </button>
          <button
            onClick={handleEndSession}
            disabled={endSessionMutation.isPending}
            className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <StopCircle size={20} />
            END SESSION
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {sessionStatus === "active" && isRunning && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={handleCompression}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            LOG COMPRESSION
          </button>
          <button
            onClick={() => setShowMedicationModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            MEDICATION
          </button>
          <button
            onClick={() => setShowDefibrillatorModal(true)}
            className="col-span-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <Zap size={20} />
            DEFIBRILLATOR
          </button>
        </div>
      )}

      {/* Outcome Selection */}
      {sessionStatus === "active" && (
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">Outcome</div>
          <div className="grid grid-cols-2 gap-2">
            {(["ROSC", "pCOSCA", "mortality"] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOutcome(o)}
                className={`py-2 px-3 rounded font-semibold text-sm ${
                  outcome === o
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {o === "ROSC"
                  ? "ROSC"
                  : o === "pCOSCA"
                    ? "pCOSCA"
                    : "Mortality"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alert Box */}
      {sessionStatus === "active" && timeUntilDecision < 30 && (
        <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <div className="font-bold text-red-700">Decision Point Approaching</div>
            <div className="text-sm text-red-600">
              {timeUntilDecision}s until next decision window. Review rhythm and
              consider medication/defibrillation.
            </div>
          </div>
        </div>
      )}

      {/* Session Completed */}
      {sessionStatus === "completed" && (
        <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4">
          <div className="font-bold text-green-700 mb-2">Session Completed</div>
          <div className="text-sm text-green-600">
            Total Duration: {formatTime(elapsedSeconds)}
            <br />
            Outcome: {outcome || "Not specified"}
          </div>
        </div>
      )}
    </div>
  );
}
