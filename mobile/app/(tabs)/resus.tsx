/**
 * resus.tsx — ResusGPS tab (idle state)
 *
 * Shows the "Start New Case" button and any active/paused case resume option.
 * Tapping "Start New Case" navigates to the active ResusGPS screen.
 * Designed for one-handed use — large tap targets, high contrast.
 */

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Clock, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSISTED_SESSION_KEY = 'resus_active_session_v1';

export default function ResusIdleScreen() {
  const router = useRouter();
  const [persistedSession, setPersistedSession] = useState<{
    phase: string;
    weight: number | null;
    elapsedSeconds: number;
    savedAt: string;
  } | null>(null);

  useEffect(() => {
    // Check for a persisted active session
    AsyncStorage.getItem(PERSISTED_SESSION_KEY).then(raw => {
      if (!raw) return;
      try {
        const session = JSON.parse(raw);
        // Only offer resume if session is less than 4 hours old
        const savedAt = new Date(session.savedAt).getTime();
        if (Date.now() - savedAt < 4 * 60 * 60 * 1000 && session.phase !== 'IDLE') {
          setPersistedSession(session);
        }
      } catch {
        // Ignore corrupt data
      }
    });
  }, []);

  const handleStartNewCase = () => {
    router.push('/resus/active');
  };

  const handleResumeCase = () => {
    router.push('/resus/active?resume=true');
  };

  const handleDiscardAndStart = () => {
    Alert.alert(
      'Discard Previous Case?',
      'This will clear the previous session and start a new case.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard & Start New',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(PERSISTED_SESSION_KEY);
            setPersistedSession(null);
            router.push('/resus/active');
          },
        },
      ]
    );
  };

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.zapBadge}>
            <Zap color="#ef4444" size={28} />
          </View>
          <Text style={styles.title}>ResusGPS</Text>
          <Text style={styles.subtitle}>
            Bedside paediatric emergency decision support
          </Text>
        </View>

        {/* Resume Banner */}
        {persistedSession && (
          <View style={styles.resumeBanner}>
            <View style={styles.resumeHeader}>
              <Clock color="#f59e0b" size={18} />
              <Text style={styles.resumeTitle}>Active Case Found</Text>
            </View>
            <Text style={styles.resumeBody}>
              Phase: {persistedSession.phase} •{' '}
              {persistedSession.weight ? `${persistedSession.weight} kg` : 'Weight not set'} •{' '}
              {formatElapsed(persistedSession.elapsedSeconds)} elapsed
            </Text>
            <View style={styles.resumeActions}>
              <TouchableOpacity style={styles.resumeBtn} onPress={handleResumeCase}>
                <Text style={styles.resumeBtnText}>Resume Case</Text>
                <ChevronRight color="#f59e0b" size={16} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDiscardAndStart}>
                <Text style={styles.discardText}>Discard & Start New</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Start New Case Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartNewCase}
          activeOpacity={0.85}
        >
          <Zap color="#fff" size={24} />
          <Text style={styles.startButtonText}>Start New Case</Text>
        </TouchableOpacity>

        {/* Quick Reference Cards */}
        <Text style={styles.sectionTitle}>Quick Reference</Text>

        {[
          { label: 'Normal HR by age', value: 'Neonate: 100–160 | Infant: 100–150 | Child: 70–120 | Adolescent: 60–100' },
          { label: 'Normal RR by age', value: 'Neonate: 40–60 | Infant: 30–40 | Child: 20–30 | Adolescent: 12–20' },
          { label: 'ETT size (uncuffed)', value: '(Age/4) + 4 | Cuffed: (Age/4) + 3.5' },
          { label: 'Adrenaline (cardiac arrest)', value: '0.01 mg/kg IV/IO (0.1 mL/kg of 1:10,000)' },
          { label: 'Fluid bolus (shock)', value: '10–20 mL/kg 0.9% NaCl over 5–20 min' },
          { label: 'Defibrillation', value: 'Shock 1: 2 J/kg | Shock 2: 4 J/kg | Subsequent: ≥4 J/kg (max 10 J/kg)' },
        ].map((item, i) => (
          <View key={i} style={styles.refCard}>
            <Text style={styles.refLabel}>{item.label}</Text>
            <Text style={styles.refValue}>{item.value}</Text>
          </View>
        ))}

        {/* Safety Notice */}
        <View style={styles.safetyNotice}>
          <AlertTriangle color="#f59e0b" size={14} />
          <Text style={styles.safetyText}>
            ResusGPS supports clinical decision-making. Always apply clinical judgement. Not a substitute for trained personnel.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  zapBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#f8fafc', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' },

  resumeBanner: {
    backgroundColor: '#1c1107', borderWidth: 1, borderColor: '#78350f',
    borderRadius: 12, padding: 16, marginBottom: 20,
  },
  resumeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  resumeTitle: { fontSize: 15, fontWeight: '700', color: '#f59e0b' },
  resumeBody: { fontSize: 13, color: '#fcd34d', marginBottom: 12 },
  resumeActions: { gap: 8 },
  resumeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#78350f', borderRadius: 8, paddingVertical: 10, gap: 6,
  },
  resumeBtnText: { color: '#fef3c7', fontWeight: '700', fontSize: 14 },
  discardText: { color: '#6b7280', fontSize: 12, textAlign: 'center', marginTop: 4 },

  startButton: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  refCard: {
    backgroundColor: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 8,
  },
  refLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 4 },
  refValue: { fontSize: 13, color: '#e2e8f0', lineHeight: 20 },

  safetyNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#1c1107', borderRadius: 8, padding: 12, marginTop: 16,
  },
  safetyText: { flex: 1, fontSize: 11, color: '#92400e', lineHeight: 16 },
});
