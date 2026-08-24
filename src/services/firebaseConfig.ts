import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, push, remove, update, off, onChildAdded, query, limitToLast } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCQ6RQv4bH038jJBUWUF-rkwR4Z-P3iXoQ",
  authDomain: "hoanghaassitant.firebaseapp.com",
  databaseURL: "https://hoanghaassitant-default-rtdb.firebaseio.com",
  projectId: "hoanghaassitant",
  storageBucket: "hoanghaassitant.firebasestorage.app",
  messagingSenderId: "44671692125",
  appId: "1:44671692125:web:b4a747cb2aa43af7b10cb4",
  measurementId: "G-T0CJBLHFJF"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, get, onValue, push, remove, update, off, onChildAdded, query, limitToLast };
export default app;
