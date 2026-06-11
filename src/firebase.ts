import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json';

// User keys configuration template - keeping this placeholder block ready for user keys!
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE"
};

// For optimal preview experience in AI Studio without blocking local runs, fallback to applet configuration when keys are placeholders:
const activeConfig = firebaseConfig.apiKey === "PASTE_YOUR_API_KEY_HERE"
  ? appletConfig
  : firebaseConfig;

// Initialize Firebase App
const app = initializeApp(activeConfig);

// Initialize Firebase Core services
export const auth = getAuth(app);
export const db = getFirestore(app, (activeConfig as any).firestoreDatabaseId);

// Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Enforce standard popup login for optimal iframe experience
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Core Sign In Error:', error);
    throw error;
  }
};

// Email/Password sign up helper
export const registerWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    return result.user;
  } catch (error) {
    console.error('Email Registration Error:', error);
    throw error;
  }
};

// Email/Password login helper
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Email Login Error:', error);
    throw error;
  }
};

// Log Out Helper
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Exception:', error);
    throw error;
  }
};

// Standard error logging handler for Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.error('[Firestore Permission/Security failure]: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// System test connection on initial boot (Lazy testing)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection test completed successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    }
  }
}
testConnection();
