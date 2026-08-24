/**
 * Cloud Database Synchronization Service — Firebase Realtime Database
 * Real cross-device sync between guardian (admin) and student (Hoàng Hà)
 * Persistent online storage for Exams, Question Bank, Test Attempts, and Progress
 */
import { database, ref, set, get, onValue, off, remove, update } from './firebaseConfig';
import type { DataSnapshot } from 'firebase/database';
import { Exam, Question, ExamAttempt } from '../types';

import { dispatchGlobalSync } from './cookieService';

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
    if (settings.roomCode && settings.roomCode !== current.roomCode) {
      dispatchGlobalSync('ROOM_CODE_CHANGED', updated.roomCode);
    }
  } catch (e) {
    console.error(e);
  }
  return updated;
}

/**
 * Helper to strip undefined values so Firebase Realtime Database SDK never throws 'contains undefined'
 */
function cleanForFirebase<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, value) => (value === undefined ? null : value)));
}

// ═════════════════════════════════════════════════════════════
// 1. STUDENT PROGRESS & ATTEMPTS DB SYNC
// ═════════════════════════════════════════════════════════════

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

  const payload = cleanForFirebase({
    userId,
    userProfile: userProfile || null,
    userData,
    updatedAt: new Date().toISOString(),
    deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'Web App',
  });

  try {
    const dbRef = ref(database, `rooms/${settings.roomCode}/students/${userId}`);
    await set(dbRef, payload);
    saveCloudDBSettings({ lastSyncTimestamp: new Date().toISOString() });
    return { success: true, message: '✅ Đã đồng bộ lên Firebase Realtime DB thành công!' };
  } catch (err: any) {
    console.error('Firebase push error:', err);
    try {
      localStorage.setItem(`edu10_cloud_backup_${settings.roomCode}_${userId}`, JSON.stringify(payload));
    } catch (_) {}
    return { success: false, message: `❌ Lỗi đồng bộ: ${err.message || 'Không kết nối được Firebase'}` };
  }
}

/**
 * Save single exam attempt directly to online DB
 */
export async function saveExamAttemptToOnlineDB(
  userId: string,
  attempt: ExamAttempt
): Promise<{ success: boolean; message: string }> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) {
    return { success: false, message: 'Cloud DB chưa được kích hoạt' };
  }

  try {
    // 1. Save to global room attempts list
    const attemptRef = ref(database, `rooms/${settings.roomCode}/examAttempts/${attempt.id}`);
    await set(attemptRef, cleanForFirebase({
      ...attempt,
      userId,
      savedAt: new Date().toISOString(),
    }));

    // 2. Also save to user specific attempts map
    const userAttemptRef = ref(database, `rooms/${settings.roomCode}/students/${userId}/userData/examAttemptsMap/${attempt.id}`);
    await set(userAttemptRef, cleanForFirebase(attempt));

    return { success: true, message: 'Đã lưu lịch sử làm bài vào DB thành công' };
  } catch (err: any) {
    console.error('Firebase saveExamAttempt error:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Subscribe to real-time changes for a specific student on Firebase
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

// ═════════════════════════════════════════════════════════════
// 2. EXAMS DB SYNC (Save, Update, Delete & Subscribe)
// ═════════════════════════════════════════════════════════════

/**
 * Save or update an exam on Firebase Realtime Database
 */
export async function saveExamToOnlineDB(exam: Exam): Promise<{ success: boolean; message: string }> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) {
    return { success: false, message: 'Cloud DB chưa được kích hoạt' };
  }

  try {
    const examRef = ref(database, `rooms/${settings.roomCode}/exams/${exam.id}`);
    await set(examRef, cleanForFirebase({
      ...exam,
      updatedAt: new Date().toISOString(),
    }));
    return { success: true, message: 'Đã lưu đề thi lên DB thành công' };
  } catch (err: any) {
    console.error('Firebase saveExam error:', err);
    return { success: false, message: err.message || 'Lỗi lưu đề thi lên DB' };
  }
}

/**
 * Delete an exam from Firebase Realtime Database
 */
export async function deleteExamFromOnlineDB(examId: string): Promise<{ success: boolean; message: string }> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) {
    return { success: false, message: 'Cloud DB chưa được kích hoạt' };
  }

  try {
    const examRef = ref(database, `rooms/${settings.roomCode}/exams/${examId}`);
    await remove(examRef);
    return { success: true, message: 'Đã xóa đề thi trên DB' };
  } catch (err: any) {
    console.error('Firebase deleteExam error:', err);
    return { success: false, message: err.message || 'Lỗi xóa đề thi trên DB' };
  }
}

/**
 * Subscribe to real-time changes for exams from Firebase Realtime DB
 */
export function subscribeToExamsFromOnlineDB(
  callback: (exams: Exam[]) => void
): () => void {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) return () => {};

  const examsRef = ref(database, `rooms/${settings.roomCode}/exams`);
  const handler = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        const examsList = Object.values(data) as Exam[];
        callback(examsList);
      }
    } else {
      callback([]);
    }
  };

  onValue(examsRef, handler);
  return () => off(examsRef, 'value', handler);
}

// ═════════════════════════════════════════════════════════════
// 3. QUESTIONS DB SYNC (Custom / Imported questions)
// ═════════════════════════════════════════════════════════════

/**
 * Save custom question to Firebase Realtime Database
 */
export async function saveQuestionToOnlineDB(question: Question): Promise<{ success: boolean; message: string }> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) {
    return { success: false, message: 'Cloud DB chưa được kích hoạt' };
  }

  try {
    const qRef = ref(database, `rooms/${settings.roomCode}/questions/${question.id}`);
    await set(qRef, cleanForFirebase({
      ...question,
      updatedAt: new Date().toISOString(),
    }));
    return { success: true, message: 'Đã lưu câu hỏi lên DB' };
  } catch (err: any) {
    console.error('Firebase saveQuestion error:', err);
    return { success: false, message: err.message || 'Lỗi lưu câu hỏi lên DB' };
  }
}

