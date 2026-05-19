/**
 * protocols.tsx — Condition Protocols tab
 *
 * Lists all 6 condition protocols. Tapping opens a full-screen
 * step-by-step protocol viewer with weight-based dose calculations.
 */

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Search, ChevronRight, Heart, Zap, Droplets, Brain, Wind, Baby } from 'lucide-react-native';

const PROTOCOLS = [
  {
    id: 'cardiac_arrest',
    label: 'Cardiac Arrest',
    subtitle: 'PALS algorithm, CPR, defibrillation',
    icon: <Heart color="#ef4444" size={22} />,
    color: '#ef4444',
    bg: '#1c0a0a',
    border: '#7f1d1d',
  },
  {
    id: 'septic_shock',
    label: 'Septic Shock',
    subtitle: 'Fluid resuscitation, antibiotics, vasopressors',
    icon: <Droplets color="#3b82f6" size={22} />,
    color: '#3b82f6',
    bg: '#0a0f1c',
    border: '#1e3a5f',
  },
  {
    id: 'dka',
    label: 'DKA',
    subtitle: 'Fluid replacement, insulin, electrolytes',
    icon: <Zap color="#f59e0b" size={22} />,
    color: '#f59e0b',
    bg: '#1c1107',
    border: '#78350f',
  },
  {
    id: 'status_epilepticus',
    label: 'Status Epilepticus',
    subtitle: 'Benzodiazepines, phenytoin, RSI',
    icon: <Brain color="#8b5cf6" size={22} />,
    color: '#8b5cf6',
    bg: '#0f0a1c',
    border: '#4c1d95',
  },
  {
    id: 'anaphylaxis',
    label: 'Anaphylaxis',
    subtitle: 'Adrenaline, antihistamines, steroids',
    icon: <Wind color="#10b981" size={22} />,
    color: '#10b981',
    bg: '#0a1c14',
    border: '#064e3b',
  },
  {
    id: 'nrp',
    label: 'Neonatal Resuscitation (NRP)',
    subtitle: 'Warmth, stimulation, PPV, chest compressions',
    icon: <Baby color="#f472b6" size={22} />,
    color: '#f472b6',
    bg: '#1c0a14',
    border: '#831843',
  },
];

export default function ProtocolsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = PROTOCOLS.filter(p =>
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Search */}
        <View style={styles.searchRow}>
          <Search color="#64748b" size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search protocols…"
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Weight input hint */}
        <View style={styles.weightHint}>
          <Text style={styles.weightHintText}>
            💡 Enter patient weight in ResusGPS to get weight-based doses in protocols.
          </Text>
        </View>

        {/* Protocol cards */}
        {filtered.map(protocol => (
          <TouchableOpacity
            key={protocol.id}
            style={[styles.card, { backgroundColor: protocol.bg, borderColor: protocol.border }]}
            onPress={() => router.push(`/resus/protocol?id=${protocol.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconBadge, { borderColor: protocol.border }]}>
                {protocol.icon}
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: protocol.color }]}>{protocol.label}</Text>
                <Text style={styles.cardSubtitle}>{protocol.subtitle}</Text>
              </View>
            </View>
            <ChevronRight color="#475569" size={18} />
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No protocols match "{search}"</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 40 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 14 },

  weightHint: {
    backgroundColor: '#0a1c14', borderRadius: 8, padding: 10, marginBottom: 20,
    borderWidth: 1, borderColor: '#064e3b',
  },
  weightHintText: { color: '#6ee7b7', fontSize: 12, lineHeight: 18 },

  card: {
    borderRadius: 14, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  iconBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 16 },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#475569', fontSize: 14 },
});
