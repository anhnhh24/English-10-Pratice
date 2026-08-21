/**
 * Realtime Activity Sync Service — Firebase + BroadcastChannel
 * Cross-device real-time monitoring of student activities
 */
import { database, ref, set, get, onValue, push, off } from './firebaseConfig';
import { getCloudDBSettings } from './cloudSyncService';
import { RealtimeActivityEvent, RemoteTaskAssignment, RemotePing } from '../types';
import type { DataSnapshot } from 'firebase/database';

const CHANNEL_NAME = 'edu10_realtime_channel';
const STORAGE_ACTIVITIES_KEY = 'edu10_realtime_activities';
const STORAGE_TASKS_KEY = 'edu10_remote_tasks';

// BroadcastChannel for same-browser tab sync (kept as optimization)
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported');
}

// ═══════════════════════════════════════════════
// 1. ACTIVITY EVENTS (Student actions → Admin sees)
// ═══════════════════════════════════════════════

/**
 * Get stored activities from localStorage (fallback/cache)
 */
export function getStoredRealtimeActivities(): RealtimeActivityEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { console.error(e); }
  return [];
}

/**
 * Log and broadcast a student activity event
 * Writes to: Firebase + localStorage + BroadcastChannel
 */
export function logAndBroadcastActivity(
  eventData: Omit<RealtimeActivityEvent, 'id' | 'timestamp'>
): RealtimeActivityEvent {
  const newEvent: RealtimeActivityEvent = {
    ...eventData,
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Save to localStorage (cache)
    const current = getStoredRealtimeActivities();
    const updated = [newEvent, ...current].slice(0, 50);
    localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(updated));

    // 2. BroadcastChannel (same-browser tabs)
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'ACTIVITY_EVENT', payload: newEvent });
    }

    // 3. Firebase Realtime Database (cross-device!)
    const settings = getCloudDBSettings();
    if (settings.enabled && settings.roomCode) {
      const activitiesRef = ref(database, `rooms/${settings.roomCode}/activities`);
      push(activitiesRef, newEvent).catch((err) =>
        console.warn('Firebase activity push failed:', err)
      );
    }
  } catch (e) {
    console.error('Error logging activity:', e);
  }

  return newEvent;
}

/**
 * Subscribe to real-time activities from Firebase + BroadcastChannel
 * Returns unsubscribe function
 */
export function subscribeToRealtimeActivities(
  callback: (event: RealtimeActivityEvent) => void
): () => void {
  const cleanups: (() => void)[] = [];

  // 1. BroadcastChannel listener (same-browser)
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'ACTIVITY_EVENT') {
      callback(e.data.payload);
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
    cleanups.push(() => broadcastChannel?.removeEventListener('message', handleBroadcastMessage));
  }

  // 2. localStorage storage event (cross-tab same-origin)
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_ACTIVITIES_KEY && e.newValue) {
      try {
        const events = JSON.parse(e.newValue);
        if (Array.isArray(events) && events.length > 0) callback(events[0]);
      } catch (_) {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
    cleanups.push(() => window.removeEventListener('storage', handleStorageEvent));
  }

  // 3. Firebase Realtime listener (CROSS-DEVICE!)
  const settings = getCloudDBSettings();
  if (settings.enabled && settings.roomCode) {
    const activitiesRef = ref(database, `rooms/${settings.roomCode}/activities`);
    
    // We only want NEW events, not historical ones
    // Use limitToLast(1) trick: listen for child_added on the latest
    let isInitialLoad = true;
    const handler = (snapshot: DataSnapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return; // Skip initial data load
      }
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Firebase returns all children, we extract the latest entries
        if (typeof data === 'object' && data !== null) {
          const entries = Object.values(data) as RealtimeActivityEvent[];
          const sorted = entries.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          if (sorted[0]) {
            // Prevent duplicate callbacks by checking if we already have it locally
            const stored = getStoredRealtimeActivities();
            if (!stored.find(s => s.id === sorted[0].id)) {
              callback(sorted[0]);
              // Also cache locally
              const updatedLocal = [sorted[0], ...stored].slice(0, 50);
              localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(updatedLocal));
            }
          }
        }
      }
    };
    onValue(activitiesRef, handler);
    cleanups.push(() => off(activitiesRef, 'value', handler));
  }

  return () => cleanups.forEach((fn) => fn());
}

// ═══════════════════════════════════════════════
// 2. REMOTE TASK ASSIGNMENTS (Admin → Student)
// ═══════════════════════════════════════════════

/**
 * Get stored remote tasks from localStorage (cache)
 */
export function getStoredRemoteTasks(): RemoteTaskAssignment[] {
  try {
    const raw = localStorage.getItem(STORAGE_TASKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.error(e); }
  return [];
}

/**
 * Broadcast a remote task assignment from Admin to Student
 * Writes to: Firebase + localStorage + BroadcastChannel
 */
export function broadcastRemoteTask(
  taskData: Omit<RemoteTaskAssignment, 'id' | 'timestamp' | 'completed'>
): RemoteTaskAssignment {
  const newTask: RemoteTaskAssignment = {
    ...taskData,
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    completed: false,
  };

  try {
    // 1. localStorage
    const current = getStoredRemoteTasks();
    localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify([newTask, ...current]));

    // 2. BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'REMOTE_TASK_ASSIGNED', payload: newTask });
    }

    // 3. Firebase (cross-device!)
    const settings = getCloudDBSettings();
    if (settings.enabled && settings.roomCode) {
      const taskRef = ref(database, `rooms/${settings.roomCode}/tasks/${newTask.id}`);
      set(taskRef, newTask).catch((err) =>
        console.warn('Firebase task push failed:', err)
      );
    }
  } catch (e) {
    console.error('Error assigning remote task:', e);
  }

  return newTask;
}

