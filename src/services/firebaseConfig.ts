import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, push, remove, update, off, onChildAdded, query, limitToLast } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCQ6RQv4bH038jJBUWUF-rkwR4Z-P3iXoQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hoanghaassitant.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://hoanghaassitant-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hoanghaassitant",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hoanghaassitant.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "44671692125",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:44671692125:web:b4a747cb2aa43af7b10cb4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-T0CJBLHFJF"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, get, onValue, push, remove, update, off, onChildAdded, query, limitToLast };
export default app;
