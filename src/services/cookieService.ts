/**
 * Cookie & Session Storage Service
 * Synchronizes User Authentication, Active Subject, and App State via Cookies & Reactive Event Bus
 */

export function setCookie(name: string, value: string, days: number = 30): void {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('Set cookie error:', e);
  }
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const nameEQ = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      c = c.trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
  } catch (e) {
    console.warn('Get cookie error:', e);
  }
  return null;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('Delete cookie error:', e);
  }
}

// ═══════════════════════════════════════════════
// GLOBAL REACTIVE STATE BUS (Zero-Reload Synchronization)
// ═══════════════════════════════════════════════

export type SyncEventType =
  | 'USER_CHANGED'
  | 'SUBJECT_CHANGED'
  | 'EXAMS_UPDATED'
  | 'QUESTIONS_UPDATED'
  | 'TASKS_UPDATED'
  | 'STUDENT_DATA_UPDATED'
  | 'ROOM_CODE_CHANGED';

const SYNC_CHANNEL_NAME = 'edu10_global_sync_channel';

let syncBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncBroadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported for sync bus');
}

/**
 * Dispatch a sync event across all components in the current window and all other open tabs
 */
export function dispatchGlobalSync(type: SyncEventType, payload?: any): void {
  if (typeof window === 'undefined') return;

  // 1. In-tab CustomEvent
  window.dispatchEvent(
    new CustomEvent('edu10_sync_bus', {
      detail: { type, payload, timestamp: Date.now() },
    })
  );

  // 2. Cross-tab BroadcastChannel
  if (syncBroadcastChannel) {
    try {
      syncBroadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch (e) {
      console.warn('BroadcastChannel postMessage error:', e);
    }
  }
}

/**
 * Subscribe to global sync events (works in same tab and across different tabs)
 */
export function subscribeToGlobalSync(
  callback: (event: { type: SyncEventType; payload?: any }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Same-window CustomEvent listener
  const handleCustomEvent = (e: Event) => {
    const customEvt = e as CustomEvent;
    if (customEvt && customEvt.detail) {
      callback(customEvt.detail);
    }
  };
  window.addEventListener('edu10_sync_bus', handleCustomEvent);

  // 2. Cross-tab BroadcastChannel listener
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type) {
      callback(e.data);
    }
  };
  if (syncBroadcastChannel) {
    syncBroadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  // 3. Storage event listener (fallback for browsers without BroadcastChannel)
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'edu10_currentUser') {
      callback({ type: 'USER_CHANGED' });
    } else if (e.key === 'edu10_current_subject') {
      callback({ type: 'SUBJECT_CHANGED' });
    } else if (e.key === 'edu10_custom_exams' || e.key === 'edu10_global_custom_exams') {
      callback({ type: 'EXAMS_UPDATED' });
    } else if (e.key === 'edu10_custom_questions') {
      callback({ type: 'QUESTIONS_UPDATED' });
    } else if (e.key === 'edu10_remote_tasks') {
      callback({ type: 'TASKS_UPDATED' });
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener('edu10_sync_bus', handleCustomEvent);
    if (syncBroadcastChannel) {
      syncBroadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);
  };
}
