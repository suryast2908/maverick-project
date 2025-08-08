
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "falcons-mavericks-platform.firebaseapp.com",
  databaseURL: "https://falcons-mavericks-platform-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "falcons-mavericks-platform",
  storageBucket: "falcons-mavericks-platform.firebasestorage.app",
  messagingSenderId: "1015671640270",
  appId: "1:1015671640270:web:c722be23dc3686900f409f",
  measurementId: "G-LYEK0F12ZB"
};

// Initialize Firebase, preventing re-initialization
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();
const googleProvider = new firebase.auth.GoogleAuthProvider();
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

// Initialize Analytics if not in a server environment
let analytics;
if (typeof window !== 'undefined') {
    try {
        analytics = firebase.analytics();
    } catch (e) {
        console.error("Failed to initialize Firebase analytics", e);
    }
}

// Export for use in components
export { auth, firestore, storage, googleProvider, analytics, serverTimestamp };