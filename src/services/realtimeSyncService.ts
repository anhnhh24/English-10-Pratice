/**
 * Realtime Activity Sync Service — Firebase + BroadcastChannel
 * Cross-device real-time monitoring of student activities
 */
import { database, ref, set, get, onValue, push, off, onChildAdded, query, limitToLast } from './firebaseConfig';
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

    // 2. Same-tab CustomEvent (BroadcastChannel không fire cho chính tab đó)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu10_activity_event', { detail: newEvent }));
    }

    // 3. BroadcastChannel (cross-tab same-browser)
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'ACTIVITY_EVENT', payload: newEvent });
    }

    // 4. Firebase Realtime Database (cross-device!)
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
 * Uses onChildAdded with limitToLast(1) so only NEW children after subscription are received.
 * Returns unsubscribe function.
 */
export function subscribeToRealtimeActivities(
  callback: (event: RealtimeActivityEvent) => void
): () => void {
  const cleanups: (() => void)[] = [];

  // Track IDs seen in this session to prevent duplicates across channels
  const seenIds = new Set<string>();

  const safeCallback = (event: RealtimeActivityEvent) => {
    if (!event?.id) return;
    if (seenIds.has(event.id)) return;
    seenIds.add(event.id);
    callback(event);
  };

  // 1a. Same-tab window CustomEvent listener
  const handleWindowEvent = (e: Event) => {
    safeCallback((e as CustomEvent<RealtimeActivityEvent>).detail);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('edu10_activity_event', handleWindowEvent);
    cleanups.push(() => window.removeEventListener('edu10_activity_event', handleWindowEvent));
  }

  // 1b. BroadcastChannel listener (cross-tab, same-browser)
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'ACTIVITY_EVENT') {
      safeCallback(e.data.payload);
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
    cleanups.push(() => broadcastChannel?.removeEventListener('message', handleBroadcastMessage));
  }

  // 2. Firebase Realtime listener (CROSS-DEVICE!)
  // Use onChildAdded + limitToLast(1): Firebase will deliver existing latest child once on connect,
  // then fire for each new child pushed afterwards — no manual isInitialLoad hack needed.
  const settings = getCloudDBSettings();
  if (settings.enabled && settings.roomCode) {
    const activitiesRef = ref(database, `rooms/${settings.roomCode}/activities`);
    // limitToLast(1) → on first connect, delivers only the last existing child (we skip it),
    // then fires for every new push() call.
    const activitiesQuery = query(activitiesRef, limitToLast(1));

    let isFirstChild = true; // skip the initial "last existing" child on connect
    const handler = (snapshot: DataSnapshot) => {
      if (isFirstChild) {
        isFirstChild = false;
        return; // skip the one existing record delivered on subscription
      }
      if (snapshot.exists()) {
        const data = snapshot.val() as RealtimeActivityEvent;
        safeCallback(data);
        // Cache locally
        const stored = getStoredRealtimeActivities();
        if (!stored.find((s) => s.id === data.id)) {
          localStorage.setItem(
            STORAGE_ACTIVITIES_KEY,
            JSON.stringify([data, ...stored].slice(0, 50))
          );
        }
      }
    };

    onChildAdded(activitiesQuery, handler);
    cleanups.push(() => off(activitiesQuery as any, 'child_added', handler));
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

    // 2. Same-tab CustomEvent
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu10_task_event', { detail: newTask }));
    }

    // 3. BroadcastChannel (cross-tab)
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'REMOTE_TASK_ASSIGNED', payload: newTask });
    }

    // 4. Firebase (cross-device!)
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
 * Uses onChildAdded to only receive NEW tasks.
 */
export function subscribeToRemoteTasks(
  callback: (task: RemoteTaskAssignment) => void
): () => void {
  const cleanups: (() => void)[] = [];
  const seenIds = new Set<string>();

  const safeCallback = (task: RemoteTaskAssignment) => {
    if (!task?.id) return;
    if (seenIds.has(task.id)) return;
    seenIds.add(task.id);
    callback(task);
  };

  // 1a. Same-tab CustomEvent
  const handleWindowEvent = (e: Event) => {
    safeCallback((e as CustomEvent<RemoteTaskAssignment>).detail);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('edu10_task_event', handleWindowEvent);
    cleanups.push(() => window.removeEventListener('edu10_task_event', handleWindowEvent));
  }

  // 1b. BroadcastChannel (cross-tab)
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'REMOTE_TASK_ASSIGNED') {
      safeCallback(e.data.payload);
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
    cleanups.push(() => broadcastChannel?.removeEventListener('message', handleBroadcastMessage));
  }

  // 2. Firebase (cross-device!) — subscribe to new tasks only
  const settings = getCloudDBSettings();
  if (settings.enabled && settings.roomCode) {
    const tasksRef = ref(database, `rooms/${settings.roomCode}/tasks`);
    const tasksQuery = query(tasksRef, limitToLast(1));

    let isFirstChild = true;
    const handler = (snapshot: DataSnapshot) => {
      if (isFirstChild) {
        isFirstChild = false;
        return;
      }
      if (snapshot.exists()) {
        const task = snapshot.val() as RemoteTaskAssignment;
        if (!task.completed) {
          safeCallback(task);
          const stored = getStoredRemoteTasks();
          if (!stored.find((s) => s.id === task.id)) {
            localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify([task, ...stored]));
          }
        }
      }
    };

    onChildAdded(tasksQuery, handler);
    cleanups.push(() => off(tasksQuery as any, 'child_added', handler));
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

