import { RealtimeActivityEvent, RemoteTaskAssignment } from '../types';

const CHANNEL_NAME = 'edu10_realtime_channel';
const STORAGE_ACTIVITIES_KEY = 'edu10_realtime_activities';
const STORAGE_TASKS_KEY = 'edu10_remote_tasks';

// 1. Initial Mock Recent Activities so the feed is vivid on first load
const INITIAL_DEMO_ACTIVITIES: RealtimeActivityEvent[] = [
  {
    id: 'act_demo_1',
    userId: 'user_student_1',
    userName: 'Nguyễn Hoàng Hà (Em trai)',
    avatarColor: 'bg-indigo-600',
    subject: 'math',
    type: 'exam_submitted',
    title: 'Vừa hoàn thành bài thi thử Môn Toán',
    detail: 'Đạt 8.5/10 điểm (10/12 câu đúng) • Đề Chuẩn Sở GD&ĐT Số 01',
    score: 8.5,
    examTitle: 'Đề Thi Thử Vào Lớp 10 Môn Toán - Đề Chuẩn Số 01',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: 'act_demo_2',
    userId: 'user_student_1',
    userName: 'Nguyễn Hoàng Hà (Em trai)',
    avatarColor: 'bg-indigo-600',
    subject: 'math',
    type: 'question_wrong',
    title: 'Làm sai câu hỏi Bất đẳng thức',
    detail: 'Câu hỏi BĐT Cauchy AM-GM tìm Min P = x + 9/x',
    topicName: 'Bất đẳng thức & Cực trị',
    timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
  },
  {
    id: 'act_demo_3',
    userId: 'user_student_2',
    userName: 'Lê Phương Linh',
    avatarColor: 'bg-rose-600',
    subject: 'english',
    type: 'exam_submitted',
    title: 'Vừa hoàn thành bài thi Tiếng Anh 9.5đ',
    detail: 'Đạt 9.5/10 điểm (19/20 câu đúng) • Mục tiêu Chuyên Ams',
    score: 9.5,
    examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 - Đề Chuẩn Số 01',
    timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
  },
  {
    id: 'act_demo_4',
    userId: 'user_student_1',
    userName: 'Nguyễn Hoàng Hà (Em trai)',
    avatarColor: 'bg-indigo-600',
    subject: 'math',
    type: 'flashcard_mastered',
    title: 'Đã thuộc thẻ công thức Vi-ét',
    detail: 'Đã thuộc công thức x1 + x2 = -b/a và x1.x2 = c/a',
    timestamp: new Date(Date.now() - 110 * 60000).toISOString(),
  },
];

// BroadcastChannel instance (singleton)
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported, falling back to storage events');
}

/**
 * Get all stored real-time activity events
 */
export function getStoredRealtimeActivities(): RealtimeActivityEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_DEMO_ACTIVITIES;
}

/**
 * Save and broadcast a new real-time student activity event
 */
export function logAndBroadcastActivity(eventData: Omit<RealtimeActivityEvent, 'id' | 'timestamp'>): RealtimeActivityEvent {
  const newEvent: RealtimeActivityEvent = {
    ...eventData,
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const current = getStoredRealtimeActivities();
    const updated = [newEvent, ...current].slice(0, 50); // Keep latest 50 events
    localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(updated));

    // Also trigger storage event for cross-window sync
    localStorage.setItem('edu10_sync_pulse', `${Date.now()}`);

    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'ACTIVITY_EVENT',
        payload: newEvent,
      });
    }
  } catch (e) {
    console.error('Error logging activity:', e);
  }

  return newEvent;
}

/**
 * Subscribe to real-time activities across all tabs/windows
 */
export function subscribeToRealtimeActivities(callback: (event: RealtimeActivityEvent) => void): () => void {
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'ACTIVITY_EVENT') {
      callback(e.data.payload);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_ACTIVITIES_KEY && e.newValue) {
      try {
        const events = JSON.parse(e.newValue);
        if (Array.isArray(events) && events.length > 0) {
          callback(events[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}

/**
 * Remote Task Assignment (Assigning exam/task from Admin to Student)
 */
export function getStoredRemoteTasks(): RemoteTaskAssignment[] {
  try {
    const raw = localStorage.getItem(STORAGE_TASKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function broadcastRemoteTask(taskData: Omit<RemoteTaskAssignment, 'id' | 'timestamp' | 'completed'>): RemoteTaskAssignment {
  const newTask: RemoteTaskAssignment = {
    ...taskData,
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    completed: false,
  };

  try {
    const current = getStoredRemoteTasks();
    const updated = [newTask, ...current];
    localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(updated));
    localStorage.setItem('edu10_sync_task_pulse', `${Date.now()}`);

    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'REMOTE_TASK_ASSIGNED',
        payload: newTask,
      });
    }
  } catch (e) {
    console.error('Error assigning remote task:', e);
  }

  return newTask;
}

export function subscribeToRemoteTasks(callback: (task: RemoteTaskAssignment) => void): () => void {
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'REMOTE_TASK_ASSIGNED') {
      callback(e.data.payload);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_TASKS_KEY && e.newValue) {
      try {
        const tasks = JSON.parse(e.newValue);
        if (Array.isArray(tasks) && tasks.length > 0) {
          callback(tasks[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}

export function markRemoteTaskCompleted(taskId: string): void {
  try {
    const current = getStoredRemoteTasks();
    const updated = current.map((t) => (t.id === taskId ? { ...t, completed: true } : t));
    localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(updated));
    localStorage.setItem('edu10_sync_task_pulse', `${Date.now()}`);
  } catch (e) {
    console.error(e);
  }
}
