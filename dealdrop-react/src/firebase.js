import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDEWiFeBiiXflPa7ADL6ijQ7NcMubIZScQ",
  authDomain: "dealdrop-16ea7.firebaseapp.com",
  projectId: "dealdrop-16ea7",
  storageBucket: "dealdrop-16ea7.firebasestorage.app",
  messagingSenderId: "482243986322",
  appId: "1:482243986322:web:7f74b0dcfa5cf5222fb74b",
  measurementId: "G-TTK180DJD5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
