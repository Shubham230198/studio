
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
// import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'; // Auth imports removed

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
}


let app: FirebaseApp | undefined; // App can be undefined if config is missing
if (!getApps().length) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) { // Only initialize if core config is present
    app = initializeApp(firebaseConfig);
  } else {
    console.error("Firebase app not initialized due to missing configuration.");
  }
} else {
  app = getApps()[0];
}

// Auth related exports are removed
// const auth: Auth = getAuth(app);
// const googleProvider = new GoogleAuthProvider();

// export { app, auth, googleProvider };
export { app }; // Export only the app instance for potential other Firebase services
