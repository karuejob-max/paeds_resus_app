import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, ArrowLeft } from 'lucide-react-native';

/**
 * Safety quarantine for the unfinished native active-case screen.
 *
 * This route intentionally exposes no CPR, shock, dose, or free-form ABCDE
 * controls. The governed web ResusGPS flow is the only active clinical path
 * until the shared engine is ported and validated for native mobile.
 */
export default function ActiveResusSafetyGate() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <AlertTriangle color="#fbbf24" size={42} />
        <Text style={styles.title}>Native active-care screen unavailable</Text>
        <Text style={styles.body}>
          This mobile screen is not the governed ResusGPS clinical workflow. It does not provide safe age, context, BLS, weight, or CPR-GPS gating, so active resuscitation controls are intentionally disabled here.
        </Text>
        <Text style={styles.body}>
          Use the supervised web ResusGPS route with your approved local emergency protocol and clinical team.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Return to ResusGPS"
          onPress={() => router.replace('/resus')}
          style={styles.button}
        >
          <ArrowLeft color="#fff" size={20} />
          <Text style={styles.buttonText}>Return to ResusGPS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 20 },
  card: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 18,
    padding: 24,
    backgroundColor: '#111827',
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 30 },
  body: { color: '#cbd5e1', fontSize: 16, lineHeight: 25 },
  button: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
