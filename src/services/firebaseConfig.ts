import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, push, remove, update, off, onChildAdded, query, limitToLast } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB9VUEjqhvtYGXVsovCwCQ6mnsz9d0MJlw",
  authDomain: "grade-practice-752f9.firebaseapp.com",
  databaseURL: "https://grade-practice-752f9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "grade-practice-752f9",
  storageBucket: "grade-practice-752f9.firebasestorage.app",
  messagingSenderId: "489760512358",
  appId: "1:489760512358:web:df86768037cd9069a650a7",
  measurementId: "G-6TBVZ6ZWE8"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, get, onValue, push, remove, update, off, onChildAdded, query, limitToLast };
export default app;
