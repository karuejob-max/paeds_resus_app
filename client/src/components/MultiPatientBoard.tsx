/**
 * MultiPatientBoard.tsx
 *
 * Phase 7.3 — ResusGPS Multi-Patient Mode (Mass Casualty)
 *
 * Allows a provider to track up to 8 simultaneous patients during a mass
 * casualty incident (MCI). Each patient has:
 *   - Triage category (T1 Immediate / T2 Delayed / T3 Minor / T4 Expectant)
 *   - Weight + age
 *   - Current ABCDE phase
 *   - Active threats summary
 *   - Elapsed time
 *   - Quick-jump to open that patient's full ResusGPS session
 *
 * Design principles:
 *   - One-tap to add a new patient
 *   - Color-coded triage (T1=red, T2=yellow, T3=green, T4=black)
 *   - Elapsed time per patient (wall-clock anchored, drift-proof)
 *   - Compact cards — all patients visible on one screen
 *   - "Focus" button opens the full ResusGPS session for that patient
 *   - Persisted to localStorage for offline resilience
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Users,
  Plus,
  Timer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Trash2,
  ExternalLink,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TriageCategory = 'T1' | 'T2' | 'T3' | 'T4';

export interface MCIPatient {
  id: string;
  label: string;           // e.g. "Patient 1", "Bay 3", "Pt A"
  triageCategory: TriageCategory;
  weight: number;
  ageYears: number;
  startedAt: number;       // Date.now() when added
  currentPhase: string;    // e.g. "A - Airway", "C - Circulation"
  activeThreats: string[]; // short threat labels
  status: 'active' | 'stabilised' | 'transferred' | 'deceased';
  notes: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRIAGE_CONFIG: Record<TriageCategory, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  description: string;
}> = {
  T1: {
    label: 'T1 — Immediate',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-400',
    icon: <Zap className="h-4 w-4 text-red-600" />,
    description: 'Life-threatening — treat immediately',
  },
  T2: {
    label: 'T2 — Delayed',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    icon: <Timer className="h-4 w-4 text-yellow-600" />,
    description: 'Serious — can wait 30–60 min',
  },
  T3: {
    label: 'T3 — Minor',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-400',
    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    description: 'Minor injuries — walking wounded',
  },
  T4: {
    label: 'T4 — Expectant',
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    icon: <XCircle className="h-4 w-4 text-gray-600" />,
    description: 'Unsurvivable — comfort care only',
  },
};

const ABCDE_PHASES = [
  'A — Airway',
  'B — Breathing',
  'C — Circulation',
  'D — Disability',
  'E — Exposure',
  'Stabilised',
  'Awaiting transfer',
];

const STORAGE_KEY = 'mci_patients_v1';
const MAX_PATIENTS = 8;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function generateId(): string {
  return `pt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface MultiPatientBoardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFocusPatient?: (patient: MCIPatient) => void;
}

export function MultiPatientBoard({ open, onOpenChange, onFocusPatient }: MultiPatientBoardProps) {
  const [patients, setPatients] = useState<MCIPatient[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [now, setNow] = useState(Date.now());
  const rafRef = useRef<number>(0);
  const startRef = useRef(Date.now());

  // Wall-clock timer — updates every second
  useEffect(() => {
    startRef.current = Date.now() - (now - Date.now());
    function tick() {
      setNow(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } catch {
      // storage full — silently continue
    }
  }, [patients]);

  // ── Add patient ──────────────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newTriage, setNewTriage] = useState<TriageCategory>('T1');
  const [newWeight, setNewWeight] = useState('');
  const [newAge, setNewAge] = useState('');

  function addPatient() {
    if (patients.length >= MAX_PATIENTS) return;
    const patient: MCIPatient = {
      id: generateId(),
      label: newLabel.trim() || `Patient ${patients.length + 1}`,
      triageCategory: newTriage,
      weight: parseFloat(newWeight) || 10,
      ageYears: parseFloat(newAge) || 2,
      startedAt: Date.now(),
      currentPhase: 'A — Airway',
      activeThreats: [],
      status: 'active',
      notes: '',
    };
    setPatients(prev => [...prev, patient]);
    setNewLabel('');
    setNewWeight('');
    setNewAge('');
    setNewTriage('T1');
    setShowAddForm(false);
  }

  function removePatient(id: string) {
    setPatients(prev => prev.filter(p => p.id !== id));
  }

  function updatePatient(id: string, updates: Partial<MCIPatient>) {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  // Sort: T1 first, then T2, T3, T4; within each triage by startedAt
  const sortedPatients = [...patients].sort((a, b) => {
    const order = { T1: 0, T2: 1, T3: 2, T4: 3 };
    if (order[a.triageCategory] !== order[b.triageCategory]) {
      return order[a.triageCategory] - order[b.triageCategory];
    }
    return a.startedAt - b.startedAt;
  });

  const t1Count = patients.filter(p => p.triageCategory === 'T1' && p.status === 'active').length;
  const t2Count = patients.filter(p => p.triageCategory === 'T2' && p.status === 'active').length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Multi-Patient Board
              <Badge variant="outline" className="text-xs ml-1">
                {patients.length}/{MAX_PATIENTS}
              </Badge>
            </SheetTitle>
            <div className="flex items-center gap-2">
              {t1Count > 0 && (
                <Badge className="bg-red-600 text-white text-xs">
                  {t1Count} T1
                </Badge>
              )}
              {t2Count > 0 && (
                <Badge className="bg-yellow-500 text-white text-xs">
                  {t2Count} T2
                </Badge>
              )}
            </div>
          </div>
          <SheetDescription className="text-xs">
            Mass casualty incident tracker — up to {MAX_PATIENTS} patients. Sorted by triage priority.
          </SheetDescription>
        </SheetHeader>

        {/* Patient list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {sortedPatients.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No patients added yet</p>
              <p className="text-xs mt-1">Tap "Add Patient" to begin tracking</p>
            </div>
          )}

          {sortedPatients.map(patient => {
            const triage = TRIAGE_CONFIG[patient.triageCategory];
            const elapsed = now - patient.startedAt;
            const isLongTime = elapsed > 20 * 60 * 1000; // > 20 min

            return (
              <Card
                key={patient.id}
                className={`border-2 ${triage.border} ${triage.bg} ${
                  patient.status !== 'active' ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {triage.icon}
                      <span className="font-semibold text-sm truncate">{patient.label}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${triage.color} border-current`}
                      >
                        {patient.triageCategory}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-xs font-mono ${isLongTime ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                        {formatElapsed(elapsed)}
                      </span>
                      {isLongTime && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                  </div>

                  {/* Patient details row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span>{patient.weight} kg</span>
                    <span>·</span>
                    <span>{patient.ageYears < 1 ? `${Math.round(patient.ageYears * 12)} mo` : `${patient.ageYears} yr`}</span>
                    <span>·</span>
                    <span className="font-medium text-foreground">{patient.currentPhase}</span>
                  </div>

                  {/* Active threats */}
                  {patient.activeThreats.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {patient.activeThreats.map(t => (
                        <Badge key={t} variant="destructive" className="text-xs py-0">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Phase selector + actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <Select
                      value={patient.currentPhase}
                      onValueChange={v => updatePatient(patient.id, { currentPhase: v })}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ABCDE_PHASES.map(phase => (
                          <SelectItem key={phase} value={phase} className="text-xs">
                            {phase}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={patient.status}
                      onValueChange={v => updatePatient(patient.id, { status: v as MCIPatient['status'] })}
                    >
                      <SelectTrigger className="h-7 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" className="text-xs">Active</SelectItem>
                        <SelectItem value="stabilised" className="text-xs">Stabilised</SelectItem>
                        <SelectItem value="transferred" className="text-xs">Transferred</SelectItem>
                        <SelectItem value="deceased" className="text-xs">Deceased</SelectItem>
                      </SelectContent>
                    </Select>

                    {onFocusPatient && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={() => onFocusPatient(patient)}
                        title="Open full ResusGPS for this patient"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removePatient(patient.id)}
                      title="Remove patient"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Notes */}
                  <Input
                    className="mt-2 h-7 text-xs"
                    placeholder="Quick notes (optional)…"
                    value={patient.notes}
                    onChange={e => updatePatient(patient.id, { notes: e.target.value })}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add patient form */}
        {showAddForm && (
          <div className="px-3 py-3 border-t bg-muted/30 space-y-2 shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Add Patient
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                className="h-8 text-sm"
                placeholder="Label (e.g. Bay 1)"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
              />
              <Select value={newTriage} onValueChange={v => setNewTriage(v as TriageCategory)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['T1', 'T2', 'T3', 'T4'] as TriageCategory[]).map(t => (
                    <SelectItem key={t} value={t} className="text-sm">
                      {TRIAGE_CONFIG[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="h-8 text-sm"
                placeholder="Weight (kg)"
                type="number"
                min="0.5"
                max="100"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
              />
              <Input
                className="h-8 text-sm"
                placeholder="Age (years)"
                type="number"
                min="0"
                max="18"
                value={newAge}
                onChange={e => setNewAge(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-8 text-sm" onClick={addPatient}>
                <Plus className="h-4 w-4 mr-1" />
                Add Patient
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        {!showAddForm && (
          <div className="px-3 py-3 border-t shrink-0 flex gap-2">
            <Button
              className="flex-1 h-9"
              onClick={() => setShowAddForm(true)}
              disabled={patients.length >= MAX_PATIENTS}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Patient
              {patients.length >= MAX_PATIENTS && (
                <span className="ml-1 text-xs opacity-70">(max {MAX_PATIENTS})</span>
              )}
            </Button>
            {patients.length > 0 && (
              <Button
                variant="outline"
                className="h-9 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm('Clear all patients from the board?')) {
                    setPatients([]);
                  }
                }}
              >
                Clear All
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
