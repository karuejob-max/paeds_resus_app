/**
 * active.tsx — Active ResusGPS case screen
 *
 * The core bedside screen. Shows:
 * - Case timer (wall-clock anchored, drift-proof)
 * - Weight input (if not set)
 * - ABCDE phase navigator
 * - Active threats and interventions
 * - CPR Clock toggle
 * - Keep-awake enabled while active
 *
 * Designed for one-handed use under pressure.
 */

import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft, Clock, AlertTriangle, CheckCircle2,
  Heart, Zap, RotateCcw, X,
} from 'lucide-react-native';

const PERSISTED_SESSION_KEY = 'resus_active_session_v1';

const ABCDE_PHASES = ['A', 'B', 'C', 'D', 'E'] as const;
type ABCDEPhase = typeof ABCDE_PHASES[number];

const PHASE_LABELS: Record<ABCDEPhase, string> = {
  A: 'Airway',
  B: 'Breathing',
  C: 'Circulation',
  D: 'Disability',
  E: 'Exposure',
};

const PHASE_COLORS: Record<ABCDEPhase, string> = {
  A: '#ef4444',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#8b5cf6',
  E: '#10b981',
};

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActiveResusScreen() {
  const router = useRouter();
  const { resume } = useLocalSearchParams<{ resume?: string }>();

  // Wall-clock anchored timer
  const startTimeRef = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const [weight, setWeight] = useState<string>('');
  const [weightSet, setWeightSet] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<ABCDEPhase>('A');
  const [cprActive, setCprActive] = useState(false);
  const [cprCycles, setCprCycles] = useState(0);
  const [shockCount, setShockCount] = useState(0);

  // Keep screen awake during active case
  useEffect(() => {
    activateKeepAwakeAsync();
    return () => { deactivateKeepAwake(); };
  }, []);

  // Wall-clock timer
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTimeRef.current) / 1000));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Persist session every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      AsyncStorage.setItem(PERSISTED_SESSION_KEY, JSON.stringify({
        phase: currentPhase,
        weight: weightSet ? parseFloat(weight) : null,
        elapsedSeconds: elapsed,
        savedAt: new Date().toISOString(),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [currentPhase, weight, weightSet, elapsed]);

  const handleEndCase = () => {
    Alert.alert(
      'End Case',
      'This will close the active case. Make sure you have exported your SBAR/Progress Note first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Case',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(PERSISTED_SESSION_KEY);
            router.back();
          },
        },
      ]
    );
  };

  const handleCPRToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!cprActive) {
      setCprActive(true);
      setCprCycles(prev => prev + 1);
    } else {
      setCprActive(false);
    }
  };

  const handleShock = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const newCount = shockCount + 1;
    setShockCount(newCount);
    // AHA energy: 2 J/kg → 4 J/kg → ≥4 J/kg (max 10)
    const w = parseFloat(weight) || 0;
    let energy = 0;
    if (newCount === 1) energy = 2 * w;
    else if (newCount === 2) energy = 4 * w;
    else energy = Math.min(4 * w, 10 * w);
    Alert.alert(
      `Shock ${newCount}`,
      w > 0
        ? `Deliver ${energy.toFixed(0)} J (${newCount === 1 ? 2 : 4} J/kg × ${w} kg)`
        : 'Enter patient weight to calculate energy dose.',
      [{ text: 'OK' }]
    );
  };

  const shockEnergy = () => {
    const w = parseFloat(weight) || 0;
    if (!w) return '— J';
    const nextShock = shockCount + 1;
    const jkg = nextShock === 1 ? 2 : 4;
    return `${(jkg * w).toFixed(0)} J`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleEndCase} style={styles.backBtn}>
          <X color="#ef4444" size={20} />
        </TouchableOpacity>

        <View style={styles.timerBlock}>
          <Clock color="#94a3b8" size={14} />
          <Text style={[styles.timer, elapsed > 600 && styles.timerWarning]}>
            {formatTime(elapsed)}
          </Text>
        </View>

        <View style={styles.weightBlock}>
          {weightSet ? (
            <Text style={styles.weightDisplay}>{weight} kg</Text>
          ) : (
            <TextInput
              style={styles.weightInput}
              placeholder="kg"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
              onSubmitEditing={() => { if (parseFloat(weight) > 0) setWeightSet(true); }}
              returnKeyType="done"
              maxLength={5}
            />
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Weight prompt */}
        {!weightSet && (
          <View style={styles.weightPrompt}>
            <AlertTriangle color="#f59e0b" size={16} />
            <Text style={styles.weightPromptText}>Enter patient weight for dose calculations</Text>
            <TouchableOpacity
              style={styles.weightSetBtn}
              onPress={() => { if (parseFloat(weight) > 0) setWeightSet(true); }}
            >
              <Text style={styles.weightSetBtnText}>Set</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ABCDE Phase Tabs */}
        <View style={styles.phaseTabs}>
          {ABCDE_PHASES.map(phase => (
            <TouchableOpacity
              key={phase}
              style={[
                styles.phaseTab,
                currentPhase === phase && { backgroundColor: PHASE_COLORS[phase] },
              ]}
              onPress={() => setCurrentPhase(phase)}
            >
              <Text style={[
                styles.phaseTabText,
                currentPhase === phase && styles.phaseTabTextActive,
              ]}>
                {phase}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phase Label */}
        <View style={[styles.phaseHeader, { borderColor: PHASE_COLORS[currentPhase] }]}>
          <Text style={[styles.phaseLabel, { color: PHASE_COLORS[currentPhase] }]}>
            {currentPhase} — {PHASE_LABELS[currentPhase]}
          </Text>
        </View>

        {/* Phase placeholder content */}
        <View style={styles.phaseContent}>
          <Text style={styles.phaseContentText}>
            {currentPhase === 'A' && 'Assess airway patency. Look for obstruction, stridor, secretions.\n\nInterventions: Position, suction, jaw thrust, OPA/NPA, LMA, RSI.'}
            {currentPhase === 'B' && 'Assess breathing. RR, SpO₂, work of breathing, air entry, wheeze, crepitations.\n\nInterventions: O₂ therapy, BVM, CPAP, intubation.'}
            {currentPhase === 'C' && 'Assess circulation. HR, BP, CRT, pulses, skin colour, urine output.\n\nInterventions: IV/IO access, fluid bolus, vasopressors, blood products.'}
            {currentPhase === 'D' && 'Assess disability. GCS/AVPU, pupils, posture, BSL, seizures.\n\nInterventions: Glucose, anticonvulsants, ICP management.'}
            {currentPhase === 'E' && 'Assess exposure. Temperature, rash, trauma, bleeding, lines/tubes.\n\nInterventions: Warming, wound care, remove foreign bodies.'}
          </Text>
        </View>

        {/* CPR Controls */}
        <Text style={styles.sectionTitle}>Cardiac Arrest Controls</Text>
        <View style={styles.cprRow}>
          <TouchableOpacity
            style={[styles.cprBtn, cprActive && styles.cprBtnActive]}
            onPress={handleCPRToggle}
            activeOpacity={0.8}
          >
            <Heart color={cprActive ? '#fff' : '#ef4444'} size={22} />
            <Text style={[styles.cprBtnText, cprActive && styles.cprBtnTextActive]}>
              {cprActive ? `CPR Active (${cprCycles})` : 'Start CPR'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shockBtn} onPress={handleShock} activeOpacity={0.8}>
            <Zap color="#fff" size={22} />
            <View>
              <Text style={styles.shockBtnText}>Shock {shockCount + 1}</Text>
              <Text style={styles.shockEnergy}>{shockEnergy()}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Adrenaline dose */}
        {parseFloat(weight) > 0 && (
          <View style={styles.doseCard}>
            <Text style={styles.doseTitle}>Adrenaline (Cardiac Arrest)</Text>
            <Text style={styles.doseValue}>
              {(0.01 * parseFloat(weight)).toFixed(2)} mg IV/IO
            </Text>
            <Text style={styles.doseNote}>
              = {(0.1 * parseFloat(weight)).toFixed(1)} mL of 1:10,000 solution
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  backBtn: { padding: 6 },
  timerBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timer: { fontSize: 20, fontWeight: '800', color: '#f8fafc', fontVariant: ['tabular-nums'] },
  timerWarning: { color: '#ef4444' },
  weightBlock: {},
  weightInput: {
    backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, fontSize: 16, fontWeight: '700',
    width: 70, textAlign: 'center',
  },
  weightDisplay: { fontSize: 16, fontWeight: '800', color: '#10b981' },

  scroll: { padding: 16, paddingBottom: 40 },

  weightPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1c1107', borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#78350f',
  },
  weightPromptText: { flex: 1, color: '#fcd34d', fontSize: 13 },
  weightSetBtn: { backgroundColor: '#78350f', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  weightSetBtnText: { color: '#fef3c7', fontWeight: '700', fontSize: 13 },

  phaseTabs: {
    flexDirection: 'row', gap: 8, marginBottom: 12,
  },
  phaseTab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, backgroundColor: '#1e293b',
  },
  phaseTabText: { fontSize: 16, fontWeight: '800', color: '#64748b' },
  phaseTabTextActive: { color: '#fff' },

  phaseHeader: {
    borderLeftWidth: 3, paddingLeft: 12, marginBottom: 12,
  },
  phaseLabel: { fontSize: 16, fontWeight: '700' },

  phaseContent: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 20,
  },
  phaseContentText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 },

  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#475569',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },

  cprRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  cprBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#7f1d1d',
    borderRadius: 12, paddingVertical: 16,
  },
  cprBtnActive: { backgroundColor: '#dc2626', borderColor: '#ef4444' },
  cprBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  cprBtnTextActive: { color: '#fff' },

  shockBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#1c1107', borderWidth: 1, borderColor: '#78350f',
    borderRadius: 12, paddingVertical: 16,
  },
  shockBtnText: { color: '#fcd34d', fontWeight: '700', fontSize: 14 },
  shockEnergy: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },

  doseCard: {
    backgroundColor: '#0a1c14', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#064e3b',
  },
  doseTitle: { fontSize: 12, fontWeight: '700', color: '#6ee7b7', marginBottom: 4 },
  doseValue: { fontSize: 22, fontWeight: '800', color: '#10b981' },
  doseNote: { fontSize: 12, color: '#4ade80', marginTop: 2 },
});
