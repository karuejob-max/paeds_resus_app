/**
 * index.tsx — Home tab (Provider Dashboard)
 *
 * Shows:
 * - Quick-launch ResusGPS button
 * - Active case indicator (if any)
 * - Unread Care Signal notifications
 * - Fellowship progress summary
 * - Quick reference links
 */

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Bell, Award, BookOpen, ChevronRight, Activity } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Good morning, Provider</Text>
          <Text style={styles.greetingSubtext}>Ready for bedside?</Text>
        </View>

        {/* Primary CTA — ResusGPS */}
        <TouchableOpacity
          style={styles.primaryCTA}
          onPress={() => router.push('/(tabs)/resus')}
          activeOpacity={0.85}
        >
          <View style={styles.ctaLeft}>
            <Zap color="#ef4444" size={28} />
            <View>
              <Text style={styles.ctaTitle}>ResusGPS</Text>
              <Text style={styles.ctaSubtitle}>Tap to start a new case</Text>
            </View>
          </View>
          <ChevronRight color="#64748b" size={20} />
        </TouchableOpacity>

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.statsRow}>
          {[
            { label: 'Cases', value: '—', icon: <Activity color="#3b82f6" size={18} /> },
            { label: 'Protocols Used', value: '—', icon: <BookOpen color="#8b5cf6" size={18} /> },
            { label: 'Notifications', value: '—', icon: <Bell color="#f59e0b" size={18} /> },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              {stat.icon}
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        {[
          { label: 'Condition Protocols', subtitle: 'DKA, Sepsis, NRP, Anaphylaxis…', icon: <BookOpen color="#8b5cf6" size={20} />, route: '/(tabs)/protocols' },
          { label: 'Care Signal', subtitle: 'Report resource gaps', icon: <Bell color="#f59e0b" size={20} />, route: '/(tabs)/profile' },
          { label: 'My Certificates', subtitle: 'BLS, PALS, Fellowship', icon: <Award color="#10b981" size={20} />, route: '/(tabs)/profile' },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.quickLink}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
          >
            <View style={styles.quickLinkLeft}>
              {item.icon}
              <View>
                <Text style={styles.quickLinkTitle}>{item.label}</Text>
                <Text style={styles.quickLinkSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <ChevronRight color="#475569" size={16} />
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 40 },

  greeting: { marginBottom: 24 },
  greetingText: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  greetingSubtext: { fontSize: 14, color: '#64748b', marginTop: 2 },

  primaryCTA: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 28, borderWidth: 1, borderColor: '#334155',
  },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  ctaSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#475569', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
    alignItems: 'center', gap: 6,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#f8fafc' },
  statLabel: { fontSize: 11, color: '#64748b', textAlign: 'center' },

  quickLink: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickLinkTitle: { fontSize: 14, fontWeight: '700', color: '#e2e8f0' },
  quickLinkSubtitle: { fontSize: 12, color: '#64748b', marginTop: 1 },
});
