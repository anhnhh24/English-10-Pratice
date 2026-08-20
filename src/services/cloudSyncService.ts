/**
 * Cloud Database Synchronization Service — Firebase Realtime Database
 * Real cross-device sync between guardian (admin) and student (Hoàng Hà)
 */
import { database, ref, set, get, onValue, off } from './firebaseConfig';
import type { DataSnapshot } from 'firebase/database';

export interface CloudDBSettings {
  enabled: boolean;
  roomCode: string;
  autoSyncIntervalSec: number;
  lastSyncTimestamp?: string;
}

const STORAGE_SETTINGS_KEY = 'edu10_clouddb_settings';
const DEFAULT_ROOM_CODE = 'VAO10_GIAMSAT_2026';

export const DEFAULT_CLOUD_SETTINGS: CloudDBSettings = {
  enabled: true,
  roomCode: DEFAULT_ROOM_CODE,
  autoSyncIntervalSec: 15,
  lastSyncTimestamp: new Date().toISOString(),
};

/**
 * Load saved Cloud DB settings from localStorage
 */
export function getCloudDBSettings(): CloudDBSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_CLOUD_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_CLOUD_SETTINGS;
}

/**
 * Save Cloud DB settings to localStorage
 */
export function saveCloudDBSettings(settings: Partial<CloudDBSettings>): CloudDBSettings {
  const current = getCloudDBSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
  return updated;
}

/**
 * Push student data to Firebase Realtime Database
 */
export async function pushUserDataToOnlineDB(
  userId: string,
  userData: any,
  userProfile?: any
): Promise<{ success: boolean; message: string }> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) {
    return { success: false, message: 'Cloud DB chưa được kích hoạt' };
  }

  const payload = {
    userId,
    userProfile: userProfile || null,
    userData,
    updatedAt: new Date().toISOString(),
    deviceInfo: navigator.userAgent.slice(0, 80),
  };

  try {
    const dbRef = ref(database, `rooms/${settings.roomCode}/students/${userId}`);
    await set(dbRef, payload);
    saveCloudDBSettings({ lastSyncTimestamp: new Date().toISOString() });
    return { success: true, message: '✅ Đã đồng bộ lên Firebase Realtime DB thành công!' };
  } catch (err: any) {
    console.error('Firebase push error:', err);
    // Fallback: save to localStorage backup
    try {
      localStorage.setItem(`edu10_cloud_backup_${settings.roomCode}_${userId}`, JSON.stringify(payload));
    } catch (_) {}
    return { success: false, message: `❌ Lỗi đồng bộ: ${err.message || 'Không kết nối được Firebase'}` };
  }
}

/**
 * Fetch all students' latest data from Firebase for the Room Code
 */
export async function fetchRoomDataFromOnlineDB(): Promise<{
  success: boolean;
  data: Record<string, { userData: any; userProfile?: any; updatedAt: string }> | null;
  message: string;
}> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) {
    return { success: false, data: null, message: 'Cloud DB chưa được kích hoạt' };
  }

  try {
    const dbRef = ref(database, `rooms/${settings.roomCode}/students`);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      saveCloudDBSettings({ lastSyncTimestamp: new Date().toISOString() });
      return { success: true, data, message: '✅ Đã tải dữ liệu từ Firebase thành công!' };
    } else {
      return { success: true, data: {}, message: 'Chưa có dữ liệu trên Firebase cho phòng này.' };
    }
  } catch (err: any) {
    console.error('Firebase fetch error:', err);
    return { success: false, data: null, message: `❌ Lỗi: ${err.message || 'Không kết nối được Firebase'}` };
  }
}

/**
 * Subscribe to real-time changes for a specific student on Firebase
 * Returns unsubscribe function
 */
export function subscribeToStudentData(
  userId: string,
  callback: (data: any) => void
): () => void {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) return () => {};

  const dbRef = ref(database, `rooms/${settings.roomCode}/students/${userId}`);
  const handler = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  };

  onValue(dbRef, handler);
  return () => off(dbRef, 'value', handler);
}

/**
 * Subscribe to real-time changes for ALL students in the room
 */
export function subscribeToRoomData(
  callback: (data: Record<string, any>) => void
): () => void {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) return () => {};

  const dbRef = ref(database, `rooms/${settings.roomCode}/students`);
  const handler = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  };

  onValue(dbRef, handler);
  return () => off(dbRef, 'value', handler);
}

/**
 * Check Firebase connection status
 */
export function subscribeToConnectionStatus(callback: (connected: boolean) => void): () => void {
  const connRef = ref(database, '.info/connected');
  const handler = (snapshot: DataSnapshot) => {
    callback(snapshot.val() === true);
  };
  onValue(connRef, handler);
  return () => off(connRef, 'value', handler);
}
