/**
 * (tabs)/_layout.tsx — Bottom tab navigator for PaedsResus mobile app
 *
 * Tabs:
 *   Home       — Provider dashboard (quick stats, next action)
 *   ResusGPS   — Bedside emergency tool (large, prominent tab)
 *   Protocols  — Condition-specific protocols (DKA, Sepsis, NRP, etc.)
 *   Profile    — Account, certificates, Care Signal, settings
 */

import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Home, Zap, BookOpen, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ef4444', // red-500 — emergency red brand
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#f8fafc',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          headerTitle: 'PaedsResus',
        }}
      />
      <Tabs.Screen
        name="resus"
        options={{
          title: 'ResusGPS',
          tabBarIcon: ({ color, size }) => <Zap color={color} size={size} />,
          tabBarBadge: undefined, // Will show active case count when MCI mode is active
          headerTitle: 'ResusGPS',
        }}
      />
      <Tabs.Screen
        name="protocols"
        options={{
          title: 'Protocols',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          headerTitle: 'Clinical Protocols',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          headerTitle: 'My Profile',
        }}
      />
    </Tabs>
  );
}
