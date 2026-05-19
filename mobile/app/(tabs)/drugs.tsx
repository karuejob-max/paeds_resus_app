/**
 * mobile/app/(tabs)/drugs.tsx
 *
 * Phase 8.3: Offline-first drug calculator
 *
 * Features:
 *   - Weight entry with Broselow/APLS age-to-weight estimation
 *   - Full drug list from shared/drugCalculations.ts
 *   - Instant weight-based dose calculation (no network required)
 *   - Search/filter by drug name or indication
 *   - Category tabs: Resus | Cardiac | Sedation | Antibiotics | Fluids
 *   - Dose display: mg, mL, route, rate, max dose, preparation notes
 *   - Haptic feedback on dose copy
 *   - Favourites (AsyncStorage)
 *   - Tap to copy dose to clipboard
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, FlatList, Alert, Clipboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Search, Star, Copy, ChevronDown, ChevronUp, Calculator,
} from 'lucide-react-native';

// ─── Inline drug database (offline-safe, no import from shared needed) ───────
// Mirrors shared/drugCalculations.ts but formatted for mobile display

interface DrugEntry {
  id: string;
  name: string;
  category: 'resus' | 'cardiac' | 'airway' | 'seizure' | 'fluid' | 'other';
  indications: string[];
  calc: (w: number) => {
    dose: string;
    volume?: string;
    route: string;
    rate?: string;
    max?: string;
    notes?: string;
    warning?: string;
  };
}

const DRUGS: DrugEntry[] = [
  // ── RESUSCITATION ────────────────────────────────────────────────────────
  {
    id: 'epi-ca', name: 'Adrenaline (Cardiac Arrest)', category: 'resus',
    indications: ['Cardiac arrest', 'Asystole', 'PEA', 'VF/pVT'],
    calc: (w) => ({
      dose: `${(0.01 * w).toFixed(3)} mg`,
      volume: `${(0.1 * w).toFixed(2)} mL of 1:10,000`,
      route: 'IV / IO',
      rate: 'Bolus. Flush with 3–5 mL NS',
      max: '1 mg per dose',
      notes: 'Repeat every 3–5 min. Give after 2nd shock if VF/pVT.',
      warning: w > 100 ? 'Weight >100 kg — use adult dose (1 mg)' : undefined,
    }),
  },
  {
    id: 'epi-ana', name: 'Adrenaline (Anaphylaxis)', category: 'resus',
    indications: ['Anaphylaxis', 'Severe allergic reaction'],
    calc: (w) => ({
      dose: `${Math.min(0.01 * w, 0.5).toFixed(3)} mg`,
      volume: `${Math.min(0.01 * w, 0.5).toFixed(2)} mL of 1:1,000`,
      route: 'IM (anterolateral thigh)',
      max: '0.5 mg',
      notes: 'Repeat every 5–15 min if no improvement. Prefer auto-injector if available.',
    }),
  },
  {
    id: 'amio', name: 'Amiodarone (VF/pVT)', category: 'resus',
    indications: ['VF', 'pVT', 'Refractory cardiac arrest'],
    calc: (w) => ({
      dose: `${Math.min(5 * w, 300).toFixed(0)} mg`,
      volume: `${(Math.min(5 * w, 300) / 50).toFixed(1)} mL of 50 mg/mL`,
      route: 'IV / IO',
      rate: 'Rapid bolus. Flush with D5W.',
      max: '300 mg first dose; 150 mg second dose',
      notes: 'Give after 3rd shock. Second dose: 2.5 mg/kg (max 150 mg).',
    }),
  },
  {
    id: 'atropine', name: 'Atropine (Bradycardia)', category: 'cardiac',
    indications: ['Symptomatic bradycardia', 'Vagally-mediated bradycardia'],
    calc: (w) => ({
      dose: `${Math.min(Math.max(0.02 * w, 0.1), 0.5).toFixed(3)} mg`,
      volume: `${(Math.min(Math.max(0.02 * w, 0.1), 0.5) / 0.6).toFixed(2)} mL of 0.6 mg/mL`,
      route: 'IV / IO',
      rate: 'Rapid bolus',
      max: '0.5 mg per dose; 1 mg total',
      notes: 'Min dose 0.1 mg (paradoxical bradycardia risk). Repeat once after 5 min.',
      warning: w < 5 ? 'Min dose 0.1 mg regardless of weight' : undefined,
    }),
  },
  {
    id: 'adenosine', name: 'Adenosine (SVT)', category: 'cardiac',
    indications: ['SVT', 'Supraventricular tachycardia'],
    calc: (w) => ({
      dose: `${Math.min(0.1 * w, 6).toFixed(2)} mg (1st dose)`,
      volume: `${(Math.min(0.1 * w, 6) / 3).toFixed(2)} mL of 3 mg/mL`,
      route: 'IV (rapid push, proximal vein)',
      rate: 'Rapid IV push + immediate 5–10 mL NS flush',
      max: '6 mg first dose; 12 mg second dose',
      notes: '2nd dose: 0.2 mg/kg (max 12 mg). Use largest proximal vein. Monitor ECG.',
      warning: 'Warn patient: brief chest tightness/flushing expected.',
    }),
  },

  // ── AIRWAY / BREATHING ───────────────────────────────────────────────────
  {
    id: 'salbutamol-neb', name: 'Salbutamol (Nebulised)', category: 'airway',
    indications: ['Asthma', 'Bronchospasm', 'Bronchiolitis', 'Anaphylaxis'],
    calc: (w) => ({
      dose: `${Math.min(Math.max(2.5, 0.15 * w), 5).toFixed(1)} mg`,
      volume: `${(Math.min(Math.max(2.5, 0.15 * w), 5) / 5).toFixed(2)} mL of 5 mg/mL + 2 mL NS`,
      route: 'Nebulised (O₂ driven at 6–8 L/min)',
      max: '5 mg per dose',
      notes: 'Severe: continuous nebulisation. Mild-moderate: every 20 min × 3.',
    }),
  },
  {
    id: 'salbutamol-iv', name: 'Salbutamol (IV bolus)', category: 'airway',
    indications: ['Severe asthma', 'Life-threatening bronchospasm'],
    calc: (w) => ({
      dose: `${(15 * w).toFixed(0)} mcg`,
      volume: `${(15 * w / 500).toFixed(2)} mL of 500 mcg/mL (diluted)`,
      route: 'IV over 10 min',
      max: '250 mcg',
      notes: 'Dilute to 1 mcg/mL. Monitor HR and K⁺.',
      warning: 'Risk of tachycardia and hypokalaemia.',
    }),
  },
  {
    id: 'ipratropium', name: 'Ipratropium (Nebulised)', category: 'airway',
    indications: ['Severe asthma', 'Bronchospasm'],
    calc: (w) => ({
      dose: w < 20 ? '125 mcg' : '250 mcg',
      volume: w < 20 ? '1 mL of 125 mcg/mL' : '1 mL of 250 mcg/mL',
      route: 'Nebulised with salbutamol',
      max: '250 mcg per dose',
      notes: 'Give with first 3 salbutamol nebs. Not for maintenance.',
    }),
  },
  {
    id: 'mgso4', name: 'Magnesium Sulphate (Asthma)', category: 'airway',
    indications: ['Severe asthma', 'Status asthmaticus'],
    calc: (w) => ({
      dose: `${Math.min(40 * w, 2000).toFixed(0)} mg (${Math.min(0.04 * w, 2).toFixed(2)} mmol/kg)`,
      volume: `${(Math.min(40 * w, 2000) / 500).toFixed(1)} mL of 500 mg/mL (50%)`,
      route: 'IV over 20 min (dilute to ≤20 mg/mL)',
      max: '2 g',
      notes: 'Dilute in 100 mL NS. Monitor BP and reflexes.',
      warning: 'Flush line well. Do not give as bolus.',
    }),
  },

  // ── SEIZURE ──────────────────────────────────────────────────────────────
  {
    id: 'midazolam-buccal', name: 'Midazolam (Buccal/IN)', category: 'seizure',
    indications: ['Status epilepticus', 'Seizure', 'First-line benzodiazepine'],
    calc: (w) => ({
      dose: `${Math.min(0.3 * w, 10).toFixed(2)} mg`,
      volume: `${(Math.min(0.3 * w, 10) / 10).toFixed(2)} mL of 10 mg/mL`,
      route: 'Buccal (between cheek and gum) or Intranasal (0.5 mL per nostril)',
      max: '10 mg',
      notes: 'Preferred pre-IV route. Onset 5–10 min. Repeat once after 10 min if no IV.',
    }),
  },
  {
    id: 'diazepam-iv', name: 'Diazepam (IV)', category: 'seizure',
    indications: ['Status epilepticus', 'Seizure'],
    calc: (w) => ({
      dose: `${Math.min(0.3 * w, 10).toFixed(2)} mg`,
      volume: `${(Math.min(0.3 * w, 10) / 5).toFixed(2)} mL of 5 mg/mL`,
      route: 'IV slow push over 3–5 min',
      max: '10 mg',
      notes: 'Respiratory depression risk. Have BVM ready.',
      warning: 'Do NOT use in neonates — use phenobarbitone instead.',
    }),
  },
  {
    id: 'phenobarb', name: 'Phenobarbitone (Neonatal Seizure)', category: 'seizure',
    indications: ['Neonatal seizure', 'Status epilepticus (neonate)'],
    calc: (w) => ({
      dose: `${(20 * w).toFixed(0)} mg`,
      volume: `${(20 * w / 200).toFixed(2)} mL of 200 mg/mL`,
      route: 'IV over 20–30 min',
      max: '40 mg/kg loading dose',
      notes: 'First-line for neonates. Maintenance: 3–5 mg/kg/day. Monitor for apnoea.',
    }),
  },
  {
    id: 'levetiracetam', name: 'Levetiracetam (2nd line)', category: 'seizure',
    indications: ['Status epilepticus', 'Refractory seizure'],
    calc: (w) => ({
      dose: `${Math.min(60 * w, 4500).toFixed(0)} mg`,
      volume: `${(Math.min(60 * w, 4500) / 100).toFixed(1)} mL of 100 mg/mL`,
      route: 'IV over 15 min',
      max: '4500 mg',
      notes: 'Dilute in 100 mL NS. Preferred 2nd line (less sedation than phenytoin).',
    }),
  },

  // ── FLUIDS ───────────────────────────────────────────────────────────────
  {
    id: 'ns-bolus', name: 'Normal Saline Bolus (Shock)', category: 'fluid',
    indications: ['Septic shock', 'Hypovolemia', 'Dehydration'],
    calc: (w) => ({
      dose: `${(20 * w).toFixed(0)} mL`,
      route: 'IV / IO rapid infusion',
      rate: 'Over 5–10 min (push in cardiac arrest)',
      max: 'Reassess after each bolus. Stop at 60 mL/kg if no improvement.',
      notes: 'Reassess after each 20 mL/kg. Consider vasopressors at ≥60 mL/kg.',
    }),
  },
  {
    id: 'rl-bolus', name: "Ringer's Lactate Bolus", category: 'fluid',
    indications: ['Septic shock', 'Trauma', 'Hypovolemia'],
    calc: (w) => ({
      dose: `${(20 * w).toFixed(0)} mL`,
      route: 'IV / IO rapid infusion',
      rate: 'Over 5–10 min',
      notes: 'Preferred over NS for repeated boluses (less hyperchloraemic acidosis).',
    }),
  },
  {
    id: 'd10', name: 'Dextrose 10% (Hypoglycaemia)', category: 'fluid',
    indications: ['Hypoglycaemia', 'BSL < 2.5 mmol/L', 'Altered consciousness'],
    calc: (w) => ({
      dose: `${(5 * w).toFixed(0)} mL`,
      route: 'IV / IO over 5 min',
      max: '250 mL',
      notes: 'Recheck BSL 15 min after. Maintenance: D10 at 4 mL/kg/hr if < 1 year.',
    }),
  },

  // ── OTHER ────────────────────────────────────────────────────────────────
  {
    id: 'hydrocortisone', name: 'Hydrocortisone', category: 'other',
    indications: ['Anaphylaxis', 'Adrenal crisis', 'Refractory shock', 'Severe asthma'],
    calc: (w) => ({
      dose: `${Math.min(4 * w, 200).toFixed(0)} mg`,
      volume: `${(Math.min(4 * w, 200) / 100).toFixed(2)} mL of 100 mg/mL`,
      route: 'IV over 5 min',
      max: '200 mg',
      notes: 'Adjunct — not first-line. For refractory anaphylaxis or adrenal crisis.',
    }),
  },
  {
    id: 'nacl-hypertonic', name: 'Hypertonic Saline 3% (Raised ICP)', category: 'other',
    indications: ['Raised ICP', 'Cerebral herniation', 'Hyponatraemic seizure'],
    calc: (w) => ({
      dose: `${(3 * w).toFixed(0)} mL`,
      route: 'IV over 15–20 min (central line preferred)',
      max: '150 mL',
      notes: 'For acute herniation: 5–10 mL/kg over 10 min. Recheck Na⁺ after.',
      warning: 'Rapid correction of hyponatraemia risks osmotic demyelination.',
    }),
  },
  {
    id: 'calcium-gluconate', name: 'Calcium Gluconate 10%', category: 'other',
    indications: ['Hypocalcaemia', 'Hyperkalaemia', 'Ca-channel blocker OD', 'Cardiac arrest'],
    calc: (w) => ({
      dose: `${(0.5 * w).toFixed(1)} mL of 10%`,
      volume: `${(0.5 * w).toFixed(1)} mL undiluted or diluted 1:1 with NS`,
      route: 'IV slow push (over 5–10 min)',
      max: '20 mL',
      notes: 'Flush line before and after. Avoid with sodium bicarbonate in same line.',
      warning: 'Bradycardia if given too fast. Monitor ECG.',
    }),
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'resus', label: 'Resus' },
  { id: 'cardiac', label: 'Cardiac' },
  { id: 'airway', label: 'Airway' },
  { id: 'seizure', label: 'Seizure' },
  { id: 'fluid', label: 'Fluids' },
  { id: 'other', label: 'Other' },
];

const FAVOURITES_KEY = 'drug_calc_favourites_v1';
const LAST_WEIGHT_KEY = 'drug_calc_last_weight_v1';

// ─── Age-to-weight estimation (APLS formula) ─────────────────────────────────
function estimateWeightFromAge(ageMonths: number): number {
  if (ageMonths < 3) return 3.5; // neonate
  if (ageMonths < 12) return (ageMonths / 2) + 4;
  const ageYears = ageMonths / 12;
  if (ageYears < 5) return 2 * (ageYears + 4);
  if (ageYears < 10) return 3 * ageYears + 7;
  return 2.5 * ageYears + 4;
}

export default function DrugCalculatorScreen() {
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<string[]>([]);

  // Load persisted weight and favourites on mount
  useEffect(() => {
    (async () => {
      const [savedWeight, savedFavs] = await Promise.all([
        AsyncStorage.getItem(LAST_WEIGHT_KEY),
        AsyncStorage.getItem(FAVOURITES_KEY),
      ]);
      if (savedWeight) {
        const w = parseFloat(savedWeight);
        if (!isNaN(w)) { setWeightKg(w); setWeightInput(savedWeight); }
      }
      if (savedFavs) setFavourites(JSON.parse(savedFavs));
    })();
  }, []);

  const handleSetWeight = useCallback((val: string) => {
    setWeightInput(val);
    const w = parseFloat(val);
    if (!isNaN(w) && w > 0 && w <= 200) {
      setWeightKg(w);
      AsyncStorage.setItem(LAST_WEIGHT_KEY, val);
    } else {
      setWeightKg(null);
    }
  }, []);

  const handleEstimateFromAge = useCallback(() => {
    const months = parseFloat(ageInput);
    if (isNaN(months) || months <= 0) {
      Alert.alert('Invalid Age', 'Enter age in months (e.g. 24 for 2 years).');
      return;
    }
    const est = estimateWeightFromAge(months);
    const rounded = Math.round(est * 10) / 10;
    setWeightKg(rounded);
    setWeightInput(String(rounded));
    AsyncStorage.setItem(LAST_WEIGHT_KEY, String(rounded));
    Alert.alert('Estimated Weight', `APLS estimate: ${rounded} kg for ${months} months old.\n\nAlways verify with actual weight if available.`);
  }, [ageInput]);

  const toggleFavourite = useCallback(async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavourites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleCopyDose = useCallback(async (drug: DrugEntry) => {
    if (!weightKg) return;
    const result = drug.calc(weightKg);
    const text = `${drug.name}\nDose: ${result.dose}\n${result.volume ? `Volume: ${result.volume}\n` : ''}Route: ${result.route}${result.max ? `\nMax: ${result.max}` : ''}${result.notes ? `\nNotes: ${result.notes}` : ''}`;
    Clipboard.setString(text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Dose copied to clipboard.');
  }, [weightKg]);

  const filteredDrugs = useMemo(() => {
    let list = DRUGS;
    if (category !== 'all') list = list.filter(d => d.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.indications.some(i => i.toLowerCase().includes(q))
      );
    }
    // Favourites first
    return [
      ...list.filter(d => favourites.includes(d.id)),
      ...list.filter(d => !favourites.includes(d.id)),
    ];
  }, [category, search, favourites]);

  return (
    <View style={styles.container}>
      {/* Weight input */}
      <View style={styles.weightCard}>
        <View style={styles.weightRow}>
          <Calculator color="#3b82f6" size={18} />
          <Text style={styles.weightTitle}>Patient Weight</Text>
        </View>
        <View style={styles.weightInputRow}>
          <TextInput
            style={styles.weightInput}
            value={weightInput}
            onChangeText={handleSetWeight}
            placeholder="kg"
            placeholderTextColor="#475569"
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          <Text style={styles.weightUnit}>kg</Text>
          <Text style={styles.orText}>or</Text>
          <TextInput
            style={[styles.weightInput, { flex: 1 }]}
            value={ageInput}
            onChangeText={setAgeInput}
            placeholder="age (months)"
            placeholderTextColor="#475569"
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.estimateBtn} onPress={handleEstimateFromAge}>
            <Text style={styles.estimateBtnText}>Estimate</Text>
          </TouchableOpacity>
        </View>
        {weightKg && (
          <Text style={styles.weightConfirm}>✓ Weight set: {weightKg} kg</Text>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Search color="#475569" size={16} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search drug or indication..."
          placeholderTextColor="#475569"
          returnKeyType="search"
        />
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catTab, category === cat.id && styles.catTabActive]}
            onPress={() => setCategory(cat.id)}
          >
            <Text style={[styles.catTabText, category === cat.id && styles.catTabTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Drug list */}
      <FlatList
        data={filteredDrugs}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => {
          const isExpanded = expanded === item.id;
          const isFav = favourites.includes(item.id);
          const result = weightKg ? item.calc(weightKg) : null;

          return (
            <View style={styles.drugCard}>
              <TouchableOpacity
                style={styles.drugHeader}
                onPress={() => setExpanded(isExpanded ? null : item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.drugHeaderLeft}>
                  <Text style={styles.drugName}>{item.name}</Text>
                  <Text style={styles.drugIndications} numberOfLines={1}>
                    {item.indications.join(' · ')}
                  </Text>
                </View>
                <View style={styles.drugHeaderRight}>
                  <TouchableOpacity onPress={() => toggleFavourite(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Star
                      color={isFav ? '#f59e0b' : '#334155'}
                      fill={isFav ? '#f59e0b' : 'none'}
                      size={16}
                    />
                  </TouchableOpacity>
                  {isExpanded ? <ChevronUp color="#475569" size={16} /> : <ChevronDown color="#475569" size={16} />}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.drugBody}>
                  {!weightKg ? (
                    <Text style={styles.noWeightText}>⚠ Enter patient weight to calculate dose</Text>
                  ) : (
                    <>
                      {result?.warning && (
                        <View style={styles.warningBanner}>
                          <Text style={styles.warningText}>⚠ {result.warning}</Text>
                        </View>
                      )}
                      <View style={styles.doseRow}>
                        <Text style={styles.doseLabel}>Dose</Text>
                        <Text style={styles.doseValue}>{result?.dose}</Text>
                      </View>
                      {result?.volume && (
                        <View style={styles.doseRow}>
                          <Text style={styles.doseLabel}>Volume</Text>
                          <Text style={styles.doseValue}>{result.volume}</Text>
                        </View>
                      )}
                      <View style={styles.doseRow}>
                        <Text style={styles.doseLabel}>Route</Text>
                        <Text style={styles.doseValue}>{result?.route}</Text>
                      </View>
                      {result?.rate && (
                        <View style={styles.doseRow}>
                          <Text style={styles.doseLabel}>Rate</Text>
                          <Text style={styles.doseValue}>{result.rate}</Text>
                        </View>
                      )}
                      {result?.max && (
                        <View style={styles.doseRow}>
                          <Text style={styles.doseLabel}>Max</Text>
                          <Text style={[styles.doseValue, styles.maxDose]}>{result.max}</Text>
                        </View>
                      )}
                      {result?.notes && (
                        <Text style={styles.drugNotes}>{result.notes}</Text>
                      )}
                      <TouchableOpacity
                        style={styles.copyBtn}
                        onPress={() => handleCopyDose(item)}
                        activeOpacity={0.8}
                      >
                        <Copy color="#3b82f6" size={14} />
                        <Text style={styles.copyBtnText}>Copy dose</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },

  weightCard: {
    backgroundColor: '#0f172a', margin: 12, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#1e293b',
  },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  weightTitle: { fontSize: 14, fontWeight: '700', color: '#f8fafc' },
  weightInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weightInput: {
    flex: 0.8, backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 8, color: '#f8fafc', fontSize: 16, fontWeight: '700',
  },
  weightUnit: { color: '#64748b', fontSize: 14 },
  orText: { color: '#475569', fontSize: 12 },
  estimateBtn: {
    backgroundColor: '#1e3a5f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  estimateBtnText: { color: '#60a5fa', fontSize: 12, fontWeight: '700' },
  weightConfirm: { marginTop: 8, fontSize: 12, color: '#10b981', fontWeight: '600' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0f172a', marginHorizontal: 12, marginBottom: 8,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#1e293b',
  },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 14 },

  catScroll: { paddingHorizontal: 12, marginBottom: 8, flexGrow: 0 },
  catTab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#0f172a', marginRight: 8, borderWidth: 1, borderColor: '#1e293b',
  },
  catTabActive: { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' },
  catTabText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  catTabTextActive: { color: '#60a5fa' },

  list: { flex: 1, paddingHorizontal: 12 },
  drugCard: {
    backgroundColor: '#0f172a', borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden',
  },
  drugHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14,
  },
  drugHeaderLeft: { flex: 1, marginRight: 8 },
  drugHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  drugName: { fontSize: 14, fontWeight: '700', color: '#f8fafc' },
  drugIndications: { fontSize: 11, color: '#475569', marginTop: 2 },

  drugBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#1e293b' },
  noWeightText: { color: '#f59e0b', fontSize: 13, paddingTop: 12 },
  warningBanner: {
    backgroundColor: '#1c1107', borderRadius: 8, padding: 10, marginTop: 10,
    borderWidth: 1, borderColor: '#78350f',
  },
  warningText: { color: '#fcd34d', fontSize: 12 },
  doseRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  doseLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', width: 60 },
  doseValue: { fontSize: 14, color: '#e2e8f0', fontWeight: '700', flex: 1, textAlign: 'right' },
  maxDose: { color: '#ef4444' },
  drugNotes: { fontSize: 12, color: '#64748b', marginTop: 10, lineHeight: 18 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#0c1a2e', borderRadius: 8, borderWidth: 1, borderColor: '#1e3a5f',
  },
  copyBtnText: { color: '#3b82f6', fontSize: 12, fontWeight: '700' },
});
