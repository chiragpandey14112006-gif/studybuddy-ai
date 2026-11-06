/**
 * Firebase Modular v10 Service with Zero-Latency Local Storage Mirroring
 *
 * Supports Google Auth, Anonymous Guest Auth, and Firestore persistence.
 * If Firebase credentials are not provided, operates transparently in Local Mode.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { storageService } from './storageService';

let app = null;
let auth = null;
let db = null;
let googleProvider = null;
let isInitialized = false;

/**
 * Reads Firebase configuration from environment or localStorage
 */
function resolveFirebaseConfig() {
  const localConfig = storageService.getConfig().firebaseConfig || {};
  
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  const finalConfig = {
    apiKey: localConfig.apiKey?.trim() || envConfig.apiKey?.trim() || '',
    authDomain: localConfig.authDomain?.trim() || envConfig.authDomain?.trim() || '',
    projectId: localConfig.projectId?.trim() || envConfig.projectId?.trim() || '',
    storageBucket: localConfig.storageBucket?.trim() || envConfig.storageBucket?.trim() || '',
    messagingSenderId: localConfig.messagingSenderId?.trim() || envConfig.messagingSenderId?.trim() || '',
    appId: localConfig.appId?.trim() || envConfig.appId?.trim() || ''
  };

  const isValid = Boolean(finalConfig.apiKey && finalConfig.projectId && finalConfig.appId);
  return { config: finalConfig, isValid };
}

/**
 * Initializes Firebase SDK if valid configuration exists
 */
export function initFirebase() {
  const { config, isValid } = resolveFirebaseConfig();

  if (!isValid) {
    console.info('[Firebase Service] No full Firebase credentials detected. Operating in Local Resilient Mode.');
    isInitialized = false;
    return false;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }

    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    isInitialized = true;
    console.info('[Firebase Service] Firebase v10 Modular SDK initialized successfully.');
    return true;
  } catch (err) {
    console.warn('[Firebase Service] Failed to initialize Firebase:', err.message);
    isInitialized = false;
    return false;
  }
}

/**
 * Subscribes to Auth State Changes
 */
export function onAuthChange(callback) {
  if (!isInitialized && !initFirebase()) {
    // Deliver default Guest User representation
    callback({
      uid: 'guest-local-user',
      isAnonymous: true,
      displayName: 'Guest Student',
      email: null,
      photoURL: null,
      isLocalOnly: true
    });
    return () => {};
  }

  return onAuthStateChanged(auth, user => {
    if (user) {
      callback({
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        displayName: user.displayName || (user.isAnonymous ? 'Guest Explorer' : 'Active Scholar'),
        email: user.email,
        photoURL: user.photoURL,
        isLocalOnly: false
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Sign in Anonymously
 */
export async function loginAnonymously() {
  if (!isInitialized && !initFirebase()) {
    return {
      success: true,
      user: {
        uid: 'guest-local-user',
        isAnonymous: true,
        displayName: 'Guest Student (Local Vault)',
        isLocalOnly: true
      }
    };
  }

  try {
    const cred = await signInAnonymously(auth);
    return { success: true, user: cred.user };
  } catch (err) {
    console.warn('[Firebase Auth] Anonymous sign-in error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle() {
  if (!isInitialized && !initFirebase()) {
    return {
      success: false,
      error: 'Firebase is not configured. Add your Firebase credentials in the Settings Drawer to enable Google Sign-In.'
    };
  }

  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return { success: true, user: cred.user };
  } catch (err) {
    console.error('[Firebase Auth] Google Sign-in error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sign Out
 */
export async function logoutUser() {
  if (auth) {
    try {
      await fbSignOut(auth);
      return { success: true };
    } catch (err) {
      console.warn('[Firebase Auth] Sign out error:', err.message);
      return { success: false, error: err.message };
    }
  }
  return { success: true };
}

/**
 * Sync Quiz Attempt to Firestore and LocalStorage
 */
export async function syncQuizAttempt(attemptData, currentUser) {
  // Always write immediately to LocalStorage for zero latency
  const savedLocal = storageService.saveAttempt(attemptData);

  // If Firebase is initialized and user is connected, persist to Firestore
  if (isInitialized && db && currentUser && !currentUser.isLocalOnly) {
    try {
      const uid = currentUser.uid;
      const attemptDocRef = doc(db, `users/${uid}/attempts`, savedLocal.id);
      
      const firestorePayload = {
        id: savedLocal.id,
        userId: uid,
        topic: savedLocal.topic,
        difficulty: savedLocal.difficulty,
        score: savedLocal.score,
        totalQuestions: savedLocal.totalQuestions,
        percentage: savedLocal.percentage,
        durationSeconds: savedLocal.durationSeconds,
        timestamp: savedLocal.timestamp,
        userAnswers: savedLocal.userAnswers || []
      };

      await setDoc(attemptDocRef, firestorePayload, { merge: true });
      console.info(`[Firebase Firestore] Attempt ${savedLocal.id} synchronized to cloud.`);
    } catch (cloudErr) {
      console.warn('[Firebase Firestore] Cloud sync failed, local attempt is intact:', cloudErr.message);
    }
  }

  return savedLocal;
}

/**
 * Fetch Past Attempts from Firestore (or LocalStorage fallback)
 */
export async function fetchAttempts(currentUser) {
  const localAttempts = storageService.getAttempts();

  if (!isInitialized || !db || !currentUser || currentUser.isLocalOnly) {
    return localAttempts;
  }

  try {
    const uid = currentUser.uid;
    const q = query(
      collection(db, `users/${uid}/attempts`),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const remoteAttempts = [];
    snapshot.forEach(docSnap => {
      remoteAttempts.push(docSnap.data());
    });

    if (remoteAttempts.length > 0) {
      // Merge unique attempts
      const idMap = new Map();
      [...remoteAttempts, ...localAttempts].forEach(item => {
        if (!idMap.has(item.id)) {
          idMap.set(item.id, item);
        }
      });
      return Array.from(idMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
  } catch (err) {
    console.warn('[Firebase Firestore] Failed fetching remote attempts, using local:', err.message);
  }

  return localAttempts;
}

export function getFirebaseStatus() {
  const { isValid } = resolveFirebaseConfig();
  return {
    isConfigured: isValid,
    isLive: isInitialized && auth !== null
  };
}

