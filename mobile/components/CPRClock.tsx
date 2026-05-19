/**
 * CPRClock.tsx — Mobile CPR Clock
 *
 * Phase 8.2: Full CPR Clock for React Native with:
 *   - Wall-clock-anchored 2-minute cycle timer (AHA: reassess rhythm every 2 min)
 *   - Haptic pulse every 30s (reminder to check compressions)
 *   - AHA-correct defibrillation energy: 2 J/kg → 4 J/kg → ≥4 J/kg (max 10 J/kg)
 *   - Adrenaline dose display (0.01 mg/kg IV/IO)
 *   - Amiodarone dose display (5 mg/kg IV/IO, max 300 mg)
 *   - Shock count tracking
 *   - Arrest duration timer
 *   - expo-keep-awake enforced while active
 *   - Heavy haptic on shock delivery
 *   - Warning haptic at 1:45 (15s before cycle end)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Alert, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import {
  Heart, Zap, Clock, RotateCcw, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react-native';

const CPR_CYCLE_SECONDS = 120; // 2 minutes per AHA PALS
const HAPTIC_REMINDER_INTERVAL = 30; // haptic every 30s
const WARNING_THRESHOLD = 15; // warn at 15s before cycle end

interface CPRClockProps {
  weightKg: number | null;
  onShockDelivered?: (shockNumber: number, energyJ: number) => void;
  onCycleComplete?: (cycleNumber: number) => void;
  onArrestEnd?: (durationSeconds: number, shockCount: number) => void;
}

function calcShockEnergy(shockNumber: number, weightKg: number): number {
  // AHA PALS 2020: 2 J/kg first shock, 4 J/kg second, ≥4 J/kg (max 10 J/kg) subsequent
  if (shockNumber === 1) return Math.round(2 * weightKg);
  if (shockNumber === 2) return Math.round(4 * weightKg);
  return Math.min(Math.round(4 * weightKg), Math.round(10 * weightKg));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CPRClock({
  weightKg,
  onShockDelivered,
  onCycleComplete,
  onArrestEnd,
}: CPRClockProps) {
  const [isActive, setIsActive] = useState(false);
  const [arrestElapsed, setArrestElapsed] = useState(0);
  const [cycleElapsed, setCycleElapsed] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [shockCount, setShockCount] = useState(0);
  const [adrenalineCount, setAdrenalineCount] = useState(0);
  const [showDrugs, setShowDrugs] = useState(false);

  const arrestStartRef = useRef<number>(0);
  const cycleStartRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastHapticRef = useRef<number>(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Keep screen awake while CPR active
  useEffect(() => {
    if (isActive) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
    return () => { deactivateKeepAwake(); };
  }, [isActive]);

  // Pulse animation for the heart icon
  useEffect(() => {
    if (!isActive) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 300, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isActive, pulseAnim]);

  // Wall-clock timer tick
  useEffect(() => {
    if (!isActive) return;

    const tick = () => {
      const now = Date.now();
      const arrestSec = Math.floor((now - arrestStartRef.current) / 1000);
      const cycleSec = Math.floor((now - cycleStartRef.current) / 1000);

      setArrestElapsed(arrestSec);
      setCycleElapsed(cycleSec);

      // Haptic reminder every 30s
      const hapticInterval = Math.floor(cycleSec / HAPTIC_REMINDER_INTERVAL);
      if (hapticInterval > lastHapticRef.current && cycleSec > 0) {
        lastHapticRef.current = hapticInterval;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Warning at 15s before cycle end
      if (cycleSec === CPR_CYCLE_SECONDS - WARNING_THRESHOLD) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      // Cycle complete at 2 minutes
      if (cycleSec >= CPR_CYCLE_SECONDS) {
        const newCycle = cycleCount + 1;
        setCycleCount(newCycle);
        cycleStartRef.current = now;
        lastHapticRef.current = 0;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onCycleComplete?.(newCycle);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isActive, cycleCount, onCycleComplete]);

  const handleStart = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const now = Date.now();
    arrestStartRef.current = now;
    cycleStartRef.current = now;
    lastHapticRef.current = 0;
    setIsActive(true);
    setArrestElapsed(0);
    setCycleElapsed(0);
    setCycleCount(0);
    setShockCount(0);
    setAdrenalineCount(0);
  }, []);

  const handleStop = useCallback(() => {
    Alert.alert(
      'End CPR?',
      `Arrest duration: ${formatTime(arrestElapsed)}\nShocks delivered: ${shockCount}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End CPR',
          style: 'destructive',
          onPress: () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            setIsActive(false);
            onArrestEnd?.(arrestElapsed, shockCount);
          },
        },
      ]
    );
  }, [arrestElapsed, shockCount, onArrestEnd]);

  const handleShock = useCallback(async () => {
    if (!weightKg) {
      Alert.alert('Weight Required', 'Enter patient weight to calculate shock energy.');
      return;
    }
    const nextShock = shockCount + 1;
    const energy = calcShockEnergy(nextShock, weightKg);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      `⚡ Shock ${nextShock}`,
      `Deliver ${energy} J\n(${nextShock === 1 ? 2 : 4} J/kg × ${weightKg} kg)\n\nClear patient. Resume CPR immediately after shock.`,
      [
        {
          text: 'Shock Delivered',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setShockCount(nextShock);
            // Reset cycle timer after shock
            cycleStartRef.current = Date.now();
            lastHapticRef.current = 0;
            onShockDelivered?.(nextShock, energy);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [weightKg, shockCount, onShockDelivered]);

  const handleAdrenaline = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newCount = adrenalineCount + 1;
    setAdrenalineCount(newCount);
    const dose = weightKg ? `${(0.01 * weightKg).toFixed(2)} mg` : '0.01 mg/kg';
    const volume = weightKg ? `${(0.1 * weightKg).toFixed(1)} mL of 1:10,000` : '';
    Alert.alert(
      `Adrenaline #${newCount}`,
      `Dose: ${dose} IV/IO\n${volume}\n\nGive every 3–5 minutes.\nNext due: ~${formatTime(arrestElapsed + 180)}`,
      [{ text: 'OK' }]
    );
  }, [adrenalineCount, weightKg, arrestElapsed]);

  const cycleProgress = Math.min(cycleElapsed / CPR_CYCLE_SECONDS, 1);
  const isNearCycleEnd = cycleElapsed >= CPR_CYCLE_SECONDS - WARNING_THRESHOLD;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Animated.View style={{ transform: [{ scale: isActive ? pulseAnim : 1 }] }}>
          <Heart color={isActive ? '#ef4444' : '#475569'} size={24} />
        </Animated.View>
        <Text style={styles.title}>CPR Clock</Text>
        {isActive && (
          <View style={styles.arrestTimer}>
            <Clock color="#94a3b8" size={14} />
            <Text style={styles.arrestTime}>{formatTime(arrestElapsed)}</Text>
          </View>
        )}
      </View>

      {/* Cycle progress ring */}
      {isActive && (
        <View style={styles.cycleBlock}>
          <View style={styles.cycleProgressBar}>
            <View
              style={[
                styles.cycleProgressFill,
                {
                  width: `${cycleProgress * 100}%` as any,
                  backgroundColor: isNearCycleEnd ? '#ef4444' : '#3b82f6',
                },
              ]}
            />
          </View>
          <View style={styles.cycleRow}>
            <Text style={[styles.cycleTime, isNearCycleEnd && styles.cycleTimeWarning]}>
              {formatTime(cycleElapsed)} / 2:00
            </Text>
            <Text style={styles.cycleLabel}>
              Cycle {cycleCount + 1} {isNearCycleEnd ? '⚠ Check rhythm' : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Main action buttons */}
      {!isActive ? (
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
          <Heart color="#fff" size={22} />
          <Text style={styles.startBtnText}>Start CPR Clock</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.activeControls}>
          {/* Shock button */}
          <TouchableOpacity style={styles.shockBtn} onPress={handleShock} activeOpacity={0.8}>
            <Zap color="#fff" size={20} />
            <View>
              <Text style={styles.shockBtnText}>Shock {shockCount + 1}</Text>
              <Text style={styles.shockEnergy}>
                {weightKg
                  ? `${calcShockEnergy(shockCount + 1, weightKg)} J`
                  : '— J (enter weight)'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Adrenaline button */}
          <TouchableOpacity style={styles.adrBtn} onPress={handleAdrenaline} activeOpacity={0.8}>
            <Text style={styles.adrBtnText}>Adrenaline</Text>
            <Text style={styles.adrDose}>
              {weightKg ? `${(0.01 * weightKg).toFixed(2)} mg` : '0.01 mg/kg'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Drug reference panel */}
      {isActive && weightKg && (
        <>
          <TouchableOpacity
            style={styles.drugsToggle}
            onPress={() => setShowDrugs(v => !v)}
          >
            <Text style={styles.drugsToggleText}>Drug Reference</Text>
            {showDrugs
              ? <ChevronUp color="#64748b" size={16} />
              : <ChevronDown color="#64748b" size={16} />}
          </TouchableOpacity>

          {showDrugs && (
            <ScrollView style={styles.drugsPanel} nestedScrollEnabled>
              {[
                {
                  name: 'Adrenaline',
                  dose: `${(0.01 * weightKg).toFixed(2)} mg IV/IO`,
                  note: `= ${(0.1 * weightKg).toFixed(1)} mL of 1:10,000 | Every 3–5 min`,
                },
                {
                  name: 'Amiodarone (VF/pVT)',
                  dose: `${Math.min(5 * weightKg, 300).toFixed(0)} mg IV/IO`,
                  note: `= 5 mg/kg (max 300 mg) | Repeat 2.5 mg/kg for 2nd dose`,
                },
                {
                  name: 'Lidocaine (alt)',
                  dose: `${(1 * weightKg).toFixed(1)} mg IV/IO`,
                  note: `= 1 mg/kg | Max 100 mg`,
                },
                {
                  name: 'Sodium Bicarbonate',
                  dose: `${(1 * weightKg).toFixed(0)} mmol IV/IO`,
                  note: `= 1 mmol/kg | Only if prolonged arrest or hyperK`,
                },
                {
                  name: 'Calcium Gluconate',
                  dose: `${(0.5 * weightKg).toFixed(1)} mL of 10% IV/IO`,
                  note: `= 0.5 mL/kg | For hypocalcaemia, hyperK, Ca-channel OD`,
                },
                {
                  name: 'Glucose (D10W)',
                  dose: `${(5 * weightKg).toFixed(0)} mL IV/IO`,
                  note: `= 5 mL/kg D10W | For hypoglycaemia`,
                },
              ].map(drug => (
                <View key={drug.name} style={styles.drugRow}>
                  <Text style={styles.drugName}>{drug.name}</Text>
                  <Text style={styles.drugDose}>{drug.dose}</Text>
                  <Text style={styles.drugNote}>{drug.note}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {/* Stop CPR */}
      {isActive && (
        <TouchableOpacity style={styles.stopBtn} onPress={handleStop} activeOpacity={0.8}>
          <Text style={styles.stopBtnText}>End CPR / ROSC</Text>
        </TouchableOpacity>
      )}

      {/* Stats row */}
      {isActive && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{cycleCount}</Text>
            <Text style={styles.statLabel}>Cycles</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{shockCount}</Text>
            <Text style={styles.statLabel}>Shocks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{adrenalineCount}</Text>
            <Text style={styles.statLabel}>Adrenaline</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#f8fafc', flex: 1 },
  arrestTimer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arrestTime: { fontSize: 14, fontWeight: '700', color: '#94a3b8', fontVariant: ['tabular-nums'] },

  cycleBlock: { marginBottom: 14 },
  cycleProgressBar: {
    height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden', marginBottom: 6,
  },
  cycleProgressFill: { height: '100%', borderRadius: 3 },
  cycleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cycleTime: { fontSize: 13, fontWeight: '700', color: '#94a3b8', fontVariant: ['tabular-nums'] },
  cycleTimeWarning: { color: '#ef4444' },
  cycleLabel: { fontSize: 12, color: '#64748b' },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 16, marginBottom: 8,
  },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  activeControls: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  shockBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#1c1107', borderWidth: 1, borderColor: '#78350f',
    borderRadius: 12, paddingVertical: 14,
  },
  shockBtnText: { color: '#fcd34d', fontWeight: '700', fontSize: 14 },
  shockEnergy: { color: '#f59e0b', fontSize: 11 },
  adrBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0a1c14', borderWidth: 1, borderColor: '#064e3b',
    borderRadius: 12, paddingVertical: 14,
  },
  adrBtnText: { color: '#6ee7b7', fontWeight: '700', fontSize: 14 },
  adrDose: { color: '#10b981', fontSize: 12, marginTop: 2 },

  drugsToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e293b', marginTop: 4,
  },
  drugsToggleText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  drugsPanel: { maxHeight: 220, marginBottom: 8 },
  drugRow: {
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  drugName: { fontSize: 13, fontWeight: '700', color: '#e2e8f0' },
  drugDose: { fontSize: 15, fontWeight: '800', color: '#10b981', marginTop: 2 },
  drugNote: { fontSize: 11, color: '#475569', marginTop: 1 },

  stopBtn: {
    alignItems: 'center', paddingVertical: 12,
    borderWidth: 1, borderColor: '#334155', borderRadius: 10, marginTop: 10,
  },
  stopBtnText: { color: '#94a3b8', fontWeight: '700', fontSize: 14 },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  statLabel: { fontSize: 11, color: '#475569', marginTop: 2 },
});
