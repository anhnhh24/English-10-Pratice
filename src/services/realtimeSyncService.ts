/**
 * Realtime Activity Sync Service — Firebase + BroadcastChannel
 * Cross-device real-time monitoring of student activities
 */
import { database, ref, set, get, onValue, push, off, onChildAdded, query, limitToLast } from './firebaseConfig';
import { getCloudDBSettings } from './cloudSyncService';
import { dispatchGlobalSync, subscribeToGlobalSync } from './cookieService';
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
 * Fetch latest activities directly from Firebase Realtime Database
 */
export async function fetchLiveActivitiesFromFirebase(roomCode?: string): Promise<RealtimeActivityEvent[]> {
  try {
    const settings = getCloudDBSettings();
    const targetRoom = roomCode || settings.roomCode;
    if (!targetRoom) return getStoredRealtimeActivities();

    const activitiesRef = ref(database, `rooms/${targetRoom}/activities`);
    const q = query(activitiesRef, limitToLast(50));
    const snapshot = await get(q);
    if (snapshot.exists()) {
      const val = snapshot.val();
      const list: RealtimeActivityEvent[] = Object.values(val);
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(list.slice(0, 50)));
      return list;
    }
  } catch (e) {
    console.error('Error fetching live activities from Firebase:', e);
  }
  return getStoredRealtimeActivities();
}

/**
 * Subscribe to real-time activities from Firebase + BroadcastChannel
 * Returns unsubscribe function.
 */
export function subscribeToRealtimeActivities(
  callback: (event: RealtimeActivityEvent) => void
): () => void {
  const cleanups: (() => void)[] = [];
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

  // 2. Firebase Realtime listener (CROSS-DEVICE)
  const settings = getCloudDBSettings();
  if (settings.enabled && settings.roomCode) {
    const activitiesRef = ref(database, `rooms/${settings.roomCode}/activities`);

    // Initial load from Firebase to populate history
    get(query(activitiesRef, limitToLast(50))).then((snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: RealtimeActivityEvent[] = Object.values(val);
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        list.forEach((act) => safeCallback(act));
      }
    }).catch((err) => console.warn('Initial activities fetch failed:', err));

    // Listen for ongoing new pushes
    const activitiesQuery = query(activitiesRef, limitToLast(20));
    const handler = (snapshot: DataSnapshot) => {
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
  taskData: Omit<RemoteTaskAssignment, 'id' | 'timestamp' | 'completed' | 'status'>
): RemoteTaskAssignment {
  const newTask: RemoteTaskAssignment = {
    ...taskData,
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    completed: false,
    status: 'pending',
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

    // 5. Global Reactive Bus
    dispatchGlobalSync('TASKS_UPDATED', newTask);
  } catch (e) {
    console.error('Error assigning remote task:', e);
  }

  return newTask;
}

/**
 * Subscribe to remote task assignments from Firebase + BroadcastChannel + GlobalSyncBus
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
    if (e.data && (e.data.type === 'REMOTE_TASK_ASSIGNED' || e.data.type === 'REMOTE_TASK_UPDATED')) {
      safeCallback(e.data.payload);
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
    cleanups.push(() => broadcastChannel?.removeEventListener('message', handleBroadcastMessage));
  }

  // 1c. Global Reactive Sync Bus
  const unsubSync = subscribeToGlobalSync((event) => {
    if (event.type === 'TASKS_UPDATED' && event.payload) {
      safeCallback(event.payload);
    }
  });
  cleanups.push(unsubSync);

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
 * Generic update for a remote task (persists locally and syncs)
 */
export function updateRemoteTask(
  taskId: string,
  updates: Partial<RemoteTaskAssignment>
): RemoteTaskAssignment | null {
  try {
    const current = getStoredRemoteTasks();
    const index = current.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const updatedTask: RemoteTaskAssignment = {
      ...current[index],
      ...updates,
    };

    const updatedList = [...current];
    updatedList[index] = updatedTask;
    localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(updatedList));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu10_task_event', { detail: updatedTask }));
    }

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'REMOTE_TASK_UPDATED', payload: updatedTask });
    }

    const settings = getCloudDBSettings();
    if (settings.enabled && settings.roomCode) {
      const taskRef = ref(database, `rooms/${settings.roomCode}/tasks/${taskId}`);
      set(taskRef, updatedTask).catch((err) =>
        console.warn('Firebase task update failed:', err)
      );
    }

    dispatchGlobalSync('TASKS_UPDATED', updatedTask);
    return updatedTask;
  } catch (e) {
    console.error('Error updating task:', e);
    return null;
  }
}

