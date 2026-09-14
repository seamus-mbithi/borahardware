// Central Firebase configuration for Bora Hardware
// Pre-configured with the unified Google Cloud Firestore database so that
// any deployment environment (Vercel, GitHub, Cloud Run, custom domain, or local dev)
// automatically connects all customer devices and admin panels to the SAME database.

export const FIREBASE_APPLET_CONFIG = {
  projectId: "gen-lang-client-0181068925",
  appId: "1:417476244140:web:47ff1b3c66762e8b622509",
  apiKey: "AIzaSyD2IAoWq7X9NtN8hMrS4MAcG2hC1G67LeM",
  authDomain: "gen-lang-client-0181068925.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-borahardware-3d716608-2df8-451e-9db6-778085ae3da2",
  storageBucket: "gen-lang-client-0181068925.firebasestorage.app",
  messagingSenderId: "417476244140",
  measurementId: "",
  oAuthClientId: "417476244140-ickg6edrtuu31faebj1l1bjbbuf8l0jm.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

export default FIREBASE_APPLET_CONFIG;
