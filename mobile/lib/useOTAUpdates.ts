/**
 * mobile/lib/useOTAUpdates.ts
 *
 * Phase 8.6: EAS OTA Update Manager
 *
 * Enables instant clinical guideline patches without app store review.
 * Critical for: AHA guideline changes, drug dose corrections, protocol updates.
 *
 * Strategy:
 *   - Check for updates on app foreground (not on every launch to save bandwidth)
 *   - Show a non-blocking banner for non-critical updates
 *   - Force-reload immediately for CRITICAL updates (e.g., drug dose corrections)
 *   - Never interrupt an active ResusGPS case
 *   - Log update events to Care Signal for audit trail
 *
 * Update channels:
 *   - "production"  → stable releases (default)
 *   - "clinical"    → urgent clinical patches (fast-track, no store review)
 *   - "beta"        → pilot hospital testing
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// expo-updates is a native module — import with try/catch
let Updates: any = null;
try {
  Updates = require('expo-updates');
} catch {
  // Not available in dev/Expo Go — OTA disabled
}

const LAST_UPDATE_CHECK_KEY = 'ota_last_check_v1';
const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'update_available'
  | 'critical_update'
  | 'downloading'
  | 'ready_to_reload'
  | 'error'
  | 'up_to_date';

interface OTAUpdateInfo {
  isCritical: boolean;
  releaseNotes?: string;
  channel: string;
}

interface UseOTAUpdatesOptions {
  /** If true, never reload during an active case */
  caseActive?: boolean;
  onCriticalUpdate?: (info: OTAUpdateInfo) => void;
}

interface UseOTAUpdatesReturn {
  status: UpdateStatus;
  updateInfo: OTAUpdateInfo | null;
  checkForUpdate: () => Promise<void>;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
}

export function useOTAUpdates({
  caseActive = false,
  onCriticalUpdate,
}: UseOTAUpdatesOptions = {}): UseOTAUpdatesReturn {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<OTAUpdateInfo | null>(null);
  const caseActiveRef = useRef(caseActive);
  caseActiveRef.current = caseActive;

  const checkForUpdate = useCallback(async () => {
    if (!Updates || Updates.isEmbeddedLaunch === false) return;
    if (__DEV__) return; // Never check in development

    try {
      setStatus('checking');
      const result = await Updates.checkForUpdateAsync();

      if (!result.isAvailable) {
        setStatus('up_to_date');
        await AsyncStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());
        return;
      }

      // Determine if critical from manifest extra metadata
      const manifest = result.manifest as any;
      const isCritical = manifest?.extra?.isCritical === true ||
        manifest?.extra?.updateType === 'critical';
      const releaseNotes = manifest?.extra?.releaseNotes ?? 'Clinical guideline update available.';
      const channel = manifest?.extra?.channel ?? 'production';

      const info: OTAUpdateInfo = { isCritical, releaseNotes, channel };
      setUpdateInfo(info);
      setStatus(isCritical ? 'critical_update' : 'update_available');

      if (isCritical) {
        onCriticalUpdate?.(info);
        // If no active case, auto-download and prompt
        if (!caseActiveRef.current) {
          await downloadAndPrepareUpdate();
        }
      }
    } catch (e) {
      console.warn('[OTA] Update check failed:', e);
      setStatus('error');
    }
  }, [onCriticalUpdate]);

  const downloadAndPrepareUpdate = useCallback(async () => {
    if (!Updates) return;
    try {
      setStatus('downloading');
      await Updates.fetchUpdateAsync();
      setStatus('ready_to_reload');
    } catch (e) {
      console.warn('[OTA] Download failed:', e);
      setStatus('error');
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!Updates || status !== 'ready_to_reload') {
      // Need to download first
      await downloadAndPrepareUpdate();
      return;
    }
    if (caseActiveRef.current) {
      Alert.alert(
        'Update Ready',
        'A clinical update is ready. It will be applied when you end the current case.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.warn('[OTA] Reload failed:', e);
    }
  }, [status, downloadAndPrepareUpdate]);

  const dismissUpdate = useCallback(() => {
    setStatus('idle');
  }, []);

  // Check on app foreground (throttled to every 4 hours)
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState !== 'active') return;
      try {
        const lastCheck = await AsyncStorage.getItem(LAST_UPDATE_CHECK_KEY);
        const elapsed = lastCheck ? Date.now() - parseInt(lastCheck, 10) : Infinity;
        if (elapsed > UPDATE_CHECK_INTERVAL_MS) {
          await checkForUpdate();
        }
      } catch { /* ignore */ }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Check on first mount
    (async () => {
      try {
        const lastCheck = await AsyncStorage.getItem(LAST_UPDATE_CHECK_KEY);
        const elapsed = lastCheck ? Date.now() - parseInt(lastCheck, 10) : Infinity;
        if (elapsed > UPDATE_CHECK_INTERVAL_MS) {
          await checkForUpdate();
        }
      } catch { /* ignore */ }
    })();

    return () => subscription.remove();
  }, [checkForUpdate]);

  return { status, updateInfo, checkForUpdate, applyUpdate, dismissUpdate };
}

// ─── OTAUpdateBanner — non-blocking update notification UI ───────────────────
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Download, AlertTriangle, X, RefreshCw } from 'lucide-react-native';

interface OTAUpdateBannerProps {
  status: UpdateStatus;
  updateInfo: OTAUpdateInfo | null;
  onApply: () => void;
  onDismiss: () => void;
}

export function OTAUpdateBanner({ status, updateInfo, onApply, onDismiss }: OTAUpdateBannerProps) {
  const slideAnim = React.useRef(new Animated.Value(-80)).current;

  const visible = status === 'update_available' || status === 'critical_update' ||
    status === 'ready_to_reload' || status === 'downloading';

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -80,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [visible, slideAnim]);

  if (!visible && !updateInfo) return null;

  const isCritical = updateInfo?.isCritical ?? false;

  return (
    <Animated.View
      style={[
        bannerStyles.container,
        isCritical && bannerStyles.critical,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={bannerStyles.left}>
        {isCritical
          ? <AlertTriangle color="#fcd34d" size={16} />
          : <Download color="#60a5fa" size={16} />}
        <View style={bannerStyles.textBlock}>
          <Text style={bannerStyles.title}>
            {isCritical ? '⚠ Critical Clinical Update' : 'Update Available'}
          </Text>
          <Text style={bannerStyles.notes} numberOfLines={2}>
            {updateInfo?.releaseNotes ?? 'New version ready.'}
          </Text>
        </View>
      </View>
      <View style={bannerStyles.actions}>
        {status === 'downloading' ? (
          <Text style={bannerStyles.downloading}>Downloading...</Text>
        ) : (
          <TouchableOpacity style={bannerStyles.applyBtn} onPress={onApply}>
            <RefreshCw color="#fff" size={14} />
            <Text style={bannerStyles.applyText}>
              {status === 'ready_to_reload' ? 'Restart' : 'Update'}
            </Text>
          </TouchableOpacity>
        )}
        {!isCritical && (
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X color="#475569" size={16} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e3a5f',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, gap: 12,
  },
  critical: {
    backgroundColor: '#1c1107', borderBottomColor: '#78350f',
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  textBlock: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: '#f8fafc' },
  notes: { fontSize: 11, color: '#64748b', marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  downloading: { fontSize: 12, color: '#60a5fa' },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1e3a5f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  applyText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
