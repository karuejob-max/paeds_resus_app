/**
 * GPS Demo - Minimal working prototype
 * Shows the TRUE GPS flow: 3 triage → 1 problem → 2-3 pathway → ACTION
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function GPSDemo() {
  const [, setLocation] = useLocation();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [action, setAction] = useState<string | null>(null);

  const questions = [
    // Q1: Breathing
    {
      q: "Is the patient breathing?",
      options: [
        { label: "YES", value: true, action: null },
        { label: "NO", value: false, action: "🚨 START BAG-VALVE-MASK VENTILATION NOW\n\nOpen airway. Apply mask. Squeeze bag to see chest rise. 1 breath every 3 seconds." }
      ]
    },
    // Q2: Pulse
    {
      q: "Can you feel a pulse?",
      options: [
        { label: "YES", value: true, action: null },
        { label: "NO", value: false, action: "🚨 START CPR IMMEDIATELY\n\n100-120 compressions/min. Depth 1/3 chest. 15:2 ratio with BVM. MINIMIZE INTERRUPTIONS." }
      ]
    },
    // Q3: Responsive
    {
      q: "Are they responsive?",
      options: [
        { label: "Alert", value: "alert", action: null },
        { label: "Responds to voice/pain", value: "responds", action: null },
        { label: "Unresponsive", value: "unresponsive", action: "🚨 PROTECT AIRWAY - UNRESPONSIVE\n\nRecovery position if breathing. Prepare for intubation. Call for help NOW." }
      ]
    },
    // Q4: Main problem
    {
      q: "What is the MAIN problem?",
      options: [
        { label: "🫁 Breathing difficulty", value: "breathing", action: null },
        { label: "💉 Shock / Poor perfusion", value: "shock", action: null },
        { label: "🧠 Seizure / Altered mental status", value: "seizure", action: null },
        { label: "🩸 Severe bleeding / Trauma", value: "trauma", action: null },
        { label: "☠️ Poisoning / Overdose", value: "poisoning", action: null },
        { label: "🐝 Allergic reaction", value: "allergic", action: null }
      ]
    },
    // Q5: Breathing pathway
    {
      q: "What breathing signs? (Select all)",
      condition: (ans: Record<number, any>) => ans[3] === "breathing",
      options: [
        { label: "Wheezing", value: "wheezing", action: "⚠️ BRONCHOSPASM - START BRONCHODILATORS\n\nGive salbutamol nebulizer NOW. Assess severity." },
        { label: "Stridor", value: "stridor", action: "🚨 STRIDOR - AIRWAY EMERGENCY\n\nKeep calm. Give O2. Consider croup/foreign body/anaphylaxis. Call airway help." },
        { label: "Grunting/retractions", value: "grunting", action: "🚨 RESPIRATORY FAILURE\n\nHigh-flow O2. Prepare for intubation." },
        { label: "Cyanosis", value: "cyanosis", action: "🚨 SEVERE HYPOXIA\n\n100% O2 via non-rebreather or BVM. Target SpO2 >94%." }
      ]
    },
    // Q5: Shock pathway
    {
      q: "What perfusion signs? (Select all)",
      condition: (ans: Record<number, any>) => ans[3] === "shock",
      options: [
        { label: "Weak/absent pulses", value: "weak_pulse", action: null },
        { label: "CRT >3 seconds", value: "delayed_crt", action: null },
        { label: "Cold hands/feet", value: "cold", action: null },
        { label: "Mottled skin", value: "mottled", action: "🚨 SHOCK - START FLUID RESUSCITATION\n\nIV/IO access NOW. Give 20 mL/kg bolus over 5-10 min. Reassess." }
      ]
    }
  ];

  const handleAnswer = (value: any, actionText: string | null) => {
    setAnswers({ ...answers, [currentQ]: value });
    
    if (actionText) {
      setAction(actionText);
    } else {
      // Move to next question
      const nextQ = currentQ + 1;
      if (nextQ < questions.length) {
        // Check if next question has condition
        const nextQuestion = questions[nextQ];
        if (nextQuestion.condition && !nextQuestion.condition({ ...answers, [currentQ]: value })) {
          // Skip to next
          setCurrentQ(nextQ + 1);
        } else {
          setCurrentQ(nextQ);
        }
      }
    }
  };

  const currentQuestion = questions[currentQ];
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-lg p-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">✅ Assessment Complete</h2>
          <p className="text-slate-300 mb-6">You've completed the GPS triage flow!</p>
          <Button onClick={() => setLocation('/')} className="bg-blue-600 hover:bg-blue-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (action) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border-4 border-red-500 rounded-lg p-8 max-w-2xl">
          <div className="text-6xl mb-4">🚨</div>
          <pre className="text-xl font-bold text-white whitespace-pre-wrap mb-6">{action}</pre>
          <div className="flex gap-4">
            <Button 
              onClick={() => setAction(null)} 
              className="bg-green-600 hover:bg-green-700 text-lg py-6 px-8"
            >
              ✓ Done - Continue Assessment
            </Button>
            <Button 
              onClick={() => setLocation('/')} 
              variant="outline"
              className="text-lg py-6 px-8"
            >
              Exit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <Button 
          onClick={() => setLocation('/')} 
          variant="ghost" 
          className="text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">Question {currentQ + 1} of {questions.length}</span>
            <span className="text-emerald-400 text-sm font-bold">GPS DEMO</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-lg p-8 mb-6">
          <h2 className="text-3xl font-bold text-white mb-8">{currentQuestion.q}</h2>
          
          <div className="space-y-4">
            {currentQuestion.options.map((opt, idx) => (
              <Button
                key={idx}
                onClick={() => handleAnswer(opt.value, opt.action || null)}
                className="w-full py-8 text-xl bg-slate-700 hover:bg-slate-600 text-white justify-start"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
          <p className="text-blue-200 text-sm">
            <strong>GPS Philosophy:</strong> Maximum 6 questions to life-saving intervention. 
            Current flow takes ~30 seconds vs 5+ minutes in traditional assessment.
          </p>
        </div>
      </div>
    </div>
  );
}