/**
 * Toggle completed state of a remote task
 */
export function toggleRemoteTaskCompleted(taskId: string): boolean {
  try {
    const current = getStoredRemoteTasks();
    const target = current.find((t) => t.id === taskId);
    const newStatus = target ? !target.completed : true;
    const updated = current.map((t) => (t.id === taskId ? { ...t, completed: newStatus } : t));
    localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(updated));

    const settings = getCloudDBSettings();
    if (settings.enabled && settings.roomCode) {
      const taskRef = ref(database, `rooms/${settings.roomCode}/tasks/${taskId}/completed`);
      set(taskRef, newStatus).catch((err) =>
        console.warn('Firebase task complete update failed:', err)
      );
    }
    return newStatus;
  } catch (e) {
    console.error(e);
    return false;
  }
}

/**
 * Delete / Revoke an assigned remote task
 */
export function deleteRemoteTask(taskId: string): void {
  try {
    const current = getStoredRemoteTasks();
    const updated = current.filter((t) => t.id !== taskId);
    localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(updated));

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'REMOTE_TASK_DELETED', payload: { id: taskId } });
    }

    const settings = getCloudDBSettings();
    if (settings.enabled && settings.roomCode) {
      const taskRef = ref(database, `rooms/${settings.roomCode}/tasks/${taskId}`);
      set(taskRef, null).catch((err) =>
        console.warn('Firebase task delete failed:', err)
      );
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * Delete all remote tasks associated with a deleted exam ID
 */
export function deleteRemoteTasksByExamId(examId: string): void {
  try {
    const current = getStoredRemoteTasks();
    const updated = current.filter((t) => t.assignedExamId !== examId);
    localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(updated));

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'REMOTE_TASKS_RESET', payload: updated });
    }

    const settings = getCloudDBSettings();
    if (settings.enabled && settings.roomCode) {
      current.filter((t) => t.assignedExamId === examId).forEach((t) => {
        const taskRef = ref(database, `rooms/${settings.roomCode}/tasks/${t.id}`);
        set(taskRef, null).catch(() => {});
      });
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

    // 2. Same-tab CustomEvent
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu10_ping_event', { detail: newPing }));
    }

    // 3. BroadcastChannel (cross-tab)
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'REMOTE_PING_SENT', payload: newPing });
    }

    // 4. Firebase RTDB
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
  const seenIds = new Set<string>();

  const safeCallback = (ping: RemotePing) => {
    if (!ping?.id) return;
    if (seenIds.has(ping.id)) return;
    seenIds.add(ping.id);
    callback(ping);
  };

  // Same-tab CustomEvent
  const handleWindowEvent = (e: Event) => {
    safeCallback((e as CustomEvent<RemotePing>).detail);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('edu10_ping_event', handleWindowEvent);
    cleanups.push(() => window.removeEventListener('edu10_ping_event', handleWindowEvent));
  }

  // BroadcastChannel (cross-tab)
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'REMOTE_PING_SENT') {
      safeCallback(e.data.payload);
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
    cleanups.push(() => broadcastChannel?.removeEventListener('message', handleBroadcastMessage));
  }

  // Firebase — onChildAdded for new pings only
  const settings = getCloudDBSettings();
  if (settings.enabled && settings.roomCode) {
    const pingsRef = ref(database, `rooms/${settings.roomCode}/pings`);
    const pingsQuery = query(pingsRef, limitToLast(1));

    let isFirstChild = true;
    const handler = (snapshot: DataSnapshot) => {
      if (isFirstChild) {
        isFirstChild = false;
        return;
      }
      if (snapshot.exists()) {
        safeCallback(snapshot.val() as RemotePing);
      }
    };

    onChildAdded(pingsQuery, handler);
    cleanups.push(() => off(pingsQuery as any, 'child_added', handler));
  }

  return () => cleanups.forEach((fn) => fn());
}
