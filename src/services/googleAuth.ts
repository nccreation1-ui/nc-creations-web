import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import { app } from './firebase';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

// Memory-only access token cache (Strict security constraint: never stored in localStorage)
let cachedAccessToken: string | null = null;
let currentUser: User | null = null;
let isSigningIn = false;

const authSubscribers: Array<(user: User | null, token: string | null) => void> = [];

export const subscribeToAuth = (callback: (user: User | null, token: string | null) => void) => {
  authSubscribers.push(callback);
  callback(currentUser, cachedAccessToken);
  return () => {
    const idx = authSubscribers.indexOf(callback);
    if (idx !== -1) authSubscribers.splice(idx, 1);
  };
};

function notifySubscribers() {
  authSubscribers.forEach(cb => {
    try {
      cb(currentUser, cachedAccessToken);
    } catch (e) {
      console.error('Auth subscriber callback error', e);
    }
  });
}

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    currentUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        notifySubscribers();
      } else if (!isSigningIn) {
        // User is known in Firebase Auth but access token needs popup refresh
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
        notifySubscribers();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
      notifySubscribers();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Google Workspace access token');
    }

    cachedAccessToken = credential.accessToken;
    currentUser = result.user;
    notifySubscribers();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Workspace Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentUser = (): User | null => {
  return currentUser;
};

export const isGoogleAuthenticated = (): boolean => {
  return Boolean(currentUser && cachedAccessToken);
};

export const logoutGoogle = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('SignOut error', err);
  } finally {
    cachedAccessToken = null;
    currentUser = null;
    notifySubscribers();
  }
};
