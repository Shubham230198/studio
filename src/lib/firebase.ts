
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate essential Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const errorMessage = "Firebase API Key or Project ID is missing. Please check your .env.local file and Firebase project configuration. Ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set.";
  console.error(errorMessage);
  // For client-side, throwing an error here might be too disruptive.
  // Consider a state management solution to display this error gracefully in the UI.
  // For now, we'll log it and proceed, Firebase initialization will likely fail more explicitly later.
  // throw new Error(errorMessage); 
}


let app: FirebaseApp;
if (!getApps().length) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) { // Only initialize if core config is present
    app = initializeApp(firebaseConfig);
  } else {
    // Avoid initializing if core config is missing, rely on console error.
    // Or, set 'app' to a state that indicates an error.
    // For simplicity here, we just don't initialize which will cause later Firebase calls to fail.
    console.error("Firebase app not initialized due to missing configuration.");
  }
} else {
  app = getApps()[0];
}

// @ts-ignore: app might not be initialized if config is missing
const auth: Auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