/**
 * Save multiple custom questions to Firebase Realtime Database in a single update batch
 */
export async function saveQuestionsToOnlineDB(questions: Question[]): Promise<{ success: boolean; message: string }> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) {
    return { success: false, message: 'Cloud DB chưa được kích hoạt' };
  }

  if (questions.length === 0) {
    return { success: true, message: 'Không có câu hỏi nào để lưu' };
  }

  try {
    const updates: Record<string, any> = {};
    const timestamp = new Date().toISOString();
    questions.forEach((q) => {
      updates[`rooms/${settings.roomCode}/questions/${q.id}`] = cleanForFirebase({
        ...q,
        updatedAt: timestamp,
      });
    });
    await update(ref(database), updates);
    return { success: true, message: `Đã lưu ${questions.length} câu hỏi lên DB thành công` };
  } catch (err: any) {
    console.error('Firebase saveQuestions error:', err);
    return { success: false, message: err.message || 'Lỗi lưu danh sách câu hỏi lên DB' };
  }
}

/**
 * Delete custom question from Firebase Realtime Database
 */
export async function deleteQuestionFromOnlineDB(questionId: string): Promise<{ success: boolean; message: string }> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) {
    return { success: false, message: 'Cloud DB chưa được kích hoạt' };
  }

  try {
    const qRef = ref(database, `rooms/${settings.roomCode}/questions/${questionId}`);
    await remove(qRef);
    return { success: true, message: 'Đã xóa câu hỏi trên DB' };
  } catch (err: any) {
    console.error('Firebase deleteQuestion error:', err);
    return { success: false, message: err.message || 'Lỗi xóa câu hỏi' };
  }
}

/**
 * Subscribe to real-time changes for custom questions
 */
export function subscribeToQuestionsFromOnlineDB(
  callback: (questions: Question[]) => void
): () => void {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) return () => {};

  const qRef = ref(database, `rooms/${settings.roomCode}/questions`);
  const handler = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        const questionsList = Object.values(data) as Question[];
        callback(questionsList);
      }
    } else {
      callback([]);
    }
  };

  onValue(qRef, handler);
  return () => off(qRef, 'value', handler);
}

// ═════════════════════════════════════════════════════════════
// 4. CLEAR DATA & CONNECTION HELPERS
// ═════════════════════════════════════════════════════════════

/**
 * Delete a single exam attempt from Firebase (both global and user-scoped nodes)
 */
export async function deleteExamAttemptFromOnlineDB(
  userId: string,
  attemptId: string
): Promise<{ success: boolean; message: string }> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) {
    return { success: false, message: 'Cloud DB chưa được kích hoạt' };
  }

  try {
    const updates: Record<string, null> = {
      [`rooms/${settings.roomCode}/examAttempts/${attemptId}`]: null,
      [`rooms/${settings.roomCode}/students/${userId}/userData/examAttemptsMap/${attemptId}`]: null,
    };
    await update(ref(database), updates as any);
    return { success: true, message: 'Đã xóa lịch sử làm bài trên DB' };
  } catch (err: any) {
    console.error('Firebase deleteExamAttempt error:', err);
    return { success: false, message: err.message || 'Lỗi xóa lịch sử làm bài' };
  }
}

/**
 * Delete all data for a student from Firebase (used when removing a student account)
 */
export async function deleteStudentFromOnlineDB(userId: string): Promise<boolean> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) return false;
  try {
    const dbRef = ref(database, `rooms/${settings.roomCode}/students/${userId}`);
    await remove(dbRef);
    return true;
  } catch (err) {
    console.error('Failed to delete student from online DB:', err);
    return false;
  }
}

/**
 * Reset student data on DB to clean blank state
 */
export async function clearOnlineStudentData(userId: string): Promise<boolean> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) return false;

  try {
    const emptyUserData = {
      examAttempts: [],
      practiceSessions: [],
      mistakes: {},
      bookmarks: [],
      customExams: [],
    };
    const dbRef = ref(database, `rooms/${settings.roomCode}/students/${userId}/userData`);
    await set(dbRef, emptyUserData);
    return true;
  } catch (err) {
    console.error('Failed to clear online student data:', err);
    return false;
  }
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

/**
 * Save a deleted ID (exam or question) to Firebase so all devices synchronize deletions
 */
export async function syncDeletedIdToOnlineDB(type: 'exam' | 'question', id: string): Promise<void> {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) return;
  try {
    const delRef = ref(database, `rooms/${settings.roomCode}/deleted/${type}s/${id}`);
    await set(delRef, { deletedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('syncDeletedIdToOnlineDB error:', err);
  }
}

/**
 * Subscribe to deleted exam and question IDs from Firebase Realtime DB
 */
export function subscribeToDeletedIdsFromOnlineDB(
  callback: (data: { deletedExamIds: string[]; deletedQuestionIds: string[] }) => void
): () => void {
  const settings = getCloudDBSettings();
  if (!settings.enabled || !settings.roomCode) return () => {};

  const delRef = ref(database, `rooms/${settings.roomCode}/deleted`);
  const handler = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val() || {};
      const deletedExamIds = val.exams ? Object.keys(val.exams) : [];
      const deletedQuestionIds = val.questions ? Object.keys(val.questions) : [];
      callback({ deletedExamIds, deletedQuestionIds });
    } else {
      callback({ deletedExamIds: [], deletedQuestionIds: [] });
    }
  };

  onValue(delRef, handler);
  return () => off(delRef, 'value', handler);
}