/**
 * Subscribe to remote task assignments from Firebase + BroadcastChannel
 */
export function subscribeToRemoteTasks(
  callback: (task: RemoteTaskAssignment) => void
): () => void {
  const cleanups: (() => void)[] = [];

  // 1. BroadcastChannel
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'REMOTE_TASK_ASSIGNED') {
      callback(e.data.payload);
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
    cleanups.push(() => broadcastChannel?.removeEventListener('message', handleBroadcastMessage));
  }

  // 2. localStorage storage event
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_TASKS_KEY && e.newValue) {
      try {
        const tasks = JSON.parse(e.newValue);
        if (Array.isArray(tasks) && tasks.length > 0) callback(tasks[0]);
      } catch (_) {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
    cleanups.push(() => window.removeEventListener('storage', handleStorageEvent));
  }

  // 3. Firebase (cross-device!)
  const settings = getCloudDBSettings();
  if (settings.enabled && settings.roomCode) {
    const tasksRef = ref(database, `rooms/${settings.roomCode}/tasks`);
    let isInitialLoad = true;
    const handler = (snapshot: DataSnapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (typeof data === 'object' && data !== null) {
          const tasks = Object.values(data) as RemoteTaskAssignment[];
          const pending = tasks
            .filter((t) => !t.completed)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          if (pending[0]) {
            const stored = getStoredRemoteTasks();
            if (!stored.find((s) => s.id === pending[0].id)) {
              callback(pending[0]);
              localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify([pending[0], ...stored]));
            }
          }
        }
      }
    };
    onValue(tasksRef, handler);
    cleanups.push(() => off(tasksRef, 'value', handler));
  }

  return () => cleanups.forEach((fn) => fn());
}

/**
 * Mark a remote task as completed (both locally and on Firebase)
 */
export function markRemoteTaskCompleted(taskId: string): void {
  try {
    // localStorage
    const current = getStoredRemoteTasks();
    const updated = current.map((t) => (t.id === taskId ? { ...t, completed: true } : t));
    localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(updated));

    // Firebase
    const settings = getCloudDBSettings();
    if (settings.enabled && settings.roomCode) {
      const taskRef = ref(database, `rooms/${settings.roomCode}/tasks/${taskId}/completed`);
      set(taskRef, true).catch((err) =>
        console.warn('Firebase task complete update failed:', err)
      );
    }
  } catch (e) {
    console.error(e);
  }
}

// ═══════════════════════════════════════════════
// 3. REMOTE PINGS / REALTIME MESSAGES (Admin → Student Instant Messages)
// ═══════════════════════════════════════════════

const STORAGE_PINGS_KEY = 'edu10_remote_pings';

export function sendRemotePing(
  pingData: Omit<RemotePing, 'id' | 'timestamp'>
): RemotePing {
  const newPing: RemotePing = {
    ...pingData,
    id: `ping_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. localStorage cache
    const currentRaw = localStorage.getItem(STORAGE_PINGS_KEY);
    const current = currentRaw ? JSON.parse(currentRaw) : [];
    localStorage.setItem(STORAGE_PINGS_KEY, JSON.stringify([newPing, ...current].slice(0, 30)));

    // 2. BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'REMOTE_PING_SENT', payload: newPing });
    }

    // 3. Firebase RTDB
    const settings = getCloudDBSettings();
    if (settings.enabled && settings.roomCode) {
      const pingsRef = ref(database, `rooms/${settings.roomCode}/pings`);
      push(pingsRef, newPing).catch((err) =>
        console.warn('Firebase ping push failed:', err)
      );
    }
  } catch (e) {
    console.error('Error sending remote ping:', e);
  }

  return newPing;
}

export function subscribeToRemotePings(
  callback: (ping: RemotePing) => void
): () => void {
  const cleanups: (() => void)[] = [];

  // BroadcastChannel
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'REMOTE_PING_SENT') {
      callback(e.data.payload);
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
    cleanups.push(() => broadcastChannel?.removeEventListener('message', handleBroadcastMessage));
  }

  // Firebase
  const settings = getCloudDBSettings();
  if (settings.enabled && settings.roomCode) {
    const pingsRef = ref(database, `rooms/${settings.roomCode}/pings`);
    let isInitialLoad = true;
    const handler = (snapshot: DataSnapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (typeof data === 'object' && data !== null) {
          const pings = Object.values(data) as RemotePing[];
          const sorted = pings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          if (sorted[0]) {
            callback(sorted[0]);
          }
        }
      }
    };
    onValue(pingsRef, handler);
    cleanups.push(() => off(pingsRef, 'value', handler));
  }

  return () => cleanups.forEach((fn) => fn());
}