/**
 * Student submits completed task (sets status: 'submitted')
 */
export function studentSubmitRemoteTask(
  taskId: string,
  payload: {
    studentName?: string;
    score?: number;
    attemptId?: string;
    studentNote?: string;
  } = {}
): void {
  const current = getStoredRemoteTasks();
  const target = current.find((t) => t.id === taskId);

  updateRemoteTask(taskId, {
    completed: true,
    status: 'submitted',
    studentCompletedAt: new Date().toISOString(),
    studentScore: payload.score,
    studentAttemptId: payload.attemptId,
    studentNote: payload.studentNote,
  });

  // Broadcast activity so supervisor sees instant toast notification
  if (target) {
    logAndBroadcastActivity({
      userId: target.recipientUserId || 'student',
      userName: payload.studentName || 'Học sinh',
      subject: target.subject,
      type: 'task_submitted',
      severity: 'positive',
      title: `Hoàn thành nhiệm vụ: ${target.title}`,
      detail: payload.score !== undefined
        ? `Đã nộp bài với kết quả ${payload.score.toFixed(1)}/10đ`
        : payload.studentNote || 'Học sinh đã nộp và chờ xác nhận',
      score: payload.score,
      attemptId: payload.attemptId,
      examTitle: target.title,
    });
  }
}

/**
 * Admin / Teacher confirms completed task
 */
export function adminConfirmRemoteTask(
  taskId: string,
  feedback?: string,
  adminName: string = 'Người giám sát'
): void {
  const current = getStoredRemoteTasks();
  const target = current.find((t) => t.id === taskId);

  updateRemoteTask(taskId, {
    completed: true,
    status: 'confirmed',
    confirmedByAdminAt: new Date().toISOString(),
    adminFeedback: feedback,
  });

  // Send real-time confirmation ping to the student
  if (target && target.recipientUserId) {
    sendRemotePing({
      senderName: adminName,
      recipientUserId: target.recipientUserId,
      pingType: 'encouragement',
      message: feedback
        ? `🎉 Đã duyệt hoàn thành bài "${target.title}": ${feedback}`
        : `🎉 Đã xác nhận hoàn thành bài tập "${target.title}"! Em làm rất tốt!`,
    });
  }
}

/**
 * Admin / Teacher requests redo for a task
 */
export function adminRequestRemoteTaskRedo(
  taskId: string,
  feedback: string,
  adminName: string = 'Người giám sát'
): void {
  const current = getStoredRemoteTasks();
  const target = current.find((t) => t.id === taskId);

  updateRemoteTask(taskId, {
    completed: false,
    status: 'redo',
    adminFeedback: feedback,
  });

  if (target && target.recipientUserId) {
    sendRemotePing({
      senderName: adminName,
      recipientUserId: target.recipientUserId,
      pingType: 'warning',
      message: `⚠️ Yêu cầu làm lại bài "${target.title}": ${feedback || 'Em hãy xem lại các lỗi sai và làm lại nhé!'}`,
    });
  }
}

/**
 * Update deadline for a task
 */
export function updateRemoteTaskDeadline(taskId: string, newDeadline: string): void {
  updateRemoteTask(taskId, { targetDeadline: newDeadline });
}

/**
 * Mark a remote task as completed (both locally and on Firebase)
 */
export function markRemoteTaskCompleted(taskId: string): void {
  updateRemoteTask(taskId, {
    completed: true,
    status: 'confirmed',
    confirmedByAdminAt: new Date().toISOString(),
  });
}

/**
 * Toggle completed state of a remote task
 */
export function toggleRemoteTaskCompleted(taskId: string): boolean {
  try {
    const current = getStoredRemoteTasks();
    const target = current.find((t) => t.id === taskId);
    const isCompleted = target?.completed || target?.status === 'confirmed' || target?.status === 'submitted';
    const newStatus = !isCompleted;

    updateRemoteTask(taskId, {
      completed: newStatus,
      status: newStatus ? 'confirmed' : 'pending',
      confirmedByAdminAt: newStatus ? new Date().toISOString() : undefined,
    });

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

    dispatchGlobalSync('TASKS_UPDATED');
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
