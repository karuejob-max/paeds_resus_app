/**
 * profile.tsx — Profile tab
 *
 * Shows: account info, certificates, Care Signal, settings, logout.
 */

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, Bell, Settings, LogOut, ChevronRight, User, Shield } from 'lucide-react-native';

export default function ProfileScreen() {

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { /* TODO: clear session */ } },
    ]);
  };

  const menuItems = [
    { label: 'My Certificates', subtitle: 'BLS, PALS, Fellowship progress', icon: <Award color="#10b981" size={20} />, onPress: () => {} },
    { label: 'Care Signal', subtitle: 'Report & track resource gaps', icon: <Bell color="#f59e0b" size={20} />, onPress: () => {} },
    { label: 'Notifications', subtitle: 'Care Signal responses, alerts', icon: <Bell color="#3b82f6" size={20} />, onPress: () => {} },
    { label: 'Account Settings', subtitle: 'Password, email, preferences', icon: <Settings color="#94a3b8" size={20} />, onPress: () => {} },
    { label: 'Privacy & Security', subtitle: 'Data, sessions, audit log', icon: <Shield color="#8b5cf6" size={20} />, onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <User color="#94a3b8" size={32} />
          </View>
          <Text style={styles.name}>Healthcare Provider</Text>
          <Text style={styles.email}>provider@hospital.org</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Provider</Text>
          </View>
        </View>

        {/* Menu */}
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.8}>
            <View style={styles.menuLeft}>
              {item.icon}
              <View>
                <Text style={styles.menuTitle}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <ChevronRight color="#475569" size={16} />
          </TouchableOpacity>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut color="#ef4444" size={18} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>PaedsResus v1.0.0 • Built for low-resource hospitals</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  email: { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleBadge: {
    marginTop: 8, backgroundColor: '#1e293b', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  roleText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },

  menuItem: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuTitle: { fontSize: 14, fontWeight: '700', color: '#e2e8f0' },
  menuSubtitle: { fontSize: 12, color: '#64748b', marginTop: 1 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1c0a0a', borderWidth: 1, borderColor: '#7f1d1d',
    borderRadius: 12, paddingVertical: 14, marginTop: 16,
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },

  version: { textAlign: 'center', color: '#334155', fontSize: 11, marginTop: 20 },
});
