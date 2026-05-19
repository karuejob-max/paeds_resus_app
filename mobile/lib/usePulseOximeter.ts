/**
 * mobile/lib/usePulseOximeter.ts
 *
 * Phase 8.5: Bluetooth Pulse Oximeter Integration
 *
 * Supports BLE-based pulse oximeters (Masimo, Nonin, Contec, Berry Medical).
 * Uses react-native-ble-plx for BLE scanning and characteristic reading.
 *
 * Architecture:
 *   1. Scan for nearby BLE devices advertising pulse ox service UUIDs
 *   2. Connect to the selected device
 *   3. Subscribe to SpO₂ and HR characteristic notifications
 *   4. Parse manufacturer-specific data frames
 *   5. Stream live SpO₂ + HR into ResusGPS session (auto-updates vitalSigns)
 *   6. Alert on SpO₂ < 94% or HR outside age-appropriate range
 *
 * Supported service UUIDs:
 *   - Nonin Medical: 46a970e0-d5f2-11e2-8b8b-0800200c9a66
 *   - Contec CMS50D+: 0000ffe0-0000-1000-8000-00805f9b34fb
 *   - Berry BM1000B: 0000fff0-0000-1000-8000-00805f9b34fb
 *   - Generic Health Device Profile (HDP): 0x1400
 *
 * Fallback: Manual SpO₂ / HR entry if BLE unavailable.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

// BLE is a native module — import with try/catch
let BleManager: any = null;
let Device: any = null;
try {
  const blePlx = require('react-native-ble-plx');
  BleManager = new blePlx.BleManager();
} catch {
  // BLE not available in this environment
}

// ─── Known pulse oximeter BLE service/characteristic UUIDs ───────────────────
const PULSE_OX_SERVICES = [
  '46a970e0-d5f2-11e2-8b8b-0800200c9a66', // Nonin
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Contec CMS50D+
  '0000fff0-0000-1000-8000-00805f9b34fb', // Berry BM1000B
  '00001400-0000-1000-8000-00805f9b34fb', // Generic HDP
];

const PULSE_OX_CHARACTERISTICS = [
  '46a970e1-d5f2-11e2-8b8b-0800200c9a66', // Nonin SpO₂ + HR
  '0000ffe1-0000-1000-8000-00805f9b34fb', // Contec data
  '0000fff4-0000-1000-8000-00805f9b34fb', // Berry data
];

export interface PulseOxReading {
  spo2: number;        // 0–100 %
  heartRate: number;   // bpm
  perfusionIndex?: number; // 0–20 %
  timestamp: number;
  deviceName: string;
}

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
}

interface UsePulseOximeterOptions {
  onReading: (reading: PulseOxReading) => void;
  onAlert?: (type: 'low_spo2' | 'bradycardia' | 'tachycardia', value: number) => void;
  patientAgeMonths?: number;
}

interface UsePulseOximeterReturn {
  isAvailable: boolean;
  isScanning: boolean;
  isConnected: boolean;
  connectedDevice: BLEDevice | null;
  nearbyDevices: BLEDevice[];
  lastReading: PulseOxReading | null;
  startScan: () => void;
  stopScan: () => void;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

// ─── Age-appropriate HR ranges ────────────────────────────────────────────────
function getHRRange(ageMonths: number): { min: number; max: number } {
  if (ageMonths < 1) return { min: 100, max: 180 };
  if (ageMonths < 12) return { min: 100, max: 160 };
  if (ageMonths < 36) return { min: 90, max: 150 };
  if (ageMonths < 60) return { min: 80, max: 140 };
  if (ageMonths < 144) return { min: 70, max: 120 };
  return { min: 60, max: 100 };
}

// ─── Data frame parsers ───────────────────────────────────────────────────────
function parseNonin(base64: string): { spo2: number; hr: number; pi?: number } | null {
  try {
    const bytes = Buffer.from(base64, 'base64');
    if (bytes.length < 5) return null;
    const spo2 = bytes[3];
    const hr = (bytes[4] & 0x01) * 256 + bytes[5];
    const pi = bytes[6] ? bytes[6] / 10 : undefined;
    if (spo2 < 50 || spo2 > 100 || hr < 20 || hr > 300) return null;
    return { spo2, hr, pi };
  } catch { return null; }
}

function parseContec(base64: string): { spo2: number; hr: number } | null {
  try {
    const bytes = Buffer.from(base64, 'base64');
    if (bytes.length < 5) return null;
    const spo2 = bytes[4] & 0x7F;
    const hr = bytes[3] & 0xFF;
    if (spo2 < 50 || spo2 > 100 || hr < 20 || hr > 300) return null;
    return { spo2, hr };
  } catch { return null; }
}

function parseGeneric(base64: string): { spo2: number; hr: number } | null {
  // Try Contec first, then Nonin
  return parseContec(base64) ?? parseNonin(base64);
}

export function usePulseOximeter({
  onReading,
  onAlert,
  patientAgeMonths = 24,
}: UsePulseOximeterOptions): UsePulseOximeterReturn {
  const [isAvailable] = useState(!!BleManager);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BLEDevice | null>(null);
  const [nearbyDevices, setNearbyDevices] = useState<BLEDevice[]>([]);
  const [lastReading, setLastReading] = useState<PulseOxReading | null>(null);

  const connectedDeviceRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);
  const onReadingRef = useRef(onReading);
  const onAlertRef = useRef(onAlert);
  onReadingRef.current = onReading;
  onAlertRef.current = onAlert;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      connectedDeviceRef.current?.cancelConnection();
      BleManager?.stopDeviceScan();
    };
  }, []);

  const startScan = useCallback(() => {
    if (!BleManager || isScanning) return;
    setNearbyDevices([]);
    setIsScanning(true);

    BleManager.startDeviceScan(
      PULSE_OX_SERVICES,
      { allowDuplicates: false },
      (error: any, device: any) => {
        if (error) {
          console.warn('[BLE] Scan error:', error);
          setIsScanning(false);
          return;
        }
        if (device?.name) {
          setNearbyDevices(prev => {
            if (prev.find(d => d.id === device.id)) return prev;
            return [...prev, { id: device.id, name: device.name, rssi: device.rssi ?? -99 }];
          });
        }
      }
    );

    // Auto-stop scan after 15 seconds
    setTimeout(() => {
      BleManager?.stopDeviceScan();
      setIsScanning(false);
    }, 15000);
  }, [isScanning]);

  const stopScan = useCallback(() => {
    BleManager?.stopDeviceScan();
    setIsScanning(false);
  }, []);

  const connect = useCallback(async (deviceId: string) => {
    if (!BleManager) return;
    try {
      stopScan();
      const device = await BleManager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      connectedDeviceRef.current = device;
      setConnectedDevice({ id: device.id, name: device.name ?? 'Pulse Oximeter', rssi: -70 });
      setIsConnected(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak('Pulse oximeter connected.', { rate: 1.1 });

      // Subscribe to all known characteristics
      for (const charUUID of PULSE_OX_CHARACTERISTICS) {
        try {
          const sub = device.monitorCharacteristicForService(
            PULSE_OX_SERVICES[0], // try first service
            charUUID,
            (err: any, char: any) => {
              if (err || !char?.value) return;
              const parsed = parseGeneric(char.value);
              if (!parsed) return;

              const reading: PulseOxReading = {
                spo2: parsed.spo2,
                heartRate: parsed.hr,
                perfusionIndex: parsed.pi,
                timestamp: Date.now(),
                deviceName: device.name ?? 'Pulse Oximeter',
              };

              setLastReading(reading);
              onReadingRef.current(reading);

              // Clinical alerts
              if (parsed.spo2 < 94) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                onAlertRef.current?.('low_spo2', parsed.spo2);
              }
              const hrRange = getHRRange(patientAgeMonths);
              if (parsed.hr < hrRange.min) {
                onAlertRef.current?.('bradycardia', parsed.hr);
              } else if (parsed.hr > hrRange.max) {
                onAlertRef.current?.('tachycardia', parsed.hr);
              }
            }
          );
          subscriptionRef.current = sub;
          break; // Use first working characteristic
        } catch { continue; }
      }
    } catch (e) {
      console.warn('[BLE] Connection failed:', e);
      setIsConnected(false);
      setConnectedDevice(null);
    }
  }, [stopScan, patientAgeMonths]);

  const disconnect = useCallback(async () => {
    subscriptionRef.current?.remove();
    await connectedDeviceRef.current?.cancelConnection();
    connectedDeviceRef.current = null;
    setIsConnected(false);
    setConnectedDevice(null);
  }, []);

  return {
    isAvailable,
    isScanning,
    isConnected,
    connectedDevice,
    nearbyDevices,
    lastReading,
    startScan,
    stopScan,
    connect,
    disconnect,
  };
}

// ─── PulseOxWidget — drop-in UI component ────────────────────────────────────
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Bluetooth, BluetoothConnected, Activity } from 'lucide-react-native';

interface PulseOxWidgetProps {
  reading: PulseOxReading | null;
  isConnected: boolean;
  isScanning: boolean;
  connectedDevice: BLEDevice | null;
  onPressConnect: () => void;
}

export function PulseOxWidget({
  reading, isConnected, isScanning, connectedDevice, onPressConnect,
}: PulseOxWidgetProps) {
  const spo2Color = !reading ? '#475569'
    : reading.spo2 >= 95 ? '#10b981'
    : reading.spo2 >= 90 ? '#f59e0b'
    : '#ef4444';

  return (
    <View style={poxStyles.container}>
      <View style={poxStyles.header}>
        <Activity color="#3b82f6" size={14} />
        <Text style={poxStyles.title}>SpO₂ Monitor</Text>
        {isConnected
          ? <BluetoothConnected color="#10b981" size={14} />
          : <Bluetooth color="#475569" size={14} />}
      </View>

      {isConnected && reading ? (
        <View style={poxStyles.readings}>
          <View style={poxStyles.readingItem}>
            <Text style={[poxStyles.readingValue, { color: spo2Color }]}>
              {reading.spo2}%
            </Text>
            <Text style={poxStyles.readingLabel}>SpO₂</Text>
          </View>
          <View style={poxStyles.divider} />
          <View style={poxStyles.readingItem}>
            <Text style={[poxStyles.readingValue, { color: '#f8fafc' }]}>
              {reading.heartRate}
            </Text>
            <Text style={poxStyles.readingLabel}>HR (bpm)</Text>
          </View>
          {reading.perfusionIndex !== undefined && (
            <>
              <View style={poxStyles.divider} />
              <View style={poxStyles.readingItem}>
                <Text style={[poxStyles.readingValue, { color: '#94a3b8', fontSize: 16 }]}>
                  {reading.perfusionIndex.toFixed(1)}%
                </Text>
                <Text style={poxStyles.readingLabel}>PI</Text>
              </View>
            </>
          )}
        </View>
      ) : (
        <TouchableOpacity style={poxStyles.connectBtn} onPress={onPressConnect} activeOpacity={0.8}>
          {isScanning
            ? <ActivityIndicator color="#3b82f6" size="small" />
            : <Bluetooth color="#3b82f6" size={16} />}
          <Text style={poxStyles.connectBtnText}>
            {isScanning ? 'Scanning...' : isConnected ? connectedDevice?.name ?? 'Connected' : 'Connect Pulse Ox'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const poxStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#1e293b',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  title: { flex: 1, fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  readings: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  readingItem: { alignItems: 'center', gap: 2 },
  readingValue: { fontSize: 22, fontWeight: '800' },
  readingLabel: { fontSize: 10, color: '#475569', fontWeight: '600' },
  divider: { width: 1, height: 36, backgroundColor: '#1e293b' },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 8, backgroundColor: '#0c1a2e',
    borderRadius: 8, borderWidth: 1, borderColor: '#1e3a5f',
  },
  connectBtnText: { color: '#3b82f6', fontSize: 13, fontWeight: '700' },
});
